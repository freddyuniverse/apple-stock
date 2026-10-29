'use client';

import { useCallback, useState } from 'react';
import { Heart } from 'lucide-react';
import { TIPS, dollars, type TipId } from '@/lib/products';
import { startTipCheckout } from '@/app/actions/checkout';
import { CheckoutSheet } from '@/components/checkout-sheet';

export function TipJar() {
  const [tipId, setTipId] = useState<TipId>('tip-5');
  const [open, setOpen] = useState(false);
  const [thanked, setThanked] = useState(false);
  const tip = TIPS.find((t) => t.id === tipId)!;
  const fetchClientSecret = useCallback(() => startTipCheckout(tipId), [tipId]);

  return (
    <section id="support" aria-labelledby="support-title" className="scroll-mt-12 bg-background py-20 md:py-28">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-5 text-center">
        <Heart className="size-8 text-primary" aria-hidden="true" fill={thanked ? 'currentColor' : 'none'} />
        <h2 id="support-title" className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          {thanked ? 'Thank you.' : 'Found your Duo?'}
        </h2>
        <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
          {thanked
            ? 'Your tip keeps the alerts running for everyone still hunting.'
            : 'findmyduo is built by one person. If it saved you a few days of refreshing, a small tip keeps it running.'}
        </p>

        {!thanked && (
          <>
            <fieldset className="mt-2">
              <legend className="sr-only">Tip amount</legend>
              <div className="flex rounded-full bg-secondary p-1">
                {TIPS.map((t) => (
                  <label key={t.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="tip"
                      value={t.id}
                      checked={tipId === t.id}
                      onChange={() => setTipId(t.id)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-full px-6 py-2 text-[15px] text-muted-foreground transition peer-checked:bg-background peer-checked:font-medium peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                      {dollars(t.cents)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full bg-primary px-6 py-3 text-[17px] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Tip {dollars(tip.cents)}
            </button>
            <p className="text-xs text-muted-foreground">Secure checkout by Stripe. Apple Pay accepted.</p>
          </>
        )}
      </div>

      <CheckoutSheet
        key={tipId}
        title={`Tip ${dollars(tip.cents)}`}
        open={open}
        onClose={() => setOpen(false)}
        fetchClientSecret={fetchClientSecret}
        onComplete={() => {
          setThanked(true);
          setTimeout(() => setOpen(false), 1500);
        }}
      />
    </section>
  );
}
