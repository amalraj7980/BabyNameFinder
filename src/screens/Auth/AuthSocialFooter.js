import React from 'react';
import {ActivityIndicator, Image, Pressable, Text, View} from 'react-native';
import {authStyles} from './authStyles';

const GOOGLE_ICON = require('../../assects/google.png');

const AuthSocialFooter = ({
  message,
  actionLabel,
  onPress,
  onGooglePress,
  googleDisabled = false,
  googleLoading = false,
  showDivider = true,
}) => {
  const disabled = googleDisabled || googleLoading;

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
        disabled={disabled}
        style={[
          authStyles.googleButton,
          disabled ? authStyles.googleButtonDisabled : null,
          googleLoading ? authStyles.googleButtonLoading : null,
        ]}
        accessibilityRole="button"
        accessibilityState={{disabled, busy: googleLoading}}
        accessibilityLabel={
          googleLoading ? 'Signing in with Google' : 'Continue with Google'
        }>
        {googleLoading ? (
          <>
            <ActivityIndicator size="small" color="#FF6B6B" />
            <Text style={authStyles.googleButtonText}>Signing in…</Text>
          </>
        ) : (
          <>
            <Image
              source={GOOGLE_ICON}
              style={authStyles.googleIcon}
              resizeMode="contain"
            />
            <Text style={authStyles.googleButtonText}>Continue with Google</Text>
          </>
        )}
      </Pressable>

      <View style={authStyles.footerPromptRow}>
        <Text style={authStyles.footerText}>{message} </Text>
        <Pressable onPress={onPress} hitSlop={8} disabled={googleLoading}>
          <Text
            style={[
              authStyles.footerLink,
              googleLoading ? authStyles.footerLinkDisabled : null,
            ]}>
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AuthSocialFooter;
