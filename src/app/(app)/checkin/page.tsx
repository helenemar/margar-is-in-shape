import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'
import { CheckinForm, type Member } from './CheckinForm'

export default async function CheckinPage() {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, prenom')
    .eq('group_id', profile.group_id)
    .neq('id', profile.id)
    .order('prenom')

  const members: Member[] = data ?? []

  return <CheckinForm members={members} />
}
