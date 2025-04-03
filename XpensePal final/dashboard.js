function logout() {
    window.location.href = 'index.html';
}

function createRoom() {
    const roomCode = generateRoomCode();
    showRoomCodeModal(roomCode);
}

function showRoomCodeModal(roomCode) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Room Created Successfully!</h2>
            <p>Share this code with your friends to join:</p>
            <div class="room-code-container">
                <input type="text" value="${roomCode}" id="roomCodeInput" readonly>
                <button onclick="copyRoomCode()" class="btn-copy" id="copyButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="13" height="13" x="9" y="9" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy Code
                </button>
            </div>
            <div class="modal-footer">
                <button onclick="goToExpensePage()" class="btn-join">Continue to Expenses</button>
                <button onclick="closeModal()" class="btn-close">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function copyRoomCode() {
    const roomCodeInput = document.getElementById('roomCodeInput');
    const copyButton = document.getElementById('copyButton');
    
    try {
        await navigator.clipboard.writeText(roomCodeInput.value);
        
        // Show success state
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5"/>
            </svg>
            Copied!
        `;
        copyButton.classList.add('copied');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.classList.remove('copied');
        }, 2000);
    } catch (err) {
        // Fallback for older browsers
        roomCodeInput.select();
        document.execCommand('copy');
        
        const originalText = copyButton.innerHTML;
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    }
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function joinRoom() {
    showJoinRoomModal();
}

function showJoinRoomModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Join Room</h2>
            <p>Enter the 6-character room code shared with you:</p>
            <div class="room-code-container">
                <input type="text" 
                       id="joinRoomInput" 
                       placeholder="Enter code" 
                       maxlength="6" 
                       oninput="this.value = this.value.toUpperCase()"
                       pattern="[A-Z0-9]{6}"
                       autocomplete="off">
            </div>
            <div class="error-message" id="errorMessage"></div>
            <div class="modal-buttons">
                <button onclick="handleJoinRoom()" class="btn-join">Join Room</button>
                <button onclick="closeModal()" class="btn-cancel">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const input = document.getElementById('joinRoomInput');
    input.focus();
    
    // Add input validation
    input.addEventListener('input', function() {
        const errorMessage = document.getElementById('errorMessage');
        if (this.value.length > 0 && this.value.length < 6) {
            errorMessage.textContent = 'Room code must be 6 characters';
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}

function handleJoinRoom() {
    const roomCodeInput = document.getElementById('joinRoomInput');
    const errorMessage = document.getElementById('errorMessage');
    const roomCode = roomCodeInput.value.toUpperCase();
    
    if (!roomCode) {
        errorMessage.textContent = 'Please enter a room code';
        errorMessage.style.display = 'block';
        return;
    }
    
    if (roomCode.length !== 6) {
        errorMessage.textContent = 'Room code must be 6 characters';
        errorMessage.style.display = 'block';
        return;
    }
    
    if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
        errorMessage.textContent = 'Invalid room code format';
        errorMessage.style.display = 'block';
        return;
    }
    
    // Store room code and redirect to expense page
    localStorage.setItem('currentRoom', roomCode);
    goToExpensePage();
}

function goToExpensePage() {
    window.location.href = 'expense.html';
}

function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}