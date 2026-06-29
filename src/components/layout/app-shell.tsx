import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 py-3 pr-3">
        <div className="flex flex-col flex-1 min-w-0 rounded-2xl bg-surface border border-line shadow-card overflow-hidden">
          <Header />
          <main className="flex-1 min-w-0 overflow-auto bg-app">
            <div className="mx-auto max-w-[1600px] p-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
