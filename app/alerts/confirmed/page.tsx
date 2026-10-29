import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { activateAlert } from '@/lib/alerts';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = { title: 'Alerts on · findmyduo', robots: { index: false } };

export default async function AlertConfirmedPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const alert = session_id?.startsWith('cs_') ? await activateAlert(session_id).catch(() => null) : null;
  const active = alert?.status === 'active';

  return (
    <>
      <SiteNav />
      <main className="flex min-h-[70vh] items-center bg-background py-20">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-5 text-center">
          {active ? (
            <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
          ) : (
            <CircleAlert className="size-12 text-muted-foreground" aria-hidden="true" />
          )}
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            {active ? 'Alerts are on.' : 'We couldn\u2019t confirm that payment.'}
          </h1>
          {active && alert ? (
            <>
              <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                We&apos;ll email <span className="text-foreground">{alert.email}</span> the moment{' '}
                <span className="text-foreground">{alert.modelName}</span> is ready for pickup within{' '}
                {alert.radiusMiles} miles of {alert.zip}.
              </p>
              <p className="text-sm text-muted-foreground">
                Active until{' '}
                {alert.expiresAt?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Check
                your spam folder for emails from findmyduo.
              </p>
            </>
          ) : (
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              If you were charged, your alerts will switch on shortly. Otherwise, head back and try again.
            </p>
          )}
          <Link
            href="/"
            className="mt-2 rounded-full bg-primary px-6 py-3 text-[17px] text-primary-foreground transition-opacity hover:opacity-90"
          >
            Back to findmyduo
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
