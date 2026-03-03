import DashboardHeader from "@/components/shared/DashboardHeader";
import Connect from "@/components/dashboard/Connect";
import DashboardContainer from "@/components/dashboard/DashboardContainer";
import getDashboardData from "@/lib/queries/dashboard/index";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Quarter } from "@repo/shared";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ quarter?: Quarter, year?: string }> }) {

  const { userId: clerkId } = await auth();

  if (!clerkId) redirect("/sign-in");

  const {quarter, year } = await searchParams ?? {};
  
  const quarterValue = quarter ?? "year";
  const yearValue = year ? parseInt(year, 10) : new Date().getFullYear();
  
  const dashboardData = await getDashboardData(clerkId, quarterValue, yearValue);

  return (
    <main className="w-full overflow-y-auto p-4 lg:p-8">
      <DashboardHeader title="Executive P&L" description={`Period: ${year}`}/>
      {dashboardData.companies.length === 0
        ? <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
            <Connect/>
          </div>
        : <DashboardContainer data={dashboardData} quarter={quarterValue} year={yearValue}/>
      }
    </main>
  );
}
