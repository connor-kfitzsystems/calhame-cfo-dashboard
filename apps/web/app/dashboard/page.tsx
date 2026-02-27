import DashboardHeader from "@/components/shared/DashboardHeader";
import Connect from "@/components/dashboard/Connect";
import Alert from "@/components/shared/Alert";

import { getCompaniesByUser } from "@/lib/queries/companies/get-companies-by-user";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/queries/users/get-user-by-clerk-id";

export default async function DashboardPage() {

  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userResult = await getUserByClerkId(clerkId);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const userId = userResult[0].id as string;
  const companies = await getCompaniesByUser(userId);

  return (
    <main className="w-full overflow-y-auto p-4 lg:p-8">
      <DashboardHeader title="Dashboard" description="Overview of your financial performance"/>
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        {companies.length === 0
          ? <Connect/>
          : <Alert
              title="Providers Connected - Data Syncing"
              description="Your connected providers are syncing data. Your data will appear once the job is complete."
            />
        }
      </div>
    </main>
  );
}
