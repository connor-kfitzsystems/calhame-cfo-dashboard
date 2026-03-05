import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface CompanyCardProps {
  companyId: string;
  companyName: string;
}

export default function CompanyCard({ companyId, companyName }: CompanyCardProps) {
  return (
    <Link href={`/dashboard/${companyId}`}>
      <Card className="border-border shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary"/>
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-foreground">{companyName}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                View dashboard
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
