import React from 'react';
import { Users, BarChart2 } from 'lucide-react';

const PopularPlacesList = ({ places }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 h-full">
    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Popular Places</h3>
    
    {places && places.length > 0 ? (
      <div className="space-y-4">
        {places.map((place, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer"
          >
            {/* Place Name and Capacity */}
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white">{place.name}</h4>
              <div className="flex items-center mt-1 text-sm text-slate-500 dark:text-slate-400">
                <Users size={14} className="mr-1.5" />
                <span>Capacity: {place.capacity}</span>
              </div>
            </div>

            {/* Bookings Count */}
            <div className="text-right flex items-center space-x-3">
              <div className="flex flex-col items-center">
                <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{place.bookings}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bookings</p>
              </div>
               <BarChart2 className="text-slate-400 dark:text-slate-500" size={28}/>
            </div>
          </div>
        ))}
      </div>
    ) : (
      // Empty state handler
      <div className="flex flex-col items-center justify-center h-4/5 text-center">
        <p className="text-slate-500 dark:text-slate-400">No popular places data available.</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Check back later for updates.</p>
      </div>
    )}
  </div>
);

export default PopularPlacesList;