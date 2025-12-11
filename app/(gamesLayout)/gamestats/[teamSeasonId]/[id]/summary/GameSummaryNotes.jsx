import Button from "@/components/ui/Button";

function GameSummaryNotes({ gameNotes, setGameNotes, handleSaveNotes }) {
  return (
    /* 9. Game Notes - No Print */
    <div className='bg-white rounded-lg shadow-md p-6 mb-6 print:hidden'>
      <h2 className='text-2xl font-bold text-gray-900 mb-4'>Coach Notes</h2>
      <textarea
        value={gameNotes}
        onChange={(e) => setGameNotes(e.target.value)}
        className='w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent'
        placeholder='Add notes about the game, player performance, areas to improve...'
      />
      <div className='mt-3'>
        <Button onClick={handleSaveNotes} variant='primary'>
          Save Notes
        </Button>
      </div>
    </div>
  );
}

export default GameSummaryNotes;
