import { InfoPage } from '../info-page'

export const metadata = { title: 'Pricing — FORME by Mavent' }

export default function PricingPage() {
  return <InfoPage label="Monthly subscriptions · proposed" title="One place for the work before code." description="Three planned monthly plans: Solo $5, Maker $10, Studio $19 per editor. Prices and feature limits are proposals; paid access and checkout are not live." details={['FORME is a proprietary product. Your model-provider costs are separate when you connect your own AI credentials (BYOK).', 'No payment is collected on this page. Terms and entitlements will be confirmed before paid use begins.']} />
}
