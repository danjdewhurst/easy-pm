import type { ApiClient } from "../client.ts";
import type { OutputFormat } from "../output.ts";
import { printResult } from "../output.ts";
import type { SearchResult } from "../../shared/types.ts";

export async function searchCommand(
  client: ApiClient,
  query: string,
  args: Record<string, string | boolean | undefined>,
  format: OutputFormat,
): Promise<void> {
  let path = `/api/search?q=${encodeURIComponent(query)}`;
  if (args["project-id"]) {
    path += `&projectId=${args["project-id"]}`;
  }
  const res = await client.get<SearchResult[]>(path);
  printResult(res, format);
}
