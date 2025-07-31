export const awsconfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_MxeB9glae',
      userPoolClientId: '1ecoee73r65dk737rhgg3b3o97',
      loginWith: {
        oauth: {
          domain: 'smartfarm-12.auth.us-east-1.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['https://main.dl0cy1telszqd.amplifyapp.com/'],
          redirectSignOut: ['https://main.dl0cy1telszqd.amplifyapp.com/'],
          responseType: 'code', // Required for PKCE
        },
      },
    },
  },
};
