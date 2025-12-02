// ============================================================
// Load environment variables first
// ============================================================
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================
// Express App
// ============================================================
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// For local path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// ROUTES IMPORTS (MODULAR)
// ============================================================
import healthRouter from "./routes/health.js";
import profileRouter from "./routes/profile.js";
import friendsRouter from "./routes/friends.js";
import addFriendRouter from "./routes/addFriend.js";
import deleteFriendRouter from "./routes/deleteFriend.js";
import notificationsRouter from "./routes/notifications.js";
import searchRouter from "./routes/search.js";
import tripsRouter from "./routes/trips.js";
import usersRouter from "./routes/users.js";
import shopRouter from './routes/shop.js';
import balanceRouter from './routes/balance.js'; 
import purchasesRouter from "./routes/purchases.js";
import messagesRouter from "./routes/messages.js";

// ❗ LAS QUE FALTABAN
import avatarRouter from "./routes/avatar.js";
import friendRequestRouter from "./routes/friendRequest.js";

// ============================================================
// ROUTES MOUNTING
// ============================================================
app.use("/api/health", healthRouter);
app.use("/api/profile", profileRouter);

app.use("/api/friends", friendsRouter);
app.use("/api/add-friend", addFriendRouter);
app.use("/api/delete-friend", deleteFriendRouter);

app.use("/api/notifications", notificationsRouter);
app.use("/api/search", searchRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/users", usersRouter);
app.use('/api/shop', shopRouter);
app.use('/api/balance', balanceRouter);
app.use("/api/purchases", purchasesRouter);

app.use("/api/avatar", avatarRouter);
app.use("/api/friend-request", friendRequestRouter);

app.use("/api/messages", messagesRouter);

// ============================================================
// FRONTEND STATIC FILES
// ============================================================
const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));

// All non-API routes → return frontend
app.get("/*", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ============================================================
// EXPORT APP (server.js inicia el servidor)
// ============================================================
export default app;
