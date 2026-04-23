import { redirect } from 'next/navigation';

export default async function LegacyCreateExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/groups/${id}/expenses/new`);
}
