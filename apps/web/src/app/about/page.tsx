import { InfoPage } from '../info-page'

export const metadata = { title: 'Mavent — FORME' }

export default function AboutPage() {
  return <InfoPage label="Mavent" title="Made for the step before code." description="FORME by Mavent is a wireframe-first workspace for developers, founders, and designer-engineers shaping interfaces with AI tools." details={['Our focus is an editable, semantic interface structure that can travel through a design-to-code workflow.', 'This website currently previews the product direction. The workspace and its provider-connected editing flow are still in development.']} />
}
