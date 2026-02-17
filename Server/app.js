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

// ✅ 1. Database Connection (Ye add karna zaroori hai)
const MONGO_URL = process.env.MONGODB_URL; 
if (!MONGO_URL) {
    console.error("CRITICAL ERROR: MONGODB_URL is not defined in Environment Variables!");
}

mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err.message));

const JWT_SECRET = process.env.JWT_SECRET || "abhishek";
const CLIENT_URL = process.env.CLIENT_URL || "https://quickchat-drab.vercel.app";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "https://quickchat-drab.vercel.app",
  CLIENT_URL 
];

// ✅ 2. CORS Configuration
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

// ✅ 3. Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

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
  if (socket.user) {
      console.log("User connected:", socket.user.email);
  }
  
  // Room logic... (Keep your existing socket event listeners here)
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ✅ 4. Render Port Binding
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
