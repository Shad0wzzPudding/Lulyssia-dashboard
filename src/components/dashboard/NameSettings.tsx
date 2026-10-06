import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserNames } from '@/hooks/useUserNames';
import { cleanName, NAME_MAX_LENGTH } from '@/lib/names';
import { UserRound } from 'lucide-react';

export const NameSettings = () => {
  const { toast } = useToast();
  const { names, isLoading, saveNames } = useUserNames();
  const [nickname, setNickname] = useState('');

  // Fill the field once the saved nickname arrives
  useEffect(() => {
    setNickname(names.nickname ?? '');
  }, [names.nickname]);

  const next = { nickname: cleanName(nickname) };
  const changed = next.nickname !== names.nickname;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveNames.mutate(next, {
      onSuccess: () => toast({ description: 'Nickname saved! Lulyssia will use it from now on~' }),
      onError: () => toast({ description: 'Could not save your nickname. Please try again.', variant: 'destructive' }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserRound size={18} className="text-primary" />
          Your nickname
        </CardTitle>
        <CardDescription>
          What the dashboard and Lulyssia call you: in the header, greetings and LINE messages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={NAME_MAX_LENGTH}
              placeholder="What Lulyssia calls you"
              disabled={isLoading}
              autoComplete="nickname"
            />
          </div>
          <Button type="submit" disabled={isLoading || !changed || saveNames.isPending}>
            {saveNames.isPending ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
