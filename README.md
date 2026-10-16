# apple-stock

Get pinged the moment an Apple product can be picked up at a store near you, or sent by Apple's 2-hour courier delivery.

It was built for the iPhone Duo on apple.com/ca, but it should work for any iPhone on any Apple Store country site that has a `buy-iphone/<product>` page.

## How it works

1. A headless Chromium opens the product page (e.g. `apple.com/ca/shop/buy-iphone/iphone-duo`) and reads every model (part number, name, price) on it.
2. Apple's stock API (`/shop/fulfillment-messages`) has bot protection: the product page runs a proof-of-work challenge and sets a cookie, and plain HTTP clients get a `541` error. Making the API calls from inside the real page avoids that.
3. For each model it records:
   - **Pickup**: in-store pickup availability at each Apple Store within `MAX_DISTANCE_KM` of your postal code.
   - **Courier**: whether 2-hour courier delivery is available to that postal code.
4. When something goes from unavailable to available, it sends a notification by email (Resend), ntfy or Discord. The last seen state is kept in `.state.json`, so you only get pinged once per item until it sells out and comes back.

## Run it at home (recommended)

A computer that stays on is the best option. It has a home IP, checks run on time, and the default is one check every 2 minutes.

```sh
git clone https://github.com/kelindi/apple-stock && cd apple-stock
npm install
npx playwright install chromium
cp .env.example .env          # fill in POSTAL_CODE and a notifier
npm run test-notify           # sends a test notification
npm start                     # checks every INTERVAL_SECONDS until stopped
```

To run a single check: `npm run check`. Add `-- --dry-run` to log results without notifying or saving state.

Then open http://localhost:4321 to pick the model, colours, storage and postal code.

**On your phone:** browsers only allow push notifications on HTTPS pages, so the phone needs an HTTPS link to the computer. The easiest private way is [Tailscale](https://tailscale.com): install it on both devices, run `tailscale serve --bg 4321` on the computer, and open the `https://<computer>.<tailnet>.ts.net` link it prints. Don't expose the UI on the public internet: anyone who can open it can change the settings.

To keep it running after reboots, see [`examples/com.apple-stock.plist`](examples/com.apple-stock.plist) (macOS launchd) or [`examples/apple-stock.service`](examples/apple-stock.service) (Linux systemd).

## Run it on GitHub Actions

For when you don't have a computer that's always on.

1. Fork this repo. Scheduled workflows are free on public repos.
2. Under **Settings → Secrets and variables → Actions**:
   - Add the **variable** `POSTAL_CODE`, plus `MODELS`, `MAX_DISTANCE_KM`, `COUNTRY` or `PRODUCT` if you want something other than the defaults.
   - Add the **secrets** for your notifier: `RESEND_API_KEY` + `EMAIL_TO` (+ `EMAIL_FROM`), `NTFY_TOPIC` or `DISCORD_WEBHOOK_URL`.
3. Under **Actions**, enable workflows and run **Check stock** once by hand to confirm it works.

The workflow is scheduled every 5 minutes, but GitHub often starts scheduled runs late, and it turns off schedules after 60 days without commits. For on-time checks, have a free cron service such as [cron-job.org](https://cron-job.org) call `POST https://api.github.com/repos/<you>/apple-stock/actions/workflows/check.yml/dispatches` with body `{"ref":"main"}` and a fine-grained token that has Actions read/write on the fork.

## Configuration

| Variable | Default | |
| --- | --- | --- |
| `POSTAL_CODE` | (required) | Location used for store search and courier delivery, e.g. `M5V3L9` |
| `COUNTRY` | `ca` | Apple Store country path (`ca`, `uk`, `au`, ... or `us`) |
| `PRODUCT` | `iphone-duo` | The `buy-iphone/<product>` page slug |
| `MODELS` | `all` | Comma-separated part numbers or words that must all appear in the model name, e.g. `256GB Night Sky, 512GB` |
| `MAX_DISTANCE_KM` | `50` | Ignore stores farther than this |
| `INTERVAL_SECONDS` | `120` | Time between checks for `npm start` (minimum 30, with ±15% jitter) |
| `STATE_FILE` | `.state.json` | Where the last seen availability is stored |
| `HEADLESS` | `true` | Set to `false` to watch the browser |

### Notifiers

Configure any combination of these:

- **Phone/desktop notifications** (built in, free, no account): open the UI and tap **Turn on notifications**. On iPhone (iOS 16.4+), open the page in Safari, tap Share → **Add to Home Screen**, open it from the home screen, then turn notifications on. Alerts are sent with standard Web Push, so they arrive even when the app is closed. Keys are generated into `.vapid.json` on first run (or set `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`), and devices are saved in `subscriptions.json`.
- **Email** via [Resend](https://resend.com) (free tier: 3,000 emails/month): `RESEND_API_KEY`, `EMAIL_TO` (comma-separated), and optionally `EMAIL_FROM`. Without a verified domain, Resend only delivers to the email on your Resend account, using the default `onboarding@resend.dev` sender.
- **Push** via [ntfy](https://ntfy.sh) (free app for iPhone/Android): tap **Get alerts in the ntfy app** in the UI. It picks a random topic; subscribe to that topic in the app (or tap **Subscribe**) and tap **Test**. Anyone who knows the topic can read it, so keep it random. You can also set `NTFY_TOPIC` (plus `NTFY_SERVER` if you self-host).
- **Discord**: `DISCORD_WEBHOOK_URL` from a channel's Integrations → Webhooks.

## Caveats

This uses Apple's undocumented storefront endpoints, which can change without notice. Be gentle: checking every couple of minutes is plenty. This project is not affiliated with Apple.
