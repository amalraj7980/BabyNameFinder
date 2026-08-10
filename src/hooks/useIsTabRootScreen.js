import {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

import {navigationRef} from '../routes/navigationRef';

const isStackAtRoot = stackState => {
  if (!stackState?.routes?.length) {
    return true;
  }
  return (stackState.index ?? 0) <= 0;
};

/**
 * True when the active MainTabs stack is on its root screen
 * (CareerMate parity — exit confirm only then).
 */
export const useIsTabRootScreen = () => {
  const [isTabRoot, setIsTabRoot] = useState(true);

  const evaluate = useCallback(() => {
    if (!navigationRef.isReady()) {
      setIsTabRoot(false);
      return;
    }

    const rootState = navigationRef.getRootState();
    if (!rootState?.routes?.length) {
      setIsTabRoot(false);
      return;
    }

    const activeRoot = rootState.routes[rootState.index ?? 0];
    if (activeRoot?.name !== 'MainTabs' || !activeRoot.state) {
      setIsTabRoot(false);
      return;
    }

    const tabState = activeRoot.state;
    const activeTab = tabState.routes[tabState.index ?? 0];
    setIsTabRoot(isStackAtRoot(activeTab?.state));
  }, []);

  useFocusEffect(
    useCallback(() => {
      evaluate();
      const unsubscribe = navigationRef.addListener('state', evaluate);
      return unsubscribe;
    }, [evaluate]),
  );

  return isTabRoot;
};

export default useIsTabRootScreen;
