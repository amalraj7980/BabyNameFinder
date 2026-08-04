/**
 * Simple update-gate store (CareerMate zustand equivalent, no extra dep).
 */
import {useEffect, useState} from 'react';
import {markOptionalUpdateSnoozedToday} from './optionalUpdateSnooze';

let phase = 'idle';
let decision = null;
const listeners = new Set();

const emit = () => {
  listeners.forEach(fn => {
    try {
      fn({phase, decision});
    } catch (e) {
      // ignore
    }
  });
};

export const appUpdateStore = {
  getState: () => ({phase, decision}),
  subscribe: listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  markChecking: () => {
    phase = 'checking';
    decision = null;
    emit();
  },
  requireIosUpdate: next => {
    phase = 'ios_required';
    decision = next;
    emit();
  },
  markDone: () => {
    phase = 'done';
    decision = null;
    emit();
  },
  dismissOptionalIosUpdate: () => {
    if (decision?.severity === 'force') {
      return;
    }
    void markOptionalUpdateSnoozedToday();
    phase = 'done';
    decision = null;
    emit();
  },
};

export function useAppUpdateStore() {
  const [state, setState] = useState(appUpdateStore.getState());
  useEffect(() => appUpdateStore.subscribe(setState), []);
  return {
    ...state,
    markChecking: appUpdateStore.markChecking,
    requireIosUpdate: appUpdateStore.requireIosUpdate,
    markDone: appUpdateStore.markDone,
    dismissOptionalIosUpdate: appUpdateStore.dismissOptionalIosUpdate,
  };
}
