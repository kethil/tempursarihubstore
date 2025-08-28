import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

interface InfoItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  action?: () => void;
}

const InformasiScreen: React.FC = () => {
  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleLocationPress = () => {
    const address = 'Desa Tempursari, Kecamatan Tempurejo, Kabupaten Jember';
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const informationItems: InfoItem[] = [
    {
      id: '1',
      title: 'Profil Desa',
      description: 'Informasi lengkap tentang sejarah dan profil Desa Tempursari',
      icon: 'info',
      color: '#06b6d4',
    },
    {
      id: '2',
      title: 'Struktur Organisasi',
      description: 'Struktur pemerintahan dan organisasi desa',
      icon: 'users',
      color: '#10b981',
    },
    {
      id: '3',
      title: 'Program Desa',
      description: 'Program-program pembangunan dan pemberdayaan masyarakat',
      icon: 'target',
      color: '#f59e0b',
    },
    {
      id: '4',
      title: 'Berita & Pengumuman',
      description: 'Berita terkini dan pengumuman penting dari desa',
      icon: 'bell',
      color: '#8b5cf6',
    },
    {
      id: '5',
      title: 'Galeri Foto',
      description: 'Dokumentasi kegiatan dan foto-foto desa',
      icon: 'camera',
      color: '#ec4899',
    },
    {
      id: '6',
      title: 'Kontak & Lokasi',
      description: 'Informasi kontak dan lokasi kantor desa',
      icon: 'map-pin',
      color: '#06b6d4',
    },
  ];

  const contactInfo = [
    {
      label: 'Telepon',
      value: '(0331) 123456',
      icon: 'phone' as const,
      action: () => handlePhonePress('0331123456'),
    },
    {
      label: 'Email',
      value: 'info@tempursari.desa.id',
      icon: 'mail' as const,
      action: () => handleEmailPress('info@tempursari.desa.id'),
    },
    {
      label: 'Alamat',
      value: 'Jl. Raya Tempursari No. 123\nKec. Tempurejo, Kab. Jember',
      icon: 'map-pin' as const,
      action: handleLocationPress,
    },
  ];

  const handleInfoPress = (item: InfoItem) => {
    console.log(`Selected info: ${item.title}`);
    // TODO: Navigate to specific information page
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0891b2', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Informasi Desa</Text>
          <Text style={styles.headerSubtitle}>Semua tentang Desa Tempursari</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Information Items */}
        <View style={styles.infoContainer}>
          {informationItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.infoCard}
              onPress={() => handleInfoPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.infoContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                  <Feather name={item.icon} size={24} color={item.color} />
                </View>
                
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>{item.title}</Text>
                  <Text style={styles.infoDescription}>{item.description}</Text>
                </View>

                <Feather name="chevron-right" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Kontak Desa</Text>
          
          {contactInfo.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={contact.action}
              activeOpacity={0.7}
            >
              <View style={styles.contactContent}>
                <View style={styles.contactIconContainer}>
                  <Feather name={contact.icon} size={20} color="#0891b2" />
                </View>
                
                <View style={styles.contactText}>
                  <Text style={styles.contactLabel}>{contact.label}</Text>
                  <Text style={styles.contactValue}>{contact.value}</Text>
                </View>

                <Feather name="external-link" size={16} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Village Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Data Desa</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>2,847</Text>
              <Text style={styles.statLabel}>Penduduk</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>892</Text>
              <Text style={styles.statLabel}>KK</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>RT/RW</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>450</Text>
              <Text style={styles.statLabel}>Ha Luas</Text>
            </View>
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
  infoContainer: {
    padding: 20,
  },
  infoCard: {
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
  infoContent: {
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
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  contactSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactText: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 18,
  },
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0891b2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default InformasiScreen;