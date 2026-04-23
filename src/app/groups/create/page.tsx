import { redirect } from 'next/navigation';

export default function LegacyCreateGroupPage() {
  redirect('/groups/new');
}
