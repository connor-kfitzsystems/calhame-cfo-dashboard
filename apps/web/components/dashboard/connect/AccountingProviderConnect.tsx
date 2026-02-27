"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { capitalizeFirstLetter } from "@/lib/utils";
import { AccountingProvider, CompanyListItem, ErrorDialog } from "@repo/shared";
import { Link2, Link2Off } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccountingProviderConnectProps {
  provider: AccountingProvider;
  companies: CompanyListItem[];
  setErrorDialog: React.Dispatch<React.SetStateAction<ErrorDialog | null>>;
}

export default function AccountingProviderConnect({ provider, companies, setErrorDialog }: AccountingProviderConnectProps) {
  
  const connected = companies.length > 0;
  const providerCapitalized = capitalizeFirstLetter(provider);
  const router = useRouter();

  async function handleDisconnect(companyMembershipId: string, companyName: string) {
    try {
      const res = await fetch(`/api/company-memberships/${companyMembershipId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error(`Failed to disconnect ${companyName}. Status: ${res.status}`);
      
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorDialog({
        title: "Disconnection Failed",
        message: `An error occurred while disconnecting ${companyName}. Please try again later.`
      });
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              {providerCapitalized} Integration
            </CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              Connect your {providerCapitalized} account to automatically sync invoices, expenses, and financial reports.
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className={
              connected
                ? "border-0 bg-accent/10 font-medium text-accent"
                : "border-0 bg-secondary font-medium text-muted-foreground"
            }
          >
            {connected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 items-start">
          <ul className="flex flex-col gap-2 w-full">
            {companies.map((company) => (
              <li key={company.companyName} className="flex items-center justify-between gap-3 rounded-md bg-secondary/50 py-2 px-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{company.companyName}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(company.companyMembershipId, company.companyName)}
                >
                  <Link2Off className="mr-1 h-4 w-4"/>
                  Disconnect
                </Button>
              </li>
            ))}
          </ul>
          <Button>
            <a
              href={`/api/${provider}/auth`}
              className="inline-flex items-center gap-1"
            >
              <Link2 className="mr-1 h-4 w-4" />
              {companies.length > 0 ? "Add more companies" : `Connect to ${providerCapitalized}`}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
