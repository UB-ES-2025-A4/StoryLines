import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// ===============================
// UUID v4 helper
// ===============================
const isUUIDv4 = (s = "") =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

// ===============================
// POST /api/profile
// ===============================
router.post("/", async (req, res) => {
  try {
    let { userId, email, username, display_name, bio, avatar_url } = req.body ?? {};
    let id = userId;

    // ===============================
    // 1) Resolver ID por email
    // ===============================
    if (!id) {
      if (!email || typeof email !== "string")
        return res.status(400).json({ error: "Falta userId o email válido" });

      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });

      if (error) return res.status(400).json({ error: error.message });

      const user = data.users.find(
        (u) => (u.email || "").toLowerCase() === email.toLowerCase()
      );

      if (!user)
        return res
          .status(404)
          .json({ error: `No existe un usuario con email ${email}` });

      id = user.id;
    }

    // ===============================
    // 2) Validación de tipos
    // ===============================
    if (!isUUIDv4(id))
      return res.status(400).json({ error: "userId no es un UUID válido" });

    if (username !== undefined && typeof username !== "string")
      return res.status(400).json({ error: "username debe ser string" });

    if (email !== undefined && typeof email !== "string")
      return res.status(400).json({ error: "email debe ser string" });

    // Sanitización
    if (typeof username === "string") username = username.trim();
    if (typeof display_name === "string") display_name = display_name.trim();
    if (typeof bio === "string") bio = bio.trim();
    if (typeof email === "string") email = email.toLowerCase();
    if (typeof avatar_url === "string") avatar_url = avatar_url.trim();

    // ===============================
    // 3) Reglas de negocio
    // ===============================
    if (!username || username.length < 3 || username.length > 15)
      return res
        .status(400)
        .json({ error: "El nombre de usuario debe tener entre 3 y 15 caracteres" });

    if (display_name && display_name.length > 15)
      return res.status(400).json({ error: "Apodo inválido (máx 15 caracteres)" });

    if (bio && bio.length > 150)
      return res
        .status(400)
        .json({ error: "La biografía no puede superar los 150 caracteres" });

    // ===============================
    // 4) Username único
    // ===============================
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", id)
      .limit(1);

    if (existing?.length > 0)
      return res.status(409).json({ error: "Ese nombre de usuario ya está en uso" });

    // ===============================
    // 5) Crear payload para upsert
    // ===============================
    const payload = {
      id,
      username,
      updated_at: new Date().toISOString(),
    };

    if (display_name) payload.display_name = display_name;
    if (bio) payload.bio = bio;
    if (avatar_url) payload.avatar_url = avatar_url;

    // ===============================
    // 6) Upsert final
    // ===============================
    const { data: upserted, error } = await supabaseAdmin
      .from("users")
      .upsert(payload, { onConflict: "id" })
      .select("id, username, display_name, bio, avatar_url");

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      ok: true,
      message: "Perfil guardado",
      data: upserted,
    });
  } catch (e) {
    console.error("[UPDATE PROFILE ERROR]", e);
    return res
      .status(500)
      .json({ error: "Error interno al guardar el perfil" });
  }
});

// ===============================
// GET /api/profile/data
// ===============================
router.get("/data", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ ok: false, error: "Falta userId" });

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error)
      return res.status(500).json({ ok: false, error: error.message });

    return res.json({ ok: true, profile: data });
  } catch (e) {
    console.error("[PROFILE DATA ERROR]", e);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
});

export default router;
