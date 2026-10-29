import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { alertSubscriptions } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { ALERT_PASS } from '@/lib/products';

// Called from both the return page and the Stripe webhook, so it must be idempotent.
export async function activateAlert(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.kind !== 'alert' || session.payment_status !== 'paid') return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ALERT_PASS.days * 24 * 60 * 60 * 1000);
  const [activated] = await db
    .update(alertSubscriptions)
    .set({ status: 'active', paidAt: now, expiresAt })
    .where(and(eq(alertSubscriptions.stripeSessionId, sessionId), eq(alertSubscriptions.status, 'pending')))
    .returning();
  if (activated) return activated;

  const [existing] = await db
    .select()
    .from(alertSubscriptions)
    .where(eq(alertSubscriptions.stripeSessionId, sessionId))
    .limit(1);
  return existing ?? null;
}
