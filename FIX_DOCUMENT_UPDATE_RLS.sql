-- FIX DOCUMENT UPDATE RLS POLICY
-- This fixes the issue where anonymous users cannot update documents field after creating service requests

-- Drop and recreate service_requests policies to allow document updates

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Anyone can view requests by NIK for status check" ON public.service_requests;

-- Recreate policies with proper update permissions

-- Allow users to view their own requests (including anonymous)
CREATE POLICY "Users can view own requests" ON public.service_requests
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to insert requests (including anonymous)
CREATE POLICY "Users can insert own requests" ON public.service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own requests (including anonymous for document uploads)
CREATE POLICY "Users can update own requests" ON public.service_requests
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Keep the general view policy for status checking
CREATE POLICY "Anyone can view requests by NIK for status check" ON public.service_requests
  FOR SELECT USING (true);

-- Storage policies for anonymous uploads
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;

-- Allow anonymous uploads (folder structure: anonymous/{request_id}/document_*.*)
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'service-documents' AND (
      -- Authenticated users can upload to their folder
      (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
      -- Anonymous users can upload to 'anonymous' folder
      (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous')
    )
  );

-- Allow viewing uploaded documents
CREATE POLICY "Users can view documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'service-documents' AND (
      -- Authenticated users can view their own documents
      (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
      -- Anonymous users can view documents in 'anonymous' folder
      (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous') OR
      -- Allow public read access for all documents (for admin viewing)
      true
    )
  );

-- Make the storage bucket public for easier access
UPDATE storage.buckets SET public = true WHERE id = 'service-documents';