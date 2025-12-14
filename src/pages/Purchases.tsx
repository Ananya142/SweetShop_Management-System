import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Candy, ShoppingBag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Purchase {
  id: string;
  quantity: number;
  total_price: number;
  purchased_at: string;
  sweets: {
    name: string;
    category: string;
  } | null;
}

const Purchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchPurchases();
    }
  }, [user, authLoading, navigate]);

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id,
        quantity,
        total_price,
        purchased_at,
        sweets (
          name,
          category
        )
      `)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
    } else {
      setPurchases(data || []);
    }
    setIsLoading(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center warm-gradient">
        <div className="w-16 h-16 rounded-full candy-gradient flex items-center justify-center shadow-glow animate-bounce-soft">
          <Candy className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
    );
  }

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.total_price), 0);

  return (
    <div className="min-h-screen warm-gradient">
      <Header />

      <main className="container py-8 space-y-8">
        <div className="space-y-1">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
          <h1 className="font-display text-3xl font-bold">My Purchases</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-card border-0 candy-gradient">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/80 text-sm">Total Purchases</p>
                  <p className="text-3xl font-bold text-primary-foreground">{purchases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 gold-gradient">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Candy className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/80 text-sm">Total Spent</p>
                  <p className="text-3xl font-bold text-primary-foreground">${totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Purchase History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold">No purchases yet</h3>
                <p className="text-muted-foreground">
                  Start shopping to see your purchase history here!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sweet</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.sweets?.name || 'Deleted item'}
                        </TableCell>
                        <TableCell>
                          {purchase.sweets?.category ? (
                            <Badge variant="outline">{purchase.sweets.category}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">{purchase.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(purchase.total_price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {format(new Date(purchase.purchased_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Purchases;
