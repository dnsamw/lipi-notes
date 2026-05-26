import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/ui/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return <AppShell session={session}>{children}</AppShell>;
}
