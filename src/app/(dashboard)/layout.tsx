import { Sidebar, MobileBar } from "@/components/layout/Sidebar";
import { NotificationWatcher } from "@/components/notifications/NotificationWatcher";
import { getSessionUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  const username = session?.username ?? "equipe";

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <MobileBar username={username} />
      <Sidebar username={username} />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6">
        {children}
      </main>
      <NotificationWatcher />
    </div>
  );
}
