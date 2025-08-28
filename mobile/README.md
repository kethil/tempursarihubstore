# 🏘️ Tempursari Village Portal App

A modern, beautiful React Native mobile application for village portal services with stunning UI/UX design.

## ✨ Features

### 🎨 Modern UI Design
- **Soft gradients** (teal → blue, cyan → indigo) for headers and buttons
- **Rounded cards** with shadows for all components
- **Consistent iconography** using Feather icons
- **Clean typography** with Inter/Poppins fonts
- **Generous spacing** and modern layouts
- **Subtle animations** with React Native Reanimated

### 📱 Core Functionality
- **Dashboard Home Screen** with statistics, quick actions, and news
- **5-Tab Bottom Navigation** (Home, Layanan, Toko, Informasi, Pesanan)
- **Responsive design** that adapts to different screen sizes
- **Reusable components** for maintainable code

### 🧩 Components Included
- `StatCard` - Display statistics with trend indicators
- `QuickActionCard` - Horizontal scrollable action buttons
- `NewsCard` - Large image cards with metadata
- `BottomNavigation` - 5-tab navigation with animations

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- React Native development environment

### Installation

1. **Navigate to the mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Expo CLI (if not already installed):**
   ```bash
   npm install -g @expo/cli
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

## 🛠️ Technology Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **NativeWind** (Tailwind CSS for React Native)
- **React Native Reanimated** for animations
- **Expo Linear Gradient** for gradient effects
- **React Navigation** for navigation
- **Expo Vector Icons** (Feather icons)

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   ├── StatCard.tsx
│   │   ├── QuickActionCard.tsx
│   │   ├── NewsCard.tsx
│   │   └── BottomNavigation.tsx
│   ├── screens/
│   │   └── HomeScreen.tsx
│   └── App.tsx
├── package.json
├── tailwind.config.js
├── babel.config.js
└── README.md
```

## 🎨 Design Features

### Color Palette
- **Primary**: Cyan/Teal (`#06b6d4`, `#0891b2`)
- **Secondary**: Gray shades for text and backgrounds
- **Accent**: Green (`#10b981`) for success states
- **Supporting**: Purple, Orange, Pink for categories

### Components Overview

#### StatCard
- Displays statistics with gradient icon backgrounds
- Trend indicators with up/down arrows
- Smooth press animations
- Customizable colors

#### QuickActionCard
- Horizontal scrollable action buttons
- Gradient backgrounds for icons
- Responsive sizing
- Touch feedback animations

#### NewsCard
- Large image backgrounds with overlays
- Category badges with dynamic colors
- Metadata display (date, location)
- Read more functionality

#### BottomNavigation
- 5-tab navigation with smooth transitions
- Active state indicators
- Icon-based navigation
- Gradient accent line

## 🔧 Customization

### Adding New Tabs
Edit the `tabs` array in `BottomNavigation.tsx`:

```typescript
const tabs: TabItem[] = [
  {
    id: 'new-tab',
    label: 'New Tab',
    icon: 'plus', // Feather icon name
    route: 'NewScreen',
  },
  // ... existing tabs
];
```

### Changing Colors
Update the color scheme in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#your-primary-color',
    600: '#your-darker-primary',
  },
}
```

### Adding Animations
Use React Native Reanimated for custom animations:

```typescript
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));
```

## 📱 Screenshots

*Add screenshots of your app here*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for Desa Tempursari using modern React Native practices.