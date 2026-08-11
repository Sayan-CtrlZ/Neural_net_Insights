-- 0. Ensure user_id column exists
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1. Enable RLS on core tables
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts if re-running
DROP POLICY IF EXISTS "Users can only see their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can only insert their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can only delete their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can only update their own datasets" ON datasets;

DROP POLICY IF EXISTS "Users can only see their own runs" ON runs;
DROP POLICY IF EXISTS "Users can only insert their own runs" ON runs;
DROP POLICY IF EXISTS "Users can only update their own runs" ON runs;
DROP POLICY IF EXISTS "Users can only delete their own runs" ON runs;

-- 3. Create strictly isolated policies for `datasets`
CREATE POLICY "Users can only see their own datasets" 
ON datasets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own datasets" 
ON datasets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own datasets" 
ON datasets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own datasets" 
ON datasets FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create strictly isolated policies for `runs`
CREATE POLICY "Users can only see their own runs" 
ON runs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own runs" 
ON runs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own runs" 
ON runs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own runs" 
ON runs FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Keep the storage bucket permissive (assuming bucket-level security handles this, or if you want it strict too, you would change this)
-- Here we keep it as is because Storage RLS handles files based on folders usually, 
-- but for datasets we might want to restrict it later. 
-- For now, the database isolation fixes the dashboard leakage.
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow public uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'datasets');

DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
CREATE POLICY "Allow public reads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'datasets');

DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'datasets');
