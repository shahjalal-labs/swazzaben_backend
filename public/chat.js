// Configuration
const API_BASE_URL = 'https://api.lendmora.com/api/v1';
const WS_URL = 'wss://api.lendmora.com/ws';

// Generate or get clientId
const clientId = localStorage.getItem('clientId') || generateClientId();
localStorage.setItem('clientId', clientId);

let socket = null;
let selectedFiles = [];
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let currentPage = 1;
let totalPages = 1;
let isLoadingMessages = false;
let messageLimit = 20;
let currentRoomId = null;
let isUploadingFiles = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    loadMessageHistory();
    setupInfiniteScroll();
});

// Setup Infinite Scroll
function setupInfiniteScroll() {
    const chatMessages = document.getElementById('chatMessages');
    
    chatMessages.addEventListener('scroll', handleScroll);
}

// Handle Scroll Event
function handleScroll() {
    const chatMessages = document.getElementById('chatMessages');
    
    // Check if scrolled to top (with 100px threshold)
    if (chatMessages.scrollTop < 100 && currentPage < totalPages && !isLoadingMessages) {
        // Load next page of older messages
        loadMessageHistory(currentPage + 1, true);
    }
}

// Generate unique client ID
function generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// WebSocket Connection
function connectWebSocket() {
    try {
        socket = new WebSocket(`${WS_URL}?clientId=${clientId}`);

        socket.onopen = () => {
            console.log('✅ WebSocket connected');
            updateConnectionStatus('online', 'Online');
            reconnectAttempts = 0;
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            updateConnectionStatus('offline', 'Connection error');
        };

        socket.onclose = () => {
            console.log('🔴 WebSocket disconnected');
            updateConnectionStatus('offline', 'Disconnected');
            attemptReconnect();
        };
    } catch (error) {
        console.error('Failed to connect:', error);
        updateConnectionStatus('offline', 'Failed to connect');
    }
}

// Handle incoming messages
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'new-message':
            if (data.from === 'admin') {
                addMessage(data.message.content, 'received', data.message.createdAt);
                playNotificationSound();
            }
            break;
        case 'message-history':
            displayMessageHistory(data.messages);
            break;
        case 'error':
            console.error('Server error:', data.message);
            alert(data.message);
            break;
    }
}

// Reconnection logic
function attemptReconnect() {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
        console.log(`Reconnecting in ${delay}ms... (Attempt ${reconnectAttempts})`);
        setTimeout(connectWebSocket, delay);
    }
}

// Update connection status
function updateConnectionStatus(status, text) {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = text;
    statusElement.className = `status ${status}`;
}

// Load message history from API
async function loadMessageHistory(page = 1, append = false) {
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
        // Always use clientId endpoint for getting user messages
        const response = await fetch(
            `${API_BASE_URL}/messages/user/personal-messages/${clientId}?page=${page}&limit=${messageLimit}`
        );
        const result = await response.json();
        
        console.log("chat.js - get the history", result);
        
        if (result.success && result.result) {
            let messagesArray = result.result.messages;
            
            // Check if messages is a string (error message from backend)
            if (typeof messagesArray === 'string') {
                console.log('No messages available:', messagesArray);
                messagesArray = [];
            }
            
            currentPage = result.result.currentPage || 1;
            totalPages = result.result.totalPages || 1;
            
            // If messages is an object with numeric keys, convert to array
            if (!Array.isArray(messagesArray)) {
                messagesArray = Object.values(messagesArray);
            }
            
            console.log("Processed messages:", messagesArray);
            displayMessageHistory(messagesArray.reverse(), append);
        }
    } catch (error) {
        console.error('Failed to load message history:', error);
    } finally {
        isLoadingMessages = false;
        
        // Hide loading indicator
        const loadingIndicator = document.getElementById('loadingMore');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

// Display message history
function displayMessageHistory(messages, append = false) {
    console.log("chat.js - displayMessageHistory", messages);
    const chatMessages = document.getElementById('chatMessages');
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    
    if (messages.length > 0 && welcomeMessage) {
        welcomeMessage.remove();
    }
    
    if (!append) {
        // Clear existing messages only if not appending
        const existingMessages = chatMessages.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
    }
    
    // Save scroll position before adding messages (for appending old messages)
    const scrollHeight = chatMessages.scrollHeight;
    const scrollTop = chatMessages.scrollTop;

    messages.forEach(msg => {
        const type = msg.senderType === 'client' ? 'sent' : 'received';
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

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content && selectedFiles.length === 0) return;
    if (isUploadingFiles) return; // Prevent double submission

    // Upload files first if any
    let fileUrls = [];
    if (selectedFiles.length > 0) {
        isUploadingFiles = true;
        showUploadingState(true);
        
        fileUrls = await uploadFiles();
        console.log(fileUrls)
        
        showUploadingState(false);
        isUploadingFiles = false;
        
        if (!fileUrls) return; // Upload failed
    }

    // Create message content
    let messageContent = content;
    if (fileUrls.length > 0) {
        messageContent += '\n' + fileUrls.map(url => `📎 ${url}`).join('\n');
    }

    // Send via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'client-message',
            content: messageContent
        }));

        // Add to UI
        addMessage(content, 'sent', new Date().toISOString(), true, fileUrls);

        // Clear input
        input.value = '';
        selectedFiles = [];
        document.getElementById('filePreview').style.display = 'none';
    } else {
        alert('Connection lost. Trying to reconnect...');
        connectWebSocket();
    }
}

// Upload files
async function uploadFiles() {
    try {
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('messageFiles', file);
        });

        const response = await fetch(`${API_BASE_URL}/messages/generate-url`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log(result)
        
        if (result.success) {
            console.log("first")
            return result.result;
        } else {
            alert('Failed to upload files');
            return null;
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload files');
        return null;
    }
}

// Helper function to check if URL is an image
function isImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)$/i.test(url);
}

// Helper function to check if URL is a video
function isVideoUrl(url) {
    return /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url);
}

// Show uploading state
function showUploadingState(show) {
    const sendBtn = document.querySelector('.send-btn');
    const messageInput = document.getElementById('messageInput');
    const attachBtn = document.querySelector('.attach-btn');
    
    if (show) {
        sendBtn.disabled = true;
        messageInput.disabled = true;
        attachBtn.disabled = true;
        sendBtn.innerHTML = `
            <svg style="animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </svg>
        `;
    } else {
        sendBtn.disabled = false;
        messageInput.disabled = false;
        attachBtn.disabled = false;
        sendBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
        `;
    }
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
    textContent = content.replace(urlPattern, '').trim();
    
    return { text: textContent, urls };
}

// Add message to UI
function addMessage(content, type, timestamp, scroll = true, files = [], prepend = false) {
    const chatMessages = document.getElementById('chatMessages');
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Parse content to extract URLs and text
    const parsed = parseMessageContent(content);
    
    // Add text content if exists
    if (parsed.text) {
        const textDiv = document.createElement('div');
        textDiv.textContent = parsed.text;
        messageContent.appendChild(textDiv);
    }
    
    // Combine parsed URLs and passed files array
    const allFiles = [...new Set([...parsed.urls, ...files])];

    // Add files if any
    if (allFiles.length > 0) {
        const filesDiv = document.createElement('div');
        filesDiv.className = 'message-files';
        
        allFiles.forEach(url => {
            if (isImageUrl(url)) {
                // Display as image with modal
                const imgContainer = document.createElement('div');
                imgContainer.className = 'message-image-container';
                
                const img = document.createElement('img');
                img.src = url;
                img.className = 'message-image';
                img.alt = 'Uploaded image';
                img.onclick = () => openMediaModal(url, false);
                img.style.cursor = 'pointer';
                
                imgContainer.appendChild(img);
                filesDiv.appendChild(imgContainer);
            } else if (isVideoUrl(url)) {
                // Display as video thumbnail with play icon
                const videoContainer = document.createElement('div');
                videoContainer.className = 'message-video-container';
                videoContainer.style.position = 'relative';
                videoContainer.style.cursor = 'pointer';
                videoContainer.onclick = () => openMediaModal(url, true);
                
                const video = document.createElement('video');
                video.src = url;
                video.className = 'message-image';
                video.style.maxWidth = '250px';
                video.style.borderRadius = '8px';
                
                // Play icon overlay
                const playIcon = document.createElement('div');
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
                const fileName = url.split('/').pop();
                // Decode URL-encoded filename and remove hash/timestamp
                const decodedName = decodeURIComponent(fileName)
                    .replace(/_\d+\./g, '.') // Remove timestamps like _1234567890.
                    .replace(/^\d+-/, ''); // Remove leading numbers like 12345-
                
                const fileLink = document.createElement('a');
                fileLink.href = url;
                fileLink.target = '_blank';
                fileLink.className = `file-link ${type}`;
                fileLink.textContent = `📎 ${decodedName || 'File'}`;
                fileLink.title = url; // Show full URL on hover
                filesDiv.appendChild(fileLink);
            }
        });
        
        messageContent.appendChild(filesDiv);
    }

    messageDiv.appendChild(messageContent);

    if (timestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = formatTime(timestamp);
        messageDiv.appendChild(timeDiv);
    }

    if (prepend) {
        // Add at the beginning for older messages
        const firstMessage = chatMessages.querySelector('.message');
        if (firstMessage) {
            chatMessages.insertBefore(messageDiv, firstMessage);
        } else {
            chatMessages.appendChild(messageDiv);
        }
    } else {
        // Add at the end for new messages
        chatMessages.appendChild(messageDiv);
    }

    if (scroll) {
        scrollToBottom();
    }
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Handle file selection
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    selectedFiles = files;

    if (files.length > 0) {
        const filePreview = document.getElementById('filePreview');
        const fileName = document.getElementById('fileName');
        
        if (files.length === 1) {
            fileName.textContent = files[0].name;
        } else {
            fileName.textContent = `${files.length} files selected`;
        }
        
        filePreview.style.display = 'block';
    }
}

// Remove selected file
function removeFile() {
    selectedFiles = [];
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

// Handle Enter key
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Scroll to bottom
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Toggle chat (for mobile/minimize)
function toggleChat() {
    const container = document.querySelector('.chat-container');
    const toggle = document.getElementById('chatToggle');
    
    if (container.style.display === 'none') {
        container.style.display = 'flex';
        toggle.style.display = 'none';
    } else {
        container.style.display = 'none';
        toggle.style.display = 'flex';
    }
}

// Play notification sound
function playNotificationSound() {
    // You can add a notification sound here
    const audio = new Audio('../public/assets/mixkit-magic-notification-ring-2344.wav');
    audio.play().catch(e => console.log('Could not play sound'));
}

// Fetch history on request
function fetchHistory() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'fetch-history'
        }));
    }
}
