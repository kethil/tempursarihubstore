import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface TabItem {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    route: 'HomeScreen',
  },
  {
    id: 'layanan',
    label: 'Layanan',
    icon: 'grid',
    route: 'LayananScreen',
  },
  {
    id: 'toko',
    label: 'Toko',
    icon: 'shopping-bag',
    route: 'TokoScreen',
  },
  {
    id: 'informasi',
    label: 'Informasi',
    icon: 'info',
    route: 'InformasiScreen',
  },
  {
    id: 'pesanan',
    label: 'Pesanan',
    icon: 'package',
    route: 'PesananScreen',
  },
];

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isActive, onPress }) => {
  const scale = useSharedValue(1);
  const dotScale = useSharedValue(isActive ? 1 : 0);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const dotAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: dotScale.value }],
    };
  });

  React.useEffect(() => {
    dotScale.value = withSpring(isActive ? 1 : 0);
  }, [isActive]);

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.tabButton, buttonAnimatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Feather
            name={tab.icon}
            size={22}
            color={isActive ? '#0891b2' : '#9ca3af'}
          />
          
          {/* Active Indicator Dot */}
          <Animated.View
            style={[styles.activeDot, dotAnimatedStyle]}
          />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.label,
            { color: isActive ? '#0891b2' : '#6b7280' }
          ]}
        >
          {tab.label}
        </Text>

        {/* Active Background */}
        {isActive && (
          <Animated.View
            style={styles.activeBackground}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Gradient Line */}
        <LinearGradient
          colors={['#06b6d4', '#0891b2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientLine}
        />
        
        {/* Tab Container */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onPress={() => onTabPress(tab.id)}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  gradientLine: {
    height: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: '#0891b2',
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    zIndex: -1,
  },
});