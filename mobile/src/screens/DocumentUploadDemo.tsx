import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ServiceRequestForm } from '../components/ServiceRequestForm';

export const DocumentUploadDemo = () => {
  const handleBack = () => {
    console.log('Back pressed');
  };

  const handleSuccess = (requestNumber: string) => {
    console.log('Request submitted successfully:', requestNumber);
  };

  return (
    <View style={styles.container}>
      <ServiceRequestForm 
        serviceType="surat_pengantar_ktp"
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});