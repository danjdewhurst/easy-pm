import type { ApiResponse } from "../shared/types.ts";

export class ApiClient {
	constructor(
		private baseUrl: string,
		private token: string | null,
	) {}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
	): Promise<ApiResponse<T>> {
		const url = `${this.baseUrl}${path}`;
		const headers: Record<string, string> = {};

		if (body !== undefined) {
			headers["Content-Type"] = "application/json";
		}

		if (this.token) {
			headers.Authorization = `Bearer ${this.token}`;
		}

		let res: Response;
		try {
			res = await fetch(url, {
				method,
				headers,
				body: body !== undefined ? JSON.stringify(body) : undefined,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Network error";
			return {
				ok: false,
				error: `Connection failed: ${message}`,
			} as ApiResponse<T>;
		}

		const text = await res.text();
		try {
			return JSON.parse(text) as ApiResponse<T>;
		} catch {
			return {
				ok: false,
				error: `Server returned non-JSON response (${res.status}): ${text.slice(0, 200)}`,
			} as ApiResponse<T>;
		}
	}

	get<T>(path: string): Promise<ApiResponse<T>> {
		return this.request<T>("GET", path);
	}

	post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
		return this.request<T>("POST", path, body);
	}

	put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
		return this.request<T>("PUT", path, body);
	}

	delete<T>(path: string): Promise<ApiResponse<T>> {
		return this.request<T>("DELETE", path);
	}
}
