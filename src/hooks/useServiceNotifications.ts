import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { wahaService } from '@/services/wahaService';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database["public"]["Tables"]["service_requests"]["Row"];
type RequestStatus = Database["public"]["Enums"]["request_status"];

export const useServiceNotifications = () => {
  useEffect(() => {
    // Subscribe to service request changes
    const subscription = supabase
      .channel('service_requests_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
        },
        async (payload) => {
          console.log('New service request created:', payload.new);
          
          try {
            const newRequest = payload.new as ServiceRequest;
            await wahaService.sendNewRequestNotification(newRequest);
            console.log('New request notification sent successfully');
          } catch (error) {
            console.error('Failed to send new request notification:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
        },
        async (payload) => {
          console.log('Service request updated:', payload.new);
          
          try {
            const updatedRequest = payload.new as ServiceRequest;
            const oldRequest = payload.old as ServiceRequest;
            
            // Only send notification if status changed
            if (updatedRequest.status !== oldRequest.status) {
              await wahaService.sendStatusUpdateNotification(
                updatedRequest,
                oldRequest.status || 'pending'
              );
              console.log('Status update notification sent successfully');
            }
          } catch (error) {
            console.error('Failed to send status update notification:', error);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Function to manually send test notification
  const sendTestNotification = async (phoneNumber: string) => {
    try {
      const testRequest: ServiceRequest = {
        id: 'test-id',
        request_number: 'TEST-001',
        service_type: 'surat_keterangan_domisili',
        full_name: 'Test User',
        nik: '1234567890123456',
        phone_number: phoneNumber,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: null,
        documents: null,
        operator_notes: null,
        operator_id: null,
        completed_at: null,
      };

      await wahaService.sendNewRequestNotification(testRequest);
      return { success: true, message: 'Test notification sent successfully' };
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return { success: false, message: `Failed to send test notification: ${error}` };
    }
  };

  // Function to test WAHA connection
  const testWAHAConnection = async () => {
    try {
      const isConnected = await wahaService.testConnection();
      return { 
        success: isConnected, 
        message: isConnected ? 'WAHA connection successful' : 'WAHA connection failed' 
      };
    } catch (error) {
      console.error('WAHA connection test failed:', error);
      return { success: false, message: `WAHA connection test failed: ${error}` };
    }
  };

  return {
    sendTestNotification,
    testWAHAConnection,
  };
};