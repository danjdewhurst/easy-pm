import type { Label } from "../../shared/types.ts";
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

export async function labelCommand(
	client: ApiClient,
	action: string,
	args: Record<string, string | boolean | undefined>,
	format: OutputFormat,
): Promise<void> {
	switch (action) {
		case "list": {
			const projectId = requireArg(args, "project-id");
			const res = await client.get<Label[]>(
				`/api/projects/${projectId}/labels`,
			);
			printResult(res, format);
			break;
		}
		case "create": {
			const projectId = requireArg(args, "project-id");
			const name = requireArg(args, "name");
			const colour = requireArg(args, "colour");
			const res = await client.post<Label>(
				`/api/projects/${projectId}/labels`,
				{
					name,
					colour,
				},
			);
			printResult(res, format);
			break;
		}
		case "update": {
			const id = requireArg(args, "id");
			const body: Record<string, unknown> = {};
			if (args.name) body.name = args.name;
			if (args.colour) body.colour = args.colour;
			const res = await client.put<Label>(`/api/labels/${id}`, body);
			printResult(res, format);
			break;
		}
		case "delete": {
			const id = requireArg(args, "id");
			const res = await client.delete(`/api/labels/${id}`);
			printResult(res, format);
			break;
		}
		default:
			console.error(`Unknown label action: ${action}`);
			process.exit(1);
	}
}
