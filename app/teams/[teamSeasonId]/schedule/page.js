// app/teams/[teamSeasonId]/schedule/page.jsx (Server Component)
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage({ params }) {
  const { teamSeasonId } = await params;
  return <ScheduleClient teamSeasonId={teamSeasonId} />;
}
