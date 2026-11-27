import { useEffect, useRef, useState } from 'react';
import type { DueOffset } from '@/lib/presetApply';

/**
 * The task and event forms' "Presets": whether the preset layer is open, the "Presets" button (the
 * focus goes back to it) and the form's own window, which can't be used at all while the layer is
 * up (inert: no clicks, typing or Tab, and screen readers skip it). `dueOffset` is the last applied
 * preset's due offset, so a changed start keeps the Deadline / End at start + X.
 */
export const useFormPresets = () => {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [dueOffset, setDueOffset] = useState<DueOffset | null>(null);
  const presetsButtonRef = useRef<HTMLButtonElement>(null);
  const formContentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = formContentRef.current;
    if (!el) return;
    el.inert = presetsOpen;
    return () => {
      el.inert = false;
    };
  }, [presetsOpen]);
  return { presetsOpen, setPresetsOpen, dueOffset, setDueOffset, presetsButtonRef, formContentRef };
};
