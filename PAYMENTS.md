# Real-money diamonds: setup

Lumipals sells diamonds through **Stripe Managed Payments**. Stripe is the "merchant of record": it sells on your behalf, handles payments, receipts, worldwide sales tax/VAT, refunds and disputes, and pays out to your bank. Fees are 3.5% per sale on top of Stripe's normal card fees.

Until now the game sold through **Lemon Squeezy**. Lemon Squeezy closes on **31 March 2027** and moves its sellers to Stripe Managed Payments. Both are built in; the `PAYMENTS_PROVIDER` secret chooses which one sells (step 6). Lemon Squeezy's old setup is at the end.

How a purchase works:

1. The player taps a pack in the store. The `create-checkout` function asks Stripe for a secure checkout page.
2. The player pays on Stripe's page and is sent back to the game.
3. Stripe notifies the `stripe-webhook` function, which checks the signature and adds the diamonds to the player's account.

The game itself can never add diamonds. The website sells through Stripe; the iPhone app sells the same packs through **Apple's in-app purchases** and never opens the web checkout (Apple's rule). The Apple setup is in its own section below.

Never paste API keys, secrets or tokens into a chat, an issue or a commit. They only go into the dashboards and secrets named below.

## 1. Stripe account (your bank)

The easiest way is Lemon Squeezy's migration tool (from 2 December 2026): in your Lemon Squeezy dashboard, follow its steps to move to Stripe. It checks that Managed Payments is available for your country (Finland) and sets up your Stripe account.

Or sign up directly at [dashboard.stripe.com](https://dashboard.stripe.com/register) with your Finnish business details, then:

1. **Settings → Payouts:** add your bank account and complete identity verification. This is where your money goes.
2. Turn on **Managed Payments** (Settings → Managed Payments, or the page Stripe shows during setup). It reviews your business and your site: point it to `https://lumipals.app/` and its Terms and Privacy pages.
3. While you set things up, keep **Test mode** on (the toggle at the top of the dashboard).

## 2. Create the diamond products

**Product catalog → + Add product:** create three products (one-off prices, not recurring). Give each the tax category for **digital game items / in-game currency** (Stripe needs it to work out the tax):

| Product name | Price | Pack id in the game |
| --- | --- | --- |
| 10 diamonds | €0.99 | `diamonds-10` |
| 60 diamonds | €4.99 | `diamonds-60` |
| 130 diamonds | €9.99 | `diamonds-130` |

For each one, copy its **price ID** (it starts with `price_`, under Pricing in the product page). Then, in Supabase → SQL Editor, save them:

```sql
update public.diamond_packs set stripe_price_id = 'price_…' where id = 'diamonds-10';
update public.diamond_packs set stripe_price_id = 'price_…' where id = 'diamonds-60';
update public.diamond_packs set stripe_price_id = 'price_…' where id = 'diamonds-130';
```

(First add the column once, with this line on its own, rather than re-running economy.sql, whose functions later scripts build on: `alter table public.diamond_packs add column if not exists stripe_price_id text unique;`) Test-mode and live prices have different IDs, so do this again with the live ones when you go live.

## 3. Keys from Stripe

- **Secret key:** Developers → API keys → **Secret key** (`sk_test_…` in test mode, `sk_live_…` live). Copy it once.
- **Webhook:** Developers → Webhooks → **+ Add destination**
  - Endpoint URL: `https://wapxwfpgrijxaclsbwkq.supabase.co/functions/v1/stripe-webhook`
  - Events: **checkout.session.completed**, **checkout.session.async_payment_succeeded** and **charge.refunded**
  - After saving, reveal the **Signing secret** (`whsec_…`) and copy it.

## 4. Supabase access token

[supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) → **Generate new token** → name it `GitHub deploy`. (Skip this if you already did it for Lemon Squeezy.)

## 5. Secrets

**In Supabase** ([Edge Functions → Secrets](https://supabase.com/dashboard/project/wapxwfpgrijxaclsbwkq/functions/secrets)) add:

| Name | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | the secret key from step 3 |
| `STRIPE_WEBHOOK_SECRET` | the webhook signing secret from step 3 |

**In GitHub** ([Settings → Secrets → Actions](https://github.com/ringh0st/prism/settings/secrets/actions)) add `SUPABASE_ACCESS_TOKEN` with the token from step 4 (if it isn't there yet). It needs permission to deploy Edge Functions.

## 6. Deploy and switch to Stripe

1. [Actions → Deploy Supabase functions](https://github.com/ringh0st/prism/actions/workflows/supabase-functions.yml) → **Run workflow**. It deploys `create-checkout` and both webhooks.
2. In Supabase secrets add `PAYMENTS_PROVIDER` = `stripe`. From then on the store's checkout opens through Stripe. (Without it, or set to `lemonsqueezy`, it still opens through Lemon Squeezy.)
3. Test a purchase in test mode with the card `4242 4242 4242 4242`, any future date and any CVC. Diamonds should appear within seconds.
4. When it works, repeat steps 2–5 with your **live** keys, prices and webhook, and turn off test mode.

## Refunds

Refund a payment in Stripe (Payments → the payment → Refund). The webhook takes the diamonds back automatically (on a full refund).

## Lemon Squeezy (until 31 March 2027)

The old setup keeps working until you switch: store ID `523117`, the product variants saved in `supabase/economy.sql` (`diamond_packs.variant_id`), the `LEMONSQUEEZY_API_KEY` and `LEMONSQUEEZY_WEBHOOK_SECRET` secrets, and the webhook `https://wapxwfpgrijxaclsbwkq.supabase.co/functions/v1/lemonsqueezy-webhook` (events **order_created** and **order_refunded**). Orders made through Lemon Squeezy can still be refunded there, and its webhook still takes the diamonds back. After it closes, its function, secrets and the `variant_id` column can be removed.

## Apple in-app purchases (iPhone app)

Apple only lets an app use diamonds bought on the web if the app also sells them through Apple. So the iPhone app has the same three packs as in-app purchases. Apple takes its commission (15% in the Small Business Program, otherwise 30%) and handles payment, tax and refunds.

How a purchase works:

1. The player taps a pack in the app's Shop and pays on Apple's payment sheet.
2. The app sends the transaction's id to the `apple-purchase` function, which asks Apple what was bought and adds the diamonds to the buyer's account.
3. If Apple refunds the purchase, it notifies the `apple-notifications` function, which takes the diamonds back.

A purchase that was paid but not delivered (the app closed, no network) is delivered the next time the app opens.

You need to be in the Apple Developer Program and have the app created in App Store Connect (IOS.md) first.

### A. Agreements

App Store Connect → **Business**: accept the **Paid Apps Agreement** and fill in your bank and tax details. Without it, products don't load in the app. If you qualify, also enrol in the **App Store Small Business Program** (15% commission).

### B. Create the three products

App Store Connect → your app → **Monetization → In-App Purchases → +**, type **Consumable**, three times. The Product ID must be exactly as written:

| Reference name | Product ID | Price | Pack in the game |
| --- | --- | --- | --- |
| 10 diamonds | `app.lumipals.diamonds10` | €0.99 | `diamonds-10` |
| 60 diamonds | `app.lumipals.diamonds60` | €4.99 | `diamonds-60` |
| 130 diamonds | `app.lumipals.diamonds130` | €9.99 | `diamonds-130` |

For each: set the price, add a display name and description (English at least), and add a review screenshot (a picture of the Shop's Diamonds tab). The first time, the products are submitted together with the app version.

### C. The key for our server

App Store Connect → **Users and Access → Integrations → In-App Purchase** → **Generate In-App Purchase Key**. Download the `.p8` file (only possible once) and note its **Key ID** and the **Issuer ID** shown at the top of the page.

In Supabase ([Edge Functions → Secrets](https://supabase.com/dashboard/project/wapxwfpgrijxaclsbwkq/functions/secrets)) add:

| Name | Value |
| --- | --- |
| `APPLE_IAP_ISSUER_ID` | the Issuer ID |
| `APPLE_IAP_KEY_ID` | the Key ID |
| `APPLE_IAP_PRIVATE_KEY` | the whole text of the `.p8` file, including the BEGIN and END lines |

### D. Refund notices

App Store Connect → your app → **App Information → App Store Server Notifications**: set both the **Production** and **Sandbox** URL to

`https://wapxwfpgrijxaclsbwkq.supabase.co/functions/v1/apple-notifications`

and choose **Version 2**.

### E. Xcode

After `npm run ios`, in Xcode select the **App** target → **Signing & Capabilities → + Capability → In-App Purchase**.

### F. Deploy and test

1. [Actions → Deploy Supabase functions](https://github.com/ringh0st/prism/actions/workflows/supabase-functions.yml) → **Run workflow** (it also runs by itself when the functions change).
2. App Store Connect → **Users and Access → Sandbox → Test Accounts**: create a sandbox tester. On the iPhone: Settings → Developer → Sandbox Apple Account, sign in with it.
3. Install the app through Xcode or TestFlight, sign in to the game, open Shop → Diamonds. The three packs should show Apple's prices. Buy one: no real money is charged in the sandbox, and the diamonds should fly into the counter within seconds.
4. If the buttons show "…", the products didn't load: check step A (agreement), the Product IDs, and that the capability from step E is on.

This part was written without an iPhone or an Apple account to test on, so the first sandbox purchase is the real test. If it fails, the function logs in Supabase (Edge Functions → apple-purchase → Logs) say why.
