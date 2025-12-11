// GameSummaryEvents.jsx
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";

function GameSummaryEvents({
  majorEvents,
  players,
  ourTeamName,
  theirTeamName,
}) {
  return (
    <div className='bg-[hsl(var(--color-surface))] rounded-lg shadow-md p-4'>
      <h2 className='text-xl font-heading font-bold text-[hsl(var(--color-text))] mb-3'>
        Major Events
      </h2>
      {majorEvents.length === 0 ? (
        <div className='text-center text-[hsl(var(--color-muted))] py-3 text-sm'>
          No major events recorded
        </div>
      ) : (
        <div className='space-y-2'>
          {majorEvents.map((event) => {
            const player = players.find(
              (p) => p.playerGameId === event.player_game_id
            );
            const eventIcon = {
              goal: "⚽",
              card: event.event_type === "yellow_card" ? "🟨" : "🟥",
              penalty: "🎯",
              injury: "🚑",
            }[event.event_category];

            return (
              <div
                key={event.id}
                className='flex items-center gap-3 p-2 border border-[hsl(var(--color-border))] rounded-lg'
              >
                <div className='text-xl'>{eventIcon}</div>
                <div className='flex-1 min-w-0'>
                  <div className='font-semibold text-[hsl(var(--color-text))] text-sm'>
                    {event.event_type.replace("_", " ").toUpperCase()}
                    {player &&
                      ` - ${player.fullName} (#${player.jerseyNumber})`}
                    {!player &&
                      event.opponent_jersey_number &&
                      ` - Opponent #${event.opponent_jersey_number}`}
                  </div>
                  <div className='text-xs text-[hsl(var(--color-muted))]'>
                    {formatSecondsToMmss(event.game_time)} • Period{" "}
                    {event.period}
                    {event.details && ` • ${event.details}`}
                  </div>
                </div>
                <div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      event.isOurs
                        ? "bg-[hsl(var(--color-primary))] text-white"
                        : "bg-[hsl(var(--color-accent))] text-white"
                    }`}
                  >
                    {event.isOurs ? "Us" : "Them"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GameSummaryEvents;
