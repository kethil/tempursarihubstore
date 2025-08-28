import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ServiceSelection } from '../components/ServiceSelection';
import { ServiceRequestForm } from '../components/ServiceRequestForm';
import { StatusTracker } from '../components/StatusTracker';

type ViewState = 'menu' | 'services' | 'form' | 'status';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

const LayananScreen: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');

  const services: ServiceItem[] = [
    {
      id: '1',
      title: 'Surat Keterangan Domisili',
      description: 'Pengajuan surat keterangan domisili untuk keperluan administrasi',
      icon: 'home',
      color: '#06b6d4',
    },
    {
      id: '2',
      title: 'Surat Keterangan Usaha',
      description: 'Pengajuan surat keterangan untuk keperluan usaha',
      icon: 'briefcase',
      color: '#10b981',
    },
    {
      id: '3',
      title: 'Surat Pengantar KTP',
      description: 'Surat pengantar untuk pembuatan atau perpanjangan KTP',
      icon: 'credit-card',
      color: '#f59e0b',
    },
    {
      id: '4',
      title: 'Lacak Status Permohonan',
      description: 'Cek status permohonan yang sudah diajukan',
      icon: 'search',
      color: '#ec4899',
    },
    {
      id: '5',
      title: 'Layanan Lainnya',
      description: 'Akses semua layanan administrasi desa',
      icon: 'grid',
      color: '#8b5cf6',
    },
  ];

  const handleServicePress = (service: ServiceItem) => {
    if (service.id === '1') {
      // Surat Keterangan Domisili
      setSelectedServiceType('surat_keterangan_domisili');
      setCurrentView('form');
    } else if (service.id === '2') {
      // Surat Keterangan Usaha  
      setSelectedServiceType('surat_keterangan_usaha');
      setCurrentView('form');
    } else if (service.id === '3') {
      // Surat Pengantar KTP
      setSelectedServiceType('surat_pengantar_ktp');
      setCurrentView('form');
    } else if (service.id === '4') {
      // Track status
      setCurrentView('status');
    } else if (service.id === '5') {
      // Show all services
      setCurrentView('services');
    }
  };

  const handleServiceSelect = (serviceType: string) => {
    setSelectedServiceType(serviceType);
    setCurrentView('form');
  };

  const handleFormSuccess = (requestNumber: string) => {
    setCurrentView('menu');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
  };

  const handleBackToServices = () => {
    setCurrentView('services');
  };

  const ServiceCard: React.FC<{ service: ServiceItem }> = ({ service }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    const handlePressIn = () => {
      scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => handleServicePress(service)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <View style={styles.serviceContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${service.color}20` }]}>
              <Feather name={service.icon} size={24} color={service.color} />
            </View>
            
            <View style={styles.serviceText}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </View>

            <Feather name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderMainMenu = () => (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0891b2', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Layanan Desa</Text>
          <Text style={styles.headerSubtitle}>Ajukan permohonan surat dan dokumen online</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.servicesContainer}>
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Feather name="info" size={20} color="#0891b2" />
            <Text style={styles.infoText}>
              Sekarang Anda dapat mengajukan permohonan surat secara online. Pilih layanan di atas, isi formulir, dan tunggu notifikasi persetujuan untuk mengambil dokumen di kantor desa.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Render different views based on current state
  switch (currentView) {
    case 'services':
      return (
        <ServiceSelection
          onServiceSelect={handleServiceSelect}
          onBack={handleBackToMenu}
        />
      );
    
    case 'form':
      return (
        <ServiceRequestForm
          serviceType={selectedServiceType}
          onBack={currentView === 'form' && selectedServiceType ? handleBackToServices : handleBackToMenu}
          onSuccess={handleFormSuccess}
        />
      );

    case 'status':
      return (
        <StatusTracker
          onBack={handleBackToMenu}
        />
      );
    
    default:
      return renderMainMenu();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  servicesContainer: {
    padding: 20,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceText: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  infoSection: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default LayananScreen;