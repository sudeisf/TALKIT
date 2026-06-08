from warnings import filters

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.timesince import timesince
from django.conf import settings
from datetime import timedelta
import logging
import re
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from urllib3 import request
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import google.genai as genai

from .serializers import (
	ModifyQuestionDescriptionSerializer,
	ModifiedQuestionDescriptionResponseSerializer,
	LearnerDashboardStatsSerializer,
	MyQuestionListSerializer,
	HelperDashboardStatsSerializer,
	HelperSessionsChartSerializer,
	HelperContributionsSerializer,
	HelperProfileOverviewSerializer,
	QuestionSerializer,
)
from rest_framework import generics, permissions, status

from .models import Bookmark, Question, QuestionInvite, QuestionVote
from notifications.models import Notification
from chat.models import ChatMessage, ChatSession, MessageReaction
from .serializers import QuestionListSerializer
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from .filters import QuestionFilter


logger = logging.getLogger(__name__)


def _is_quota_error(error: Exception | None) -> bool:
	if not error:
		return False
	message = str(error).lower()
	return (
		"resource_exhausted" in message
		or "quota" in message
		or "429" in message
		or "rate limit" in message
	)


def _fallback_improve_description(description: str) -> str:
	cleaned = re.sub(r"\s+", " ", (description or "")).strip()
	if not cleaned:
		return ""

	if cleaned and cleaned[-1] not in ".!?":
		cleaned = f"{cleaned}."

	sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", cleaned) if part.strip()]

	if len(sentences) >= 3:
		issue = " ".join(sentences[:2]).strip()
		context = " ".join(sentences[2:]).strip()
		return (
			f"Issue: {issue}\n\n"
			f"Additional context: {context}\n\n"
			"Looking for practical optimization steps and best practices to improve performance."
		)

	return (
		f"Issue: {cleaned}\n\n"
		"I would like guidance on the most effective optimizations, including performance improvements and better project structure where relevant."
	)


class RecentActivityView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		from activities.models import UserActivity
		try:
			limit = int(request.query_params.get("limit", 10))
		except (TypeError, ValueError):
			limit = 10

		activities = (
			UserActivity.objects.filter(user=request.user)
			.select_related('content_type')
			.order_by("-created_at")[:limit]
		)

		now = timezone.now()
		data = []
		for act in activities:
			time_ago = timesince(act.created_at, now).split(",")[0] + " ago"
			data.append(
				{
					"id": act.id,
					"type": act.activity_type,
					"description": act.description,
					"timeAgo": time_ago,
					"objectId": act.object_id,
				}
			)

		# Fallback to questions if no UserActivity is found (for backward compatibility during migration)
		if not data:
			questions = (
				Question.objects.filter(
					Q(asked_by=request.user)
					| Q(invites__expert=request.user, invites__status='ACCEPTED')
					| Q(chat_session__participants=request.user)
					| Q(votes__user=request.user)
				)
				.annotate(answer_count=Count("chat_session__messages", distinct=True))
				.order_by("-updated_at")
				.distinct()[:limit]
			)

			for question in questions:
				time_ago = timesince(question.updated_at, now).split(",")[0] + " ago"
				data.append(
					{
						"id": question.id,
						"title": question.title,
						"type": "question_activity",
						"timeAgo": time_ago,
						"answerCount": question.answer_count,
						"upvotes": question.upvotes,
					}
				)

		return Response({"items": data})


class AcceptInvitation(APIView):
	def post(self, request, invite_id):
		invite = get_object_or_404(QuestionInvite, id=invite_id, expert=request.user)

		if invite.status != 'PENDING':
			return Response({"error": "Invite no longer valid"}, status=400)

		chat_session = invite.question.chat_session
		if chat_session.participants.count() >= chat_session.max_participants:
			return Response({"error": "Room is full!"}, status=400)

		invite.status = 'ACCEPTED'
		invite.save()

		Notification.objects.create(
			user=invite.question.asked_by,
			notification_type=Notification.NotificationType.HELPER_JOINED,
			title='A helper joined your question',
			message=f'{request.user.username} joined your question: "{invite.question.title}"',
			question=invite.question,
		)

		chat_session.participants.add(request.user)

		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f'chat_{invite.question.id}',
			{
				'type': 'chat_message',
				'message': f"{request.user.username} joined the session.",
				'sender_id': None,
				'is_system': True,
			},
		)

		return Response({"status": "joined", "session_id": chat_session.id})
	
class CreateQuestionView(generics.CreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]


class QuestionDetailView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, question_id):
        question = get_object_or_404(Question, id=question_id)
        has_access = (
            question.asked_by_id == request.user.id
            or ChatSession.objects.filter(question=question, participants=request.user).exists()
        )
        if not has_access:
            return Response({"error": "You do not have access to this question."}, status=403)
        return Response({
            "id": question.id,
            "title": question.title,
            "description": question.description,
            "tags": list(question.tags.values_list("name", flat=True)),
        })


class MyQuestionsListView(generics.ListAPIView):
	serializer_class = MyQuestionListSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return (
			Question.objects.filter(asked_by=self.request.user)
			.prefetch_related('tags')
			.order_by('-created_at')
		)


class ModifyQuestionDescriptionView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		serializer = ModifyQuestionDescriptionSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		description = serializer.validated_data["description"]

		api_key = getattr(settings, "GOOGLE_API_KEY", None)
		if not api_key:
			fallback_text = _fallback_improve_description(description)
			response_serializer = ModifiedQuestionDescriptionResponseSerializer(
				data={"improved_description": fallback_text}
			)
			response_serializer.is_valid(raise_exception=True)
			return Response(response_serializer.validated_data)

		try:
			client = genai.Client(api_key=api_key)
			prompt = (
				"You are an assistant that improves technical question descriptions. "
				"Rewrite the user's draft to be clearer, concise, and structured for helpers. "
				"Preserve original meaning and technical details. "
				"Output only the improved description without markdown fences or extra commentary.\n\n"
				f"Draft description:\n{description}"
			)

			model_names = [
				"gemini-1.5-flash",
				"gemini-1.5-flash-latest",
				"gemini-2.0-flash",
				"gemini-2.0-flash-lite",
			]

			improved_text = ""
			last_error = None

			for model_name in model_names:
				try:
					result = client.models.generate_content(
						model=model_name,
						contents=prompt,
					)
					improved_text = (getattr(result, "text", "") or "").strip()

					if improved_text:
						break
				except Exception as model_error:
					last_error = model_error
					continue

			if not improved_text:
				fallback_text = _fallback_improve_description(description)
				if _is_quota_error(last_error):
					logger.warning("Gemini quota exceeded. Using local description fallback.")
				else:
					logger.exception(
						"Gemini response empty or all model attempts failed; using fallback.",
						exc_info=last_error,
					)

				response_serializer = ModifiedQuestionDescriptionResponseSerializer(
					data={"improved_description": fallback_text}
				)
				response_serializer.is_valid(raise_exception=True)
				return Response(response_serializer.validated_data)

			response_serializer = ModifiedQuestionDescriptionResponseSerializer(
				data={"improved_description": improved_text}
			)
			response_serializer.is_valid(raise_exception=True)
			return Response(response_serializer.validated_data)

		except Exception as error:
			logger.exception("Failed to modify question description with AI, using fallback")
			fallback_text = _fallback_improve_description(description)
			response_serializer = ModifiedQuestionDescriptionResponseSerializer(
				data={"improved_description": fallback_text}
			)
			response_serializer.is_valid(raise_exception=True)
			return Response(response_serializer.validated_data)


class HelperDashboardStatsView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	@staticmethod
	def _percentage_change(current_value: float, previous_value: float) -> float:
		if previous_value == 0:
			return 100.0 if current_value > 0 else 0.0
		return round(((current_value - previous_value) / previous_value) * 100, 2)

	@staticmethod
	def _average_response_time_minutes(user, start=None, end=None) -> float:
		sessions = ChatSession.objects.filter(participants=user).select_related('question__asked_by').prefetch_related('messages')

		if start:
			sessions = sessions.filter(created_at__gte=start)
		if end:
			sessions = sessions.filter(created_at__lt=end)

		delays_in_seconds = []

		for session in sessions:
			messages = list(session.messages.all().order_by('created_at'))
			if not messages:
				continue

			learner_id = session.question.asked_by_id
			helper_reply_times = [m.created_at for m in messages if m.sender_id == user.id]
			if not helper_reply_times:
				continue

			reply_index = 0
			for message in messages:
				if message.sender_id != learner_id:
					continue

				while reply_index < len(helper_reply_times) and helper_reply_times[reply_index] <= message.created_at:
					reply_index += 1

				if reply_index < len(helper_reply_times):
					delay = (helper_reply_times[reply_index] - message.created_at).total_seconds()
					if delay >= 0:
						delays_in_seconds.append(delay)

		if not delays_in_seconds:
			return 0.0

		average_seconds = sum(delays_in_seconds) / len(delays_in_seconds)
		return round(average_seconds / 60, 2)

	def get(self, request):
		now = timezone.now()
		period_start = now - timedelta(days=30)
		previous_period_start = period_start - timedelta(days=30)

		questions_answered_current = QuestionInvite.objects.filter(
			expert=request.user,
			status='ACCEPTED',
			question__status__in=['answered', 'closed'],
			created_at__gte=period_start,
		).count()
		questions_answered_previous = QuestionInvite.objects.filter(
			expert=request.user,
			status='ACCEPTED',
			question__status__in=['answered', 'closed'],
			created_at__gte=previous_period_start,
			created_at__lt=period_start,
		).count()

		sessions_joined_current = ChatSession.objects.filter(
			participants=request.user,
			created_at__gte=period_start,
		).count()
		sessions_joined_previous = ChatSession.objects.filter(
			participants=request.user,
			created_at__gte=previous_period_start,
			created_at__lt=period_start,
		).count()

		avg_response_current = self._average_response_time_minutes(request.user, start=period_start)
		avg_response_previous = self._average_response_time_minutes(request.user, start=previous_period_start, end=period_start)

		feedback_rating_value = MessageReaction.objects.filter(message__sender=request.user).count()
		feedback_current = MessageReaction.objects.filter(
			message__sender=request.user,
			created_at__gte=period_start,
		).count()
		feedback_previous = MessageReaction.objects.filter(
			message__sender=request.user,
			created_at__gte=previous_period_start,
			created_at__lt=period_start,
		).count()

		payload = {
			'questions_answered': {
				'value': questions_answered_current,
				'change': self._percentage_change(questions_answered_current, questions_answered_previous),
			},
			'sessions_joined': {
				'value': sessions_joined_current,
				'change': self._percentage_change(sessions_joined_current, sessions_joined_previous),
			},
			'average_response_time': {
				'value': avg_response_current,
				'change': self._percentage_change(avg_response_current, avg_response_previous),
			},
			'feedback_rating': {
				'value': feedback_rating_value,
				'change': self._percentage_change(feedback_current, feedback_previous),
			},
		}

		serializer = HelperDashboardStatsSerializer(data=payload)
		serializer.is_valid(raise_exception=True)
		return Response(serializer.validated_data)


class LearnerDashboardStatsView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	@staticmethod
	def _percentage_change(current_value: float, previous_value: float) -> float:
		if previous_value == 0:
			return 100.0 if current_value > 0 else 0.0
		return round(((current_value - previous_value) / previous_value) * 100, 2)

	def get(self, request):
		now = timezone.now()
		period_start = now - timedelta(days=30)
		previous_period_start = period_start - timedelta(days=30)

		# 1) Questions Posted (total history + recent trend)
		questions_posted_value = Question.objects.filter(asked_by=request.user).count()
		questions_posted_current = Question.objects.filter(
			asked_by=request.user,
			created_at__gte=period_start,
		).count()
		questions_posted_previous = Question.objects.filter(
			asked_by=request.user,
			created_at__gte=previous_period_start,
			created_at__lt=period_start,
		).count()

		# 2) Problems Solved (model has answered/closed instead of resolved)
		solved_statuses = ['answered', 'closed']
		problems_solved_value = Question.objects.filter(
			asked_by=request.user,
			status__in=solved_statuses,
		).count()
		problems_solved_current = Question.objects.filter(
			asked_by=request.user,
			status__in=solved_statuses,
			updated_at__gte=period_start,
		).count()
		problems_solved_previous = Question.objects.filter(
			asked_by=request.user,
			status__in=solved_statuses,
			updated_at__gte=previous_period_start,
			updated_at__lt=period_start,
		).count()

		# 3) Active Sessions / Pending
		active_statuses = ['searching', 'ongoing']
		active_sessions_value = Question.objects.filter(
			asked_by=request.user,
			status__in=active_statuses,
		).count()
		active_sessions_current = Question.objects.filter(
			asked_by=request.user,
			status__in=active_statuses,
			updated_at__gte=period_start,
		).count()
		active_sessions_previous = Question.objects.filter(
			asked_by=request.user,
			status__in=active_statuses,
			updated_at__gte=previous_period_start,
			updated_at__lt=period_start,
		).count()

		# 4) Saved Summaries / Knowledge Bank
		saved_summaries_value = Bookmark.objects.filter(user=request.user).count()
		saved_summaries_current = Bookmark.objects.filter(
			user=request.user,
			created_at__gte=period_start,
		).count()
		saved_summaries_previous = Bookmark.objects.filter(
			user=request.user,
			created_at__gte=previous_period_start,
			created_at__lt=period_start,
		).count()

		payload = {
			'questions_posted': {
				'value': questions_posted_value,
				'change': self._percentage_change(
					questions_posted_current,
					questions_posted_previous,
				),
			},
			'problems_solved': {
				'value': problems_solved_value,
				'change': self._percentage_change(
					problems_solved_current,
					problems_solved_previous,
				),
			},
			'active_sessions': {
				'value': active_sessions_value,
				'change': self._percentage_change(
					active_sessions_current,
					active_sessions_previous,
				),
			},
			'saved_summaries': {
				'value': saved_summaries_value,
				'change': self._percentage_change(
					saved_summaries_current,
					saved_summaries_previous,
				),
			},
		}

		serializer = LearnerDashboardStatsSerializer(data=payload)
		serializer.is_valid(raise_exception=True)
		return Response(serializer.validated_data)


class HelperSessionsChartView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	@staticmethod
	def _month_start(date_value):
		return date_value.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

	def get(self, request):
		now = timezone.now()
		current_month_start = self._month_start(now)

		month_starts = []
		for index in range(5, -1, -1):
			reference = current_month_start - timedelta(days=32 * index)
			month_starts.append(self._month_start(reference))

		session_counts = []
		for month_start in month_starts:
			if month_start.month == 12:
				next_month = month_start.replace(year=month_start.year + 1, month=1)
			else:
				next_month = month_start.replace(month=month_start.month + 1)

			count = ChatSession.objects.filter(
				participants=request.user,
				created_at__gte=month_start,
				created_at__lt=next_month,
			).count()

			session_counts.append(
				{
					'month': month_start.strftime('%B'),
					'sessions': count,
				}
			)

		last_month_start = month_starts[-1]
		if last_month_start.month == 1:
			previous_month_start = last_month_start.replace(year=last_month_start.year - 1, month=12)
		else:
			previous_month_start = last_month_start.replace(month=last_month_start.month - 1)

		if last_month_start.month == 12:
			next_month_start = last_month_start.replace(year=last_month_start.year + 1, month=1)
		else:
			next_month_start = last_month_start.replace(month=last_month_start.month + 1)

		current_month_count = ChatSession.objects.filter(
			participants=request.user,
			created_at__gte=last_month_start,
			created_at__lt=next_month_start,
		).count()

		previous_month_count = ChatSession.objects.filter(
			participants=request.user,
			created_at__gte=previous_month_start,
			created_at__lt=last_month_start,
		).count()

		if previous_month_count == 0:
			trend_percentage = 100.0 if current_month_count > 0 else 0.0
		else:
			trend_percentage = round(
				((current_month_count - previous_month_count) / previous_month_count) * 100,
				2,
			)

		payload = {
			'period_label': f"{month_starts[0].strftime('%B')} - {month_starts[-1].strftime('%B %Y')}",
			'trend_percentage': trend_percentage,
			'sessions': session_counts,
		}

		serializer = HelperSessionsChartSerializer(data=payload)
		serializer.is_valid(raise_exception=True)
		return Response(serializer.validated_data)


class HelperContributionsView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		from chat.models import ChatMessage as ChatMessageModel

		start_date = timezone.datetime(2020, 1, 1, tzinfo=timezone.get_current_timezone())

		rows = (
			ChatMessageModel.objects.filter(sender=request.user, created_at__gte=start_date)
			.annotate(day=TruncDate('created_at'))
			.values('day')
			.annotate(count=Count('id'))
			.order_by('day')
		)

		items = [
			{
				'date': row['day'].strftime('%Y/%m/%d'),
				'count': row['count'],
			}
			for row in rows
		]

		serializer = HelperContributionsSerializer(data={'items': items})
		serializer.is_valid(raise_exception=True)
		return Response(serializer.validated_data)


class HelperProfileOverviewView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		helped_learners = (
			QuestionInvite.objects.filter(expert=request.user, status='ACCEPTED')
			.values('question__asked_by')
			.distinct()
			.count()
		)

		sessions_joined = ChatSession.objects.filter(participants=request.user).count()

		ongoing_sessions = ChatSession.objects.filter(
			participants=request.user,
			is_active=True,
			question__status='ongoing',
		).count()

		average_response_minutes = HelperDashboardStatsView._average_response_time_minutes(
			request.user
		)

		payload = {
			'helped_learners': helped_learners,
			'sessions_joined': sessions_joined,
			'ongoing_sessions': ongoing_sessions,
			'average_response_minutes': average_response_minutes,
		}

		serializer = HelperProfileOverviewSerializer(data=payload)
		serializer.is_valid(raise_exception=True)
		return Response(serializer.validated_data)

class JoinQuestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, question_id):
        question = get_object_or_404(Question, id=question_id)
        user = request.user

        # 1. Security Check: Was this user actually invited?
        # (Optional: Depending on how strict you want to be)
        invite = QuestionInvite.objects.filter(question=question, expert=user).first()
        if not invite:
            return Response({"error": "You were not invited."}, status=403)

        # 2. Get Chat Session
        session, created = ChatSession.objects.get_or_create(question=question)

        # 3. Check Capacity
        if session.participants.count() >= 2: # Limit to 2 experts + 1 learner
            return Response({"error": "Room is full."}, status=400)

        # 4. Add User to Session
        session.participants.add(user)
        
        # 5. Update Status
        if question.status == 'searching':
            question.status = 'ongoing'
            question.save()

        return Response({"message": "Joined successfully", "session_id": session.id})


class VoteQuestionView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, question_id):
		question = get_object_or_404(Question, id=question_id)
		vote_type = request.data.get('vote_type')

		if vote_type not in ['UP', 'DOWN']:
			return Response({"error": "Invalid vote type"}, status=status.HTTP_400_BAD_REQUEST)

		existing_vote = QuestionVote.objects.filter(
			user=request.user,
			question=question,
		).first()

		if existing_vote:
			if existing_vote.vote_type == vote_type:
				existing_vote.delete()
				message = "Vote removed"
			else:
				existing_vote.vote_type = vote_type
				existing_vote.save()
				message = "Vote switched"
		else:
			QuestionVote.objects.create(
				user=request.user,
				question=question,
				vote_type=vote_type,
			)
			message = "Voted successfully"

		upvotes_count = QuestionVote.objects.filter(question=question, vote_type='UP').count()
		downvotes_count = QuestionVote.objects.filter(question=question, vote_type='DOWN').count()
		Question.objects.filter(id=question.id).update(
			upvotes=upvotes_count,
			downvotes=downvotes_count,
		)

		my_vote = QuestionVote.objects.filter(
			user=request.user,
			question=question,
		).values_list('vote_type', flat=True).first()

		return Response(
			{
				"message": message,
				"upvotes": upvotes_count,
				"downvotes": downvotes_count,
				"my_vote": my_vote,
			},
			status=status.HTTP_200_OK,
		)

class ToggleBookmarkView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, question_id):
		question = get_object_or_404(Question, id=question_id)
		bookmark = Bookmark.objects.filter(user=request.user, question=question).first()

		if bookmark:
			bookmark.delete()
			return Response({"is_favorite": False}, status=status.HTTP_200_OK)

		Bookmark.objects.create(user=request.user, question=question)
		return Response({"is_favorite": True}, status=status.HTTP_200_OK)

class BookmarksListView(generics.ListAPIView):
	serializer_class = QuestionListSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return (
			Question.objects.filter(bookmarks__user=self.request.user)
			.select_related('asked_by')
			.prefetch_related('tags', 'chat_session__participants')
			.order_by('-bookmarks__created_at')
		)
    
class PublicQuestionListView(generics.ListAPIView):
    queryset = (
        Question.objects
        .select_related('asked_by')
        .prefetch_related('tags', 'chat_session__participants')
        .order_by('-created_at')
    )
    serializer_class = QuestionListSerializer
    permission_classes = [permissions.AllowAny]

    # 1. Activate the Backends
    filter_backends = [
        DjangoFilterBackend, # Handles Tags & Dates
        filters.SearchFilter, # Handles Text Search (Title/Desc)
        filters.OrderingFilter # Handles Sorting
    ]

    # 2. Connect the Custom Filter Class
    filterset_class = QuestionFilter

    # 3. Configure Text Search
    search_fields = ['title', 'description']
    
    # 4. Configure Sorting
    ordering_fields = ['created_at', 'bounty_points']
