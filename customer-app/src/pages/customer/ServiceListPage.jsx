import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { serviceService } from '../../services/serviceService';
import { ServiceCard } from '../../components/customer/ServiceCard';
import {
  Button,
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
    const qParam = searchParams.get('q') || searchParams.get('category') || '';
    if (qParam) setSearchQuery(qParam);
  }, [searchParams]);

  const categoryCounts = useMemo(() => {
    const counts = { ALL: services.length };
    services.forEach((s) => {
      if (s.category) {
        counts[s.category] = (counts[s.category] || 0) + 1;
      }
    });
    return counts;
  }, [services]);

  const categories = useMemo(
    () => ['ALL', ...new Set(services.map((s) => s.category).filter(Boolean))],
    [services]
  );

  const filteredServices = useMemo(() => {
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
    return result;
  }, [searchQuery, selectedCategory, services]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <PageHeader
        title="All Home Services"
        subtitle="Select a service category to browse verified professionals near you"
      />

      {/* Mobile / Tablet Top Sticky Filters */}
      <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-3 bg-brand-white/95 backdrop-blur-md border-b border-gray-100 space-y-3">
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
                className="w-9 h-9 rounded-pill hover:bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer"
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
              count={categoryCounts[cat] ?? 0}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </Chip>
          ))}
        </div>
      </div>

      {/* Desktop Two-Column Website Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 bg-brand-white border border-gray-200 rounded-card p-5 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-display font-bold text-ds-16 text-brand-ink inline-flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2.2} /> Filter Services
            </h2>
            {(searchQuery || selectedCategory !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="text-ds-12 font-bold text-gray-600 hover:text-brand-ink inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

          <Input
            label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keyword..."
            leftIcon={<Search className="w-4 h-4" strokeWidth={2} />}
            rightElement={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="w-8 h-8 rounded-pill hover:bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null
            }
          />

          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 px-1 mb-2">
              Categories
            </span>
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full px-3.5 py-2.5 rounded-card text-ds-14 font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    active
                      ? 'bg-brand-ink text-brand-white shadow-card'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate">{cat === 'ALL' ? 'All Categories' : cat}</span>
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[11px] font-bold ${
                      active ? 'bg-brand-yellow text-brand-ink' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {categoryCounts[cat] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Service Grid (3-4 cols on desktop) */}
        <div className="lg:col-span-9 space-y-4">
          <div className="hidden lg:flex items-center justify-between text-ds-14 text-gray-600">
            <span>
              Showing <strong className="text-brand-ink">{filteredServices.length}</strong> services
              {selectedCategory !== 'ALL' ? ` in ${selectedCategory}` : ''}
            </span>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                Clear &ldquo;{searchQuery}&rdquo;
              </Button>
            )}
          </div>

          {error ? (
            <ErrorState message={error} onRetry={loadServices} />
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
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
      </div>
    </div>
  );
};
