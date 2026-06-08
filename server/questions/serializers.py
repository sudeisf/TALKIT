from rest_framework import serializers
from .models import Question, QuestionVote
from users.models import Tag  # Assuming you have a Tag model
from notifications.models import Notification
from celery import chain
from cloudinary.utils import cloudinary_url


def _profile_image_url(user):
    if not user:
        return None
    image_field = getattr(user, "profile_image", None)
    public_id = getattr(image_field, "public_id", None)
    if public_id:
        secure_url, _ = cloudinary_url(public_id, secure=True)
        return secure_url
    return getattr(image_field, "url", None) or None

class QuestionSerializer(serializers.ModelSerializer):
   
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50), 
        write_only=True
    )
    my_vote = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'title', 'description', 'tags', 'created_at', 'upvotes', 'downvotes', 'my_vote'] 
        
    def get_my_vote(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            try:
                vote = obj.votes.get(user=user)
                return vote.vote_type 
            except QuestionVote.DoesNotExist:
                return None
        return None

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        user = self.context['request'].user
        
      
        question = Question.objects.create(asked_by=user, **validated_data)
        
        # 2. Handle Tags (Create if new, Get if exists)
        for tag_name in tags_data:
            tag, created = Tag.objects.get_or_create(name=tag_name.lower())
            question.tags.add(tag) 

        Notification.objects.create(
            user=user,
            notification_type=Notification.NotificationType.QUESTION_ANNOUNCEMENT,
            title='Question posted successfully',
            message=f'Your question "{question.title}" is now being matched with helpers.',
            question=question,
        )

        from .tasks import find_and_invite_experts, vectorize_question

        chain(
            vectorize_question.s(question.id),
            find_and_invite_experts.s(),
        ).delay()
            
        return question


class ModifyQuestionDescriptionSerializer(serializers.Serializer):
    description = serializers.CharField(min_length=10, max_length=3000)


class ModifiedQuestionDescriptionResponseSerializer(serializers.Serializer):
    improved_description = serializers.CharField()


class MyQuestionListSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()
    my_vote = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id',
            'title',
            'description',
            'tags',
            'status',
            'created_at',
            'updated_at',
            'upvotes',
            'downvotes',
            'my_vote',
            'is_bookmarked',
        ]

    def get_tags(self, obj):
        return list(obj.tags.values_list('name', flat=True))

    def get_my_vote(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            try:
                vote = obj.votes.get(user=user)
                return vote.vote_type
            except QuestionVote.DoesNotExist:
                return None
        return None

    def get_is_bookmarked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.bookmarks.filter(user=user).exists()
        return False


class DashboardMetricSerializer(serializers.Serializer):
    value = serializers.FloatField()
    change = serializers.FloatField()


class HelperDashboardStatsSerializer(serializers.Serializer):
    questions_answered = DashboardMetricSerializer()
    sessions_joined = DashboardMetricSerializer()
    average_response_time = DashboardMetricSerializer()
    feedback_rating = DashboardMetricSerializer()


class LearnerDashboardStatsSerializer(serializers.Serializer):
    questions_posted = DashboardMetricSerializer()
    problems_solved = DashboardMetricSerializer()
    active_sessions = DashboardMetricSerializer()
    saved_summaries = DashboardMetricSerializer()


class HelperMonthlySessionSerializer(serializers.Serializer):
    month = serializers.CharField()
    sessions = serializers.IntegerField()


class HelperSessionsChartSerializer(serializers.Serializer):
    period_label = serializers.CharField()
    trend_percentage = serializers.FloatField()
    sessions = HelperMonthlySessionSerializer(many=True)


class ContributionDaySerializer(serializers.Serializer):
    date = serializers.CharField()
    count = serializers.IntegerField()


class HelperContributionsSerializer(serializers.Serializer):
    items = ContributionDaySerializer(many=True)


class HelperProfileOverviewSerializer(serializers.Serializer):
    helped_learners = serializers.IntegerField()
    sessions_joined = serializers.IntegerField()
    ongoing_sessions = serializers.IntegerField()
    average_response_minutes = serializers.FloatField()
    
    
class QuestionListSerializer(serializers.ModelSerializer):
    asked_by_username = serializers.CharField(source='asked_by.username', read_only=True)
    asked_by_name = serializers.SerializerMethodField()
    asked_by_profile_image_url = serializers.SerializerMethodField()
    participants_preview = serializers.SerializerMethodField()
    participants_extra_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    am_i_joined = serializers.SerializerMethodField()
    has_summary = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    my_vote = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'title', 'description', 'status', 'bounty_points', 
            'created_at', 'asked_by_username', 'asked_by_name',
            'asked_by_profile_image_url', 'participants_preview', 'participants_extra_count',
            'is_full', 
            'am_i_joined', 'has_summary', 'participant_count', 'tags',
            'upvotes', 'downvotes', 'my_vote', 'is_bookmarked'
        ]

    def get_tags(self, obj):
        return list(obj.tags.values_list('name', flat=True))

    def get_asked_by_name(self, obj):
        first = getattr(obj.asked_by, 'first_name', '') or ''
        last = getattr(obj.asked_by, 'last_name', '') or ''
        full = f"{first} {last}".strip()
        return full or getattr(obj.asked_by, 'username', None)

    def get_asked_by_profile_image_url(self, obj):
        return _profile_image_url(obj.asked_by)

    def _collect_participants(self, obj):
        users = []
        seen = set()
        asked_by = obj.asked_by
        if asked_by and asked_by.id not in seen:
            users.append(asked_by)
            seen.add(asked_by.id)
        if hasattr(obj, 'chat_session'):
            for user in obj.chat_session.participants.all():
                if user.id not in seen:
                    users.append(user)
                    seen.add(user.id)
        return users

    def get_participants_preview(self, obj):
        users = self._collect_participants(obj)
        preview = users[:3]
        return [
            {
                "id": user.id,
                "name": (f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username),
                "avatar": _profile_image_url(user),
            }
            for user in preview
        ]

    def get_participants_extra_count(self, obj):
        users = self._collect_participants(obj)
        extra = len(users) - 3
        return extra if extra > 0 else 0

    def get_is_full(self, obj):
        # Check if the associated chat session is at capacity
        if hasattr(obj, 'chat_session'):
            current = obj.chat_session.participants.count()
            # Assuming max is 2 experts + 1 learner = 3
            # Or use obj.chat_session.max_participants if you added that field
            return current >= 2 
        return False

    def get_participant_count(self, obj):
        if hasattr(obj, 'chat_session'):
            return obj.chat_session.participants.count()
        return 0

    def get_am_i_joined(self, obj):
        # Check if the requesting user is already in the chat
        user = self.context.get('request').user
        if not user.is_authenticated:
            return False
        if obj.asked_by == user:
            return True # The asker is always "joined"
        if hasattr(obj, 'chat_session'):
             return obj.chat_session.participants.filter(id=user.id).exists()
        return False

    def get_has_summary(self, obj):
        return hasattr(obj, 'solution_summary')

    def get_my_vote(self, obj):
        user = self.context.get('request').user
        if not user or not user.is_authenticated:
            return None
        try:
            vote = obj.votes.get(user=user)
            return vote.vote_type
        except QuestionVote.DoesNotExist:
            return None

    def get_is_bookmarked(self, obj):
        user = self.context.get('request').user
        if not user or not user.is_authenticated:
            return False
        return obj.bookmarks.filter(user=user).exists()

