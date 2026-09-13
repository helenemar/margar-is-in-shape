import { redirect } from 'next/navigation'

// /dashboard is now merged into /feed
export default function DashboardRedirect() {
  redirect('/feed')
}
