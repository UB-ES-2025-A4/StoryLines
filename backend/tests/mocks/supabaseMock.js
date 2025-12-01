export const supabase = {
  from: () => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: [], error: null }),
    update: async () => ({ data: [], error: null }),
    delete: async () => ({ data: [], error: null }),
    eq() { return this; }
  }),
};

export const supabaseAdmin = {
  from: () => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: [], error: null }),
    update: async () => ({ data: [], error: null }),
    delete: async () => ({ data: [], error: null }),
    eq() { return this; }
  }),
  auth: {
    admin: {
      listUsers: async () => ({
        data: { users: [] },
        error: null
      })
    }
  }
};
