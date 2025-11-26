// src/routes/profile.js
import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

/**
 * POST /api/profile
 * - En test: lógica simplificada en memoria, sin Supabase.
 * - En prod: valida y hace upsert en Supabase.
 */
router.post("/", async (req, res) => {
  const { userId, email, username, display_name, bio, avatar_url } = req.body;

  // 🔹 Validaciones comunes
  if (!username || username.length < 3 || username.length > 15) {
    return res.status(400).json({
      error: "El nombre de usuario debe tener entre 3 y 15 caracteres",
    });
  }

  if (display_name && display_name.length > 15) {
    return res.status(400).json({
      error: "El nombre para mostrar debe tener máximo 15 caracteres",
    });
  }

  if (bio && bio.length > 150) {
    return res.status(400).json({
      error: "La biografía no puede superar los 150 caracteres",
    });
  }

  if (!userId && !email) {
    return res
      .status(400)
      .json({ error: "Falta userId o email" });
  }

  // 🔹 MODO TEST: sin Supabase
  if (process.env.NODE_ENV === "test") {
    let finalUserId = userId || null;

    if (!finalUserId && email && global.__profileEmailMap) {
      finalUserId = global.__profileEmailMap[email] || null;
    }

    if (!finalUserId) {
      return res.status(404).json({
        error: "No existe un usuario con ese identificador",
      });
    }

    const profile = {
      id: finalUserId,
      username,
      display_name: display_name || null,
      bio: bio || null,
      avatar_url: avatar_url || null,
    };

    return res.json({
      ok: true,
      message: "Perfil guardado (test)",
      data: profile,
    });
  }

  // 🔹 MODO NORMAL (Supabase real)
  try {
    let finalUserId = userId || null;

    // Si no viene userId, resolver por email con auth.admin.listUsers
    if (!finalUserId && email) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        email,
      });

      if (error) throw error;

      const found = data?.users?.[0];
      if (!found) {
        return res.status(404).json({
          error: "No existe un usuario con email " + email,
        });
      }

      finalUserId = found.id;
    }

    // Comprobar username único
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", finalUserId)
      .limit(1);

    if (existingError) throw existingError;

    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(400).json({
        error: "El nombre de usuario ya está en uso",
      });
    }

    // Upsert de perfil
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
      .select(
        "id, username, display_name, bio, avatar_url"
      )
      .single();

    if (upsertError) throw upsertError;

    return res.json({
      ok: true,
      message: "Perfil guardado",
      data: upserted,
    });
  } catch (e) {
    console.error("[UPDATE PROFILE ERROR]", e);
    res.status(500).json({
      error: "Error interno al guardar el perfil",
    });
  }
});

export default router;
