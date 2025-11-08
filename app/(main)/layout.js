// src/app/layout.jsx

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import NavBar from "@/components/layout/NavBar";

export default function RootLayout({ children }) {
  return (
    <div className='layout'>
      <div className='main-body'>
        <NavBar />
        <div className='main-content'>
          <Header />
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
