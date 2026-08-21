import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const resources = JSON.parse(
	await readFile(resolve("cloudflare-resources.json"), "utf8"),
);

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? resources.account_id;
const databaseId = process.env.D1_DATABASE_ID ?? resources.d1_database_id;

let apiToken = process.env.CLOUDFLARE_API_TOKEN;
if (!apiToken) {
	const output = execFileSync("wrangler", ["auth", "token"], {
		encoding: "utf8",
		env: {
			...process.env,
			NO_COLOR: "1",
			WRANGLER_LOG_PATH: "/tmp/wrangler-auth-token.log",
		},
	});
	apiToken = output.trim().split(/\r?\n/).at(-1);
}

const workerPath = resolve("user-worker/worker.js");
const workerSource = await readFile(workerPath);
const moduleName = basename(workerPath);

const metadata = {
	main_module: moduleName,
	compatibility_date: "2026-08-15",
	compatibility_flags: ["d1_binding_jsrpc"],
	bindings: [
		{
			type: "service",
			name: "DB",
			service: "custom-binding-platform-worker",
			entrypoint: "D1CustomBinding",
			binding_interface: "d1",
			props: {
				D1: {
					$binding: {
						type: "d1",
						database_id: databaseId,
					},
				},
				tenant: "demo-tenant",
			},
		},
	],
};

const form = new FormData();
form.set("metadata", JSON.stringify(metadata));
form.set(
	moduleName,
	new Blob([workerSource], { type: "application/javascript+module" }),
	moduleName,
);

const response = await fetch(
	`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/dispatch/namespaces/custom-binding-ns/scripts/user-worker`,
	{
		method: "PUT",
		headers: { Authorization: `Bearer ${apiToken}` },
		body: form,
	},
);

const body = await response.json();
if (!response.ok || !body.success) {
	throw new Error(`Upload failed (${response.status}): ${JSON.stringify(body)}`);
}

console.log("Uploaded user-worker to custom-binding-ns.");
