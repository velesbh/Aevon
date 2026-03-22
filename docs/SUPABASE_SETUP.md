# Aevon - Supabase Setup Guide

This document outlines the database schema, Row Level Security (RLS) policies, and storage configurations required to run Aevon.

## 1. Initial Setup
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project named "Aevon".
3. In **Project Settings > API**, copy:
   - `Project URL`
   - `anon public` key
4. Add them to your app as:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Navigate to the **SQL Editor** in the left sidebar to execute the following scripts.

## 2. Database Schema

Copy and paste the following SQL commands to create your core tables.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    language TEXT DEFAULT 'en',
    experience_level TEXT,
    genre TEXT,
    project_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (name) STORED,
    avatar_url TEXT,
    storage_used BIGINT DEFAULT 0, -- Track bytes used
    storage_limit BIGINT DEFAULT 34359738368, -- 32GB in bytes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table (Books/Novels)
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chapters Table
CREATE TABLE public.chapters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}', -- Rich text or Prosemirror JSON
    word_count INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. World Elements (Characters, Locations, Items)
CREATE TABLE public.world_elements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('character', 'location', 'item', 'lore')),
    name TEXT NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '{}', -- Flexible metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Files Metadata Table
CREATE TABLE public.files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_chapters_modtime BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_world_elements_modtime BEFORE UPDATE ON public.world_elements FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

## 3. Row Level Security (RLS) Policies

Execute these commands to ensure users can only access their own data.

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects Policies
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

-- Chapters Policies (Via Project)
CREATE POLICY "Users can manage chapters of own projects" ON public.chapters FOR ALL 
USING (EXISTS (SELECT 1 FROM public.projects WHERE id = public.chapters.project_id AND user_id = auth.uid()));

-- World Elements Policies (Via Project)
CREATE POLICY "Users can manage world elements of own projects" ON public.world_elements FOR ALL 
USING (EXISTS (SELECT 1 FROM public.projects WHERE id = public.world_elements.project_id AND user_id = auth.uid()));

-- Files Policies
CREATE POLICY "Users can manage own files" ON public.files FOR ALL USING (auth.uid() = user_id);
```

## 4. Storage Setup (32GB Quota)

1. Go to **Storage** in the Supabase Dashboard.
2. Create a new bucket named `user-uploads`.
3. Set the bucket to **Private**.
4. Run the following SQL to secure the bucket via RLS:

```sql
-- Allow users to upload to their own folder (folder name = user_id)
CREATE POLICY "Users can upload to own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read/update/delete their own files
CREATE POLICY "Users can manage own files in storage" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Quota Management Logic (To be implemented in App Backend/Edge Functions)
Supabase Storage doesn't enforce byte-level quotas natively at the bucket level per user. 
**Solution:**
1. Before an upload via the client, check the user's `storage_used` in the `profiles` table.
2. If `storage_used + new_file_size > 34359738368` (32GB), reject the upload.
3. Upon successful upload, increment `storage_used` in the `profiles` table via a database function/trigger on the `files` table inserts and deletes.

## 5. Auth Notes
1. In **Authentication > Providers**, keep **Email** enabled.
2. In **Authentication > URL Configuration**, add your local app URL during development, for example `http://localhost:3000`.
3. If email confirmation is enabled, `signUp()` may create the user before they can log in. The current app will send users to the login page until they have an authenticated session, then it bootstraps their profile/project/chapter from auth metadata on first login.
