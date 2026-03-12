# Generated migration to backfill chat sessions for existing questions

from django.db import migrations


def create_chat_sessions_for_questions(apps, schema_editor):
    Question = apps.get_model('questions', 'Question')
    ChatSession = apps.get_model('chat', 'ChatSession')

    created_count = 0
    for question in Question.objects.all():
        # Check if chat_session exists (OneToOne reverse relation)
        if not ChatSession.objects.filter(question=question).exists():
            chat_session = ChatSession.objects.create(question=question, is_active=True)
            if question.asked_by_id:
                chat_session.participants.add(question.asked_by_id)
            created_count += 1

    if created_count:
        print(f"Created {created_count} chat session(s) for existing questions.")


def reverse_migration(apps, schema_editor):
    """Remove chat sessions that have no messages (optional - can leave as no-op)."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_chatsession_is_active_chatsession_max_participants'),
    ]

    operations = [
        migrations.RunPython(create_chat_sessions_for_questions, reverse_migration),
    ]
