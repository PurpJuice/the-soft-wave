# ai-proxy (shared server key)

This Edge Function proxies AI requests to OpenRouter using a server-side secret.
Clients never receive the OpenRouter key.

## 1) Set the secret

Use your OpenRouter key as a Supabase secret:

```bash
supabase secrets set OPENROUTER_API_KEY="YOUR_OPENROUTER_KEY"
```

## 2) Deploy the function

```bash
supabase functions deploy ai-proxy
```

## 3) Confirm JWT protection

This function is configured with `verify_jwt = true` in `supabase/config.toml`.
Only authenticated users can call it.

## 4) Frontend behavior

`the-soft-wave.html` is configured for shared proxy mode:
- Calls `POST /functions/v1/ai-proxy`
- Sends the logged-in user's access token
- Hides per-user API key UI

## 5) Optional hardening

- Add request rate limiting by `user_id`
- Add allowlist for `model` values
- Add usage logging and budget caps
