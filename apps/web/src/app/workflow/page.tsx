import { InfoPage } from '../info-page'

export const metadata = { title: 'Workflow — FORME by Mavent' }

export default function WorkflowPage() {
  return <InfoPage label="Workflow" title="Structure first. Then refine." description="The intended path is a clear frame, semantic blocks, responsive layouts, design context, and a shareable handoff." details={['Start with a frame. Place a block yourself or scope an instruction to the part of the page you want changed.', 'Refine Desktop, Tablet, and Mobile; apply a preset or your DESIGN.md. Read-only sharing, export, and agent handoff follow after the core workspace is operational.']} />
}
