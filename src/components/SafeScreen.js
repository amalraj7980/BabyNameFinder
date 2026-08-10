import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from '../styles';

/**
 * Consistent screen shell with safe-area insets.
 * Under stack headers: edges={['bottom','left','right']} (default).
 * Headerless (landing/splash overlays): edges={['top','bottom','left','right']}.
 */
const SafeScreen = ({
  children,
  style,
  edges = ['bottom', 'left', 'right'],
  backgroundColor,
}) => {
  const bg = backgroundColor ?? Colors.background ?? Colors.WHITE;

  return (
    <SafeAreaView edges={edges} style={[styles.root, {backgroundColor: bg}, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default SafeScreen;
