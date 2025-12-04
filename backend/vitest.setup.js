import app from "./src/app.js";

// ------------------------------
// 1) Exponer app globalmente
// ------------------------------
global.__app = app;

// ------------------------------
// 2) Mock DB inicial
// ------------------------------
global.__mockDB = {
  friends: [],
  friend_requests: [],
  balances: [],
  user_items: [],
  trips: [],
  profiles: [],

  // ⭐ Necesario para tests/shopItems.test.js
  shop_items: [
    {
      id: "space_bg_42",
      name: "Mock Space",
      description: "Mock background",
      type: "background",
      price: 500,
      image_url: "",
      texture_url: "",
      bg_url: "",
      is_default: false,
    },
  ],
};

// ------------------------------
// 3) resetMockDB()
// ------------------------------
global.resetMockDB = function () {
  global.__mockDB.friends = [];
  global.__mockDB.friend_requests = [];
  global.__mockDB.balances = [];
  global.__mockDB.user_items = [];
  global.__mockDB.trips = [];
  global.__mockDB.profiles = [];

  // ⭐ Este ítem debe existir siempre porque lo usa un test
  global.__mockDB.shop_items = [
    {
      id: "space_bg_42",
      name: "Mock Space",
      description: "Mock background",
      type: "background",
      price: 500,
      image_url: "",
      texture_url: "",
      bg_url: "",
      is_default: false,
    },
  ];
};

// ------------------------------
// 4) Log para confirmar setup
// ------------------------------
console.log("[VITEST SETUP] MockDB cargado y app expuesta.");
