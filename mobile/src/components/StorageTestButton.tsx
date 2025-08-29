import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { testStorageConnectivity, supabase } from '../lib/supabase';

export const StorageTestButton: React.FC = () => {
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runStorageTest = async () => {
    setIsTestingStorage(true);
    setTestResult(null);
    
    try {
      console.log('🔍 Running comprehensive storage test...');
      
      // Test 1: Basic connectivity
      const isConnected = await testStorageConnectivity();
      if (!isConnected) {
        throw new Error('Storage connectivity test failed');
      }
      
      // Test 2: Try to upload a small test file
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `test/connectivity_test_${Date.now()}.txt`;
      
      console.log('📤 Testing file upload...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('service-documents')
        .upload(testFileName, testBlob, {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (uploadError) {
        throw new Error(`Upload test failed: ${uploadError.message}`);
      }
      
      console.log('✅ Upload test successful:', uploadData.path);
      
      // Test 3: Try to delete the test file
      const { error: deleteError } = await supabase.storage
        .from('service-documents')
        .remove([testFileName]);
      
      if (deleteError) {
        console.warn('⚠️ Delete test failed (not critical):', deleteError.message);
      } else {
        console.log('✅ Delete test successful');
      }
      
      setTestResult('✅ All storage tests passed! Document upload should work.');
      Alert.alert(
        'Storage Test Passed',
        'Storage connectivity is working properly. Document upload should work now.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Storage test failed:', error);
      const errorMsg = `❌ Storage test failed: ${error.message}`;
      setTestResult(errorMsg);
      Alert.alert(
        'Storage Test Failed',
        `Storage test failed: ${error.message}\n\nThis might explain why document upload is not working.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingStorage(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.testButton, isTestingStorage && styles.testButtonDisabled]}
        onPress={runStorageTest}
        disabled={isTestingStorage}
        activeOpacity={0.7}
      >
        <Feather 
          name={isTestingStorage ? "loader" : "wifi"} 
          size={20} 
          color="#ffffff" 
          style={isTestingStorage ? styles.spinning : undefined}
        />
        <Text style={styles.testButtonText}>
          {isTestingStorage ? 'Testing Storage...' : 'Test Storage'}
        </Text>
      </TouchableOpacity>
      
      {testResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  testButton: {
    backgroundColor: '#0891b2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  spinning: {
    // Add a simple rotation animation if needed
  },
  resultContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});