import { Heart } from 'lucide-react';
import { TIP_URL } from '@/lib/monetize';

export function TipJar() {
  return (
    <section id="support" aria-labelledby="support-title" className="scroll-mt-12 bg-background py-20 md:py-28">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-5 text-center">
        <Heart className="size-8 text-primary" aria-hidden="true" />
        <h2 id="support-title" className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Found your Duo?
        </h2>
        <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
          findmyduo is free and built by one person. If it saved you a few days of refreshing, a small tip keeps the
          alerts running.
        </p>
        <a
          href={TIP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 rounded-full bg-primary px-6 py-3 text-[17px] text-primary-foreground transition-opacity hover:opacity-90"
        >
          Leave a tip
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </section>
  );
}
