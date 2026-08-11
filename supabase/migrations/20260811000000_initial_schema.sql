-- Fix for "new row violates row-level security policy"
-- 1. Disable RLS on our tables just in case they were turned on
ALTER TABLE datasets DISABLE ROW LEVEL SECURITY;
ALTER TABLE runs DISABLE ROW LEVEL SECURITY;

-- 2. Create an open policy for the Storage Bucket so anyone can upload and read
-- (Storage objects always have RLS enabled by default)
CREATE POLICY "Allow public uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'datasets');

CREATE POLICY "Allow public reads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'datasets');

CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'datasets');
