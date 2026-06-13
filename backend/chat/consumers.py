# chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "main_chat"
        self.room_group_name = f"chat_{self.room_name}"
        self.username = self.scope.get('query_string', b'').decode()
        self.username = dict(param.split('=') for param in self.username.split('&') if '=' in param).get('username', 'Anonymous')

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'system_message',
                'message': f'{self.username} has joined the chat',
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'system_message',
                'message': f'{self.username} has left the chat',
            }
        )
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': self.username
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'message': event['message'],
            'username': event['username']
        }))

    async def system_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'system',
            'message': event['message'],
        }))