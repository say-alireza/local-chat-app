import os
from django.core.asgi import get_asgi_application

# 1. Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# 2. Initialize Django ASAP – this loads settings and apps
django_asgi_app = get_asgi_application()

# 3. Now import Channels stuff (after Django is ready)
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.routing import websocket_urlpatterns

# 4. Build the application
application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})