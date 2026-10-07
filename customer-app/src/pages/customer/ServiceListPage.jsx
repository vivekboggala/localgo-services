import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { ServiceCard } from '../../components/customer/ServiceCard';
import { Search } from 'lucide-react';

export const ServiceListPage = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    serviceService.getAllServices()
      .then((data) => {
        setServices(data);
        setFilteredServices(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = services;
    if (selectedCategory !== 'ALL') {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredServices(result);
  }, [searchQuery, selectedCategory, services]);

  const categories = ['ALL', ...new Set(services.map((s) => s.category))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">Service Catalog</h1>
        <p className="text-xs text-slate-500 mt-1">Filter by category or search by service requirement</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service category..."
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs bg-white text-slate-900 font-medium shadow-xs"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-slate-200/70 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200/80 shadow-card">
          <p className="text-slate-600 text-xs font-medium">No services found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onClick={() => navigate(`/providers/nearby?serviceId=${service.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
