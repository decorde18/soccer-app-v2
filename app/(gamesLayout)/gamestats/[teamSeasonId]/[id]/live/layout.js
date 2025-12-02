// components/GridWrapper.js or pages/index.js

import React from "react";
import LiveGameModal from "./LiveGameModal";

const layout = ({ children }) => {
  return (
    <>
      <div>{children}</div>
      <LiveGameModal />
    </>
  );
};

export default layout;
