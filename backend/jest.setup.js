// ============================================================
// jest.setup.js FINAL — TODOS LOS TESTS PASAN
// ============================================================

import { jest } from "@jest/globals";
import path from "path";
import { fileURLToPath } from "url";

process.env.NODE_ENV = "test";

// Resolver rutas absolutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta absoluta al archivo supabase.js
const supabasePath = path.resolve(__dirname, "src/config/supabase.js");

// ============================================================
// BASE DE DATOS MOCK
// ============================================================
global.__mockDB = {
  users: [],
  friends: [],
  notifications: [],
  trips: [],
  trip_stops: [],
  trip_likes: [],
  trip_comments: []
};

global.resetMockDB = () => {
  for (const key of Object.keys(global.__mockDB)) {
    global.__mockDB[key] = [];
  }
};

// ============================================================
// UTILS
// ============================================================
const clone = (obj) => JSON.parse(JSON.stringify(obj));

const ensureTable = (table) => {
  if (!Array.isArray(global.__mockDB[table])) {
    throw new Error(`Mock table "${table}" está corrupta`);
  }
};

// ============================================================
// OR parser (AND/OR complejo idéntico al de Supabase)
// ============================================================
function parseOr(condString) {
  const groups = condString.split("),");

  return (row) =>
    groups.some((g) => {
      const cleaned = g.replace(/^and\(/, "").replace(/\)$/, "");
      const conds = cleaned.split(",");

      return conds.every((c) => {
        const [field, val] = c.split(".eq.");
        return row[field] === val;
      });
    });
}

// ============================================================
// FILTROS
// ============================================================
function applyFilters(table, filters, orFilterFn) {
  ensureTable(table);
  let rows = [...global.__mockDB[table]];

  for (const f of filters) {
    rows = rows.filter((row) => {
      const v = row[f.column];
      if (f.type === "eq") return v === f.value;
      if (f.type === "neq") return v !== f.value;
      if (f.type === "in") return f.values.includes(v);
      return true;
    });
  }

  if (orFilterFn) rows = rows.filter(orFilterFn);

  return clone(rows);
}

// ============================================================
// JOINS (solo los que usa tu backend real)
// ============================================================
function resolveJoins(table, rows) {
  if (table === "friends") {
    return rows.map((r) => ({
      ...r,
      user: global.__mockDB.users.find((u) => u.id === r.user_id) || null,
      friend: global.__mockDB.users.find((u) => u.id === r.friend_id) || null,
    }));
  }

  if (table === "trips") {
    return rows.map((r) => ({
      ...r,
      users: global.__mockDB.users.find((u) => u.id === r.user_id) || null,
    }));
  }

  if (table === "trip_comments") {
    return rows.map((r) => ({
      ...r,
      user: global.__mockDB.users.find((u) => u.id === r.user_id) || null,
    }));
  }

  if (table === "trip_stops") {
    return rows.map((r) => ({
      ...r,
      country: {
        id: r.country_id,
        name: "Country",
        latitude: 0,
        longitude: 0,
      },
    }));
  }

  return rows;
}

// ============================================================
// TABLE BUILDER
// ============================================================
function mockTable(table) {
  let filters = [];
  let orFilterFn = null;

  return {
    // SELECT ---------------------------------------------------
    select() {
      ensureTable(table);

      return {
        eq(col, val) {
          filters.push({ type: "eq", column: col, value: val });
          return this;
        },
        neq(col, val) {
          filters.push({ type: "neq", column: col, value: val });
          return this;
        },
        in(col, values) {
          filters.push({ type: "in", column: col, values });
          return this;
        },
        or(condString) {
          orFilterFn = parseOr(condString);
          return this;
        },
        limit() { return this; },
        order() { return this; },

        async single() {
          const rows = applyFilters(table, filters, orFilterFn);
          return { data: resolveJoins(table, rows)[0] || null, error: null };
        },

        async maybeSingle() {
          const rows = applyFilters(table, filters, orFilterFn);
          return { data: resolveJoins(table, rows)[0] || null, error: null };
        },

        async then(resolve) {
          const rows = applyFilters(table, filters, orFilterFn);
          return resolve({
            data: resolveJoins(table, rows),
            error: null,
          });
        },
      };
    },

    // INSERT ---------------------------------------------------
    insert(data) {
      return {
        select: () => ({
          single: async () => {
            ensureTable(table);
            const item = {
              ...data,
              id: data.id || Math.random().toString(36).slice(2),
            };
            global.__mockDB[table].push(item);
            return { data: clone(item), error: null };
          },
        }),

        async single() {
          ensureTable(table);
          const item = {
            ...data,
            id: data.id || Math.random().toString(36).slice(2),
          };
          global.__mockDB[table].push(item);
          return { data: clone(item), error: null };
        },
      };
    },

    // UPDATE ---------------------------------------------------
    update(changes) {
      return {
        eq(col, val) {
          ensureTable(table);
          let updated = null;

          global.__mockDB[table] = global.__mockDB[table].map((row) => {
            if (row[col] === val) {
              updated = { ...row, ...changes };
              return updated;
            }
            return row;
          });

          return {
            select: () => ({
              single: async () => ({ data: clone(updated), error: null }),
            }),
            async single() {
              return { data: clone(updated), error: null };
            },
          };
        },
      };
    },

    // UPSERT ---------------------------------------------------
    async upsert(data) {
      ensureTable(table);

      const row = Array.isArray(data) ? data[0] : data;
      let existing = global.__mockDB[table].find((r) => r.id === row.id);

      if (existing) {
        Object.assign(existing, row);
        return {
          select() {
            return {
              single: async () => ({ data: clone(existing), error: null }),
            };
          },
        };
      }

      const newRow = {
        ...row,
        id: row.id || Math.random().toString(36).slice(2),
      };
      global.__mockDB[table].push(newRow);

      return {
        select() {
          return {
            single: async () => ({ data: clone(newRow), error: null }),
          };
        },
      };
    },

    // DELETE ---------------------------------------------------
    delete() {
      return {
        eq(col, val) {
          ensureTable(table);
          global.__mockDB[table] =
            global.__mockDB[table].filter((row) => row[col] !== val);

          return {
            async then() { return { data: null, error: null }; },
            select: () => ({ single: async () => ({ data: null, error: null }) }),
          };
        },

        in(col, values) {
          ensureTable(table);
          global.__mockDB[table] =
            global.__mockDB[table].filter((row) => !values.includes(row[col]));

          return {
            async then() { return { data: null, error: null }; },
            select: () => ({ single: async () => ({ data: null, error: null }) }),
          };
        },

        or(condString) {
          ensureTable(table);
          const fn = parseOr(condString);

          global.__mockDB[table] =
            global.__mockDB[table].filter((row) => !fn(row));

          return {
            async then() { return { data: null, error: null }; },
            select: () => ({ single: async () => ({ data: null, error: null }) }),
          };
        },
      };
    },
  };
}

// ============================================================
// SUPABASE MOCK (ESM ASÍNCRONO)
// ============================================================
await jest.unstable_mockModule(supabasePath, () => ({
  supabaseAdmin: {
    from: (table) => mockTable(table),

    auth: {
      admin: {
        listUsers: async () => ({
          data: { users: clone(global.__mockDB.users) },
          error: null,
        }),
      },
    },

    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        remove: async () => ({ error: null }),
        getPublicUrl: (file) => ({
          data: { publicUrl: `https://mockstorage/${file}` },
        }),
      }),
    },

    rpc: async () => ({ data: null, error: null }),
  },
}));

// ============================================================
// IMPORTAR LA APP DESPUÉS DEL MOCK
// ============================================================
const appModule = await import("./src/app.js");
global.__app = appModule.default;
