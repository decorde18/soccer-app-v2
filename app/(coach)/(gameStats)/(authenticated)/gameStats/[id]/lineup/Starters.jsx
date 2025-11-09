function Starters({starters, getPlayerById,toggleGoalkeeper, goalkeeper, toggleStarter}) {
  return (
    <div className='bg-white p-6 rounded-xl shadow-md'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-bold text-gray-900'>Starters</h2>
        <span className='text-sm text-gray-600'>{starters.length}/11</span>
      </div>

      <div className='flex flex-col gap-2 max-h-96 overflow-y-auto'>
        {starters.map((playerId) => {
          const player = getPlayerById(playerId);
          const isGK = goalkeeper === playerId;

          return (
            <div
              key={playerId}
              className='flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-600 rounded-lg'
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    isGK ? "bg-green-500" : "bg-blue-600"
                  }`}
                >
                  {player.number}
                </div>
                <div className='font-medium text-gray-900'>{player.name}</div>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => toggleGoalkeeper(playerId)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    isGK
                      ? "bg-green-500 text-white"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  GK
                </button>
                <button
                  onClick={() => toggleStarter(playerId)}
                  className='px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded-md text-xs hover:bg-gray-50'
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        {starters.length === 0 && (
          <div className='text-center text-gray-400 py-8'>
            No starters selected
          </div>
        )}
      </div>

      {starters.length === 11 && !goalkeeper && (
        <div className='mt-4 p-3 bg-yellow-50 border border-yellow-400 rounded-lg text-yellow-800 text-sm'>
          ⚠️ Please select a goalkeeper
        </div>
      )}
    </div>
  );
}

export default Starters;
