import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {
  PrimaryButton,
  ProgressSteps,
  ScreenScaffold,
} from '../../components/ui/DesignSystem';
import {setDisplayName} from '../../services/onboardingStorage';

const OnboardingNameScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');

  const onContinue = useCallback(async () => {
    await setDisplayName(name.trim());
    navigation.navigate('OnboardingPartner');
  }, [name, navigation]);

  return (
    <ScreenScaffold>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{paddingTop: insets.top + 4}}>
          <ProgressSteps step={2} total={3} />
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={T.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <Text style={styles.heading}>This is how you'll appear in the app</Text>
          <Text style={styles.sub}>
            Your partner will see this when you match
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={T.colors.textTertiary}
            style={styles.input}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onContinue}
          />

          <Text style={styles.waiting}>113 names waiting for you</Text>
          <Text style={styles.hint}>
            Prefer not to say? No problem, tap Continue.
          </Text>
        </View>

        <View
          style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 16)}]}>
          <PrimaryButton title="Continue" onPress={onContinue} />
        </View>
      </KeyboardAvoidingView>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
  back: {
    marginLeft: 12,
    marginTop: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: T.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: T.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    fontFamily: Fonts.medium,
    fontSize: 28,
    color: T.colors.textPrimary,
    textAlign: 'center',
    minWidth: '80%',
    marginBottom: 20,
    paddingVertical: 8,
  },
  waiting: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: T.colors.textSecondary,
    marginBottom: 8,
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: T.colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
});

export default OnboardingNameScreen;
