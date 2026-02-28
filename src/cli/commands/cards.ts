import type { ApiClient } from "../client.ts";
import type { OutputFormat } from "../output.ts";
import { printResult } from "../output.ts";
import type { CardWithLabels } from "../../shared/types.ts";

export async function cardCommand(
  client: ApiClient,
  action: string,
  args: Record<string, string | boolean | undefined>,
  format: OutputFormat,
): Promise<void> {
  switch (action) {
    case "list": {
      const res = await client.get<CardWithLabels[]>(`/api/columns/${args["column-id"]}/cards`);
      printResult(res, format);
      break;
    }
    case "create": {
      const body: Record<string, unknown> = { title: args.title };
      if (args.description) body.description = args.description;
      if (args["due-date"]) body.due_date = args["due-date"];
      if (args["time-estimate"]) body.time_estimate = Number(args["time-estimate"]);
      if (args.position) body.position = Number(args.position);
      const res = await client.post<CardWithLabels>(`/api/columns/${args["column-id"]}/cards`, body);
      printResult(res, format);
      break;
    }
    case "get": {
      const res = await client.get<CardWithLabels>(`/api/cards/${args.id}`);
      printResult(res, format);
      break;
    }
    case "update": {
      const body: Record<string, unknown> = {};
      if (args.title) body.title = args.title;
      if (args.description !== undefined) body.description = args.description;
      if (args["due-date"] !== undefined) body.due_date = args["due-date"] || null;
      if (args["time-estimate"]) body.time_estimate = Number(args["time-estimate"]);
      if (args.position) body.position = Number(args.position);
      const res = await client.put<CardWithLabels>(`/api/cards/${args.id}`, body);
      printResult(res, format);
      break;
    }
    case "delete": {
      const res = await client.delete(`/api/cards/${args.id}`);
      printResult(res, format);
      break;
    }
    case "move": {
      const body: Record<string, unknown> = { column_id: Number(args["column-id"]) };
      if (args.position) body.position = Number(args.position);
      const res = await client.put<CardWithLabels>(`/api/cards/${args.id}/move`, body);
      printResult(res, format);
      break;
    }
    case "labels": {
      const ids = String(args["label-ids"]).split(",").map(Number);
      const res = await client.put<CardWithLabels>(`/api/cards/${args.id}/labels`, {
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
