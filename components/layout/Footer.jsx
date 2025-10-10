// src/components/layout/Footer.jsx
import React from "react";

const Footer = () => {
  return (
    <footer className='bg-secondary text-white p-[var(--padding-medium)] text-center text-sm shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-20'>
      <p>
        &copy; {new Date().getFullYear()}{" "}
        <span lang='en'>David Cordero de Jesus</span>
      </p>
      <span lang='en'>All rights reserved</span>
    </footer>
  );
};

export default Footer;
