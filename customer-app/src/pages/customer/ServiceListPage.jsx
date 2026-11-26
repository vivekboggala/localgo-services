import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { serviceService } from '../../services/serviceService';
import { ServiceCard } from '../../components/customer/ServiceCard';
import {
  Chip,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  SkeletonCard,
} from '../../components/ui';

export const ServiceListPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('category') || '';

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const loadServices = useCallback(() => {
    setLoading(true);
    setError('');
    serviceService.getAllServices()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setServices(list);
        setFilteredServices(list);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Unable to load services from the server.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    let result = services;
    if (selectedCategory !== 'ALL') {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }
    setFilteredServices(result);
  }, [searchQuery, selectedCategory, services]);

  const categories = ['ALL', ...new Set(services.map((s) => s.category).filter(Boolean))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <PageHeader
        title="All Home Services"
        subtitle="Select a service to view verified professionals near you"
      />

      {/* Sticky Search & Category Chips Bar */}
      <div className="sticky top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-3 bg-brand-white/95 backdrop-blur-md border-b border-gray-100 space-y-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search plumber, AC repair, electrician, cleaning..."
          aria-label="Search services"
          leftIcon={<Search className="w-5 h-5" strokeWidth={2} />}
          rightElement={
            searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="w-9 h-9 rounded-pill hover:bg-gray-100 flex items-center justify-center text-gray-600"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            ) : null
          }
        />

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Chip
              key={cat}
              selected={selectedCategory === cat}
              tone="yellow"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </Chip>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadServices} />
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={<Search className="w-7 h-7" strokeWidth={2} />}
          title="No matching services"
          description="Try another keyword or reset the selected category filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
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
