import {showMessage} from 'react-native-flash-message';

const protection = (message, defaultMessage = 'Sorry Some error occurred') => {
  let formattedMessage = defaultMessage;
  if (typeof message === 'string') {
    formattedMessage = message;
  }
  return formattedMessage;
};

/*Its getting all error notifications in Flash messages */

const showError = rawMessage => {
  const message = protection(rawMessage);

  showMessage({
    message: message,
    // description: message,
    type: 'danger',
  });
};

/*Its getting all success notifications in Flash messages */
const showSuccess = rawMessage => {
  const message = protection(rawMessage);
  showMessage({
    message: message,
    // description: message,
    type: 'success',
  });
};

/*Its getting firebase push notification in flash messages  */
const onNotification = (rawTitle, rawBody) => {
  const body = protection(rawBody, 'Sorry! An Error Occured!');
  const title = protection(rawTitle, 'Error');
  showMessage({
    message: title,
    description: body,
    type: 'info',
    autoHide: true,
    duration: 5000,
  });
};

export default {showError, showSuccess, onNotification};
