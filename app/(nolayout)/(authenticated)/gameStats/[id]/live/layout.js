// components/GridWrapper.js or pages/index.js

import React from "react";
import OnFieldPlayers from "./OnFieldPlayers";
import LiveGameHeader from "./LiveGameHeader";

const GridWrapper = () => {
  return (
    <div className='min-h-screen h-screen grid grid-cols-[66%_1fr] grid-rows-[10%_35rem_1fr] gap-4 p-4 overflow-hidden'>
      <LiveGameHeader />
      <OnFieldPlayers />

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

      {/* Component 3: Scrolling Content Left Column
        - `row-start-3`: Starts in the third (and final) row.
        - `overflow-y-auto`: Allows vertical scrolling if content exceeds the remaining height.
        - `h-full`: Ensures it takes the full height of its grid cell.
      */}
      <div className='row-start-3 bg-red-500 text-white shadow-lg overflow-y-auto p-4 h-full'>
        <h2 className='text-lg font-bold mb-2'>
          Component 3: Scrolling Area (Remainder Height)
        </h2>
        <p className='mb-4'>Content here will scroll if it&apos;s too long.</p>

        {/* Dummy content to ensure it scrolls */}
        {Array.from({ length: 30 }).map((_, i) => (
          <p key={i}>
            Scroll Item {i + 1}: This content is here to demonstrate the
            scrolling functionality of Component 3.
          </p>
        ))}
      </div>
    </div>
  );
};

export default GridWrapper;
