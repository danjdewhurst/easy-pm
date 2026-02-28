import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestServer, teardownTestServer, api, apiJson, resetTestDb } from "./helpers.ts";

beforeAll(() => {
  setupTestServer();
});

afterAll(() => {
  teardownTestServer();
});

// Reset DB between tests for isolation (recreates tables so IDs start from 1)
beforeEach(() => {
  resetTestDb();
});

// ─── Health ──────────────────────────────────────────────────────

describe("Health", () => {
  test("GET /api/health returns ok", async () => {
    const res = await api("/api/health");
    expect(res.status).toBe(200);
    const body = await apiJson<{ status: string }>(res);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ok");
  });
});

// ─── Auth ────────────────────────────────────────────────────────

describe("Auth", () => {
  test("returns 401 without API key", async () => {
    // Use api helper URL but strip auth
    const res = await api("/api/projects", {
      headers: { "X-API-Key": "" },
    });
    expect(res.status).toBe(401);
  });

  test("returns 401 with wrong API key", async () => {
    const res = await api("/api/projects", {
      headers: { "X-API-Key": "wrong-key" },
    });
    expect(res.status).toBe(401);
  });
});

// ─── Projects ────────────────────────────────────────────────────

describe("Projects", () => {
  test("list empty projects", async () => {
    const res = await api("/api/projects");
    expect(res.status).toBe(200);
    const body = await apiJson<unknown[]>(res);
    expect(body.data).toEqual([]);
  });

  test("create project", async () => {
    const res = await api("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Test Project", description: "A test" }),
    });
    expect(res.status).toBe(201);
    const body = await apiJson<{ id: number; name: string; description: string }>(res);
    expect(body.data.name).toBe("Test Project");
    expect(body.data.description).toBe("A test");
    expect(body.data.id).toBe(1);
  });

  test("get project", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    const res = await api("/api/projects/1");
    expect(res.status).toBe(200);
    const body = await apiJson<{ id: number; name: string }>(res);
    expect(body.data.name).toBe("P1");
  });

  test("get non-existent project returns 404", async () => {
    const res = await api("/api/projects/999");
    expect(res.status).toBe(404);
  });

  test("update project", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    const res = await api("/api/projects/1", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(200);
    const body = await apiJson<{ name: string }>(res);
    expect(body.data.name).toBe("Updated");
  });

  test("delete project", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    const res = await api("/api/projects/1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const getRes = await api("/api/projects/1");
    expect(getRes.status).toBe(404);
  });

  test("create project without name returns 400", async () => {
    const res = await api("/api/projects", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

// ─── Boards ──────────────────────────────────────────────────────

describe("Boards", () => {
  test("CRUD boards", async () => {
    // Create project first
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });

    // Create board
    const createRes = await api("/api/projects/1/boards", {
      method: "POST",
      body: JSON.stringify({ name: "Board 1" }),
    });
    expect(createRes.status).toBe(201);

    // List boards
    const listRes = await api("/api/projects/1/boards");
    const listBody = await apiJson<unknown[]>(listRes);
    expect(listBody.data).toHaveLength(1);

    // Get board (full view)
    const getRes = await api("/api/boards/1");
    const getBody = await apiJson<{ columns: unknown[] }>(getRes);
    expect(getBody.data.columns).toEqual([]);

    // Update board
    const updateRes = await api("/api/boards/1", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated Board" }),
    });
    const updateBody = await apiJson<{ name: string }>(updateRes);
    expect(updateBody.data.name).toBe("Updated Board");

    // Delete board
    const deleteRes = await api("/api/boards/1", { method: "DELETE" });
    expect(deleteRes.status).toBe(200);
  });

  test("create board on non-existent project returns 404", async () => {
    const res = await api("/api/projects/999/boards", {
      method: "POST",
      body: JSON.stringify({ name: "B1" }),
    });
    expect(res.status).toBe(404);
  });
});

// ─── Columns ─────────────────────────────────────────────────────

describe("Columns", () => {
  test("CRUD columns", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    await api("/api/projects/1/boards", { method: "POST", body: JSON.stringify({ name: "B1" }) });

    // Create column
    const createRes = await api("/api/boards/1/columns", {
      method: "POST",
      body: JSON.stringify({ name: "To Do" }),
    });
    expect(createRes.status).toBe(201);
    const createBody = await apiJson<{ position: number }>(createRes);
    expect(createBody.data.position).toBe(1000);

    // Create second column
    await api("/api/boards/1/columns", {
      method: "POST",
      body: JSON.stringify({ name: "Done" }),
    });

    // Update column
    const updateRes = await api("/api/columns/1", {
      method: "PUT",
      body: JSON.stringify({ name: "In Progress" }),
    });
    const updateBody = await apiJson<{ name: string }>(updateRes);
    expect(updateBody.data.name).toBe("In Progress");

    // Delete column
    const deleteRes = await api("/api/columns/2", { method: "DELETE" });
    expect(deleteRes.status).toBe(200);
  });

  test("reorder columns", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    await api("/api/projects/1/boards", { method: "POST", body: JSON.stringify({ name: "B1" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "A" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "B" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "C" }) });

    // Reorder: C, A, B
    const res = await api("/api/boards/1/columns/reorder", {
      method: "PUT",
      body: JSON.stringify({ column_ids: [3, 1, 2] }),
    });
    expect(res.status).toBe(200);
    const body = await apiJson<{ id: number; name: string }[]>(res);
    expect(body.data.map((c) => c.name)).toEqual(["C", "A", "B"]);
  });
});

// ─── Cards ───────────────────────────────────────────────────────

describe("Cards", () => {
  test("CRUD cards", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    await api("/api/projects/1/boards", { method: "POST", body: JSON.stringify({ name: "B1" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "To Do" }) });

    // Create card
    const createRes = await api("/api/columns/1/cards", {
      method: "POST",
      body: JSON.stringify({
        title: "Task 1",
        description: "Do something",
        time_estimate: 60,
      }),
    });
    expect(createRes.status).toBe(201);
    const createBody = await apiJson<{ title: string; labels: unknown[] }>(createRes);
    expect(createBody.data.title).toBe("Task 1");
    expect(createBody.data.labels).toEqual([]);

    // List cards
    const listRes = await api("/api/columns/1/cards");
    const listBody = await apiJson<unknown[]>(listRes);
    expect(listBody.data).toHaveLength(1);

    // Get card
    const getRes = await api("/api/cards/1");
    expect(getRes.status).toBe(200);

    // Update card
    const updateRes = await api("/api/cards/1", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated Task" }),
    });
    const updateBody = await apiJson<{ title: string }>(updateRes);
    expect(updateBody.data.title).toBe("Updated Task");

    // Delete card
    const deleteRes = await api("/api/cards/1", { method: "DELETE" });
    expect(deleteRes.status).toBe(200);
  });

  test("move card between columns", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    await api("/api/projects/1/boards", { method: "POST", body: JSON.stringify({ name: "B1" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "To Do" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "Done" }) });
    await api("/api/columns/1/cards", { method: "POST", body: JSON.stringify({ title: "Task 1" }) });

    const moveRes = await api("/api/cards/1/move", {
      method: "PUT",
      body: JSON.stringify({ column_id: 2 }),
    });
    expect(moveRes.status).toBe(200);
    const moveBody = await apiJson<{ column_id: number }>(moveRes);
    expect(moveBody.data.column_id).toBe(2);
  });

  test("set card labels", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    await api("/api/projects/1/boards", { method: "POST", body: JSON.stringify({ name: "B1" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "To Do" }) });
    await api("/api/columns/1/cards", { method: "POST", body: JSON.stringify({ title: "Task 1" }) });
    await api("/api/projects/1/labels", {
      method: "POST",
      body: JSON.stringify({ name: "Bug", colour: "#ff0000" }),
    });
    await api("/api/projects/1/labels", {
      method: "POST",
      body: JSON.stringify({ name: "Feature", colour: "#00ff00" }),
    });

    const setRes = await api("/api/cards/1/labels", {
      method: "PUT",
      body: JSON.stringify({ label_ids: [1, 2] }),
    });
    expect(setRes.status).toBe(200);
    const body = await apiJson<{ labels: { id: number }[] }>(setRes);
    expect(body.data.labels).toHaveLength(2);

    // Update labels (remove one)
    const updateRes = await api("/api/cards/1/labels", {
      method: "PUT",
      body: JSON.stringify({ label_ids: [1] }),
    });
    const updateBody = await apiJson<{ labels: { id: number }[] }>(updateRes);
    expect(updateBody.data.labels).toHaveLength(1);
  });
});

// ─── Labels ──────────────────────────────────────────────────────

describe("Labels", () => {
  test("CRUD labels", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });

    // Create
    const createRes = await api("/api/projects/1/labels", {
      method: "POST",
      body: JSON.stringify({ name: "Bug", colour: "#ff0000" }),
    });
    expect(createRes.status).toBe(201);

    // List
    const listRes = await api("/api/projects/1/labels");
    const listBody = await apiJson<unknown[]>(listRes);
    expect(listBody.data).toHaveLength(1);

    // Update
    const updateRes = await api("/api/labels/1", {
      method: "PUT",
      body: JSON.stringify({ name: "Critical Bug", colour: "#cc0000" }),
    });
    const updateBody = await apiJson<{ name: string; colour: string }>(updateRes);
    expect(updateBody.data.name).toBe("Critical Bug");
    expect(updateBody.data.colour).toBe("#cc0000");

    // Delete
    const deleteRes = await api("/api/labels/1", { method: "DELETE" });
    expect(deleteRes.status).toBe(200);
  });

  test("invalid colour returns 400", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    const res = await api("/api/projects/1/labels", {
      method: "POST",
      body: JSON.stringify({ name: "Bad", colour: "not-a-colour" }),
    });
    expect(res.status).toBe(400);
  });
});

// ─── Search ──────────────────────────────────────────────────────

describe("Search", () => {
  test("search cards by title", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    await api("/api/projects/1/boards", { method: "POST", body: JSON.stringify({ name: "B1" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "To Do" }) });
    await api("/api/columns/1/cards", {
      method: "POST",
      body: JSON.stringify({ title: "Fix authentication bug", description: "Users cannot log in" }),
    });
    await api("/api/columns/1/cards", {
      method: "POST",
      body: JSON.stringify({ title: "Add dark mode" }),
    });

    const res = await api("/api/search?q=authentication");
    expect(res.status).toBe(200);
    const body = await apiJson<{ card: { title: string } }[]>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.card.title).toBe("Fix authentication bug");
  });

  test("search with projectId filter", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P2" }) });
    await api("/api/projects/1/boards", { method: "POST", body: JSON.stringify({ name: "B1" }) });
    await api("/api/projects/2/boards", { method: "POST", body: JSON.stringify({ name: "B2" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "C1" }) });
    await api("/api/boards/2/columns", { method: "POST", body: JSON.stringify({ name: "C2" }) });
    await api("/api/columns/1/cards", { method: "POST", body: JSON.stringify({ title: "Shared term" }) });
    await api("/api/columns/2/cards", { method: "POST", body: JSON.stringify({ title: "Shared term here too" }) });

    const res = await api("/api/search?q=shared&projectId=1");
    const body = await apiJson<unknown[]>(res);
    expect(body.data).toHaveLength(1);
  });

  test("search without query returns 400", async () => {
    const res = await api("/api/search");
    expect(res.status).toBe(400);
  });
});

// ─── Full Board View ─────────────────────────────────────────────

describe("Full Board View", () => {
  test("GET /api/boards/:id returns nested columns and cards", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    await api("/api/projects/1/boards", { method: "POST", body: JSON.stringify({ name: "B1" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "To Do" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "Done" }) });
    await api("/api/columns/1/cards", { method: "POST", body: JSON.stringify({ title: "Card A" }) });
    await api("/api/columns/1/cards", { method: "POST", body: JSON.stringify({ title: "Card B" }) });
    await api("/api/columns/2/cards", { method: "POST", body: JSON.stringify({ title: "Card C" }) });

    const res = await api("/api/boards/1");
    const body = await apiJson<{
      name: string;
      columns: { name: string; cards: { title: string }[] }[];
    }>(res);

    expect(body.data.name).toBe("B1");
    expect(body.data.columns).toHaveLength(2);
    expect(body.data.columns[0]!.cards).toHaveLength(2);
    expect(body.data.columns[1]!.cards).toHaveLength(1);
  });
});

// ─── Cascade Deletes ─────────────────────────────────────────────

describe("Cascade Deletes", () => {
  test("deleting a project cascades to boards, columns, cards", async () => {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name: "P1" }) });
    await api("/api/projects/1/boards", { method: "POST", body: JSON.stringify({ name: "B1" }) });
    await api("/api/boards/1/columns", { method: "POST", body: JSON.stringify({ name: "C1" }) });
    await api("/api/columns/1/cards", { method: "POST", body: JSON.stringify({ title: "Card 1" }) });

    await api("/api/projects/1", { method: "DELETE" });

    const boardRes = await api("/api/boards/1");
    expect(boardRes.status).toBe(404);

    const cardRes = await api("/api/cards/1");
    expect(cardRes.status).toBe(404);
  });
});
