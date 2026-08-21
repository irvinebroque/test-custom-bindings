export default {
	async fetch(request, env) {
		try {
			if (request.method === "DELETE") {
				const result = await env.DB.prepare(
					"DELETE FROM Customers WHERE CompanyName = ?",
				)
					.bind("Bs Beverages")
					.all();

				return Response.json(result.results);
			}

			const result = await env.DB.prepare(
				"SELECT ContactName FROM Customers WHERE CompanyName = ?",
			)
				.bind("Bs Beverages")
				.all();

			return Response.json(result.results);
		} catch (error) {
			return Response.json(
				{
					error: error instanceof Error ? error.message : String(error),
				},
				{ status: 500 },
			);
		}
	},
};
