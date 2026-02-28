import type { AuthResponse, PublicUser } from "../../shared/types.ts";
import type { ApiClient } from "../client.ts";
import { loadConfig, saveConfig } from "../config.ts";
import type { OutputFormat } from "../output.ts";
import { printResult } from "../output.ts";

export async function authCommand(
	client: ApiClient,
	action: string,
	args: Record<string, string | boolean | undefined>,
	format: OutputFormat,
): Promise<void> {
	switch (action) {
		case "register": {
			const email = args.email as string | undefined;
			const password = args.password as string | undefined;
			if (!email || !password) {
				console.error(
					"Usage: easy-pm auth register --email <email> --password <password>",
				);
				process.exit(1);
			}
			const res = await client.post<AuthResponse>("/api/auth/register", {
				email,
				password,
			});
			if (res.ok && res.data) {
				const config = await loadConfig();
				config.token = res.data.token;
				await saveConfig(config);
				console.log(`Registered and logged in as ${res.data.user.email}`);
				console.log("Token saved to config.");
			} else {
				printResult(res, format);
			}
			break;
		}

		case "login": {
			const email = args.email as string | undefined;
			const password = args.password as string | undefined;
			if (!email || !password) {
				console.error(
					"Usage: easy-pm auth login --email <email> --password <password>",
				);
				process.exit(1);
			}
			const res = await client.post<AuthResponse>("/api/auth/login", {
				email,
				password,
			});
			if (res.ok && res.data) {
				const config = await loadConfig();
				config.token = res.data.token;
				await saveConfig(config);
				console.log(`Logged in as ${res.data.user.email}`);
				console.log("Token saved to config.");
			} else {
				printResult(res, format);
			}
			break;
		}

		case "logout": {
			const res = await client.post<unknown>("/api/auth/logout", {});
			if (res.ok) {
				const config = await loadConfig();
				delete config.token;
				await saveConfig(config);
				console.log("Logged out. Token removed from config.");
			} else {
				printResult(res, format);
			}
			break;
		}

		case "whoami": {
			const res = await client.get<PublicUser>("/api/auth/me");
			printResult(res, format);
			break;
		}

		default:
			console.error(`Unknown auth action: ${action}`);
			console.error("Usage: easy-pm auth register|login|logout|whoami");
			process.exit(1);
	}
}
