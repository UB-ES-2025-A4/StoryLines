import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Falta userId" });

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select(`
        id,
        type,
        message,
        created_at,
        friendship_id,
        read,
        sender:users!notifications_sender_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          user_color
        )
      `)
      .eq("receptor_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ ok: true, notifications: data });
  } catch (e) {
    console.error("[GET NOTIFS ERROR]", e);
    return res.status(500).json({ error: e.message });
  }
});

router.post("/mark-read", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Falta userId" });

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("receptor_id", userId)
      .eq("read", false);

    if (error) throw error;

    return res.json({ ok: true });
  } catch (e) {
    console.error("[MARK READ ERROR]", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
