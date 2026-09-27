import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { HubFeature } from '../hub-feature'
import { HubShell } from '../hub-shell'

export const metadata = { title: 'Cloning — FORME by Mavent' }

export default async function CloningPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <HubShell active="/cloning" name={session.user.name} email={session.user.email}>
      <HubFeature
        eyebrow="Website structure import"
        title="Cloning"
        description="Bring a website’s structure into a semantic FORME wireframe."
        status="Website-to-wireframe import is not available yet."
      />
    </HubShell>
  )
}
