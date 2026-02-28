import DashboardHeader from "@/components/shared/DashboardHeader";
import AccountingProvidersContainer from "@/components/dashboard/connect/AccountingProvidersContainer";

import { getCompaniesByUser } from "@/lib/queries/companies/get-companies-by-user";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/queries/users/get-user-by-clerk-id";
import { redirect } from "next/navigation";

export default async function DashboardConnectPage() {
  
  const { userId: clerkId } = await auth();

  if (!clerkId) redirect("/sign-in");

  const userResult = await getUserByClerkId(clerkId);
  const userId = userResult[0].id as string;
  const companies = await getCompaniesByUser(userId);

  return (
    <main className="w-full overflow-y-auto p-4 lg:p-8">
      <DashboardHeader title="Connect" description="Connect and sync your accounting providers"/>
      <AccountingProvidersContainer companies={companies}/>
    </main>
  );
}
