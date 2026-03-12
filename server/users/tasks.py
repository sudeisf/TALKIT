from celery import shared_task
from django.conf import settings
from .models import User


def _extract_embedding_vector(result):
    """
    Normalize Gemini embedding response into a Python list.
    Handles multiple response formats.
    """

    if not result:
        return None

    # New SDK response structure
    embeddings = getattr(result, "embeddings", None)
    if embeddings:
        first = embeddings[0]
        values = getattr(first, "values", None)
        if values:
            return list(values)

    # Alternative structure
    single_embedding = getattr(result, "embedding", None)
    if single_embedding:
        values = getattr(single_embedding, "values", None)
        if values:
            return list(values)

    # Dict fallback
    if isinstance(result, dict):
        if isinstance(result.get("embedding"), list):
            return result["embedding"]

        dict_embeddings = result.get("embeddings")
        if dict_embeddings and isinstance(dict_embeddings[0], dict):
            return dict_embeddings[0].get("values")

    return None


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def update_user_embedding(self, user_id):
    """
    Generate an embedding for a user profile and store it.
    """

    if not getattr(settings, "GOOGLE_API_KEY", None):
        return

    # Lazy import prevents Django startup failures
    from google import genai

    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    try:
        user = User.objects.get(id=user_id)

        tags_str = ", ".join(
            ut.tag.name for ut in user.user_tags.select_related("tag")
        )

        profile_text = " ".join(
            part for part in [
                user.profession or "",
                f"Skills: {tags_str}" if tags_str else "",
                f"Bio: {user.bio}" if user.bio else "",
            ] if part
        ).strip()

        if not profile_text:
            return

        result = client.models.embed_content(
            model="text-embedding-004",
            contents=profile_text,
            config={"task_type": "RETRIEVAL_DOCUMENT"},
        )

        embedding_vector = _extract_embedding_vector(result)

        if not embedding_vector:
            print("Embedding extraction failed")
            return

        user.profile_embedding = embedding_vector
        user.save(update_fields=["profile_embedding"])

        print(f"Updated vector for user: {user.username}")

    except User.DoesNotExist:
        print(f"User {user_id} does not exist")

    except Exception as e:
        print(f"Error embedding profile: {e}")
        raise