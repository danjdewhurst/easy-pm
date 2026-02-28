import type { ApiResponse } from "../shared/types.ts";

export type OutputFormat = "json" | "table";

export function printResult<T>(response: ApiResponse<T>, format: OutputFormat): void {
  if (!response.ok) {
    console.error(response.error ?? "Unknown error");
    process.exit(1);
  }

  if (format === "json") {
    console.log(JSON.stringify(response, null, 2));
    return;
  }

  // Table format
  const data = response.data;
  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log("No results.");
      return;
    }
    printTable(data);
  } else if (typeof data === "object" && data !== null) {
    printRecord(data as Record<string, unknown>);
  } else {
    console.log(String(data));
  }
}

function printTable(rows: Record<string, unknown>[]): void {
  const keys = Object.keys(rows[0]!).filter((k) => !isComplexValue(rows[0]![k]));

  // Calculate column widths
  const widths = keys.map((k) => {
    const maxVal = Math.max(...rows.map((r) => String(r[k] ?? "").length));
    return Math.max(k.length, maxVal);
  });

  // Header
  const header = keys.map((k, i) => k.padEnd(widths[i]!)).join("  ");
  console.log(header);
  console.log(widths.map((w) => "─".repeat(w)).join("──"));

  // Rows
  for (const row of rows) {
    const line = keys.map((k, i) => String(row[k] ?? "").padEnd(widths[i]!)).join("  ");
    console.log(line);
  }
}

function printRecord(record: Record<string, unknown>): void {
  const maxKeyLen = Math.max(...Object.keys(record).map((k) => k.length));
  for (const [key, value] of Object.entries(record)) {
    if (isComplexValue(value)) {
      console.log(`${key.padStart(maxKeyLen)}: ${JSON.stringify(value)}`);
    } else {
      console.log(`${key.padStart(maxKeyLen)}: ${value ?? ""}`);
    }
  }
}

function isComplexValue(value: unknown): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}
