'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  fetchClientSecret: () => Promise<string>;
  onComplete?: () => void;
};

export function CheckoutSheet({ title, open, onClose, fetchClientSecret, onComplete }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className="m-auto w-[min(100%-2rem,32rem)] rounded-apple bg-card p-0 text-card-foreground backdrop:bg-foreground/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <p className="text-[17px] font-semibold">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto bg-background py-4">
        {open && (
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret, onComplete }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}
      </div>
    </dialog>
  );
}
