import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface NoDataAvailableProps {
  companyId: string;
  year: number;
  quarter: string;
  availableYears: number[];
  message?: string;
}

export default function NoDataAvailable({ companyId, year, quarter, availableYears, message }: NoDataAvailableProps) {
  const defaultMessage = `No data available for ${quarter === "year" ? "full year" : quarter.toUpperCase()} ${year}`;
  
  return (
    <Card className="border-border shadow-sm gap-8">
      <CardHeader className="gap-1">
        <CardTitle className="text-base font-semibold text-foreground inline-flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500"/>
          {message || defaultMessage}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {availableYears.length > 0 
            ? `Data is available for years: ${availableYears.join(", ")}`
            : "No financial data available for this company yet."
          }
        </CardDescription>
      </CardHeader>

      {availableYears.length > 0
        ? <CardContent className="flex flex-wrap gap-2">
            {availableYears.map((availableYear) => (
              <Button key={availableYear} asChild variant="outline">
                <Link href={`/dashboard/${companyId}?year=${availableYear}`}>
                  View {availableYear} Data
                </Link>
              </Button>
            ))}
          </CardContent>
        : null
      }
    </Card>
  );
}
