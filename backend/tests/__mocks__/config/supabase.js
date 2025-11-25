export const supabaseAdmin = {
  auth: {
    admin: {
      listUsers: jest.fn(async ({ email }) => ({
        data: {
          users: email === "test@example.com"
            ? [
                {
                  id: "550e8400-e29b-41d4-a716-446655440000",
                  email: "test@example.com",
                  user_metadata: {},
                },
              ]
            : [],
        },
        error: null,
      })),
    },
  },

  from: jest.fn((table) => {
    // --- MOCK USERS ---
    if (table === "users") {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(async () => ({
              data: {
                id: "550e8400-e29b-41d4-a716-446655440000",
                username: "mockuser",
                display_name: "Mock User",
                bio: "Mock bio",
                avatar_url: null,
              },
              error: null,
            })),
          })),
        })),

        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(async () => ({
                data: {
                  id: "550e8400-e29b-41d4-a716-446655440000",
                  username: "john_doe",
                  display_name: "John",
                  bio: "Hello world!",
                },
                error: null,
              })),
            })),
          })),
        })),

        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(async () => ({
              data: {
                id: "550e8400-e29b-41d4-a716-446655440000",
                username: "mockuser",
                display_name: "Mock User",
              },
              error: null,
            })),
          })),
        })),
      };
    }

    // --- MOCK TRIPS ---
    if (table === "trips") {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(async () => ({
              data: {
                id: "trip123",
                trip_name: "Viaje a Japón",
                description: "Increíble viaje",
                cover_image: "",
                start_date: "2025-01-01",
                end_date: "2025-01-10",
                user_id: "550e8400-e29b-41d4-a716-446655440000",
                users: {
                  id: "550e8400-e29b-41d4-a716-446655440000",
                  username: "testuser",
                  display_name: "Test User",
                  user_color: "red",
                },
              },
              error: null,
            })),
          })),
        })),
      };
    }

    // --- MOCK STOPS ---
    if (table === "trip_stops") {
      return {
        select: jest.fn(() =>
          Promise.resolve({
            data: [
              {
                city: "Tokyo",
                description: "Templos y sushi",
                images: ["tokyo.jpg"],
                country: {
                  id: "jp",
                  name: "Japón",
                  latitude: 35.6762,
                  longitude: 139.6503,
                },
              },
            ],
            error: null,
          })
        ),
      };
    }

    // --- MOCK COMMENTS ---
    if (table === "comments") {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: [
                  {
                    text: "Increíble viaje!",
                    user: "mockuser",
                    created_at: "2025-01-01",
                  },
                ],
                error: null,
              })
            ),
          })),
        })),
      };
    }

    // --- DEFAULT EMPTY MOCK ---
    return {
      select: jest.fn(async () => ({
        data: [],
        error: null,
      })),
    };
  }),
};
