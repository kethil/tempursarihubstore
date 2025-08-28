import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, FileText, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

interface ServiceRequestFormProps {
  serviceType: string;
  onBack: () => void;
  onSuccess: (requestNumber: string) => void;
}

const serviceTypes = {
  'surat_pengantar_ktp': 'Surat Pengantar KTP',
  'surat_keterangan_domisili': 'Surat Keterangan Domisili',
  'surat_keterangan_usaha': 'Surat Keterangan Usaha',
  'surat_keterangan_tidak_mampu': 'Surat Keterangan Tidak Mampu',
  'surat_keterangan_belum_menikah': 'Surat Keterangan Belum Menikah',
  'surat_pengantar_nikah': 'Surat Pengantar Nikah',
  'surat_keterangan_kematian': 'Surat Keterangan Kematian',
  'surat_keterangan_kelahiran': 'Surat Keterangan Kelahiran'
};

export const ServiceRequestForm = ({ serviceType, onBack, onSuccess }: ServiceRequestFormProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    nik: '',
    phoneNumber: '',
    purpose: ''
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Check file size limit (2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      const oversizedFiles = files.filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        toast({
          title: "File Too Large",
          description: `Some files exceed 2MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`,
          variant: "destructive"
        });
        return;
      }
      
      setDocuments(files);
    }
  };

  const uploadDocuments = async (userId: string, requestId: string) => {
    const uploadPromises = documents.map(async (file, index) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${requestId}/document_${index}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('service-documents')
        .upload(fileName, file);
      
      if (error) throw error;
      return data.path;
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Allow anonymous submissions - no login required
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate request number client-side as fallback
      const generateRequestNumber = () => {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const timestamp = Date.now().toString().slice(-4);
        return `REQ-${today}-${timestamp}`;
      };

      // Create the service request (user_id will be null for anonymous requests)
      const { data: request, error: requestError } = await supabase
        .from('service_requests')
        .insert({
          user_id: user?.id || null, // Allow null for anonymous users
          service_type: serviceType as Database['public']['Enums']['service_type'],
          full_name: formData.fullName,
          nik: formData.nik,
          phone_number: formData.phoneNumber,
          request_number: generateRequestNumber(), // Generate client-side
          status: 'pending' as Database['public']['Enums']['request_status']
        })
        .select('id, request_number')
        .single();

      if (requestError) throw requestError;

      // Upload documents if any (allow anonymous uploads)
      if (documents.length > 0) {
        // Use anonymous prefix for users without account
        const uploaderUserId = user?.id || 'anonymous';
        const documentPaths = await uploadDocuments(uploaderUserId, request.id);
        
        // Update request with document paths
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({ documents: { files: documentPaths } })
          .eq('id', request.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Permohonan Berhasil",
        description: `Nomor permohonan: ${request.request_number}`,
      });

      onSuccess(request.request_number);
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim permohonan. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requirements = {
    'surat_pengantar_ktp': [
      'Foto KTP lama (jika ada)',
      'Foto Kartu Keluarga',
      'Pas foto 3x4 terbaru'
    ],
    'surat_keterangan_domisili': [
      'Foto KTP',
      'Foto Kartu Keluarga',
      'Surat kontrak/bukti tempat tinggal'
    ],
    'surat_keterangan_usaha': [
      'Foto KTP',
      'Foto tempat usaha',
      'Surat izin usaha (jika ada)'
    ]
  };

  const currentRequirements = requirements[serviceType as keyof typeof requirements] || [
    'Foto KTP',
    'Dokumen pendukung lainnya'
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{serviceTypes[serviceType as keyof typeof serviceTypes]}</h2>
          <p className="text-sm text-muted-foreground">Lengkapi formulir dan upload dokumen</p>
        </div>
      </div>

      {/* Requirements Card */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-primary mb-3 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Dokumen yang Diperlukan
        </h3>
        <ul className="text-sm space-y-1">
          {currentRequirements.map((req, index) => (
            <li key={index} className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              {req}
            </li>
          ))}
        </ul>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Data Pemohon</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <Label htmlFor="nik">NIK</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                required
                placeholder="Masukkan NIK (16 digit)"
                maxLength={16}
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Nomor HP</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
                placeholder="Contoh: 081234567890"
              />
            </div>

            <div>
              <Label htmlFor="purpose">Keperluan/Tujuan</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Jelaskan keperluan pengajuan surat ini"
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Upload Dokumen</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="documents">Pilih Dokumen</Label>
              <Input
                id="documents"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: JPG, PNG, PDF. Maksimal 2MB per file.
              </p>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">File yang dipilih:</p>
                {documents.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Mengirim..." : "Kirim Permohonan"}
        </Button>
      </form>
    </div>
  );
};