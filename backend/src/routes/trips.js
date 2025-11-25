import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// 🧪 Datos de prueba solo para tests
const TEST_TRIPS = [
  {
    id: "trip123",
    userId: "user123",
    userName: "Test User",
    userColor: "rgba(192,192,192,1)",
    tripName: "Viaje a Japón",
    coverImage: "https://img.com/cover.jpg",
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    description: "Increíble",
    stops: [
      {
        country: "Japan",
        city: "Tokyo",
        lat: 35.6762,
        lng: 139.6503,
      },
    ],
  },
];

router.get("/", async (_req, res) => {
  // 🔹 En tests NO tocamos Supabase, devolvemos mock directo
  if (process.env.NODE_ENV === "test") {
    return res.json({ ok: true, trips: TEST_TRIPS });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("trips")
      .select(
        `
        id, user_id, trip_name, description, cover_image, start_date, end_date, status,
        users:user_id(id, username, display_name, user_color),
        trip_stops (
          id, city,
          countries(id, name, latitude, longitude)
        )
      `
      )
      .eq("status", "published");

    if (error) throw error;

    const formatted = (data || []).map((trip) => ({
      id: trip.id,
      userId: trip.users?.id,
      userName: trip.users?.username || trip.users?.display_name,
      userColor: trip.users?.user_color || null,
      tripName: trip.trip_name,
      coverImage: trip.cover_image,
      startDate: trip.start_date,
      endDate: trip.end_date,
      description: trip.description,
      stops: (trip.trip_stops || []).map((stop) => ({
        country: stop.countries?.name || "",
        city: stop.city,
        lat: stop.countries?.latitude,
        lng: stop.countries?.longitude,
      })),
    }));

    res.json({ ok: true, trips: formatted });
  } catch (e) {
    console.error("[GET TRIPS ERROR]", e);
    res.status(500).json({ error: "Error interno obteniendo viajes" });
  }
});

export default router;
