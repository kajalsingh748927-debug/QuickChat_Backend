import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// __dirname banane ke liye (ESM me direct nahi hota)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Yahan se parent (server folder) ke andar .env dhoondo
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Setup transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass:process.env.SMTP_PASS ,
  },
});

export default transporter;

