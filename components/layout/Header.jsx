import { format } from "date-fns";
import SearchBar from "../common/SearchBar";

function Header() {
  const formattedDate = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className='bg-white flex justify-center gap-8 px-6 py-4 sticky top-0 z-50'>
      {/* Left Side */}
      <div className='flex items-center gap-4 '></div>
      <SearchBar />
      {/* Right Side */}
      <div className='flex items-center gap-4 '>
        <div className='text-xl text-muted'>{formattedDate}</div>
      </div>
    </header>
  );
}

export default Header;
