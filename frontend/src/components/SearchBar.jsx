import { useState } from 'react';

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
      <span aria-hidden="true">🔍</span>
      <input
        type="text"
        placeholder="Search cars..."
        aria-label="Search cars"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => { setValue(''); onSearch(''); }}>×</button>
      )}
    </form>
  );
}
