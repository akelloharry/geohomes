'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useFilterStore } from '@/store/filterStore';

interface PropertyType {
  id: string;
  name: string;
  display_name: string;
}

export function Filters() {
  const { priceMin, priceMax, bedrooms, propertyTypes, furnished, setFilters, resetFilters } =
    useFilterStore();
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const { data, error } = await supabase
          .from('property_types')
          .select('id, name, display_name')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error) {
          setPropertyTypeOptions(data || []);
        }
      } catch (err) {
        console.error('Error fetching property types:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLookups();
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl border border-[#BECCD9] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[#1E3A4D] text-sm">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-xs text-[#2C6E5C] hover:underline font-medium"
        >
          Reset
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#1F2937] mb-2">
          Price Range (KES)
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setFilters({ priceMin: Math.max(0, Number(e.target.value)) })}
            step={5000}
            min={0}
            max={200000}
            className="w-1/2 px-2 py-2 border border-[#BECCD9] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2C6E5C]"
            placeholder="Min"
          />
          <span className="text-[#5B6F82] text-xs">—</span>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setFilters({ priceMax: Math.min(200000, Number(e.target.value)) })}
            step={5000}
            min={0}
            max={200000}
            className="w-1/2 px-2 py-2 border border-[#BECCD9] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2C6E5C]"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#1F2937] mb-2">Bedrooms</label>
        <select
          value={bedrooms}
          onChange={(e) => setFilters({ bedrooms: e.target.value })}
          className="w-full px-2 py-2 border border-[#BECCD9] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2C6E5C] bg-white"
        >
          <option value="any">Any</option>
          <option value="studio">Studio</option>
          <option value="1">1 Bedroom</option>
          <option value="2">2 Bedrooms</option>
          <option value="3">3 Bedrooms</option>
          <option value="4+">4+ Bedrooms</option>
        </select>
      </div>

      {/* Property Type */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#1F2937] mb-2">Property Type</label>
        {loading ? (
          <div className="text-xs text-[#5B6F82]">Loading...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {propertyTypeOptions.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  const current = propertyTypes;
                  const newTypes = current.includes(type.name)
                    ? current.filter((t) => t !== type.name)
                    : [...current, type.name];
                  setFilters({ propertyTypes: newTypes });
                }}
                className={`px-3 py-1 text-xs rounded-full border transition ${
                  propertyTypes.includes(type.name)
                    ? 'bg-[#2C6E5C] text-white border-[#2C6E5C]'
                    : 'bg-white text-[#1F2937] border-[#BECCD9] hover:border-[#2C6E5C]'
                }`}
              >
                {type.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Furnished */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#1F2937] mb-2">Furnished</label>
        <div className="flex gap-2">
          {['any', 'true', 'false'].map((val) => (
            <button
              key={val}
              onClick={() =>
                setFilters({ furnished: val as 'any' | 'true' | 'false' })
              }
              className={`px-3 py-1 text-xs rounded-full border transition ${
                furnished === val
                  ? 'bg-[#2C6E5C] text-white border-[#2C6E5C]'
                  : 'bg-white text-[#1F2937] border-[#BECCD9] hover:border-[#2C6E5C]'
              }`}
            >
              {val === 'any' ? 'Any' : val === 'true' ? 'Furnished' : 'Unfurnished'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
