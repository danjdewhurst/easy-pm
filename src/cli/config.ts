import { homedir } from "node:os";
import { join } from "node:path";

interface CliConfig {
	token?: string;
	apiUrl?: string;
}

const CONFIG_DIR = join(homedir(), ".config", "easy-pm");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<CliConfig> {
	try {
		const file = Bun.file(CONFIG_PATH);
		if (!(await file.exists())) return {};
		return (await file.json()) as CliConfig;
	} catch {
		return {};
	}
}

export async function saveConfig(config: CliConfig): Promise<void> {
	const { mkdirSync } = await import("node:fs");
	mkdirSync(CONFIG_DIR, { recursive: true });
	await Bun.write(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
}
