function GameHeader({ gameDetails }) {
  return (
    <div className='bg-white p-6 rounded-xl mb-6 shadow-md'>
      <h1 className='text-3xl font-bold text-gray-900 mb-2'>
        Period {gameDetails.periodNumber} Lineup
      </h1>
      <div className='text-gray-600 text-sm'>
        {gameDetails.periodNumber === 1
          ? "Set the starting lineup for the first period"
          : `Lineup defaults to players on field at end of Period ${
              gameDetails.periodNumber - 1
            }. Make any changes needed.`}
      </div>
    </div>
  );
}

export default GameHeader;
