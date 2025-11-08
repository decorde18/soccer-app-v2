// app/error.jsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <main className='flex h-screen flex-col items-center justify-center bg-red-50 text-center px-4'>
      <h1 className='text-4xl font-bold text-red-700'>Something went wrong</h1>
      <p className='mt-4 text-lg text-red-600'>{error.message}</p>
      <div className='mt-6 flex gap-4'>
        <button
          onClick={reset}
          className='rounded bg-red-600 px-6 py-2 text-white hover:bg-red-700 transition'
        >
          Try again
        </button>
        <Link
          href='/'
          className='rounded bg-gray-600 px-6 py-2 text-white hover:bg-gray-700 transition'
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
