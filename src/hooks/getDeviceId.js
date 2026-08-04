// getDeviceId.js
import {useContext} from 'react';
import {AppContext} from '../context/AppContext';

const getDeviceId = () => {
  const {deviceId} = useContext(AppContext);
  return deviceId;
};

export default getDeviceId;
