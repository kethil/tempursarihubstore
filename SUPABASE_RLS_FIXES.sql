-- SUPABASE RLS (ROW LEVEL SECURITY) FIXES
-- Run these commands in your Supabase SQL Editor

-- 1. Enable RLS on orders table (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on order_items table (if not already enabled)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (ignore errors if they don't exist)

-- Drop existing policies for orders table
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can read their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON orders;

-- Drop existing policies for order_items table
DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
DROP POLICY IF EXISTS "Users can read their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can update their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can delete their own order items" ON order_items;

-- 4. Create policies for the ORDERS table

-- Allow all users to insert orders (including anonymous)
CREATE POLICY "Users can insert orders" ON orders
FOR INSERT WITH CHECK (true);

-- Allow users to read their own orders
CREATE POLICY "Users can read their own orders" ON orders
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own orders
CREATE POLICY "Users can update their own orders" ON orders
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to delete their own orders
CREATE POLICY "Users can delete their own orders" ON orders
FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 5. Create policies for the ORDER_ITEMS table

-- Allow users to insert order items for their own orders
CREATE POLICY "Users can insert order items" ON order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- Allow users to read their own order items
CREATE POLICY "Users can read their own order items" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- Allow users to update their own order items
CREATE POLICY "Users can update their own order items" ON order_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- Allow users to delete their own order items
CREATE POLICY "Users can delete their own order items" ON order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- 6. Grant necessary permissions (if needed)
GRANT ALL ON TABLE orders TO authenticated, anon;
GRANT ALL ON TABLE order_items TO authenticated, anon;