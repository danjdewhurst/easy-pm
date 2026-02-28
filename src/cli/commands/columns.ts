import type { Column } from "../../shared/types.ts";
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

export async function columnCommand(
	client: ApiClient,
	action: string,
	args: Record<string, string | boolean | undefined>,
	format: OutputFormat,
): Promise<void> {
	switch (action) {
		case "create": {
			const boardId = requireArg(args, "board-id");
			const name = requireArg(args, "name");
			const res = await client.post<Column>(`/api/boards/${boardId}/columns`, {
				name,
				position: args.position ? Number(args.position) : undefined,
			});
			printResult(res, format);
			break;
		}
		case "update": {
			const id = requireArg(args, "id");
			const body: Record<string, unknown> = {};
			if (args.name) body.name = args.name;
			if (args.position) body.position = Number(args.position);
			const res = await client.put<Column>(`/api/columns/${id}`, body);
			printResult(res, format);
			break;
		}
		case "delete": {
			const id = requireArg(args, "id");
			const res = await client.delete(`/api/columns/${id}`);
			printResult(res, format);
			break;
		}
		case "reorder": {
			const boardId = requireArg(args, "board-id");
			const idsStr = requireArg(args, "ids");
			const ids = idsStr.split(",").map((s) => {
				const n = Number(s.trim());
				if (!Number.isInteger(n) || n <= 0) {
					console.error(`Invalid column ID in --ids: "${s.trim()}"`);
					process.exit(1);
				}
				return n;
			});
			const res = await client.put<Column[]>(
				`/api/boards/${boardId}/columns/reorder`,
				{
					column_ids: ids,
				},
			);
			printResult(res, format);
			break;
		}
		default:
			console.error(`Unknown column action: ${action}`);
			process.exit(1);
	}
}
