# syntax=docker/dockerfile:1.4
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    fonts-noto-core \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=bind,source=.,target=/src \
    if [ -f /src/requirements.txt ]; then \
        cp /src/requirements.txt /app/requirements.txt; \
    elif [ -f /src/backend/requirements.txt ]; then \
        cp /src/backend/requirements.txt /app/requirements.txt; \
    else \
        echo "requirements.txt not found in build context" >&2; \
        exit 1; \
    fi
RUN pip install -r /app/requirements.txt

RUN --mount=type=bind,source=.,target=/src \
    if [ -f /src/manage.py ]; then \
        cp -a /src/. /app/; \
    elif [ -f /src/backend/manage.py ]; then \
        cp -a /src/backend/. /app/; \
    else \
        echo "backend source not found in build context" >&2; \
        exit 1; \
    fi

RUN chmod +x /app/start.sh

EXPOSE 8080
CMD ["/app/start.sh"]
