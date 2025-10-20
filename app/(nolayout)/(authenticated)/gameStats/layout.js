import NavBarGameStats from "@/components/layout/NavBarGameStats";
import GameProviders from "@/contexts/GameProviders";

function layout({ children }) {
  return (
    <GameProviders>
      <div className='layout'>
        <div className='main-body'>
          <NavBarGameStats />
          <div className='main-content'>{children}</div>
        </div>
      </div>
    </GameProviders>
  );
}

export default layout;
