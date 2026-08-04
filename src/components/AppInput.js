import React, {forwardRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Colors, Fonts} from '../styles';

/**
 * CareerMate-style form input for Baby Names (RN 0.70 JS).
 * Label + bordered field + optional left icon + password eye + error.
 */
const AppInput = forwardRef(function AppInput(
  {
    label,
    value,
    onChangeText,
    placeholder,
    error,
    helper,
    leftIcon,
    leftIconSet = 'ion',
    secureTextEntry,
    containerStyle,
    inputWrapperStyle,
    style,
    placeholderTextColor = Colors.placeholder,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(!!secureTextEntry);

  useEffect(() => {
    setSecure(!!secureTextEntry);
  }, [secureTextEntry]);

  const borderColor = error
    ? Colors.errorRed
    : focused
      ? Colors.primary
      : Colors.lightGray;

  const LeftIconComp = leftIconSet === 'fa' ? Icon : Ionicons;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {color: focused ? Colors.primary : Colors.textGray},
          ]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {borderColor, backgroundColor: Colors.WHITE},
          inputWrapperStyle,
        ]}>
        {leftIcon ? (
          <LeftIconComp
            name={leftIcon}
            size={18}
            color={Colors.tintGray}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          key={secureTextEntry ? (secure ? 'secure' : 'plain') : 'text'}
          ref={ref}
          style={[styles.textInput, style]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={secureTextEntry ? secure : false}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setSecure(s => !s)}
            hitSlop={8}
            style={styles.iconButton}>
            <Icon
              name={secure ? 'eye-slash' : 'eye'}
              size={18}
              color={Colors.tintGray}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helper ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  leftIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textGray,
    paddingVertical: 10,
  },
  iconButton: {
    padding: 6,
  },
  helperText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginTop: 4,
    color: Colors.textLight,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 4,
    color: Colors.errorRed,
  },
});

export default AppInput;
