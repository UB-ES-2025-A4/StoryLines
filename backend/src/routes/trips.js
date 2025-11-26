// src/routes/trips.js
import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

/* ============================================================
   🔹 GET /api/trips
============================================================ */
router.get("/", async (_req, res) => {

  /* ------------------------------------------------------
     🧪 1) MODO PRODUCCIÓN SIMULADO (TESTS)
     NODE_ENV = "production" && FORCE_TRIPS_MOCK = "1"
  ------------------------------------------------------- */
  if (process.env.NODE_ENV === "production" && process.env.FORCE_TRIPS_MOCK === "1") {

    // Error en trips
    if (global.__tripsMockError || global.__mockError.trips) {
      return res.status(500).json({ ok: false, error: "Trips error" });
    }

    const trips = global.__mockData.trips || [];

    // Error en stops
    if (global.__mockError.trip_stops) {
      return res.status(500).json({ ok: false, error: "Stops error" });
    }

    const stops = global.__mockData.trip_stops || [];

    // Agrupar stops por trip_id
    const grouped = {};
    stops.forEach(stop => {
      if (!grouped[stop.trip_id]) grouped[stop.trip_id] = [];
      grouped[stop.trip_id].push({
        city: stop.city,
        images: stop.images || [],
        country: stop.country?.name || "",
        lat: stop.country?.latitude,
        lng: stop.country?.longitude
      });
    });

    // Igual formato que producción real
    const formatted = trips.map(t => ({
      id: t.id,
      userId: t.user_id,
      userName: t.users?.display_name || t.users?.username || "",
      userColor: t.users?.user_color || "rgba(192,192,192,1)",
      tripName: t.trip_name,
      coverImage: t.cover_image,
      startDate: t.start_date,
      endDate: t.end_date,
      description: t.description,
      stops: grouped[t.id] || []
    }));

    return res.json({ ok: true, trips: formatted });
  }

  /* ------------------------------------------------------
     🧪 2) MODO TEST NORMAL
  ------------------------------------------------------- */
  if (process.env.NODE_ENV === "test") {
    if (global.__tripsMockError) {
      return res.status(500).json({
        ok: false,
        error: "Error interno obteniendo viajes (test)",
      });
    }

    const trips = Array.isArray(global.__tripsMockData)
      ? global.__tripsMockData
      : [];

    return res.json({ ok: true, trips });
  }

  /* ------------------------------------------------------
     🔹 3) PRODUCCIÓN REAL
  ------------------------------------------------------- */
  try {
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from("trips")
      .select("*, users:user_id(id, username, display_name, user_color)")
      .eq("status", "published");

    if (tripsError) {
      console.error("[GET TRIPS ERROR]", tripsError);
      return res.status(500).json({ error: tripsError.message });
    }

    const { data: stops, error: stopsError } = await supabaseAdmin
      .from("trip_stops")
      .select(`
        *,
        country:countries!trip_stops_country_id_fkey(id, name, latitude, longitude)
      `);

    if (stopsError) {
      console.error("[GET TRIPS ERROR]", stopsError);
      return res.status(500).json({ error: stopsError.message });
    }

    const grouped = {};
    (stops || []).forEach(stop => {
      if (!grouped[stop.trip_id]) grouped[stop.trip_id] = [];
      grouped[stop.trip_id].push({
        country: stop.country?.name || "",
        city: stop.city,
        lat: stop.country?.latitude,
        lng: stop.country?.longitude,
        images: stop.images || [],
      });
    });

    const formatted = trips.map(t => ({
      id: t.id,
      userId: t.user_id,
      userName: t.users?.display_name || t.users?.username || "",
      userColor: t.users?.user_color || "rgba(192,192,192,1)",
      tripName: t.trip_name,
      coverImage: t.cover_image,
      stops: grouped[t.id] || [],
      startDate: t.start_date,
      endDate: t.end_date,
      description: t.description,
    }));

    return res.json({ ok: true, trips: formatted });
  } catch (e) {
    console.error("[GET TRIPS ERROR]", e);
    return res.status(500).json({
      ok: false,
      error: "Error interno obteniendo viajes",
    });
  }
});

/* ============================================================
   🔹 GET /api/trips/:id
============================================================ */
router.get("/:id", async (req, res) => {

  // MODO PRODUCCIÓN SIMULADO
  if (process.env.NODE_ENV === "production" && process.env.FORCE_TRIPS_MOCK === "1") {
    if (global.__tripByIdMockError) {
      return res.status(500).json({ ok: false });
    }
    return res.json({
      ok: true,
      trip: global.__tripByIdMockData || null,
    });
  }

  // MODO TEST
  if (process.env.NODE_ENV === "test") {
    if (global.__tripByIdMockError) {
      return res.status(500).json({
        ok: false,
        error: "Error interno obteniendo viaje (test)",
      });
    }
    return res.json({
      ok: true,
      trip: global.__tripByIdMockData || null,
    });
  }

  // PRODUCCIÓN REAL
  const { id } = req.params;

  try {
    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select(`
        id, user_id, trip_name, description, cover_image,
        start_date, end_date, status, comment,
        users:user_id(id, username, display_name, user_color)
      `)
      .eq("id", id)
      .single();

    if (tripError) throw tripError;
    if (!trip)
      return res.status(404).json({ ok: false, error: "Viaje no encontrado" });

    const { data: stops, error: stopError } = await supabaseAdmin
      .from("trip_stops")
      .select(`
        id, city, description, images,
        country:countries!trip_stops_country_id_fkey(id, name, latitude, longitude)
      `)
      .eq("trip_id", id);

    if (stopError) throw stopError;

    return res.json({
      ok: true,
      trip: {
        ...trip,
        stops: stops || [],
      },
    });
  } catch (e) {
    console.error("[GET TRIP BY ID ERROR]", e);
    res
      .status(500)
      .json({ ok: false, error: "Error interno obteniendo el viaje" });
  }
});

/* ============================================================
   🔹 POST /api/trips
============================================================ */
router.post("/", async (req, res) => {
  const {
    user_id,
    trip_name,
    cover_image,
    start_date,
    end_date,
    description,
    status,
    stops,
  } = req.body;

  try {
    if (!user_id)
      return res.status(400).json({ ok: false, error: "Falta user_id" });
    if (!trip_name)
      return res.status(400).json({ ok: false, error: "Falta trip_name" });
    if (!start_date || !end_date)
      return res.status(400).json({ ok: false, error: "Faltan fechas" });
    if (!status)
      return res.status(400).json({ ok: false, error: "Falta status" });
    if (!Array.isArray(stops))
      return res.status(400).json({ ok: false, error: "Faltan paradas" });

    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .insert({
        user_id,
        trip_name,
        cover_image: cover_image || null,
        start_date,
        end_date,
        description: description || null,
        status,
      })
      .select()
      .single();

    if (tripError) throw tripError;

    const tripId = trip.id;

    for (const stop of stops) {
      const payload = {
        trip_id: tripId,
        city: stop.city || null,
        country_id: stop.country_id,
        description: stop.description || null,
        images: stop.images?.length ? stop.images : [],
      };

      const { error: stopErr } = await supabaseAdmin
        .from("trip_stops")
        .insert(payload);

      if (stopErr) throw stopErr;
    }

    return res.json({ ok: true, tripId });
  } catch (e) {
    console.error("[CREATE TRIP ERROR]", e);
    res
      .status(500)
      .json({ ok: false, error: "Error interno creando viaje" });
  }
});

export default router;
