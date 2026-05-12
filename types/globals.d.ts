export {};

declare global {
    interface Window {
        PNEditor: {
          getOutputPrompt: () => string;
        };
    }
}
