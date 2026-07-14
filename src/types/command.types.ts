// Types for the global command palette + quick add system.

export type CommandGroup =
  | 'Pages'
  | 'Create'
  | 'Actions'
  | 'Tasks'
  | 'Notes'
  | 'Projects'
  | 'Calendar';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  group: CommandGroup;
  keywords?: string[];
  /** Display-only hint, e.g. '⌘K'. */
  shortcut?: string;
  /** Defaults to enabled; set false to explain why it can't run yet. */
  enabled?: boolean;
  disabledReason?: string;
  execute: () => void;
}

export type QuickAddType =
  | 'task'
  | 'note'
  | 'event'
  | 'project'
  | 'finance'
  | 'savings'
  | 'learning';

/** Runtime hooks the registry needs — supplied by the palette component. */
export interface CommandContext {
  navigate: (path: string) => void;
  toggleTheme: () => void;
  quickAdd: (type: QuickAddType) => void;
  comingSoon: (label: string) => void;
}
