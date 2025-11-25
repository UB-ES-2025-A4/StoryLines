import { jest } from "@jest/globals";

console.log("💥 CARGANDO MOCK SUPABASE");

// ---------------------------------------------------------------------
// MOCKS BASE (los que ya FUNCIONABAN para perfil)
// ---------------------------------------------------------------------

export const supabaseAdmin = {
  auth: {
    admin: {
      listUsers: async () => ({
        data: {
          users: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              email: "test@example.com",
            },
          ],
        },
        error: null,
      }),
    },
  },

  from: (table) => {
    // ---------------------------------------------------------------------
    // MOCK TRIPS
    // ---------------------------------------------------------------------
    if (table === "trips") {
      return {
        select: () => ({
          eq: async () => ({
            data: [
              {
                id: "trip123",
                user_id: "550e8400-e29b-41d4-a716-446655440000",
                trip_name: "Viaje a Japón",
                description: "Increíble viaje",
                cover_image: "https://img.com/cover.jpg",
                start_date: "2025-01-01",
                end_date: "2025-01-10",
                status: "published",
                users: {
                  id: "550e8400-e29b-41d4-a716-446655440000",
                  username: "testuser",
                  display_name: "Test",
                  user_color: "rgba(192,192,192,1)",
                },
              },
            ],
            error: null,
          }),
        }),
      };
    }

    // ---------------------------------------------------------------------
    // MOCK TRIP_STOPS
    // ---------------------------------------------------------------------
    if (table === "trip_stops") {
      return {
        select: async () => ({
          data: [
            {
              trip_id: "trip123",
              city: "Tokyo",
              images: [],
              description: "Primera parada",
              country: {
                id: "jp",
                name: "Japan",
                latitude: 35.6762,
                longitude: 139.6503,
              },
            },
          ],
          error: null,
        }),
      };
    }

    // ---------------------------------------------------------------------
    // MOCK COMMENTS
    // ---------------------------------------------------------------------
    if (table === "comments") {
      return {
        select: async () => ({
          data: [
            {
              id: "c1",
              trip_id: "trip123",
              user: "testuser",
              text: "Comentario de prueba",
              created_at: "2025-01-05T12:00:00Z",
            },
          ],
          error: null,
        }),
      };
    }

    // ---------------------------------------------------------------------
    // MOCK USERS (el que YA tenías funcionando)
    // ---------------------------------------------------------------------
    return {
      select: () => ({
        eq: () => ({
          neq: () => ({
            limit: async () => ({
              data: [],
              error: null,
            }),
          }),

          single: async () => ({
            data: {
              id: "550e8400-e29b-41d4-a716-446655440000",
              avatar_url: null,
            },
            error: null,
          }),
        }),
      }),

      upsert: () => ({
        select: async () => ({
          data: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              username: "testuser",
              display_name: "Test",
              bio: "",
              avatar_url: "",
            },
          ],
          error: null,
        }),
      }),

      update: async () => ({
        data: [{ id: "550e8400-e29b-41d4-a716-446655440000" }],
        error: null,
      }),
    };
  },

  // ---------------------------------------------------------------------
  // MOCK STORAGE (tal como ya lo tenías)
  // ---------------------------------------------------------------------
  storage: {
    from: () => ({
      remove: async () => ({ error: null }),
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({
        data: {
          publicUrl: "https://mocked-url.com/profile.png",
        },
      }),
    }),
  },
};
