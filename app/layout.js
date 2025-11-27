// src/app/layout.jsx
import "../styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Suspense } from "react";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import NavBar from "@/components/layout/NavBar";
import HeaderSkeleton from "@/components/layout/HeaderSkeleton";
import NavBarSkeleton from "@/components/layout/NavBarSkeleton";
import DataProvider from "@/components/DataProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Soccer Stats App",
  description: "Cordero Soccer Stats Everything App",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <link rel='icon' type='image/png' href='/favicon.png' />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
