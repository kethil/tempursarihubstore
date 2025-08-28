import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

interface Order {
  id: string;
  orderNumber: string;
  type: 'layanan' | 'produk';
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  date: string;
  amount?: number;
}

interface ServiceRequest {
  id: string;
  requestNumber: string;
  serviceType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  date: string;
  description: string;
}

const PesananScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'services'>('orders');

  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      type: 'produk',
      title: 'Keripik Tempe Lokal, Kopi Arabika',
      status: 'completed',
      date: '2024-01-15',
      amount: 60000,
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      type: 'produk',
      title: 'Tas Anyaman Pandan',
      status: 'in_progress',
      date: '2024-01-18',
      amount: 75000,
    },
  ];

  const mockServiceRequests: ServiceRequest[] = [
    {
      id: '1',
      requestNumber: 'SRV-001',
      serviceType: 'Surat Keterangan Domisili',
      status: 'completed',
      date: '2024-01-10',
      description: 'Untuk keperluan administrasi bank',
    },
    {
      id: '2',
      requestNumber: 'SRV-002',
      serviceType: 'Surat Keterangan Usaha',
      status: 'in_progress',
      date: '2024-01-16',
      description: 'Untuk pengajuan kredit usaha mikro',
    },
    {
      id: '3',
      requestNumber: 'SRV-003',
      serviceType: 'Legalisir Dokumen',
      status: 'pending',
      date: '2024-01-19',
      description: 'Legalisir ijazah dan transkrip nilai',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in_progress':
        return '#06b6d4';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'in_progress':
        return 'Diproses';
      case 'pending':
        return 'Menunggu';
      case 'cancelled':
        return 'Dibatalkan';
      case 'rejected':
        return 'Ditolak';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleOrderPress = (order: Order) => {
    console.log(`Selected order: ${order.orderNumber}`);
    // TODO: Navigate to order detail
  };

  const handleServicePress = (service: ServiceRequest) => {
    console.log(`Selected service: ${service.requestNumber}`);
    // TODO: Navigate to service request detail
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
          <Text style={styles.headerTitle}>Pesanan & Layanan</Text>
          <Text style={styles.headerSubtitle}>Riwayat transaksi dan pengajuan</Text>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'orders' && styles.tabButtonActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Feather 
            name="shopping-bag" 
            size={18} 
            color={activeTab === 'orders' ? '#0891b2' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'orders' && styles.tabTextActive
          ]}>
            Pesanan Produk
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'services' && styles.tabButtonActive]}
          onPress={() => setActiveTab('services')}
        >
          <Feather 
            name="file-text" 
            size={18} 
            color={activeTab === 'services' ? '#0891b2' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'services' && styles.tabTextActive
          ]}>
            Layanan Desa
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'orders' ? (
          <View style={styles.listContainer}>
            {mockOrders.length > 0 ? (
              mockOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => handleOrderPress(order)}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusText(order.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.orderTitle} numberOfLines={2}>
                    {order.title}
                  </Text>

                  <View style={styles.orderFooter}>
                    <Text style={styles.orderAmount}>
                      {order.amount ? formatPrice(order.amount) : '-'}
                    </Text>
                    <Feather name="chevron-right" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Feather name="shopping-bag" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>Belum ada pesanan</Text>
                <Text style={styles.emptyStateSubtext}>
                  Pesanan produk Anda akan muncul di sini
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {mockServiceRequests.length > 0 ? (
              mockServiceRequests.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleServicePress(service)}
                  activeOpacity={0.7}
                >
                  <View style={styles.serviceHeader}>
                    <View>
                      <Text style={styles.serviceNumber}>{service.requestNumber}</Text>
                      <Text style={styles.serviceDate}>{formatDate(service.date)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(service.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(service.status) }]}>
                        {getStatusText(service.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.serviceType}>{service.serviceType}</Text>
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>

                  <View style={styles.serviceFooter}>
                    <Feather name="chevron-right" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Feather name="file-text" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>Belum ada pengajuan</Text>
                <Text style={styles.emptyStateSubtext}>
                  Pengajuan layanan desa Anda akan muncul di sini
                </Text>
              </View>
            )}
          </View>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#f0f9ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#0891b2',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  serviceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  serviceDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderTitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0891b2',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default PesananScreen;