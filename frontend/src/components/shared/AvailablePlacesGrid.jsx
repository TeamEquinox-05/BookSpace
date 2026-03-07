import React from 'react';
import { Link } from 'react-router-dom';
// FIX: Added 'Building' to the import list
import { Users, MapPin, Building } from 'lucide-react';
import { API_URL } from '../../config/api-config';

// Resolve a venue image path to a full URL
const resolveImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}${image}`;
};

const AvailablePlacesGrid = ({ places, role }) => {
  if (!places || places.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500 dark:text-slate-400">No available venues found at the moment.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Available Venues</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {places.map(place => (
          <Link 
            to={`/${role === 'admin' ? 'admin/' : ''}places/${place._id}`} 
            key={place._id} 
            className="group bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all border border-slate-200 dark:border-[#1a1a1a]"
          >
            <div className="h-40 bg-slate-200 dark:bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
              {place.image ? (
                <img
                  src={resolveImageUrl(place.image)}
                  alt={place.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className={`items-center justify-center ${place.image ? 'hidden' : 'flex'} w-full h-full`}>
                <Building size={48} className="text-slate-400 dark:text-zinc-500" />
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{place.name}</h3>
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-1">
                <Users size={14} className="mr-2" />
                <span>Capacity: {place.capacity}</span>
              </div>
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <MapPin size={14} className="mr-2" />
                <span className="truncate">{place.location}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AvailablePlacesGrid;