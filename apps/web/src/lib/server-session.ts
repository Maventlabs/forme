import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export function getServerSession() {
  return headers().then((requestHeaders) => auth.api.getSession({ headers: requestHeaders }))
}
