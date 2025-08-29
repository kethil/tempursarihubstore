-- FINAL FIX FOR ANONYMOUS STORAGE POLICIES
-- This script creates the most permissive policies that will definitely work

-- First, make the bucket public (this should work)
UPDATE storage.buckets SET public = true WHERE id = 'service-documents';

-- Clean up ALL existing storage policies completely
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for anon users" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable uploads for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "simple_anonymous_uploads" ON storage.objects;
DROP POLICY IF EXISTS "simple_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous document uploads 4by940_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated document uploads 4by940_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow document viewing 4by940_0" ON storage.objects;

-- Create VERY permissive policies that will definitely work

-- 1. Allow anonymous users to upload ANY file to service-documents bucket
CREATE POLICY "allow_anon_uploads" ON storage.objects
  FOR INSERT 
  TO anon
  WITH CHECK (bucket_id = 'service-documents');

-- 2. Allow authenticated users to upload ANY file to service-documents bucket  
CREATE POLICY "allow_auth_uploads" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'service-documents');

-- 3. Allow EVERYONE to read/download files from service-documents bucket
CREATE POLICY "allow_public_downloads" ON storage.objects
  FOR SELECT 
  TO anon, authenticated
  USING (bucket_id = 'service-documents');

-- 4. Allow EVERYONE to update files in service-documents bucket
CREATE POLICY "allow_public_updates" ON storage.objects
  FOR UPDATE 
  TO anon, authenticated
  USING (bucket_id = 'service-documents')
  WITH CHECK (bucket_id = 'service-documents');

-- 5. Allow EVERYONE to delete files in service-documents bucket
CREATE POLICY "allow_public_deletes" ON storage.objects
  FOR DELETE 
  TO anon, authenticated
  USING (bucket_id = 'service-documents');

-- Check if policies were created successfully
SELECT 
  policyname, 
  cmd, 
  roles,
  with_check,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'allow_%'
ORDER BY policyname;