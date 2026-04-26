import logging
import uuid
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings

logger = logging.getLogger(__name__)


def _client():
    return boto3.client(
        "s3",
        endpoint_url=(
            f"{'https' if settings.MINIO_SECURE else 'http'}://{settings.MINIO_ENDPOINT}"
        ),
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    )


def upload_file(file_obj, original_name: str, content_type: str) -> str:
    """Upload to MinIO and return the object key."""
    suffix = Path(original_name).suffix.lower()
    key = f"documents/{uuid.uuid4().hex}{suffix}"
    try:
        _client().upload_fileobj(
            file_obj,
            settings.MINIO_BUCKET,
            key,
            ExtraArgs={"ContentType": content_type},
        )
    except (BotoCoreError, ClientError) as exc:
        logger.error("document_upload_failed", extra={"error": str(exc), "key": key})
        raise
    logger.info("document_uploaded", extra={"key": key, "original_name": original_name})
    return key


def presigned_url(key: str, expires: int | None = None) -> str:
    """Generate a pre-signed download URL. Expiry defaults to DOCUMENT_URL_EXPIRY (7 days)."""
    if expires is None:
        expires = getattr(settings, "DOCUMENT_URL_EXPIRY", 604800)
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.MINIO_BUCKET, "Key": key},
        ExpiresIn=expires,
    )
