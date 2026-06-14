import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from django.utils import timezone
from asgiref.sync import sync_to_async
from .models import ChatMessage


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

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data["message"]

        user = await self._get_or_create_user(self.username)
        await self._save_message(user, self.room_name, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "username": self.username,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat",
            "message": event["message"],
            "username": event["username"],
        }))

    async def system_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "system",
            "message": event["message"],
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
        ChatMessage.objects.create(
            user=user,
            message=message,
            room=room,
        )

    @sync_to_async
    def _get_history(self, room):
        messages = ChatMessage.objects.filter(room=room).select_related("user")[:50]
        return [
            {
                "username": msg.user.username,
                "message": msg.message,
                "timestamp": msg.timestamp.isoformat(),
            }
            for msg in reversed(list(messages))
        ]
