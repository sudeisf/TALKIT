from django.db.models import Count, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ChatMessage, ChatSession
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


class ChatSessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search_query = (request.query_params.get('q') or '').strip()
        user_role = getattr(request.user, 'role', None)

        # Private sessions: filter by role
        if user_role == 'learner':
            base_filter = Q(question__asked_by=request.user)
        elif user_role == 'helper':
            base_filter = Q(participants=request.user)
        else:
            # Fallback for users without role
            base_filter = Q(participants=request.user) | Q(question__asked_by=request.user)

        sessions = (
            ChatSession.objects.select_related('question', 'question__asked_by')
            .prefetch_related('question__tags', 'messages')
            .filter(base_filter)
            .annotate(participant_count=Count('participants', distinct=True))
            .order_by('-updated_at')
            .distinct()
        )

        if search_query:
            sessions = sessions.filter(
                Q(question__title__icontains=search_query)
                | Q(question__description__icontains=search_query)
                | Q(question__tags__name__icontains=search_query)
                | Q(messages__message_content__icontains=search_query)
            ).distinct()

        data = []
        for session in sessions:
            asked_by = session.question.asked_by
            last_message_obj = session.messages.order_by('-created_at').first()
            data.append(
                {
                    'session_id': session.id,
                    'question_id': session.question_id,
                    'title': session.question.title,
                    'description': session.question.description,
                    'status': session.question.status,
                    'tags': list(session.question.tags.values_list('name', flat=True)),
                    'asked_by': {
                        'id': asked_by.id if asked_by else None,
                        'username': asked_by.username if asked_by else None,
                        'first_name': asked_by.first_name if asked_by else None,
                        'last_name': asked_by.last_name if asked_by else None,
                        'profile_image_url': _profile_image_url(asked_by),
                    },
                    'participant_count': session.participant_count,
                    'is_active': session.is_active,
                    'last_message': (
                        last_message_obj.message_content if last_message_obj else None
                    ),
                    'last_message_at': (
                        last_message_obj.created_at if last_message_obj else None
                    ),
                    'updated_at': session.updated_at,
                }
            )

        return Response(data, status=status.HTTP_200_OK)



class ChatSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        chat_session = (
            ChatSession.objects.select_related('question', 'question__asked_by')
            .prefetch_related('question__tags', 'participants', 'messages__sender')
            .filter(id=session_id, is_active=True)
            .first()
        )

        if not chat_session:
            return Response(
                {'error': 'Chat session not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        has_access = (
            chat_session.question.asked_by_id == request.user.id
            or chat_session.participants.filter(id=request.user.id).exists()
        )
        if not has_access:
            return Response(
                {'error': 'You do not have access to this chat session.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        participants = [
            {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_image_url': _profile_image_url(user),
                'role': user.role,
            }
            for user in chat_session.participants.all()
        ]

        asked_by = chat_session.question.asked_by
        if asked_by and not any(member['id'] == asked_by.id for member in participants):
            participants.insert(
                0,
                {
                    'id': asked_by.id,
                    'username': asked_by.username,
                    'first_name': asked_by.first_name,
                    'last_name': asked_by.last_name,
                    'profile_image_url': _profile_image_url(asked_by),
                    'role': asked_by.role,
                },
            )

        messages = [
            {
                'id': message.id,
                'message_content': message.message_content,
                'message_type': message.message_type,
                'code_snippet': message.code_snippet,
                'file_url': message.file.url if message.file else None,
                'created_at': message.created_at,
                'sender': {
                    'id': message.sender_id,
                    'username': message.sender.username,
                    'first_name': message.sender.first_name,
                    'last_name': message.sender.last_name,
                    'profile_image_url': _profile_image_url(message.sender),
                },
                'is_mine': message.sender_id == request.user.id,
            }
            for message in chat_session.messages.all().order_by('created_at')
        ]

        return Response(
            {
                'chat_session_id': chat_session.id,
                'current_user_id': request.user.id,
                'question_id': chat_session.question_id,
                'asked_by': {
                    'id': asked_by.id if asked_by else None,
                    'username': asked_by.username if asked_by else None,
                    'first_name': asked_by.first_name if asked_by else None,
                    'last_name': asked_by.last_name if asked_by else None,
                    'profile_image_url': _profile_image_url(asked_by),
                },
                'title': chat_session.question.title,
                'description': chat_session.question.description,
                'status': chat_session.question.status,
                'tags': list(chat_session.question.tags.values_list('name', flat=True)),
                'participants': participants,
                'messages': messages,
            },
            status=status.HTTP_200_OK,
        )


class ChatSessionMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        chat_session = (
            ChatSession.objects
            .select_related('question')
            .prefetch_related('participants', 'users_online')
            .filter(question_id=ticket_id, is_active=True)
            .first()
        )

        if not chat_session:
            return Response(
                {"error": "Chat session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        has_access = (
            chat_session.question.asked_by_id == request.user.id
            or chat_session.participants.filter(id=request.user.id).exists()
        )
        if not has_access:
            return Response(
                {"error": "You do not have access to this chat session."},
                status=status.HTTP_403_FORBIDDEN,
            )

        participants = [
            {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_image_url": _profile_image_url(user),
                "role": user.role,
            }
            for user in chat_session.participants.all()
        ]

        asked_by = chat_session.question.asked_by
        if asked_by and not any(member["id"] == asked_by.id for member in participants):
            participants.insert(
                0,
                {
                    "id": asked_by.id,
                    "username": asked_by.username,
                    "first_name": asked_by.first_name,
                    "last_name": asked_by.last_name,
                    "profile_image_url": _profile_image_url(asked_by),
                    "role": asked_by.role,
                },
            )

        online_user_ids = list(chat_session.users_online.values_list('id', flat=True))

        return Response(
            {
                "chat_session_id": chat_session.id,
                "question_id": chat_session.question_id,
                "participants": participants,
                "online_user_ids": online_user_ids,
            },
            status=status.HTTP_200_OK,
        )
