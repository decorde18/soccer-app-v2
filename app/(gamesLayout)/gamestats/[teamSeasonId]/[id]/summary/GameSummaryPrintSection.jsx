// Print section for GameSummaryPage.jsx
import { getEventParticipantName } from "@/lib/gameSummaryHelpers";

function GameSummaryPrintSection({
  game,
  result,
  majorEvents,
  topPerformers,
  teamSeasonId,
  playersWithMinutes,
}) {
  return (
    <div className='hidden print:block p-8 max-w-4xl mx-auto font-body'>
      <div className='text-center mb-6'>
        <h1 className='text-3xl font-heading font-bold mb-2'>GAME SUMMARY</h1>
        <p className='text-base mb-1'>
          {game.start_date} • {game.start_time || "TBD"}
        </p>
        <p className='text-sm'>{game.location_name || "TBD"}</p>
        {game.league_names && (
          <p className='text-xs text-muted mt-1'>{game.league_names}</p>
        )}
      </div>

      <div className='text-center mb-6 pb-4 border-b-2 border-text'>
        <h2 className='text-xl font-bold mb-3'>FINAL SCORE</h2>
        <p className='text-lg mb-1'>
          {game.ourName}: <strong className='text-2xl'>{game.goalsFor}</strong>
        </p>
        <p className='text-lg mb-2'>
          {game.opponentName}:{" "}
          <strong className='text-2xl'>{game.goalsAgainst}</strong>
        </p>
        <p className='text-2xl font-bold mt-2'>{result}</p>
      </div>

      {/* Scoring Summary */}
      {majorEvents.filter((e) => e.stoppage_type === "goal").length > 0 && (
        <div className='mb-6'>
          <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
            SCORING SUMMARY
          </h2>
          {majorEvents
            .filter((e) => e.stoppage_type === "goal")
            .map((event, idx) => {
              const teamName = event.isOurs ? game.ourName : game.opponentName;
              const scorerDisplay = getEventParticipantName(event, "primary");
              const assistDisplay = getEventParticipantName(event, "assist");
              const goalTypeLabel = event.is_own_goal ? " (OWN GOAL)" : "";

              return (
                <p key={idx} className='mb-1 text-sm'>
                  {Math.floor(event.game_time / 60)}' - {teamName}
                  {scorerDisplay && ` - ${scorerDisplay}`}
                  {assistDisplay && ` (Assist: ${assistDisplay})`}
                  {goalTypeLabel}
                </p>
              );
            })}
        </div>
      )}

      {/* Discipline Summary */}
      {majorEvents.filter((e) => e.stoppage_type === "discipline").length >
        0 && (
        <div className='mb-6'>
          <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
            DISCIPLINE
          </h2>
          {majorEvents
            .filter((e) => e.stoppage_type === "discipline")
            .map((event, idx) => {
              const teamName = event.isOurs ? game.ourName : game.opponentName;
              const playerDisplay = getEventParticipantName(event, "primary");
              const cardType =
                event.card_type === "yellow" ? "Yellow Card" : "Red Card";

              return (
                <p key={idx} className='mb-1 text-sm'>
                  {Math.floor(event.game_time / 60)}' - {teamName} - {cardType}
                  {playerDisplay && ` - ${playerDisplay}`}
                  {event.card_reason && ` (${event.card_reason})`}
                </p>
              );
            })}
        </div>
      )}

      {/* Penalties Summary */}
      {majorEvents.filter(
        (e) => e.stoppage_type === "penalty" && !e.is_shootout
      ).length > 0 && (
        <div className='mb-6'>
          <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
            PENALTIES
          </h2>
          {majorEvents
            .filter((e) => e.stoppage_type === "penalty" && !e.is_shootout)
            .map((event, idx) => {
              const teamName = event.isOurs ? game.ourName : game.opponentName;
              const shooterDisplay = getEventParticipantName(event, "primary");
              const outcomeLabel = event.outcome.toUpperCase();

              return (
                <p key={idx} className='mb-1 text-sm'>
                  {Math.floor(event.game_time / 60)}' - {teamName} -{" "}
                  {outcomeLabel}
                  {shooterDisplay && ` - ${shooterDisplay}`}
                </p>
              );
            })}
        </div>
      )}

      {/* Top Performers */}
      {topPerformers &&
        (topPerformers.topScorer ||
          topPerformers.topAssist ||
          topPerformers.topGK) && (
          <div className='mb-6'>
            <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
              TOP PERFORMERS
            </h2>
            {topPerformers.topScorer && (
              <p className='mb-1 text-sm'>
                Top Scorer: {topPerformers.topScorer.fullName} -{" "}
                {topPerformers.topScorer.goals} goal(s)
              </p>
            )}
            {topPerformers.topAssist && (
              <p className='mb-1 text-sm'>
                Most Assists: {topPerformers.topAssist.fullName} -{" "}
                {topPerformers.topAssist.assists} assist(s)
              </p>
            )}
            {topPerformers.topGK && (
              <p className='mb-1 text-sm'>
                Goalkeeper: {topPerformers.topGK.fullName} -{" "}
                {topPerformers.topGK.saves} saves,{" "}
                {topPerformers.topGK.goalsAgainst} goals against
              </p>
            )}
          </div>
        )}

      {/* Team Statistics */}
      <div className='mb-6'>
        <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
          TEAM STATISTICS
        </h2>
        <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
          <p>
            Shots:{" "}
            {game.playerActions?.filter(
              (e) => e.event_type === "shot_on_target"
            ).length || 0}
          </p>
          <p>
            Saves:{" "}
            {game.playerActions?.filter((e) => e.event_type === "save")
              .length || 0}
          </p>
          <p>
            Corners:{" "}
            {game.gameEventsTeam?.filter(
              (e) =>
                e.team_season_id == teamSeasonId && e.event_type === "corner"
            ).length || 0}
            {" / "}
            {game.gameEventsTeam?.filter(
              (e) =>
                e.team_season_id != teamSeasonId && e.event_type === "corner"
            ).length || 0}
          </p>
          <p>
            Fouls:{" "}
            {game.gameEventsTeam?.filter(
              (e) =>
                e.team_season_id == teamSeasonId &&
                e.event_type === "foul_committed"
            ).length || 0}
            {" / "}
            {game.gameEventsTeam?.filter(
              (e) =>
                e.team_season_id != teamSeasonId &&
                e.event_type === "foul_committed"
            ).length || 0}
          </p>
          <p>
            Yellow Cards:{" "}
            {
              majorEvents.filter(
                (e) =>
                  e.stoppage_type === "discipline" &&
                  e.isOurs &&
                  e.card_type === "yellow"
              ).length
            }
            {" / "}
            {
              majorEvents.filter(
                (e) =>
                  e.stoppage_type === "discipline" &&
                  !e.isOurs &&
                  e.card_type === "yellow"
              ).length
            }
          </p>
          <p>
            Red Cards:{" "}
            {
              majorEvents.filter(
                (e) =>
                  e.stoppage_type === "discipline" &&
                  e.isOurs &&
                  e.card_type === "red"
              ).length
            }
            {" / "}
            {
              majorEvents.filter(
                (e) =>
                  e.stoppage_type === "discipline" &&
                  !e.isOurs &&
                  e.card_type === "red"
              ).length
            }
          </p>
        </div>
      </div>

      {/* Player Statistics */}
      {playersWithMinutes.length > 0 && (
        <div>
          <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
            PLAYER STATISTICS
          </h2>
          <table className='w-full text-xs border-collapse'>
            <thead>
              <tr className='border-b border-text'>
                <th className='text-left py-1 pr-2'>#</th>
                <th className='text-left py-1 pr-2'>Name</th>
                <th className='text-center py-1 px-1'>Pos</th>
                <th className='text-center py-1 px-1'>Min</th>
                <th className='text-center py-1 px-1'>G</th>
                <th className='text-center py-1 px-1'>A</th>
                <th className='text-center py-1 px-1'>Sh</th>
                <th className='text-center py-1 px-1'>Sv</th>
                <th className='text-center py-1 px-1'>YC</th>
                <th className='text-center py-1 px-1'>RC</th>
              </tr>
            </thead>
            <tbody>
              {playersWithMinutes.map((p, idx) => (
                <tr key={idx} className='border-b border-gray-300'>
                  <td className='py-1 pr-2'>{p.jerseyNumber ?? "–"}</td>
                  <td className='py-1 pr-2'>{p.fullName}</td>
                  <td className='text-center py-1 px-1'>{p.position || "–"}</td>
                  <td className='text-center py-1 px-1'>{p.minutesPlayed}</td>
                  <td className='text-center py-1 px-1'>{p.goals || 0}</td>
                  <td className='text-center py-1 px-1'>{p.assists || 0}</td>
                  <td className='text-center py-1 px-1'>{p.shots || 0}</td>
                  <td className='text-center py-1 px-1'>{p.saves || 0}</td>
                  <td className='text-center py-1 px-1'>
                    {p.yellowCards || 0}
                  </td>
                  <td className='text-center py-1 px-1'>{p.redCards || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GameSummaryPrintSection;
