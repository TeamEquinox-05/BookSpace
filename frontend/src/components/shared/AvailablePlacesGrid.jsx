import React from 'react';
import { Link } from 'react-router-dom';
// FIX: Added 'Building' to the import list
import { Users, MapPin, Building } from 'lucide-react';

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
            className="group bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700"
          >
            <div className="h-40 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              {/* Replace with <img /> when available */}
              <Building size={48} className="text-slate-400 dark:text-slate-500" />
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