-- COMPREHENSIVE BUCKET VERIFICATION AND FIX
-- This script addresses all potential bucket configuration issues

-- Step 1: Verify bucket exists and its current configuration
SELECT 
  id,
  name,
  public,
  avif_autodetection,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'service-documents';

-- Step 2: Update bucket to ensure it's properly configured
UPDATE storage.buckets SET 
  public = true,
  file_size_limit = 2097152, -- 2MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'text/plain']
WHERE id = 'service-documents';

-- Step 3: Verify bucket update worked
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'service-documents';

-- Step 4: Check if RLS is enabled properly
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Step 5: Disable RLS temporarily to test if that's the issue
-- (We'll re-enable it after testing)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Step 6: Check current policies (should be empty now)
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Step 7: Create the most basic policy possible
CREATE POLICY "allow_all_operations" ON storage.objects
  FOR ALL 
  TO anon, authenticated
  USING (bucket_id = 'service-documents')
  WITH CHECK (bucket_id = 'service-documents');

-- Step 8: Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 9: Final verification - check everything is set up correctly
SELECT 
  'Bucket Configuration' as check_type,
  CASE 
    WHEN public = true AND file_size_limit = 2097152 THEN 'PASS'
    ELSE 'FAIL'
  END as status,
  CONCAT('Public: ', public, ', Size Limit: ', file_size_limit) as details
FROM storage.buckets 
WHERE id = 'service-documents'

UNION ALL

SELECT 
  'RLS Status' as check_type,
  CASE 
    WHEN rowsecurity = true THEN 'PASS'
    ELSE 'FAIL'
  END as status,
  CONCAT('Row Security: ', rowsecurity) as details
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects'

UNION ALL

SELECT 
  'Policy Count' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL'
  END as status,
  CONCAT('Policies found: ', COUNT(*)) as details
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'allow_all_operations';