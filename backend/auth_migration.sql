-- Add user_id column to existing tables
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE runs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Force all future inserts to have a user_id
-- We cannot set NOT NULL immediately if there's existing public data, 
-- but ideally it should be NOT NULL in production.
-- ALTER TABLE datasets ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE runs ALTER COLUMN user_id SET NOT NULL;

-- Enable Row Level Security
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Datasets Table Policies
CREATE POLICY "Users can view their own datasets" 
ON datasets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets" 
ON datasets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets" 
ON datasets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets" 
ON datasets FOR DELETE 
USING (auth.uid() = user_id);


-- Runs Table Policies
CREATE POLICY "Users can view their own runs" 
ON runs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own runs" 
ON runs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs" 
ON runs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own runs" 
ON runs FOR DELETE 
USING (auth.uid() = user_id);

-- Secure Storage Bucket Policies (Assuming bucket is 'datasets')
-- Drop previous public policies if they exist (ignore errors if not)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;

CREATE POLICY "Users can upload datasets to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'datasets' AND 
    auth.uid() = owner -- storage.objects uses 'owner' mapping to auth.users
);

CREATE POLICY "Users can view their own datasets in storage"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'datasets' AND 
    auth.uid() = owner
);

CREATE POLICY "Users can delete their own datasets in storage"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'datasets' AND 
    auth.uid() = owner
);
