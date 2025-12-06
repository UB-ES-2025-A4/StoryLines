import express from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = express.Router();

router.get("/by-auth/:authId", async (req, res) => {
  const authId = req.params.authId;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .single();

  if (error || !data) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  res.json({ ok: true, id: data.id });
});

export default router;
