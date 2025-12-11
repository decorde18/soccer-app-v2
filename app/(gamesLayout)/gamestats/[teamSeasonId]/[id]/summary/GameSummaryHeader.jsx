import Button from "@/components/ui/Button";

function GameSummaryHeader({ handleBackToGame, handlePrint }) {
  return (
    /* Action Buttons - No Print */

    <div className='print:hidden  border-b border-gray-200 px-6 py-4 sticky top-0 z-10'>
      <div className='max-w-7xl mx-auto flex justify-between items-center'>
        <div className='flex ml-20 justify-between gap-40 basis-full'>
          <Button onClick={handleBackToGame} variant='primary'>
            ← Back to Game Management
          </Button>

          <Button onClick={handlePrint} variant='primary'>
            🖨️ Print Summary
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GameSummaryHeader;
