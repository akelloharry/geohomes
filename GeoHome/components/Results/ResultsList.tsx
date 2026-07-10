'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useFilterStore } from '@/store/filterStore';
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
  verification_status: string;
  available: boolean;
  landlord_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface ResultsListProps {
  onSelectProperty: (property: Property) => void;
  hasPass: boolean;
}

export function ResultsList({ onSelectProperty, hasPass }: ResultsListProps) {
  const filters = useFilterStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('properties')
          .select(
            `
            id,
            title,
            address,
            price,
            bedrooms,
            bathrooms,
            property_type,
            furnished,
            lng,
            lat,
            verification_status,
            available,
            landlord_id,
            profiles:landlord_id(first_name, last_name)
          `
          )
          .eq('verification_status', 'verified')
          .eq('available', true);

        // Apply price range
        if (filters.priceMin > 0) {
          query = query.gte('price', filters.priceMin);
        }
        if (filters.priceMax < 200000) {
          query = query.lte('price', filters.priceMax);
        }

        // Apply bedrooms
        if (filters.bedrooms !== 'any') {
          if (filters.bedrooms === 'studio') {
            query = query.eq('property_type', 'studio');
          } else if (filters.bedrooms === '4+') {
            query = query.gte('bedrooms', 4);
          } else {
            query = query.eq('bedrooms', parseInt(filters.bedrooms, 10));
          }
        }

        // Apply property types
        if (filters.propertyTypes.length > 0) {
          query = query.in('property_type', filters.propertyTypes);
        }

        // Apply furnished filter
        if (filters.furnished !== 'any') {
          query = query.eq('furnished', filters.furnished === 'true');
        }

        const { data, error: fetchError } = await query.order('price', { ascending: true });

        if (fetchError) {
          console.error('Error fetching properties:', fetchError);
          setError('Failed to fetch properties');
        } else {
          // If a boundary is selected, we could filter by geometry here
          // For now, we'll just use the results from Supabase
          // In production, you'd want to implement spatial filtering
          setProperties(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [
    filters.priceMin,
    filters.priceMax,
    filters.bedrooms,
    filters.propertyTypes,
    filters.furnished,
    filters.boundaryId,
  ]);

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
