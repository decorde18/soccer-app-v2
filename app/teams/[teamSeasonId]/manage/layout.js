// app/teams/[teamSeasonId]/manage/layout.jsx
import { redirect } from "next/navigation";
import { getCurrentUser, checkServerTeamAccess } from "@/lib/serverAuth";
import { Permissions } from "@/lib/serverPermissions";
import ManageNav from "./ManageNav";

export default async function ManageLayout({ children, params }) {
  const { teamSeasonId } = await params;

  // Require authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?redirect=/teams/${teamSeasonId}/manage`);
  }

  // Check team access
  const access = await checkServerTeamAccess(teamSeasonId, user);

  // Must have edit permissions to access manage routes
  if (!access || !Permissions.canEditTeam(access)) {
    redirect(`/teams/${teamSeasonId}?error=insufficient_permissions`);
  }

  // Pass access to children via context or prop drilling
  return (
    <div>
      <ManageNav teamSeasonId={teamSeasonId} access={access} />
      {children}
    </div>
  );
}
