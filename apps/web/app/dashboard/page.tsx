import DashboardHeader from "@/components/shared/DashboardHeader";
import Connect from "@/components/dashboard/Connect";
import Alert from "@/components/shared/Alert";

import { headers } from "next/headers";

export default async function DashboardPage() {

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
