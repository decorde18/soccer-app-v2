// src/app/page.jsx
"use client";
import React from "react";

const LandingPage = () => {
  // Use a map to generate lots of content to ensure the page scrolls
  const contentItems = Array(20)
    .fill(0)
    .map((_, i) => (
      <div
        key={i}
        className='p-6 bg-surface shadow-lg rounded-lg mb-6 border border-border'
      >
        <h2 className='text-xl font-semibold text-primary mb-2'>
          Section {i + 1} - Dashboard View
        </h2>
        <p className='text-text-label'>
          This content area is designed to be **vertically scrollable** when it
          exceeds the viewport height. The Header and Footer remain fixed.
        </p>
      </div>
    ));

  return (
    <div className='space-y-8'>
      <h1 className='text-title font-bold text-text mb-10'>
        Welcome to the Modern App Dashboard
      </h1>
      <p className='text-lg text-muted'>
        Your new customizable boilerplate structure is now active. Try resizing
        the browser to see the sidebar collapse, and change the `mockUser` role
        in `Sidebar.jsx` to see the links change!
      </p>
      {contentItems}
      <div className='h-10'></div> {/* Extra space at the bottom */}
    </div>
  );
};

export default LandingPage;
