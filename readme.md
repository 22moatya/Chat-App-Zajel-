# Zajel — Real-Time Chat API

A Node.js/Express backend for a real-time chat application, using MongoDB for data storage, Socket.io for real-time messaging, and JWT for authentication.

## Features

- User registration and login with hashed passwords (bcrypt) and JWT-based authentication
- Create, view, update, and delete chat rooms (public or private)
- Real-time messaging via Socket.io (join rooms, send messages, typing indicators, online/offline presence)
- Message history with pagination

## Tech Stack

- **Runtime:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.io
- **Auth:** JSON Web Tokens (jsonwebtoken), bcryptjs for password hashing

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- A MongoDB database (local or a hosted instance such as MongoDB Atlas)

### Installation

1. Clone the repository
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root based on `.env.example`:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:3000
   ```
4. Run the server in development mode (with auto-restart via nodemon)
   ```bash
   npm run dev
   ```
   Or in production mode:
   ```bash
   npm start
   ```

The server starts on `http://localhost:<PORT>` (default `5000`).

## Project Structure

```
src/
├── Controllers/       # Route handlers (auth, rooms, messages)
├── Middlewares/        # Auth middleware, etc.
├── Models/             # Mongoose schemas (User, Room, Message)
├── Routes/              # Express route definitions
└── index.js            # App entry point, Express + Socket.io setup
```

## REST API

All routes are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Endpoint    | Description         | Auth required |
|--------|-------------|----------------------|----------------|
| POST   | `/register` | Register a new user | No             |
| POST   | `/login`    | Log in, returns JWT  | No             |

### Rooms — `/api/rooms`

| Method | Endpoint      | Description                  | Auth required |
|--------|---------------|-------------------------------|----------------|
| GET    | `/`           | List all rooms               | Yes            |
| POST   | `/`           | Create a new room             | Yes            |
| GET    | `/:roomId`    | Get a single room by ID       | Yes            |
| PUT    | `/:roomId`    | Update a room                 | Yes (owner)    |
| DELETE | `/:roomId`    | Delete a room                 | Yes (owner)    |

### Messages — `/api/messages`

| Method | Endpoint      | Description                          | Auth required |
|--------|---------------|----------------------------------------|----------------|
| GET    | `/:roomId`    | Get messages for a room (paginated)   | Yes            |

Protected routes expect a `Bearer <token>` in the `Authorization` header.

## Socket.io Events

Connect with the JWT passed in the `auth` field:

```javascript
const socket = io('http://localhost:5000', {
  auth: { token: '<jwt-token>' }
});
```

| Event (client → server) | Payload                    | Description                        |
|--------------------------|-----------------------------|-------------------------------------|
| `join-room`               | `{ roomId }`                | Join a room's real-time channel     |
| `send-message`            | `{ roomId, text }`          | Send a message to a room            |
| `start-typing`            | `{ roomId }`                | Notify others you're typing         |
| `stop-typing`             | `{ roomId }`                | Notify others you've stopped typing |

| Event (server → client)   | Payload                                  | Description                     |
|-----------------------------|--------------------------------------------|----------------------------------|
| `joined-room`               | `{ roomId }`                                | Confirms room join               |
| `new-message`                | Message object (with populated sender)     | New message in a joined room     |
| `user-typing`                | `{ userid, username }`                     | Someone is typing                |
| `user-stopped-typing`        | `{ userid, username }`                     | Someone stopped typing           |
| `online-users`               | `{ userid, username }`                     | A user came online               |
| `user-offline`               | `{ userid, username }`                     | A user went offline              |
| `error`                       | Error message string                       | Something went wrong             |

## Health Check

```
GET /health
```
Returns `{ "status": "OK" }` — useful for uptime monitoring.

## License

This project is available for personal and educational use. Add a license of your choice (e.g. MIT) if you plan to share it publicly.
