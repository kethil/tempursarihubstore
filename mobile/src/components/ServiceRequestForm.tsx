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
import { useAuth } from '../hooks/useAuth';

interface ServiceRequestFormProps {
  serviceType: string;
  onBack: () => void;
  onSuccess: (requestNumber: string) => void;
}

const serviceTypes: { [key: string]: string } = {
  'surat_pengantar_ktp': 'Surat Pengantar KTP',
  'surat_keterangan_domisili': 'Surat Keterangan Domisili',
  'surat_keterangan_usaha': 'Surat Keterangan Usaha',
  'surat_keterangan_tidak_mampu': 'Surat Keterangan Tidak Mampu',
  'surat_keterangan_belum_menikah': 'Surat Keterangan Belum Menikah',
  'surat_pengantar_nikah': 'Surat Pengantar Nikah',
  'surat_keterangan_kematian': 'Surat Keterangan Kematian',
  'surat_keterangan_kelahiran': 'Surat Keterangan Kelahiran',
};

const requirements: { [key: string]: string[] } = {
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
  ],
  'surat_keterangan_tidak_mampu': [
    'Foto KTP',
    'Foto Kartu Keluarga',
    'Bukti penghasilan'
  ],
  'surat_keterangan_belum_menikah': [
    'Foto KTP',
    'Foto Kartu Keluarga'
  ],
  'surat_pengantar_nikah': [
    'Foto KTP',
    'Foto Kartu Keluarga',
    'Pas foto berdua'
  ],
  'surat_keterangan_kematian': [
    'Foto KTP pelapor',
    'Foto KTP almarhum',
    'Surat keterangan dokter'
  ],
  'surat_keterangan_kelahiran': [
    'Foto KTP orangtua',
    'Foto Kartu Keluarga',
    'Surat keterangan dokter'
  ],
};

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  serviceType,
  onBack,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    nik: '',
    phoneNumber: '',
    purpose: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRequirements = requirements[serviceType] || ['Foto KTP', 'Dokumen pendukung lainnya'];
  const serviceName = serviceTypes[serviceType] || 'Layanan Desa';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Nama lengkap harus diisi');
      return false;
    }
    if (!formData.nik.trim() || formData.nik.length !== 16) {
      Alert.alert('Error', 'NIK harus diisi dengan 16 digit');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Nomor HP harus diisi');
      return false;
    }
    if (!formData.purpose.trim()) {
      Alert.alert('Error', 'Keperluan/tujuan harus diisi');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('Error', 'Anda harus login terlebih dahulu');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        full_name: formData.fullName,
        nik: formData.nik,
        phone: formData.phoneNumber,
        request_type: serviceType as any,
        user_id: user.id,
      };

      const response = await serviceRequestsApi.createServiceRequest(requestData);
      
      // Generate a request number since mobile schema might not have it
      const requestNumber = response.id ? `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${response.id.slice(-4).toUpperCase()}` : 'REQ-PENDING';
      
      Alert.alert(
        'Permohonan Berhasil',
        `Nomor permohonan: ${requestNumber}\n\nPermohonan Anda telah berhasil diajukan. Silakan tunggu notifikasi selanjutnya.`,
        [
          {
            text: 'OK',
            onPress: () => onSuccess(requestNumber),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert(
        'Error',
        'Gagal mengirim permohonan. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#0891b2" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{serviceName}</Text>
          <Text style={styles.headerSubtitle}>Lengkapi formulir pengajuan</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Requirements Section */}
        <View style={styles.requirementsCard}>
          <View style={styles.requirementsHeader}>
            <Feather name="file-text" size={20} color="#0891b2" />
            <Text style={styles.requirementsTitle}>Dokumen yang Diperlukan</Text>
          </View>
          <View style={styles.requirementsList}>
            {currentRequirements.map((req, index) => (
              <View key={index} style={styles.requirementItem}>
                <View style={styles.requirementBullet} />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}
          </View>
          <View style={styles.requirementsNote}>
            <Feather name="info" size={16} color="#f59e0b" />
            <Text style={styles.requirementsNoteText}>
              Siapkan foto/scan dokumen di atas. Upload dapat dilakukan setelah permohonan disetujui.
            </Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Data Pemohon</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Lengkap *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NIK *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.nik}
              onChangeText={(value) => handleInputChange('nik', value)}
              placeholder="Masukkan NIK (16 digit)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={16}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nomor HP *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder="Contoh: 081234567890"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Keperluan/Tujuan *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.purpose}
              onChangeText={(value) => handleInputChange('purpose', value)}
              placeholder="Jelaskan keperluan pengajuan surat ini"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Process Info */}
        <View style={styles.processCard}>
          <Text style={styles.processTitle}>Proses Selanjutnya</Text>
          <View style={styles.processSteps}>
            <View style={styles.processStep}>
              <View style={styles.processStepNumber}>
                <Text style={styles.processStepNumberText}>1</Text>
              </View>
              <Text style={styles.processStepText}>Permohonan akan diverifikasi oleh petugas</Text>
            </View>
            <View style={styles.processStep}>
              <View style={styles.processStepNumber}>
                <Text style={styles.processStepNumberText}>2</Text>
              </View>
              <Text style={styles.processStepText}>Anda akan dihubungi untuk upload dokumen</Text>
            </View>
            <View style={styles.processStep}>
              <View style={styles.processStepNumber}>
                <Text style={styles.processStepNumberText}>3</Text>
              </View>
              <Text style={styles.processStepText}>Dokumen selesai dan dapat diambil di kantor desa</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Kirim Permohonan</Text>
              <Feather name="send" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
  requirementsCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
    marginLeft: 8,
  },
  requirementsList: {
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0891b2',
    marginRight: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#1e40af',
    flex: 1,
  },
  requirementsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
  },
  requirementsNoteText: {
    fontSize: 13,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  formCard: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
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
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  processCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 100,
  },
  processTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  processSteps: {
    marginBottom: 16,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  processStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  processStepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  processStepText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    lineHeight: 20,
    paddingTop: 6,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#0891b2',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
});