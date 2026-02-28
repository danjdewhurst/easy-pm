import type { ApiClient } from "../client.ts";
import type { OutputFormat } from "../output.ts";
import { printResult } from "../output.ts";
import type { Label } from "../../shared/types.ts";

export async function labelCommand(
  client: ApiClient,
  action: string,
  args: Record<string, string | boolean | undefined>,
  format: OutputFormat,
): Promise<void> {
  switch (action) {
    case "list": {
      const res = await client.get<Label[]>(`/api/projects/${args["project-id"]}/labels`);
      printResult(res, format);
      break;
    }
    case "create": {
      const res = await client.post<Label>(`/api/projects/${args["project-id"]}/labels`, {
        name: args.name,
        colour: args.colour,
      });
      printResult(res, format);
      break;
    }
    case "update": {
      const body: Record<string, unknown> = {};
      if (args.name) body.name = args.name;
      if (args.colour) body.colour = args.colour;
      const res = await client.put<Label>(`/api/labels/${args.id}`, body);
      printResult(res, format);
      break;
    }
    case "delete": {
      const res = await client.delete(`/api/labels/${args.id}`);
      printResult(res, format);
      break;
    }
    default:
      console.error(`Unknown label action: ${action}`);
      process.exit(1);
  }
}
