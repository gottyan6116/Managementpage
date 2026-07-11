import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/guard";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return <AppShell>{children}</AppShell>;
}
