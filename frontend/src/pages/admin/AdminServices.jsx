import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

export const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Wrench');
  const [category, setCategory] = useState('Appliance');
  const [defaultDurationMins, setDefaultDurationMins] = useState(60);

  const fetchServices = () => {
    setLoading(true);
    adminService.createServiceCategory // Use getAllServices from client or admin
    fetch('/api/services').then(r => r.json()).then(res => setServices(res.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createServiceCategory({
        name,
        description,
        icon,
        category,
        defaultDurationMins: Number(defaultDurationMins),
      });
      setShowModal(false);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900">Service Category CRUD</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-xs shadow-md"
        >
          + Add New Service Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Default Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 font-medium">
                  <td className="p-4 font-bold text-gray-900">{s.name}</td>
                  <td className="p-4">{s.category}</td>
                  <td className="p-4 font-semibold">{s.defaultDurationMins} mins</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${s.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {s.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={async () => {
                        await adminService.deactivateServiceCategory(s.id);
                        fetchServices();
                      }}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Add Service Category</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Service Name</label>
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
              <textarea required rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Group Category</label>
                <input required type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Default Mins</label>
                <input required type="number" value={defaultDurationMins} onChange={(e) => setDefaultDurationMins(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
