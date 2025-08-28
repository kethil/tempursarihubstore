import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";

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
    pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    on_process: { label: "Diproses", color: "bg-blue-100 text-blue-800", icon: "⚙️" },
    completed: { label: "Selesai", color: "bg-green-100 text-green-800", icon: "✅" },
    cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-800", icon: "❌" },
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
          <h2 className="text-2xl font-bold">Layanan Desa</h2>
          <p className="text-muted-foreground">Kelola permohonan layanan administrasi desa</p>
        </div>
        <Button onClick={exportToCSV} disabled={!requests || requests.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = requests?.filter(r => r.status === status).length || 0;
          return (
            <Card key={status} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <span className="text-2xl">{config.icon}</span>
              </div>
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
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4">Nomor</th>
                <th className="text-left p-4">Nama</th>
                <th className="text-left p-4">Layanan</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Tanggal</th>
                <th className="text-left p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : requests && requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="font-medium">{request.request_number}</div>
                      <div className="text-sm text-muted-foreground">{request.nik}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{request.full_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {request.phone_number}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{serviceTypeNames[request.service_type]}</div>
                    </td>
                    <td className="p-4">
                      <Badge className={statusConfig[request.status || "pending"].color}>
                        {statusConfig[request.status || "pending"].label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(request.created_at || "")}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              Detail
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detail Permohonan</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
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
                  <td colSpan={6} className="text-center p-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Tidak ada permohonan layanan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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