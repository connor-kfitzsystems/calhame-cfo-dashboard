import DashboardHeader from "@/components/shared/DashboardHeader";
import AccountingProvidersContainer from "@/components/dashboard/connect/AccountingProvidersContainer";

import { headers } from "next/headers";

export default async function DashboardConnectPage() {
  
  const headerPayload = await headers();
  const cookie = headerPayload.get("cookie") ?? "";

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/companies`, {
    headers: {
      cookie
    },
    cache: "no-store"
  });

  if (!response.ok) throw new Error("Failed to fetch companies");

  const companies = await response.json();

  return (
    <main className="w-full overflow-y-auto p-4 lg:p-8">
      <DashboardHeader title="Connect" description="Connect and sync your accounting providers"/>
      <AccountingProvidersContainer companies={companies}/>
    </main>
  );
}
