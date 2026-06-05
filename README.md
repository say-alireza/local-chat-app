

# Local Chat Application

A real-time chat application that runs entirely on your local network using WebSockets. No internet connection required.

**Tech Stack:** Django Channels, Next.js, TypeScript, Tailwind CSS


## Overview

This project demonstrates a full-stack WebSocket-based chat system running locally.

- Backend: Django + Channels (ASGI)
- Frontend: Next.js (React)
- Communication: WebSockets
- Average latency on localhost: 15–20ms

---

## How It Works

1. User opens: `http://localhost:3000`
2. Browser establishes a WebSocket connection to:

   `ws://localhost:8000/ws/chat/`

3. A persistent TCP socket remains open.
4. When a user sends a message:
   - `ws.send()` sends the message to the Django server.
   - The server broadcasts the message to all connected clients.
5. All connected browsers receive the message instantly using `onmessage`.

---

## Network Flow
```text
Browser A                 Django (Port 8000)                 Browser B
|                            |                              |
|-- WebSocket handshake ---->|                              |
|<-- Connection accepted -----|                              |
|                            |-- WebSocket handshake ------>|
|                            |<-- Connection accepted -------|
|                            |                              |
|------ "Hello" ------------->|                              |
|                            |------ "Hello" -------------->|
|                            |                              |
|<----------- "Hi" ----------|<----------- "Hi" ------------|

```


# Installation

## 1. Backend Setup (Django) 

### Navigate to the backend directory
```
cd backend
```
### Create a virtual environment
```
python -m venv venv
```
## Activate the virtual environment:

### On Mac/Linux:
```
source venv/bin/activate
```
## On Windows:

```
venv\Scripts\activate
```

### Install dependencies from requirements file
```
pip install -r requirements.txt
```
### Alternatively, manual install:
```
 pip install django channels daphne
```
### Start the Django server
```
python manage.py runserver
```

### Backend will be available at:
```
http://localhost:8000
```

## 2.Frontend Setup (Next.js)

### Open a new terminal and navigate to the frontend directory
``
  cd frontend
``
### Install Node dependencies
``
npm install
``
### Start the development server
```
  npm run dev
```
### Frontend will be available at:
```
  http://localhost:3000
```

# Project Structure
```
local-chat-app/
├── backend/
│   ├── chat/
│   │   ├── consumers.py
│   │   └── routing.py
│   └── backend/
│       ├── settings.py
│       └── asgi.py
├── frontend/
│   ├── components/
│   │   └── ChatWindow.tsx
│   └── app/
│       └── page.tsx
└── .gitignore
```
