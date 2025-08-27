import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  categoriesApi, 
  productsApi,
  type Category,
  type CreateCategoryData,
  type UpdateCategoryData 
} from "@/services/shopApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, Trash2, Plus, Eye, EyeOff, Package } from "lucide-react";

interface CategoryFormData {
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

const initialFormData: CategoryFormData = {
  name: "",
  description: "",
  image_url: "",
  is_active: true,
  sort_order: 0,
};

export default function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);

  // Fetch categories
  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: categoriesApi.getAdminCategories,
  });

  // Get product counts for each category
  const { data: productCounts = {} } = useQuery({
    queryKey: ["category-product-counts"],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      const allProducts = await productsApi.getAdminProducts();
      
      allProducts.forEach(product => {
        if (product.category_id) {
          counts[product.category_id] = (counts[product.category_id] || 0) + 1;
        }
      });
      
      return counts;
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Kategori berhasil dibuat",
        description: "Kategori baru telah ditambahkan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat kategori",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: categoriesApi.updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({
        title: "Kategori berhasil diperbarui",
        description: "Perubahan kategori telah disimpan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui kategori",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-product-counts"] });
      toast({
        title: "Kategori berhasil dihapus",
        description: "Kategori telah dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus kategori",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: categoriesApi.toggleCategoryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Status kategori diperbarui",
        description: "Status kategori berhasil diubah",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal mengubah status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, ...formData });
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active ?? true,
      sort_order: category.sort_order || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    const productCount = productCounts[categoryId] || 0;
    
    if (productCount > 0) {
      toast({
        title: "Tidak dapat menghapus kategori",
        description: `Kategori ini masih memiliki ${productCount} produk. Pindahkan atau hapus produk terlebih dahulu.`,
        variant: "destructive",
      });
      return;
    }
    
    deleteCategoryMutation.mutate(categoryId);
  };

  const handleToggleStatus = (categoryId: string) => {
    toggleStatusMutation.mutate(categoryId);
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CategoryForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nama Kategori *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Deskripsi kategori (opsional)"
        />
      </div>

      <div>
        <Label htmlFor="image_url">URL Gambar</Label>
        <Input
          id="image_url"
          type="url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sort_order">Urutan Tampil</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
            min="0"
          />
        </div>
        <div className="flex items-center space-x-2 mt-6">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
          />
          <Label htmlFor="is_active">Aktif</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        >
          {editingCategory ? "Update" : "Buat"} Kategori
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Kategori</CardTitle>
        <CardDescription>
          Kelola kategori produk di toko Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Actions */}
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Kategori Baru</DialogTitle>
              </DialogHeader>
              <CategoryForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Kategori</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aktif</p>
                  <p className="text-2xl font-bold text-green-600">
                    {categories.filter(c => c.is_active).length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Non-aktif</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {categories.filter(c => !c.is_active).length}
                  </p>
                </div>
                <EyeOff className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah Produk</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.image_url && (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-muted-foreground">{category.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {category.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{productCounts[category.id] || 0}</span>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>
                      <Badge
                        variant={category.is_active ? "default" : "secondary"}
                      >
                        {category.is_active ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(category.id)}
                        >
                          {category.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                              <AlertDialogDescription>
                                Yakin ingin menghapus kategori "{category.name}"?
                                {productCounts[category.id] > 0 && (
                                  <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded">
                                    <strong>Perhatian:</strong> Kategori ini memiliki {productCounts[category.id]} produk. 
                                    Anda perlu memindahkan atau menghapus produk tersebut terlebih dahulu.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(category.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={productCounts[category.id] > 0}
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Kategori</DialogTitle>
            </DialogHeader>
            <CategoryForm />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}