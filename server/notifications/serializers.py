from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'is_read',
            'created_at',
            'question_id',
        ]
