import React from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {authStyles} from './authStyles';

const GOOGLE_ICON = require('../../assects/google.png');

const AuthSocialFooter = ({
  message,
  actionLabel,
  onPress,
  onGooglePress,
  googleDisabled = false,
  showDivider = true,
}) => {
  return (
    <View>
      {showDivider ? (
        <View style={authStyles.socialDividerRow}>
          <View style={authStyles.socialDividerLine} />
          <Text style={authStyles.socialDividerText}>or continue with</Text>
          <View style={authStyles.socialDividerLine} />
        </View>
      ) : null}

      <Pressable
        onPress={onGooglePress}
        disabled={googleDisabled}
        style={[
          authStyles.googleButton,
          googleDisabled ? authStyles.googleButtonDisabled : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google">
        <Image source={GOOGLE_ICON} style={authStyles.googleIcon} resizeMode="contain" />
        <Text style={authStyles.googleButtonText}>Continue with Google</Text>
      </Pressable>

      <View style={authStyles.footerPromptRow}>
        <Text style={authStyles.footerText}>{message} </Text>
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={authStyles.footerLink}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AuthSocialFooter;
