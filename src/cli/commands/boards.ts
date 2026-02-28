import type { ApiClient } from "../client.ts";
import type { OutputFormat } from "../output.ts";
import { printResult } from "../output.ts";
import type { Board, BoardView } from "../../shared/types.ts";

export async function boardCommand(
  client: ApiClient,
  action: string,
  args: Record<string, string | boolean | undefined>,
  format: OutputFormat,
): Promise<void> {
  switch (action) {
    case "list": {
      const res = await client.get<Board[]>(`/api/projects/${args["project-id"]}/boards`);
      printResult(res, format);
      break;
    }
    case "create": {
      const res = await client.post<Board>(`/api/projects/${args["project-id"]}/boards`, {
        name: args.name,
        description: args.description ?? null,
      });
      printResult(res, format);
      break;
    }
    case "get": {
      const res = await client.get<BoardView>(`/api/boards/${args.id}`);
      printResult(res, format);
      break;
    }
    case "update": {
      const body: Record<string, unknown> = {};
      if (args.name) body.name = args.name;
      if (args.description !== undefined) body.description = args.description;
      const res = await client.put<Board>(`/api/boards/${args.id}`, body);
      printResult(res, format);
      break;
    }
    case "delete": {
      const res = await client.delete(`/api/boards/${args.id}`);
      printResult(res, format);
      break;
    }
    default:
      console.error(`Unknown board action: ${action}`);
      process.exit(1);
  }
}
