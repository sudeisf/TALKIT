from celery import shared_task
from django.conf import settings
from .models import User


def _extract_embedding_vector(result):
  
    if not result:
        return None

    embeddings = getattr(result, "embeddings", None)
    if embeddings:
        first = embeddings[0]
        values = getattr(first, "values", None)
        if values:
            return list(values)

    single_embedding = getattr(result, "embedding", None)
    if single_embedding:
        values = getattr(single_embedding, "values", None)
        if values:
            return list(values)

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

    import google.genai as genai
    from google.genai.errors import APIError

    client = genai.Client(
        api_key=settings.GOOGLE_API_KEY,
        http_options={"api_version": "v1"},
    )
    embedding_model = getattr(settings, "GOOGLE_EMBEDDING_MODEL", "text-embedding-004")

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
            model=embedding_model,
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

    except APIError as e:
        # 404 typically means the model is not available for this API version.
        if getattr(e, "code", None) == 404:
            print(f"Error embedding profile (model not found): {e}")
            return
        print(f"Error embedding profile: {e}")
        raise
    except Exception as e:
        print(f"Error embedding profile: {e}")
        raise
