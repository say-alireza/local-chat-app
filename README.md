# Local Chat Application

A real-time chat application that runs entirely on your local network using WebSockets. No internet connection required.

**Tech Stack:** Django Channels, Next.js, TypeScript, CSS Modules
## Login Page
![Login Page](frontend/public/image.png)

## Chat View
![Chat View](frontend/public/chat-view.png)
<!-- <img width="1920" height="1080" alt="Screenshot 2026-06-06 000952" src="https://github.com/user-attachments/assets/518b0246-5352-485f-b124-58dd69ca5326" /> -->

## Features

- Real-time messaging via WebSockets
- SSL encrypted connection (self-signed cert)
- Admin approval system for new users
- Message reactions with emoji picker
- Read/seen status indicators
- Online user presence panel
- Light/dark theme toggle
- Django admin interface with admin-panel UI

## Overview

- **Backend:** Django + Channels (ASGI) via Daphne
- **Frontend:** Next.js 16 (React 19, TypeScript, CSS Modules)
- **Communication:** WebSockets (WSS)
- **Database:** SQLite
- **Average latency on localhost:** 15-20ms

## How It Works

1. User opens `https://localhost:3000`
2. UsernameModal prompts for a username
3. Username is sent to `/api/request_join/` and stored as a `PendingUser`
4. Admin approves the user via Django admin (`/admin/chat/pendinguser/`)
5. Frontend polls `/api/check_approval/` every 3s
6. On approval, a WebSocket connection is established to `wss://localhost:8000/ws/chat/`
7. Messages are broadcast to all connected clients in real time

## Network Flow

```text
Browser A                 Django (Port 8000)                 Browser B
|                            |                              |
|-- WebSocket handshake ---->|                              |
|<-- Connection accepted ----|                              |
|                            |-- WebSocket handshake ------>|
|                            |<-- Connection accepted ------|
|                            |                              |
|------ "Hello" ------------>|                              |
|                            |------ "Hello" ------------->|
|                            |                              |
|<----------- "Hi" ---------|<----------- "Hi" ------------|
```

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### 1. Backend Setup (Django)

```bash
cd backend
python -m venv venv
```

**On Mac/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 2. Frontend Setup (Next.js)

Open a new terminal:

```bash
cd frontend
npm install
```

## Running the Application

### With SSL (Recommended)

The backend requires SSL certificates. Generate them on first setup:

```bash
cd backend
python -c "
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import datetime, pathlib
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'localhost')])
cert = (
    x509.CertificateBuilder()
    .subject_name(subject).issuer_name(issuer)
    .public_key(key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(datetime.datetime.now(datetime.UTC))
    .not_valid_after(datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=365))
    .add_extension(x509.SubjectAlternativeName([x509.DNSName('localhost')]), critical=False)
    .sign(key, hashes.SHA256())
)
pathlib.Path('localhost.pem').write_bytes(cert.public_bytes(serialization.Encoding.PEM))
pathlib.Path('localhost.key').write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.TraditionalOpenSSL, serialization.NoEncryption()))
print('Certificates generated')
"
```

Start the backend with SSL:

```bash
daphne -e ssl:8000:privateKey=localhost.key:certKey=localhost.pem backend.asgi:application
```

Start the frontend:

```bash
cd frontend
npm run dev
```

- Frontend: `https://localhost:3000`
- Backend API: `https://localhost:8000`
- Admin panel: `https://localhost:8000/admin/`

> **Note:** On first visit your browser will warn about the self-signed certificate. Click **Advanced** → **Proceed to localhost**.

### Without SSL (Development)

Start the backend on plain HTTP:

```bash
daphne -b localhost -p 8000 backend.asgi:application
```

Then update the frontend URLs from `https://` to `http://` and from `wss://` to `ws://` in:

- `frontend/hooks/use-websocket.ts` — change `wss://` to `ws://`
- `frontend/components/ChatWindow/UsernameModal.tsx` — change `https://` to `http://`
- `frontend/utils/api.ts` — change `https://` to `http://`

Start the frontend:

```bash
cd frontend
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

## Admin Approval Workflow

1. Create a superuser: `python manage.py createsuperuser`
2. A user enters their username in the frontend
3. The request appears in Django admin under **Chat > Pending users**
4. Select the user and run **Approve selected users** action
5. The user is automatically connected to the chat

## Project Structure

```
local-chat-app/
├── backend/
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── asgi.py
│   ├── chat/
│   │   ├── models.py          # ChatMessage, PendingUser
│   │   ├── admin.py           # Admin config with approve action
│   │   ├── views.py           # REST endpoints (request_join, check_approval, etc.)
│   │   ├── consumers.py       # WebSocket consumer (chat, reactions, seen)
│   │   ├── routing.py         # WebSocket URL routing
│   │   └── migrations/
│   ├── manage.py
│   ├── requirements.txt
│   ├── localhost.pem          # SSL certificate (generated)
│   ├── localhost.key          # SSL private key (generated)
│   └── db.sqlite3
├── frontend/
│   ├── app/
│   │   └── page.tsx
│   ├── components/
│   │   └── ChatWindow/
│   │       ├── index.tsx            # Main chat component
│   │       ├── ChatWindow.module.css
│   │       ├── MessageFeed.tsx
│   │       ├── MessageBubble.tsx    # Reactions display + picker
│   │       ├── InputBar.tsx
│   │       ├── OnlinePanel.tsx
│   │       ├── UsernameModal.tsx    # Approval request UI
│   │       └── ReactionPicker.tsx
│   ├── hooks/
│   │   ├── use-websocket.ts         # WebSocket hook
│   │   └── useSeenStatus.ts
│   ├── types/
│   │   └── index.tsx
│   ├── utils/
│   │   └── api.ts
│   ├── package.json
│   └── next.config.ts
├── README.md
└── .gitignore
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/request_join/` | Submit username for admin approval |
| GET | `/api/check_approval/?username=X` | Poll approval status |
| POST | `/api/toggle_reaction/` | Toggle emoji reaction on a message |
| POST | `/api/mark_seen/` | Mark a message as seen |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat_message` | Server -> Client | New message broadcast |
| `system_message` | Server -> Client | System notification |
| `online_users_message` | Server -> Client | Online user list update |
| `seen_event` | Server -> Client | Read receipt update |
| `reaction_update` | Server -> Client | Reaction toggle broadcast |
| `reaction` | Client -> Server | Send a reaction |
