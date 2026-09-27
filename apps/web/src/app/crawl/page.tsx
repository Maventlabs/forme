import { InfoPage } from '../info-page'

export const metadata = { title: 'Website import status — FORME by Mavent' }

export default function CrawlPage() {
  return <InfoPage label="Website import · Coming Soon" title="Understand the structure. Then redesign it." description="Website crawling is planned for a later phase. This page does not accept URLs or launch a crawl." details={['A future import will extract structural principles into editable semantic wireframes rather than pixel-copying sites.', 'The crawler stays disabled until its URL validation, redirect handling and internal-network protections are implemented.']} />
}
