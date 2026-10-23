<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a7f02fd0-dabe-4cb9-be67-22fa27f90dee

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## The Odds API V4 (LOT 3)

This project includes a server-side adapter for the documented The Odds API V4 endpoints.

1. Create an account at https://the-odds-api.com/ and obtain an API key.
2. In Google AI Studio, add `THE_ODDS_API_KEY` in server-side Secrets. For local runs, copy `.env.example` to `.env.local` and set the key there; never put it in frontend code.
3. Optional server settings: `THE_ODDS_API_REGIONS=eu`, `THE_ODDS_API_MARKETS=h2h`, `THE_ODDS_API_CACHE_TTL_SECONDS=300`, `THE_ODDS_API_MAX_SPORTS_PER_SCAN=3`, `THE_ODDS_API_TIMEOUT_MS=10000`.
4. Test `GET /api/providers/the-odds-api/diagnostic`, then `POST /api/providers/the-odds-api/test-connection`, then inspect `GET /api/providers/the-odds-api/sports`.
5. Select `THE ODDS API` in the application to use this provider.

The provider's API key is sent to The Odds API using the V4 `apiKey` query parameter as documented by the provider, but the key is never returned to the browser or written to application logs. Quota figures are read from response headers when available; no fixed daily allowance is assumed. The scanner limits each scan to `THE_ODDS_API_MAX_SPORTS_PER_SCAN` active sport keys to reduce unexpected quota use. The default is 3; when scanning all sports it chooses different mapped sport groups first. Raise the cap only after reviewing your plan and request costs. The sport catalog endpoint returns the provider's currently available catalog. The 300-second default cache is intentional to help conserve free-tier credits; lower it only if your plan can support the extra requests.

Current surebet detection supports complete `h2h` markets and `totals` markets where compatible outcomes can be matched. Handicap/spread lines are intentionally not merged until exact line matching is implemented. Only opportunities with `sum(1/odds) < 1` are returned. API responses may be empty when no arbitrage exists or the selected sports/markets are unavailable.

Automated normalizer tests use a synthetic anonymized fixture and do not make live API calls. Real connectivity cannot be verified until a valid server-side key is configured.
