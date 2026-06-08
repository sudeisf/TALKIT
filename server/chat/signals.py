from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from questions.models import Question
from chat.models import ChatSession
from activities.models import UserActivity

@receiver(post_save, sender=Question)
def create_chat_session_for_question(sender, instance, created, **kwargs):
    if created:
        # Only create if not already exists (should be enforced by OneToOne, but double check)
        if not hasattr(instance, 'chat_session'):
            chat_session = ChatSession.objects.create(question=instance)
            chat_session.participants.add(instance.asked_by)
            chat_session.save()

@receiver(m2m_changed, sender=ChatSession.participants.through)
def record_helper_joined_activity(sender, instance, action, pk_set, **kwargs):
    if action == "post_add":
        for pk in pk_set:
            if pk != instance.question.asked_by_id:
                from users.models import User
                user = User.objects.get(pk=pk)
                UserActivity.objects.create(
                    user=user,
                    activity_type='helper_joined',
                    description=f'Joined session for question: {instance.question.title}',
                    content_object=instance.question
                )
