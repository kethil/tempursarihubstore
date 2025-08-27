-- SUPABASE FUNCTIONS FOR EMAIL NOTIFICATIONS
-- Run these commands in your Supabase SQL Editor

-- 1. Enable pg_net extension for making HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create a function to send order status update emails
CREATE OR REPLACE FUNCTION send_order_status_email(
  customer_email TEXT,
  customer_name TEXT,
  order_number TEXT,
  new_status TEXT,
  total_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- In a real implementation, you would make an HTTP request to an email service
  -- For example, using pg_net to call an external email API:
  
  /*
  SELECT net.http_post(
    url := 'https://api.emailservice.com/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_API_KEY'
    ),
    body := jsonb_build_object(
      'to', customer_email,
      'subject', 'Order Status Update - #' || order_number,
      'body', 'Hello ' || customer_name || ', your order #' || order_number || ' status has been updated to ' || new_status
    )
  );
  */
  
  -- For now, we'll just log the email
  RAISE NOTICE 'Email would be sent to %: Order #% status updated to %', customer_email, order_number, new_status;
END;
$$;

-- 3. Create a function to send order confirmation emails
CREATE OR REPLACE FUNCTION send_order_confirmation_email(
  customer_email TEXT,
  customer_name TEXT,
  order_number TEXT,
  total_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- In a real implementation, you would make an HTTP request to an email service
  -- For example:
  
  /*
  SELECT net.http_post(
    url := 'https://api.emailservice.com/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_API_KEY'
    ),
    body := jsonb_build_object(
      'to', customer_email,
      'subject', 'Order Confirmation - #' || order_number,
      'body', 'Hello ' || customer_name || ', thank you for your order #' || order_number
    )
  );
  */
  
  -- For now, we'll just log the email
  RAISE NOTICE 'Order confirmation email would be sent to % for order #%', customer_email, order_number;
END;
$$;

-- 4. Create a trigger function to send emails when order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only send notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Call the email function
    PERFORM send_order_status_email(
      NEW.customer_email,
      NEW.customer_name,
      NEW.order_number,
      NEW.status,
      NEW.total_amount
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Create trigger to automatically send email when order status changes
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- 6. Create a trigger function to send confirmation when order is created
CREATE OR REPLACE FUNCTION notify_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Send order confirmation email
  PERFORM send_order_confirmation_email(
    NEW.customer_email,
    NEW.customer_name,
    NEW.order_number,
    NEW.total_amount
  );
  
  RETURN NEW;
END;
$$;

-- 7. Create trigger to automatically send confirmation when order is created
DROP TRIGGER IF EXISTS order_created_trigger ON orders;
CREATE TRIGGER order_created_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_created();