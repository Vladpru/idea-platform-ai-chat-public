const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let gsiScriptPromise: Promise<void> | null = null;

export function loadGoogleGsiScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('Google Sign-In is only available in the browser'),
    );
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (gsiScriptPromise) {
    return gsiScriptPromise;
  }
  gsiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SCRIPT_SRC}"]`,
    );
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => {
          gsiScriptPromise = null;
          reject(new Error('Failed to load Google Sign-In script'));
        },
        { once: true },
      );
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiScriptPromise = null;
      reject(new Error('Failed to load Google Sign-In script'));
    };
    document.head.appendChild(script);
  });
  return gsiScriptPromise;
}

export function requestGoogleAccessToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (typeof clientId !== 'string' || clientId.length === 0) {
    return Promise.reject(new Error('VITE_GOOGLE_CLIENT_ID is not set'));
  }

  return loadGoogleGsiScript().then(
    () =>
      new Promise((resolve, reject) => {
        const oauth2 = window.google?.accounts?.oauth2;
        if (!oauth2) {
          reject(new Error('Google Sign-In is not available'));
          return;
        }
        const client = oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: resp => {
            if (resp.error) {
              reject(
                new Error(
                  resp.error_description?.trim() ||
                    resp.error ||
                    'Google Sign-In failed',
                ),
              );
              return;
            }
            const token = resp.access_token;
            if (typeof token !== 'string' || token.length === 0) {
              reject(new Error('Google Sign-In was cancelled'));
              return;
            }
            resolve(token);
          },
        });
        client.requestAccessToken();
      }),
  );
}
