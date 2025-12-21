import Button from "@/components/ui/Button";

function GameSummaryHeader({
  handleBackToGame,
  handlePrint,
  handleManageGame,
}) {
  return (
    /* Action Buttons - No Print */
    <div className='print:hidden bg-surface border-b border-gray-200 px-4 py-3 sticky top-0 z-10'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4'>
          <Button
            onClick={handleBackToGame}
            variant='primary'
            size='sm'
            className='flex-1 min-w-[140px] max-w-[200px] text-xs sm:text-sm'
          >
            <span className='hidden sm:inline'>← Back to Game Menu</span>
            <span className='sm:hidden'>← Back</span>
          </Button>

          <Button
            onClick={handleManageGame}
            variant='primary'
            size='sm'
            className='flex-1 min-w-[140px] max-w-[200px] text-xs sm:text-sm'
          >
            <span className='hidden sm:inline'>✏️ Game Management</span>
            <span className='sm:hidden'>✏️ Manage</span>
          </Button>

          <Button
            onClick={handlePrint}
            variant='primary'
            size='sm'
            className='flex-1 min-w-[140px] max-w-[200px] text-xs sm:text-sm'
          >
            <span className='hidden sm:inline'>🖨️ Print Summary</span>
            <span className='sm:hidden'>🖨️ Print</span>
          </Button>
        </div>
      </div>

      {/* Print-specific styles to hide this completely */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default GameSummaryHeader;
