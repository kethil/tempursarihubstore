import React from 'react';
import { View, Text, TouchableOpacity, Image, ImageBackground, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface NewsCardProps {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  location: string;
  onPress?: () => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  title,
  excerpt,
  image,
  category,
  date,
  location,
  onPress,
}) => {
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
      'Infrastruktur': '#0891b2',
      'Kesehatan': '#10b981',
      'Budaya': '#8b5cf6',
      'Pendidikan': '#f59e0b',
      'Ekonomi': '#ec4899',
      'Sosial': '#ef4444',
    };
    return colors[category] || '#6b7280';
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.card}>
          {/* Image Section */}
          <View style={styles.imageContainer}>
            <ImageBackground
              source={{ uri: image }}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              {/* Gradient Overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.gradientOverlay}
              />
              
              {/* Category Badge */}
              <View style={styles.categoryContainer}>
                <View 
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(category) }
                  ]}
                >
                  <Text style={styles.categoryText}>
                    {category}
                  </Text>
                </View>
              </View>

              {/* Title Overlay */}
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>
                  {title}
                </Text>
              </View>
            </ImageBackground>
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            {/* Excerpt */}
            <Text style={styles.excerpt}>
              {excerpt}
            </Text>

            {/* Metadata */}
            <View style={styles.metadataContainer}>
              <View style={styles.metadataContent}>
                <Feather name="clock" size={14} color="#6b7280" />
                <Text style={styles.metadataText}>
                  {date}
                </Text>
                
                <Feather name="map-pin" size={14} color="#6b7280" style={styles.mapIcon} />
                <Text style={[styles.metadataText, styles.locationText]} numberOfLines={1}>
                  {location}
                </Text>
              </View>

              {/* Read More Button */}
              <TouchableOpacity 
                style={styles.readMoreButton}
                onPress={onPress}
              >
                <View style={styles.readMoreContent}>
                  <Text style={styles.readMoreText}>
                    Baca
                  </Text>
                  <Feather name="arrow-right" size={12} color="#0891b2" />
                </View>
              </TouchableOpacity>
            </View>
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
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    height: 192,
    position: 'relative',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoryContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  titleContainer: {
    padding: 16,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
  },
  contentContainer: {
    padding: 16,
  },
  excerpt: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metadataContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metadataText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
    marginRight: 16,
  },
  mapIcon: {
    marginLeft: 0,
  },
  locationText: {
    flex: 1,
    marginRight: 0,
  },
  readMoreButton: {
    marginLeft: 16,
  },
  readMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    color: '#0891b2',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
});