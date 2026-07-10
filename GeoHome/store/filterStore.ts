import { create } from 'zustand';

export interface FilterState {
  priceMin: number;
  priceMax: number;
  bedrooms: string; // 'any', 'studio', '1', '2', '3', '4+'
  propertyTypes: string[]; // array of type names
  furnished: 'any' | 'true' | 'false';
  amenities: string[]; // array of amenity names
  boundaryId: string | null;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  priceMin: 0,
  priceMax: 200000,
  bedrooms: 'any',
  propertyTypes: [],
  furnished: 'any',
  amenities: [],
  boundaryId: null,
  setFilters: (filters) =>
    set((state) => ({ ...state, ...filters })),
  resetFilters: () =>
    set({
      priceMin: 0,
      priceMax: 200000,
      bedrooms: 'any',
      propertyTypes: [],
      furnished: 'any',
      amenities: [],
      boundaryId: null,
    }),
}));
