from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Question, QuestionVote, Bookmark
from activities.models import UserActivity

@receiver(post_save, sender=QuestionVote)
@receiver(post_delete, sender=QuestionVote)
def update_vote_counts(sender, instance, **kwargs):
    question = instance.question

    # Recalculate counts from the Vote Table
    question.upvotes = question.votes.filter(vote_type='UP').count()
    question.downvotes = question.votes.filter(vote_type='DOWN').count()

    # Save only the updated fields for speed
    question.save(update_fields=['upvotes', 'downvotes'])

@receiver(post_save, sender=Question)
def record_question_activity(sender, instance, created, **kwargs):
    if created:
        UserActivity.objects.create(
            user=instance.asked_by,
            activity_type='question_asked',
            description=f'Asked a new question: {instance.title}',
            content_object=instance
        )

@receiver(post_save, sender=QuestionVote)
def record_vote_activity(sender, instance, created, **kwargs):
    if created:
        UserActivity.objects.create(
            user=instance.user,
            activity_type='upvote_given' if instance.vote_type == 'UP' else 'downvote_given',
            description=f'{"Upvoted" if instance.vote_type == "UP" else "Downvoted"} question: {instance.question.title}',
            content_object=instance.question
        )

@receiver(post_save, sender=Bookmark)
def record_bookmark_activity(sender, instance, created, **kwargs):
    if created:
        UserActivity.objects.create(
            user=instance.user,
            activity_type='bookmark_added',
            description=f'Bookmarked question: {instance.question.title}',
            content_object=instance.question
        )