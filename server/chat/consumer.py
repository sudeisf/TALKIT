import json
import base64
import binascii
import uuid

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.files.base import ContentFile

# Make sure these imports match your actual app name
from .models import ChatMessage, ChatSession, MessageReaction
from cloudinary.utils import cloudinary_url


def _profile_image_url(user):
    if not user:
        return None
    image_field = getattr(user, "profile_image", None)
    public_id = getattr(image_field, "public_id", None)
    if public_id:
        secure_url, _ = cloudinary_url(public_id, secure=True)
        return secure_url
    # CloudinaryField can expose a direct URL even when public_id isn't set.
    direct_url = getattr(image_field, "url", None)
    return direct_url or None


class ChatConsumer(AsyncWebsocketConsumer):
    ALLOWED_MESSAGE_TYPES = {'text', 'code', 'audio', 'voice', 'image', 'link', 'document', 'other'}

    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or self.user.is_anonymous:
            await self.close(code=4401)
            return

        self.ticket_id = self.scope['url_route']['kwargs'].get('ticket_id')
        
        # FIX 1: Robust session retrieval (handles UUID or Int)
        self.chat_session = await self._get_chat_session(self.ticket_id)

        if not self.chat_session:
            await self.close(code=4404)
            return

        has_access = await self._user_has_access(self.user.id, self.chat_session.id)
        if not has_access:
            await self.close(code=4403)
            return

        # FIX: Ensure question_id is a string for the group name
        self.room_group_name = f"chat_{self.chat_session.question_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self._set_user_online(self.chat_session.id, self.user.id, True)
        await self._broadcast_presence('joined')

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        # FIX 2: Safety check. If connection failed early, chat_session might not exist.
        chat_session = getattr(self, 'chat_session', None)
        if chat_session and self.user and not self.user.is_anonymous:
            await self._set_user_online(chat_session.id, self.user.id, False)
            await self._set_user_typing(chat_session.id, self.user.id, False)
            await self._broadcast_presence('left')

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'Invalid JSON payload.'}))
            return

        event_type = payload.get('type', 'message')
        if event_type == 'typing':
            is_typing = bool(payload.get('is_typing', False))
            await self._set_user_typing(self.chat_session.id, self.user.id, is_typing)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_event',
                    'sender_id': self.user.id,
                    'username': self.user.username,
                    'is_typing': is_typing,
                },
            )
            return

        if event_type == 'emoji_reaction':
            emoji = (payload.get('emoji') or '').strip()
            message_id = payload.get('message_id')
            if not emoji or message_id is None:
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'emoji and message_id required.'}))
                return

            reaction_data = await self._upsert_reaction(
                chat_session_id=self.chat_session.id,
                message_id=message_id,
                user_id=self.user.id,
                emoji=emoji,
            )

            if not reaction_data:
                await self.send(text_data=json.dumps({'type': 'error', 'message': 'Message not found.'}))
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'emoji_reaction_event',
                    'message_id': reaction_data['message_id'],
                    'emoji': reaction_data['emoji'],
                    'sender_id': self.user.id,
                    'username': self.user.username,
                },
            )
            return

        message = (payload.get('message') or '').strip()
        message_type = self._normalize_message_type(payload.get('message_type'))
        
        if message_type not in self.ALLOWED_MESSAGE_TYPES:
            await self.send(text_data=json.dumps({'type': 'error', 'message': f'Unsupported type: {message_type}'}))
            return

        code_snippet = payload.get('code_snippet')
        audio_base64 = payload.get('audio_base64')
        file_name = payload.get('file_name')

        # Validation
        if message_type == 'code' and not code_snippet:
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'code_snippet missing.'}))
            return
        if message_type in {'audio', 'voice'} and not audio_base64:
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'audio_base64 missing.'}))
            return
        if message_type not in {'code', 'audio', 'voice'} and not message:
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'Message cannot be empty.'}))
            return

        created_message = await self._create_message(
            chat_session_id=self.chat_session.id,
            sender_id=self.user.id,
            message=message,
            message_type=message_type,
            code_snippet=code_snippet,
            audio_base64=audio_base64,
            file_name=file_name,
        )

        if not created_message:
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'Could not save message.'}))
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': created_message['id'],
                'message': created_message['message_content'],
                'sender_id': self.user.id,
                'username': self.user.username,
                'sender_avatar_url': _profile_image_url(self.user),
                'message_type': created_message['message_type'],
                'code_snippet': created_message['code_snippet'],
                'file_url': created_message['file_url'],
                'file_name': created_message['file_name'],
                'created_at': created_message['created_at'],
                'is_system': False,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message_id': event.get('message_id'),
            'message': event.get('message', ''),
            'sender_id': event.get('sender_id'),
            'username': event.get('username'),
            'sender_avatar_url': event.get('sender_avatar_url'),
            'message_type': event.get('message_type', 'text'),
            'code_snippet': event.get('code_snippet'),
            'file_url': event.get('file_url'),
            'file_name': event.get('file_name'),
            'created_at': event.get('created_at'),
            'is_system': bool(event.get('is_system', False)),
        }))

    async def emoji_reaction_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'emoji_reaction',
            'message_id': event.get('message_id'),
            'emoji': event.get('emoji'),
            'sender_id': event.get('sender_id'),
            'username': event.get('username'),
        }))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'sender_id': event.get('sender_id'),
            'username': event.get('username'),
            'is_typing': bool(event.get('is_typing', False)),
        }))

    async def presence_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'sender_id': event.get('sender_id'),
            'username': event.get('username'),
            'status': event.get('status'),
            'online_user_ids': event.get('online_user_ids', []),
        }))

    async def _broadcast_presence(self, status):
        online_user_ids = await self._get_online_user_ids(self.chat_session.id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_event',
                'sender_id': self.user.id,
                'username': self.user.username,
                'status': status,
                'online_user_ids': online_user_ids,
            },
        )

    def _normalize_message_type(self, raw_message_type):
        message_type = (raw_message_type or 'text').strip().lower()
        if message_type == 'emoji':
            return 'text'
        return message_type

    @database_sync_to_async
    def _get_chat_session(self, ticket_id):
        if not ticket_id:
            return None
        return (
            ChatSession.objects.select_related('question')
            .filter(question__id=ticket_id, is_active=True)
            .first()
        )

    @database_sync_to_async
    def _user_has_access(self, user_id, chat_session_id):
        session = ChatSession.objects.select_related('question').filter(id=chat_session_id).first()
        if not session:
            return False
        if session.question.asked_by_id == user_id:
            return True
        return session.participants.filter(id=user_id).exists()

    @database_sync_to_async
    def _set_user_online(self, chat_session_id, user_id, is_online):
        session = ChatSession.objects.filter(id=chat_session_id).first()
        if session:
            if is_online:
                session.users_online.add(user_id)
            else:
                session.users_online.remove(user_id)

    @database_sync_to_async
    def _set_user_typing(self, chat_session_id, user_id, is_typing):
        session = ChatSession.objects.filter(id=chat_session_id).first()
        if session:
            if is_typing:
                session.users_typing.add(user_id)
            else:
                session.users_typing.remove(user_id)

    @database_sync_to_async
    def _get_online_user_ids(self, chat_session_id):
        session = ChatSession.objects.filter(id=chat_session_id).first()
        if not session:
            return []
        return list(session.users_online.values_list('id', flat=True))

    @database_sync_to_async
    def _create_message(self, chat_session_id, sender_id, message, message_type, code_snippet, audio_base64, file_name):
        created_message = ChatMessage(
            chat_session_id=chat_session_id,
            sender_id=sender_id,
            message_content=message or '',
            message_type=message_type,
            code_snippet=code_snippet,
        )

        if message_type in {'audio', 'voice'} and audio_base64:
            decoded_audio = self._decode_base64_file(audio_base64)
            if decoded_audio:
                safe_name = file_name or f"voice-{uuid.uuid4().hex}.webm"
                # FIX 3: Ensure we actually save the file field
                created_message.file.save(safe_name, ContentFile(decoded_audio), save=True)
                created_message.file_name = safe_name

        created_message.save()

        # FIX 3: Safe URL access
        file_url = None
        if created_message.file:
            try:
                file_url = created_message.file.url
            except ValueError:
                file_url = None

        return {
            'id': created_message.id,
            'message_content': created_message.message_content,
            'message_type': created_message.message_type,
            'code_snippet': created_message.code_snippet,
            'file_url': file_url,
            'file_name': created_message.file_name,
            'created_at': created_message.created_at.isoformat(),
        }

    def _decode_base64_file(self, encoded_data):
        try:
            payload = encoded_data.split(',', 1)[1] if ',' in encoded_data else encoded_data
            return base64.b64decode(payload)
        except (ValueError, binascii.Error):
            return None

    @database_sync_to_async
    def _upsert_reaction(self, chat_session_id, message_id, user_id, emoji):
        try:
            message_id = int(message_id)
        except (TypeError, ValueError):
            return None
            
        message = ChatMessage.objects.filter(id=message_id, chat_session_id=chat_session_id).first()
        if not message:
            return None

        reaction, _ = MessageReaction.objects.update_or_create(
            user_id=user_id,
            message=message,
            defaults={'emoji': emoji},
        )
        return {'message_id': message.id, 'emoji': reaction.emoji}
