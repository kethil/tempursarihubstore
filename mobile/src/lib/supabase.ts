import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';

const SUPABASE_URL = "https://vncabxtxbiqaoluxprlh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuY2FieHR4YmlxYW9sdXhwcmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzIwMjIsImV4cCI6MjA3MTE0ODAyMn0.ZSlrYhAk5knNObHlLeAp4001R-nHeXNtSLo2lh04hrA";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Extended user type with role information
export type UserProfile = {
  id: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'operator' | null;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
};

// Function to get user profile with role
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Function to check if user is admin
export const isAdmin = async (userId: string): Promise<boolean> => {
  const profile = await getUserProfile(userId);
  return profile?.role === 'admin';
};

// Function to check if user is authorized for the dashboard (admin only)
export const isAuthorized = async (userId: string): Promise<boolean> => {
  const profile = await getUserProfile(userId);
  return profile?.role === 'admin';
};

// Function to test storage connectivity
export const testStorageConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Supabase storage connectivity...');
    
    // First check authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth status:', user ? `Authenticated as ${user.email}` : 'Anonymous user');
    
    if (authError) {
      console.warn('⚠️ Auth check error:', authError);
    }
    
    // Try to list buckets to test connectivity
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Storage listBuckets failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Try alternative approach - directly test the service-documents bucket
      console.log('🔄 Trying alternative approach - testing bucket directly...');
      
      const { data: bucketTest, error: bucketError } = await supabase.storage
        .from('service-documents')
        .list('', { limit: 1 });
        
      if (bucketError) {
        console.error('❌ Direct bucket test also failed:', bucketError);
        return false;
      } else {
        console.log('✅ Direct bucket test succeeded - bucket exists!');
        return true;
      }
    }
    
    console.log('✅ Storage connectivity test passed. Available buckets:', data?.map(b => b.name) || []);
    
    // Check if service-documents bucket exists
    const serviceDocsBucket = data?.find(bucket => bucket.name === 'service-documents');
    if (!serviceDocsBucket) {
      console.warn('⚠️ service-documents bucket not found in bucket list!');
      
      // Try direct bucket access as fallback
      console.log('🔄 Testing direct bucket access...');
      const { data: bucketTest, error: bucketError } = await supabase.storage
        .from('service-documents')
        .list('', { limit: 1 });
        
      if (bucketError) {
        console.error('❌ Direct bucket access failed:', bucketError);
        return false;
      } else {
        console.log('✅ Direct bucket access succeeded - bucket is accessible!');
        
        // Now test actual upload to diagnose the upload issue
        return await testAnonymousUpload();
      }
    }
    
    console.log('✅ service-documents bucket found and accessible');
    return await testAnonymousUpload();
  } catch (error) {
    console.error('❌ Storage connectivity test error:', error);
    return false;
  }
};

// Test anonymous upload to diagnose upload issues
const testAnonymousUpload = async (): Promise<boolean> => {
  try {
    console.log('📤 Testing anonymous upload permissions...');
    
    // Create a simple test file using string content (this works!)
    const testFileName = `test-upload-${Date.now()}.txt`;
    const testContent = 'test upload content'; // Use string instead of Blob
    
    // Try uploading to anonymous folder structure
    const anonymousPath = `anonymous/test-request-${Date.now()}/${testFileName}`;
    
    console.log('📁 Attempting upload to path:', anonymousPath);
    
    // First try: Upload with string content (this should work)
    let uploadResult = await supabase.storage
      .from('service-documents')
      .upload(anonymousPath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadResult.error) {
      console.error('❌ Anonymous upload failed:', {
        message: uploadResult.error.message,
        statusCode: uploadResult.error.statusCode,
        details: uploadResult.error.details,
        hint: uploadResult.error.hint
      });
      
      // Try different path structures
      console.log('🔄 Trying simplified path structure...');
      const simplePath = `anonymous/${testFileName}`;
      
      uploadResult = await supabase.storage
        .from('service-documents')
        .upload(simplePath, testContent, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadResult.error) {
        console.error('❌ Simplified path upload also failed:', {
          message: uploadResult.error.message,
          statusCode: uploadResult.error.statusCode,
          details: uploadResult.error.details,
          hint: uploadResult.error.hint
        });
        
        // Try the most basic upload possible
        console.log('🔄 Trying most basic upload...');
        const basicPath = testFileName;
        
        uploadResult = await supabase.storage
          .from('service-documents')
          .upload(basicPath, testContent, {
            contentType: 'text/plain'
          });
          
        if (uploadResult.error) {
          console.error('❌ Basic upload also failed:', {
            message: uploadResult.error.message,
            statusCode: uploadResult.error.statusCode,
            details: uploadResult.error.details,
            hint: uploadResult.error.hint
          });
          
          // Final attempt: Try with different content type
          console.log('🔄 Trying with different content type...');
          
          uploadResult = await supabase.storage
            .from('service-documents')
            .upload(`final-test-${Date.now()}.txt`, testContent, {
              contentType: 'text/plain'
            });
            
          if (uploadResult.error) {
            console.error('❌ Final attempt failed:', uploadResult.error);
            return false;
          }
        }
      }
    }
    
    console.log('✅ Upload test succeeded!', uploadResult.data);
    
    // Clean up test file if upload succeeded
    if (uploadResult.data && uploadResult.data.path) {
      const cleanupResult = await supabase.storage
        .from('service-documents')
        .remove([uploadResult.data.path]);
      
      if (cleanupResult.error) {
        console.warn('⚠️ Failed to clean up test file:', cleanupResult.error);
      } else {
        console.log('✅ Test file cleaned up successfully');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Upload test error:', error);
    return false;
  }
};