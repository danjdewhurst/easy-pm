import { getDb } from "../../shared/db.ts";
import { jsonResponse } from "../middleware.ts";

export function handleHealth(): Response {
	try {
		const db = getDb();
		db.query("SELECT 1").get();
	} catch {
		return new Response(
			JSON.stringify({
				ok: false,
				error: "Database is unreachable",
			}),
			{ status: 503, headers: { "Content-Type": "application/json" } },
		);
	}
	return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
}
