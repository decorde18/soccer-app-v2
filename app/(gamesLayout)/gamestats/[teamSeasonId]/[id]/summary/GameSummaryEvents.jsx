// GameSummaryEvents.jsx (refactored)
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";
import {
  getEventIcon,
  getEventTitle,
  getEventSubtitle,
} from "@/lib/gameSummaryHelpers";

function GameSummaryEvents({ majorEvents }) {
  return (
    <div className='bg-surface rounded-lg shadow-md p-4'>
      <h2 className='text-xl font-heading font-bold text-text mb-3'>
        Major Events
      </h2>
      {majorEvents.length === 0 ? (
        <div className='text-center text-muted py-3 text-sm'>
          No major events recorded
        </div>
      ) : (
        <div className='space-y-2'>
          {majorEvents.map((event) => (
            <div
              key={`${event.stoppage_type}-${event.id}`}
              className='flex items-center gap-3 p-2 border border-border rounded-lg'
            >
              <div className='text-xl'>{getEventIcon(event)}</div>

              <div className='flex-1 min-w-0'>
                <div className='font-semibold text-text text-sm'>
                  {getEventTitle(event)}
                </div>

                <div className='text-xs text-muted'>
                  {formatSecondsToMmss(event.game_time)} • Period {event.period}
                  {getEventSubtitle(event) && ` • ${getEventSubtitle(event)}`}
                </div>
              </div>

              {event.isOurs !== null && (
                <div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      event.isOurs
                        ? "bg-primary text-white"
                        : "bg-accent text-white"
                    }`}
                  >
                    {event.isOurs ? "Us" : "Them"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GameSummaryEvents;
