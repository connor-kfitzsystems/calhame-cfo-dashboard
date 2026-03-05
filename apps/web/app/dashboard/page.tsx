import DashboardHeader from "@/components/shared/DashboardHeader";
import Connect from "@/components/dashboard/Connect";
import CompanyCard from "@/components/dashboard/CompanyCard";
import getUserByClerkId from "@/lib/queries/users/clerk-id/get";
import getCompaniesByUser from "@/lib/queries/companies/user-id/get";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {

  const { userId: clerkId } = await auth();

  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  const companies = await getCompaniesByUser(user.id);
  
  const hasCompanies = companies.length > 0;

  return (
    <main className="w-full overflow-y-auto p-4 lg:p-8">
      <DashboardHeader title="Executive P&L" description={`${hasCompanies ? "Select a company to view data" : "No companies available"}`}/>
      {companies.length === 0
        ? <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
            <Connect/>
          </div>
        : <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard 
                key={company.companyMembershipId}
                companyId={company.companyId}
                companyName={company.companyName}
              />
            ))}
          </div>
      }
    </main>
  );
}
