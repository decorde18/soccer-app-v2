// components/ui/game-form/GameScoring.jsx
export function GameScoring({ data, onChange }) {
  const hasScores =
    data.score_us !== null &&
    data.score_us !== undefined &&
    data.score_them !== null &&
    data.score_them !== undefined;

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>Scoring</h3>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>Our Score</label>
          <input
            type='number'
            min='0'
            value={data.score_us ?? ""}
            onChange={(e) =>
              onChange(
                "score_us",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder='Leave empty if not played'
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Opponent Score
          </label>
          <input
            type='number'
            min='0'
            value={data.score_them ?? ""}
            onChange={(e) =>
              onChange(
                "score_them",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder='Leave empty if not played'
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>
      </div>

      {hasScores && (
        <>
          <div className='flex items-center gap-2 p-3 bg-muted/10 rounded-md'>
            <input
              type='checkbox'
              id='has_overtime'
              checked={data.has_overtime || false}
              onChange={(e) => onChange("has_overtime", e.target.checked)}
              className='w-4 h-4'
            />
            <label
              htmlFor='has_overtime'
              className='text-sm font-medium cursor-pointer'
            >
              Game went to overtime
            </label>
          </div>

          {data.has_overtime && (
            <div className='ml-6 space-y-3'>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='has_shootout'
                  checked={data.has_shootout || false}
                  onChange={(e) => onChange("has_shootout", e.target.checked)}
                  className='w-4 h-4'
                />
                <label
                  htmlFor='has_shootout'
                  className='text-sm cursor-pointer'
                >
                  Decided by shootout/penalty kicks
                </label>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>
                  Maximum OT Periods
                </label>
                <input
                  type='number'
                  min='1'
                  max='5'
                  value={data.max_ot_periods || "2"}
                  onChange={(e) => onChange("max_ot_periods", e.target.value)}
                  className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                />
              </div>
            </div>
          )}
        </>
      )}

      <div>
        <label className='block text-sm font-medium mb-1'>Game Status</label>
        <select
          value={data.status || "scheduled"}
          onChange={(e) => onChange("status", e.target.value)}
          className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
        >
          <option value='scheduled'>Scheduled</option>
          <option value='completed'>Completed</option>
          <option value='postponed'>Postponed</option>
          <option value='cancelled'>Cancelled</option>
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Notes</label>
        <textarea
          value={data.notes || ""}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={3}
          placeholder='Optional notes about this game...'
          className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
        />
      </div>
    </div>
  );
}
