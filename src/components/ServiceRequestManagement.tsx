import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { wahaService } from "@/services/wahaService";
import { useServiceNotifications } from "@/hooks/useServiceNotifications";
import { WAHATestPanel } from "@/components/WAHATestPanel";
import {
  Search,
  Eye,
  Edit,
  Phone,
  Calendar,
  User,
  FileText,
  MessageSquare,
  RefreshCw,
  Filter,
  Download,
  Image,
  ExternalLink,
  File,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";
import { TableSkeleton, StatsSkeleton } from "@/components/ui/loading-skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ServiceRequest = Database["public"]["Tables"]["service_requests"]["Row"];
type RequestStatus = Database["public"]["Enums"]["request_status"];
type ServiceType = Database["public"]["Enums"]["service_type"];

// Use the ServiceRequest type directly since it already includes operator_notes
type ServiceRequestWithDetails = ServiceRequest;

const ServiceRequestManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus>("pending");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [requestDocuments, setRequestDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize service notifications hook
  useServiceNotifications();

  // Fetch service requests
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ["service-requests", searchTerm, statusFilter, serviceTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,nik.ilike.%${searchTerm}%,request_number.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (serviceTypeFilter !== "all") {
        query = query.eq("service_type", serviceTypeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ServiceRequestWithDetails[];
    },
  });

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: RequestStatus; notes?: string }) => {
      const { data: currentRequest } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!currentRequest) throw new Error("Request not found");

      // Update the service request
      const { data, error } = await supabase
        .from("service_requests")
        .update({
          status,
          operator_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select("*")
        .single();

      if (error) throw error;

      // Send WhatsApp notification if status changed
      if (currentRequest.status !== status) {
        try {
          await wahaService.sendStatusUpdateNotification(data, currentRequest.status);
        } catch (notificationError) {
          console.error("Failed to send WhatsApp notification:", notificationError);
          // Don't throw error for notification failure
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Status Updated",
        description: "Service request status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const serviceTypeNames: Record<ServiceType, string> = {
    'surat_pengantar_ktp': 'Surat Pengantar KTP',
    'surat_keterangan_domisili': 'Surat Keterangan Domisili',
    'surat_keterangan_usaha': 'Surat Keterangan Usaha',
    'surat_keterangan_tidak_mampu': 'Surat Keterangan Tidak Mampu',
    'surat_keterangan_belum_menikah': 'Surat Keterangan Belum Menikah',
    'surat_pengantar_nikah': 'Surat Pengantar Nikah',
    'surat_keterangan_kematian': 'Surat Keterangan Kematian',
    'surat_keterangan_kelahiran': 'Surat Keterangan Kelahiran',
  };

  const statusConfig = {
    pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    on_process: { label: "Diproses", color: "bg-blue-100 text-blue-800", icon: Settings },
    completed: { label: "Selesai", color: "bg-green-100 text-green-800", icon: CheckCircle },
    cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-800", icon: XCircle },
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Function to load documents from Supabase storage
  const loadDocuments = async (request: ServiceRequestWithDetails) => {
    setIsLoadingDocuments(true);
    try {
      // Type cast documents to expected structure
      const documentsData = request.documents as { files?: string[] } | null;
      
      if (!documentsData || !documentsData.files || !Array.isArray(documentsData.files) || documentsData.files.length === 0) {
        setRequestDocuments([]);
        return;
      }

      const documentPaths = documentsData.files;
      const documentList = [];

      for (const filePath of documentPaths) {
        try {
          // Get the public URL for the file
          const { data } = supabase.storage
            .from('service-documents')
            .getPublicUrl(filePath);
            
          if (data?.publicUrl) {
            // Extract filename from path
            const fileName = filePath.split('/').pop() || 'Unknown Document';
            const fileExtension = fileName.split('.').pop()?.toLowerCase();
            
            // Determine file type
            let fileType = 'application/octet-stream';
            if (fileExtension) {
              if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                fileType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
              } else if (fileExtension === 'pdf') {
                fileType = 'application/pdf';
              }
            }
            
            documentList.push({
              id: filePath,
              name: fileName,
              type: fileType,
              size: 0, // Size not available from storage URL
              url: data.publicUrl,
              uploadType: 'file'
            });
          } else {
            console.log('No public URL available for:', filePath);
          }
        } catch (fileError) {
          console.error('Error processing file:', filePath, fileError);
        }
      }

      setRequestDocuments(documentList);
    } catch (error) {
      console.error('❌ Error loading documents:', error);
      setRequestDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to open document in new window
  const openDocument = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  const handleStatusUpdate = () => {
    if (!selectedRequest) return;

    updateStatusMutation.mutate({
      requestId: selectedRequest.id,
      status: newStatus,
      notes: operatorNotes,
    });
  };

  const openEditDialog = (request: ServiceRequestWithDetails) => {
    setSelectedRequest(request);
    setNewStatus(request.status || "pending");
    setOperatorNotes(request.operator_notes || "");
    setIsEditDialogOpen(true);
  };

  const exportToCSV = () => {
    if (!requests || requests.length === 0) return;

    const headers = ["Nomor", "Nama", "NIK", "Layanan", "Status", "Tanggal", "Telepon"];
    const csvContent = [
      headers.join(","),
      ...requests.map(request => [
        request.request_number,
        request.full_name,
        request.nik,
        serviceTypeNames[request.service_type],
        statusConfig[request.status || "pending"].label,
        formatDate(request.created_at || ""),
        request.phone_number,
      ].map(field => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service-requests-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-destructive">Error loading service requests: {error.message}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["service-requests"] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* WAHA Test Panel */}
      <WAHATestPanel />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Layanan Desa
          </h2>
          <p className="text-slate-600 mt-1">Kelola permohonan layanan administrasi desa</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["service-requests"] });
              toast({
                title: "Refreshing",
                description: "Loading latest service requests...",
              });
            }}
            className="border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={exportToCSV} 
            disabled={!requests || requests.length === 0}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = requests?.filter(r => r.status === status).length || 0;
          const IconComponent = config.icon;
          return (
            <Card key={status} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{config.label}</p>
                    <p className="text-3xl font-bold text-slate-900">{count}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${config.color.replace('text-', 'bg-').replace('-100', '-50')}`}>
                    <IconComponent className={`h-6 w-6 ${config.color.split(' ')[1]}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Cari</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nama, NIK, atau nomor permohonan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="service-filter">Jenis Layanan</Label>
            <Select value={serviceTypeFilter} onValueChange={(value) => setServiceTypeFilter(value as ServiceType | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Layanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Layanan</SelectItem>
                {Object.entries(serviceTypeNames).map(([type, name]) => (
                  <SelectItem key={type} value={type}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setServiceTypeFilter("all");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-pink-100 rounded-lg">
              <FileText className="h-5 w-5 text-pink-600" />
            </div>
            Daftar Permohonan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-900">Nomor</th>
                  <th className="text-left p-4 font-medium text-slate-900">Nama</th>
                  <th className="text-left p-4 font-medium text-slate-900">Layanan</th>
                  <th className="text-left p-4 font-medium text-slate-900">Status</th>
                  <th className="text-left p-4 font-medium text-slate-900">Dokumen</th>
                  <th className="text-left p-4 font-medium text-slate-900">Tanggal</th>
                  <th className="text-left p-4 font-medium text-slate-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8">
                      <TableSkeleton rows={3} columns={7} />
                    </td>
                  </tr>
                ) : requests && requests.length > 0 ? (
                  requests.map((request, index) => (
                    <tr 
                      key={request.id} 
                      className={`border-b hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}
                    >
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{request.request_number}</div>
                        <div className="text-sm text-slate-500">{request.nik}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white text-xs">
                              {request.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">{request.full_name}</div>
                            <div className="text-sm text-slate-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {request.phone_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="border-slate-200">
                          {serviceTypeNames[request.service_type]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={statusConfig[request.status || "pending"].color}>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const IconComponent = statusConfig[request.status || "pending"].icon;
                              return <IconComponent className="h-3 w-3" />;
                            })()}
                            {statusConfig[request.status || "pending"].label}
                          </div>
                        </Badge>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const docs = request.documents as { files?: string[] } | null;
                          return docs && docs.files && Array.isArray(docs.files) && docs.files.length > 0 ? (
                            <div className="flex items-center text-xs text-green-600">
                              <Image className="h-3 w-3 mr-1" />
                              {docs.files.length} file{docs.files.length > 1 ? 's' : ''}
                            </div>
                        ) : (
                          <div className="flex items-center text-xs text-slate-500">
                            <FileText className="h-3 w-3 mr-1" />
                            Tidak ada
                          </div>
                        );
                      })()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(request.created_at || "")}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  loadDocuments(request);
                                }}
                                className="hover:bg-blue-50 border-slate-200"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Detail
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detail Permohonan</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6" role="main" aria-label="Service request details">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Nomor Permohonan</Label>
                                  <p className="font-medium">{request.request_number}</p>
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Badge className={statusConfig[request.status || "pending"].color}>
                                    {statusConfig[request.status || "pending"].label}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Nama Lengkap</Label>
                                  <p className="font-medium">{request.full_name}</p>
                                </div>
                                <div>
                                  <Label>NIK</Label>
                                  <p className="font-medium">{request.nik}</p>
                                </div>
                                <div>
                                  <Label>Nomor HP</Label>
                                  <p className="font-medium">{request.phone_number}</p>
                                </div>
                                <div>
                                  <Label>Jenis Layanan</Label>
                                  <p className="font-medium">{serviceTypeNames[request.service_type]}</p>
                                </div>
                                <div>
                                  <Label>Tanggal Pengajuan</Label>
                                  <p className="font-medium">{formatDate(request.created_at || "")}</p>
                                </div>
                                <div>
                                  <Label>Terakhir Diperbarui</Label>
                                  <p className="font-medium">{formatDate(request.updated_at || "")}</p>
                                </div>
                              </div>
                              
                              {request.operator_notes && (
                                <div>
                                  <Label>Catatan Petugas</Label>
                                  <p className="bg-muted p-3 rounded text-sm">{request.operator_notes}</p>
                                </div>
                              )}
                              
                              {/* Documents Section */}
                              <div>
                                <Label className="text-base font-semibold">Dokumen yang Diunggah</Label>
                                {isLoadingDocuments ? (
                                  <div className="flex items-center justify-center p-4">
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    <span className="text-sm text-muted-foreground">Memuat dokumen...</span>
                                  </div>
                                ) : requestDocuments.length > 0 ? (
                                  <div className="mt-3 space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                      Ditemukan {requestDocuments.length} dokumen:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {requestDocuments.map((doc, index) => (
                                        <div key={doc.id || index} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                          <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                              {doc.type.startsWith('image/') ? (
                                                <Image className="h-8 w-8 text-blue-500" />
                                              ) : (
                                                <File className="h-8 w-8 text-gray-500" />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm truncate">{doc.name}</p>
                                              <div className="text-xs text-muted-foreground space-y-1">
                                                <p>Ukuran: {formatFileSize(doc.size)}</p>
                                                <p>Tipe: {doc.type}</p>
                                              </div>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => openDocument(doc)}
                                              className="flex-shrink-0"
                                            >
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              Buka
                                            </Button>
                                          </div>
                                          {doc.type.startsWith('image/') && doc.url && (
                                            <div className="mt-2">
                                              <img 
                                                src={doc.url} 
                                                alt={doc.name}
                                                className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => openDocument(doc)}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3 p-4 border border-dashed rounded-lg text-center">
                                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Tidak ada dokumen yang diunggah</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(request)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center p-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Tidak ada permohonan layanan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>

      {/* Edit Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status Permohonan</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>Permohonan</Label>
                <p className="font-medium">{selectedRequest.request_number}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.full_name}</p>
              </div>

              <div>
                <Label htmlFor="new-status">Status Baru</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as RequestStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="operator-notes">Catatan Petugas</Label>
                <Textarea
                  id="operator-notes"
                  placeholder="Tambahkan catatan untuk pemohon (opsional)"
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Update & Kirim Notifikasi
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceRequestManagement;