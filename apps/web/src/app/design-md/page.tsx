import { InfoPage } from '../info-page'

export const metadata = { title: 'DESIGN.md status — FORME by Mavent' }

export default function DesignMdPage() {
  return <InfoPage label="DESIGN.md generator · Coming Soon" title="Make the rules explicit." description="Automatic DESIGN.md generation is planned but not available yet. The product roadmap supports uploading, pasting, and editing your own DESIGN.md before generation is introduced." details={['Your design context will describe typography, spacing, rhythm and component choices so the wireframe keeps its intended direction.', 'No document is generated or uploaded from this information page.']} />
}
