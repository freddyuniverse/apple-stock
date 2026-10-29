'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { TRACKER_REPO_URL, milesToKm, normalizeZip } from '@/lib/duo';

const DISTANCES = [10, 25, 50, 100];

type Model = { partNumber: string; name: string };

function randomTopic() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `findmyduo-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function AlertsSetup({ model }: { model: Model }) {
  const [postalInput, setPostalInput] = useState('');
  const [distance, setDistance] = useState(50);
  const [topic, setTopic] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const postal = normalizeZip(postalInput);
  const showPostalError = postalInput.trim().length >= 5 && !postal;
  const ready = Boolean(postal && topic);

  const config = [
    `POSTAL_CODE=${postal ?? '10001'}`,
    'COUNTRY=us',
    'PRODUCT=iphone-duo',
    `MODELS=${model.partNumber}`,
    `MAX_DISTANCE_KM=${milesToKm(distance)}`,
    `NTFY_TOPIC=${topic ?? 'create-a-topic-above'}`,
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
          Get pinged the second it lands.
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Alerts for <span className="text-foreground">{model.name}</span>. Set it up once, and your phone buzzes when
          a store near you has one.
        </p>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-8 rounded-apple bg-background p-7">
            <div className="flex flex-col gap-2">
              <label htmlFor="postal" className="text-sm font-medium">
                Your ZIP code
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
                className="h-14 rounded-xl border border-border bg-background px-4 text-[17px] uppercase outline-none transition placeholder:normal-case placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,113,227,0.2)]"
              />
              <p id="postal-hint" className="text-xs text-muted-foreground">
                {showPostalError ? 'Enter a 5-digit US ZIP code, like 10001.' : 'Any Apple Store in the US.'}
              </p>
            </div>

            <fieldset>
              <legend className="text-sm font-medium">How far would you go?</legend>
              <div className="mt-2 flex rounded-full bg-secondary p-1">
                {DISTANCES.map((d) => (
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
              <p className="text-sm font-medium">Your private alert channel</p>
              {topic ? (
                <a
                  href={`https://ntfy.sh/${topic}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1 rounded-full bg-primary px-5 py-3 text-[17px] text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Subscribe in ntfy
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setTopic(randomTopic())}
                  className="rounded-full bg-primary px-5 py-3 text-[17px] text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Create my alert channel
                </button>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                {topic
                  ? 'Open the link on your phone in the free ntfy app to receive push alerts.'
                  : 'A random, private channel for push notifications through the free ntfy app.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col rounded-apple bg-foreground p-7 text-background">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">Your tracker settings</p>
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
            <ol className="mt-6 flex flex-col gap-3 text-sm leading-relaxed text-background/70">
              <li>
                <span className="text-background">Fork the tracker</span> on GitHub. It runs free on GitHub Actions
                every five minutes.
              </li>
              <li>
                <span className="text-background">Add these settings</span> under Settings, then Secrets and variables,
                then Actions. Put NTFY_TOPIC in Secrets.
              </li>
              <li>
                <span className="text-background">{ready ? "You're set." : 'That\u2019s it.'}</span> You&apos;ll get
                one ping per store when your Duo comes in.
              </li>
            </ol>
            <a
              href={TRACKER_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-auto flex items-center justify-center gap-1 self-start rounded-full bg-background px-5 py-2.5 pt-2.5 text-[15px] text-foreground transition-opacity hover:opacity-90 max-lg:mt-6"
            >
              Fork on GitHub
              <ArrowUpRight className="size-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
