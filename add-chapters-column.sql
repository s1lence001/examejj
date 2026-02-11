-- Create a new column for chapters in user_media table
ALTER TABLE public.user_media ADD COLUMN IF NOT EXISTS chapters TEXT DEFAULT '';

-- Data Migration: If notes already contain chapters (timestamp - title format), 
-- we could attempt to move them, but since we are refactoring, 
-- and to avoid losing simple notes that might look like chapters, 
-- we will let the user manage it or keep it clean for new entries.
-- However, for better UX, let's copy 'notes' to 'chapters' if 'notes' contains the ' - ' separator and starts with digits/colons.
-- This is a best-effort migration.

UPDATE public.user_media
SET chapters = notes,
    notes = ''
WHERE chapters = '' 
  AND notes ~ '^\d{1,2}:\d{2} - .*';
