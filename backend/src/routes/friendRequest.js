import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

function buildDisplayName(user) {
  return user?.display_name || user?.username || "Alguien";
}

router.post("/respond", async (req, res) => {
  try {
    const { friendship_id, action, currentUserId } = req.body;

    if (!friendship_id || !action || !currentUserId)
      return res.status(400).json({ error: "Faltan campos" });

    const { data: friendship, error: fErr } = await supabaseAdmin
      .from("friends")
      .select("*")
      .eq("id", friendship_id)
      .single();

    if (fErr) throw fErr;

    if (!friendship) return res.status(404).json({ error: "Amistad no encontrada" });

    if (friendship.status !== "pending")
      return res.status(400).json({ error: "La solicitud ya fue gestionada" });

    const { user_id: senderId, friend_id: receiverId } = friendship;

    if (currentUserId !== senderId && currentUserId !== receiverId)
      return res.status(403).json({ error: "No autorizado" });

    // ACEPTAR
    if (action === "accept") {
      await supabaseAdmin.from("friends").update({ status: "accepted" }).eq("id", friendship_id);

      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, username, display_name")
        .in("id", [senderId, receiverId]);

      const u1 = users.find((u) => u.id === senderId);
      const u2 = users.find((u) => u.id === receiverId);

      const msg = `Solicitud aceptada, ahora ${buildDisplayName(u1)} y ${buildDisplayName(
        u2
      )} sois amigos.`;

      await supabaseAdmin.from("notifications").delete().eq("friendship_id", friendship_id);

      await supabaseAdmin.from("notifications").insert([
        {
          receptor_id: senderId,
          sender_id: currentUserId,
          friendship_id,
          type: "friend-accepted",
          message: msg,
        },
        {
          receptor_id: receiverId,
          sender_id: currentUserId,
          friendship_id,
          type: "friend-accepted",
          message: msg,
        },
      ]);

      return res.json({ ok: true, status: "accepted" });
    }

    // RECHAZAR
    if (action === "reject") {
      await supabaseAdmin.from("notifications").delete().eq("friendship_id", friendship_id);
      await supabaseAdmin.from("friends").delete().eq("id", friendship_id);

      return res.json({ ok: true, status: "rejected" });
    }

    return res.status(400).json({ error: "Acción desconocida" });
  } catch (e) {
    console.error("[FRIEND RESP ERROR]", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
