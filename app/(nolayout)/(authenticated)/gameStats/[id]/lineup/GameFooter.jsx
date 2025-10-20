function GameFooter({ gameDetails, canStartPeriod, handleStartPeriod }) {
  return (
    <div className='flex gap-4 mt-6'>
      <button
        onClick={() => window.history.back()}
        className='flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all'
      >
        Back
      </button>
      <button
        onClick={handleStartPeriod}
        disabled={!canStartPeriod()}
        className={`flex-1 py-4 rounded-xl font-bold transition-all ${
          canStartPeriod()
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {canStartPeriod()
          ? `Start Period ${gameDetails.periodNumber}`
          : "Select 11 Starters & Goalkeeper"}
      </button>
    </div>
  );
}

export default GameFooter;
