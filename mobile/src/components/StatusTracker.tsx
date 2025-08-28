import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { serviceRequestsApi } from '../services/api';

interface StatusTrackerProps {
  onBack: () => void;
}

interface RequestData {
  id: string;
  request_number: string;
  full_name: string;
  nik: string;
  phone_number: string;
  service_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const serviceTypeNames: { [key: string]: string } = {
  'surat_pengantar_ktp': 'Surat Pengantar KTP',
  'surat_keterangan_domisili': 'Surat Keterangan Domisili',
  'surat_keterangan_usaha': 'Surat Keterangan Usaha',
  'surat_keterangan_tidak_mampu': 'Surat Keterangan Tidak Mampu',
  'surat_keterangan_belum_menikah': 'Surat Keterangan Belum Menikah',
  'surat_pengantar_nikah': 'Surat Pengantar Nikah',
  'surat_keterangan_kematian': 'Surat Keterangan Kematian',
  'surat_keterangan_kelahiran': 'Surat Keterangan Kelahiran',
};

const statusConfig: { [key: string]: { label: string; color: string; icon: keyof typeof Feather.glyphMap } } = {
  pending: {
    label: 'Menunggu',
    color: '#f59e0b',
    icon: 'clock',
  },
  on_process: {
    label: 'Diproses',
    color: '#06b6d4',
    icon: 'refresh-cw',
  },
  completed: {
    label: 'Selesai',
    color: '#10b981',
    icon: 'check-circle',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: '#ef4444',
    icon: 'x-circle',
  },
};

export const StatusTracker: React.FC<StatusTrackerProps> = ({ onBack }) => {
  const [nik, setNik] = useState('');
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!nik.trim()) {
      Alert.alert('Error', 'Masukkan NIK untuk melacak status');
      return;
    }

    if (nik.trim().length !== 16) {
      Alert.alert('Error', 'NIK harus 16 digit');
      return;
    }

    setIsLoading(true);

    try {
      const data = await serviceRequestsApi.searchByNik(nik.trim());
      
      if (data) {
        setRequestData(data);
      } else {
        setRequestData(null);
        Alert.alert(
          'Data Tidak Ditemukan',
          'Tidak ada permohonan dengan NIK tersebut. Pastikan NIK yang dimasukkan benar dan sudah pernah mengajukan permohonan.'
        );
      }
    } catch (error) {
      console.error('Error searching request:', error);
      Alert.alert('Error', 'Gagal mencari data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#0891b2" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cek Status Permohonan</Text>
          <Text style={styles.headerSubtitle}>Masukkan NIK untuk melacak status</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Form */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Lacak Permohonan Anda</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NIK (Nomor Induk Kependudukan)</Text>
            <TextInput
              style={styles.textInput}
              value={nik}
              onChangeText={setNik}
              placeholder="Masukkan NIK (16 digit)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={16}
            />
          </View>

          <TouchableOpacity
            style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Feather name="search" size={20} color="#ffffff" />
                <Text style={styles.searchButtonText}>Cek Status</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {requestData && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestNumber}>
                  {requestData.request_number}
                </Text>
                <Text style={styles.serviceType}>
                  {serviceTypeNames[requestData.service_type] || 'Layanan Desa'}
                </Text>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusInfo(requestData.status).color}20` }]}>
                <Feather 
                  name={getStatusInfo(requestData.status).icon} 
                  size={16} 
                  color={getStatusInfo(requestData.status).color} 
                />
                <Text style={[styles.statusText, { color: getStatusInfo(requestData.status).color }]}>
                  {getStatusInfo(requestData.status).label}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Nama Pemohon</Text>
                <Text style={styles.detailValue}>{requestData.full_name}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>NIK</Text>
                <Text style={styles.detailValue}>{requestData.nik}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Nomor HP</Text>
                <Text style={styles.detailValue}>{requestData.phone_number}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tanggal Pengajuan</Text>
                <Text style={styles.detailValue}>{formatDate(requestData.created_at)}</Text>
              </View>
            </View>

            {/* Status-specific messages */}
            {requestData.status === 'completed' && (
              <View style={styles.completedCard}>
                <View style={styles.completedHeader}>
                  <Feather name="check-circle" size={20} color="#10b981" />
                  <Text style={styles.completedTitle}>Permohonan Selesai</Text>
                </View>
                <Text style={styles.completedText}>
                  Dokumen sudah siap. Silakan datang ke kantor desa untuk mengambil dokumen dengan membawa:
                </Text>
                <View style={styles.requirementsList}>
                  <Text style={styles.requirementItem}>• KTP asli</Text>
                  <Text style={styles.requirementItem}>• Nomor permohonan: {requestData.request_number}</Text>
                </View>
              </View>
            )}

            {requestData.status === 'cancelled' && (
              <View style={styles.cancelledCard}>
                <View style={styles.cancelledHeader}>
                  <Feather name="x-circle" size={20} color="#ef4444" />
                  <Text style={styles.cancelledTitle}>Permohonan Dibatalkan</Text>
                </View>
                <Text style={styles.cancelledText}>
                  Silakan hubungi kantor desa untuk informasi lebih lanjut atau ajukan permohonan baru.
                </Text>
              </View>
            )}

            {requestData.status === 'on_process' && (
              <View style={styles.processCard}>
                <View style={styles.processHeader}>
                  <Feather name="refresh-cw" size={20} color="#06b6d4" />
                  <Text style={styles.processTitle}>Sedang Diproses</Text>
                </View>
                <Text style={styles.processText}>
                  Permohonan Anda sedang diproses oleh petugas. Anda akan dihubungi untuk melengkapi dokumen jika diperlukan.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Feather name="info" size={20} color="#0891b2" />
            <Text style={styles.instructionsTitle}>Informasi Penting</Text>
          </View>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>• Gunakan NIK yang sama dengan yang digunakan saat pengajuan</Text>
            <Text style={styles.instructionItem}>• Status akan diperbarui secara otomatis</Text>
            <Text style={styles.instructionItem}>• Hubungi kantor desa jika ada kendala</Text>
            <Text style={styles.instructionItem}>• Jam pelayanan: Senin-Jumat, 08:00-15:00</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  searchButton: {
    backgroundColor: '#0891b2',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  requestInfo: {
    flex: 1,
  },
  requestNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  completedCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginLeft: 8,
  },
  completedText: {
    fontSize: 14,
    color: '#15803d',
    lineHeight: 20,
    marginBottom: 8,
  },
  requirementsList: {
    marginTop: 8,
  },
  requirementItem: {
    fontSize: 14,
    color: '#15803d',
    marginBottom: 4,
  },
  cancelledCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
  },
  cancelledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelledTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
  cancelledText: {
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
  processCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 16,
  },
  processHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  processTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284c7',
    marginLeft: 8,
  },
  processText: {
    fontSize: 14,
    color: '#0284c7',
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
    marginLeft: 8,
  },
  instructionsList: {
    marginLeft: 4,
  },
  instructionItem: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginBottom: 4,
  },
});