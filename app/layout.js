// src/app/layout.jsx
import "../styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import AppWrapper from "@/components/layout/AppWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TITLE",
  description: "DESCRIPTION",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <link rel='icon' type='image/png' href='/favicon.png' />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} `}>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
