import type { Project } from "../../shared/types.ts";
import type { ApiClient } from "../client.ts";
import type { OutputFormat } from "../output.ts";
import { printResult } from "../output.ts";

function requireArg(
	args: Record<string, string | boolean | undefined>,
	key: string,
): string {
	const value = args[key];
	if (typeof value !== "string" || value.trim() === "") {
		console.error(`Missing required option: --${key}`);
		process.exit(1);
	}
	return value;
}

export async function projectCommand(
	client: ApiClient,
	action: string,
	args: Record<string, string | boolean | undefined>,
	format: OutputFormat,
): Promise<void> {
	switch (action) {
		case "list": {
			const res = await client.get<Project[]>("/api/projects");
			printResult(res, format);
			break;
		}
		case "create": {
			const name = requireArg(args, "name");
			const res = await client.post<Project>("/api/projects", {
				name,
				description: args.description ?? null,
			});
			printResult(res, format);
			break;
		}
		case "get": {
			const id = requireArg(args, "id");
			const res = await client.get<Project>(`/api/projects/${id}`);
			printResult(res, format);
			break;
		}
		case "update": {
			const id = requireArg(args, "id");
			const body: Record<string, unknown> = {};
			if (args.name) body.name = args.name;
			if (args.description !== undefined) body.description = args.description;
			const res = await client.put<Project>(`/api/projects/${id}`, body);
			printResult(res, format);
			break;
		}
		case "delete": {
			const id = requireArg(args, "id");
			const res = await client.delete(`/api/projects/${id}`);
			printResult(res, format);
			break;
		}
		default:
			console.error(`Unknown project action: ${action}`);
			process.exit(1);
	}
}
