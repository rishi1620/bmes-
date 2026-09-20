/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "*.json" {
  const value: Record<string, unknown>;
  export default value;
}

declare module "*firebase-applet-config.json" {
  const value: {
    projectId?: string;
    appId?: string;
    apiKey?: string;
    authDomain?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    measurementId?: string;
    oAuthClientId?: string;
    recaptchaSiteKey?: string;
    [key: string]: unknown;
  };
  export default value;
}
