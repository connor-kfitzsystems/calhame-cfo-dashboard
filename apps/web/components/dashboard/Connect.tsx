import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

export default function Connect() {
  return (
    <Card className="border-border shadow-sm gap-8">

      <CardHeader className="gap-1">
        <CardTitle className="text-base font-semibold text-foreground">You have no accounting provider connected</CardTitle>
        <CardDescription className="text-muted-foreground">
          To view dashboard data, connect to a provider.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Button asChild>
          <Link href="/dashboard/connect" className="inline-flex items-center gap-1 px-4!">
            <Link2 className="h-4 w-4"/>
            Connect a provider
          </Link>
        </Button>
      </CardContent>
      
    </Card>
  );
}
