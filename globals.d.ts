declare function gradioApp(): Document & { getElementById(id: string): HTMLElement | null };

declare function onUiLoaded(callback: () => void): void;
declare function onUiUpdate(callback: (mutations: MutationRecord[]) => void): void;
declare function onAfterUiUpdate(callback: () => void): void;
declare function onUiTabChange(callback: () => void): void;
declare function onOptionsChanged(callback: () => void): void;

// よく使うグローバル変数
declare let opts: Record<string, unknown>;
declare function getENSD(): number;
declare function selected_gallery_index(): number;
