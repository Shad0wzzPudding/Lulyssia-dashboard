import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Preset, PresetDueUnit } from '@/lib/types';
import { toast } from '@/lib/toast';

/** What the preset form saves */
export type PresetFields = {
  name: string;
  description: string;
  tag_ids: string[];
  due_amount: number | null;
  due_unit: PresetDueUnit | null;
};

/**
 * The account's presets (on every device, like tags): the most used first, then the older first,
 * so a new preset starts at the end.
 */
export const usePresets = () => {
  const queryClient = useQueryClient();

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: async (): Promise<Preset[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('presets')
        .select('*')
        .eq('user_id', user.id)
        .order('use_count', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as Preset[];
    },
  });

  const createPreset = useMutation({
    mutationFn: async (fields: PresetFields) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('presets')
        .insert([{ ...fields, name: fields.name.trim(), user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data as Preset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
    onError: () => {
      toast.error('Failed to create preset');
    },
  });

  const updatePreset = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<PresetFields> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const patch = fields.name === undefined ? fields : { ...fields, name: fields.name.trim() };
      const { data, error } = await supabase
        .from('presets')
        .update(patch)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Preset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
    onError: () => {
      toast.error('Failed to update preset');
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('presets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
    onError: () => {
      toast.error('Failed to delete preset');
    },
  });

  // Picking a preset with "Apply preset" counts one more use (the order is most used first)
  const countUseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('presets')
        .select('use_count')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      const { error: updateError } = await supabase
        .from('presets')
        .update({ use_count: (data?.use_count ?? 0) + 1 })
        .eq('id', id)
        .eq('user_id', user.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });
  const countUse = (id: string) => countUseMutation.mutate(id);

  return { presets, isLoading, createPreset, updatePreset, deletePreset, countUse };
};
