import { jest } from "@jest/globals";
global.supabaseSelectThrows = false;
global.supabaseSelectReturnsError = false;

/* ============================================================================
   DB MOCK
============================================================================ */
global.__mockDB = {
  users: [],
  friends: [],
  notifications: [],
  trips: [],
  trip_saves: [],
  trip_stops: [],
  trip_comments: [],
  trip_likes: [],
  balance: [],
  user_balance: []   // ⚠️ tabla real usada en balance.js
};

global.__mockListUsers = [];

global.resetMockDB = () => {
  global.__mockDB = {
    users: [],
    friends: [],
    notifications: [],
    trips: [],
    trip_saves: [],
    trip_stops: [],
    trip_comments: [],
    trip_likes: [],
    balance: [],
    user_balance: []
  };
  global.__mockListUsers = [];
};


/* ============================================================================
   FILTROS
============================================================================ */
function filterRows(table, filters, orExp, limit) {
  // aseguramos que siempre haya array
  if (!Array.isArray(global.__mockDB[table])) {
    global.__mockDB[table] = [];
  }

  let rows = [...global.__mockDB[table]];

  for (const f of filters) {
    if (f.type === "eq") rows = rows.filter(r => r[f.key] == f.value);
    if (f.type === "neq") rows = rows.filter(r => r[f.key] != f.value);
    if (f.type === "in") rows = rows.filter(r => f.values.includes(r[f.key]));
  }

  if (orExp) {
    const parts = orExp.split(",");
    rows = rows.filter(r =>
      parts.some(p => {
        const [key, op, val] = p.split(".");
        return op === "eq" && r[key] == val;
      })
    );
  }

  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}


/* ============================================================================
   QUERY BUILDER SIN PROXY
============================================================================ */
function createQuery(table) {
  return {
    /* --------------------------------------
       SELECT
    -------------------------------------- */
    select(columns = "*", opts = null) {
      // ---- COUNT MODE (likes/comments/saves) ----
      if (opts?.count === "exact") {
        const err = new Error("forced select error");

        // Si debe lanzar error
        if (global.supabaseSelectThrows) {
          return {
            eq() { return this; },
            then(_resolve, reject) {
              if (reject) reject(err);
              else throw err;
            }
          };
        }

        // Si debe devolver error sin throw
        if (global.supabaseSelectReturnsError) {
          return {
            eq() { return this; },
            then(resolve) {
              resolve({ data: null, count: null, error: err });
            }
          };
        }

        // Comportamiento normal
        const ctx = { filters: [] };

        return {
          eq(k, v) {
            ctx.filters.push({ type: "eq", key: k, value: v });
            return this;
          },
          then(resolve) {
            const rows = filterRows(table, ctx.filters, null, null);
            resolve({ data: null, count: rows.length, error: null });
          }
        };
      }

      // ---- FORZAR ERROR SELECT (supabaseErrorOnSelect) ----
      // ----- SELECT ERROR MODES -----
// ---- ERROR SIMULADO EN SELECT NORMAL ----
    if (global.supabaseErrorOnSelect || global.supabaseSelectReturnsError || global.supabaseSelectThrows) {
      
      const err = new Error("forced select error");

      // 1. Caso: select debe lanzar throw
      if (global.supabaseSelectThrows) {
        return {
          eq() { return this; },
          in() { return this; },
          or() { return this; },
          limit() { return this; },
          order() { return this; },

          async single() { throw err; },
          async maybeSingle() { throw err; },

          then(_resolve, reject) {
            if (reject) reject(err);
            else throw err;
          }
        };
      }

      // 2. Caso: debe devolver error SIN throw (exactamente lo que balance necesita)
      if (global.supabaseSelectReturnsError || global.supabaseErrorOnSelect) {
        return {
          eq() { return this; },
          in() { return this; },
          or() { return this; },
          limit() { return this; },
          order() { return this; },

          async single() {
            return { data: null, error: err };
          },

          async maybeSingle() {
            return { data: null, error: err };
          },

          then(resolve) {
            resolve({ data: null, error: err });
          }
        };
      }
    }




      // ---- SELECT NORMAL ----
      const ctx = {
        filters: [],
        orExp: null,
        limit: null
      };

      return {
        eq(k, v) { ctx.filters.push({ type: "eq", key: k, value: v }); return this; },
        neq(k, v) { ctx.filters.push({ type: "neq", key: k, value: v }); return this; },
        in(k, values) { ctx.filters.push({ type: "in", key: k, values }); return this; },
        or(expr) { ctx.orExp = expr; return this; },
        limit(n) { ctx.limit = n; return this; },
        order() { return this; },

        async single() {
          const rows = filterRows(table, ctx.filters, ctx.orExp, ctx.limit);
          return { data: rows[0] || null, error: null };
        },

        async maybeSingle() {
          return this.single();
        },

        then(resolve) {
          const rows = filterRows(table, ctx.filters, ctx.orExp, ctx.limit);
          resolve({ data: rows, error: null });
        }
      };
    },

    /* --------------------------------------
       INSERT
    -------------------------------------- */
    insert(rows) {
      if (global.supabaseErrorOnInsert) {
        return {
          select() {
            return {
              async single() {
                return { data: null, error: new Error("forced insert error") };
              }
            };
          }
        };
      }

      if (!Array.isArray(global.__mockDB[table])) {
        global.__mockDB[table] = [];
      }
      const list = global.__mockDB[table];

      const inserted = Array.isArray(rows) ? rows : [rows];
      const row = inserted[0];

      // evitar duplicados en likes/saves
      if (["trip_likes", "trip_saves"].includes(table)) {
        const exists = list.some(
          x => x.trip_id === row.trip_id && x.user_id === row.user_id
        );
        if (exists) {
          return {
            select() {
              return {
                async single() { return { data: row, error: null }; }
              };
            }
          };
        }
      }

      // balance por defecto
      if (table === "user_balance") {
        inserted.forEach(r => {
          if (r.balance == null) r.balance = 5000;
        });
      }

      list.push(...inserted);

      return {
        select() {
          return {
            async single() { return { data: row, error: null }; }
          };
        }
      };
    },

    /* --------------------------------------
       UPDATE
    -------------------------------------- */
    update(updateRow) {
      const ctx = { key: null, val: null };

      return {
        eq(k, v) { ctx.key = k; ctx.val = v; return this; },

        select() {
          return {
            async single() {

              // ⚠️ NUEVO: simular error de Supabase.update
              if (global.supabaseErrorOnUpdate) {
                return { data: null, error: new Error("forced update error") };
              }

              if (!Array.isArray(global.__mockDB[table])) {
                global.__mockDB[table] = [];
              }

              const list = global.__mockDB[table];
              const idx = list.findIndex(r => r[ctx.key] == ctx.val);

              if (idx >= 0) {
                list[idx] = { ...list[idx], ...updateRow };
                return { data: list[idx], error: null };
              }

              return { data: null, error: null };
            }

          };
        }
      };
    },

    /* --------------------------------------
       UPSERT
    -------------------------------------- */
    upsert(rows) {
      const row = Array.isArray(rows) ? rows[0] : rows;

      if (!Array.isArray(global.__mockDB[table])) {
        global.__mockDB[table] = [];
      }
      const list = global.__mockDB[table];

      const idx = list.findIndex(r => r.id === row.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...row };
      else list.push(row);

      return {
        select() {
          return {
            then(resolve) { resolve({ data: [row], error: null }); }
          };
        }
      };
    },

    /* --------------------------------------
       DELETE
    -------------------------------------- */
    delete() {
      const filters = [];

      const api = {
        eq(k, v) { filters.push({ key: k, value: v }); return api; },

        async single() {
          if (!Array.isArray(global.__mockDB[table])) {
            global.__mockDB[table] = [];
          }

          let rows = global.__mockDB[table];

          for (const f of filters) {
            rows = rows.filter(r => r[f.key] != f.value);
          }

          global.__mockDB[table] = rows;

          return { data: {}, error: null };
        },

        // soporta: await from(...).delete().eq(...).eq(...)
        then(resolve) {
          api.single().then(res => resolve(res));
        }
      };

      return api;
    }
  };
}


/* ============================================================================
   MOCK SUPABASE
============================================================================ */
jest.unstable_mockModule("./src/config/supabase.js", () => ({
  supabase: { from: table => createQuery(table) },

  supabaseAdmin: {
    from: table => createQuery(table),
    auth: {
      admin: {
        listUsers: jest.fn().mockResolvedValue({
          data: { users: global.__mockListUsers },
          error: null
        })
      }
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null })
  }
}));

// IMPORT APP REAL
const { default: app } = await import("./src/app.js");
global.__app = app;
