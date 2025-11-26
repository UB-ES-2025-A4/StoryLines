import { Router } from "express";
import { searchUsers, getFriendshipStatus } from "../services/searchService.js";

const router = Router();

// Buscar usuarios
router.get("/users", async (req, res) => {
  try {
    const { q, userId } = req.query;

    if (!q) return res.status(400).json({ error: "Falta q" });
    if (!userId) return res.status(400).json({ error: "Falta userId" });

    const results = await searchUsers(q, userId);

    const withStatus = await Promise.all(
      results.map(async (u) => ({
        ...u,
        friendshipStatus: await getFriendshipStatus(userId, u.id),
      }))
    );

    res.json({ users: withStatus });
  } catch (e) {
    console.error("[SEARCH ERROR]", e);
    res.status(500).json({ error: "Error interno" });
  }
});

// Estado de amistad
router.get("/friend-status/:targetUserId", async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ error: "Falta userId" });

    const status = await getFriendshipStatus(userId, targetUserId);

    res.json({ status });
  } catch (e) {
    console.error("[GET FRIEND STATUS ERROR]", e);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
