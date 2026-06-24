FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# collectstatic at build time — uses a throwaway key so the real SECRET_KEY
# is never baked into the image layer.
ARG BUILD_SECRET_KEY=dummy-build-key
RUN SECRET_KEY="${BUILD_SECRET_KEY}" python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run migrations then start Daphne (ASGI server with WebSocket support)
CMD ["sh", "-c", "python manage.py migrate --noinput && exec daphne -b 0.0.0.0 -p 8000 config.asgi:application"]
