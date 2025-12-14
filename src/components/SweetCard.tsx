import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Candy } from 'lucide-react';

interface Sweet {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string | null;
  image_url: string | null;
}

interface SweetCardProps {
  sweet: Sweet;
  onPurchase?: () => void;
}

const SweetCard = ({ sweet }: SweetCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();

  const isOutOfStock = sweet.quantity === 0;

  const handleAddToCart = async () => {
    if (!user) return;
    setIsLoading(true);
    await addToCart(sweet.id, 1);
    setIsLoading(false);
  };

  return (
    <Card className="group overflow-hidden border-0 shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in">
      <div className="aspect-square relative overflow-hidden bg-secondary">
        {sweet.image_url ? (
          <img
            src={sweet.image_url}
            alt={sweet.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Candy className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}
        <Badge 
          className="absolute top-3 right-3" 
          variant={isOutOfStock ? 'destructive' : 'secondary'}
        >
          {isOutOfStock ? 'Out of Stock' : `${sweet.quantity} left`}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold line-clamp-1">{sweet.name}</h3>
          <Badge variant="outline" className="shrink-0 text-xs">
            {sweet.category}
          </Badge>
        </div>
        
        {sweet.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{sweet.description}</p>
        )}

        <p className="text-2xl font-bold text-primary">
          ${Number(sweet.price).toFixed(2)}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          variant="candy"
          className="w-full"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isLoading || !user}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isLoading ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SweetCard;
