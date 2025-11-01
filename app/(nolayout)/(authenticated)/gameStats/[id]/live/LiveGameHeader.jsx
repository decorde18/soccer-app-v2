"use client";
import React from "react";
import Button from "@/components/ui/Button";
import LiveGameHeaderClock from "./LiveGameHeaderClock";

import { useGame } from "@/contexts/GameLiveContext";

function LiveGameHeader() {
  const { endPeriod } = useGame();

  return (
    <header
      className='relative col-span-2 row-start-1 flex items-center justify-between px-4 py-3 shadow-lg bg-secondary text-background
      '
    >
      {/* Left Section — Hamburger */}
      <div className='flex-shrink-0 w-10 flex items-center justify-start'></div>

      {/* Center Section — Score + Clock */}
      <div className='absolute left-1/2 transform -translate-x-1/2 flex items-center gap-8'>
        {/* Home Team */}
        <div className='text-center min-w-[80px]'>
          <div className='text-xs font-medium tracking-wider opacity-80 mb-1'>
            HOME
          </div>
          <div className='text-5xl font-bold tabular-nums'>1</div>
        </div>

        {/* Clock */}
        <div className='flex flex-col items-center px-8'>
          <div className='text-4xl font-bold tracking-wider tabular-nums'>
            <LiveGameHeaderClock />
          </div>
          <div className='text-xs font-medium tracking-wider opacity-70 mt-1'>
            PERIOD 1
          </div>
        </div>

        {/* Away Team */}
        <div className='text-center min-w-[80px]'>
          <div className='text-xs font-medium tracking-wider opacity-80 mb-1'>
            AWAY
          </div>
          <div className='text-5xl font-bold tabular-nums'>0</div>
        </div>
      </div>

      {/* Right Section — Fixed Width */}
      <div className='flex-shrink-0 w-[120px] flex justify-end'>
        <Button variant='danger' className='text-sm' onClick={endPeriod}>
          END PERIOD
        </Button>
      </div>
    </header>
  );
}

export default LiveGameHeader;
