export async function getCompanyName(realmId: string, accessToken: string): Promise<string> {
  
  const response = await fetch(
    `${process.env.QUICKBOOKS_BASE_URL}/v3/company/${realmId}/companyinfo/${realmId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch company name:", errorText);
    throw new Error("Failed to fetch company name");
  }

  const data = await response.json();
  return data.CompanyInfo.CompanyName;

}
