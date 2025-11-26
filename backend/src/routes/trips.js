import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

/* ============================================================
   GET /api/trips — Lista de viajes publicados
============================================================ */
router.get("/", async (_req, res) => {
  try {
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from("trips")
      .select("*, users:user_id(id, username, display_name, user_color, avatar_url)")
      .eq("status", "published");

    if (tripsError) return res.status(500).json({ error: tripsError.message });

    const { data: stops, error: stopsError } = await supabaseAdmin
      .from("trip_stops")
      .select(`
        *,
        country:countries!trip_stops_country_id_fkey(id, name, latitude, longitude)
      `);

    if (stopsError) return res.status(500).json({ error: stopsError.message });

    const grouped = {};
    (stops || []).forEach((s) => {
      if (!grouped[s.trip_id]) grouped[s.trip_id] = [];
      grouped[s.trip_id].push({
        country: s.country?.name || "",
        city: s.city,
        lat: s.country?.latitude,
        lng: s.country?.longitude,
        images: s.images || [],
      });
    });

    const formatted = trips.map((t) => ({
      id: t.id,
      userId: t.user_id,
      userName: t.users?.display_name || t.users?.username,
      userAvatar: t.users?.avatar_url,
      userColor: t.users?.user_color,
      tripName: t.trip_name,
      coverImage: t.cover_image,
      description: t.description,
      startDate: t.start_date,
      endDate: t.end_date,
      stops: grouped[t.id] || [],
    }));

    return res.json({ ok: true, trips: formatted });
  } catch (e) {
    console.error("[GET TRIPS ERROR]", e);
    return res.status(500).json({ error: "Error interno" });
  }
});

/* ============================================================
   GET /api/trips/:id — Viaje completo con comentarios y likes
============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const tripId = req.params.id;

    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select("*, users:user_id(id, username, display_name, user_color, avatar_url)")
      .eq("id", tripId)
      .single();

    if (tripError || !trip)
      return res.status(404).json({ ok: false, error: "Viaje no encontrado" });

    const { data: stops } = await supabaseAdmin
      .from("trip_stops")
      .select(`
        id, city, description, images,
        country:countries!trip_stops_country_id_fkey(id, name, latitude, longitude)
      `)
      .eq("trip_id", tripId);

    const formattedStops = stops.map((stop) => ({
      title: stop.city || "Stop",
      city: stop.city,
      country: stop.country?.name,
      description: stop.description,
      images: stop.images || [],
      lat: stop.country?.latitude,
      lng: stop.country?.longitude,
      currentImageIndex: 0,
    }));

    const { data: commentsData } = await supabaseAdmin
      .from("trip_comments")
      .select(`
        id, text, created_at,
        user:users(id, username, display_name, avatar_url, user_color)
      `)
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });

    const formattedComments = commentsData.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.created_at,
      user: {
        id: c.user.id,
        username: c.user.username,
        displayName: c.user.display_name,
        avatarUrl: c.user.avatar_url,
        color: c.user.user_color,
      },
    }));

    const { count: commentsCount } = await supabaseAdmin
      .from("trip_comments")
      .select("*", { head: true, count: "exact" })
      .eq("trip_id", tripId);

    const { count: likesCount } = await supabaseAdmin
      .from("trip_likes")
      .select("*", { head: true, count: "exact" })
      .eq("trip_id", tripId);

    let likedByCurrentUser = false;
    if (req.query.userId) {
      const { data: liked } = await supabaseAdmin
        .from("trip_likes")
        .select("id")
        .eq("trip_id", tripId)
        .eq("user_id", req.query.userId);

      likedByCurrentUser = liked.length > 0;
    }

    await supabaseAdmin.rpc("increment_trip_views", {
      trip_id_input: tripId,
    });

    return res.json({
      ok: true,
      trip: {
        id: trip.id,
        trip_name: trip.trip_name,
        description: trip.description,
        cover_image: trip.cover_image,
        start_date: trip.start_date,
        end_date: trip.end_date,
        user: {
          id: trip.users.id,
          username: trip.users.username,
          display_name: trip.users.display_name,
          color: trip.users.user_color,
        },
        stops: formattedStops,
        likes: likesCount,
        userLiked: likedByCurrentUser,
        views: trip.views,
        commentsCount,
        comments: formattedComments,
      },
    });
  } catch (e) {
    console.error("[GET TRIP BY ID ERROR]", e);
    return res.status(500).json({ error: "Error interno" });
  }
});

/* ============================================================
   POST /api/trips — Crear viaje + paradas
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { user_id, trip_name, start_date, end_date, status, stops } = req.body;

    if (!user_id) return res.status(400).json({ error: "Falta user_id" });
    if (!trip_name) return res.status(400).json({ error: "Falta trip_name" });
    if (!start_date || !end_date) return res.status(400).json({ error: "Faltan fechas" });
    if (!status) return res.status(400).json({ error: "Falta status" });
    if (!Array.isArray(stops)) return res.status(400).json({ error: "Faltan paradas" });

    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .insert(req.body)
      .select()
      .single();

    if (tripError) throw tripError;

    const tripId = trip.id;

    for (const stop of stops) {
      await supabaseAdmin.from("trip_stops").insert({
        trip_id: tripId,
        city: stop.city,
        country_id: stop.country_id,
        images: stop.images || [],
        description: stop.description || null,
      });
    }

    return res.json({ ok: true, tripId });
  } catch (e) {
    console.error("[CREATE TRIP ERROR]", e);
    return res.status(500).json({ error: "Error interno creando viaje" });
  }
});

/* ============================================================
   Likes / Unlike
============================================================ */
router.post("/:tripId/like", async (req, res) => {
  try {
    const { tripId } = req.params;
    const { userId } = req.body;

    if (!tripId || !userId)
      return res.status(400).json({ error: "Faltan datos" });

    const { data: existing } = await supabaseAdmin
      .from("trip_likes")
      .select("id")
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      const { error: likeError } = await supabaseAdmin
        .from("trip_likes")
        .insert({ trip_id: tripId, user_id: userId });

      if (likeError && likeError.code !== "23505")
        return res.status(500).json({ error: likeError.message });

      await supabaseAdmin.rpc("increment_trip_likes", {
        trip_id_input: tripId,
      });
    }

    const { count } = await supabaseAdmin
      .from("trip_likes")
      .select("*", { head: true, count: "exact" })
      .eq("trip_id", tripId);

    return res.json({ ok: true, userLiked: true, likes: count });
  } catch (e) {
    console.error("[LIKE ERROR]", e);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/:tripId/like/:userId", async (req, res) => {
  try {
    const { tripId, userId } = req.params;

    await supabaseAdmin
      .from("trip_likes")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", userId);

    await supabaseAdmin.rpc("decrement_trip_likes", {
      trip_id_input: tripId,
    });

    const { count } = await supabaseAdmin
      .from("trip_likes")
      .select("*", { head: true, count: "exact" })
      .eq("trip_id", tripId);

    return res.json({ ok: true, userLiked: false, likes: count });
  } catch (e) {
    console.error("[UNLIKE ERROR]", e);
    return res.status(500).json({ error: "Error interno" });
  }
});

/* ============================================================
   Comentarios / eliminar comentario
============================================================ */
router.post("/:tripId/comments", async (req, res) => {
  try {
    const { tripId } = req.params;
    const { userId, text } = req.body;

    if (!tripId || !userId || !text)
      return res.status(400).json({ error: "Faltan datos" });

    await supabaseAdmin
      .from("trip_comments")
      .insert({ trip_id: tripId, user_id: userId, text });

    await supabaseAdmin.rpc("increment_trip_comments", {
      trip_id_input: tripId,
    });

    const { count } = await supabaseAdmin
      .from("trip_comments")
      .select("*", { head: true, count: "exact" })
      .eq("trip_id", tripId);

    return res.json({ ok: true, commentsCount: count });
  } catch (e) {
    console.error("[COMMENT ERROR]", e);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/:tripId/comments/:commentId/:userId", async (req, res) => {
  try {
    const { tripId, commentId, userId } = req.params;

    await supabaseAdmin
      .from("trip_comments")
      .delete()
      .eq("id", commentId)
      .eq("trip_id", tripId);

    await supabaseAdmin.rpc("decrement_trip_comments", {
      trip_id_input: tripId,
    });

    const { count } = await supabaseAdmin
      .from("trip_comments")
      .select("*", { head: true, count: "exact" })
      .eq("trip_id", tripId);

    return res.json({ ok: true, commentsCount: count });
  } catch (e) {
    console.error("[DELETE COMMENT ERROR]", e);
    return res.status(500).json({ error: "Error interno" });
  }
});

export default router;
