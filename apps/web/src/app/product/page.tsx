import { InfoPage } from '../info-page'

export const metadata = { title: 'Product — FORME by Mavent' }

export default function ProductPage() {
  return <InfoPage label="Product" title="A workspace for the shape of things." description="FORME is being built as a semantic wireframing workspace. The interface shown on the homepage is an illustrative preview, not an interactive editor yet." details={['Build interfaces from named blocks and keep their relationships visible as you work.', 'Design once for Desktop, Tablet, and Mobile with one shared semantic node identity. AI editing, provider connections, and export will arrive through the production workspace.']} />
}
