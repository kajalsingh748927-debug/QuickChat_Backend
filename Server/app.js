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

const app = express(); // ✅ 1. Sabse pehle app initialize karein
const server = createServer(app); // ✅ 2. Phir server create karein

const MONGO_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/User";
const JWT_SECRET = process.env.JWT_SECRET || "abhishek";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "https://quickchat-drab.vercel.app" 
];

// ✅ CORS logic optimized
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api/products", productRoutes);

// ✅ Socket.io configuration correctly initialized
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 

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

// ... (Socket events logic as it was)
io.on("connection", (socket) => {
  console.log("User connected:", socket.user.email);
  // ... (baaki socket logic same rahegi)
});

// ✅ Render FIX: "localhost" hata kar "0.0.0.0" use karein
// Render hamesha process.env.PORT provide karta hai
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
