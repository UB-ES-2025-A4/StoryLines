import { jest } from "@jest/globals";

/* ============================================================
   MEMORIA GLOBAL
   ============================================================ */
const TABLES = [
  "users",
  "friends",
  "notifications",
  "trips",
  "trip_stops",
  "shop_items",
  "user_balance",
  "user_items",
  "trip_likes",
  "trip_comments",
  "trip_saves",
  "countries",
];

global.__mockDB = {};
TABLES.forEach((t) => (global.__mockDB[t] = []));

global.__mockListUsers = [];

global.resetMockDB = () => {
  TABLES.forEach((t) => {
    global.__mockDB[t] = [];
  });
  global.__mockListUsers = [];
};

/* ============================================================
   FILTROS
   ============================================================ */
function applyFilters(ctx, rows) {
  let data = [...rows];

  // eq / neq / in
  ctx.filters.forEach((f) => {
    if (f.type === "eq") {
      data = data.filter((x) => x?.[f.column] == f.value);
    }
    if (f.type === "neq") {
      data = data.filter((x) => x?.[f.column] != f.value);
    }
    if (f.type === "in") {
      data = data.filter((x) => f.values.includes(x?.[f.column]));
    }
  });

  // or("user_id.eq.X,friend_id.eq.X")
  if (ctx.orExpr) {
    const rules = ctx.orExpr.split(",").map((r) => r.trim());
    data = data.filter((row) =>
      rules.some((rule) => {
        const [col, op, val] = rule.split(".");
        if (op === "eq") return row?.[col] == val;
        return false;
      })
    );
  }

  // limit
  if (ctx.limit != null) {
    data = data.slice(0, ctx.limit);
  }

  // order
  if (ctx.orderBy) {
    const col = ctx.orderBy;
    const asc = ctx.orderAsc;
    data.sort((a, b) => {
      if (a?.[col] == null && b?.[col] == null) return 0;
      if (a?.[col] == null) return asc ? -1 : 1;
      if (b?.[col] == null) return asc ? 1 : -1;
      if (a[col] < b[col]) return asc ? -1 : 1;
      if (a[col] > b[col]) return asc ? 1 : -1;
      return 0;
    });
  }

  return data;
}

/* ============================================================
   EJECUCIÓN DEL QUERY
   ============================================================ */
async function executeQuery(ctx) {
  const tableName = ctx.table;
  const store = global.__mockDB[tableName] || [];

  // SELECT
  if (ctx.action === "select") {
    let data = applyFilters(ctx, store);

    // count/head (para trip_comments, trip_likes, etc.)
    let count = undefined;
    if (ctx.count) {
      count = data.length;
      if (ctx.head) {
        data = null;
      }
    }

    if (ctx.singleMode || ctx.maybeSingleMode) {
      const first = (data || [])[0] ?? null;
      return { data: first, error: null, count };
    }

    return { data, error: null, count };
  }

  // INSERT
  if (ctx.action === "insert") {
    const toInsert = Array.isArray(ctx.payload)
      ? ctx.payload
      : [ctx.payload];
    const store = global.__mockDB[tableName] || (global.__mockDB[tableName] = []);
    store.push(...toInsert);

    if (ctx.returning) {
      let data = applyFilters(ctx, toInsert);
      if (ctx.singleMode || ctx.maybeSingleMode) {
        data = data[0] ?? null;
      }
      return { data, error: null };
    }

    return { data: toInsert, error: null };
  }

  // UPDATE
  if (ctx.action === "update") {
    const store = global.__mockDB[tableName] || (global.__mockDB[tableName] = []);
    const updated = [];

    store.forEach((row) => {
      const matches = applyFilters(ctx, [row]).length > 0;
      if (matches) {
        Object.assign(row, ctx.payload);
        updated.push(row);
      }
    });

    if (ctx.returning) {
      let data = updated;
      if (ctx.singleMode || ctx.maybeSingleMode) {
        data = data[0] ?? null;
      }
      return { data, error: null };
    }

    return { data: updated, error: null };
  }

  // DELETE
  if (ctx.action === "delete") {
    const store = global.__mockDB[tableName] || (global.__mockDB[tableName] = []);
    const kept = [];
    const removed = [];

    store.forEach((row) => {
      const matches = applyFilters(ctx, [row]).length > 0;
      if (matches) removed.push(row);
      else kept.push(row);
    });

    global.__mockDB[tableName] = kept;

    if (ctx.returning) {
      let data = removed;
      if (ctx.singleMode || ctx.maybeSingleMode) {
        data = data[0] ?? null;
      }
      return { data, error: null };
    }

    return { data: removed, error: null };
  }

  return { data: null, error: null };
}

/* ============================================================
   QUERY BUILDER
   ============================================================ */
function createQuery(table) {
  const ctx = {
    table,
    action: "select", // "select" | "insert" | "update" | "delete"
    payload: null,
    filters: [],
    orExpr: null,
    limit: null,
    orderBy: null,
    orderAsc: true,
    singleMode: false,
    maybeSingleMode: false,
    head: false,
    count: null,
    returning: false, // para insert/update/delete .select()
  };

  const query = {
    // --- construcción de consulta ---
    select(columns = "*", options = {}) {
      // si venimos de insert/update/delete ⇒ queremos RETURNING
      if (ctx.action === "insert" || ctx.action === "update" || ctx.action === "delete") {
        ctx.returning = true;
      } else {
        ctx.action = "select";
      }

      if (options.head) ctx.head = true;
      if (options.count) ctx.count = options.count;
      return query;
    },

    eq(column, value) {
      ctx.filters.push({ type: "eq", column, value });
      return query;
    },

    neq(column, value) {
      ctx.filters.push({ type: "neq", column, value });
      return query;
    },

    in(column, values) {
      ctx.filters.push({ type: "in", column, values });
      return query;
    },

    or(expr) {
      ctx.orExpr = expr;
      return query;
    },

    limit(n) {
      ctx.limit = n;
      return query;
    },

    order(column, { ascending = true } = {}) {
      ctx.orderBy = column;
      ctx.orderAsc = ascending;
      return query;
    },

    // --- acciones base ---
    insert(rows) {
      ctx.action = "insert";
      ctx.payload = rows;
      return query;
    },

    update(patch) {
      ctx.action = "update";
      ctx.payload = patch;
      return query;
    },

    delete() {
      ctx.action = "delete";
      return query;
    },

    // --- métodos tipo Supabase ---
    async single() {
      ctx.singleMode = true;
      return executeQuery(ctx);
    },

    async maybeSingle() {
      ctx.maybeSingleMode = true;
      return executeQuery(ctx);
    },

    // Para patrones tipo: const { data, error } = await query;
    then(resolve, reject) {
      executeQuery(ctx).then(resolve, reject);
    },

    catch(onReject) {
      return executeQuery(ctx).catch(onReject);
    },

    finally(cb) {
      return executeQuery(ctx).finally(cb);
    },
  };

  return query;
}

/* ============================================================
   MOCK SUPABASE COMPLETO
   ============================================================ */
jest.unstable_mockModule("./src/config/supabase.js", () => {
  const client = {
    from: (table) => createQuery(table),

    // RPC: solo necesitamos que no falle
    rpc: async () => ({ data: null, error: null }),

    // Storage: lo mismo, para avatar
    storage: {
      from: () => ({
        async upload() {
          return { data: { path: "mock-path" }, error: null };
        },
        async remove() {
          return { data: null, error: null };
        },
        getPublicUrl(fileName) {
          return {
            data: { publicUrl: `https://mock-storage/${fileName}` },
            error: null,
          };
        },
      }),
    },
  };

  return {
    supabase: client,
    supabaseAdmin: {
      ...client,
      auth: {
        admin: {
          listUsers: jest.fn().mockImplementation(async () => ({
            data: { users: global.__mockListUsers },
            error: null,
          })),
        },
      },
    },
  };
});

/* ============================================================
   CARGAR APP Y EXPONERLA EN GLOBAL
   ============================================================ */
const { default: app } = await import("./src/app.js");
global.__app = app;
