import type { Project } from "../../shared/types.ts";
import type { ApiClient } from "../client.ts";
import type { OutputFormat } from "../output.ts";
import { printResult } from "../output.ts";

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
			const res = await client.post<Project>("/api/projects", {
				name: args.name,
				description: args.description ?? null,
			});
			printResult(res, format);
			break;
		}
		case "get": {
			const res = await client.get<Project>(`/api/projects/${args.id}`);
			printResult(res, format);
			break;
		}
		case "update": {
			const body: Record<string, unknown> = {};
			if (args.name) body.name = args.name;
			if (args.description !== undefined) body.description = args.description;
			const res = await client.put<Project>(`/api/projects/${args.id}`, body);
			printResult(res, format);
			break;
		}
		case "delete": {
			const res = await client.delete(`/api/projects/${args.id}`);
			printResult(res, format);
			break;
		}
		default:
			console.error(`Unknown project action: ${action}`);
			process.exit(1);
	}
}
