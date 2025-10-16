import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  productsApi, 
  categoriesApi, 
  type Product, 
  type Category,
  type CreateProductData,
  type UpdateProductData,
  type ProductStatus 
} from "@/services/shopApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, Trash2, Plus, Eye, EyeOff, Image as ImageIcon, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

interface ProductFormData {
  name: string;
  description: string;
  short_description: string;
  sku: string;
  price: number;
  original_price: number;
  stock_quantity: number;
  min_stock_level: number;
  status: ProductStatus;
  category_id: string;
  images: string[];
  weight_grams: number;
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  short_description: "",
  sku: "",
  price: 0,
  original_price: 0,
  stock_quantity: 0,
  min_stock_level: 5,
  status: "active",
  category_id: "",
  images: [],
  weight_grams: 0,
  is_featured: false,
  meta_title: "",
  meta_description: "",
};

export default function ProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [imageInput, setImageInput] = useState("");

  // Fetch products
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-products"],
    queryFn: productsApi.getAdminProducts,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: categoriesApi.getAdminCategories,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Produk berhasil dibuat",
        description: "Produk baru telah ditambahkan ke inventory",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat produk",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: productsApi.updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      toast({
        title: "Produk berhasil diperbarui",
        description: "Perubahan produk telah disimpan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui produk",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: "Produk berhasil dihapus",
        description: "Produk telah dihapus dari inventory",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus produk",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: productsApi.toggleProductStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: "Status produk diperbarui",
        description: "Status produk berhasil diubah",
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

  // Bulk status update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ProductStatus }) =>
      productsApi.bulkUpdateProductStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setSelectedProducts([]);
      toast({
        title: "Bulk update berhasil",
        description: "Status produk terpilih berhasil diperbarui",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal bulk update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setImageInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process images from input
    const images = imageInput
      .split('\n')
      .map(url => url.trim())
      .filter(url => url);

    const productData = {
      ...formData,
      images,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      short_description: product.short_description || "",
      sku: product.sku || "",
      price: product.price || 0,
      original_price: product.original_price || 0,
      stock_quantity: product.stock_quantity || 0,
      min_stock_level: product.min_stock_level || 5,
      status: product.status || "active",
      category_id: product.category_id || "",
      images: (product.images as string[]) || [],
      weight_grams: product.weight_grams || 0,
      is_featured: product.is_featured || false,
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
    });
    setImageInput(((product.images as string[]) || []).join('\n'));
    setIsEditDialogOpen(true);
  };

  const handleDelete = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  const handleToggleStatus = (productId: string) => {
    toggleStatusMutation.mutate(productId);
  };

  const handleBulkStatusUpdate = (status: ProductStatus) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Pilih produk",
        description: "Silakan pilih produk yang ingin diperbarui",
        variant: "destructive",
      });
      return;
    }
    bulkUpdateMutation.mutate({ ids: selectedProducts, status });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ProductForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nama Produk *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="short_description">Deskripsi Singkat</Label>
        <Input
          id="short_description"
          value={formData.short_description}
          onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="description">Deskripsi Lengkap</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Harga (Rp) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="original_price">Harga Asli (Rp)</Label>
          <Input
            id="original_price"
            type="number"
            value={formData.original_price}
            onChange={(e) => setFormData({ ...formData, original_price: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="stock_quantity">Stok</Label>
          <Input
            id="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="min_stock_level">Min. Stok</Label>
          <Input
            id="min_stock_level"
            type="number"
            value={formData.min_stock_level}
            onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="weight_grams">Berat (gram)</Label>
          <Input
            id="weight_grams"
            type="number"
            value={formData.weight_grams}
            onChange={(e) => setFormData({ ...formData, weight_grams: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category_id">Kategori</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: ProductStatus) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
              <SelectItem value="out_of_stock">Stok Habis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="images">URL Gambar (satu per baris)</Label>
        <Textarea
          id="images"
          value={imageInput}
          onChange={(e) => setImageInput(e.target.value)}
          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_featured"
          checked={formData.is_featured}
          onCheckedChange={(checked) => setFormData({ ...formData, is_featured: !!checked })}
        />
        <Label htmlFor="is_featured">Produk Unggulan</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="meta_description">Meta Description</Label>
          <Input
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
          />
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
          disabled={createProductMutation.isPending || updateProductMutation.isPending}
        >
          {editingProduct ? "Update" : "Buat"} Produk
        </Button>
      </div>
    </form>
  );

  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          Manajemen Produk
        </CardTitle>
        <CardDescription>
          Kelola produk di toko Anda dengan mudah
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Search and Actions */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-slate-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedProducts.length > 0 && (
              <>
                <Select onValueChange={(value: ProductStatus) => handleBulkStatusUpdate(value)}>
                  <SelectTrigger className="w-40 border-slate-200">
                    <SelectValue placeholder="Ubah Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktifkan</SelectItem>
                    <SelectItem value="inactive">Non-aktifkan</SelectItem>
                    <SelectItem value="out_of_stock">Stok Habis</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {selectedProducts.length} dipilih
                </Badge>
              </>
            )}
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Produk
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    Tambah Produk Baru
                  </DialogTitle>
                </DialogHeader>
                <ProductForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Products Table */}
        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedProducts.length === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-slate-400" style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-sm text-slate-500">{product.sku}</div>
                          {product.is_featured && (
                            <Badge variant="secondary" className="mt-1 bg-yellow-100 text-yellow-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Unggulan
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200">
                        {product.category?.name || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">Rp {product.price?.toLocaleString()}</div>
                        {product.original_price && product.original_price > product.price && (
                          <div className="text-sm text-slate-500 line-through">
                            Rp {product.original_price.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.stock_quantity || 0}</span>
                        {(product.stock_quantity || 0) <= (product.min_stock_level || 5) && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === "active"
                            ? "default"
                            : product.status === "inactive"
                            ? "secondary"
                            : "destructive"
                        }
                        className={
                          product.status === "active"
                            ? "bg-green-100 text-green-800"
                            : product.status === "inactive"
                            ? "bg-slate-100 text-slate-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {product.status === "active" ? "Aktif" : 
                         product.status === "inactive" ? "Tidak Aktif" : "Stok Habis"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(product.id)}
                          className="hover:bg-slate-100"
                        >
                          {product.status === "active" ? (
                            <EyeOff className="h-4 w-4 text-slate-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-red-50">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
                              <AlertDialogDescription>
                                Yakin ingin menghapus produk "{product.name}"? Aksi ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Produk
              </DialogTitle>
            </DialogHeader>
            <ProductForm />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}