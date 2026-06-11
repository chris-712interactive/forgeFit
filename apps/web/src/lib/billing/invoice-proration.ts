import type Stripe from "stripe";

function isProrationLine(line: Stripe.InvoiceLineItem): boolean {
  const parent = line.parent as
    | { subscription_item_details?: { proration?: boolean } }
    | undefined;

  if (parent?.subscription_item_details?.proration === true) {
    return true;
  }

  // Legacy field on older API versions.
  return (line as Stripe.InvoiceLineItem & { proration?: boolean }).proration ===
    true;
}

export function getProrationLines(
  invoice: Stripe.Invoice
): Stripe.InvoiceLineItem[] {
  return invoice.lines?.data.filter(isProrationLine) ?? [];
}

/** Net proration in cents — negative when the customer receives a credit. */
export function sumProrationCents(invoice: Stripe.Invoice): number {
  return getProrationLines(invoice).reduce(
    (total, line) => total + (line.amount ?? 0),
    0
  );
}

export interface ProrationLineSummary {
  description: string;
  amountCents: number;
}

export function summarizeProrationLines(
  invoice: Stripe.Invoice
): ProrationLineSummary[] {
  return getProrationLines(invoice)
    .map((line) => ({
      description: line.description ?? "Proration adjustment",
      amountCents: line.amount ?? 0,
    }))
    .filter((line) => line.amountCents !== 0);
}
