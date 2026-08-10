import React, {useCallback, useContext, useState} from 'react';

import ConfirmationModal from '../../components/ConfirmationModal';
import {AppContext} from '../../context/AppContext';
import {
  installDownloadedAndroidUpdate,
  useAppUpdateStore,
} from '../../services/appUpdate';

/**
 * CareerMate parity — shown after Play Flexible (in-app) update finishes downloading.
 */
const InAppUpdateReadyModal = () => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  const copy = locale?.appUpdate || {};
  const restartReady = useAppUpdateStore(s => s.restartReady);
  const clearRestartReady = useAppUpdateStore(s => s.clearRestartReady);
  const [installing, setInstalling] = useState(false);

  const handleRestart = useCallback(() => {
    if (installing) {
      return;
    }
    setInstalling(true);
    try {
      installDownloadedAndroidUpdate();
    } catch (e) {
      clearRestartReady();
      setInstalling(false);
    }
  }, [clearRestartReady, installing]);

  return (
    <ConfirmationModal
      visible={!!restartReady}
      type="default"
      title={copy.restartTitle || 'Update ready'}
      description={
        copy.restartMessage ||
        'The new version has finished downloading. Restart now to install it.'
      }
      primaryText={
        installing
          ? copy.restarting || 'Restarting…'
          : copy.restartNow || 'Restart now'
      }
      secondaryText={null}
      onPrimary={handleRestart}
      onClose={() => undefined}
    />
  );
};

export default InAppUpdateReadyModal;
