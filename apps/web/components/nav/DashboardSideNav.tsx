"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";
import { LogOut, BookOpen } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter,SidebarHeader, SidebarMenu,SidebarMenuButton, SidebarMenuItem, SidebarSeparator} from "@/components/ui/sidebar";
import { dashboardSideNavItems } from "@/lib/constants";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { CompanyListItem } from "@repo/shared";

interface DashboardSideNavProps {
  companies: CompanyListItem[];
}

export default function DashboardSideNav({ companies }:  DashboardSideNavProps) {

  const pathname = usePathname();

  return (
    <Sidebar className="flex h-full w-70 flex-col bg-sidebar text-sidebar-foreground">

      <SidebarHeader className="px-6 py-5">
        <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <BookOpen className="h-4 w-4 text-sidebar-primary-foreground"/>
            </div>
          <span className="text-lg font-semibold tracking-tight">Calhame</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-1 flex-col gap-1 px-3 pt-2">
        <SidebarMenu>
          {dashboardSideNavItems.filter((item) => !item.disabled).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const isDashboard = item.href === "/dashboard";

            return (
              <>
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    <Link
                      href={item.href}
                      className={
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground flex items-center gap-3"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground flex items-center gap-3"
                      }
                    >
                      <Icon className="h-4 w-4"/>
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {isDashboard && companies.length > 0 && (
                  <>
                    {companies.map((company) => {
                      const companyHref = `/dashboard/${company.companyId}`;
                      const isCompanyActive = pathname === companyHref;
                      
                      return (
                        <SidebarMenuItem key={company.companyMembershipId}>
                          <SidebarMenuButton
                            asChild
                            isActive={isCompanyActive}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ml-6"
                          >
                            <Link
                              href={companyHref}
                              className={
                                isCompanyActive
                                  ? "w-auto! bg-sidebar-accent text-sidebar-accent-foreground flex items-center gap-3"
                                  : "w-auto! text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground flex items-center gap-3"
                              }
                            >
                              {company.companyName}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </>
                )}
              </>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator className="mx-0"/>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground">
              <SignOutButton redirectUrl="/sign-in">
                <Button variant="link">
                  <LogOut className="h-4 w-4"/>
                  Sign out
                </Button>
              </SignOutButton>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
    </Sidebar>
  );
}
