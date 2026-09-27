import type { CanvasDocument } from '@forme/design-ir'
import { CanvasEditor } from './canvas-editor'

export function WorkspaceShell({
  projectId,
  projectName,
  name,
  email,
  canvas,
  revision,
}: {
  projectId: string
  projectName: string
  name: string
  email: string
  canvas: CanvasDocument
  revision: number
}) {
  return <CanvasEditor projectId={projectId} projectName={projectName} name={name} email={email} canvas={canvas} revision={revision} />
}
