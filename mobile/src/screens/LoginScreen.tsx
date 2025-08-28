import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

interface LoginScreenProps {
  onSuccess?: () => void;
  onSignUpPress?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onSignUpPress }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Silakan isi email dan password');
      return;
    }

    const success = await signIn(email.trim(), password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={['#0891b2', '#0e7490', '#164e63']}
            style={styles.header}
          >
            <View>
              <Text style={styles.welcomeText}>
                Selamat Datang
              </Text>
              <Text style={styles.subtitleText}>
                Masuk ke Portal Desa Tempursari
              </Text>
            </View>
          </LinearGradient>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                Masuk Akun
              </Text>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Email
                </Text>
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Password
                </Text>
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Feather 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color="#9ca3af" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                onPress={handleLogin}
                disabled={loading}
                style={styles.loginButtonContainer}
              >
                <LinearGradient
                  colors={['#06b6d4', '#0891b2']}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Memuat...' : 'Masuk'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>
                  Lupa Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>
                Belum punya akun? 
              </Text>
              <TouchableOpacity onPress={onSignUpPress}>
                <Text style={styles.signUpLink}>
                  Daftar Sekarang
                </Text>
              </TouchableOpacity>
            </View>

            {/* Guest Login */}
            <View style={styles.guestContainer}>
              <TouchableOpacity 
                onPress={onSuccess}
                style={styles.guestButton}
              >
                <Text style={styles.guestText}>
                  Masuk sebagai Tamu
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
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
    marginBottom: 24,
  },
  formTitle: {
    color: '#1f2937',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    color: '#1f2937',
    fontSize: 16,
  },
  eyeButton: {
    marginLeft: 8,
  },
  loginButtonContainer: {
    marginBottom: 16,
  },
  loginButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  forgotText: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signUpLink: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  guestContainer: {
    marginTop: 24,
  },
  guestButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  guestText: {
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoginScreen;