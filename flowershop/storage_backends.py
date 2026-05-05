"""
Storage backends for Railway buckets.

Railway provides S3-compatible buckets (Cloudflare R2, AWS S3, Backblaze B2, etc.).
Set these env vars on Railway:

    USE_S3_STORAGE=1                           # turn it on
    AWS_ACCESS_KEY_ID=...
    AWS_SECRET_ACCESS_KEY=...
    AWS_STORAGE_BUCKET_NAME=flowershop-media
    AWS_S3_ENDPOINT_URL=https://...            # bucket endpoint
    AWS_S3_REGION_NAME=auto                    # for R2; use real region for AWS
    AWS_S3_CUSTOM_DOMAIN=cdn.your-domain.com   # optional, for public reads via CDN

If USE_S3_STORAGE is not set, files are saved to the local /media folder (dev).
"""
from storages.backends.s3boto3 import S3Boto3Storage


class PublicMediaStorage(S3Boto3Storage):
    """For category/flower/banner photos — publicly readable via CDN."""
    location = 'media'
    default_acl = 'public-read'
    file_overwrite = False
    querystring_auth = False  # public URLs without expiry signatures


class PrivateMediaStorage(S3Boto3Storage):
    """For invoices and other docs that should NOT be publicly browsable."""
    location = 'private'
    default_acl = 'private'
    file_overwrite = False
    custom_domain = False
    querystring_auth = True
    querystring_expire = 3600  # 1 hour signed URLs
