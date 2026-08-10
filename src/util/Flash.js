import {showMessage} from 'react-native-flash-message';

const protection = (message, defaultMessage = 'Sorry Some error occurred') => {
  let formattedMessage = defaultMessage;
  if (typeof message === 'string' && message.trim()) {
    formattedMessage = message.trim();
  }
  return formattedMessage;
};

/* Top flash error banners */
const showError = rawMessage => {
  const message = protection(rawMessage);

  showMessage({
    message,
    type: 'danger',
    position: 'top',
    icon: 'danger',
    duration: 4000,
    floating: true,
  });
};

/* Top flash success banners */
const showSuccess = rawMessage => {
  const message = protection(rawMessage);
  showMessage({
    message,
    type: 'success',
    position: 'top',
    icon: 'success',
    duration: 3000,
    floating: true,
  });
};

/* Firebase push notification flash messages */
const onNotification = (rawTitle, rawBody) => {
  const body = protection(rawBody, 'Sorry! An Error Occured!');
  const title = protection(rawTitle, 'Error');
  showMessage({
    message: title,
    description: body,
    type: 'info',
    position: 'top',
    autoHide: true,
    duration: 5000,
    floating: true,
  });
};

export default {showError, showSuccess, onNotification};
