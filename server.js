// server.js
import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { createServer } from "http";
import { Server } from "socket.io";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import db, { setupDatabase } from './database.js';

// --- INITIALIZATION ---
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// --- MIDDLEWARE & CONFIG ---
app.use(cors());
app.use(express.json());
const JWT_SECRET = "1234567890abcdef"; // Use a secure secret in production

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // user object from the token (e.g., { id, email })
    next();
  });
};

// --- AUTHENTICATION ROUTES ---
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, mobileNumber } = req.body;

    // 1. Check if the user already exists
    const existingCaretaker = await db('caretakers').where({ email }).first();
    if (existingCaretaker) {
      // 2. If they exist, send a specific '409 Conflict' error
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // 3. If they don't exist, proceed with creation
    const hashedPassword = await bcrypt.hash(password, 10);
    await db('caretakers').insert({ email, password: hashedPassword, mobileNumber });
    res.status(201).json({ message: "Caretaker registered successfully" });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "An unexpected error occurred during registration." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const caretaker = await db('caretakers').where({ email }).first();

    if (caretaker && (await bcrypt.compare(password, caretaker.password))) {
      const accessToken = jwt.sign({ id: caretaker.id, email: caretaker.email }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ accessToken });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).send();
  }
});

// --- PROTECTED API ROUTES ---
app.get("/api/patients", authenticateToken, async (req, res) => {
  const patients = await db('patients').where({ caretakerId: req.user.id });
  res.json(patients);
});

app.post("/api/patients", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    let pin;
    let isUnique = false;
    while (!isUnique) {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await db('patients').where({ pin }).first();
        if (!existing) isUnique = true;
    }

    const [id] = await db('patients').insert({ name, pin, caretakerId: req.user.id });
    const newPatient = await db('patients').where({ id }).first();
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(400).json({ error: "Could not create patient." });
  }
});

// --- SOCKET.IO LOGIC ---
const patientSockets = {}; // Still need this to map PIN to live socket ID

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("registerPatient", async (pin) => {
    const patient = await db('patients').where({ pin }).first();
    if (patient) {
      patientSockets[pin] = socket.id;
      console.log(`Patient registered with valid PIN ${pin}`);
    } else {
      console.log(`Invalid PIN registration attempt: ${pin}`);
    }
  });

  socket.on("sendQuestion", ({ pin, question }) => {
    const patientSocketId = patientSockets[pin];
    if (patientSocketId) {
      io.to(patientSocketId).emit("receiveQuestion", question);
    }
  });

  socket.on("sendAnswer", ({ pin, answer }) => {
    socket.broadcast.emit("receiveAnswer", { pin, answer });
  });

  socket.on("disconnect", () => {
    for (let pin in patientSockets) {
      if (patientSockets[pin] === socket.id) {
        delete patientSockets[pin];
        console.log(`Patient with PIN ${pin} disconnected`);
        break;
      }
    }
  });
});

// This part for the python script can remain the same
function startPythonScripts() {
  const websocketServer = spawn("python", ["websocket_server.py"]);
  websocketServer.stdout.on("data", (data) => console.log(`[Python Script]: ${data}`));
  websocketServer.stderr.on("data", (data) => console.error(`[Python Script]: ${data}`));
}

// --- SERVER START ---
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, async () => {
  await setupDatabase(); // Creates tables if they don't exist
  console.log(`Server running at http://localhost:${PORT}`);
  startPythonScripts();
});