// File: app/teams/[teamSeasonId]/roster/upload/page.jsx

import { getOptionalUser, checkServerTeamAccess } from "@/lib/serverAuth";
import { Permissions } from "@/lib/serverPermissions";
import { redirect } from "next/navigation";
import RosterUploadClient from "./RosterUploadClient";

export default async function RosterUploadPage({ params }) {
  const { teamSeasonId } = await params;

  // Get user and check permissions
  const user = await getOptionalUser();

  // Redirect if not authenticated
  if (!user) {
    redirect(`/auth/login?redirect=/teams/${teamSeasonId}/roster/upload`);
  }

  const access = await checkServerTeamAccess(teamSeasonId, user);

  // Check if user can manage roster
  const canManage = Permissions.canManageRoster(access);

  // Redirect if no permission
  if (!canManage) {
    redirect(`/teams/${teamSeasonId}/roster`);
  }

  return (
    <RosterUploadClient teamSeasonId={teamSeasonId} canManage={canManage} />
  );
}
