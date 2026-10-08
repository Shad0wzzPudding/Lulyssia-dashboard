-- Drag-to-reorder saves sort_order on every item it moves. The app logs one
-- "reordered" entry per drag itself, so updates that change nothing but
-- sort_order (and updated_at) are no longer logged one row each.
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (to_jsonb(NEW) - 'sort_order' - 'updated_at') = (to_jsonb(OLD) - 'sort_order' - 'updated_at') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.activity_log (user_id, action_type, item_type, item_title, item_id, previous_data)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.title, OLD.title),
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb
      ELSE NULL
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;
