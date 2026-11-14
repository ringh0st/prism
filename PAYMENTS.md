# Real-money diamonds: setup

Lumipals sells diamonds through **Lemon Squeezy**, a "merchant of record". It handles payments, receipts, worldwide sales tax/VAT and refunds, and pays out to your bank. Fees are about 5% + 50¢ per order.

How a purchase works:

1. The player taps a pack in the store. The `create-checkout` function asks Lemon Squeezy for a secure checkout page.
2. The player pays on Lemon Squeezy's page and is sent back to the game.
3. Lemon Squeezy notifies the `lemonsqueezy-webhook` function, which checks the signature and adds the diamonds to the player's account.

The game itself can never add diamonds.

Never paste API keys, secrets or tokens into a chat, an issue or a commit. They only go into the dashboards and GitHub secrets named below.

## 1. Lemon Squeezy account (your bank)

1. Sign up at [lemonsqueezy.com](https://www.lemonsqueezy.com) and create a store called **Lumipals**.
2. **Settings → Payouts:** add your bank account and complete identity verification. This is where your money goes.
3. While you set things up, keep **Test mode** on (toggle at the bottom-left of the dashboard). Before real sales, Lemon Squeezy asks you to activate the store. It reviews your site, so point it to `https://ringh0st.github.io/prism/` and its Terms and Privacy pages.

## 2. Create the diamond products

**Products → + New product:** create a product called **Lumipals Diamonds** with 3 variants:

| Variant name | Price | Pack id in the game |
| --- | --- | --- |
| 10 diamonds | €0.99 | `diamonds-10` |
| 60 diamonds | €4.99 | `diamonds-60` |
| 130 diamonds | €9.99 | `diamonds-130` |

For each variant, copy its **variant ID** (a number) from the variant's menu.

The variant IDs are saved in `supabase/economy.sql` (`diamond_packs`): 10 → `2372489`, 60 → `2372493`, 130 → `2372494`. If you ever recreate the product, update them there and re-run the script.

## 3. Keys from Lemon Squeezy

- **Store ID:** `523117` (Ringhost games). Already in the code, nothing to do.
- **API key:** Settings → API → **+**. Copy it once.
- **Webhook:** Settings → Webhooks → **+**
  - Callback URL: `https://wapxwfpgrijxaclsbwkq.supabase.co/functions/v1/lemonsqueezy-webhook`
  - Signing secret: make up a long random password (30+ characters) and keep it for the next step
  - Events: **order_created** and **order_refunded**

## 4. Supabase access token

[supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) → **Generate new token** → name it `GitHub deploy`.

## 5. Secrets

**In Supabase** ([Edge Functions → Secrets](https://supabase.com/dashboard/project/wapxwfpgrijxaclsbwkq/functions/secrets)) add:

| Name | Value |
| --- | --- |
| `LEMONSQUEEZY_API_KEY` | API key from step 3 |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | the signing secret you made up in step 3 |

**In GitHub** ([Settings → Secrets → Actions](https://github.com/ringh0st/prism/settings/secrets/actions)) add `SUPABASE_ACCESS_TOKEN` with the token from step 4. It needs permission to deploy Edge Functions.

## 6. Deploy

[Actions → Deploy Supabase functions](https://github.com/ringh0st/prism/actions/workflows/supabase-functions.yml) → **Run workflow**. It stores the Lemon Squeezy keys in Supabase and deploys both functions.

## 7. Switch it on

Tell Claude, or set `PAYMENTS_ENABLED = true` in `src/lib/config.js`. Then test a purchase in Lemon Squeezy test mode with the card `4242 4242 4242 4242`, any future date and any CVC. Diamonds should appear within seconds. Finally, turn off test mode once your store is activated.

## Refunds

Refund an order in Lemon Squeezy (Orders → order → Refund). The webhook removes the diamonds automatically.
