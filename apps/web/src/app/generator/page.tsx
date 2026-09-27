import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { HubFeature } from '../hub-feature'
import { HubShell } from '../hub-shell'

export const metadata = { title: 'Generator — FORME by Mavent' }

export default async function GeneratorPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <HubShell active="/generator" name={session.user.name} email={session.user.email}>
      <HubFeature
        eyebrow="Design context"
        title="Generator"
        description="Prepare a shared design language for the pages you build in FORME."
        status="Automatic DESIGN.md generation is not available yet."
      />
    </HubShell>
  )
}
