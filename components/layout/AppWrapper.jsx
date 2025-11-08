import Footer from "./Footer";
import Header from "./Header";
import NavBar from "./NavBar";

function AppWrapper({ children }) {
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

export default AppWrapper;
