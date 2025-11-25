console.log("💥 CARGANDO MOCK SUPABASE");

// ESTE mock SIEMPRE debe exportar un NAMED EXPORT llamado supabaseAdmin
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

  from: () => ({
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
  }),

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
