export type UpdateProfileForm = {
  company: string;
}

export type AccountingProvider = "quickbooks";

export type CompanyListItem = {
  companyMembershipId: string;
  companyName: string;
  providerName: string;
}
