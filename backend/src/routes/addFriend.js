import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { validateFriendRequest } from "../services/searchService.js";

const router = Router();

function buildDisplayName(user) {
  return user?.display_name || user?.username || "Alguien";
}

router.post("/", async (req, res) => {
  try {
    const { user_id, friend_id } = req.body;

    if (!user_id || !friend_id)
      return res.status(400).json({ error: "Faltan campos" });

    const validation = await validateFriendRequest(user_id, friend_id);

    if (!validation.valid) {
      const status = validation.error.includes("ya") ? 409 : 400;
      return res.status(status).json({ error: validation.error });
    }

    const { data: friendship, error } = await supabaseAdmin
      .from("friends")
      .insert({ user_id, friend_id, status: "pending" })
      .select("*")
      .single();

    if (error) throw error;

    const { data: sender } = await supabaseAdmin
      .from("users")
      .select("username, display_name")
      .eq("id", user_id)
      .single();

    const senderName = buildDisplayName(sender);

    await supabaseAdmin.from("notifications").insert({
      receptor_id: friend_id,
      sender_id: user_id,
      friendship_id: friendship.id,
      type: "friend-approval",
      message: `${senderName} te ha enviado una solicitud de amistad.`,
    });

    return res.json({
      ok: true,
      message: "Solicitud enviada",
      friendshipId: friendship.id,
    });
  } catch (e) {
    console.error("[ADD FRIEND ERROR]", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
