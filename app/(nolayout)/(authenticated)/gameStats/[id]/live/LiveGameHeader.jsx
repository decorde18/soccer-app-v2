import Button from "@/components/ui/Button";
import LiveGameHeaderClock from "./LiveGameHeaderClock";
import { Menu } from "lucide-react";

function LiveGameHeader() {
  return (
    <div className='col-span-2 row-start-1 bg-secondary flex items-center px-3 py-3 text-background shadow-lg'>
      {/* Left Section - Menu Toggle */}
      <div className='flex-shrink-0'>
        <button
          className='p-2 hover:bg-background/10 rounded-md transition-colors mt-[-20px]'
          aria-label='Menu'
        >
          <Menu className='w-6 h-6 text-background' />
        </button>
      </div>

      {/* Center Section - Score */}
      <div className='flex items-center gap-8 flex-1 justify-center'>
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

      {/* Right Section - End Period Button (2x width of left section) */}
      <div className='flex-shrink-0 w-[120x] flex justify-end'>
        <Button variant='danger' className='text-sm'>
          END PERIOD
        </Button>
      </div>
    </div>
  );
}

export default LiveGameHeader;
