'use client';

import { useState, useEffect, useRef } from 'react';
import { searchBoundaries, Boundary } from '@/lib/boundaries';
import { useFilterStore } from '@/store/filterStore';

interface SearchBarProps {
  map: any;
}

export function SearchBar({ map }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Boundary[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setFilters } = useFilterStore();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      const data = await searchBoundaries(query);
      setResults(data || []);
      setIsOpen(true);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (boundary: Boundary) => {
    setQuery(boundary.name);
    setIsOpen(false);
    setFilters({ boundaryId: boundary.id });

    // Fly map to centroid
    if (map) {
      map.flyTo({
        center: [boundary.centroid_lng, boundary.centroid_lat],
        zoom: 11,
        duration: 1500,
      });
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a county, ward, or neighbourhood..."
        className="w-full p-3 rounded-lg border border-[#BECCD9] focus:outline-none focus:ring-2 focus:ring-[#2C6E5C] shadow-sm text-sm bg-white"
      />
      
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin h-5 w-5 border-2 border-[#2C6E5C] border-t-transparent rounded-full" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-[#BECCD9] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result) => (
            <li
              key={result.id}
              onClick={() => handleSelect(result)}
              className="p-3 hover:bg-[#F4F6F9] cursor-pointer border-b last:border-0 flex justify-between items-start gap-2"
            >
              <div>
                <div className="font-medium text-[#1E3A4D] text-sm">{result.name}</div>
                <div className="text-xs text-[#5B6F82]">
                  {result.category_name} {result.parent_name ? `• ${result.parent_name}` : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#BECCD9] rounded-lg shadow-lg p-3">
          <p className="text-sm text-[#5B6F82]">No results found</p>
        </div>
      )}
    </div>
  );
}
