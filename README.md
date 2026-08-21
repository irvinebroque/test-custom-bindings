# D1 custom binding experiment

This project follows Cloudflare's preview custom bindings guide. A User Worker
uses the standard D1 API, but its `DB` binding routes every query through a
Platform Worker. The Platform Worker logs queries, permits `SELECT`, and rejects
writes before forwarding allowed operations to the real D1 database.

## Layout

- `platform/`: the Platform Worker implementing `D1CustomBinding.query()`
- `user-worker/`: code uploaded to the Workers for Platforms dispatch namespace
- `dispatcher/`: public Worker that invokes the User Worker
- `schema.sql`: small D1 fixture matching the guide
- `scripts/upload-user-worker.mjs`: raw API upload required by the preview

## Manual deployment

```sh
wrangler d1 execute custom-binding-demo-db --remote --file schema.sql
wrangler deploy --config platform/wrangler.jsonc
npm run upload:user

wrangler deploy --config dispatcher/wrangler.jsonc
```

The D1 database and dispatch namespace recorded in `cloudflare-resources.json`
have already been created. The upload script reuses the current Wrangler OAuth
login without printing or storing its access token.

## Preview behavior observed

The custom D1 interface itself works: User Worker D1 calls reach
`D1CustomBinding.query()`, allowed reads return D1 rows, and rejected writes
surface as `D1_ERROR`.

On August 21, 2026, the documented `props.D1.$binding` value arrived at the
Platform Worker as plain JSON rather than as a live D1 object with `query()`.
The Platform Worker therefore includes a temporary `D1_FALLBACK` binding and
adapts its normal D1 results to the preview `QueryResponse` shape. The code
prefers the documented `this.ctx.props.D1.query(params)` path automatically
when Cloudflare enables it for the account.

Test the deployed dispatcher:

```sh
curl https://custom-binding-dispatcher.roundtrip.workers.dev
curl -X DELETE https://custom-binding-dispatcher.roundtrip.workers.dev
```

The first request should return Victoria Ashworth. The second should return a
`D1_ERROR`-derived error and leave the row intact.
