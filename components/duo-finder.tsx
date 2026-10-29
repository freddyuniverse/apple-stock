'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { APPLE_DUO_URL, CAPACITIES, FINISHES, findModel, formatPrice, type CapacityId, type FinishId } from '@/lib/duo';
import { AlertsSetup } from '@/components/alerts-setup';

export function DuoFinder({ children }: { children?: React.ReactNode }) {
  const [finish, setFinish] = useState<FinishId>('nightsky');
  const [capacity, setCapacity] = useState<CapacityId>('256gb');
  const model = findModel(finish, capacity);
  const finishName = FINISHES.find((f) => f.id === finish)!.name;

  return (
    <>
      <section id="find" aria-labelledby="find-title" className="scroll-mt-12 bg-secondary py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <h2 id="find-title" className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Which Duo are you after?
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Choose the exact model. We&apos;ll match it to Apple&apos;s part number so you only hear about the one you
            want.
          </p>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div className="flex items-center justify-center overflow-hidden rounded-apple bg-background lg:sticky lg:top-20 lg:self-start">
              {FINISHES.map((f) => (
                <Image
                  key={f.id}
                  src={f.image}
                  alt={f.id === finish ? `iPhone Duo in ${f.name}` : ''}
                  aria-hidden={f.id !== finish}
                  width={940}
                  height={1112}
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className={`-my-[10%] h-auto w-full transition-opacity duration-500 ${
                    f.id === finish ? 'opacity-100' : 'absolute opacity-0'
                  }`}
                />
              ))}
            </div>

            <div className="flex flex-col gap-10">
              <fieldset>
                <legend className="text-xl font-semibold tracking-tight">
                  Finish. <span className="text-muted-foreground">Pick your favourite.</span>
                </legend>
                <p className="mt-4 text-sm text-muted-foreground">
                  Finish — <span className="text-foreground">{finishName}</span>
                </p>
                <div className="mt-3 flex gap-4">
                  {FINISHES.map((f) => (
                    <label key={f.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="finish"
                        value={f.id}
                        checked={finish === f.id}
                        onChange={() => setFinish(f.id)}
                        className="peer sr-only"
                      />
                      <span className="sr-only">{f.name}</span>
                      <span
                        aria-hidden="true"
                        className="block size-9 rounded-full p-0.5 ring-2 ring-transparent ring-offset-0 transition peer-checked:ring-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary"
                      >
                        <span
                          className="block size-full rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
                          style={{ backgroundColor: f.swatch }}
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xl font-semibold tracking-tight">
                  Storage. <span className="text-muted-foreground">How much space do you need?</span>
                </legend>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {CAPACITIES.map((c) => (
                    <label key={c.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="capacity"
                        value={c.id}
                        checked={capacity === c.id}
                        onChange={() => setCapacity(c.id)}
                        className="peer sr-only"
                      />
                      <span className="flex h-full flex-col gap-1 rounded-xl border border-border bg-background px-4 py-4 transition peer-checked:border-primary peer-checked:shadow-[0_0_0_1px_var(--primary)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                        <span className="text-lg font-semibold tracking-tight">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{formatPrice(c.price)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="rounded-apple bg-background p-6" aria-live="polite">
                <p className="text-sm text-muted-foreground">Your Duo</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{model.name}</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <p className="text-lg">{formatPrice(model.price)}</p>
                  <p className="font-mono text-xs text-muted-foreground">Part {model.partNumber}</p>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#alerts"
                    className="flex-1 rounded-full bg-primary px-5 py-3 text-center text-[17px] text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Alert me when it&apos;s in stock
                  </a>
                  <a
                    href={APPLE_DUO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-1 rounded-full border border-primary px-5 py-3 text-[17px] text-primary transition-colors hover:bg-primary/5"
                  >
                    Check pickup on apple.com
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {children}

      <AlertsSetup model={model} />
    </>
  );
}
