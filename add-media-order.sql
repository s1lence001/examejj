-- Add display_order column to user_media table
ALTER TABLE public.user_media ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Initialize display_order based on created_at for existing records
WITH OrderedMedia AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, requirement_id, folder_id ORDER BY created_at) as row_num
  FROM public.user_media
)
UPDATE public.user_media
SET display_order = OrderedMedia.row_num
FROM OrderedMedia
WHERE public.user_media.id = OrderedMedia.id;
