import { Search } from "lucide-react";
import Input from "../ui/Input";

function SearchBar() {
  return (
    <div className='relative w-full max-w-md'>
      <div className='absolute left-4 top-1/2 -translate-y-3/4 text-muted'>
        <Search size={20} />
      </div>
      <Input type='text' placeholder='Search' size='lg' />
    </div>
  );
}

export default SearchBar;
