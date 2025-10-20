// components/GridWrapper.js or pages/index.js

import React from "react";

const GridWrapper = ({ children }) => {
  return (
    <div className='min-h-screen h-screen grid grid-cols-[66%_1fr] grid-rows-[10%_35rem_1fr] gap-4 p-4 overflow-hidden'>
      {children}
    </div>
  );
};

export default GridWrapper;
