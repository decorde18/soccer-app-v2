// GameSummaryTitle.jsx
import { formatMySqlDate, formatMySqlTime } from "@/lib/dateTimeUtils";

function GameSummaryTitle({ game, score, result, ourTeamName, theirTeamName }) {
  const resultColor =
    result === "WIN"
      ? "text-[hsl(var(--color-success))]"
      : result === "LOSS"
      ? "text-[hsl(var(--color-danger))]"
      : "text-yellow-600";

  const resultBg =
    result === "WIN"
      ? "bg-[hsl(var(--color-success))]/10"
      : result === "LOSS"
      ? "bg-[hsl(var(--color-danger))]/10"
      : "bg-yellow-100";

  return (
    <div className='bg-[hsl(var(--color-surface))] rounded-lg shadow-md p-4'>
      <div className='text-center mb-3'>
        <h1 className='text-2xl font-heading font-bold text-[hsl(var(--color-text))] mb-1'>
          Game Summary
        </h1>
        <div className='text-sm text-[hsl(var(--color-muted))]'>
          {formatMySqlDate(game.start_date)} •{" "}
          {game.start_time && formatMySqlTime(game.start_time)} •{" "}
          {game.location_name || "TBD"}
        </div>
        {game.league_names && (
          <div className='text-xs text-[hsl(var(--color-muted))] mt-1'>
            {game.league_names}
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className='flex justify-center items-center gap-6 mb-3'>
        <div className='text-center'>
          <div className='text-base font-semibold text-[hsl(var(--color-text-label))] mb-1'>
            {ourTeamName}
          </div>
          <div className='text-5xl font-bold text-[hsl(var(--color-primary))]'>
            {score.ours}
          </div>
          <div className='text-xs text-[hsl(var(--color-muted))] mt-1'>Us</div>
        </div>

        <div className='text-3xl font-light text-[hsl(var(--color-muted))]'>
          -
        </div>

        <div className='text-center'>
          <div className='text-base font-semibold text-[hsl(var(--color-text-label))] mb-1'>
            {theirTeamName}
          </div>
          <div className='text-5xl font-bold text-[hsl(var(--color-accent))]'>
            {score.theirs}
          </div>
          <div className='text-xs text-[hsl(var(--color-muted))] mt-1'>
            Them
          </div>
        </div>
      </div>

      {/* Result Badge */}
      <div className='text-center'>
        <span
          className={`inline-block px-4 py-1 rounded-full text-xl font-bold ${resultColor} ${resultBg}`}
        >
          {result}
        </span>
      </div>
    </div>
  );
}

export default GameSummaryTitle;
