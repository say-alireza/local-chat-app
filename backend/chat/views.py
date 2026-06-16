# chat/views.py
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
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
    logout(request)
    return JsonResponse({'success': True})


@require_http_methods(["GET"])
def user_view(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'is_authenticated': True,
            'username': request.user.username
        })
    else:
        return JsonResponse({'is_authenticated': False})


@csrf_exempt
@require_http_methods(["POST"])
def mark_seen_view(request):
    try:
        data = json.loads(request.body)
        message_id = data.get('message_id')
        username = data.get('username')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    if not message_id or not username:
        return JsonResponse({'error': 'message_id and username required'}, status=400)

    try:
        from .models import ChatMessage
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        msg = ChatMessage.objects.get(pk=message_id)
        user, _ = User.objects.get_or_create(username=username, defaults={"password": "!"})
        msg.seen_by.add(user)
        seen_by_list = list(msg.seen_by.values_list("username", flat=True))

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_main_chat",
            {
                "type": "seen_event",
                "message_id": message_id,
                "seen_by": seen_by_list,
            },
        )

        return JsonResponse({'success': True, 'seen_by': seen_by_list, 'message_id': message_id})
    except ChatMessage.DoesNotExist:
        return JsonResponse({'error': 'Message not found'}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def toggle_reaction(request):
    try:
        data = json.loads(request.body)
        message_id = data.get('message_id')
        emoji = data.get('emoji')
        username = data.get('username')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    if not message_id or not emoji:
        return JsonResponse({'error': 'message_id and emoji required'}, status=400)

    try:
        from .models import ChatMessage
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        msg = ChatMessage.objects.get(pk=message_id)
        reactions = msg.reactions or {}

        if emoji in reactions:
            if username in reactions[emoji]:
                reactions[emoji].remove(username)
                if not reactions[emoji]:
                    del reactions[emoji]
            else:
                reactions[emoji].append(username)
        else:
            reactions[emoji] = [username]

        msg.reactions = reactions
        msg.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_main_chat",
            {
                "type": "reaction_update",
                "message_id": message_id,
                "emoji": emoji,
                "username": username,
                "reactions": reactions,
            },
        )

        return JsonResponse({'success': True, 'reactions': reactions, 'message_id': message_id})
    except ChatMessage.DoesNotExist:
        return JsonResponse({'error': 'Message not found'}, status=404)
