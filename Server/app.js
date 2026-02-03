import express from "express";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import authRoutes from "./Router/auth.router.js";
import productRoutes from "./Router/product.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectDB from "./config/db.js";

// ======================
// CONNECT DB
// ======================
connectDB();

const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://quickchat-drab.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ======================
// ROUTES
// ======================
app.use("/api", authRoutes);
app.use("/api/products", productRoutes);

// ======================
// HTTP SERVER
// ======================
const server = createServer(app);

// ======================
// SOCKET.IO
// ======================
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://quickchat-drab.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ======================
// SOCKET AUTH
// ======================
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication error: no token"));
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: invalid token"));
  }
});

// ======================
// SOCKET EVENTS
// ======================
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.user.email);

  socket.on("roomNumber", (roomName) => {
    socket.join(roomName);

    if (!onlineUsers[roomName]) {
      onlineUsers[roomName] = [];
    }

    if (!onlineUsers[roomName].includes(socket.user.email)) {
      onlineUsers[roomName].push(socket.user.email);
    }

    io.to(roomName).emit("onlineUsers", onlineUsers[roomName]);
    io.to(roomName).emit(
      "message",
      `🔔 ${socket.user.email} joined ${roomName}`
    );
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

    io.to(room).emit(
      "message",
      `🔔 ${socket.user.email} left ${room}`
    );
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("typing", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.user.email);
  });
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
