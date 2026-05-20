let peer = null;
let connection = null;

const statusMsg = document.getElementById('status-msg');
const setupArea = document.getElementById('setup-area');
const shareArea = document.getElementById('share-area');
const hostView = document.getElementById('host-view');
const joinView = document.getElementById('join-view');
const roomCodeText = document.getElementById('room-code-text');
const roomLinkText = document.getElementById('room-link-text');
const inputRoomCode = document.getElementById('input-room-code');
const btnJoin = document.getElementById('btn-join');
const fileInput = document.getElementById('file-input');
const progress = document.getElementById('progress');
const downloadLink = document.getElementById('download-link');

// Robust ICE configuration to help punch through strict network firewalls
const iceConfig = {
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    }
};

// Generate or extract 6-digit room token from URL hash
let roomCode = window.location.hash.substring(1);
const isHost = !roomCode; 

if (isHost) {
    // Generate a random 6-digit room code for the host (Laptop)
    roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    window.location.hash = roomCode;
    
    hostView.style.display = "block";
    joinView.style.display = "none";
    roomCodeText.innerText = roomCode;
    roomLinkText.innerText = `Or visit: ${window.location.origin}/#${roomCode}`;
    
    // Initialize host peer using the room code as its ID
    peer = new Peer(`anywhr-drop-${roomCode}`, iceConfig);
    statusMsg.innerText = "Waiting for mobile phone to join...";
    
    // Listen for incoming connection from mobile phone
    peer.on('connection', (conn) => {
        connection = conn;
        setupDataChannel();
    });

    peer.on('error', (err) => {
        console.error(err);
        statusMsg.innerText = "Connection error. Retrying...";
    });
} else {
    // This device is the client (Phone) joining an existing code
    hostView.style.display = "none";
    joinView.style.display = "block";
    inputRoomCode.value = roomCode;
    statusMsg.innerText = "Ready to connect.";
    
    peer = new Peer(iceConfig); // Random client ID

    peer.on('error', (err) => {
        console.error(err);
        statusMsg.innerText = "Error linking to server.";
    });
}

// Client manually clicking connect or automated via URL
btnJoin.onclick = () => {
    const targetCode = inputRoomCode.value.trim();
    if (targetCode.length !== 6) return alert("Please enter a valid 6-digit code");
    
    statusMsg.innerText = "Connecting... Please keep this tab active on both devices.";
    connection = peer.connect(`anywhr-drop-${targetCode}`, {
        reliable: true
    });
    setupDataChannel();
};

// Handle data transfer logic
function setupDataChannel() {
    connection.on('open', () => {
        setupArea.style.display = 'none';
        shareArea.style.display = 'block';
        statusMsg.innerText = "Connected Peer-to-Peer natively!";
    });

    connection.on('close', () => {
        statusMsg.innerText = "Connection lost. Please refresh pages to reconnect.";
        setupArea.style.display = 'block';
        shareArea.style.display = 'none';
    });

    let receivedChunks = [];
    let fileMeta = null;

    connection.on('data', (data) => {
        // Handle metadata JSON string
        if (typeof data === 'string') {
            fileMeta = JSON.parse(data);
            receivedChunks = [];
            progress.style.display = 'block';
            progress.value = 0;
            return;
        }

        // Handle raw file data chunks
        receivedChunks.push(data);
        let currentSize = receivedChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
        progress.value = (currentSize / fileMeta.size) * 100;

        if (currentSize === fileMeta.size) {
            const blob = new Blob(receivedChunks);
            const url = URL.createObjectURL(blob);
            downloadLink.innerHTML = `<a href="${url}" download="${fileMeta.name}" style="color:#3b82f6; display:block; margin-top:1rem; font-weight:bold;">📥 Download ${fileMeta.name}</a>`;
            progress.style.display = 'none';
        }
    });
}

// Send file implementation broken into 16KB binary chunks
fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file || !connection) return;

    // Send metadata details first
    connection.send(JSON.stringify({ name: file.name, size: file.size }));

    const chunkSize = 16384; 
    const reader = new FileReader();
    let offset = 0;

    reader.onload = (e) => {
        connection.send(e.target.result);
        offset += e.target.result.byteLength;
        if (offset < file.size) {
            readNextChunk();
        }
    };

    const readNextChunk = () => {
        const slice = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(slice);
    };

    readNextChunk();
};
