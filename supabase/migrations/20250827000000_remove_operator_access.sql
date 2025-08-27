-- Migration to remove operator access from admin operations
-- Only admin role should have access to admin functionality

-- Update RLS policies for orders table to remove operator access
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Update RLS policies for order items table to remove operator access
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Update RLS policies for order status history table to remove operator access
DROP POLICY IF EXISTS "Admins can view all order history" ON public.order_status_history;
CREATE POLICY "Admins can view all order history" ON public.order_status_history
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can insert order history" ON public.order_status_history;
CREATE POLICY "Admins can insert order history" ON public.order_status_history
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Update RLS policies for profiles table to remove operator access
DROP POLICY IF EXISTS "Operators can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Update RLS policies for service requests if they exist
-- Remove operator access from service request operations
DO $$
BEGIN
    -- Check if service_requests table exists and update policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_requests') THEN
        -- Drop existing operator policies
        DROP POLICY IF EXISTS "Operators can view all requests" ON public.service_requests;
        DROP POLICY IF EXISTS "Operators can update requests" ON public.service_requests;
        
        -- Create admin-only policies for service requests
        CREATE POLICY "Admins can view all requests" ON public.service_requests
          FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
          
        CREATE POLICY "Admins can update requests" ON public.service_requests
          FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');
    END IF;
    
    -- Check if operator_notes table exists and update policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'operator_notes') THEN
        -- Drop existing operator policies
        DROP POLICY IF EXISTS "Operators can manage notes" ON public.operator_notes;
        DROP POLICY IF EXISTS "Operators can view notes" ON public.operator_notes;
        DROP POLICY IF EXISTS "Operators can create notes" ON public.operator_notes;
        
        -- Create admin-only policies for operator notes (rename to admin notes)
        CREATE POLICY "Admins can view all notes" ON public.operator_notes
          FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
          
        CREATE POLICY "Admins can create notes" ON public.operator_notes
          FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
          
        CREATE POLICY "Admins can update notes" ON public.operator_notes
          FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');
    END IF;
END $$;