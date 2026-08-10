import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {
  PrimaryButton,
  ProgressSteps,
  BrandMark,
  ScreenScaffold,
} from '../../components/ui/DesignSystem';
import {
  getOrCreatePartnerCode,
  setOnboardingDone,
  setPartnerLinked,
} from '../../services/onboardingStorage';
import {Storage} from '../../util';

const OnboardingPartnerScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [codeModal, setCodeModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const finish = useCallback(async () => {
    await setOnboardingDone(true);
    await Storage.setAppSetUpComplete('true');
    const parent = navigation.getParent();
    if (parent) {
      parent.reset({
        index: 0,
        routes: [{name: 'MainTabs'}],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{name: 'MainTabs'}],
      });
    }
  }, [navigation]);

  const invitePartner = useCallback(async () => {
    try {
      const code = await getOrCreatePartnerCode();
      await Share.open({
        title: 'Invite your partner',
        message: `Join me on Baby Names Together! Use code ${code} to start matching names together.`,
      });
    } catch (e) {
      // cancelled
    }
  }, []);

  const joinWithCode = useCallback(async () => {
    if (joinCode.trim().length < 4) {
      Alert.alert('Enter a valid invite code');
      return;
    }
    await setPartnerLinked(true);
    setCodeModal(false);
    await finish();
  }, [joinCode, finish]);

  return (
    <ScreenScaffold>
      <View style={{paddingTop: insets.top + 4}}>
        <ProgressSteps step={3} total={3} />
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={T.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <BrandMark size={72} />
        <Text style={styles.heading}>Better together</Text>
        <Text style={styles.sub}>
          Invite your partner to start matching. You can also swipe solo and
          connect later.
        </Text>
      </View>

      <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        <PrimaryButton
          title="Invite Partner"
          onPress={invitePartner}
          icon={
            <Ionicons name="share-outline" size={18} color={T.colors.textOnPrimary} />
          }
          style={styles.mb}
        />
        <PrimaryButton
          title="Continue Without Partner"
          variant="outline"
          onPress={finish}
          style={styles.mb}
        />
        <TouchableOpacity onPress={() => setCodeModal(true)}>
          <Text style={styles.link}>I have a code</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={codeModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter invite code</Text>
            <TextInput
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              placeholder="XM5XV8"
              placeholderTextColor={T.colors.textTertiary}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setCodeModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={joinWithCode}>
                <Text style={styles.modalOk}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
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
    marginTop: 28,
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: T.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  sub: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: T.colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
  },
  mb: {marginBottom: 12},
  link: {
    textAlign: 'center',
    color: T.colors.primary,
    fontFamily: Fonts.semibold,
    fontSize: 15,
    paddingVertical: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: T.colors.surface,
    borderRadius: T.radius.lg,
    padding: 20,
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: T.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: T.colors.border,
    borderRadius: T.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    letterSpacing: 2,
    color: T.colors.textPrimary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.colors.divider,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancel: {
    color: T.colors.textSecondary,
    fontFamily: Fonts.semibold,
  },
  modalOk: {
    color: T.colors.primary,
    fontFamily: Fonts.bold,
  },
});

export default OnboardingPartnerScreen;
