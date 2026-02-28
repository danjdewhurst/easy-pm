import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestServer, teardownTestServer, resetTestDb, getTestBaseUrl } from "../server/helpers.ts";

function cli(...args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = Bun.spawn(
      ["bun", "run", "src/cli/index.ts", ...args],
      {
        cwd: "/Users/dan/Projects/easy-pm",
        env: {
          ...process.env,
          EASY_PM_API_URL: getTestBaseUrl(),
          EASY_PM_API_KEY: "dev-api-key",
        },
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]).then(([stdout, stderr, exitCode]) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
}

beforeAll(() => {
  setupTestServer();
});

afterAll(() => {
  teardownTestServer();
});

beforeEach(() => {
  resetTestDb();
});

describe("CLI", () => {
  test("--help shows usage", async () => {
    const result = await cli("--help");
    expect(result.stdout).toContain("Usage:");
    expect(result.exitCode).toBe(0);
  });

  test("project create and list", async () => {
    const create = await cli("project", "create", "--name", "Test Project", "--format", "json");
    expect(create.exitCode).toBe(0);
    const createData = JSON.parse(create.stdout);
    expect(createData.ok).toBe(true);
    expect(createData.data.name).toBe("Test Project");

    const list = await cli("project", "list", "--format", "json");
    expect(list.exitCode).toBe(0);
    const listData = JSON.parse(list.stdout);
    expect(listData.data).toHaveLength(1);
  });

  test("project CRUD flow", async () => {
    // Create
    await cli("project", "create", "--name", "P1", "--format", "json");

    // Get
    const get = await cli("project", "get", "--id", "1", "--format", "json");
    expect(JSON.parse(get.stdout).data.name).toBe("P1");

    // Update
    const update = await cli("project", "update", "--id", "1", "--name", "Updated", "--format", "json");
    expect(JSON.parse(update.stdout).data.name).toBe("Updated");

    // Delete
    const del = await cli("project", "delete", "--id", "1", "--format", "json");
    expect(JSON.parse(del.stdout).ok).toBe(true);
  });

  test("search command", async () => {
    await cli("project", "create", "--name", "P1", "--format", "json");
    await cli("board", "create", "--project-id", "1", "--name", "B1", "--format", "json");
    await cli("column", "create", "--board-id", "1", "--name", "To Do", "--format", "json");
    await cli("card", "create", "--column-id", "1", "--title", "Fix authentication bug", "--format", "json");

    const result = await cli("search", "authentication", "--format", "json");
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.data).toHaveLength(1);
  });

  test("table format output", async () => {
    await cli("project", "create", "--name", "P1", "--format", "json");
    const result = await cli("project", "list", "--format", "table");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("P1");
    expect(result.stdout).toContain("id");
  });
});
