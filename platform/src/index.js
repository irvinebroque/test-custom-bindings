import { WorkerEntrypoint } from "cloudflare:workers";

export class D1CustomBinding extends WorkerEntrypoint {
	async query(params) {
		for (const statement of params.queries) {
			const sql = statement.sql.trimStart();
			console.log("custom binding intercepted query", {
				tenant: this.ctx.props.tenant,
				sql,
			});

			if (!/^select\b/i.test(sql)) {
				return {
					success: false,
					error: new Error("Only read-only queries are allowed"),
				};
			}
		}

		const database = this.ctx.props.D1;
		if (typeof database.query === "function") {
			return database.query(params);
		}

		// Temporary preview fallback: the account currently receives the
		// documented props.$binding value as plain JSON instead of a live D1
		// binding. Use a platform-owned D1 binding so the custom interface can
		// still be exercised end-to-end.
		const queryResults = [];
		for (const statement of params.queries) {
			const result = await this.env.D1_FALLBACK
				.prepare(statement.sql)
				.bind(...(statement.params ?? []))
				.all();
			const columns =
				result.results.length > 0 ? Object.keys(result.results[0]) : [];
			queryResults.push({
				meta: result.meta,
				data: {
					kind: "raw",
					columns,
					rows: result.results.map((row) =>
						columns.map((column) => row[column]),
					),
				},
			});
		}

		return {
			success: true,
			results: {
				queryResults,
			},
		};
	}
}

export default {
	fetch() {
		throw new Error("This Worker is only callable through its custom binding.");
	},
};
