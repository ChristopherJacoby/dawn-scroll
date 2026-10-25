#!/usr/bin/env node
// Creates the Dawnscroll Premium product and its two prices in Stripe,
// found later by lookup key (see src/lib/stripe.ts). Safe to re-run: it
// reuses prices that already exist.
//
//   STRIPE_SECRET_KEY=sk_test_… node scripts/create-stripe-products.mjs
//
// Prices must match src/lib/premium/plans.ts.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("Set STRIPE_SECRET_KEY (a test-mode key first).");
const stripe = new Stripe(key);

const PRICES = [
  { lookupKey: "dawnscroll_premium_monthly", amount: 799, interval: "month" },
  { lookupKey: "dawnscroll_premium_annual", amount: 6499, interval: "year" },
];

const existing = await stripe.prices.list({ lookup_keys: PRICES.map((p) => p.lookupKey), active: true, expand: ["data.product"] });
let product = existing.data[0]?.product;
if (!product || typeof product === "string") {
  product = await stripe.products.create({ name: "Dawnscroll Premium" });
  process.stdout.write(`Created product ${product.id}\n`);
}

for (const price of PRICES) {
  const found = existing.data.find((p) => p.lookup_key === price.lookupKey);
  if (found) {
    process.stdout.write(`${price.lookupKey}: exists (${found.id})\n`);
    continue;
  }
  const created = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: price.amount,
    recurring: { interval: price.interval },
    lookup_key: price.lookupKey,
  });
  process.stdout.write(`${price.lookupKey}: created (${created.id})\n`);
}
