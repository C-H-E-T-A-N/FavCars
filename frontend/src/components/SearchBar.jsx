import { useState } from 'react';

export default function SearchBar({ initialValue = '', onSearch }) {
  const [value, setValue] = useState(initialValue);

  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <span>🔍</span>
      <input
        type="text"
        placeholder="Search cars..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button type="button" onClick={() => { setValue(''); onSearch(''); }}>×</button>
      )}
    </form>
  );
}
