import PlayerRow from "./PlayerRow";

const statusArray = [
  {
    gameStatus: ["available"],
    label: "Available Players",
    section: "available",
    span: "wide",
    sort: ["number"],
  },
  {
    gameStatus: ["starter", "goalkeeper"],
    label: "Starters",
    section: "starters",
    sort: ["gameStatus", "number"],
  },
  {
    gameStatus: ["bench"],
    label: "Game Changers",
    section: "bench",
    sort: ["number"],
  },
  {
    gameStatus: ["unavailable", "injured"],
    label: "Unavailable Players",
    section: "unavailable",
    span: "wide",
    sort: ["gameStatus", "number"],
  },
];

function PlayerStatusSections({ roster, handleStatus }) {
  return (
    <>
      {statusArray.map((statusObj) => {
        const filteredPlayers = roster.filter((player) =>
          statusObj.gameStatus.some((s) => player.gameStatus === s)
        );
        // Sort players based on statusObj.sort
        const sortedPlayers = [...filteredPlayers].sort((a, b) => {
          for (const key of statusObj.sort || []) {
            const desc = key.startsWith("-");
            const field = desc ? key.slice(1) : key;

            const valA = a[field];
            const valB = b[field];

            if (valA < valB) return desc ? 1 : -1;
            if (valA > valB) return desc ? -1 : 1;
            // if equal, continue to next sort key
          }
          return 0;
        });

        const starterLength = roster.filter(
          (player) => player.gameStatus === "starter"
        ).length;
        return (
          <div
            key={statusObj.section}
            className={`bg-white p-6 rounded-xl shadow-md flex flex-col ${
              statusObj.span === "wide" ? "lg:col-span-2" : ""
            }`}
            style={{ minHeight: "126px" }}
          >
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold'>{statusObj.label}</h2>
              <span className='text-sm text-muted'>
                {statusObj.section === "starters"
                  ? `${starterLength}/11`
                  : `${filteredPlayers.length} player${
                      filteredPlayers.length !== 1 ? "s" : ""
                    }`}
              </span>
            </div>
            <div
              className={`flex-1 overflow-y-auto ${
                statusObj.span === "wide"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
                  : "flex flex-col gap-2"
              }`}
            >
              {filteredPlayers.length === 0 &&
              statusObj.section === "starters" ? (
                <div className='text-center text-muted py-8'>
                  No starters selected
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
            {!filteredPlayers.find(
              (player) => player.gameStatus === "goalkeeper"
            ) &&
              statusObj.section === "starters" && (
                <div className='mt-4 p-3 bg-warningbg border border-warningborder rounded-lg text-warningtext text-sm'>
                  ⚠️ Please select a goalkeeper
                </div>
              )}
          </div>
        );
      })}
    </>
  );
}

export default PlayerStatusSections;
