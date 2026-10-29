import { stripe } from '@/lib/stripe';
import { activateAlert } from '@/lib/alerts';

// Backup for buyers who close the tab before the return page loads.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook not configured', { status: 501 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') ?? '', secret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed' && event.data.object.metadata?.kind === 'alert') {
    await activateAlert(event.data.object.id);
  }
  return Response.json({ received: true });
}
