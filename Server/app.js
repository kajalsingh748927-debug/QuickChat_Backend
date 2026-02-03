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

/* ======================
   CONNECT DATABASE
====================== */
connectDB();

const app = express();

/* ======================
   ALLOWED ORIGINS
====================== */
const allowedOrigins = [
  "http://localhost:5173",
  "https://quickchat-drab.vercel.app",
];

/* ======================
   MIDDLEWARE
====================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / server calls

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* ======================
   ROUTES
====================== */
app.use("/api", authRoutes);
app.use("/api/products", productRoutes);

/* ======================
   HTTP SERVER
====================== */
const server = createServer(app);

/* ======================
   SOCKET.IO
====================== */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

/* ======================
   SOCKET AUTH
====================== */
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication error: No token"));
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
});

/* ======================
   SOCKET EVENTS
====================== */
const onlineUsers = {}; // { room: [emails] }

io.on("connection",

