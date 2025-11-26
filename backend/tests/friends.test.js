import { jest } from "@jest/globals";

import request from "supertest";
import app from "../src/app.js";

describe("Friends API", () => {
  it("should return a list of friends", async () => {
    global.__friendsMockData = [
      {
        id: "rel1",
        user_id: "user-with-friends",
        friend_id: "friend123",
        user: { id: "user-with-friends" },
        friend: {
          id: "friend123",
          username: "tester",
          display_name: "Tester",
          avatar_url: "",
          user_color: "#ccc",
        },
      },
    ];

    const res = await request(app).get("/api/friends?userId=user-with-friends");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.friends.length).toBe(1);
  });

  it("should return empty list when no friends", async () => {
    global.__friendsMockData = [];

    const res = await request(app).get("/api/friends?userId=user-no-friends");

    expect(res.status).toBe(200);
    expect(res.body.friends).toEqual([]);
  });

  it("should return 400 when missing userId", async () => {
    const res = await request(app).get("/api/friends");
    expect(res.status).toBe(400);
  });

  it("should return 500 when supabase fails", async () => {
    global.__friendsMockError = { message: "DB failure" };

    const res = await request(app).get("/api/friends?userId=user-db-error");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("DB failure");
  });
  it("should default to empty list when mock data is not defined", async () => {
  delete global.__friendsMockData;
  delete global.__friendsMockError;

  const res = await request(app).get("/api/friends?userId=abc");

  expect(res.status).toBe(200);
  expect(res.body.friends).toEqual([]);
});

// 🟦 Test: mapeo correcto sender → friend
it("should correctly return the opposite user as friend", async () => {
  global.__friendsMockData = [
    {
      id: "1",
      user_id: "A",
      friend_id: "B",
      user: { id: "A", username: "UserA" },
      friend: { id: "B", username: "UserB" }
    }
  ];

  const res = await request(app).get("/api/friends?userId=A");

  expect(res.status).toBe(200);
  expect(res.body.friends[0].friend.id).toBe("B");
});
});
