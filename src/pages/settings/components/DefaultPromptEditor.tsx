import { useEffect, useState } from "react";
import { Button, Header, Textarea } from "@/components";
import { useApp } from "@/contexts";
import {
  DEFAULT_SYSTEM_PROMPT,
  getEffectiveDefaultSystemPrompt,
  STORAGE_KEYS,
} from "@/config";
import { safeLocalStorage } from "@/lib";
import { CheckIcon, RotateCcwIcon, SaveIcon } from "lucide-react";

/**
 * DefaultPromptEditor
 *
 * Lets the user edit the app's "default" system prompt directly from the
 * Settings page. The default prompt is what the AI uses whenever the user
 * has not explicitly selected a custom or Pluely prompt — so editing it
 * gives the user total control over the AI's identity and behavior
 * (e.g. to stop the AI from claiming to be "Natively" or any other
 * product name).
 *
 * Storage strategy:
 *   - The edited value is persisted under STORAGE_KEYS.CUSTOM_DEFAULT_PROMPT.
 *   - `getEffectiveDefaultSystemPrompt()` returns that value (or falls back
 *     to the hard-coded DEFAULT_SYSTEM_PROMPT when nothing is stored).
 *   - The currently-active `systemPrompt` in the app context is also
 *     updated live, so the change takes effect for the next chat message
 *     without requiring an app restart.
 */
export const DefaultPromptEditor = () => {
  const { systemPrompt, setSystemPrompt, loadData } = useApp();

  const [draft, setDraft] = useState<string>("");
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Initialize the textarea from the effective default prompt (which may
  // already be a user-customized value from a previous session).
  useEffect(() => {
    const effective = getEffectiveDefaultSystemPrompt();
    setDraft(effective);
    setIsDirty(false);
  }, []);

  // Compute "dirty" state by comparing the draft to the persisted value.
  const persistedDefault = getEffectiveDefaultSystemPrompt();

  const handleChange = (value: string) => {
    setDraft(value);
    setIsDirty(value !== persistedDefault);
  };

  const handleSave = () => {
    const trimmed = draft;
    if (!trimmed.trim()) {
      // Don't allow saving an empty prompt — fall back silently to the
      // hard-coded default instead.
      safeLocalStorage.removeItem(STORAGE_KEYS.CUSTOM_DEFAULT_PROMPT);
      setDraft(DEFAULT_SYSTEM_PROMPT);
      setIsDirty(false);
    } else {
      safeLocalStorage.setItem(STORAGE_KEYS.CUSTOM_DEFAULT_PROMPT, trimmed);
      setIsDirty(false);
    }

    // If the user hasn't picked a specific prompt (i.e. SYSTEM_PROMPT
    // storage is empty or equals the previous default), apply the new
    // default immediately so the next chat uses it.
    const currentlySelected = safeLocalStorage.getItem(
      STORAGE_KEYS.SYSTEM_PROMPT
    );
    if (
      !currentlySelected ||
      currentlySelected === persistedDefault ||
      currentlySelected === DEFAULT_SYSTEM_PROMPT
    ) {
      const nextDefault = trimmed.trim()
        ? trimmed
        : DEFAULT_SYSTEM_PROMPT;
      setSystemPrompt(nextDefault);
      safeLocalStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, nextDefault);
    }

    // Refresh context state so any computed values derived from the
    // system prompt stay consistent.
    loadData();

    setSavedAt(Date.now());
    // Clear the "Saved!" indicator after a short delay.
    window.setTimeout(() => {
      setSavedAt((prev) => (prev === null ? null : prev));
    }, 2000);
  };

  const handleReset = () => {
    safeLocalStorage.removeItem(STORAGE_KEYS.CUSTOM_DEFAULT_PROMPT);
    setDraft(DEFAULT_SYSTEM_PROMPT);
    setIsDirty(false);

    // If the active system prompt was the old custom default, switch it
    // back to the hard-coded default too.
    const currentlySelected = safeLocalStorage.getItem(
      STORAGE_KEYS.SYSTEM_PROMPT
    );
    if (
      !currentlySelected ||
      currentlySelected === persistedDefault ||
      currentlySelected === DEFAULT_SYSTEM_PROMPT
    ) {
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      safeLocalStorage.setItem(
        STORAGE_KEYS.SYSTEM_PROMPT,
        DEFAULT_SYSTEM_PROMPT
      );
    }
    loadData();
  };

  const isUsingCustomDefault =
    persistedDefault !== DEFAULT_SYSTEM_PROMPT;

  return (
    <div id="default-prompt" className="space-y-3">
      <Header
        title="Default AI Prompt"
        description="Edit the default system prompt that controls the AI's identity and behavior. This is used whenever you haven't selected a specific prompt — perfect for stopping the AI from claiming to be 'Natively' or any other product name."
        isMainTitle
      />

      <div className="space-y-2">
        <Textarea
          placeholder="e.g., You are a helpful AI assistant. Be concise, accurate, and friendly. Never claim to be another product or service."
          className="min-h-[180px] max-h-[400px] resize-y overflow-y-auto font-mono text-sm"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground/70">
          💡 Tip: Be specific about the AI's role, tone, and any names it
          should (or should not) use. The prompt is sent at the start of
          every conversation.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={!isDirty}
          size="sm"
        >
          <SaveIcon className="h-4 w-4" />
          Save Default Prompt
        </Button>

        <Button
          onClick={handleReset}
          disabled={!isUsingCustomDefault}
          size="sm"
          variant="outline"
          title="Restore the hard-coded default prompt"
        >
          <RotateCcwIcon className="h-4 w-4" />
          Reset to Factory Default
        </Button>

        {savedAt && !isDirty && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckIcon className="size-3" />
            Saved
          </span>
        )}

        {isDirty && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Unsaved changes
          </span>
        )}
      </div>

      <p className="text-[10px] lg:text-xs text-muted-foreground/70">
        Currently active prompt preview:{" "}
        <span className="line-clamp-1 italic">
          {systemPrompt.length > 120
            ? `${systemPrompt.slice(0, 120)}…`
            : systemPrompt}
        </span>
      </p>
    </div>
  );
};
