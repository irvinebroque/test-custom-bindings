export default {
	async fetch(request, env) {
		const userWorker = env.DISPATCHER.get("user-worker");
		return userWorker.fetch(request);
	},
};
