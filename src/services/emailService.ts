import { supabase } from "@/integrations/supabase/client";

// Function to send order status update email
export const sendOrderStatusEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  newStatus: string,
  orderDetails: any
) => {
  try {
    // In a real implementation, you would integrate with an email service
    // For now, we'll simulate the email sending
    
    // Create order items list
    const orderItemsList = orderDetails.order_items?.map((item: any) => 
      `- ${item.product?.name} x ${item.quantity} = Rp ${(item.unit_price * item.quantity).toLocaleString()}`
    ).join('\
') || '';
    
    // Log the email content (in a real app, you'd send this to an email service)
    console.log("Sending email notification:", {
      to: customerEmail,
      subject: `Update Status Pesanan #${orderNumber}`,
      content: `
        Halo ${customerName},
        
        Status pesanan Anda #${orderNumber} telah diperbarui menjadi: ${newStatus}
        
        Detail Pesanan:
        ${orderItemsList}
        
        Total: Rp ${orderDetails.total_amount.toLocaleString()}
        
        Terima kasih telah berbelanja di Tempursari Hub Store!
      `
    });
    
    // In a real implementation, you might use:
    // 1. Supabase Functions
    // 2. External email service (SendGrid, Mailgun, etc.)
    // 3. A dedicated email microservice
    
    return { success: true, message: "Email notification sent successfully" };
  } catch (error) {
    console.error("Error sending email notification:", error);
    return { success: false, message: "Failed to send email notification" };
  }
};

// Function to send order confirmation email
export const sendOrderConfirmationEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  orderDetails: any
) => {
  try {
    // Create order items list
    const orderItemsList = orderDetails.order_items?.map((item: any) => 
      `- ${item.product?.name} x ${item.quantity} = Rp ${(item.unit_price * item.quantity).toLocaleString()}`
    ).join('\
') || '';
    
    // Log the email content
    console.log("Sending order confirmation email:", {
      to: customerEmail,
      subject: `Konfirmasi Pesanan #${orderNumber}`,
      content: `
        Halo ${customerName},
        
        Terima kasih atas pesanan Anda! Berikut detail pesanan #${orderNumber}:
        
        Detail Pesanan:
        ${orderItemsList}
        
        Total: Rp ${orderDetails.total_amount.toLocaleString()}
        
        Kami akan segera memproses pesanan Anda.
        
        Terima kasih telah berbelanja di Tempursari Hub Store!
      `
    });
    
    return { success: true, message: "Order confirmation email sent successfully" };
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return { success: false, message: "Failed to send order confirmation email" };
  }
};