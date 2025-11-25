import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { Buffer } from "buffer";

const router = Router();

// Subir avatar
router.post("/upload", async (req, res) => {
  try {
    const { userId, imageBase64 } = req.body;
    if (!userId || !imageBase64)
      return res.status(400).json({ error: "Faltan datos" });

    // Obtener avatar anterior
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (fetchError) return res.status(500).json({ error: fetchError.message });

    if (userData?.avatar_url) {
      const oldFileName = userData.avatar_url.split("/").pop().split("?")[0];
      await supabaseAdmin.storage
        .from("profile-pictures")
        .remove([oldFileName]);
    }

    // Subir nuevo avatar
    const buffer = Buffer.from(imageBase64, "base64");
    const fileName = `${userId}-${Date.now()}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("profile-pictures")
      .upload(fileName, buffer, {
        upsert: true,
        contentType: "image/png",
      });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    // URL pública
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    // Guardar en usuario
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) return res.status(500).json({ error: updateError.message });

    res.json({ ok: true, avatar_url: publicUrl });
  } catch (e) {
    console.error("[UPLOAD AVATAR ERROR]", e);
    res.status(500).json({ error: "Error interno subiendo avatar" });
  }
});

// Eliminar avatar
router.post("/delete", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Falta userId" });

    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (fetchError) return res.status(500).json({ error: fetchError.message });

    if (userData?.avatar_url) {
      const oldFileName = userData.avatar_url.split("/").pop().split("?")[0];
      await supabaseAdmin.storage
        .from("profile-pictures")
        .remove([oldFileName]);
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) return res.status(500).json({ error: updateError.message });

    res.json({ ok: true });
  } catch (e) {
    console.error("[DELETE AVATAR ERROR]", e);
    res
      .status(500)
      .json({ error: "Error interno eliminando avatar" });
  }
});

export default router;
