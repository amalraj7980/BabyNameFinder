import {AUTH_DEEP_LINK_PREFIXES} from '../firebase/config';

export const prefixes = [
  'https://lily.ria.rocks',
  ...AUTH_DEEP_LINK_PREFIXES,
];

export const linkingConfig = {
  prefixes,
  config: {
    screens: {
      Home: {
        screens: {
          AiAssistant: {
            path: 'today/bots/ketoOrNot/genesisAI.php',
            parse: {
              assessment: '1',
              assistantName: 'R10-Baby Names Crafter',
            },
          },
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
