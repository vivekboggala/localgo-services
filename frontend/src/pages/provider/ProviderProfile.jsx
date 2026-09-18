import React, { useState, useEffect } from 'react';
import { providerPortalService } from '../../services/providerPortalService';

import ChangePasswordCard from '../../components/auth/ChangePasswordCard';

export const ProviderProfile = () => {
  const [description, setDescription] = useState('Professional AC and appliance service technician.');
  const [experienceYears, setExperienceYears] = useState(5);
  const [serviceArea, setServiceArea] = useState('Madanapalle Town');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(10);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await providerPortalService.updateProfile({
        description,
        experienceYears: Number(experienceYears),
        serviceArea,
        serviceRadiusKm: Number(serviceRadiusKm),
      });
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-3xl font-black text-gray-900">Provider Settings</h1>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Business Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Experience (Years)</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Coverage Radius (km)</label>
            <input
              type="number"
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md"
        >
          {saving ? 'Saving...' : 'Save Profile Settings'}
        </button>
      </form>

      <ChangePasswordCard />
    </div>
  );
};
