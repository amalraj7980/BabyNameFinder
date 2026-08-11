import React from 'react';
import {StyleSheet} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/**
 * Keyboard avoidance for AI chat + auth forms only.
 * Requires KeyboardProvider once at App root (does not change other screens).
 */
export function KeyboardAvoiding({
  children,
  extraOffset = 0,
  includeSafeAreaTop = false,
  style,
  ...rest
}) {
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset =
    extraOffset + (includeSafeAreaTop ? Math.max(insets.top, 0) : 0);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[styles.flex, style]}
      {...rest}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
});

export default KeyboardAvoiding;
