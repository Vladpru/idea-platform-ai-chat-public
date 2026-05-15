/** Minimal typings for https://accounts.google.com/gsi/client (token client). */

export type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type GoogleTokenClient = {
  requestAccessToken: (overrideConfig?: object) => void;
};

export type GoogleTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (resp: GoogleTokenResponse) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (
            config: GoogleTokenClientConfig,
          ) => GoogleTokenClient;
        };
      };
    };
  }
}

export {};
