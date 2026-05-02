import logging
import uuid
from io import BytesIO
from pathlib import Path

import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
from django.conf import settings

logger = logging.getLogger(__name__)


def _configure():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )


def upload_file(file_obj, original_name: str, content_type: str) -> str:
    """Upload to Cloudinary and return the public_id."""
    suffix = Path(original_name).suffix.lower()
    public_id = f"documents/{uuid.uuid4().hex}{suffix}"
    try:
        _configure()
        result = cloudinary.uploader.upload(
            file_obj,
            public_id=public_id,
            folder=settings.CLOUDINARY_FOLDER,
            resource_type="auto",
        )
    except CloudinaryError as exc:
        logger.error("document_upload_failed", extra={"error": str(exc), "public_id": public_id})
        raise
    logger.info("document_uploaded", extra={"public_id": public_id, "original_name": original_name})
    return result.get("public_id", public_id)


def presigned_url(key: str, expires: int | None = None) -> str:
    """Generate a signed download URL. Expiry defaults to DOCUMENT_URL_EXPIRY (7 days)."""
    if expires is None:
        expires = getattr(settings, "DOCUMENT_URL_EXPIRY", 604800)
    _configure()
    try:
        result = cloudinary.utils.cloudinary_url(
            key,
            sign=True,
            expires_at=int(expires),
            resource_type="raw",
        )
        return result[0]
    except CloudinaryError as exc:
        logger.error("presigned_url_failed", extra={"error": str(exc), "key": key})
        raise


def delete_file(key: str) -> None:
    """Delete a file from Cloudinary."""
    _configure()
    try:
        cloudinary.uploader.destroy(key)
    except CloudinaryError as exc:
        logger.error("document_delete_failed", extra={"error": str(exc), "key": key})
        raise
    logger.info("document_deleted", extra={"key": key})