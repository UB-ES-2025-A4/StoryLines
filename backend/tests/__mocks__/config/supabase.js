import { jest } from "@jest/globals";

console.log("💥 CARGANDO MOCK SUPABASE");

// ---------------------------------------------------------------------
// MOCK: supabaseAdmin
// ---------------------------------------------------------------------
export const supabaseAdmin = {

  // AUTH (solo lo usa profile)
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

  // -------------------------------------------------------------------
  // FROM (TABLAS)
  // -------------------------------------------------------------------
  from: (table) => {

    // ================================================================
    // TABLE: trips
    // ================================================================
// ================================================================
// TABLE: trips (mock completo compatible con select → eq → single)
// ================================================================
    if (table === "trips") {
      return {
        select: () => ({
          // permite .select().eq()
          eq: (field, value) => {

            // LISTA DE VIAJES (/api/trips)
            if (field === "status" && value === "published") {
              return {
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
                      user_color: "rgba(192,192,192,1)"
                    }
                  }
                ],
                error: null
              };
            }

            // VIAJE INDIVIDUAL
            if (field === "id") {

              if (value === "trip123") {
                return {
                  // soporta select().eq().single()
                  single: async () => ({
                    data: {
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
                        user_color: "rgba(192,192,192,1)"
                      }
                    },
                    error: null
                  }),

                  // soporta select().eq().select().single()
                  select: () => ({
                    single: async () => ({
                      data: {
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
                          user_color: "rgba(192,192,192,1)"
                        }
                      },
                      error: null
                    })
                  })
                };
              }

              // ID inexistente
              return {
                single: async () => ({
                  data: null,
                  error: { message: "not found" }
                })
              };
            }

            // fallback
            return {
              single: async () => ({
                data: null,
                error: { message: "not found" }
              })
            };
          }
        })
      };
    }


    // ================================================================
    // TABLE: trip_stops
    // ================================================================
// ================================================================
// TABLE: trip_stops (mock completo: soporta select() y select().eq())
// ================================================================
    if (table === "trip_stops") {
      return {
        select: () => {
          return {
            // Caso 1 → /api/trips/:id usa eq("trip_id")
            eq: (field, value) => {
              if (field === "trip_id" && value === "trip123") {
                return Promise.resolve({
                  data: [
                    {
                      id: "stop1",
                      trip_id: "trip123",
                      city: "Tokyo",
                      description: "Templos y sushi",
                      images: ["tokyo1.jpg"],
                      country: {
                        id: "jp",
                        name: "Japón",
                        latitude: 35.6762,
                        longitude: 139.6503,
                      },
                    },
                  ],
                  error: null,
                });
              }

              return Promise.resolve({ data: [], error: null });
            },

            // Caso 2 → /api/trips (sin eq)
            then: (resolve) =>
              resolve({
                data: [
                  {
                    id: "stop1",
                    trip_id: "trip123",
                    city: "Tokyo",
                    description: "Templos y sushi",
                    images: ["tokyo1.jpg"],
                    country: {
                      id: "jp",
                      name: "Japón",
                      latitude: 35.6762,
                      longitude: 139.6503,
                    },
                  },
                ],
                error: null,
              }),
          };
        },
      };
    }


    // ================================================================
    // TABLE: comments
    // ================================================================
    if (table === "comments") {
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({
              data: [
                {
                  id: "c1",
                  trip_id: "trip123",
                  user: "testuser",
                  text: "Increíble viaje!",
                  created_at: "2025-01-05T12:00:00Z",
                },
              ],
              error: null,
            }),
          }),
        }),
      };
    }
    // ================================================================
    // TABLE: users
    // ================================================================
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

  // -------------------------------------------------------------------
  // STORAGE (para avatar)
  // -------------------------------------------------------------------
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
