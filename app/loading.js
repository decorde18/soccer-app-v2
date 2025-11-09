// app/loading.js
"use client";
export default function Loading() {
  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='text-center space-y-8'>
        {/* Animated Soccer Ball */}
        <div className='relative mx-auto w-24 h-24'>
          <div className='absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full animate-pulse' />
          <div className='absolute inset-2 bg-background rounded-full flex items-center justify-center'>
            <div className='text-4xl animate-bounce'>⚽</div>
          </div>
        </div>

        {/* Loading Text */}
        <div className='space-y-3'>
          <h2 className='text-2xl font-bold text-text'>Loading</h2>
          <div className='flex gap-2 justify-center'>
            <div className='w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]' />
            <div className='w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]' />
            <div className='w-2 h-2 bg-primary rounded-full animate-bounce' />
          </div>
        </div>

        {/* Progress Bar */}
        <div className='w-64 h-1 bg-border rounded-full overflow-hidden mx-auto'>
          <div className='h-full bg-gradient-to-r from-primary to-secondary animate-[progress_1.5s_ease-in-out_infinite]' />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}
