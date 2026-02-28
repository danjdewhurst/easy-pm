import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import { resolve as pathResolve } from "node:path";
import {
	getTestBaseUrl,
	getTestToken,
	resetTestDb,
	setupTestServer,
	teardownTestServer,
} from "../server/helpers.ts";

const PROJECT_ROOT = pathResolve(import.meta.dir, "../..");

function cli(
	...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return new Promise((resolve) => {
		const proc = Bun.spawn(
			[process.execPath, "run", "src/cli/index.ts", ...args],
			{
				cwd: PROJECT_ROOT,
				env: {
					...process.env,
					EASY_PM_API_URL: getTestBaseUrl(),
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

/** CLI helper that passes the test token */
function cliAuth(
	...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return cli("--token", getTestToken(), ...args);
}

beforeAll(() => {
	setupTestServer();
});

afterAll(() => {
	teardownTestServer();
});

beforeEach(async () => {
	await resetTestDb();
});

describe("CLI", () => {
	test("--help shows usage", async () => {
		const result = await cli("--help");
		expect(result.stdout).toContain("Usage:");
		expect(result.stdout).toContain("auth");
		expect(result.exitCode).toBe(0);
	});

	test("project create and list", async () => {
		const create = await cliAuth(
			"project",
			"create",
			"--name",
			"Test Project",
			"--format",
			"json",
		);
		expect(create.exitCode).toBe(0);
		const createData = JSON.parse(create.stdout);
		expect(createData.ok).toBe(true);
		expect(createData.data.name).toBe("Test Project");

		const list = await cliAuth("project", "list", "--format", "json");
		expect(list.exitCode).toBe(0);
		const listData = JSON.parse(list.stdout);
		expect(listData.data).toHaveLength(1);
	});

	test("project CRUD flow", async () => {
		// Create
		await cliAuth("project", "create", "--name", "P1", "--format", "json");

		// Get
		const get = await cliAuth(
			"project",
			"get",
			"--id",
			"1",
			"--format",
			"json",
		);
		expect(JSON.parse(get.stdout).data.name).toBe("P1");

		// Update
		const update = await cliAuth(
			"project",
			"update",
			"--id",
			"1",
			"--name",
			"Updated",
			"--format",
			"json",
		);
		expect(JSON.parse(update.stdout).data.name).toBe("Updated");

		// Delete
		const del = await cliAuth(
			"project",
			"delete",
			"--id",
			"1",
			"--format",
			"json",
		);
		expect(JSON.parse(del.stdout).ok).toBe(true);
	});

	test("search command", async () => {
		await cliAuth("project", "create", "--name", "P1", "--format", "json");
		await cliAuth(
			"board",
			"create",
			"--project-id",
			"1",
			"--name",
			"B1",
			"--format",
			"json",
		);
		await cliAuth(
			"column",
			"create",
			"--board-id",
			"1",
			"--name",
			"To Do",
			"--format",
			"json",
		);
		await cliAuth(
			"card",
			"create",
			"--column-id",
			"1",
			"--title",
			"Fix authentication bug",
			"--format",
			"json",
		);

		const result = await cliAuth(
			"search",
			"authentication",
			"--format",
			"json",
		);
		expect(result.exitCode).toBe(0);
		const data = JSON.parse(result.stdout);
		expect(data.data).toHaveLength(1);
	});

	test("table format output", async () => {
		await cliAuth("project", "create", "--name", "P1", "--format", "json");
		const result = await cliAuth("project", "list", "--format", "table");
		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("P1");
		expect(result.stdout).toContain("id");
	});

	test("auth register and whoami", async () => {
		const register = await cli(
			"--api-url",
			getTestBaseUrl(),
			"auth",
			"register",
			"--email",
			"cliuser@example.com",
			"--password",
			"password123",
		);
		expect(register.exitCode).toBe(0);
		expect(register.stdout).toContain("Registered and logged in");
	});

	test("returns error without token for protected routes", async () => {
		const result = await cli(
			"--api-url",
			getTestBaseUrl(),
			"project",
			"list",
			"--format",
			"json",
		);
		expect(result.exitCode).toBe(1);
	});

	test("unknown resource shows error", async () => {
		const result = await cliAuth("nonexistent", "list");
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain("Unknown resource");
	});

	test("unknown action shows error", async () => {
		const result = await cliAuth("project", "nonexistent");
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain("Unknown project action");
	});
});

describe("CLI board commands", () => {
	test("board CRUD flow", async () => {
		await cliAuth("project", "create", "--name", "P1", "--format", "json");

		// Create board
		const create = await cliAuth(
			"board",
			"create",
			"--project-id",
			"1",
			"--name",
			"B1",
			"--format",
			"json",
		);
		expect(create.exitCode).toBe(0);
		expect(JSON.parse(create.stdout).data.name).toBe("B1");

		// List boards
		const list = await cliAuth(
			"board",
			"list",
			"--project-id",
			"1",
			"--format",
			"json",
		);
		expect(list.exitCode).toBe(0);
		expect(JSON.parse(list.stdout).data).toHaveLength(1);

		// Get board
		const get = await cliAuth("board", "get", "--id", "1", "--format", "json");
		expect(get.exitCode).toBe(0);
		expect(JSON.parse(get.stdout).data.name).toBe("B1");

		// Update board
		const update = await cliAuth(
			"board",
			"update",
			"--id",
			"1",
			"--name",
			"Updated Board",
			"--format",
			"json",
		);
		expect(update.exitCode).toBe(0);
		expect(JSON.parse(update.stdout).data.name).toBe("Updated Board");

		// Delete board
		const del = await cliAuth(
			"board",
			"delete",
			"--id",
			"1",
			"--format",
			"json",
		);
		expect(del.exitCode).toBe(0);
		expect(JSON.parse(del.stdout).ok).toBe(true);
	});

	test("board create requires --project-id", async () => {
		const result = await cliAuth(
			"board",
			"create",
			"--name",
			"B1",
			"--format",
			"json",
		);
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain("--project-id");
	});
});

describe("CLI column commands", () => {
	test("column create and reorder", async () => {
		await cliAuth("project", "create", "--name", "P1", "--format", "json");
		await cliAuth(
			"board",
			"create",
			"--project-id",
			"1",
			"--name",
			"B1",
			"--format",
			"json",
		);

		// Create columns
		await cliAuth(
			"column",
			"create",
			"--board-id",
			"1",
			"--name",
			"To Do",
			"--format",
			"json",
		);
		await cliAuth(
			"column",
			"create",
			"--board-id",
			"1",
			"--name",
			"Done",
			"--format",
			"json",
		);

		// Reorder
		const reorder = await cliAuth(
			"column",
			"reorder",
			"--board-id",
			"1",
			"--ids",
			"2,1",
			"--format",
			"json",
		);
		expect(reorder.exitCode).toBe(0);
		const data = JSON.parse(reorder.stdout).data;
		expect(data.map((c: { name: string }) => c.name)).toEqual([
			"Done",
			"To Do",
		]);
	});

	test("column create requires --board-id and --name", async () => {
		const result = await cliAuth(
			"column",
			"create",
			"--name",
			"Test",
			"--format",
			"json",
		);
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain("--board-id");
	});
});

describe("CLI card commands", () => {
	test("card CRUD and move", async () => {
		await cliAuth("project", "create", "--name", "P1", "--format", "json");
		await cliAuth(
			"board",
			"create",
			"--project-id",
			"1",
			"--name",
			"B1",
			"--format",
			"json",
		);
		await cliAuth(
			"column",
			"create",
			"--board-id",
			"1",
			"--name",
			"To Do",
			"--format",
			"json",
		);
		await cliAuth(
			"column",
			"create",
			"--board-id",
			"1",
			"--name",
			"Done",
			"--format",
			"json",
		);

		// Create card
		const create = await cliAuth(
			"card",
			"create",
			"--column-id",
			"1",
			"--title",
			"Task 1",
			"--format",
			"json",
		);
		expect(create.exitCode).toBe(0);
		expect(JSON.parse(create.stdout).data.title).toBe("Task 1");

		// List cards
		const list = await cliAuth(
			"card",
			"list",
			"--column-id",
			"1",
			"--format",
			"json",
		);
		expect(list.exitCode).toBe(0);
		expect(JSON.parse(list.stdout).data).toHaveLength(1);

		// Get card
		const get = await cliAuth("card", "get", "--id", "1", "--format", "json");
		expect(get.exitCode).toBe(0);

		// Update card
		const update = await cliAuth(
			"card",
			"update",
			"--id",
			"1",
			"--title",
			"Updated Task",
			"--format",
			"json",
		);
		expect(update.exitCode).toBe(0);
		expect(JSON.parse(update.stdout).data.title).toBe("Updated Task");

		// Move card
		const move = await cliAuth(
			"card",
			"move",
			"--id",
			"1",
			"--column-id",
			"2",
			"--format",
			"json",
		);
		expect(move.exitCode).toBe(0);
		expect(JSON.parse(move.stdout).data.column_id).toBe(2);

		// Delete card
		const del = await cliAuth(
			"card",
			"delete",
			"--id",
			"1",
			"--format",
			"json",
		);
		expect(del.exitCode).toBe(0);
	});

	test("card create requires --column-id and --title", async () => {
		const result = await cliAuth(
			"card",
			"create",
			"--column-id",
			"1",
			"--format",
			"json",
		);
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain("--title");
	});
});

describe("CLI label commands", () => {
	test("label CRUD flow", async () => {
		await cliAuth("project", "create", "--name", "P1", "--format", "json");

		// Create label
		const create = await cliAuth(
			"label",
			"create",
			"--project-id",
			"1",
			"--name",
			"Bug",
			"--colour",
			"#ff0000",
			"--format",
			"json",
		);
		expect(create.exitCode).toBe(0);
		expect(JSON.parse(create.stdout).data.name).toBe("Bug");

		// List labels
		const list = await cliAuth(
			"label",
			"list",
			"--project-id",
			"1",
			"--format",
			"json",
		);
		expect(list.exitCode).toBe(0);
		expect(JSON.parse(list.stdout).data).toHaveLength(1);

		// Update label
		const update = await cliAuth(
			"label",
			"update",
			"--id",
			"1",
			"--name",
			"Critical",
			"--format",
			"json",
		);
		expect(update.exitCode).toBe(0);
		expect(JSON.parse(update.stdout).data.name).toBe("Critical");

		// Delete label
		const del = await cliAuth(
			"label",
			"delete",
			"--id",
			"1",
			"--format",
			"json",
		);
		expect(del.exitCode).toBe(0);
	});

	test("label create requires --project-id, --name, --colour", async () => {
		const result = await cliAuth(
			"label",
			"create",
			"--name",
			"Bug",
			"--colour",
			"#ff0000",
			"--format",
			"json",
		);
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain("--project-id");
	});

	test("card labels command", async () => {
		await cliAuth("project", "create", "--name", "P1", "--format", "json");
		await cliAuth(
			"board",
			"create",
			"--project-id",
			"1",
			"--name",
			"B1",
			"--format",
			"json",
		);
		await cliAuth(
			"column",
			"create",
			"--board-id",
			"1",
			"--name",
			"To Do",
			"--format",
			"json",
		);
		await cliAuth(
			"card",
			"create",
			"--column-id",
			"1",
			"--title",
			"Task 1",
			"--format",
			"json",
		);
		await cliAuth(
			"label",
			"create",
			"--project-id",
			"1",
			"--name",
			"Bug",
			"--colour",
			"#ff0000",
			"--format",
			"json",
		);

		const result = await cliAuth(
			"card",
			"labels",
			"--id",
			"1",
			"--label-ids",
			"1",
			"--format",
			"json",
		);
		expect(result.exitCode).toBe(0);
		const data = JSON.parse(result.stdout).data;
		expect(data.labels).toHaveLength(1);
	});
});
