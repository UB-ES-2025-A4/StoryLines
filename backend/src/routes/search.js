import { Router } from "express";
import { searchUsers, getFriendshipStatus } from "../services/searchService.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// Buscar usuarios
router.get("/users", async (req, res) => {
  const { q, userId } = req.query;

  if (!q) return res.status(400).json({ error: "Missing query q" });
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const term = q.trim().toLowerCase();

  if (term === "") {
    return res.status(404).json({ error: "Empty query" });
  }

  // Buscar en supabase mock
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*");

  if (error) return res.status(500).json({ error });

  const results = data.filter(u =>
    u.username?.toLowerCase().includes(term) ||
    u.display_name?.toLowerCase().includes(term)
  );

  const usersWithStatus = await Promise.all(
    results.map(async (user) => {
      const status = await getFriendshipStatus(userId, user.id);
      return {
        ...user,
        friendshipStatus: status
      };
    })
  );

  return res.json({ ok: true, users: usersWithStatus });
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
