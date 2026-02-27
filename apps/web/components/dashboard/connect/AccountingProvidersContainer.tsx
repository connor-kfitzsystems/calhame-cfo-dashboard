"use client";

import AccountingProviderConnect from "./AccountingProviderConnect";
import AlertErrorDialog from "@/components/shared/AlertErrorDialog";

import { CompanyListItem, ErrorDialog } from "@repo/shared";
import { useState } from "react";

interface AccountingProvidersContainerProps {
  companies: CompanyListItem[];
}

export default function AccountingProvidersContainer({ companies }: AccountingProvidersContainerProps) {

  const [errorDialog, setErrorDialog] = useState<ErrorDialog | null>(null);

  function getCompaniesbyProvider(provider: string) {
    return companies.filter((company: CompanyListItem) => company.providerName === provider);
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <li>
          <AccountingProviderConnect provider="quickbooks" companies={getCompaniesbyProvider("quickbooks")} setErrorDialog={setErrorDialog}/>
        </li>
      </ul>
      <AlertErrorDialog
        errorDialog={errorDialog}
        setErrorDialog={setErrorDialog}
      />
    </>
  )
}
