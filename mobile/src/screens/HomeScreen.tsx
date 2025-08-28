import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { StatCard } from '../components/StatCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { NewsCard } from '../components/NewsCard';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../contexts/NavigationContext';

interface StatData {
  id: string;
  title: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  trend?: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
}

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  location: string;
}

const HomeScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { navigateToTab } = useNavigation();

  // Load initial data
  useEffect(() => {
    loadData();
    checkUser();
  }, []);

  // Check if user is logged in
  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  // Load dashboard data
  const loadData = async () => {
    try {
      setLoading(true);
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Generate stats data for display
  const getStatsData = (): StatData[] => {
    return [
      {
        id: '1',
        title: 'Total Penduduk',
        value: '2,450',
        icon: 'users',
        color: '#06b6d4',
        trend: 2.5,
      },
      {
        id: '2',
        title: 'Layanan Aktif',
        value: '12',
        icon: 'activity',
        color: '#10b981',
        trend: 12.3,
      },
      {
        id: '3',
        title: 'Pengajuan Baru',
        value: '8',
        icon: 'file-plus',
        color: '#f59e0b',
        trend: -5.2,
      },
      {
        id: '4',
        title: 'Selesai Hari Ini',
        value: '15',
        icon: 'check-circle',
        color: '#8b5cf6',
        trend: 18.7,
      },
    ];
  };

  // Quick actions with real functionality
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Surat Keterangan',
      icon: 'file-text',
      color: '#06b6d4',
      onPress: () => handleServiceRequest('surat_keterangan'),
    },
    {
      id: '2',
      title: 'Surat Pengantar',
      icon: 'send',
      color: '#10b981',
      onPress: () => handleServiceRequest('surat_pengantar'),
    },
    {
      id: '3',
      title: 'Surat Domisili',
      icon: 'home',
      color: '#f59e0b',
      onPress: () => handleServiceRequest('surat_domisili'),
    },
    {
      id: '4',
      title: 'E-Commerce',
      icon: 'shopping-bag',
      color: '#ec4899',
      onPress: () => navigateToTab('toko'),
    },
  ];

  // Handle service request creation
  const handleServiceRequest = (serviceType: string) => {
    // Navigate to layanan tab for service requests (no login required)
    navigateToTab('layanan');
  };

  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'Pembangunan Jembatan Baru',
      excerpt: 'Pembangunan jembatan penghubung antar desa dimulai tahun depan.',
      image: 'https://via.placeholder.com/300x200',
      category: 'Infrastruktur',
      date: '2024-01-20',
      location: 'Desa Tempursari',
    },
    {
      id: '2',
      title: 'Program Bantuan Sosial',
      excerpt: 'Distribusi bantuan sosial untuk keluarga kurang mampu.',
      image: 'https://via.placeholder.com/300x200',
      category: 'Sosial',
      date: '2024-01-18',
      location: 'Kantor Desa',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0891b2" barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#0891b2', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Selamat Datang!</Text>
            <Text style={styles.subtitle}>Desa Tempursari</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Feather name="bell" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistik Desa</Text>
          <View style={styles.statsGrid}>
            {getStatsData().map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                trend={stat.trend}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Layanan Cepat</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.id}
                title={action.title}
                icon={action.icon}
                color={action.color}
                onPress={action.onPress}
              />
            ))}
          </View>
        </View>

        {/* News & Updates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Berita & Informasi</Text>
            <TouchableOpacity onPress={() => navigateToTab('informasi')}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          {mockNews.map((news) => (
            <NewsCard
              key={news.id}
              title={news.title}
              excerpt={news.excerpt}
              image={news.image}
              category={news.category}
              date={news.date}
              location={news.location}
              onPress={() => console.log('Navigate to news:', news.id)}
            />
          ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  notificationButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0891b2',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

export default HomeScreen;