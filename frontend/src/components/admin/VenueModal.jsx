import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const VenueModal = ({ isOpen, onClose, onSave, venue }) => {
  // --- No changes to state or logic ---
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (venue) {
      setFormData({ ...venue, facilities: venue.facilities || [] });
    } else {
      // Initialize with default structure
      setFormData({
        name: '',
        capacity: '',
        details: '',
        location: '',
        status: 'available',
        facilities: [],
      });
    }
  }, [venue, isOpen]); // Add isOpen to re-initialize when modal re-opens

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFacilityChange = (index, field, value) => {
    const newFacilities = [...formData.facilities];
    newFacilities[index][field] = value;
    setFormData({ ...formData, facilities: newFacilities });
  };

  const addFacility = () => {
    setFormData({ ...formData, facilities: [...formData.facilities, { name: '', email: '', message: '' }] });
  };

  const removeFacility = (index) => {
    const newFacilities = formData.facilities.filter((_, i) => i !== index);
    setFormData({ ...formData, facilities: newFacilities });
  };
  // --- End of unchanged logic section ---

  if (!isOpen) return null;

  // --- Refactored JSX with modern UI ---
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-12 md:items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {venue ? 'Edit Venue' : 'Add New Venue'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body with Scrolling */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Venue Name</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g., Main Auditorium" className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Capacity</label>
              <input type="number" name="capacity" value={formData.capacity || ''} onChange={handleChange} placeholder="e.g., 200" className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Details</label>
            <textarea name="details" value={formData.details || ''} onChange={handleChange} rows="3" placeholder="e.g., Perfect for conferences and large events" className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Location</label>
              <input type="text" name="location" value={formData.location || ''} onChange={handleChange} placeholder="e.g., 1st Floor, Main Building" className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Status</label>
              <select name="status" value={formData.status || 'available'} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="under maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>
          
          {/* Redesigned Facilities Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-white">Facilities</h3>
            <div className="space-y-3">
              {formData.facilities && formData.facilities.map((facility, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-start space-x-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input type="text" value={facility.name} onChange={(e) => handleFacilityChange(index, 'name', e.target.value)} placeholder="Facility Name" className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 transition" />
                    <input type="email" value={facility.email} onChange={(e) => handleFacilityChange(index, 'email', e.target.value)} placeholder="Contact Email" className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 transition" />
                    <input type="text" value={facility.message} onChange={(e) => handleFacilityChange(index, 'message', e.target.value)} placeholder="Contact Message" className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                  <button onClick={() => removeFacility(index)} className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400 rounded-full transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addFacility} className="w-full flex items-center justify-center space-x-2 p-2.5 mt-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors">
                <Plus size={18} />
                <span>Add Facility</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 flex justify-end space-x-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Cancel</button>
          <button type="button" onClick={() => onSave(formData)} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800">
            {venue ? 'Update Venue' : 'Save Venue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueModal;