# Chat Application - Quick Start Guide

## 🚀 How to Run the Application

### 1. Start the Server

```bash
npm run dev
# or
bun run dev
```

The server will start on `http://localhost:5000` (or your configured port)

### 2. Open the Chat Interface in Browser

#### For Users (Clients):
Simply open your browser and navigate to:
```
http://localhost:5000
```

#### For Admins:
Open the admin panel in your browser:
```
http://localhost:5000/admin.html
```

## 🎯 Features

### ✅ Real-time Chat
- Instant messaging via WebSocket
- Auto-reconnection on disconnect
- Online/offline status indicator

### ✅ Message History
- Loads previous messages automatically
- Persistent storage in MongoDB
- Scrollable message history

### ✅ File Upload (Client Side)
- Support for multiple file uploads (up to 10 files)
- Direct upload to Digital Ocean Spaces
- File preview before sending
- Supports images, PDFs, and videos

### ✅ Beautiful UI
- Modern gradient design
- Smooth animations
- Mobile responsive
- Typing indicators
- Separate admin panel

### ✅ Admin Panel
- View all active chats
- Switch between different clients
- Real-time message notifications
- Client list with last message preview

## 📁 File Structure

```
public/
├── index.html        - Client chat interface
├── admin.html        - Admin chat dashboard
├── styles.css        - Beautiful chat styling
├── chat.js          - Client WebSocket & chat logic
└── admin-chat.js    - Admin WebSocket & chat logic
```

## 🔧 Configuration

The chat connects to:
- **WebSocket**: `ws://api.lendmora.com//ws`
- **API**: `https://api.lendmora.com//api/v1`

To change the server URL, edit both `chat.js` and `admin-chat.js`:

```javascript
const API_BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000/ws';
```

## 🎨 Chat Interface Features

### For Users (Clients)
1. Open `http://localhost:5000`
2. Start typing and sending messages
3. Attach files using the 📎 button (supports up to 10 files)
4. Your unique ID is automatically generated and saved in browser localStorage
5. All your messages are saved and loaded automatically

### For Admins
1. Open `http://localhost:5000/admin.html`
2. **Login with admin credentials:**
   - Email: `admin@gmail.com`
   - Password: `123456789`
   - (Or use your actual admin credentials)
3. After login, you'll see:
   - **Sidebar**: List of all active chat rooms
   - **Search bar**: Filter conversations
   - **Chat area**: Messages and input
4. Click on any room in the sidebar to view messages
5. Type and send messages to respond to clients
6. Click "Logout" to sign out

## 📱 API Endpoints

### Admin Login
```http
POST /api/v1/auth/admin-login
Content-Type: application/json

Body:
{
  "email": "admin@gmail.com",
  "password": "123456789"
}

Response:
{
  "success": true,
  "result": {
    "accessToken": "eyJhbGc..."
  }
}
```

### Get All Chat Rooms (Admin Only)
```http
GET /api/v1/messages/all-rooms
Authorization: Bearer <access-token>

Response:
{
  "success": true,
  "result": [
    {
      "id": "room_id",
      "clientId": "client_123",
      "adminId": "admin_456",
      "lastMessage": { ... },
      "createdAt": "2025-10-31T12:00:00Z",
      "updatedAt": "2025-10-31T12:30:00Z"
    }
  ]
}
```

### Upload Files
```http
POST /api/v1/message/generate-url
Content-Type: multipart/form-data

Body: messageFiles (up to 10 files)

Response:
{
  "success": true,
  "data": ["url1", "url2", ...]
}
```

### Get Message History (Admin)
```http
GET /api/v1/message/personal-messages/:roomId
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": {
    "messageCount": 10,
    "currentPage": 1,
    "totalPages": 1,
    "messages": [...]
  }
}
```

### Get User Messages (Public)
```http
GET /api/v1/message/user/personal-messages/:clientId

Response:
{
  "success": true,
  "data": {
    "messageCount": 10,
    "currentPage": 1,
    "totalPages": 1,
    "messages": [...]
  }
}
```

## � WebSocket Connection

### Client Connection
```javascript
ws://localhost:5000/ws?clientId=YOUR_CLIENT_ID
```

### Admin Connection
```javascript
ws://localhost:5000/ws?adminId=YOUR_ADMIN_ID
```

## 📨 WebSocket Message Types

### Client → Server
```json
{
  "type": "client-message",
  "content": "Hello!"
}
```

### Admin → Server
```json
{
  "type": "admin-message",
  "clientId": "client_123",
  "content": "How can I help you?"
}
```

### Fetch History
```json
{
  "type": "fetch-history",
  "clientId": "client_123" // optional for admin
}
```

### Server → Client
```json
{
  "type": "new-message",
  "from": "admin", // or "client"
  "message": {
    "id": "msg_id",
    "content": "Message content",
    "createdAt": "2025-10-31T12:00:00Z"
  }
}
```

## �🐛 Troubleshooting

### Error: Cannot find module 'E:\public\index.js'
**Solution:** Don't run `node public/index.js`. Instead:
1. Start the server: `npm run dev`
2. Open browser: `http://localhost:5000`

### Port Already in Use
If you get a port error, change the port in `.env`:
```env
PORT=5001
```

### WebSocket Not Connecting
1. ✅ Make sure the server is running
2. ✅ Check the browser console for errors
3. ✅ Verify the WebSocket URL in `chat.js` and `admin-chat.js`
4. ✅ Check if your firewall is blocking WebSocket connections

### Files Not Uploading
1. ✅ Check Digital Ocean Spaces configuration
2. ✅ Verify environment variables in `.env`:
   ```env
   DO_SPACE_ENDPOINT=your-endpoint
   DO_SPACE_BUCKET=your-bucket
   DO_SPACE_ACCESS_KEY=your-access-key
   DO_SPACE_SECRET_KEY=your-secret-key
   ```
3. ✅ Check file size (max 3GB per file)
4. ✅ Verify network connection

### Messages Not Saving
1. ✅ Check MongoDB connection
2. ✅ Verify DATABASE_URL in `.env`
3. ✅ Check Prisma schema is up to date
4. ✅ Run `npx prisma generate`

## 🎉 Quick Test

### Test Client Chat
1. Start server: `npm run dev`
2. Open: `http://localhost:5000`
3. Send a test message
4. Check if it appears in the chat

### Test Admin Chat
1. Open: `http://localhost:5000/admin.html`
2. Login with:
   - Email: `admin@gmail.com`
   - Password: `123456789`
3. You'll see all active chat rooms in the sidebar
4. Open client chat in another tab/window
5. Send message from client
6. See it appear in admin's selected room
7. Reply from admin
8. See the reply in client chat

## 💡 Pro Tips

- **Multiple Tabs**: Open multiple client tabs to simulate different users
- **Admin Dashboard**: All chats are visible in the sidebar with last message preview
- **File Attachments**: Clients can upload images, PDFs, videos, and documents
- **Auto-Reconnect**: If connection drops, it automatically reconnects
- **Message Persistence**: All messages are saved to MongoDB
- **LocalStorage**: 
  - Client IDs are saved in browser
  - Admin token is saved for auto-login
- **Search**: Use the search bar in admin panel to filter conversations
- **Real-time Updates**: Room list updates when new messages arrive

## 📝 Notes

- Each user gets a unique `clientId` stored in localStorage
- Messages are persisted in MongoDB via Prisma
- Files are uploaded to Digital Ocean Spaces/AWS S3
- WebSocket provides real-time bi-directional communication
- No page refresh needed - everything is real-time!
- Admin can handle multiple client chats simultaneously

## 🚀 Production Deployment

When deploying to production:

1. Update URLs in `chat.js` and `admin-chat.js`:
```javascript
const API_BASE_URL = 'https://your-domain.com';
const WS_URL = 'wss://your-domain.com/ws'; // Note: wss:// for secure WebSocket
```

2. Enable CORS for your domain in `app.ts`
3. Use environment variables for all sensitive data
4. Enable SSL/TLS for secure WebSocket (WSS)
5. Consider using Redis for WebSocket scaling

---

**Need Help?** Check the server logs for detailed error messages!
