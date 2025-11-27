function AvailablePlayers({
  roster,
  getPlayerStatus,
  starters,
  bench,
  toggleBench,
  togglePlayerStatus,
  toggleStarter,
}) {
  return (
    <div className='bg-white p-6 rounded-xl shadow-md lg:col-span-2'>
      <h2 className='text-xl font-bold text-gray-900 mb-4'>
        Available Players
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
        {roster.map((player) => {
          const status = getPlayerStatus(player.id);
          const isSelected =
            starters.includes(player.id) || bench.includes(player.id);

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                status !== "available"
                  ? "bg-gray-100 border-gray-200 opacity-50"
                  : isSelected
                  ? "bg-blue-50 border-blue-600"
                  : "bg-gray-50 border-gray-200 hover:border-blue-600 hover:bg-blue-50"
              }`}
            >
              <div className='flex items-center gap-3'>
                <div className='w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm'>
                  {player.number}
                </div>
                <div>
                  <div className='font-medium text-gray-900'>{player.name}</div>
                  {status !== "available" && (
                    <div
                      className={`text-xs font-semibold ${
                        status === "injured" ? "text-red-600" : "text-gray-500"
                      }`}
                    >
                      {status.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className='flex gap-1'>
                {status === "available" && !isSelected && (
                  <>
                    {starters.length < 11 && (
                      <button
                        onClick={() => toggleStarter(player.id)}
                        className='px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700'
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => toggleBench(player.id)}
                      className='px-2 py-1 bg-gray-600 text-white rounded text-xs font-semibold hover:bg-gray-700'
                    >
                      Bench
                    </button>
                  </>
                )}
                <button
                  onClick={() => togglePlayerStatus(player.id, status)}
                  className='px-2 py-1 bg-white border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50'
                >
                  {status === "available" ? "⚙️" : "✓"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AvailablePlayers;
