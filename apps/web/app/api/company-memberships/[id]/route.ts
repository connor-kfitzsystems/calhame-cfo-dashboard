import { deleteCompanyMembershipsById } from "@/lib/queries/company-memberships/delete-company-memberships-by-id";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const { id: companyMembershipId } = await params;

		if (!companyMembershipId) {
			return Response.json(
        { error: { message: "Invalid company membership id" } },
        { status: 400 }
      );
		}

    const deleted = await deleteCompanyMembershipsById(companyMembershipId);

    if (deleted.length === 0) {
			return Response.json(
        { error: { message: "Company membership not found" } },
        { status: 404 }
      );
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		console.error("Error deleting company membership:", error);
		return Response.json(
			{ error: { message: "Failed to delete company membership" } },
			{ status: 500 }
		);
	}
}
