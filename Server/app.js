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

const MONGO_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/User";
const JWT_SECRET = process.env.JWT_SECRET || "abhishek";
// ✅ Allowed Origins for Production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "https://quickchat-drab.vercel.app" // Aapka Vercel URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps/Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Socket.io configuration mein bhi same origins dalein
const io = new Server(server, {
  cors: {
    origin: "https://quickchat-drab.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.use(cookieParser());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/products", productRoutes);

const server = createServer(app);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error("Authentication error: no token"));

  try {
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: invalid token"));
  }
});

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.email);

  socket.on("roomNumber", (roomName) => {
    socket.join(roomName);

    if (!onlineUsers[roomName]) {
      onlineUsers[roomName] = [];
    }

    if (!onlineUsers[roomName].includes(socket.user.email)) {
      onlineUsers[roomName].push(socket.user.email);
    }

    io.to(roomName).emit("onlineUsers", onlineUsers[roomName]);
    io.to(roomName).emit("message", `${socket.user.email} joined ${roomName}`);
  });

  socket.on("sendRoomMessage", ({ room, msg, sender }) => {
    io.to(room).emit("message", `${sender}: ${msg}`);
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    if (onlineUsers[room]) {
      onlineUsers[room] = onlineUsers[room].filter(
        (u) => u !== socket.user.email
      );
      io.to(room).emit("onlineUsers", onlineUsers[room]);
    }
    io.to(room).emit("message", `${socket.user.email} left ${room}`);
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("typing", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.email);
  });
});

const PORT = process.env.SERVER_PORT || 3000;
server.listen(PORT, "localhost", () => {
  console.log(`Server running on port ${PORT}`);
});
