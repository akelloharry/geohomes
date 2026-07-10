'use client';

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
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface ResultCardProps {
  property: Property;
  onSelect: (property: Property) => void;
  hasPass: boolean;
}

export function ResultCard({ property, onSelect, hasPass }: ResultCardProps) {
  const landlordName =
    property.profiles?.first_name && property.profiles?.last_name
      ? `${property.profiles.first_name} ${property.profiles.last_name}`
      : 'Landlord';

  const handleCardClick = () => {
    onSelect(property);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPass) {
      window.location.href = `/properties/${property.id}`;
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="border border-[#BECCD9] rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white hover:border-[#2C6E5C]"
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-[#1E3A4D] text-sm line-clamp-2">{property.title}</h4>
          <p className="text-xs text-[#5B6F82] mt-1">{property.address}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-[#2C6E5C]">KES {property.price.toLocaleString()}</div>
          <div className="text-xs text-[#5B6F82]">/ month</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[#5B6F82] mb-3">
        <div className="flex items-center gap-1">
          <span className="font-medium">{property.bedrooms}</span>
          <span>{property.bedrooms === 1 ? 'bed' : 'beds'}</span>
        </div>
        <span className="text-[#BECCD9]">•</span>
        <div className="flex items-center gap-1">
          <span className="font-medium">{property.bathrooms}</span>
          <span>{property.bathrooms === 1 ? 'bath' : 'baths'}</span>
        </div>
        <span className="text-[#BECCD9]">•</span>
        <span className="capitalize">{property.property_type}</span>
        {property.furnished && (
          <>
            <span className="text-[#BECCD9]">•</span>
            <span>Furnished</span>
          </>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB]">
        <span className="text-xs text-[#5B6F82]">by {landlordName}</span>
        {hasPass ? (
          <button
            onClick={handleDetailsClick}
            className="text-xs text-[#2C6E5C] font-semibold hover:text-[#1f5a4c] transition"
          >
            View Details →
          </button>
        ) : (
          <span className="text-xs text-[#BECCD9]">Buy pass to view details</span>
        )}
      </div>
    </div>
  );
}
