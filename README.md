# 💻 Interview Web App

An end-to-end technical interview platform built with React and Express.js. This web app enables **real-time video calling**, **live code collaboration**, and **chat** using **WebRTC**, **WebSockets**, and **Monaco Editor** with **Y.js** for multi-user editing.

---

## 🚀 Features

- 🔗 **Peer-to-peer WebRTC** video/audio calling (serverless)
- 🧑‍💻 **Live collaborative code editor** (Monaco + Y.js)
- 📡 **WebSocket-based** chat and signaling
- 🏠 Create/join **interview rooms**
- ⚡ **Code execution** using [Judge0 API](https://judge0.com/)
- 💬 Realtime chat support during interview
- 🎯 Built for scalability and responsiveness

---

## 🛠 Tech Stack

| Category   | Technologies Used                          |
|------------|---------------------------------------------|
| Frontend   | React, Tailwind CSS, Monaco Editor          |
| Backend    | Node.js, Express.js                         |
| Realtime   | WebRTC, Socket.IO, Y.js (with y-websocket)  |
| Other      | Vite (or CRA), UUID, dotenv, cors           |

---


## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/interview-web-app.git
cd CodeView
cd frontend
npm i
npm run dev


for backend
cd backend
nodemon ./index.js
```
##🧠 How It Works
WebRTC is used to establish a direct video connection between two clients.

Socket.IO (WebSockets) manages signaling messages (offer/answer/candidates) and chat.

Y.js + Monaco Editor enable collaborative editing of code in real-time.




See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

##👨‍💻 Author
Vaidik Saxena
Made with 💣, ☕, and rage 😎
