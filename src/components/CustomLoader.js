import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import {Colors} from '../styles';

const CustomLoader = () => {
  const spinValue = new Animated.Value(0); // Initial value of spin

  // Define the rotation animation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Start the animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinValue]);

  return (
    <View style={styles.customLoader}>
      <Animated.View
        style={[
          styles.circle,
          {transform: [{rotate: spin}]}, // Apply rotation animation
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  customLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    position: 'absolute',
  },
});

export default CustomLoader;
