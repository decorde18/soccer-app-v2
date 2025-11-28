"use client";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import PlayerRow from "./PlayerRow";

const statusArray = [
  {
    gameStatus: ["starter", "goalkeeper"],
    label: "Starting XI",
    section: "starters",
    sort: ["gameStatus", "jerseyNumber"],
    minSlots: 11,
    prominent: true,
  },
  {
    gameStatus: ["dressed"],
    label: "Game Changers",
    section: "bench",
    sort: ["jerseyNumber"],
    prominent: true,
  },
  {
    gameStatus: ["not_dressed"],
    label: "Available (Not Dressed)",
    section: "available",
    sort: ["jerseyNumber"],
  },
  {
    gameStatus: ["unavailable", "injured"],
    label: "Unavailable",
    section: "unavailable",
    sort: ["gameStatus", "jerseyNumber"],
  },
];

function PlayerStatusSections() {
  const roster = useGamePlayersStore((s) => s.players);
  const updateGameStatus = useGamePlayersStore((s) => s.updateGameStatus);
  const handleStatus = (playerId, action) => updateGameStatus(playerId, action);

  const starterLength = roster.filter(
    (player) =>
      player.gameStatus === "starter" || player.gameStatus === "goalkeeper"
  ).length;

  return (
    <div className='h-full flex flex-col lg:flex-row gap-4'>
      {/* TOP/LEFT: Starters + Game Changers (PROMINENT) */}
      <div className='flex-1 flex flex-col sm:flex-row gap-4 lg:min-h-0'>
        {statusArray
          .filter((s) => s.prominent)
          .map((statusObj) => {
            const filteredPlayers = roster.filter((player) =>
              statusObj.gameStatus.some((s) => player.gameStatus === s)
            );

            const sortedPlayers = [...filteredPlayers].sort((a, b) => {
              for (const key of statusObj.sort || []) {
                const desc = key.startsWith("-");
                const field = desc ? key.slice(1) : key;

                const valA = a[field];
                const valB = b[field];

                if (valA < valB) return desc ? 1 : -1;
                if (valA > valB) return desc ? -1 : 1;
              }
              return 0;
            });

            const hasGoalkeeper = sortedPlayers.some(
              (p) => p.gameStatus === "goalkeeper"
            );

            // Always show 11 slots for starters
            const slotsToShow = statusObj.minSlots || sortedPlayers.length;
            const emptySlots = Math.max(0, slotsToShow - sortedPlayers.length);

            return (
              <div
                key={statusObj.section}
                className='flex-1 bg-surface rounded-lg shadow border border-border p-4 flex flex-col'
              >
                <div className='flex items-center justify-between mb-3'>
                  <h2 className='text-lg font-bold text-text'>
                    {statusObj.label}
                  </h2>
                  <span className='text-sm text-text-label font-semibold'>
                    {statusObj.section === "starters"
                      ? `${starterLength}/11`
                      : `${filteredPlayers.length}`}
                  </span>
                </div>

                <div className='flex-1 space-y-2 overflow-y-auto'>
                  {sortedPlayers.map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      handleStatus={handleStatus}
                      section={statusObj.section}
                      starterLength={starterLength}
                    />
                  ))}

                  {/* Empty slots for starters */}
                  {statusObj.section === "starters" &&
                    emptySlots > 0 &&
                    Array.from({ length: emptySlots }).map((_, idx) => (
                      <div
                        key={`empty-${idx}`}
                        className='flex items-center p-2.5 rounded border-2 border-dashed border-muted bg-background'
                      >
                        <div className='w-8 h-8 rounded-full bg-muted flex items-center justify-center text-white text-sm font-bold mr-3'>
                          -
                        </div>
                        <div className='text-sm text-muted italic'>
                          Empty slot
                        </div>
                      </div>
                    ))}
                </div>

                {!hasGoalkeeper &&
                  statusObj.section === "starters" &&
                  starterLength > 0 && (
                    <div className='mt-3 p-2 bg-warningbg border border-warningborder rounded text-warningtext text-xs font-medium flex items-center gap-2'>
                      <span>⚠️</span>
                      <span>Select a goalkeeper</span>
                    </div>
                  )}
              </div>
            );
          })}
      </div>

      {/* BOTTOM/RIGHT: Available + Unavailable (SECONDARY) */}
      <div className='w-full sm:flex sm:flex-row sm:gap-4 lg:w-80 lg:flex-col space-y-4 sm:space-y-0 lg:space-y-4'>
        {statusArray
          .filter((s) => !s.prominent)
          .map((statusObj) => {
            const filteredPlayers = roster.filter((player) =>
              statusObj.gameStatus.some((s) => player.gameStatus === s)
            );

            const sortedPlayers = [...filteredPlayers].sort((a, b) => {
              for (const key of statusObj.sort || []) {
                const desc = key.startsWith("-");
                const field = desc ? key.slice(1) : key;

                const valA = a[field];
                const valB = b[field];

                if (valA < valB) return desc ? 1 : -1;
                if (valA > valB) return desc ? -1 : 1;
              }
              return 0;
            });

            return (
              <div
                key={statusObj.section}
                className='bg-surface rounded-lg shadow border border-border p-3 flex flex-col flex-1'
              >
                <div className='flex items-center justify-between mb-2'>
                  <h2 className='text-sm font-bold text-text'>
                    {statusObj.label}
                  </h2>
                  <span className='text-xs text-muted font-medium'>
                    {filteredPlayers.length}
                  </span>
                </div>

                <div className='space-y-1.5 max-h-60 overflow-y-auto'>
                  {sortedPlayers.length === 0 ? (
                    <div className='text-center text-muted text-xs py-4'>
                      No players
                    </div>
                  ) : (
                    sortedPlayers.map((player) => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        handleStatus={handleStatus}
                        section={statusObj.section}
                        starterLength={starterLength}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default PlayerStatusSections;
