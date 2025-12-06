import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { ensureDefaultItems } from "../routes/shop.js";


const router = express.Router();

// Helper para asegurar fila
async function ensureCustomizationRow(userId) {
  const { data, error } = await supabaseAdmin
    .from("user_customization")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) return data;

  const emptyRow = {
    user_id: userId,
    globe: null,
    homebg: null,
    profilebg: null
  };


  const { error: insertErr } = await supabaseAdmin
    .from("user_customization")
    .insert(emptyRow);

  if (insertErr) throw insertErr;

  return emptyRow;
}


// GET customization
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const row = await ensureCustomizationRow(userId);

    // ⭐ AÑADIR AQUÍ
    await ensureDefaultItems(userId);

    return res.json({
      ok: true,
      equipped: {
        globe: row.globe,       
        homeBg: row.homebg,
        profileBg: row.profilebg
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Error loading customization" });
  }
});



// EQUIP an item
router.post("/equip", async (req, res) => {
  const { userId, itemId, slot } = req.body;

  if (!userId || !itemId || !slot)
    return res.status(400).json({ ok: false, error: "Missing data" });

  try {
    // 1) Comprobar que el item existe
    const { data: item } = await supabaseAdmin
      .from("shop_items")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();

    if (!item) return res.status(404).json({ ok: false, error: "Item not found" });

    // 2) Comprobar que está comprado (si no es default)
    if (!item.is_default) {
      const { data: purchased } = await supabaseAdmin
        .from("user_items")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", itemId)
        .maybeSingle();

      if (!purchased)
        return res.json({ ok: false, error: "Item not purchased" });
    }

    // 3) Verificar que el tipo corresponde a la ranura
    const valid = {
      globe: "globe",
      homeBg: "homeBg",
      profileBg: "profileBg"
    };


    if (item.type !== slot) {
      return res.status(400).json({ ok: false, error: "Slot/type mismatch" });
    }


    // 4) Actualizar
    const update = {};
    if (slot === "globe") update.globe = itemId;
    if (slot === "homeBg") update.homebg = itemId;
    if (slot === "profileBg") update.profilebg = itemId;


    await supabaseAdmin
      .from("user_customization")
      .update(update)
      .eq("user_id", userId);

    return res.json({ ok: true, equipped: update });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Error equipping item" });
  }
});


// UNEQUIP
router.post("/unequip", async (req, res) => {
  const { userId, slot } = req.body;

  if (!userId || !slot)
    return res.status(400).json({ ok: false, error: "Missing data" });

  const update = {};
  if (slot === "globe") update.globe = null;
  if (slot === "homeBg") update.homebg = null;
  if (slot === "profileBg") update.profilebg = null;

  try {
    await supabaseAdmin
      .from("user_customization")
      .update(update)
      .eq("user_id", userId);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error unequipping" });
  }
});

export default router;
