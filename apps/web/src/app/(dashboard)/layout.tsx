import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#070b13] transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar user={session.user} />

      {/* Main Content Panel */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Header Panel */}
        <Topbar />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
