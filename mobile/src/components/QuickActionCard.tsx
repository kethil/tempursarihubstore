import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface QuickActionCardProps {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.28; // Responsive width

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  icon,
  color,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    rotate.value = withSpring(-2);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    rotate.value = withSpring(0);
  };

  return (
    <Animated.View style={[animatedStyle, { width: CARD_WIDTH }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.card}>
          {/* Icon Background */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[color, `${color}90`]}
              style={styles.iconBackground}
            >
              <Feather name={icon} size={24} color="white" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {title}
          </Text>

          {/* Subtle indicator */}
          <View style={styles.indicatorContainer}>
            <View 
              style={[
                styles.indicator,
                { backgroundColor: color }
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
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
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 20,
  },
  indicatorContainer: {
    marginTop: 8,
    width: 32,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  indicator: {
    height: 4,
    borderRadius: 2,
    width: '60%',
  },
});