let peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Free Google STUN server for global routing
});
let dataChannel;

const btnInit = document.getElementById('btn-init');
const btnConnect = document.getElementById('btn-connect');
const txtHandshake = document.getElementById('txt-handshake');
const statusMsg = document.getElementById('status-msg');
const setupArea = document.getElementById('setup-area');
const shareArea = document.getElementById('share-area');
const fileInput = document.getElementById('file-input');

// Device 1: Sender initiates
btnInit.onclick = async () => {
    dataChannel = peerConnection.createDataChannel("fileTransfer");
    setupDataChannelHandlers(dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Wait for ICE candidates to gather completely before showing the string
    peerConnection.onicecandidate = (e) => {
        if (!e.candidate) {
            txtHandshake.value = btoa(JSON.stringify(peerConnection.localDescription));
            statusMsg.innerText = "Copy the code above and send it to your other device.";
        }
    };
};

// Device 2 or 1: Paste and Connect
btnConnect.onclick = async () => {
    const rawData = txtHandshake.value.trim();
    if (!rawData) return alert("Please paste a handshake code first.");
    const signal = JSON.parse(atob(rawData));

    if (signal.type === "offer") {
        // Device 2 receiving the offer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        peerConnection.onicecandidate = (e) => {
            if (!e.candidate) {
                txtHandshake.value = btoa(JSON.stringify(peerConnection.localDescription));
                statusMsg.innerText = "Copy this reply code and paste it back into Device 1.";
            }
        };
    } else if (signal.type === "answer") {
        // Device 1 receiving back the answer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    }
};

// Handle incoming connection (for Receiver)
peerConnection.ondatachannel = (event) => {
    setupDataChannelHandlers(event.channel);
};

function setupDataChannelHandlers(channel) {
    channel.onopen = () => {
        setupArea.style.display = 'none';
        shareArea.style.display = 'block';
        statusMsg.innerText = "Connected directly!";
    };

    let receivedChunks = [];
    let fileMeta = null;

    channel.onmessage = (event) => {
        if (typeof event.data === 'string') {
            fileMeta = JSON.parse(event.data);
            receivedChunks = [];
            document.getElementById('progress').style.display = 'block';
            return;
        }

        receivedChunks.push(event.data);
        let currentSize = receivedChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
        document.getElementById('progress').value = (currentSize / fileMeta.size) * 100;

        if (currentSize === fileMeta.size) {
            const blob = new Blob(receivedChunks);
            const url = URL.createObjectURL(blob);
            const downloadLink = document.getElementById('download-link');
            downloadLink.innerHTML = `<a href="${url}" download="${fileMeta.name}" style="color:#3b82f6; display:block; margin-top:1rem;">📥 Download ${fileMeta.name}</a>`;
            document.getElementById('progress').style.display = 'none';
        }
    };
}

// Sending File Logic (Chunks of 16KB to prevent buffer overflow)
fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;

    const channel = dataChannel || peerConnection.channel; 
    channel.send(JSON.stringify({ name: file.name, size: file.size }));

    const chunkSize = 16384;
    const reader = new FileReader();
    let offset = 0;

    reader.onload = (e) => {
        channel.send(e.target.result);
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
