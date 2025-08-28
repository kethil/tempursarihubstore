import React, { useState } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from './screens/HomeScreen';
import LayananScreen from './screens/LayananScreen';
import TokoScreen from './screens/TokoScreen';
import InformasiScreen from './screens/InformasiScreen';
import PesananScreen from './screens/PesananScreen';
import LoginScreen from './screens/LoginScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { useAuth } from './hooks/useAuth';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';

const MainApp: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated } = useAuth();
  const { activeTab, setActiveTab } = useNavigation();

  const handleTabPress = (tabId: string) => {
    // Check if login is required for certain tabs (only pesanan now)
    if (['pesanan'].includes(tabId) && !isAuthenticated) {
      setShowLogin(true);
      return;
    }
    
    setActiveTab(tabId);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  // Show login screen if requested
  if (showLogin) {
    return (
      <LoginScreen 
        onSuccess={handleLoginSuccess}
        onSignUpPress={() => console.log('Navigate to Sign Up')}
      />
    );
  }

  // Render the appropriate screen based on active tab
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'layanan':
        return <LayananScreen />;
      case 'toko':
        return <TokoScreen />;
      case 'informasi':
        return <InformasiScreen />;
      case 'pesanan':
        return <PesananScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0891b2" barStyle="light-content" />
      
      {/* Main Content */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </View>
  );
};

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <NavigationProvider>
        <MainApp />
      </NavigationProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});

export default App;