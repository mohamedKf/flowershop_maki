"""URL configuration for flowershop project.

Routing:
    /admin/            -> Django admin
    /api/...           -> DRF endpoints
    /media/...         -> User-uploaded files (dev only)
    /assets/...        -> React JS/CSS (dev: served here; prod: WhiteNoise)
    /favicon.svg etc.  -> static files at root (dev only)
    everything else    -> React SPA (index.html)
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import HttpResponse, FileResponse
from django.views.static import serve as static_serve


def serve_react_app(request, path=''):
    """Serve React's index.html for any non-API path."""
    index_path = settings.BASE_DIR / 'static_frontend' / 'index.html'
    if not index_path.exists():
        return HttpResponse(
            'Frontend not built. Run: cd frontend && npm run build',
            status=503,
        )
    return FileResponse(open(index_path, 'rb'), content_type='text/html')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('catalog.urls')),
    path('api/', include('orders.urls')),
]

# In dev only: serve uploaded media + frontend static files directly.
# In production, WhiteNoise handles /static/* and bucket handles /media/*.
if settings.DEBUG:
    if not settings.USE_S3_STORAGE:
        urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += [
        re_path(
            r'^assets/(?P<path>.*)$',
            static_serve,
            {'document_root': settings.BASE_DIR / 'static_frontend' / 'assets'},
        ),
        re_path(
            r'^(?P<path>(favicon\.svg|icons\.svg|robots\.txt|.*\.png|.*\.ico))$',
            static_serve,
            {'document_root': settings.BASE_DIR / 'static_frontend'},
        ),
    ]

# Catch-all for React Router — must come last
urlpatterns += [
    re_path(r'^(?!api/|admin/|media/|static/).*$', serve_react_app, name='react-app'),
]
