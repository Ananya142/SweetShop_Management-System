import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import SweetCard from '@/components/SweetCard';
import SweetFilters from '@/components/SweetFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Candy, Sparkles } from 'lucide-react';

interface Sweet {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string | null;
  image_url: string | null;
}

const Index = () => {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const fetchSweets = async () => {
    const { data, error } = await supabase
      .from('sweets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sweets:', error);
    } else {
      setSweets(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchSweets();
    }
  }, [user, authLoading, navigate]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(sweets.map((s) => s.category))];
    return uniqueCategories.sort();
  }, [sweets]);

  const filteredSweets = useMemo(() => {
    return sweets.filter((sweet) => {
      const matchesSearch =
        sweet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sweet.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sweet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesCategory = selectedCategory === 'all' || sweet.category === selectedCategory;

      const matchesMinPrice = !minPrice || sweet.price >= parseFloat(minPrice);
      const matchesMaxPrice = !maxPrice || sweet.price <= parseFloat(maxPrice);

      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });
  }, [sweets, searchTerm, selectedCategory, minPrice, maxPrice]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center warm-gradient">
        <div className="w-16 h-16 rounded-full candy-gradient flex items-center justify-center shadow-glow animate-bounce-soft">
          <Candy className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen warm-gradient">
      <Header />

      <main className="container py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4 animate-slide-up">
          <div className="flex items-center justify-center gap-2 text-candy-gold">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Welcome to our shop</span>
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            Discover Sweet <span className="text-primary">Delights</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse our collection of handcrafted candies and confectioneries. 
            Each piece is made with love and the finest ingredients.
          </p>
        </section>

        {/* Filters */}
        <SweetFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          categories={categories}
          onClear={clearFilters}
        />

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredSweets.length} of {sweets.length} sweets
          </p>
        </div>

        {/* Sweets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredSweets.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
              <Candy className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold">No sweets found</h3>
            <p className="text-muted-foreground">
              {sweets.length === 0
                ? "The shop is empty. Check back later for new treats!"
                : "Try adjusting your filters to find what you're looking for."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSweets.map((sweet, index) => (
              <div key={sweet.id} style={{ animationDelay: `${index * 0.05}s` }}>
                <SweetCard sweet={sweet} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
