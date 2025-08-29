-- DEVELOPMENT-OPTIMIZED STORAGE POLICIES
-- Simple, functional policies for development with admin access to all documents

-- Step 1: Clean up ALL existing policies first
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
DROP POLICY IF EXISTS "allow_anon_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_downloads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_updates" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_deletes" ON storage.objects;

-- Step 2: Ensure bucket is public and properly configured
UPDATE storage.buckets SET 
  public = true,
  file_size_limit = 2097152,  -- 2MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'text/plain', 'application/octet-stream']
WHERE id = 'service-documents';

-- Step 3: Create simple, development-friendly policies

-- Policy 1: Everyone can upload documents
CREATE POLICY "dev_document_upload" ON storage.objects
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (bucket_id = 'service-documents');

-- Policy 2: Everyone can view/download documents
CREATE POLICY "dev_document_read" ON storage.objects
  FOR SELECT 
  TO anon, authenticated
  USING (bucket_id = 'service-documents');

-- Policy 3: Authenticated users can update documents
CREATE POLICY "dev_document_update" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'service-documents')
  WITH CHECK (bucket_id = 'service-documents');

-- Policy 4: Authenticated users can delete documents (admins and users)
CREATE POLICY "dev_document_delete" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'service-documents');

-- Step 4: Verify bucket configuration
SELECT 
  'Bucket Configuration' as check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'service-documents';

-- Step 5: Verify policies were created
SELECT 
  'Active Policies' as check_type,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'dev_document_%'
ORDER BY policyname;

-- Step 6: Show sample documents (if any exist)
SELECT 
  'Sample Documents' as check_type,
  name,
  bucket_id,
  (storage.foldername(name))[1] as folder,
  created_at
FROM storage.objects 
WHERE bucket_id = 'service-documents'
ORDER BY created_at DESC
LIMIT 5;