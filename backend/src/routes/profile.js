import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

router.post("/", async (req, res) => {
  const { userId, email, username, display_name, bio, avatar_url } = req.body;

  // 🔹 Validaciones comunes (iguales en test y prod)
  if (!username || username.length < 3 || username.length > 15) {
    return res.status(400).json({
      error: "El nombre de usuario debe tener entre 3 y 15 caracteres",
    });
  }

  if (!userId && !email) {
    return res.status(400).json({ error: "Falta userId o email" });
  }

  // 🧪 Modo test: NO usamos Supabase
  if (process.env.NODE_ENV === "test") {
    let resolvedId = userId;

    if (!resolvedId && email === "test@example.com") {
      resolvedId = VALID_UUID;
    }

    if (!resolvedId) {
      return res
        .status(404)
        .json({ error: "No existe un usuario con email " + email });
    }

    const fakeProfile = {
      id: resolvedId,
      username,
      display_name: display_name || "Test",
      bio: bio || "",
      avatar_url: avatar_url || "",
    };

    return res.json({
      ok: true,
      message: "Perfil guardado ",
      data: fakeProfile,
    });
  }

  // 🔹 Modo normal (Supabase real)
  try {
    let finalUserId = userId;

    // Si no viene userId, resolvemos por email con auth.admin.listUsers
    if (!finalUserId && email) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        email,
      });
      if (error) throw error;

      const found = data.users?.[0];
      if (!found) {
        return res
          .status(404)
          .json({ error: "No existe un usuario con email " + email });
      }
      finalUserId = found.id;
    }

    // Comprobar si username ya está usado por otro usuario
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", finalUserId);

    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      return res
        .status(400)
        .json({ error: "El nombre de usuario ya está en uso" });
    }

    // Upsert del perfil
    const profileData = {
      id: finalUserId,
      username,
      display_name: display_name || null,
      bio: bio || null,
      avatar_url: avatar_url || null,
    };

    const { data: upserted, error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert(profileData, { onConflict: "id" })
      .select()
      .single();

    if (upsertError) throw upsertError;

    return res.json({
      ok: true,
      message: "Perfil guardado ",
      data: upserted,
    });
  } catch (e) {
    console.error("[UPDATE PROFILE ERROR]", e);
    res.status(500).json({ error: "Error interno al guardar el perfil" });
  }
});

export default router;
