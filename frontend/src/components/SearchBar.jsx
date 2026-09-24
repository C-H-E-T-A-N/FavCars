import { useState } from 'react';
import { SearchIcon, XIcon } from './icons';

export default function SearchBar({ initialValue = '', onSearch }) {
  const [value, setValue] = useState(initialValue);

  return (
    <form
      className="search-bar"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <SearchIcon className="icon" />
      <input
        type="text"
        placeholder="Search cars..."
        aria-label="Search cars"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => { setValue(''); onSearch(''); }}>
          <XIcon className="icon icon-sm" />
        </button>
      )}
    </form>
  );
}
