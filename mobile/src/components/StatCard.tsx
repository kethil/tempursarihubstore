import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  trend?: number;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  onPress,
}) => {
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

  const getTrendColor = (trend?: number) => {
    if (!trend) return '#6b7280';
    return trend > 0 ? '#10b981' : '#ef4444';
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return 'minus';
    return trend > 0 ? 'trending-up' : 'trending-down';
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={!onPress}
      >
        <View style={styles.card}>
          {/* Icon Background */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[color, `${color}80`]}
              style={styles.iconBackground}
            >
              <Feather name={icon} size={20} color="white" />
            </LinearGradient>
          </View>

          {/* Value */}
          <Text style={styles.value}>
            {value}
          </Text>

          {/* Title */}
          <Text style={styles.title}>
            {title}
          </Text>

          {/* Trend Indicator */}
          {trend !== undefined && (
            <View style={styles.trendContainer}>
              <Feather 
                name={getTrendIcon(trend)} 
                size={12} 
                color={getTrendColor(trend)} 
              />
              <Text 
                style={[
                  styles.trendText,
                  { color: getTrendColor(trend) }
                ]}
              >
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
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
    minWidth: 150,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});