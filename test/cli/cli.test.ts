import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import {
	getTestBaseUrl,
	getTestToken,
	resetTestDb,
	setupTestServer,
	teardownTestServer,
} from "../server/helpers.ts";

function cli(
	...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return new Promise((resolve) => {
		const proc = Bun.spawn(["bun", "run", "src/cli/index.ts", ...args], {
			cwd: "/Users/dan/Projects/easy-pm",
			env: {
				...process.env,
				EASY_PM_API_URL: getTestBaseUrl(),
			},
			stdout: "pipe",
			stderr: "pipe",
		});

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
});
