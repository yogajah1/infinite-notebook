-- Schema Infinite Learning Notebook
-- Jalankan skrip ini di Supabase SQL Editor: https://supabase.com/dashboard/project/njhomdlsxyzbzilmdlyv/sql/new

-- 1. Tabel Notebooks
CREATE TABLE IF NOT EXISTS public.notebooks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT ARRAY['Belajar']::TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Index untuk performa pencarian berdasarkan user & updated_at
CREATE INDEX IF NOT EXISTS idx_notebooks_user_updated ON public.notebooks(user_id, updated_at DESC);

-- 2. Tabel Canvas Records (Snapshot Kanvas per Notebook)
CREATE TABLE IF NOT EXISTS public.canvas_records (
  notebook_id TEXT PRIMARY KEY REFERENCES public.notebooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot JSONB,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_canvas_records_user ON public.canvas_records(user_id);

-- 3. Aktifkan Row Level Security (RLS) dan berikan izin ke role PostgREST
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_records ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.notebooks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.canvas_records TO anon, authenticated, service_role;

-- 4. Policies untuk Notebooks (Hanya pemilik yang dapat membaca dan mengubah)
DROP POLICY IF EXISTS "Users can view own notebooks" ON public.notebooks;
CREATE POLICY "Users can view own notebooks"
  ON public.notebooks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notebooks" ON public.notebooks;
CREATE POLICY "Users can insert own notebooks"
  ON public.notebooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notebooks" ON public.notebooks;
CREATE POLICY "Users can update own notebooks"
  ON public.notebooks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notebooks" ON public.notebooks;
CREATE POLICY "Users can delete own notebooks"
  ON public.notebooks FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Policies untuk Canvas Records
DROP POLICY IF EXISTS "Users can view own canvas records" ON public.canvas_records;
CREATE POLICY "Users can view own canvas records"
  ON public.canvas_records FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own canvas records" ON public.canvas_records;
CREATE POLICY "Users can insert own canvas records"
  ON public.canvas_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own canvas records" ON public.canvas_records;
CREATE POLICY "Users can update own canvas records"
  ON public.canvas_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own canvas records" ON public.canvas_records;
CREATE POLICY "Users can delete own canvas records"
  ON public.canvas_records FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Storage Bucket untuk upload gambar kanvas
INSERT INTO storage.buckets (id, name, public)
VALUES ('notebook-assets', 'notebook-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies untuk Storage
DROP POLICY IF EXISTS "Public can view notebook assets" ON storage.objects;
CREATE POLICY "Public can view notebook assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notebook-assets');

DROP POLICY IF EXISTS "Authenticated users can upload notebook assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload notebook assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'notebook-assets' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own notebook assets" ON storage.objects;
CREATE POLICY "Users can update own notebook assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'notebook-assets' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own notebook assets" ON storage.objects;
CREATE POLICY "Users can delete own notebook assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'notebook-assets' AND auth.uid() = owner);
