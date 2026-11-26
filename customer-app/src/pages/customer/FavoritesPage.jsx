import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, RotateCw, Search } from 'lucide-react';
import { favoriteService } from '../../services/favoriteService';
import { ProviderCard } from '../../components/customer/ProviderCard';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCard,
} from '../../components/ui';

export const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await favoriteService.getFavorites();
      setFavorites(Array.isArray(data) ? data : (data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your saved providers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleFavoriteToggle = (providerId, nextIsFavorite) => {
    if (!nextIsFavorite) {
      setFavorites((prev) => prev.filter((p) => String(p.id) !== String(providerId)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <PageHeader
        title="Saved Favorites"
        subtitle="Quickly book the trusted pros you've bookmarked"
        actions={
          <Button
            variant="secondary"
            onClick={loadFavorites}
            leftIcon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />}
          >
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={loadFavorites} />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-7 h-7" strokeWidth={2} />}
          title="No saved providers yet"
          description="Tap the heart icon on any provider card to bookmark them for instant one-tap rebooking."
          actionLabel="Find Providers Near You"
          actionVariant="accent"
          onAction={() => navigate('/providers')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isFavoriteInitial={true}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
