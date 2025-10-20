import LiveGameHeader from "./LiveGameHeader";
import LiveGameModal from "./LiveGameModal";
import OnBenchPlayers from "./OnBenchPlayers";
import OnFieldPlayers from "./OnFieldPlayers";

function page() {
  return (
    <>
      <LiveGameHeader />
      <OnFieldPlayers />
      <OnBenchPlayers />
      {/* Component 4: Top Right Column (Non-scrolling, 1/2 height of remaining space)
        - `row-start-2`: Starts in the second row.
        - `row-span-2`: Spans the remaining two rows (Rows 2 and 3).
        - `grid`: Uses a nested grid for Components 4 and 5.
        - `grid-rows-2`: Splits the spanned area into two equal rows.
        - The inner divs are placed inside this container.
      */}
      <div className='row-start-2 row-span-2 grid grid-rows-2 gap-4 h-full'>
        <div className='bg-yellow-500 flex items-center justify-center text-white text-xl shadow-lg overflow-hidden'>
          Component 4: Right Column Top (1/2 Height, No Scroll)
        </div>

        {/* Component 5 is the second row of the nested grid */}
        <div className='bg-yellow-700 flex items-center justify-center text-white text-xl shadow-lg overflow-hidden'>
          Component 5: Right Column Bottom (1/2 Height, No Scroll)
        </div>
      </div>
      <LiveGameModal />
    </>
  );
}

export default page;
