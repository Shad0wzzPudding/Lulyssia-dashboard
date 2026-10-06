import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserNames } from '@/lib/names';

const QUERY_KEY = ['user_names'];
const EMPTY: UserNames = { nickname: null };

/** The user's nickname (stored on their user_preferences row). */
export const useUserNames = () => {
  const queryClient = useQueryClient();

  const { data: names = EMPTY, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<UserNames> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return EMPTY;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('nickname')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return { nickname: data?.nickname ?? null };
    },
  });

  const saveNames = useMutation({
    mutationFn: async (next: UserNames) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      // Upsert only this column, so the stored sort preferences (prefs) are kept
      const { error } = await supabase
        .from('user_preferences')
        .upsert([{ user_id: user.id, nickname: next.nickname }], { onConflict: 'user_id' });
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(QUERY_KEY, next);
    },
  });

  return { names, isLoading, saveNames };
};
