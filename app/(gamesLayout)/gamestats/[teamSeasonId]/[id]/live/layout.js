// components/GridWrapper.js or pages/index.js

import React from "react";
import LiveGameModal from "./LiveGameModal";

const layout = ({ children }) => {
  return (
    <>
      <div className='h-screen grid grid-cols-[66%_1fr] grid-rows-[10%_1.2fr_1fr] gap-4 p-1 overflow-hidden'>
        {children}
      </div>
      <LiveGameModal />
    </>
  );
};

export default layout;
