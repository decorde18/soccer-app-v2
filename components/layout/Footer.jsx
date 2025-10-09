// src/components/layout/Footer.jsx
import React from "react";

const Footer = () => {
  return (
    <footer className=' text-white p-3 text-center text-sm shadow-inner z-20'>
      <p>
        &copy; {new Date().getFullYear()}{" "}
        <span lang='en'>David Cordero de Jesus </span>
      </p>
      <span lang='en'>All rights reserved</span>
    </footer>
  );
};

export default Footer;
