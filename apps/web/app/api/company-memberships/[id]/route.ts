import { deleteCompanyMembershipsById } from "@/lib/queries/company-memberships/delete-company-memberships-by-id";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {

    const { id: companyMembershipId } = await params;

		if (!companyMembershipId) {
			return Response.json({ error: "Invalid company membership id" }, { status: 400 });
		}

    const deleted = await deleteCompanyMembershipsById(companyMembershipId);

    if (deleted.length === 0) {
			return Response.json({ error: "Company membership not found" }, { status: 404 });
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		console.error("Error deleting company membership:", error);
		return Response.json(
			{ error: "Failed to delete company membership" },
			{ status: 500 }
		);
	}
}
