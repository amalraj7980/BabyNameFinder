import {createNavigationContainerRef, CommonActions} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

/** Open Auth drawer stack on ResetPassword with oobCode (CareerMate-style). */
export const navigateToResetPassword = oobCode => {
  if (!navigationRef.isReady() || !oobCode) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Auth',
      params: {
        screen: 'ResetPassword',
        params: {oobCode},
      },
    }),
  );
};

export const navigateToAuthScreen = (screen, params) => {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Auth',
      params: {
        screen,
        params,
      },
    }),
  );
};

export const navigateToHome = () => {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Home',
    }),
  );
};
