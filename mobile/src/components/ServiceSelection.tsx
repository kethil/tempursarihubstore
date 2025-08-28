import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface Service {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  category: string;
  requirements: string[];
  processingTime: string;
  color: string;
}

interface ServiceSelectionProps {
  onServiceSelect: (serviceType: string) => void;
  onBack: () => void;
}

const services: Service[] = [
  {
    id: 'surat_pengantar_ktp',
    type: 'surat_pengantar_ktp',
    title: 'Surat Pengantar KTP',
    description: 'Surat pengantar untuk pembuatan KTP baru atau penggantian',
    icon: 'file-text',
    category: 'Kependudukan',
    requirements: ['KTP lama (jika ada)', 'Kartu Keluarga', 'Pas foto 3x4'],
    processingTime: '1-2 hari kerja',
    color: '#0891b2',
  },
  {
    id: 'surat_keterangan_domisili',
    type: 'surat_keterangan_domisili',
    title: 'Surat Keterangan Domisili',
    description: 'Surat keterangan tempat tinggal/domisili',
    icon: 'home',
    category: 'Kependudukan',
    requirements: ['KTP', 'Kartu Keluarga', 'Bukti tempat tinggal'],
    processingTime: '1 hari kerja',
    color: '#06b6d4',
  },
  {
    id: 'surat_keterangan_usaha',
    type: 'surat_keterangan_usaha',
    title: 'Surat Keterangan Usaha',
    description: 'Surat keterangan untuk keperluan usaha/bisnis',
    icon: 'briefcase',
    category: 'Ekonomi',
    requirements: ['KTP', 'Foto tempat usaha', 'Izin usaha (jika ada)'],
    processingTime: '2-3 hari kerja',
    color: '#10b981',
  },
  {
    id: 'surat_keterangan_tidak_mampu',
    type: 'surat_keterangan_tidak_mampu',
    title: 'Surat Keterangan Tidak Mampu',
    description: 'Surat keterangan untuk keperluan beasiswa atau bantuan',
    icon: 'heart',
    category: 'Sosial',
    requirements: ['KTP', 'Kartu Keluarga', 'Bukti penghasilan'],
    processingTime: '2-3 hari kerja',
    color: '#ec4899',
  },
  {
    id: 'surat_keterangan_belum_menikah',
    type: 'surat_keterangan_belum_menikah',
    title: 'Surat Keterangan Belum Menikah',
    description: 'Surat keterangan status belum menikah',
    icon: 'users',
    category: 'Kependudukan',
    requirements: ['KTP', 'Kartu Keluarga'],
    processingTime: '1 hari kerja',
    color: '#8b5cf6',
  },
  {
    id: 'surat_pengantar_nikah',
    type: 'surat_pengantar_nikah',
    title: 'Surat Pengantar Nikah',
    description: 'Surat pengantar untuk keperluan pernikahan',
    icon: 'heart',
    category: 'Kependudukan',
    requirements: ['KTP', 'Kartu Keluarga', 'Pas foto berdua'],
    processingTime: '2-3 hari kerja',
    color: '#f59e0b',
  },
  {
    id: 'surat_keterangan_kematian',
    type: 'surat_keterangan_kematian',
    title: 'Surat Keterangan Kematian',
    description: 'Surat keterangan kematian untuk keperluan administrasi',
    icon: 'file-text',
    category: 'Kependudukan',
    requirements: ['KTP pelapor', 'KTP almarhum', 'Surat keterangan dokter'],
    processingTime: '1 hari kerja',
    color: '#6b7280',
  },
  {
    id: 'surat_keterangan_kelahiran',
    type: 'surat_keterangan_kelahiran',
    title: 'Surat Keterangan Kelahiran',
    description: 'Surat keterangan kelahiran untuk pembuatan akta kelahiran',
    icon: 'user-plus',
    category: 'Kependudukan',
    requirements: ['KTP orangtua', 'Kartu Keluarga', 'Surat keterangan dokter'],
    processingTime: '1-2 hari kerja',
    color: '#06b6d4',
  },
];

const ServiceCard: React.FC<{ service: Service; onPress: () => void }> = ({ service, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Kependudukan': '#0891b2',
      'Ekonomi': '#10b981',
      'Sosial': '#ec4899',
      'Kesehatan': '#f59e0b',
    };
    return colors[category] || '#6b7280';
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.serviceHeader}>
          <View style={[styles.serviceIcon, { backgroundColor: `${service.color}20` }]}>
            <Feather name={service.icon} size={24} color={service.color} />
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(service.category) }]}>
            <Text style={styles.categoryText}>{service.category}</Text>
          </View>
        </View>

        <View style={styles.serviceContent}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
        </View>

        <View style={styles.serviceFooter}>
          <View style={styles.requirementsContainer}>
            <Feather name="file" size={14} color="#6b7280" />
            <Text style={styles.requirementsText}>
              {service.requirements.length} dokumen diperlukan
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Feather name="clock" size={14} color="#6b7280" />
            <Text style={styles.timeText}>{service.processingTime}</Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Text style={styles.actionText}>Ajukan Sekarang</Text>
          <Feather name="arrow-right" size={16} color={service.color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ServiceSelection: React.FC<ServiceSelectionProps> = ({ onServiceSelect, onBack }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#0891b2" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pilih Layanan</Text>
          <Text style={styles.headerSubtitle}>Pilih jenis layanan yang ingin Anda ajukan</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onPress={() => onServiceSelect(service.type)}
          />
        ))}
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
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  serviceContent: {
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  requirementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requirementsText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
    marginRight: 8,
  },
});