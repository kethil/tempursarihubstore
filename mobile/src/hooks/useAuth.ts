import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserProfile, UserProfile } from '../lib/supabase';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        Alert.alert('Error', error.message);
        return false;
      }
      
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        Alert.alert('Error', error.message);
        return false;
      }
      
      if (data.user && !data.session) {
        Alert.alert(
          'Verifikasi Email',
          'Silakan cek email Anda untuk melakukan verifikasi akun.'
        );
      }
      
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        Alert.alert('Error', error.message);
        return false;
      }
      
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'tempursari://reset-password',
      });
      
      if (error) {
        Alert.alert('Error', error.message);
        return false;
      }
      
      Alert.alert(
        'Reset Password',
        'Link reset password telah dikirim ke email Anda.'
      );
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      
      if (error) {
        Alert.alert('Error', error.message);
        return false;
      }
      
      // Reload profile
      await loadProfile(user.id);
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    isAuthenticated: !!session,
    isAdmin: profile?.role === 'admin',
  };
};