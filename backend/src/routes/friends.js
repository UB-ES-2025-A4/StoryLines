import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "Falta userId" });

    const { data, error } = await supabaseAdmin
      .from("friends")
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        user:users!friends_user_id_fkey(id, username, display_name, user_color, avatar_url),
        friend:users!friends_friend_id_fkey(id, username, display_name, user_color, avatar_url)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) return res.status(500).json({ error: error.message });

    const formatted = data.map(row => {
      const isSender = row.user_id === userId;
      const friend = isSender ? row.friend : row.user;

      return {
        id: row.id,
        created_at: row.created_at,
        friend,
      };
    });

    res.json({ ok: true, friends: formatted });
  } catch (e) {
    console.error("[GET FRIENDS ERROR]", e);
    res.status(500).json({ error: "Error interno obteniendo amigos" });
  }
});

export default router;
