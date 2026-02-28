import type { Column } from "../../shared/types.ts";
import type { ApiClient } from "../client.ts";
import type { OutputFormat } from "../output.ts";
import { printResult } from "../output.ts";

export async function columnCommand(
	client: ApiClient,
	action: string,
	args: Record<string, string | boolean | undefined>,
	format: OutputFormat,
): Promise<void> {
	switch (action) {
		case "create": {
			const res = await client.post<Column>(
				`/api/boards/${args["board-id"]}/columns`,
				{
					name: args.name,
					position: args.position ? Number(args.position) : undefined,
				},
			);
			printResult(res, format);
			break;
		}
		case "update": {
			const body: Record<string, unknown> = {};
			if (args.name) body.name = args.name;
			if (args.position) body.position = Number(args.position);
			const res = await client.put<Column>(`/api/columns/${args.id}`, body);
			printResult(res, format);
			break;
		}
		case "delete": {
			const res = await client.delete(`/api/columns/${args.id}`);
			printResult(res, format);
			break;
		}
		case "reorder": {
			const ids = String(args.ids).split(",").map(Number);
			const res = await client.put<Column[]>(
				`/api/boards/${args["board-id"]}/columns/reorder`,
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
