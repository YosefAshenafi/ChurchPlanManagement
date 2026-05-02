import logging
import uuid
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)


def upload_file(file_obj, original_name: str, content_type: str) -> str:
    """Upload to local storage and return the file path."""
    suffix = Path(original_name).suffix.lower()
    filename = f"documents/{uuid.uuid4().hex}{suffix}"
    save_dir = Path(settings.MEDIA_ROOT) / "documents"
    save_dir.mkdir(parents=True, exist_ok=True)
    save_path = save_dir / Path(filename).name

    with open(save_path, "wb") as dest:
        for chunk in file_obj.chunks():
            dest.write(chunk)

    logger.info("document_uploaded", extra={"filename": filename, "original_name": original_name})
    return filename


def presigned_url(key: str, expires: int | None = None) -> str:
    """Generate a URL for local media files."""
    return f"{settings.MEDIA_URL}{key}"


def delete_file(key: str) -> None:
    """Delete a file from local storage."""
    try:
        file_path = Path(settings.MEDIA_ROOT) / "documents" / key.split("/")[-1]
        file_path.unlink(missing_ok=True)
    except Exception as exc:
        logger.error("document_delete_failed", extra={"error": str(exc), "key": key})
        raise
    logger.info("document_deleted", extra={"key": key})