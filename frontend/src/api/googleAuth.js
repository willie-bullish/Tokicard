// Google OAuth handler
export function initializeGoogleAuth() {
  // Load Google Identity Services script
  if (window.google) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        resolve();
      } else {
        reject(new Error('Google Identity Services failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export function handleGoogleSignIn(isLogin = false) {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    // TODO: Replace with your actual Google OAuth Client ID
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          // Decode the credential (JWT token)
          const credential = response.credential;
          
          // Send to backend for verification and user creation/login
          const endpoint = isLogin ? '/api/auth/google/login' : '/api/auth/google/register';
          
          const apiResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential })
          });

          if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'Authentication failed');
          }

          const data = await apiResponse.json();
          
          // Store auth token if provided
          if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user || {}));
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
      error_callback: (error) => {
        console.error('Google Sign-In error:', error);
        reject(new Error('Google Sign-In failed'));
      }
    });

    // Trigger the One Tap or Popup flow
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to button click flow
        window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile',
          callback: async (response) => {
            try {
              // Get user info from Google
              const userInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`
              );
              const userInfo = await userInfoResponse.json();

              // Send to backend
              const endpoint = isLogin ? '/api/auth/google/login' : '/api/auth/google/register';
              
              const apiResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  access_token: response.access_token,
                  userInfo
                })
              });

              if (!apiResponse.ok) {
                throw new Error('Authentication failed');
              }

              const data = await apiResponse.json();
              
              if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user || {}));
              }

              resolve(data);
            } catch (error) {
              reject(error);
            }
          }
        }).requestAccessToken();
      }
    });
  });
}

// Simplified button-based Google Sign-In
export async function signInWithGoogleButton(isLogin = false) {
  try {
    await initializeGoogleAuth();
    
    if (!window.google) {
      throw new Error('Google Identity Services not available');
    }

    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

    return new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (response) => {
          try {
            // Get user info from Google
            const userInfoResponse = await fetch(
              `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`
            );
            
            if (!userInfoResponse.ok) {
              throw new Error('Failed to fetch user info from Google');
            }
            
            const userInfo = await userInfoResponse.json();

            // Send to backend
            const endpoint = isLogin ? '/api/auth/google/login' : '/api/auth/google/register';
            
            const apiResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token: response.access_token,
                userInfo: {
                  email: userInfo.email,
                  name: userInfo.name,
                  picture: userInfo.picture,
                  id: userInfo.id
                }
              })
            });

            if (!apiResponse.ok) {
              const errorData = await apiResponse.json().catch(() => ({}));
              throw new Error(errorData.message || 'Authentication failed');
            }

            const data = await apiResponse.json();
            
            // Store auth token if provided
            if (data.token) {
              localStorage.setItem('authToken', data.token);
              localStorage.setItem('user', JSON.stringify(data.user || {}));
            }

            resolve(data);
          } catch (error) {
            reject(error);
          }
        },
        error_callback: (error) => {
          console.error('Google OAuth error:', error);
          reject(new Error('Google Sign-In failed'));
        }
      });

      client.requestAccessToken();
    });
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
    throw error;
  }
}

