import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SidebarProvider } from '@/components/SidebarContext';
import DynamicMainContent from '@/components/DynamicMainContent';

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
    <SidebarProvider>
      <div className="min-h-screen flex bg-zinc-50 dark:bg-[#070b13] transition-colors duration-300">
        {/* Sidebar Navigation */}
        <Sidebar user={session.user} />

        {/* Main Content Panel — width adjusts with sidebar */}
        <DynamicMainContent>
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
        </DynamicMainContent>
      </div>
    </SidebarProvider>
  );
}
