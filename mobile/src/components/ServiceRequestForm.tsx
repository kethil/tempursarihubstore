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
  Image,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import { serviceRequestsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { testStorageConnectivity } from '../lib/supabase';
import { StorageTestButton } from './StorageTestButton';
import type { Database } from '../lib/types';

interface ServiceRequestFormProps {
  serviceType: string;
  onBack: () => void;
  onSuccess: (requestNumber: string) => void;
}

interface DocumentFile {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
}

const { width } = Dimensions.get('window');

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
  const [errors, setErrors] = useState({
    fullName: '',
    nik: '',
    phoneNumber: '',
    purpose: '',
  });
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  const currentRequirements = requirements[serviceType] || ['Foto KTP', 'Dokumen pendukung lainnya'];
  const serviceName = serviceTypes[serviceType] || 'Layanan Desa';

  // Document upload functions
  const requestCameraPermission = async () => {
    const { status } = await Camera.Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const validateFileSize = (fileSize: number): boolean => {
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    return fileSize <= maxSize;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateDocumentId = (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString();
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        if (!validateFileSize(asset.fileSize || 0)) {
          Alert.alert(
            'File Too Large',
            `File size ${formatFileSize(asset.fileSize || 0)} exceeds 2MB limit.`
          );
          return;
        }

        const document: DocumentFile = {
          id: generateDocumentId(),
          name: `photo_${Date.now()}.jpg`,
          uri: asset.uri,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
        };

        setDocuments(prev => [...prev, document]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickDocument = async () => {
    try {
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newDocuments: DocumentFile[] = [];
        const oversizedFiles: string[] = [];

        for (const asset of result.assets) {
          if (!validateFileSize(asset.fileSize || 0)) {
            oversizedFiles.push(`${asset.fileName || 'Unknown'} (${formatFileSize(asset.fileSize || 0)})`);
            continue;
          }

          const document: DocumentFile = {
            id: generateDocumentId(),
            name: asset.fileName || `document_${Date.now()}.jpg`,
            uri: asset.uri,
            type: asset.type === 'image' ? 'image/jpeg' : (asset.type || 'image/jpeg'), // Fix MIME type
            size: asset.fileSize || 0,
          };

          newDocuments.push(document);
        }

        if (oversizedFiles.length > 0) {
          Alert.alert(
            'Some Files Too Large',
            `The following files exceed 2MB limit and were not added:\n${oversizedFiles.join('\n')}`
          );
        }

        if (newDocuments.length > 0) {
          setDocuments(prev => [...prev, ...newDocuments]);
        }
      }
    } catch (error) {
      console.error('Error picking documents:', error);
      Alert.alert('Error', 'Failed to select documents. Please try again.');
    }
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const showDocumentOptions = () => {
    Alert.alert(
      'Add Document',
      'Choose how you want to add a document',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
          style: 'default',
        },
        {
          text: 'Choose from Gallery',
          onPress: pickDocument,
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Upload documents to Supabase storage
  const uploadDocuments = async (userId: string, requestId: string): Promise<string[]> => {
    if (documents.length === 0) return [];

    // Test storage connectivity first
    const isStorageConnected = await testStorageConnectivity();
    if (!isStorageConnected) {
      console.error('❌ Storage connectivity test failed');
      throw new Error('Unable to connect to storage service. Please check your internet connection.');
    }

    setIsUploadingDocuments(true);
    const uploadedPaths: string[] = [];

    // Upload documents one by one instead of all at once to avoid network overload
    for (let index = 0; index < documents.length; index++) {
      const document = documents[index];
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`📤 Starting upload for document ${index + 1}/${documents.length}: ${document.name} (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Create file path for upload
          const fileExtension = document.name.split('.').pop() || 'jpg';
          const fileName = `${userId}/${requestId}/document_${index + 1}_${Date.now()}.${fileExtension}`;
          
          // For React Native, use the file URI directly with proper options
          console.log(`📁 Uploading to path: ${fileName}`);
          
          // Create upload options for React Native with enhanced content type detection
          let contentType = document.type;
          
          // Fix common MIME type issues
          if (contentType === 'image') {
            contentType = 'image/jpeg'; // Default to JPEG for generic 'image' type
          } else if (!contentType || contentType === 'undefined') {
            // Determine content type from file extension
            const fileExtension = document.name.split('.').pop()?.toLowerCase();
            switch (fileExtension) {
              case 'jpg':
              case 'jpeg':
                contentType = 'image/jpeg';
                break;
              case 'png':
                contentType = 'image/png';
                break;
              case 'pdf':
                contentType = 'application/pdf';
                break;
              default:
                contentType = 'image/jpeg'; // Safe default
            }
          }
          
          console.log(`🏷️ Using content type: ${contentType}`);
          
          const uploadOptions = {
            contentType: contentType,
            upsert: false
          };
          
          let uploadResult;
          
          // Try direct file upload using the URI (React Native method)
          try {
            // For React Native, we can upload the file directly using its URI
            const response = await fetch(document.uri);
            if (!response.ok) {
              throw new Error(`Failed to read file: ${response.status}`);
            }
            
            // Get the file data as ArrayBuffer (this works better than Blob in RN)
            const fileData = await response.arrayBuffer();
            
            console.log(`📄 File data size: ${fileData.byteLength} bytes`);
            
            // Upload using ArrayBuffer (more compatible with React Native)
            uploadResult = await supabase.storage
              .from('service-documents')
              .upload(fileName, fileData, uploadOptions);
              
          } catch (arrayBufferError) {
            console.warn(`⚠️ ArrayBuffer upload failed, trying alternative method:`, arrayBufferError);
            
            // Fallback: Try with Blob
            const response = await fetch(document.uri);
            const blob = await response.blob();
            
            uploadResult = await supabase.storage
              .from('service-documents')
              .upload(fileName, blob, uploadOptions);
          }

          if (uploadResult.error) {
            console.error(`❌ Storage upload error for ${document.name}:`, uploadResult.error);
            throw new Error(`Storage upload failed: ${uploadResult.error.message}`);
          }
          
          console.log(`✅ Successfully uploaded: ${document.name} to ${uploadResult.data.path}`);
          uploadedPaths.push(uploadResult.data.path);
          break; // Success, break out of retry loop
          
        } catch (error) {
          retryCount++;
          console.error(`❌ Attempt ${retryCount} failed for ${document.name}:`, error);
          
          if (retryCount >= maxRetries) {
            console.error(`❌ All ${maxRetries} attempts failed for ${document.name}`);
            setIsUploadingDocuments(false);
            throw new Error(`Failed to upload ${document.name} after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    setIsUploadingDocuments(false);
    console.log(`🎉 All documents uploaded successfully: ${uploadedPaths.length} files`);
    return uploadedPaths;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    let error = '';
    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Nama lengkap harus diisi';
        } else if (value.trim().length < 3) {
          error = 'Nama minimal 3 karakter';
        }
        break;
      case 'nik':
        if (!value.trim()) {
          error = 'NIK harus diisi';
        } else if (!/^[0-9]{16}$/.test(value)) {
          error = 'NIK harus 16 digit angka';
        }
        break;
      case 'phoneNumber':
        if (!value.trim()) {
          error = 'Nomor HP harus diisi';
        } else if (!/^(08|\+628)[0-9]{8,12}$/.test(value)) {
          error = 'Format nomor HP tidak valid';
        }
        break;
      case 'purpose':
        if (!value.trim()) {
          error = 'Keperluan/tujuan harus diisi';
        } else if (value.trim().length < 10) {
          error = 'Keperluan minimal 10 karakter';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors = {
      fullName: '',
      nik: '',
      phoneNumber: '',
      purpose: '',
    };
    
    let isValid = true;
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nama lengkap harus diisi';
      isValid = false;
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Nama minimal 3 karakter';
      isValid = false;
    }
    
    if (!formData.nik.trim()) {
      newErrors.nik = 'NIK harus diisi';
      isValid = false;
    } else if (!/^[0-9]{16}$/.test(formData.nik)) {
      newErrors.nik = 'NIK harus 16 digit angka';
      isValid = false;
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Nomor HP harus diisi';
      isValid = false;
    } else if (!/^(08|\+628)[0-9]{8,12}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Format nomor HP tidak valid (contoh: 08123456789)';
      isValid = false;
    }
    
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Keperluan/tujuan harus diisi';
      isValid = false;
    } else if (formData.purpose.trim().length < 10) {
      newErrors.purpose = 'Keperluan minimal 10 karakter';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) {
      const firstError = Object.values(newErrors).find(error => error);
      Alert.alert('Form Tidak Valid', firstError);
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create service request first
      const requestData = {
        full_name: formData.fullName,
        nik: formData.nik,
        phone_number: formData.phoneNumber,
        service_type: serviceType as Database['public']['Enums']['service_type'],
        user_id: user?.id || null,
        status: 'pending' as Database['public']['Enums']['request_status']
      };

      // Generate request number client-side as fallback
      const generateRequestNumber = () => {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const timestamp = Date.now().toString().slice(-4);
        return `REQ-${today}-${timestamp}`;
      };

      // Create the service request using Supabase directly
      const { data: request, error: requestError } = await supabase
        .from('service_requests')
        .insert({
          ...requestData,
          request_number: generateRequestNumber(),
        })
        .select('id, request_number')
        .single();

      if (requestError) throw requestError;

      // Upload documents if any
      if (documents.length > 0) {
        try {
          console.log(`📤 Starting upload of ${documents.length} documents...`);
          const uploaderUserId = user?.id || 'anonymous';
          const documentPaths = await uploadDocuments(uploaderUserId, request.id);
          
          // Update request with document paths
          const { error: updateError } = await supabase
            .from('service_requests')
            .update({ documents: { files: documentPaths } })
            .eq('id', request.id);

          if (updateError) {
            console.error('❌ Database update error:', updateError);
            throw updateError;
          }
          
          console.log('✅ Documents successfully linked to request');
        } catch (uploadError) {
          console.error('❌ Document upload failed:', uploadError);
          
          // Provide detailed error feedback to user
          const errorMessage = uploadError.message || 'Unknown upload error';
          
          Alert.alert(
            'Document Upload Failed',
            `Your request was created successfully (${request.request_number}), but document upload failed.\n\nError: ${errorMessage}\n\nYou can try uploading documents again later or contact support.`,
            [
              {
                text: 'Continue Without Documents',
                onPress: () => {
                  Alert.alert(
                    'Request Created Successfully',
                    `Your request ${request.request_number} has been submitted without documents. You will be contacted for further steps.`,
                    [{ text: 'OK', onPress: () => onSuccess(request.request_number) }]
                  );
                }
              },
              {
                text: 'Try Again',
                onPress: () => {
                  // Don't proceed, let user try uploading again
                  setIsSubmitting(false);
                }
              }
            ]
          );
          return; // Don't proceed to success
        }
      }
      
      Alert.alert(
        'Permohonan Berhasil',
        `Nomor permohonan: ${request.request_number}\n\nPermohonan Anda telah berhasil diajukan${documents.length > 0 ? ' dengan ' + documents.length + ' dokumen' : ''}. Silakan tunggu notifikasi selanjutnya.`,
        [
          {
            text: 'OK',
            onPress: () => onSuccess(request.request_number),
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
              Anda dapat mengupload dokumen sekarang atau nanti setelah permohonan disetujui.
            </Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Data Pemohon</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Lengkap *</Text>
            <TextInput
              style={[styles.textInput, errors.fullName ? styles.textInputError : null]}
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor="#9ca3af"
            />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NIK *</Text>
            <TextInput
              style={[styles.textInput, errors.nik ? styles.textInputError : null]}
              value={formData.nik}
              onChangeText={(value) => handleInputChange('nik', value)}
              placeholder="Masukkan NIK (16 digit)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={16}
            />
            {errors.nik ? <Text style={styles.errorText}>{errors.nik}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nomor HP *</Text>
            <TextInput
              style={[styles.textInput, errors.phoneNumber ? styles.textInputError : null]}
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder="Contoh: 081234567890"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
            {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Keperluan/Tujuan *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, errors.purpose ? styles.textInputError : null]}
              value={formData.purpose}
              onChangeText={(value) => handleInputChange('purpose', value)}
              placeholder="Jelaskan keperluan pengajuan surat ini"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.purpose ? <Text style={styles.errorText}>{errors.purpose}</Text> : null}
          </View>
        </View>

        {/* Document Upload Section */}
        <View style={styles.documentCard}>
          <Text style={styles.documentTitle}>Upload Dokumen (Opsional)</Text>
          <Text style={styles.documentSubtitle}>
            Maksimal 2MB per file. Format: JPG, PNG
          </Text>
          
          {/* Storage Test Button for debugging */}
          <StorageTestButton />
          
          {/* Add Document Button */}
          <TouchableOpacity 
            style={styles.addDocumentButton} 
            onPress={showDocumentOptions}
            activeOpacity={0.7}
          >
            <View style={styles.addDocumentContent}>
              <View style={styles.addDocumentIcon}>
                <Feather name="plus" size={20} color="#0891b2" />
              </View>
              <View style={styles.addDocumentText}>
                <Text style={styles.addDocumentTitle}>Tambah Dokumen</Text>
                <Text style={styles.addDocumentDesc}>Foto atau pilih dari galeri</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Document List */}
          {documents.length > 0 && (
            <View style={styles.documentList}>
              <Text style={styles.documentListTitle}>
                Dokumen Terpilih ({documents.length})
              </Text>
              {documents.map((document, index) => (
                <View key={document.id} style={styles.documentItem}>
                  <View style={styles.documentItemContent}>
                    <Image source={{ uri: document.uri }} style={styles.documentThumbnail} />
                    <View style={styles.documentItemInfo}>
                      <Text style={styles.documentItemName} numberOfLines={1}>
                        {document.name}
                      </Text>
                      <Text style={styles.documentItemSize}>
                        {formatFileSize(document.size)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => removeDocument(document.id)}
                    style={styles.removeDocumentButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Upload Progress */}
          {isUploadingDocuments && (
            <View style={styles.uploadProgress}>
              <ActivityIndicator size="small" color="#0891b2" />
              <Text style={styles.uploadProgressText}>Mengupload dokumen...</Text>
            </View>
          )}
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
          style={[styles.submitButton, (isSubmitting || isUploadingDocuments) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || isUploadingDocuments}
        >
          {isSubmitting || isUploadingDocuments ? (
            <>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.submitButtonText}>
                {isUploadingDocuments ? 'Mengupload...' : 'Mengirim...'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                Kirim Permohonan{documents.length > 0 ? ` (${documents.length} dokumen)` : ''}
              </Text>
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
  textInputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
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
  // Document Upload Styles
  documentCard: {
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
  documentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  documentSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addDocumentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addDocumentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addDocumentText: {
    flex: 1,
  },
  addDocumentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  addDocumentDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  documentList: {
    marginTop: 8,
  },
  documentListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  documentItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  documentItemInfo: {
    flex: 1,
  },
  documentItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  documentItemSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeDocumentButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    marginTop: 8,
  },
  uploadProgressText: {
    fontSize: 14,
    color: '#0891b2',
    marginLeft: 8,
    fontWeight: '500',
  },
});