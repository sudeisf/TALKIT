from celery import shared_task
from google import genai
from django.conf import settings
from .models import Question, QuestionInvite, SolutionSummary
from users.models import User
from chat.models import ChatSession, ChatMessage
from pgvector.django import L2Distance
import json
from django.db import IntegrityError
from notifications.models import Notification

GENAI_CLIENT = (
    genai.Client(api_key=settings.GOOGLE_API_KEY)
    if getattr(settings, 'GOOGLE_API_KEY', None)
    else None
)


def _extract_embedding_vector(result):
    embeddings = getattr(result, 'embeddings', None)
    if embeddings:
        first = embeddings[0]
        values = getattr(first, 'values', None)
        if values:
            return values

    single_embedding = getattr(result, 'embedding', None)
    if single_embedding:
        values = getattr(single_embedding, 'values', None)
        if values:
            return values

    if isinstance(result, dict):
        if isinstance(result.get('embedding'), list):
            return result['embedding']
        dict_embeddings = result.get('embeddings')
        if dict_embeddings and isinstance(dict_embeddings[0], dict):
            return dict_embeddings[0].get('values')

    return None


@shared_task
def vectorize_question(question_id):
    
    try:
        question = Question.objects.get(id=question_id)
        text_to_embed = f"{question.title} {question.description}"
        
        if not GENAI_CLIENT:
            return question_id

        result = GENAI_CLIENT.models.embed_content(
            model='text-embedding-004',
            contents=text_to_embed,
            config={'task_type': 'RETRIEVAL_QUERY'},
        )

        embedding_vector = _extract_embedding_vector(result)
        if embedding_vector:
            question.embedding = embedding_vector
            question.save()

    except Exception as e:
        print(f"Error vectorizing question {question_id}: {str(e)}")

    return question_id
        
@shared_task 
def find_and_invite_experts(question_id):
    try:
        question = Question.objects.get(id=question_id)
        helper_base_qs = User.objects.filter(role='helper').exclude(id=question.asked_by.id)

        tag_matched_experts = helper_base_qs.filter(
            user_tags__tag__in=question.tags.all()
        ).distinct()[:5]

        matched_experts = list(tag_matched_experts)

        if len(matched_experts) < 5:
            remaining_slots = 5 - len(matched_experts)
            excluded_ids = [expert.id for expert in matched_experts]
            candidate_qs = helper_base_qs.exclude(id__in=excluded_ids)

            if question.embedding:
                candidates = candidate_qs.annotate(
                    distance=L2Distance('profile_embedding', question.embedding)
                ).order_by('distance')[:remaining_slots]
            else:
                candidates = candidate_qs[:remaining_slots]

            matched_experts.extend(list(candidates))

        
        for expert in matched_experts:
            try:
                QuestionInvite.objects.create(question=question, expert=expert)
                Notification.objects.create(
                    user=expert,
                    notification_type='question_announcement', 
                    title="New Gig Available!",
                    message=f"Topic: {question.title}. Reward: {question.bounty_points} pts.",
                    question=question 
                )
            except IntegrityError:
                continue
            
    except Exception as e:
        print(f"Error finding/inviting experts for question {question_id}: {str(e)}")
        
        
@shared_task
def summarize_chat_session(chat_session_id):
   
    session = ChatSession.objects.get(id=chat_session_id)
    messages = ChatMessage.objects.filter(chat_session=session).order_by('created_at')
    
    chat_log = "\n".join([f"{msg.sender.username}: {msg.message_content}" for msg in messages])
    
    prompt = f"""
    You are a technical documentation expert. Analyze this chat log.
    
    CHAT LOG:
    {chat_log}
    
    OUTPUT JSON ONLY:
    {{
        "root_cause": "Brief explanation of the error",
        "solution_steps": "Markdown list of steps to fix it",
        "code_snippet": "The final working code block (if any)"
    }}
    """
    
    try:
        if not GENAI_CLIENT:
            return

        response = GENAI_CLIENT.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
        )
        clean_text = response.text.replace('```json', '').replace('```', '')
        data = json.loads(clean_text)
        
        SolutionSummary.objects.create(
            question=session.question,
            problem_root_cause=data.get('root_cause', 'No cause found'),
            solution_steps=data.get('solution_steps', 'No steps found'),
            final_code_snippet=data.get('code_snippet', '')
        )
        
    except Exception as e:
        print(f"Error summarizing: {e}")