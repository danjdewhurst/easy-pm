import { parseArgs } from "node:util";
import { ApiClient } from "./client.ts";
import { authCommand } from "./commands/auth.ts";
import { boardCommand } from "./commands/boards.ts";
import { cardCommand } from "./commands/cards.ts";
import { columnCommand } from "./commands/columns.ts";
import { labelCommand } from "./commands/labels.ts";
import { projectCommand } from "./commands/projects.ts";
import { searchCommand } from "./commands/search.ts";
import { loadConfig } from "./config.ts";
import type { OutputFormat } from "./output.ts";

const USAGE = `Usage: easy-pm <resource> <action> [options]

Resources:
  auth      register|login|logout|whoami
  project   list|create|get|update|delete
  board     list|create|get|update|delete
  column    create|update|delete|reorder
  card      list|create|get|update|delete|move|labels
  label     list|create|update|delete
  search    <query>

Global options:
  --format    json|table (default: table)
  --api-url   Server URL (default: http://localhost:3000)
  --token     Auth token (default: from config file)

Auth options:
  --email     Email address (for register/login)
  --password  Password (for register/login)
`;

try {
	const { values, positionals } = parseArgs({
		args: process.argv.slice(2),
		options: {
			format: { type: "string", default: "table" },
			"api-url": {
				type: "string",
				default: process.env.EASY_PM_API_URL ?? "http://localhost:3000",
			},
			token: { type: "string" },
			// Resource-specific options
			id: { type: "string" },
			name: { type: "string" },
			description: { type: "string" },
			"project-id": { type: "string" },
			"board-id": { type: "string" },
			"column-id": { type: "string" },
			title: { type: "string" },
			"due-date": { type: "string" },
			"time-estimate": { type: "string" },
			position: { type: "string" },
			colour: { type: "string" },
			"label-ids": { type: "string" },
			ids: { type: "string" },
			email: { type: "string" },
			password: { type: "string" },
			help: { type: "boolean", short: "h" },
		},
		allowPositionals: true,
		strict: true,
	});

	if (values.help || positionals.length === 0) {
		console.log(USAGE);
		process.exit(0);
	}

	// Resolve token: --token flag > config file > null
	const config = await loadConfig();
	const token = (values.token as string | undefined) ?? config.token ?? null;

	const resource = positionals[0];
	const action = positionals[1] ?? "";
	const format = (values.format as OutputFormat) ?? "table";
	const client = new ApiClient(values["api-url"] as string, token);
	const args = values as Record<string, string | boolean | undefined>;

	switch (resource) {
		case "auth":
			await authCommand(client, action, args, format);
			break;
		case "project":
			await projectCommand(client, action, args, format);
			break;
		case "board":
			await boardCommand(client, action, args, format);
			break;
		case "column":
			await columnCommand(client, action, args, format);
			break;
		case "card":
			await cardCommand(client, action, args, format);
			break;
		case "label":
			await labelCommand(client, action, args, format);
			break;
		case "search":
			if (!action) {
				console.error("Search requires a query string");
				process.exit(1);
			}
			await searchCommand(client, action, args, format);
			break;
		default:
			console.error(`Unknown resource: ${resource}`);
			console.log(USAGE);
			process.exit(1);
	}
} catch (error) {
	if (error instanceof Error) {
		console.error(`Error: ${error.message}`);
	} else {
		console.error("An unexpected error occurred");
	}
	process.exit(1);
}
