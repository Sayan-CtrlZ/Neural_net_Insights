-- Create datasets table
CREATE TABLE datasets (
    id UUID PRIMARY KEY,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create runs table
CREATE TABLE runs (
    id UUID PRIMARY KEY,
    dataset_id UUID REFERENCES datasets(id),
    status TEXT NOT NULL,
    problem_type TEXT NOT NULL,
    target_column TEXT NOT NULL,
    best_value FLOAT,
    best_params JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Optuna tables will be automatically created by the optuna.storages.RDBStorage engine!

-- Create the datasets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', true)
ON CONFLICT (id) DO NOTHING;
