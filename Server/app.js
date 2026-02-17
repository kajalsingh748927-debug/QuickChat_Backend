import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./Router/auth.router.js";
import productRoutes from "./Router/product.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const app = express();
const server = createServer(app);

/* ======================
   DATABASE CONNECTION
====================== */
// Render par MONGODB_URL hona chahiye, Local par default fallback
const MONGO_URI = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/User";

mongoose.connect(MONGO_URI)
  .then(() => console.log("🚀 MongoDB Connected Successfully"))
  .catch(err => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // Server stop kar dega agar DB connect nahi hua
  });

/* ======================
   MIDDLEWARE & CORS
====================== */
const FRONTEND_URL = process.env.CLIENT_URL || "https://quickchat-drab.vercel.app";

app.use(cors({
  origin: [FRONTEND_URL, "http://localhost:5173"],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

/* ======================
   ROUTES
====================== */
app.use("/api", authRoutes);
app.use("/api/products", productRoutes);

/* ======================
   SOCKET.IO SETUP
====================== */
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error: no token"));
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "abhishek";
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: invalid token"));
  }
});

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.user.email);

  socket.on("roomNumber", (roomName) => {
    socket.join(roomName);
    if (!onlineUsers[roomName]) onlineUsers[roomName] = [];
    if (!onlineUsers[roomName].includes(socket.user.email)) {
      onlineUsers[roomName].push(socket.user.email);
    }
    io.to(roomName).emit("onlineUsers", onlineUsers[roomName]);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

/* ======================
   SERVER START (RENDER FIX)
====================== */
// Render automatically PORT variable provide karta hai
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
