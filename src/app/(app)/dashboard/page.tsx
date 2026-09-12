export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const showSuccess = success === '1'

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      {showSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-3 text-sm text-green-800">
          Check-in enregistré !
        </div>
      )}
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      <p className="text-sm text-zinc-500">Vue d&apos;ensemble à venir.</p>
    </div>
  )
}
