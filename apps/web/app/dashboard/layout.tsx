import DashboardSideNav from "@/components/nav/DashboardSideNav";
import getCompaniesByUser from "@/lib/queries/companies/user-id/get";
import getUserByClerkId from "@/lib/queries/users/clerk-id/get";

import { SidebarProvider } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {

  const { userId: clerkId } = await auth();

  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  const companies = await getCompaniesByUser(user.id);

	return (
    <SidebarProvider>
      <DashboardSideNav companies={companies}/>
      {children}
    </SidebarProvider>
	);
}
