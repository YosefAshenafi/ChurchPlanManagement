FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    fonts-noto-core \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

COPY backend/ /app/

RUN chmod +x /app/start.sh

EXPOSE 8080
CMD ["/app/start.sh"]
