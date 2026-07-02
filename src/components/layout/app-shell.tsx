import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ToastViewport } from "@/components/shared/toast-viewport";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-background flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</div>
        </main>
      </div>
      <ToastViewport />
    </div>
  );
}
