import NavBar from "@/components/layout/NavBar";

import GameProviders from "@/contexts/GameProviders";

function layout({ children }) {
  return (
    <GameProviders>
      <div className='layout'>
        <div className='main-body'>
          <NavBar />
          <div className='main-content'>{children}</div>
        </div>
      </div>
    </GameProviders>
  );
}

export default layout;
