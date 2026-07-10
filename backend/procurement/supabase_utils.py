import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def get_supabase_client():
    """Return a configured Supabase client when credentials are available."""
    if not settings.USE_SUPABASE:
        return None

    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None

    try:
        from supabase import create_client
    except ImportError as exc:
        logger.warning("Supabase client package is not installed: %s", exc)
        return None

    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as exc:
        logger.warning("Unable to initialize Supabase client: %s", exc)
        return None


def build_storage_path(file_name, folder=""):
    parts = [folder, file_name] if folder else [file_name]
    return "/".join(part for part in parts if part).strip("/")


def upload_bytes_to_supabase(file_bytes, file_name, folder="", content_type="application/octet-stream"):
    """Upload bytes to Supabase Storage and return the storage path."""
    if not settings.USE_SUPABASE:
        return None

    client = get_supabase_client()
    if client is None:
        return None

    storage_path = build_storage_path(file_name, folder)
    try:
        client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
            storage_path,
            file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return storage_path
    except Exception as exc:
        logger.warning("Supabase upload failed for %s: %s", storage_path, exc)
        return None


def upload_pdf_to_supabase(pdf_bytes, file_name, folder="po_pdfs"):
    """Upload a PDF to Supabase Storage."""
    return upload_bytes_to_supabase(pdf_bytes, file_name, folder=folder, content_type="application/pdf")


def get_supabase_signed_url(file_path, expiry_seconds=3600):
    """Return a signed URL for a storage object when Supabase is configured."""
    if not settings.USE_SUPABASE or not file_path:
        return file_path

    client = get_supabase_client()
    if client is None:
        return file_path

    try:
        response = client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_url(
            file_path,
            expiry_seconds,
        )
        return response.get("signedURL") or response.get("signed_url") or file_path
    except Exception as exc:
        logger.warning("Supabase signed URL creation failed for %s: %s", file_path, exc)
        return file_path


def upload_vendor_document_to_supabase(file_obj, vendor_id, document_type):
    """Upload a vendor document to Supabase Storage using a vendor-scoped folder."""
    if file_obj is None:
        return None

    file_bytes = file_obj.read()
    safe_name = getattr(file_obj, "name", "document") or "document"
    folder = f"vendor_documents/{vendor_id}"
    file_name = f"{document_type.lower()}_{safe_name}"
    return upload_bytes_to_supabase(file_bytes, file_name, folder=folder)



def upload_invoice_to_supabase(file_obj, vendor_id, invoice_number):
    """Upload invoice PDF/file to Supabase Storage"""
    if not settings.USE_SUPABASE:
        return None

    supabase = get_supabase_client()
    file_extension = file_obj.name.split('.')[-1]
    file_path = f"invoices/{vendor_id}/{invoice_number}.{file_extension}"

    try:
        file_bytes = file_obj.read()
        supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": file_obj.content_type}
        )
        return file_path
    except Exception as e:
        logger.error(f"Invoice upload failed: {e}")
        raise    
