# chat/views.py
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt  # Only for development; in production use proper CSRF tokens
@require_http_methods(["POST"])
def login_view(request):
    """Log in a user and return success/error JSON."""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({'success': True, 'username': user.username})
    else:
        return JsonResponse({'error': 'Invalid credentials'}, status=401)

@require_http_methods(["POST"])
def logout_view(request):
    """Log out the current user."""
    logout(request)
    return JsonResponse({'success': True})

@require_http_methods(["GET"])
def user_view(request):
    """Return current user info (used by frontend to check auth status)."""
    if request.user.is_authenticated:
        return JsonResponse({
            'is_authenticated': True,
            'username': request.user.username
        })
    else:
        return JsonResponse({'is_authenticated': False})