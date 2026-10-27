import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PenLine } from 'lucide-react';
import { setSpaceIndent, useSpaceIndent, type SpaceIndent } from '@/hooks/useEditorSettings';

const CHOICES: { value: SpaceIndent; name: string; explanation: string }[] = [
  {
    value: 'quick',
    name: 'Quick space',
    explanation: 'Whole lines, or two or more lines, selected: Space adds a space at the start of each line',
  },
  {
    value: 'normal',
    name: 'Normal',
    explanation: 'Space replaces the selected text, as in other editors',
  },
];

/** "Editor" settings: what Space does in the description box with lines selected. */
export const EditorSettings = () => {
  const spaceIndent = useSpaceIndent();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenLine size={18} className="text-primary" />
          Editor
        </CardTitle>
        <CardDescription>Saved to your account, so it's the same on every device.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-base font-medium">Space with lines selected</p>
        <RadioGroup
          value={spaceIndent}
          onValueChange={(value) => setSpaceIndent(value as SpaceIndent)}
          aria-label="Space with lines selected"
          className="gap-3"
        >
          {CHOICES.map((choice) => (
            <div key={choice.value} className="flex items-start gap-3">
              <RadioGroupItem value={choice.value} id={`space-indent-${choice.value}`} className="mt-1" />
              <div>
                <Label htmlFor={`space-indent-${choice.value}`} className="text-base">{choice.name}</Label>
                <p className="text-sm text-muted-foreground">{choice.explanation}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
