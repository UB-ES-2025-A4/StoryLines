import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// 🧪 Mock SOLO para tests (id fijo trip123)
const TEST_TRIP = {
  id: "trip123",
  trip_name: "Viaje a Japón",
  description: "Increíble viaje",
  cover_image: "https://img.com/cover.jpg",
  start_date: "2025-01-01",
  end_date: "2025-01-10",
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    username: "testuser",
    display_name: "Test User",
    color: "rgba(192,192,192,1)",
  },
  stops: [
    {
      title: "Tokyo",
      city: "Tokyo",
      country: "Japón",
      description: "Templos y sushi",
      images: ["tokyo1.jpg"],
      lat: 35.6762,
      lng: 139.6503,
      currentImageIndex: 0,
    },
  ],
  comments: [
    {
      id: "comment1",
      user: "testuser",
      text: "Increíble viaje!",
      created_at: "2025-01-02T12:00:00.000Z",
    },
  ],
};

router.get("/:id", async (req, res) => {
  const tripId = req.params.id;

  // 🔹 Modo test: sin Supabase, respondemos con mock
  if (process.env.NODE_ENV === "test") {
    if (tripId !== "trip123") {
      return res
        .status(404)
        .json({ ok: false, error: "Viaje no encontrado" });
    }

    return res.json({ ok: true, trip: TEST_TRIP });
  }

  // 🔹 Modo normal (producción / dev) con Supabase real
  try {
    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select(
        `
        id, user_id, trip_name, description, cover_image, start_date, end_date, status,
        users:user_id(id, username, display_name, user_color)
      `
      )
      .eq("id", tripId)
      .single();

    if (tripError) throw tripError;
    if (!trip) {
      return res
        .status(404)
        .json({ ok: false, error: "Viaje no encontrado" });
    }

    const { data: stops, error: stopsError } = await supabaseAdmin
      .from("trip_stops")
      .select(
        `
        id, city, description, images,
        country:countries!trip_stops_country_id_fkey(id, name, latitude, longitude)
      `
      )
      .eq("trip_id", tripId);

    if (stopsError) throw stopsError;

    const { data: comments, error: commentsError } = await supabaseAdmin
      .from("comments")
      .select("id, user, text, created_at")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });

    if (commentsError) throw commentsError;

    const formattedStops = (stops || []).map((stop) => ({
      title: stop.city || "Stop",
      city: stop.city,
      country: stop.country?.name || "",
      description: stop.description || "",
      images: stop.images || [],
      lat: stop.country?.latitude,
      lng: stop.country?.longitude,
      currentImageIndex: 0,
    }));

    const fullTrip = {
      id: trip.id,
      trip_name: trip.trip_name,
      description: trip.description,
      cover_image: trip.cover_image,
      start_date: trip.start_date,
      end_date: trip.end_date,
      user: {
        id: trip.users?.id,
        username: trip.users?.username,
        display_name: trip.users?.display_name,
        color: trip.users?.user_color,
      },
      stops: formattedStops,
      comments: comments || [],
    };

    res.json({ ok: true, trip: fullTrip });
  } catch (e) {
    console.error("[GET TRIP BY ID ERROR]", e);
    res
      .status(500)
      .json({ ok: false, error: "Error interno obteniendo el viaje" });
  }
});

export default router;
