-- SIMPLIFIED STORAGE POLICIES (Alternative if production policies cause issues)
-- These are more permissive but still reasonably secure

-- Clean up any existing policies first
DROP POLICY IF EXISTS "anonymous_document_uploads" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_document_uploads" ON storage.objects;
DROP POLICY IF EXISTS "view_own_documents" ON storage.objects;
DROP POLICY IF EXISTS "update_own_documents" ON storage.objects;
DROP POLICY IF EXISTS "delete_documents" ON storage.objects;

-- Simplified Policy 1: Allow all uploads to service-documents bucket
CREATE POLICY "service_documents_upload" ON storage.objects
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (bucket_id = 'service-documents');

-- Simplified Policy 2: Allow all reads from service-documents bucket  
CREATE POLICY "service_documents_read" ON storage.objects
  FOR SELECT 
  TO anon, authenticated
  USING (bucket_id = 'service-documents');

-- Simplified Policy 3: Allow authenticated users to update files
CREATE POLICY "service_documents_update" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'service-documents')
  WITH CHECK (bucket_id = 'service-documents');

-- Simplified Policy 4: Allow authenticated users to delete files
CREATE POLICY "service_documents_delete" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'service-documents');

-- Verify simplified policies
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'service_documents_%'
ORDER BY policyname;