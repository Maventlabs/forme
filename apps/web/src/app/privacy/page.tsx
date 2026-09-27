import { InfoPage } from '../info-page'

export const metadata = { title: 'Privacy status — FORME by Mavent' }

export default function PrivacyPage() {
  return <InfoPage label="Privacy status" title="Privacy details are being prepared." description="Account creation, provider-key entry, uploads, and payments are not offered through this preview website." details={['A product privacy policy will be published before those data-processing features become available.', 'Do not submit credentials, private documents, or personal information to this preview. This page is a status notice, not a full privacy policy.']} />
}
