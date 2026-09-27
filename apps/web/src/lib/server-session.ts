import { headers } from 'next/headers'
import { getAuth } from '@/lib/auth'

export function getServerSession() {
  return headers().then((requestHeaders) => getAuth().api.getSession({ headers: requestHeaders }))
}
