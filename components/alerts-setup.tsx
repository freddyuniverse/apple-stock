'use client';

import { useCallback, useState } from 'react';
import { ArrowUpRight, Check, Copy, Mail } from 'lucide-react';
import { TRACKER_REPO_URL, milesToKm, normalizeZip } from '@/lib/duo';
import { ALERT_PASS, ALERT_RADII, dollars } from '@/lib/products';
import { startAlertCheckout } from '@/app/actions/checkout';
import { CheckoutSheet } from '@/components/checkout-sheet';

type Model = { partNumber: string; name: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INPUT =
  'h-14 rounded-xl border border-border bg-background px-4 text-[17px] outline-none transition placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,113,227,0.2)]';

export function AlertsSetup({ model }: { model: Model }) {
  const [email, setEmail] = useState('');
  const [postalInput, setPostalInput] = useState('');
  const [distance, setDistance] = useState(50);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const postal = normalizeZip(postalInput);
  const showPostalError = postalInput.trim().length >= 5 && !postal;
  const emailValid = EMAIL.test(email.trim());
  const ready = Boolean(postal && emailValid);

  const fetchClientSecret = useCallback(
    () => startAlertCheckout({ email, partNumber: model.partNumber, zip: postal ?? '', radiusMiles: distance }),
    [email, model.partNumber, postal, distance],
  );

  const config = [
    `POSTAL_CODE=${postal ?? '10001'}`,
    'COUNTRY=us',
    'PRODUCT=iphone-duo',
    `MODELS=${model.partNumber}`,
    `MAX_DISTANCE_KM=${milesToKm(distance)}`,
  ].join('\n');

  async function copyConfig() {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section id="alerts" aria-labelledby="alerts-title" className="scroll-mt-12 bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <h2 id="alerts-title" className="max-w-2xl text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Get an email the second it lands.
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          We check Apple Stores near you around the clock for{' '}
          <span className="text-foreground">{model.name}</span> and email you the moment one is ready for pickup.
        </p>

        <div className="mt-12 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) setOpen(true);
            }}
            className="flex flex-col gap-7 rounded-apple bg-background p-7"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Mail className="size-4 text-primary" aria-hidden="true" />
                24/7 email alerts
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="text-2xl font-semibold tracking-tight text-foreground">{dollars(ALERT_PASS.cents)}</span>{' '}
                once
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="alert-email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="alert-email"
                type="email"
                autoComplete="email"
                placeholder="you@icloud.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="postal" className="text-sm font-medium">
                ZIP code
              </label>
              <input
                id="postal"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="10001"
                maxLength={10}
                value={postalInput}
                onChange={(e) => setPostalInput(e.target.value)}
                aria-invalid={showPostalError}
                aria-describedby="postal-hint"
                className={INPUT}
              />
              <p id="postal-hint" className="text-xs text-muted-foreground">
                {showPostalError ? 'Enter a 5-digit US ZIP code, like 10001.' : 'Any Apple Store in the US.'}
              </p>
            </div>

            <fieldset>
              <legend className="text-sm font-medium">How far would you go?</legend>
              <div className="mt-2 flex rounded-full bg-secondary p-1">
                {ALERT_RADII.map((d) => (
                  <label key={d} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="distance"
                      value={d}
                      checked={distance === d}
                      onChange={() => setDistance(d)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-full py-2 text-center text-sm text-muted-foreground transition peer-checked:bg-background peer-checked:font-medium peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                      {d} mi
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={!ready}
                className="rounded-full bg-primary px-5 py-3 text-[17px] text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start alerts for {dollars(ALERT_PASS.cents)}
              </button>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                One-time payment. No subscription. Alerts run for {ALERT_PASS.days} days. Apple Pay accepted.
              </p>
            </div>
          </form>

          <div className="flex flex-col rounded-apple bg-foreground p-7 text-background">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">Rather do it yourself? Free.</p>
              <button
                type="button"
                onClick={copyConfig}
                className="flex items-center gap-1.5 rounded-full bg-background/10 px-3 py-1.5 text-xs transition-colors hover:bg-background/20"
              >
                {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-background/5 p-4 font-mono text-[13px] leading-6 text-background/90">
              <code>{config}</code>
            </pre>
            <p className="mt-6 text-sm leading-relaxed text-background/70">
              Fork the open-source tracker, add these as GitHub Actions variables, and plug in your own email or ntfy
              topic. It runs on your GitHub account every five minutes.
            </p>
            <a
              href={TRACKER_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-auto flex items-center justify-center gap-1 self-start rounded-full bg-background px-5 py-2.5 text-[15px] text-foreground transition-opacity hover:opacity-90 max-lg:mt-6"
            >
              Fork on GitHub
              <ArrowUpRight className="size-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>

      <CheckoutSheet
        key={`${email}|${postal}|${distance}|${model.partNumber}`}
        title={`Email alerts · ${dollars(ALERT_PASS.cents)}`}
        open={open}
        onClose={() => setOpen(false)}
        fetchClientSecret={fetchClientSecret}
      />
    </section>
  );
}
