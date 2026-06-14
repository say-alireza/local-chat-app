import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from django.utils import timezone
from asgiref.sync import sync_to_async
from .models import ChatMessage


online_users: set[str] = set()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "main_chat"
        self.room_group_name = f"chat_{self.room_name}"
        self.username = self.scope.get("query_string", b"").decode()
        self.username = dict(
            param.split("=")
            for param in self.username.split("&")
            if "=" in param
        ).get("username", "Anonymous")

        user = await self._get_or_create_user(self.username)

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

        online_users.add(self.username)
        await self._broadcast_online_users()

        history = await self._get_history(self.room_name)
        await self.send(text_data=json.dumps({
            "type": "history",
            "messages": history,
        }))

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "system_message",
                "message": f"{self.username} has joined the chat",
            },
        )

    async def disconnect(self, close_code):
        online_users.discard(self.username)
        await self._broadcast_online_users()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "system_message",
                "message": f"{self.username} has left the chat",
            },
        )
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    async def _broadcast_online_users(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "online_users_message",
                "users": sorted(online_users),
            },
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data["message"]

        user = await self._get_or_create_user(self.username)
        msg_id = await self._save_message(user, self.room_name, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "id": msg_id,
                "message": message,
                "username": self.username,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat",
            "id": event["id"],
            "message": event["message"],
            "username": event["username"],
        }))

    async def system_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "system",
            "message": event["message"],
        }))

    async def online_users_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "online_users",
            "users": event["users"],
        }))

    async def seen_event(self, event):
        await self.send(text_data=json.dumps({
            "type": "seen",
            "message_id": event["message_id"],
            "seen_by": event["seen_by"],
        }))

    @sync_to_async
    def _get_or_create_user(self, username):
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={"password": "!"}
        )
        return user

    @sync_to_async
    def _save_message(self, user, room, message):
        msg = ChatMessage.objects.create(
            user=user,
            message=message,
            room=room,
        )
        return msg.id

    @sync_to_async
    def _get_history(self, room):
        messages = ChatMessage.objects.filter(room=room).select_related("user").prefetch_related("seen_by")[:50]
        return [
            {
                "id": msg.id,
                "username": msg.user.username,
                "message": msg.message,
                "timestamp": msg.timestamp.isoformat(),
                "seen_by": list(msg.seen_by.values_list("username", flat=True)),
            }
            for msg in reversed(list(messages))
        ]
