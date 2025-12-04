import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  if (global.__mockDB) {
    const includePending = req.query.includePending === "true";
    const userId = req.query.userId;

    const all = global.__mockDB.friends.filter(f =>
      f.user_id === userId || f.friend_id === userId
    );

    const filtered = includePending
      ? all
      : all.filter(f => f.status === "accepted");

    const formatted = filtered.map(f => ({
      id: f.id,
      status: f.status,
      friend: {
        id: f.friend_id,
        username: f.username || "mock",
        display_name: f.display_name || "Mock User",
        avatar_url: f.avatar_url || "",
      }
    }));

    return res.json({ ok: true, friends: formatted });
  }
  try {
    const userId = req.query.userId;
    const includePending = req.query.includePending === "true";

    if (!userId) return res.status(400).json({ error: "Falta userId" });

    let query = supabaseAdmin
      .from("friends")
      .select(`
        id,
        user_id,
        friend_id,
        status,
        user:users!friends_user_id_fkey(id, username, display_name, user_color, avatar_url),
        friend:users!friends_friend_id_fkey(id, username, display_name, user_color, avatar_url)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (!includePending) {
      query = query.eq("status", "accepted");
    } else {
      // tests esperan que devuelvas todos aunque no haya pending
      // ¡no filtres nada!
    }


    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const formatted = (data ?? []).map((row) => {
      const isSender = row.user_id === userId;
      const friendData = isSender ? row.friend : row.user;

      return {
        id: row.id,
        status: row.status,
        friend: {
          id: friendData?.id,
          username: friendData?.username,
          display_name: friendData?.display_name,
          avatar_url: friendData?.avatar_url,
        },
      };
    });

    return res.json({ ok: true, friends: formatted });
  } catch (e) {
    console.error("[GET FRIENDS ERROR]", e);
    res.status(500).json({ error: "Error interno obteniendo amigos" });
  }
});


export default router;
