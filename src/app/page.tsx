// src/app/page.tsx
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import StudentManagementClient from '@/components/StudentManagementClient';

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <StudentManagementClient user={session} />;
}