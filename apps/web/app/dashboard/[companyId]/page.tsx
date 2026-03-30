import DashboardHeader from "@/components/shared/DashboardHeader";
import DashboardContainer from "@/components/dashboard/DashboardContainer";
import NoDataAvailable from "@/components/dashboard/NoDataAvailable";
import getDashboardData from "@/lib/queries/dashboard/index";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Quarter } from "@repo/shared";

export default async function DynamicDashboardPage({ params, searchParams }: {
  params: Promise<{ companyId: string }>,
  searchParams?: Promise<{ quarter?: Quarter, year?: string }> 
}) {

  const { userId: clerkId } = await auth();

  if (!clerkId) redirect("/sign-in");

  const [{ companyId }, searchParamsData] = await Promise.all([
    params,
    searchParams
  ]);

  const { quarter, year } = searchParamsData ?? {};
  
  const quarterValue = quarter ?? "year";
  const yearValue = year ? parseInt(year, 10) : new Date().getFullYear();
  
  const dashboardData = await getDashboardData(companyId, quarterValue, yearValue);

  const hasYearData = dashboardData.years.includes(yearValue);
  const hasQuarterData = quarterValue === "year" || dashboardData.quarters.includes(quarterValue);
  const hasData = hasYearData && hasQuarterData;

  return (
    <main className="w-full overflow-y-auto p-4 lg:p-8">
      <DashboardHeader title={dashboardData.companyName} description="Financial Overview"/>
      {!hasData
        ? <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
            <NoDataAvailable 
              companyId={companyId}
              year={yearValue} 
              quarter={quarterValue} 
              availableYears={dashboardData.years}
            />
          </div>
        : <DashboardContainer data={dashboardData} quarter={quarterValue} year={yearValue}/>
      }
    </main>
  );
}
