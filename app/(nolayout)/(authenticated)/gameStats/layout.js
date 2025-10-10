import NavBarGameStats from "@/components/layout/NavBarGameStats";

const { default: Providers } = require("@/contexts/Providers");

function layout({ children }) {
  return (
    <Providers>
      <div className='layout'>
        <div className='main-body'>
          <NavBarGameStats />
          <div className='main-content'>{children}</div>
        </div>
      </div>
    </Providers>
  );
}

export default layout;
