from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Connect signals (auto-create shop settings rows on Shop creation)
        from accounts import signals  # noqa: F401
