import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Package, Candy, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Sweet {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string | null;
  image_url: string | null;
}

const Admin = () => {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSweet, setEditingSweet] = useState<Sweet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    description: '',
    image_url: '',
  });
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
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
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (!isAdmin) {
        toast({
          variant: 'destructive',
          title: 'Access denied',
          description: 'You do not have admin privileges.',
        });
        navigate('/');
        return;
      }
      fetchSweets();
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      quantity: '',
      description: '',
      image_url: '',
    });
    setEditingSweet(null);
  };

  const openEditDialog = (sweet: Sweet) => {
    setEditingSweet(sweet);
    setFormData({
      name: sweet.name,
      category: sweet.category,
      price: sweet.price.toString(),
      quantity: sweet.quantity.toString(),
      description: sweet.description || '',
      image_url: sweet.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sweetData = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      description: formData.description || null,
      image_url: formData.image_url || null,
      created_by: user?.id,
    };

    try {
      if (editingSweet) {
        const { error } = await supabase
          .from('sweets')
          .update(sweetData)
          .eq('id', editingSweet.id);

        if (error) throw error;

        toast({
          title: 'Sweet updated',
          description: `${formData.name} has been updated.`,
        });
      } else {
        const { error } = await supabase
          .from('sweets')
          .insert(sweetData);

        if (error) throw error;

        toast({
          title: 'Sweet added',
          description: `${formData.name} has been added to the shop.`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSweets();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleDelete = async (sweet: Sweet) => {
    if (!confirm(`Are you sure you want to delete ${sweet.name}?`)) return;

    try {
      const { error } = await supabase
        .from('sweets')
        .delete()
        .eq('id', sweet.id);

      if (error) throw error;

      toast({
        title: 'Sweet deleted',
        description: `${sweet.name} has been removed.`,
      });
      fetchSweets();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleRestock = async (sweet: Sweet) => {
    const amount = prompt('Enter quantity to add:', '10');
    if (!amount) return;

    const addQuantity = parseInt(amount);
    if (isNaN(addQuantity) || addQuantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid quantity',
        description: 'Please enter a positive number.',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('sweets')
        .update({ quantity: sweet.quantity + addQuantity })
        .eq('id', sweet.id);

      if (error) throw error;

      toast({
        title: 'Stock updated',
        description: `Added ${addQuantity} units to ${sweet.name}.`,
      });
      fetchSweets();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
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

  return (
    <div className="min-h-screen warm-gradient">
      <Header />

      <main className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Shop
            </Link>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="candy" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Sweet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingSweet ? 'Edit Sweet' : 'Add New Sweet'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Chocolate, Gummy, Hard Candy"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="candy">
                    {editingSweet ? 'Save Changes' : 'Add Sweet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Candy className="w-5 h-5 text-primary" />
              Sweet Inventory ({sweets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sweets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sweets in inventory. Add your first sweet to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sweets.map((sweet) => (
                      <TableRow key={sweet.id}>
                        <TableCell className="font-medium">{sweet.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sweet.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${Number(sweet.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={sweet.quantity === 0 ? 'destructive' : 'secondary'}>
                            {sweet.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestock(sweet)}
                              title="Restock"
                            >
                              <Package className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(sweet)}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(sweet)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

export default Admin;
