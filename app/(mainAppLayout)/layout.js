import { Suspense } from "react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import NavBar from "@/components/layout/NavBar";
import HeaderSkeleton from "@/components/layout/HeaderSkeleton";
import NavBarSkeleton from "@/components/layout/NavBarSkeleton";

export default function MainAppLayout({ children }) {
  return (
    <div className='layout'>
      <div className='main-body'>
        <Suspense fallback={<NavBarSkeleton />}>
          <NavBar />
        </Suspense>
        <div className='main-content'>
          <Suspense fallback={<HeaderSkeleton />}>
            <Header />
          </Suspense>
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
