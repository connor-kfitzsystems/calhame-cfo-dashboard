import DashboardHeader from "@/components/shared/DashboardHeader";
import AccountingProviderConnect from "@/components/dashboard/connect/AccountingProviderConnect";

import { headers } from "next/headers";
import { CompanyListItem } from "@repo/shared";

export default async function DashboardConnectPage() {
  
  const headerPayload = await headers();
  const cookie = headerPayload.get("cookie") ?? "";

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/companies`, {
    headers: {
      cookie,
    },
    cache: "no-store"
  });

  if (!response.ok) throw new Error("Failed to fetch companies");

  const companies = await response.json();

  function getCompaniesbyProvider(provider: string) {
    return companies.filter((company: CompanyListItem) => company.providerName === provider);
  }

  return (
    <main className="w-full overflow-y-auto p-4 lg:p-8">
      <DashboardHeader title="Connect" description="Connect and sync your accounting providers"/>
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <AccountingProviderConnect provider="quickbooks" companies={getCompaniesbyProvider("quickbooks")}/>
      </div>
    </main>
  );
}
