# 🚀 Anywhere Drop — Serverless Peer-to-Peer (P2P) WebRTC File Sharing

[![JavaScript](https://img.shields.io/badge/Language-Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WebRTC](https://img.shields.io/badge/Protocol-WebRTC%20DataChannel-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Zero Server](https://img.shields.io/badge/Architecture-Serverless%20P2P-00C853?style=for-the-badge)](README.md)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Anywhere Drop** is a zero-dependency, serverless peer-to-peer (P2P) file sharing application built with pure HTML5, vanilla JavaScript, and **WebRTC DataChannels**. Send files directly from device to device with **no file size limits**, **no intermediary cloud storage**, and **end-to-end encrypted direct transfers**.

---

## 📌 How P2P DataChannel Transfers Work

```
[ Sender Browser ]                                      [ Receiver Browser ]
       |                                                         |
       | <------------- Signaling (Room Code Exchange) ---------> |
       |                                                         |
       +=========================================================+
       |             Direct Encrypted WebRTC DataChannel         |
       |         (Bytes stream peer-to-peer over local/WAN)      |
       +=========================================================+
       |                                                         |
[ Local File Read ]                                      [ File Blob Download ]
```

1. **Host a Room:** Generates a short room code or direct share link.
2. **Join Room:** Receiver inputs code or clicks link to perform WebRTC handshake.
3. **Direct Transfer:** Files are chunked into binary ArrayBuffers and streamed directly between browser sessions at full network speed.
4. **Zero Cloud Ingestion:** Files never touch an external server or third-party database.

---

## 📁 Repository Structure

```text
anywhere-drop/
├── index.html          # Clean, responsive file transfer UI & dropzone
├── app.js              # Pure WebRTC DataChannel connection & chunk streaming logic
├── LICENSE             # MIT License
└── README.md
```

---

## 🚀 Usage

No complex backend setup required! You can serve the static files with any HTTP server:

```bash
git clone https://github.com/Tarunjit45/anywhere-drop.git
cd anywhere-drop

# Run with any static server (e.g. Python, Node, or VS Code Live Server)
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) on two devices or browser tabs to start sending files instantly.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
