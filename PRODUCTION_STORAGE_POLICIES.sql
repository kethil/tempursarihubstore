-- PRODUCTION-READY STORAGE POLICIES FOR service-documents BUCKET
-- This script creates secure policies that support both web and mobile document uploads

-- Step 1: Verify bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'service-documents';

-- Step 2: Clean up existing policies (only the ones that might conflict)
DROP POLICY IF EXISTS "allow_anon_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_downloads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_updates" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_deletes" ON storage.objects;

-- Step 3: Create PRODUCTION-READY policies with proper security

-- Policy 1: Allow anonymous uploads to 'anonymous/' folder only
CREATE POLICY "anonymous_document_uploads" ON storage.objects
  FOR INSERT 
  TO anon
  WITH CHECK (
    bucket_id = 'service-documents' AND
    (storage.foldername(name))[1] = 'anonymous'
  );

-- Policy 2: Allow authenticated users to upload to their own folder
CREATE POLICY "authenticated_document_uploads" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'service-documents' AND
    (
      -- Allow uploads to user's own folder
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Allow uploads to anonymous folder if user chooses
      (storage.foldername(name))[1] = 'anonymous'
    )
  );

-- Policy 3: Allow users to view their own documents + admins can view all
CREATE POLICY "view_own_documents" ON storage.objects
  FOR SELECT 
  TO anon, authenticated
  USING (
    bucket_id = 'service-documents' AND
    (
      -- Anonymous users can view files in anonymous folder
      (auth.role() = 'anon' AND (storage.foldername(name))[1] = 'anonymous') OR
      -- Authenticated users can view their own files
      (auth.uid()::text = (storage.foldername(name))[1]) OR
      -- Authenticated users can also view anonymous files
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = 'anonymous') OR
      -- Admin users can view all files (assuming admin role exists)
      (auth.jwt() ->> 'role' = 'admin')
    )
  );

-- Policy 4: Allow users to update/replace their own documents only
CREATE POLICY "update_own_documents" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'service-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'service-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 5: Allow admins to delete any document, users can delete their own
CREATE POLICY "delete_documents" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'service-documents' AND
    (
      -- Users can delete their own documents
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Admins can delete any document
      auth.jwt() ->> 'role' = 'admin'
    )
  );

-- Step 4: Verify all policies were created successfully
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname IN (
  'anonymous_document_uploads',
  'authenticated_document_uploads', 
  'view_own_documents',
  'update_own_documents',
  'delete_documents'
)
ORDER BY policyname;

-- Step 5: Test the policies with a sample query
-- This should show the structure of files that can be accessed
SELECT 
  name,
  bucket_id,
  (storage.foldername(name))[1] as folder,
  created_at
FROM storage.objects 
WHERE bucket_id = 'service-documents'
ORDER BY created_at DESC
LIMIT 5;