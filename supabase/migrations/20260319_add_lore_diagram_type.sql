ALTER TABLE public.world_elements DROP CONSTRAINT IF EXISTS world_elements_type_check;
ALTER TABLE public.world_elements ADD CONSTRAINT world_elements_type_check CHECK (type IN ('character', 'location', 'item', 'lore', 'lore_diagram'));
