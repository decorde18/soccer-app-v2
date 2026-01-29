// app/teams/[teamSeasonId]/TeamOverviewClient.jsx
"use client";

import TeamOverview from "@/components/ui/DashBoard/TeamOverview";
import { useContext } from "react";
import { TeamContext } from "./TeamLayoutClient";

export default function TeamOverviewClient({ dashboardData }) {
  // ✅ Get team info from layout context (already fetched once)
  const { teamInfo, access, user } = useContext(TeamContext);

  if (!teamInfo) {
    return <div>No Team Selected</div>;
  }

  return (
    <div className='h-full bg-background'>
      <div className='h-full'>
        <TeamOverview
          team={teamInfo}
          data={dashboardData}
          showHeader={false}
          user={user}
          access={access}
        />
      </div>
    </div>
  );
}
