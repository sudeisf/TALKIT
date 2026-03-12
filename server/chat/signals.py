from django.db.models.signals import post_save
from django.dispatch import receiver
from questions.models import Question
from chat.models import ChatSession

@receiver(post_save, sender=Question)
def create_chat_session_for_question(sender, instance, created, **kwargs):
    if created:
        # Only create if not already exists (should be enforced by OneToOne, but double check)
        if not hasattr(instance, 'chat_session'):
            chat_session = ChatSession.objects.create(question=instance)
            chat_session.participants.add(instance.asked_by)
            chat_session.save()
