import { Bell, Store, Truck } from 'lucide-react';

const FEATURES = [
  {
    icon: Store,
    title: 'Pickup near you.',
    body: 'We ask Apple about every store within your distance, using the same stock check the Apple Store app uses.',
  },
  {
    icon: Truck,
    title: '2-hour courier.',
    body: 'If Apple can courier a Duo to your door the same day, you hear about it too.',
  },
  {
    icon: Bell,
    title: 'One ping. No noise.',
    body: 'One alert per store and model when it comes in. Another only if it sells out and returns.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <h2 id="how-title" className="max-w-2xl text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Checked every two minutes. <span className="text-muted-foreground">So you don&apos;t have to.</span>
        </h2>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex flex-col gap-4 rounded-apple bg-secondary p-7">
              <Icon className="size-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
