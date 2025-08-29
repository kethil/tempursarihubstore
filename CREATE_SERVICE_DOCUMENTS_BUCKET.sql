-- CREATE SERVICE DOCUMENTS STORAGE BUCKET (Simplified Version)
-- This script creates the missing 'service-documents' bucket using standard Supabase permissions

-- Create the service-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-documents',
  'service-documents',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Verify the bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'service-documents';

-- Note: Storage policies will be created through Supabase Dashboard
-- Go to Storage > Policies in your Supabase Dashboard to create these policies:
--
-- Policy 1: "Users can upload documents"
-- Operation: INSERT
-- Target roles: authenticated, anon
-- Policy definition:
-- bucket_id = 'service-documents' AND (
--   (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
--   (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous')
-- )
--
-- Policy 2: "Users can view documents"
-- Operation: SELECT
-- Target roles: authenticated, anon
-- Policy definition:
-- bucket_id = 'service-documents' AND (
--   (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
--   (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous') OR
--   public.get_user_role(auth.uid()) IN ('admin', 'operator')
-- )