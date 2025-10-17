function LiveGameHeader() {
  return (
    <div className='col-span-2 row-start-1 bg-secondary flex items-center justify-center gap-32 px py-2 text-background shadow-lg'>
      {/* Home Team */}
      <div className='text-center'>
        <div className='text-sm font-semibold tracking-wide'>HOME</div>
        <div className='text-2xl font-bold'>1</div>
      </div>

      {/* Clock */}
      <div className='text-4xl font-bold tracking-widest mx-4'>00:30</div>

      {/* Away Team */}
      <div className='text-center'>
        <div className='text-sm font-semibold tracking-wide'>AWAY</div>
        <div className='text-2xl font-bold'>0</div>
      </div>
    </div>
  );
}

export default LiveGameHeader;
