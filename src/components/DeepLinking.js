import {AUTH_DEEP_LINK_PREFIXES} from '../firebase/config';

export const prefixes = [
  'https://lily.ria.rocks',
  ...AUTH_DEEP_LINK_PREFIXES,
];

export const linkingConfig = {
  prefixes,
  config: {
    screens: {
      MainTabs: {
        screens: {
          Discover: 'discover',
          Matches: 'matches',
          Preferences: 'preferences',
        },
      },
      Auth: {
        screens: {
          ResetPassword: {
            path: 'auth',
            parse: {
              oobCode: oobCode => oobCode,
            },
          },
          SignIn: 'signin',
          SignUp: 'signup',
          ForgotPassword: 'forgot',
          EmailVerification: 'verify',
        },
      },
    },
  },
};
