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
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		if (this.token) {
			headers.Authorization = `Bearer ${this.token}`;
		}

		const res = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});

		return res.json() as Promise<ApiResponse<T>>;
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
