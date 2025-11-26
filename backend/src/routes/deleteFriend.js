import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { user_id, friend_id } = req.body;

    if (!user_id || !friend_id)
      return res.status(400).json({ error: "Faltan campos" });

    const { data: friendships } = await supabaseAdmin
      .from("friends")
      .select("id")
      .or(
        `and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`
      );

    if (!friendships || friendships.length === 0) return res.json({ ok: true });

    const ids = friendships.map((f) => f.id);

    await supabaseAdmin.from("notifications").delete().in("friendship_id", ids);
    await supabaseAdmin.from("friends").delete().in("id", ids);

    return res.json({ ok: true });
  } catch (e) {
    console.error("[DELETE FRIEND ERROR]", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
