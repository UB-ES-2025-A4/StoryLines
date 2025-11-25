import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import healthRoutes from "./routes/health.js";
import profileRoutes from "./routes/profile.js";
import avatarRoutes from "./routes/avatar.js";
import tripsRoutes from "./routes/trips.js";
import tripByIdRoutes from "./routes/tripById.js";
import friendsRoutes from "./routes/friends.js";
import addFriendRoutes from "./routes/addFriend.js";

const app = express();
app.use(cors());
app.use(express.json());

// Rutas API
app.use("/health", healthRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/avatar", avatarRoutes);
app.use("/api/trips", tripsRoutes);
app.use("/api/trips", tripByIdRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/add-friend", addFriendRoutes);

// Frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../../frontend/dist");

app.use(express.static(frontendPath));
app.get("/*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;
