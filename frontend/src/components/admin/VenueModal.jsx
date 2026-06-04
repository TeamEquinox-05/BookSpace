import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ImagePlus, Upload, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { API_URL } from '../../config/api-config';

// Resolve a venue image path to an authenticated URL
const resolveImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  // Extract filename from /uploads/venue/xxx.jpg → xxx.jpg
  const filename = image.split('/').pop();
  if (!filename) return '';
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}/api/places/image/${filename}`;
};

const VenueModal = ({ isOpen, onClose, onSave, venue }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (venue) {
      setFormData({ ...venue, facilities: venue.facilities || [], image: venue.image || '' });
    } else {
      setFormData({
        name: '',
        capacity: '',
        details: '',
        location: '',
        image: '',
        status: 'available',
        facilities: [],
      });
    }
    setErrors({});
    setUploading(false);
  }, [venue, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Venue name is required';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Venue name must be less than 100 characters';
    }
    
    if (!formData.capacity || isNaN(formData.capacity) || parseInt(formData.capacity) < 1) {
      newErrors.capacity = 'Capacity must be a positive number';
    }
    
    if (!formData.location || formData.location.trim().length === 0) {
      newErrors.location = 'Location is required';
    }
    
    formData.facilities?.forEach((facility, index) => {
      if (facility.name && !facility.email) {
        newErrors[`facility_${index}_email`] = 'Email is required for facility';
      }
      if (facility.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facility.email)) {
        newErrors[`facility_${index}_email`] = 'Invalid email format';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, image: 'File too large. Maximum size is 5 MB.' }));
      return;
    }
    if (!/\.(jpe?g|png|gif|webp)$/i.test(file.name)) {
      setErrors(prev => ({ ...prev, image: 'Only image files (jpg, png, gif, webp) are allowed.' }));
      return;
    }

    setUploading(true);
    setErrors(prev => { const { image: _, ...rest } = prev; return rest; });

    try {
      const fd = new FormData();
      fd.append('image', file);

      const res = await api.post('/places/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData(prev => ({ ...prev, image: res.data.imageUrl }));
    } catch (err) {
      setErrors(prev => ({ ...prev, image: err.response?.data?.msg || 'Upload failed. Please try again.' }));
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  if (!isOpen) return null;

  const previewUrl = resolveImageUrl(formData.image);

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-12 md:items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-[#1a1a1a]">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {venue ? 'Edit Venue' : 'Add New Venue'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body with Scrolling */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Venue Name</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g., Main Auditorium" className={`w-full p-2.5 bg-slate-50 dark:bg-[#1a1a1a] border ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-[#2a2a2a]'} rounded-lg text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition`} />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Capacity</label>
              <input type="number" name="capacity" value={formData.capacity || ''} onChange={handleChange} placeholder="e.g., 200" className={`w-full p-2.5 bg-slate-50 dark:bg-[#1a1a1a] border ${errors.capacity ? 'border-red-500' : 'border-slate-300 dark:border-[#2a2a2a]'} rounded-lg text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition`} />
              {errors.capacity && <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Details</label>
            <textarea name="details" value={formData.details || ''} onChange={handleChange} rows="3" placeholder="e.g., Perfect for conferences and large events" className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-300 dark:border-[#2a2a2a] rounded-lg text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Location</label>
              <input type="text" name="location" value={formData.location || ''} onChange={handleChange} placeholder="e.g., 1st Floor, Main Building" className={`w-full p-2.5 bg-slate-50 dark:bg-[#1a1a1a] border ${errors.location ? 'border-red-500' : 'border-slate-300 dark:border-[#2a2a2a]'} rounded-lg text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition`} />
              {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Status</label>
              <select name="status" value={formData.status || 'available'} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-300 dark:border-[#2a2a2a] rounded-lg text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition">
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="under maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Venue Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative group w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-[#2a2a2a]">
                <img
                  src={previewUrl}
                  alt="Venue preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = ''; e.target.classList.add('hidden'); }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#111111] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-zinc-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Click to upload image</span>
                    <span className="text-xs text-slate-400 dark:text-zinc-600">JPG, PNG, GIF, WEBP up to 5 MB</span>
                  </>
                )}
              </button>
            )}
            {errors.image && <p className="mt-1.5 text-sm text-red-500">{errors.image}</p>}
          </div>

          {/* Facilities Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-white">Facilities</h3>
            <div className="space-y-3">
              {formData.facilities && formData.facilities.map((facility, index) => (
                <div key={index} className="bg-slate-50 dark:bg-[#1a1a1a] p-3 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input type="text" value={facility.name} onChange={(e) => handleFacilityChange(index, 'name', e.target.value)} placeholder="Facility Name" className="w-full p-2 bg-white dark:bg-[#0a0a0a] border border-slate-300 dark:border-[#2a2a2a] rounded-md text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition" />
                      <input type="email" value={facility.email} onChange={(e) => handleFacilityChange(index, 'email', e.target.value)} placeholder="Contact Email" className={`w-full p-2 bg-white dark:bg-[#0a0a0a] border ${errors[`facility_${index}_email`] ? 'border-red-500' : 'border-slate-300 dark:border-[#2a2a2a]'} rounded-md text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition`} />
                      <input type="text" value={facility.message} onChange={(e) => handleFacilityChange(index, 'message', e.target.value)} placeholder="Contact Message" className="w-full p-2 bg-white dark:bg-[#0a0a0a] border border-slate-300 dark:border-[#2a2a2a] rounded-md text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <button onClick={() => removeFacility(index)} className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400 rounded-full transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {errors[`facility_${index}_email`] && <p className="mt-1 text-sm text-red-500 sm:ml-0 sm:col-start-2">{errors[`facility_${index}_email`]}</p>}
                </div>
              ))}
              <button type="button" onClick={addFacility} className="w-full flex items-center justify-center space-x-2 p-2.5 mt-2 border-2 border-dashed border-slate-300 dark:border-[#2a2a2a] rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors">
                <Plus size={18} />
                <span>Add Facility</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 flex justify-end space-x-4 border-t border-slate-200 dark:border-[#1a1a1a] bg-slate-50 dark:bg-[#0a0a0a] rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1a1a1a] border border-slate-300 dark:border-[#2a2a2a] rounded-lg hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={uploading} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {venue ? 'Update Venue' : 'Save Venue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueModal;
