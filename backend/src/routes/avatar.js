import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { Buffer } from "buffer";

const router = Router();

// Subir avatar
router.post("/upload", async (req, res) => {
  try {
    const { userId, imageBase64, mimeType } = req.body;

    if (!userId || !imageBase64)
      return res.status(400).json({ error: "Faltan datos" });

    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (userData?.avatar_url) {
      const old = userData.avatar_url.split("/").pop().split("?")[0];
      await supabaseAdmin.storage.from("profile-pictures").remove([old]);
    }

    const finalMime = mimeType || "image/png";
    const ext = (finalMime.split("/")[1] || "png").split("+")[0];
    const fileName = `${userId}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(imageBase64, "base64");

    const { error: uploadError } = await supabaseAdmin.storage
      .from("profile-pictures")
      .upload(fileName, buffer, { upsert: true, contentType: finalMime });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: publicData } = supabaseAdmin.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    const publicUrl = publicData?.publicUrl || null;

    await supabaseAdmin
      .from("users")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", userId);

    return res.json({ ok: true, avatar_url: publicUrl });
  } catch (e) {
    console.error("UPLOAD AVATAR ERROR:", e);
    return res.status(500).json({ error: "Error subiendo avatar" });
  }
});

// Eliminar avatar
router.post("/delete", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Falta userId" });

    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (userData?.avatar_url) {
      const old = userData.avatar_url.split("/").pop().split("?")[0];
      await supabaseAdmin.storage.from("profile-pictures").remove([old]);
    }

    await supabaseAdmin
      .from("users")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("id", userId);

    return res.json({ ok: true });
  } catch (e) {
    console.error("DELETE AVATAR ERROR:", e);
    return res.status(500).json({ error: "Error eliminando avatar" });
  }
});

export default router;
