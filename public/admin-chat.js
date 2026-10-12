// Admin Chat Configuration
const API_BASE_URL = "https://api.lendmora.com/api/v1";
const WS_URL = "wss://api.lendmora.com/ws";

let socket = null;
let accessToken = localStorage.getItem("adminToken") || null;
console.log("successfully geeting the token from localstorage", accessToken);
let adminId = null;
let currentClientId = null;
let allRooms = [];
let currentRoomId = null;
let selectedFiles = [];
let currentPage = 1;
let totalPages = 1;
let isLoadingMessages = false;
let messageLimit = 20;
let isUploadingFiles = false;

// Check if already logged in
document.addEventListener("DOMContentLoaded", () => {
  if (accessToken) {
    showChatApp();
    loadChatRooms();
    connectWebSocket();
  }
});

// Handle Login
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  const loginBtn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("loginError");

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";
  errorEl.style.display = "none";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.success && result.result.accessToken) {
      accessToken = result.result.accessToken;
      localStorage.setItem("adminToken", accessToken);
      localStorage.setItem("adminEmail", email);

      showChatApp();
      loadChatRooms();
      connectWebSocket();
    } else {
      throw new Error(result.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    errorEl.textContent = error.message || "Invalid email or password";
    errorEl.style.display = "block";
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
}

// Show Chat App
function showChatApp() {
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("chatApp").style.display = "flex";
  document.getElementById("adminEmail").textContent =
    localStorage.getItem("adminEmail") || "";
}

// Handle Logout
function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminId");

    if (socket) {
      socket.close();
    }

    location.reload();
  }
}

// Load Chat Rooms
async function loadChatRooms() {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/all-rooms`, {
      headers: {
        Authorization: `${accessToken}`,
      },
    });

    const result = await response.json();

    if (result.success) {
      allRooms = result.result || [];
      renderRoomList(allRooms);
    }
  } catch (error) {
    console.error("Failed to load chat rooms:", error);
    document.getElementById("roomList").innerHTML =
      '<div class="loading">Failed to load chats</div>';
  }
}

// Render Room List
function renderRoomList(rooms) {
  const roomList = document.getElementById("roomList");

  if (rooms.length === 0) {
    roomList.innerHTML = '<div class="loading">No active chats</div>';
    return;
  }

  roomList.innerHTML = "";

  rooms.forEach((room) => {
    const roomItem = document.createElement("div");
    const hasUnseenMessages = room.unseenCount > 0;
    roomItem.className = `room-item ${
      currentRoomId === room.id ? "active" : ""
    } ${hasUnseenMessages ? "new-message" : ""}`;
    roomItem.onclick = () => selectRoom(room);

    const clientName = room.clientId.substring(0, 20);
    const firstLetter = clientName.charAt(0).toUpperCase();
    const lastMessage = room.lastMessage?.content || "No messages yet";
    const time = room.lastMessage ? formatTime(room.lastMessage.createdAt) : "";
    const unseenCount = room.unseenCount || 0;

    // Badge HTML for unseen count
    const unseenBadge =
      unseenCount > 0 ? `<div class="unseen-badge">${unseenCount}</div>` : "";

    roomItem.innerHTML = `
            <div class="room-avatar">${firstLetter}</div>
            <div class="room-info">
                <div class="room-name">${clientName}</div>
                <div class="room-last-message">${lastMessage}</div>
            </div>
            <div class="room-meta">
                <div class="room-time">${time}</div>
                ${unseenBadge}
            </div>
        `;

    roomList.appendChild(roomItem);
  });
}

// Filter Rooms
function filterRooms() {
  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const filteredRooms = allRooms.filter((room) =>
    room.clientId.toLowerCase().includes(searchText)
  );
  renderRoomList(filteredRooms);
}

// Select Room
function selectRoom(room) {
  currentClientId = room.clientId;
  currentRoomId = room.id;

  // Update UI
  const clientName = room.clientId.substring(0, 30);
  const firstLetter = clientName.charAt(0).toUpperCase();

  document.getElementById("chatAvatar").textContent = firstLetter;
  document.getElementById("chatClientName").textContent = clientName;
  document.getElementById("chatHeader").style.display = "flex";
  document.getElementById("chatInputArea").style.display = "block";

  // Update restrict button state
  updateRestrictButton(room.isRestricted || false);

  // Re-render room list to update active state
  renderRoomList(allRooms);

  // Reset pagination
  currentPage = 1;
  totalPages = 1;

  // Load messages
  loadRoomMessages(room.id, 1, false);

  // Mark messages as seen
  markRoomAsSeen(room.id);
  
  // Setup scroll listener for infinite scroll
  setupInfiniteScroll();
}

// Mark Room as Seen
async function markRoomAsSeen(roomId) {
  try {
    await fetch(`${API_BASE_URL}/messages/mark-seen/${roomId}`, {
      method: "PATCH",
      headers: {
        Authorization: `${accessToken}`,
      },
    });

    // Reload rooms to update unseen count
    loadChatRooms();
  } catch (error) {
    console.error("Failed to mark messages as seen:", error);
  }
}

// Toggle user restriction
async function toggleUserRestriction() {
  if (!currentRoomId) return;
  
  const currentRoom = allRooms.find(r => r.id === currentRoomId);
  const newRestrictedState = !(currentRoom?.isRestricted || false);
  
  try {
    const response = await fetch(`${API_BASE_URL}/messages/restrict-user/${currentRoomId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${accessToken}`,
      },
      body: JSON.stringify({ isRestricted: newRestrictedState }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update button state
      updateRestrictButton(newRestrictedState);
      
      // Reload rooms to update state
      loadChatRooms();
      
      // Show notification
      alert(result.message);
    }
  } catch (error) {
    console.error("Failed to toggle restriction:", error);
    alert("Failed to update user restriction");
  }
}

// Update restrict button state
function updateRestrictButton(isRestricted) {
  const restrictBtn = document.getElementById("restrictBtn");
  if (!restrictBtn) return;
  
  if (isRestricted) {
    restrictBtn.textContent = "Unrestrict User";
    restrictBtn.className = "restrict-btn restricted";
    restrictBtn.title = "Click to allow user to send messages";
  } else {
    restrictBtn.textContent = "Restrict User";
    restrictBtn.className = "restrict-btn";
    restrictBtn.title = "Click to prevent user from sending messages";
  }
}

// Load Room Messages
async function loadRoomMessages(roomId, page = 1, append = false) {
  if (isLoadingMessages) return;
  
  isLoadingMessages = true;
  
  // Show loading indicator when loading older messages
  if (append) {
    const loadingIndicator = document.getElementById('loadingMore');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'flex';
    }
  }
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/messages/personal-messages/${roomId}?page=${page}&limit=${messageLimit}`,
      {
        headers: {
          Authorization: `${accessToken}`,
        },
      }
    );
    const result = await response.json();

    if (result.success && result.result) {
      let messagesArray = result.result.messages;
      currentPage = result.result.currentPage;
      totalPages = result.result.totalPages;

      // If messages is an object with numeric keys, convert to array
      if (!Array.isArray(messagesArray)) {
        messagesArray = Object.values(messagesArray);
      }

      // Messages come in desc order (newest first), reverse to show oldest first
      displayMessageHistory(messagesArray.reverse(), append);
    }
  } catch (error) {
    console.error("Failed to load messages:", error);
  } finally {
    isLoadingMessages = false;
    
    // Hide loading indicator
    const loadingIndicator = document.getElementById('loadingMore');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }
}

// Display Message History
function displayMessageHistory(messages, append = false) {
  const chatMessages = document.getElementById("chatMessages");
  
  if (!append) {
    chatMessages.innerHTML = "";
  }

  if (messages.length === 0 && !append) {
    chatMessages.innerHTML = `
            <div class="empty-state">
                <h3>No messages yet</h3>
                <p>Start the conversation by sending a message</p>
            </div>
        `;
    return;
  }

  // Save scroll position before adding messages (for appending old messages)
  const scrollHeight = chatMessages.scrollHeight;
  const scrollTop = chatMessages.scrollTop;
  
  messages.forEach((msg) => {
    const type = msg.senderType === "admin" ? "sent" : "received";
    addMessage(msg.content, type, msg.createdAt, false, [], append);
  });

  if (append) {
    // Restore scroll position after adding older messages at top
    const newScrollHeight = chatMessages.scrollHeight;
    chatMessages.scrollTop = scrollTop + (newScrollHeight - scrollHeight);
  } else {
    scrollToBottom();
  }
}

// Setup Infinite Scroll
function setupInfiniteScroll() {
  const chatMessages = document.getElementById("chatMessages");
  
  // Remove existing listener if any
  chatMessages.removeEventListener('scroll', handleScroll);
  
  // Add scroll listener
  chatMessages.addEventListener('scroll', handleScroll);
}

// Handle Scroll Event
function handleScroll() {
  const chatMessages = document.getElementById("chatMessages");
  
  // Check if scrolled to top (with 100px threshold)
  if (chatMessages.scrollTop < 100 && currentPage < totalPages && !isLoadingMessages) {
    // Load next page of older messages
    loadRoomMessages(currentRoomId, currentPage + 1, true);
  }
}

// WebSocket Connection
function connectWebSocket() {
  // Generate admin ID from token or use a unique ID
  adminId = localStorage.getItem("adminId") || "admin_" + Date.now();
  localStorage.setItem("adminId", adminId);

  if (socket) {
    socket.close();
  }

  socket = new WebSocket(`${WS_URL}?adminToken=${accessToken}`);

  socket.onopen = () => {
    console.log("✅ Admin WebSocket connected");
    updateStatus("online", "Online");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
    updateStatus("offline", "Connection error");
  };

  socket.onclose = () => {
    console.log("🔴 WebSocket disconnected");
    updateStatus("offline", "Disconnected");
    setTimeout(connectWebSocket, 3000);
  };
}

// Handle WebSocket Messages
function handleWebSocketMessage(data) {
  switch (data.type) {
    case "new-message":
      if (data.from === "client") {
        // If this is the current chat, add the message immediately
        if (data.clientId === currentClientId) {
          addMessage(data.message.content, "received", data.message.createdAt);
          playNotificationSound();
        }

        // Always reload rooms to update last message and unseen count
        loadChatRooms();
      }
      break;
    case "message-history":
      displayMessageHistory(data.messages);
      break;
  }
}

// Show uploading state
function showUploadingState(show) {
  const sendBtn = document.querySelector('.chat-input-wrapper button[onclick="sendMessage()"]');
  const messageInput = document.getElementById('messageInput');
  const attachBtn = document.querySelector('.attach-btn');
  
  if (show) {
    if (sendBtn) sendBtn.disabled = true;
    if (messageInput) messageInput.disabled = true;
    if (attachBtn) attachBtn.disabled = true;
    if (sendBtn) {
      sendBtn.innerHTML = `
        <svg style="animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
      `;
    }
  } else {
    if (sendBtn) sendBtn.disabled = false;
    if (messageInput) messageInput.disabled = false;
    if (attachBtn) attachBtn.disabled = false;
    if (sendBtn) {
      sendBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      `;
    }
  }
}

// Send Message
function sendMessage() {
  const input = document.getElementById("messageInput");
  const content = input.value.trim();

  if (!content && selectedFiles.length === 0) return;
  if (!currentClientId) return;

  // If there are files, upload them first
  if (selectedFiles.length > 0) {
    sendMessageWithFiles(content);
  } else {
    sendTextMessage(content);
  }
}

// Send text message only
function sendTextMessage(content) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "admin-message",
        clientId: currentClientId,
        content,
      })
    );

    addMessage(content, "sent", new Date().toISOString());
    document.getElementById("messageInput").value = "";

    // Update room list
    setTimeout(() => loadChatRooms(), 500);
  } else {
    alert("Connection lost. Reconnecting...");
    connectWebSocket();
  }
}

// Send message with files
async function sendMessageWithFiles(content) {
  if (isUploadingFiles) return; // Prevent double submission
  
  try {
    isUploadingFiles = true;
    showUploadingState(true);
    
    // Upload files first
    const fileUrls = await uploadFiles();

    showUploadingState(false);
    isUploadingFiles = false;

    if (!fileUrls) {
      alert("Failed to upload files");
      return;
    }

    // Create message content with file URLs
    let messageContent = content;
    if (fileUrls.length > 0) {
      messageContent += "\n" + fileUrls.map((url) => `📎 ${url}`).join("\n");
    }

    // Send via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "admin-message",
          clientId: currentClientId,
          content: messageContent,
        })
      );

      // Add to UI
      addMessage(content, "sent", new Date().toISOString(), true, fileUrls);

      // Clear input
      document.getElementById("messageInput").value = "";
      selectedFiles = [];
      document.getElementById("filePreview").style.display = "none";

      // Update room list
      setTimeout(() => loadChatRooms(), 500);
    }
  } catch (error) {
    console.error("Error sending message with files:", error);
    alert("Failed to send message with files");
  } finally {
    showUploadingState(false);
    isUploadingFiles = false;
  }
}

// Upload files
async function uploadFiles() {
  try {
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("messageFiles", file);
    });

    const response = await fetch(`${API_BASE_URL}/messages/generate-url`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return result.result;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

// Handle file selection
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  selectedFiles = files;

  if (files.length > 0) {
    const filePreview = document.getElementById("filePreview");
    const fileName = document.getElementById("fileName");

    if (files.length === 1) {
      fileName.textContent = files[0].name;
    } else {
      fileName.textContent = `${files.length} files selected`;
    }

    filePreview.style.display = "block";
  }
}

// Remove selected files
function removeFile() {
  selectedFiles = [];
  document.getElementById("filePreview").style.display = "none";
  document.getElementById("fileInput").value = "";
}

// Helper function to check if URL is an image
function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)$/i.test(url);
}

// Helper function to check if URL is a video
function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url);
}

// Open media in modal
function openMediaModal(url, isVideo = false) {
  const modal = document.getElementById('mediaModal');
  const modalContent = document.getElementById('modalContent');
  
  modalContent.innerHTML = '';
  
  if (isVideo) {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '80vh';
    modalContent.appendChild(video);
  } else {
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '80vh';
    img.style.objectFit = 'contain';
    modalContent.appendChild(img);
  }
  
  modal.style.display = 'flex';
}

// Close media modal
function closeMediaModal() {
  const modal = document.getElementById('mediaModal');
  const modalContent = document.getElementById('modalContent');
  
  // Stop any playing video
  const video = modalContent.querySelector('video');
  if (video) {
    video.pause();
    video.src = '';
  }
  
  modal.style.display = 'none';
  modalContent.innerHTML = '';
}

// Helper function to parse message content and extract URLs
function parseMessageContent(content) {
  const urls = [];
  let textContent = content;

  // Extract URLs from content (format: 📎 URL)
  const urlPattern = /📎\s*(https?:\/\/[^\s]+)/g;
  let match;

  while ((match = urlPattern.exec(content)) !== null) {
    urls.push(match[1]);
  }

  // Remove URL lines from text content
  textContent = content.replace(urlPattern, "").trim();

  return { text: textContent, urls };
}

// Add Message to UI
function addMessage(content, type, timestamp, scroll = true, files = [], prepend = false) {
  const chatMessages = document.getElementById("chatMessages");
  const emptyState = chatMessages.querySelector(".empty-state");

  if (emptyState) {
    emptyState.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  // Parse content to extract URLs and text
  const parsed = parseMessageContent(content);

  // Add text content if exists
  if (parsed.text) {
    const textDiv = document.createElement("div");
    textDiv.textContent = parsed.text;
    messageContent.appendChild(textDiv);
  }

  // Combine parsed URLs and passed files array
  const allFiles = [...new Set([...parsed.urls, ...files])];

  // Add files if any
  if (allFiles.length > 0) {
    const filesDiv = document.createElement("div");
    filesDiv.className = "message-files";

    allFiles.forEach((url) => {
      if (isImageUrl(url)) {
        // Display as image with modal
        const imgContainer = document.createElement("div");
        imgContainer.className = "message-image-container";

        const img = document.createElement("img");
        img.src = url;
        img.className = "message-image";
        img.alt = "Uploaded image";
        img.onclick = () => openMediaModal(url, false);
        img.style.cursor = "pointer";

        imgContainer.appendChild(img);
        filesDiv.appendChild(imgContainer);
      } else if (isVideoUrl(url)) {
        // Display as video thumbnail with play icon
        const videoContainer = document.createElement("div");
        videoContainer.className = "message-video-container";
        videoContainer.style.position = "relative";
        videoContainer.style.cursor = "pointer";
        videoContainer.onclick = () => openMediaModal(url, true);
        
        const video = document.createElement("video");
        video.src = url;
        video.className = "message-image";
        video.style.maxWidth = "250px";
        video.style.borderRadius = "8px";
        
        // Play icon overlay
        const playIcon = document.createElement("div");
        playIcon.innerHTML = `
          <svg style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 48px; height: 48px; background: rgba(0,0,0,0.6); border-radius: 50%; padding: 12px;" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        `;
        
        videoContainer.appendChild(video);
        videoContainer.appendChild(playIcon);
        filesDiv.appendChild(videoContainer);
      } else {
        // Display as file link
        const fileName = url.split("/").pop();
        // Decode URL-encoded filename and remove hash/timestamp
        const decodedName = decodeURIComponent(fileName)
          .replace(/_\d+\./g, '.') // Remove timestamps like _1234567890.
          .replace(/^\d+-/, ''); // Remove leading numbers like 12345-
        
        const fileLink = document.createElement("a");
        fileLink.href = url;
        fileLink.target = "_blank";
        fileLink.className = `file-link ${type}`;
        fileLink.textContent = `📎 ${decodedName || 'File'}`;
        fileLink.title = url; // Show full URL on hover
        filesDiv.appendChild(fileLink);
      }
    });

    messageContent.appendChild(filesDiv);
  }

  const timeDiv = document.createElement("div");
  timeDiv.className = "message-time";

  // Show full time in message bubble
  const date = new Date(timestamp);
  const timeString = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  timeDiv.textContent = timeString;

  messageDiv.appendChild(messageContent);
  messageDiv.appendChild(timeDiv);
  
  if (prepend) {
    // Add at the beginning for older messages
    chatMessages.insertBefore(messageDiv, chatMessages.firstChild);
  } else {
    // Add at the end for new messages
    chatMessages.appendChild(messageDiv);
  }

  if (scroll) {
    scrollToBottom();
  }
}

// Update Status
function updateStatus(status, text) {
  const statusEl = document.getElementById("chatStatus");
  const textEl = document.getElementById("chatStatusText");

  if (statusEl && textEl) {
    statusEl.className = `status ${status}`;
    textEl.textContent = text;
  }
}

// Format Time - Always show real time
function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    // Today - show time only
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffInDays === 1) {
    // Yesterday
    return "Yesterday";
  } else if (diffInDays < 7) {
    // Within a week - show day name
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    // Older - show date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

// Handle Enter Key
function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Scroll to Bottom
function scrollToBottom() {
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Play Notification Sound
function playNotificationSound() {
  // Add notification sound if needed
}
