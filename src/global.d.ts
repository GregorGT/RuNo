interface Window {
    __TAURI__?: {
        invoke: (method: string, params?: Record<string, any>) => Promise<any>;
    };
}