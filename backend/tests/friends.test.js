import request from "supertest";

const app = global.__app;

beforeEach(() => {
  global.resetMockDB();
});

/* -------------------------------------------------------
   TEST: GET /api/friends
------------------------------------------------------- */

describe("GET /api/friends", () => {
  test("debe devolver 400 si falta userId", async () => {
    const res = await request(app).get("/api/friends");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userId/i);
  });

  test("debe devolver lista vacía si no tiene amigos", async () => {
    global.__mockDB.friends = [];

    const res = await request(app).get("/api/friends?userId=abc123");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.friends)).toBe(true);
    expect(res.body.friends.length).toBe(0);
  });

  test("debe devolver los amigos correctamente (modo test)", async () => {
    global.__mockDB.users.push(
      { id: "A", username: "userA", display_name: "User A", user_color: "#111", avatar_url: "" },
      { id: "B", username: "userB", display_name: "User B", user_color: "#222", avatar_url: "" }
    );

    global.__mockDB.friends.push({
      id: "rel1",
      user_id: "A",
      friend_id: "B",
      created_at: "2024-01-01T00:00:00Z"
    });

    const res = await request(app).get("/api/friends?userId=A");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(res.body.friends.length).toBe(1);

    const f = res.body.friends[0];
    expect(f.friend.id).toBe("B");
    expect(f.friend.username).toBe("userB");
    expect(f.friend.display_name).toBe("User B");
    expect(f.friend.user_color).toBe("#222");
  });

  test("debe recuperar amigos aunque el usuario sea friend_id (relación invertida)", async () => {
    global.__mockDB.users.push(
      { id: "A", username: "userA" },
      { id: "B", username: "userB" }
    );

    global.__mockDB.friends.push({
      id: "rel2",
      user_id: "B",
      friend_id: "A",
      created_at: "2024-01-01"
    });

    const res = await request(app).get("/api/friends?userId=A");

    expect(res.status).toBe(200);
    expect(res.body.friends.length).toBe(1);
    expect(res.body.friends[0].friend.id).toBe("B");
  });
});
