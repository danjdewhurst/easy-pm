import type { CardWithLabels } from "../../shared/types.ts";
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

export async function cardCommand(
	client: ApiClient,
	action: string,
	args: Record<string, string | boolean | undefined>,
	format: OutputFormat,
): Promise<void> {
	switch (action) {
		case "list": {
			const columnId = requireArg(args, "column-id");
			const res = await client.get<CardWithLabels[]>(
				`/api/columns/${columnId}/cards`,
			);
			printResult(res, format);
			break;
		}
		case "create": {
			const columnId = requireArg(args, "column-id");
			const title = requireArg(args, "title");
			const body: Record<string, unknown> = { title };
			if (args.description) body.description = args.description;
			if (args["due-date"]) body.due_date = args["due-date"];
			if (args["time-estimate"]) body.time_estimate = args["time-estimate"];
			if (args.position) body.position = Number(args.position);
			const res = await client.post<CardWithLabels>(
				`/api/columns/${columnId}/cards`,
				body,
			);
			printResult(res, format);
			break;
		}
		case "get": {
			const id = requireArg(args, "id");
			const res = await client.get<CardWithLabels>(`/api/cards/${id}`);
			printResult(res, format);
			break;
		}
		case "update": {
			const id = requireArg(args, "id");
			const body: Record<string, unknown> = {};
			if (args.title) body.title = args.title;
			if (args.description !== undefined) body.description = args.description;
			if (args["due-date"] !== undefined)
				body.due_date = args["due-date"] || null;
			if (args["time-estimate"]) body.time_estimate = args["time-estimate"];
			if (args.position) body.position = Number(args.position);
			const res = await client.put<CardWithLabels>(`/api/cards/${id}`, body);
			printResult(res, format);
			break;
		}
		case "delete": {
			const id = requireArg(args, "id");
			const res = await client.delete(`/api/cards/${id}`);
			printResult(res, format);
			break;
		}
		case "move": {
			const id = requireArg(args, "id");
			const columnId = requireArg(args, "column-id");
			const body: Record<string, unknown> = {
				column_id: Number(columnId),
			};
			if (args.position) body.position = Number(args.position);
			const res = await client.put<CardWithLabels>(
				`/api/cards/${id}/move`,
				body,
			);
			printResult(res, format);
			break;
		}
		case "labels": {
			const id = requireArg(args, "id");
			const labelIdsStr = requireArg(args, "label-ids");
			const ids = labelIdsStr.split(",").map((s) => {
				const n = Number(s.trim());
				if (!Number.isInteger(n) || n <= 0) {
					console.error(`Invalid label ID in --label-ids: "${s.trim()}"`);
					process.exit(1);
				}
				return n;
			});
			const res = await client.put<CardWithLabels>(`/api/cards/${id}/labels`, {
				label_ids: ids,
			});
			printResult(res, format);
			break;
		}
		default:
			console.error(`Unknown card action: ${action}`);
			process.exit(1);
	}
}
