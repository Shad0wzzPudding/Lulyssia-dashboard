import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/lib/types';
import { toast } from 'sonner';

const DUPLICATE_TAG_MESSAGE = 'Tag already exists';

const normalizeTagName = (name: string) => name.trim().toLowerCase();

const isDuplicateTagError = (err: Error) =>
  err?.message === DUPLICATE_TAG_MESSAGE || !!err?.message?.includes('duplicate');

// Throws if another tag of this user already uses the name, ignoring upper/lower case
const assertTagNameAvailable = async (userId: string, name: string, excludeId?: string) => {
  const { data, error } = await supabase.from('tags').select('id, name').eq('user_id', userId);
  if (error) throw error;
  const wanted = normalizeTagName(name);
  if ((data || []).some((t) => t.id !== excludeId && normalizeTagName(t.name) === wanted)) {
    throw new Error(DUPLICATE_TAG_MESSAGE);
  }
};

export const useTags = () => {
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as Tag[];
    },
  });

  const createTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await assertTagNameAvailable(user.id, name);
      const { data, error } = await supabase
        .from('tags')
        .insert([{ user_id: user.id, name: name.trim(), color }])
        .select()
        .single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: Error) => {
      toast.error(isDuplicateTagError(err) ? DUPLICATE_TAG_MESSAGE : 'Failed to create tag');
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name?: string; color?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (name !== undefined) await assertTagNameAvailable(user.id, name, id);
      const patch: { name?: string; color?: string } = {};
      if (name !== undefined) patch.name = name.trim();
      if (color !== undefined) patch.color = color;
      const { error } = await supabase
        .from('tags')
        .update(patch)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: Error) => {
      toast.error(isDuplicateTagError(err) ? DUPLICATE_TAG_MESSAGE : 'Failed to update tag');
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Tag deleted');
    },
    onError: () => {
      toast.error('Failed to delete tag');
    },
  });

  return { tags, isLoading, createTag, updateTag, deleteTag };
};