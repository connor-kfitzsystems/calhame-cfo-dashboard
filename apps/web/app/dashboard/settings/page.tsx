import DashboardHeader from "@/components/shared/DashboardHeader";

import { auth } from "@clerk/nextjs/server";

export default async function DashboardSettingsPage() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) return null;

  return (
    <main className="w-full overflow-y-auto p-4 lg:p-8">
      <DashboardHeader title="Settings" description="Manage your account settings"/>
    </main>
  );
}
