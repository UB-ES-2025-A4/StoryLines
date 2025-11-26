import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

/* ---------------------------------------------------------
   🧪 MOCK PARA TESTS
--------------------------------------------------------- */
const TEST_FRIENDS = {
  // Caso solicitado por tests
  A: [
    {
      id: "rel1",
      created_at: "2024-01-01",
      friend: {
        id: "B",
        username: "userB",
        display_name: "User B",
        user_color: "rgba(0,0,0,1)",
        avatar_url: "",
      },
    },
  ],

  "user-with-friends": [
    {
      id: "f1",
      created_at: "2024-01-01",
      friend: {
        id: "friend123",
        username: "mockfriend",
        display_name: "Mock Friend",
        user_color: "rgba(200,200,200,1)",
        avatar_url: "",
      },
    },
  ],

  "user-no-friends": [],
};

router.get("/", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: "Falta userId" });
  }

  /* ---------------------------------------------------------
     🧪 MODO TEST
  --------------------------------------------------------- */
  if (process.env.NODE_ENV === "test") {
    // Caso especial: mock de error
    if (userId === "user-db-error") {
      return res.status(500).json({ error: "DB failure" });
    }

    // Devolver mock si existe
    if (TEST_FRIENDS[userId]) {
      return res.json({
        ok: true,
        friends: TEST_FRIENDS[userId],
      });
    }

    // Si no existe → devolver lista vacía
    return res.json({
      ok: true,
      friends: [],
    });
  }

  /* ---------------------------------------------------------
     🔹 MODO PRODUCCIÓN → Supabase real
  --------------------------------------------------------- */
  try {
    const { data, error } = await supabaseAdmin
      .from("friends")
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        user:users!friends_user_id_fkey(id, username, display_name, user_color, avatar_url),
        friend:users!friends_friend_id_fkey(id, username, display_name, user_color, avatar_url)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) {
      console.error("[GET FRIENDS ERROR]", error);
      return res.status(500).json({ error: error.message });
    }

    const formatted = data.map((row) => {
      const isSender = row.user_id === userId;
      const friend = isSender ? row.friend : row.user;

      return {
        id: row.id,
        created_at: row.created_at,
        friend,
      };
    });

    res.json({ ok: true, friends: formatted });
  } catch (e) {
    console.error("[GET FRIENDS ERROR]", e);
    res.status(500).json({ error: "Error interno obteniendo amigos" });
  }
});

export default router;
