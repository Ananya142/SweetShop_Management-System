import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Minus, Plus, Candy } from 'lucide-react';

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
  onPurchase: () => void;
}

const SweetCard = ({ sweet, onPurchase }: SweetCardProps) => {
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const isOutOfStock = sweet.quantity === 0;
  const maxQuantity = Math.min(sweet.quantity, 10);

  const handlePurchase = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Please sign in',
        description: 'You need to sign in to make a purchase.',
      });
      return;
    }

    if (purchaseQuantity > sweet.quantity) {
      toast({
        variant: 'destructive',
        title: 'Not enough stock',
        description: `Only ${sweet.quantity} items available.`,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          sweet_id: sweet.id,
          user_id: user.id,
          quantity: purchaseQuantity,
          total_price: sweet.price * purchaseQuantity,
        });

      if (purchaseError) throw purchaseError;

      // Update sweet quantity
      const { error: updateError } = await supabase
        .from('sweets')
        .update({ quantity: sweet.quantity - purchaseQuantity })
        .eq('id', sweet.id);

      if (updateError) throw updateError;

      toast({
        title: 'Purchase successful!',
        description: `You bought ${purchaseQuantity}x ${sweet.name} for $${(sweet.price * purchaseQuantity).toFixed(2)}`,
      });

      setPurchaseQuantity(1);
      onPurchase();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Purchase failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
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

      <CardFooter className="p-4 pt-0 flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-muted-foreground">Quantity:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
              disabled={purchaseQuantity <= 1 || isOutOfStock}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center font-medium">{purchaseQuantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPurchaseQuantity(Math.min(maxQuantity, purchaseQuantity + 1))}
              disabled={purchaseQuantity >= maxQuantity || isOutOfStock}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <Button
          variant="candy"
          className="w-full"
          onClick={handlePurchase}
          disabled={isOutOfStock || isLoading}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isLoading ? 'Processing...' : isOutOfStock ? 'Out of Stock' : `Buy for $${(sweet.price * purchaseQuantity).toFixed(2)}`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SweetCard;
