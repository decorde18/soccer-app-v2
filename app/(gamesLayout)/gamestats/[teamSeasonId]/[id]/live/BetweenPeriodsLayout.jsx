"use client";

import PendingSubs from "./gameMain/PendingSubs";
import LiveGameHeader from "./gameHeader/LiveGameHeader";

/**
 * Layout for the between periods page
 * Shows pending subs without individual "Enter" buttons
 * Only "Enter All" button at the top to confirm all subs before starting next period
 */
function BetweenPeriodsLayout() {
  return (
    <div className='h-screen grid grid-cols-1 grid-rows-[10%_1fr] gap-4 p-4 overflow-hidden'>
      <LiveGameHeader />

      <div className='flex items-center justify-center'>
        <div className='w-full max-w-2xl'>
          <div className='bg-surface rounded-lg border-2 border-primary p-6 shadow-lg'>
            <h2 className='text-2xl font-bold text-text mb-2 text-center'>
              Period Break
            </h2>
            <p className='text-muted text-center mb-6'>
              Review and confirm substitutions before starting the next period
            </p>

            <PendingSubs hideIndividualEnter={true} />

            <div className='mt-6 p-4 bg-background rounded border border-border'>
              <p className='text-sm text-muted text-center'>
                Click "START" in the header when ready to begin the next period
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BetweenPeriodsLayout;
