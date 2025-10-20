function Bench({ bench, getPlayerById, toggleBench }) {
  return (
    <div className='bg-white p-6 rounded-xl shadow-md'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-bold text-gray-900'>Bench</h2>
        <span className='text-sm text-gray-600'>{bench.length} players</span>
      </div>

      <div className='flex flex-col gap-2 max-h-96 overflow-y-auto'>
        {bench.map((playerId) => {
          const player = getPlayerById(playerId);

          return (
            <div
              key={playerId}
              className='flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-300 rounded-lg'
            >
              <div className='flex items-center gap-3'>
                <div className='w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm'>
                  {player.number}
                </div>
                <div className='font-medium text-gray-900'>{player.name}</div>
              </div>
              <button
                onClick={() => toggleBench(playerId)}
                className='px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded-md text-xs hover:bg-gray-50'
              >
                Remove
              </button>
            </div>
          );
        })}
        {bench.length === 0 && (
          <div className='text-center text-gray-400 py-8'>
            No bench players selected
          </div>
        )}
      </div>
    </div>
  );
}

export default Bench;
