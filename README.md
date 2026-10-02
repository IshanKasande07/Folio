# Folio

An Indian equity portfolio dashboard built with Next.js, React, TypeScript and Tailwind CSS. It displays 26 supplied holdings, Yahoo Finance prices, and Google Finance P/E and earnings per share through a private Google Sheet.

## Features

- Portfolio and sector totals for investment, present value and gain/loss.
- Sortable holdings table, company search, sector filters and sector grouping.
- Automatic refresh every 15 seconds while the browser tab is visible.
- Green/red return indicators, responsive layout and explicit missing-data states.
- Server-side caching, batched quote requests and recovery using saved values.

## Local setup

Use Node.js 22.x and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local`. Open http://localhost:3000. Fill in the Google settings below to enable fundamentals. Yahoo prices do not require a personal API key.

## Google Finance setup

1. Create a private Google Sheet and import `data/google-sheets-template.csv` into a tab named **Fundamentals**. Ensure the formula cells are interpreted as formulas. Set the sheet locale to India if needed.
2. Column A contains symbols, B contains P/E and C contains EPS. The formulas use `GOOGLEFINANCE(A2,"pe")` and `GOOGLEFINANCE(A2,"eps")`, wrapped in `IFERROR` so unavailable values remain blank.
3. Enable the Google Sheets API in a Google Cloud project and create a service account. Keep its downloaded JSON key outside this repository.
4. Share the sheet with the service account email as **Viewer**.
5. Add these variables to `.env.local`, then restart the app:

| Variable | Value |
| --- | --- |
| `GOOGLE_SHEET_ID` | The sheet ID between `/d/` and `/edit` in its URL |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The service account's `client_email` |
| `GOOGLE_PRIVATE_KEY` | The service account's complete `private_key` |
| `GOOGLE_SHEET_RANGE` | `Fundamentals!A2:C200` |

The private key supports real line breaks or literal `\n` sequences. In `.env.local`, use the quoted format shown in `.env.example`. These variables are server-only; do not prefix them with `NEXT_PUBLIC_`. The app requests only the Sheets read-only scope.

## Deployment

This app requires a Node.js backend. Use a Next.js host or a Node.js server; static hosting alone cannot run `/api/portfolio`.

### Vercel

1. Push the repository to GitHub and import it as a Vercel project.
2. Select the **Next.js** framework preset and Node.js **22.x**. Use the repository root, `npm ci` for installation and `npm run build` for the build. Keep the framework's default output setting.
3. Add the four Google environment variables above to the Production environment and to Preview if preview deployments should read the sheet. Paste the private key value without the surrounding `.env` quotes.
4. Deploy. After changing environment variables, redeploy for the changes to take effect.
5. Open the dashboard and **Data sources** to check the connection. Open `/api/portfolio` to inspect `issues`, quote coverage and returned fundamentals. A configured Google connection still needs valid credentials and sheet access.

### Other Node.js hosts

```sh
npm ci
npm run build
npm start
```

Set the same environment variables in the host's settings. The production server listens on `0.0.0.0` and uses the host's `PORT` environment variable, or port 3000 by default. The frontend and API run in the same Next.js application.

Do not upload `.env.local`, service-account keys, `node_modules` or `.next` to GitHub. Generated files and local environment files are excluded by `.gitignore`.

## Data and calculations

`data/holdings.json` contains the active portfolio already extracted from the supplied workbook: 26 holdings across six sectors, with INR 1,543,060 invested. Summary rows and three sold positions are excluded. There is no workbook upload feature.

- Investment = purchase price × quantity.
- Portfolio weight = holding investment / total investment × 100.
- Present value = current market price × quantity.
- Gain/loss = present value − invested cost of the priced holdings.
- Return percentage = gain/loss / invested cost of the priced holdings × 100.

Missing prices remain unavailable. Partial valuation and returns include only priced holdings, while total investment includes all holdings. Sector totals follow the same calculation rules.

The supplied Tata Consumer row has a conflicting BSE code. Its original code remains visible, while explicit provider mappings use `TATACONSUM.BO` and `BOM:500800`; the dashboard explains the discrepancy. The original LTIM code is also retained while provider symbols use `LTM.NS` and `NSE:LTM`. Purchase prices, quantities and sector labels are preserved. Historical splits, bonuses and other corporate actions are not applied.

“Latest Earnings” is displayed as **earnings per share (EPS)**. It is not a dated quarterly profit or earnings announcement. Unsupported Google Finance attributes remain blank.

## How requests work

The dashboard sends holdings to `POST /api/portfolio`. The route validates the input, calls the market service and returns calculated positions and summaries. `GET /api/portfolio` uses the supplied holdings directly.

Yahoo symbols are deduplicated and passed together to `yahoo-finance2`. The market service limits quote attempts to once every 15 seconds per process and shares pending requests. Google fundamentals are cached for 30 minutes; failed reads can retry after one minute. Yahoo and Google refreshes run concurrently.

Saved values are retained for up to 24 hours and marked stale when the relevant refresh fails or a quote is missing from the latest result. Prices carry both the provider's market timestamp and the time the app fetched them. A successful fetch does not guarantee a new exchange price. Search, filtering and table definitions use memoization where appropriate.

## Project structure

```text
src/app/                 Page, layout, global styles and API route
src/components/          Dashboard, holdings table and sector overview
src/lib/                 Types, validation, calculations and formatting
src/server/              Market service and Yahoo/Google providers
data/                    Prepared holdings and Google Sheets template
Assignment_Challenges.docx  Technical challenges and solutions
```

## Verification and limitations

```sh
npm run typecheck
npm run build
```

After deployment, verify quote coverage, Google fundamentals, search, sorting, grouping, manual refresh and automatic refresh against the hosted app. Yahoo may block requests from particular hosting networks; successful local requests do not prove hosted availability.

Caches live in each server process and reset on restart or a serverless cold start. They are not shared across instances and do not provide a global rate limit. Higher traffic would require shared caching and request rate limiting. Google recalculates its formulas independently; reading the sheet does not force a recalculation. This is a portfolio demonstration without accounts, trading or a persistent portfolio database.


## References

- [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying)
- [Vercel environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [yahoo-finance2](https://github.com/gadicc/yahoo-finance2)
- [Google Finance attributes](https://support.google.com/docs/answer/3093281)
- [Google service accounts](https://developers.google.com/workspace/guides/create-credentials)
- [Sheets API scopes](https://developers.google.com/workspace/sheets/api/scopes)
