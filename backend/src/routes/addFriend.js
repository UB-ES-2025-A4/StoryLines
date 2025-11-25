import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { user_id, friend_id } = req.body;
    if (!user_id || !friend_id)
      return res.status(400).json({ error: "Faltan campos" });

    const { error } = await supabaseAdmin
      .from("friends")
      .insert([{ user_id, friend_id }]);

    if (error) throw error;

    res.json({ ok: true });
  } catch (e) {
    console.error("[ADD FRIEND ERROR]", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
