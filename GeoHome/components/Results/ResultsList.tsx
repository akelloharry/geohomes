'use client';

import { ResultCard } from './ResultCard';

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnished: boolean;
  lng: number;
  lat: number;
  verification_status?: string;
  available?: boolean;
  landlord_id?: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface ResultsListProps {
  properties: Property[];
  loading: boolean;
  error: string | null;
  onSelectProperty: (property: Property) => void;
  hasPass: boolean;
}

export function ResultsList({ properties, loading, error, onSelectProperty, hasPass }: ResultsListProps) {
  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gradient-to-r from-[#E5E7EB] to-[#F3F4F6] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="p-4">
        <div className="text-sm text-[#5B6F82] text-center py-8">
          No properties match your filters. Try adjusting your search.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="text-xs font-medium text-[#5B6F82] sticky top-0 bg-white py-2">
        {properties.length} properties found
      </div>
      <div className="space-y-3">
        {properties.map((property) => (
          <ResultCard
            key={property.id}
            property={property}
            onSelect={onSelectProperty}
            hasPass={hasPass}
          />
        ))}
      </div>
    </div>
  );
}
