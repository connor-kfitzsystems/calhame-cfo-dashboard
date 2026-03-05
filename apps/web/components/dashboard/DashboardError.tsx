"use client";

import DashboardHeader from "@/components/shared/DashboardHeader";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { startTransition } from "react";

interface DashboardErrorProps {
  reset: () => void;
}

export default function DashboardError({ reset }: DashboardErrorProps) {

  const router = useRouter();
  const pathname = usePathname();

  function handleRefresh() {
    startTransition(() => {
      router.push(pathname);
      reset();
    });
  }

  return (
    <main className="w-full overflow-y-auto p-4 lg:p-8">
      <DashboardHeader title="Error" description="An unexpected error occurred while loading dashboard data."/>
      <Card className="border-destructive/50 shadow-sm gap-8">
        <CardHeader className="gap-1">
          <CardTitle className="text-base font-semibold text-foreground inline-flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive"/>
            Error Loading Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleRefresh}>
            Refresh Dashboard
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
