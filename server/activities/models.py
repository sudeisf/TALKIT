from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey

# Create your models here.
from django.db import models
from django.conf import settings

class UserActivity(models.Model):
    ACTIVITY_TYPES = [
        ('question_asked', 'Question Asked'),
        ('question_answered', 'Question Answered'),
        ('message_sent', 'Message Sent'),
        ('achievement_unlocked', 'Achievement Unlocked'),
        ('bookmark_added', 'Bookmark Added'),
        ('upvote_given', 'Upvote Given'),
        ('helper_joined', 'Helper Joined'),
        ('session_closed', 'Session Closed'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)
    
    # Generic foreign key approach for flexibility
    content_type = models.ForeignKey('contenttypes.ContentType', on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['activity_type', 'created_at']),
        ]
        verbose_name_plural = 'User activities'