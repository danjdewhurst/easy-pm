import type { Board, BoardView } from "../../shared/types.ts";
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

export async function boardCommand(
	client: ApiClient,
	action: string,
	args: Record<string, string | boolean | undefined>,
	format: OutputFormat,
): Promise<void> {
	switch (action) {
		case "list": {
			const projectId = requireArg(args, "project-id");
			const res = await client.get<Board[]>(
				`/api/projects/${projectId}/boards`,
			);
			printResult(res, format);
			break;
		}
		case "create": {
			const projectId = requireArg(args, "project-id");
			const name = requireArg(args, "name");
			const res = await client.post<Board>(
				`/api/projects/${projectId}/boards`,
				{
					name,
					description: args.description ?? null,
				},
			);
			printResult(res, format);
			break;
		}
		case "get": {
			const id = requireArg(args, "id");
			const res = await client.get<BoardView>(`/api/boards/${id}`);
			printResult(res, format);
			break;
		}
		case "update": {
			const id = requireArg(args, "id");
			const body: Record<string, unknown> = {};
			if (args.name) body.name = args.name;
			if (args.description !== undefined) body.description = args.description;
			const res = await client.put<Board>(`/api/boards/${id}`, body);
			printResult(res, format);
			break;
		}
		case "delete": {
			const id = requireArg(args, "id");
			const res = await client.delete(`/api/boards/${id}`);
			printResult(res, format);
			break;
		}
		default:
			console.error(`Unknown board action: ${action}`);
			process.exit(1);
	}
}
