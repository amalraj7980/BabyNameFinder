import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  ActivityIndicator,
  Pressable,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {getTabBarStyle} from '../../routes/tabBarStyles';
import KeyboardAvoiding from '../../components/KeyboardAvoiding';
import {applyAppStatusBar} from '../../components/AppStatusBar';
import {
  sendBabyNameChatMessage,
  getBabyNameAiErrorMessage,
  createChatMessage,
} from '../../services/gemini/babyNameAi.service';
import {BABY_NAME_AI_STARTER_PROMPTS} from '../../services/gemini/babyNameAiSystem';
import {isGeminiConfigured} from '../../config/gemini';

const C = {
  bg: T.colors.background,
  bgEnd: T.colors.backgroundEnd,
  primary: T.colors.primary,
  text: T.colors.textPrimary,
  muted: T.colors.textSecondary,
  surface: T.colors.surface,
  border: T.colors.border,
  soft: 'rgba(255,107,107,0.10)',
  mint: T.colors.accentMint,
  blue: T.colors.partnerBlue,
};

const TOPIC_CHIPS = [
  {label: 'Gender', icon: 'male-female'},
  {label: 'Meaning', icon: 'book-outline'},
  {label: 'Origin', icon: 'globe-outline'},
  {label: 'Style', icon: 'color-palette-outline'},
  {label: 'Letter', icon: 'text-outline'},
  {label: 'Siblings', icon: 'people-outline'},
];

const ThinkingDots = () => {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 320,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
    const anim = Animated.parallel([
      pulse(a, 0),
      pulse(b, 140),
      pulse(c, 280),
    ]);
    anim.start();
    return () => anim.stop();
  }, [a, b, c]);

  const dotStyle = val => ({
    opacity: val.interpolate({inputRange: [0, 1], outputRange: [0.3, 1]}),
    transform: [
      {
        translateY: val.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -3],
        }),
      },
    ],
  });

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, dotStyle(a)]} />
      <Animated.View style={[styles.dot, dotStyle(b)]} />
      <Animated.View style={[styles.dot, dotStyle(c)]} />
    </View>
  );
};

const AiAssistant = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const sendingRef = useRef(false);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      applyAppStatusBar('dark-content');
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: {display: 'none', height: 0},
      });
      return () => {
        parent?.setOptions({
          tabBarStyle: getTabBarStyle(insets.bottom),
        });
        applyAppStatusBar('dark-content');
      };
    }, [navigation, insets.bottom]),
  );

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({animated: true});
    });
  }, []);

  useEffect(() => {
    if (messages.length || loading) {
      scrollToEnd();
    }
  }, [messages, loading, scrollToEnd]);

  const sendText = useCallback(
    async rawText => {
      const text = String(rawText || '').trim();
      if (!text || sendingRef.current || loading) {
        return;
      }

      Keyboard.dismiss();
      setError('');

      const userMessage = createChatMessage('user', text);
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput('');
      sendingRef.current = true;
      setLoading(true);

      try {
        if (!isGeminiConfigured()) {
          throw new Error('Gemini API key is not configured');
        }
        const assistantMessage = await sendBabyNameChatMessage({
          messages: nextMessages,
        });
        setMessages(prev => [...prev, assistantMessage]);
      } catch (e) {
        if (__DEV__) {
          console.log('[BabyNameAI] send failed');
        }
        setError(getBabyNameAiErrorMessage(e));
      } finally {
        sendingRef.current = false;
        setLoading(false);
      }
    },
    [loading, messages],
  );

  const onSend = useCallback(() => {
    sendText(input);
  }, [input, sendText]);

  const onStarterPress = useCallback(
    prompt => {
      sendText(prompt);
    },
    [sendText],
  );

  const canSend = Boolean(input.trim()) && !loading;

  const renderMessage = useCallback(({item}) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.msgRow,
          isUser ? styles.msgRowUser : styles.msgRowAi,
        ]}>
        {!isUser ? (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color={C.primary} />
          </View>
        ) : null}
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAi,
          ]}>
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextAi,
            ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }, []);

  const listHeader = useMemo(() => {
    if (messages.length > 0) {
      return <View style={styles.listTopSpacer} />;
    }
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.heroIconOuter}>
          <LinearGradient
            colors={['#FF8E8E', C.primary]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.heroIcon}>
            <Ionicons name="sparkles" size={28} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <Text style={styles.emptyTitle}>Baby Name Assistant</Text>
        <Text style={styles.emptySub}>
          Ask for names by gender, meaning, origin, style, or sibling match.
        </Text>

        <View style={styles.topicWrap}>
          {TOPIC_CHIPS.map(topic => (
            <View key={topic.label} style={styles.topicChip}>
              <Ionicons name={topic.icon} size={13} color={C.primary} />
              <Text style={styles.topicChipText}>{topic.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.starterLabel}>Try asking</Text>
        <View style={styles.starterWrap}>
          {BABY_NAME_AI_STARTER_PROMPTS.map(prompt => (
            <TouchableOpacity
              key={prompt}
              style={styles.starterChip}
              onPress={() => onStarterPress(prompt)}
              activeOpacity={0.88}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={prompt}>
              <View style={styles.starterIconWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={15} color={C.primary} />
              </View>
              <Text style={styles.starterChipText} numberOfLines={2}>
                {prompt}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [loading, messages.length, onStarterPress]);

  const listFooter = useMemo(() => {
    if (!loading) {
      return <View style={{height: 8}} />;
    }
    return (
      <View style={styles.msgRowAi}>
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color={C.primary} />
        </View>
        <View style={[styles.bubble, styles.bubbleAi, styles.thinkingBubble]}>
          <ThinkingDots />
          <Text style={styles.thinkingText}>AI is thinking…</Text>
        </View>
      </View>
    );
  }, [loading]);

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 10);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[C.bg, C.bgEnd, '#FFE4D4']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.blobCoral} pointerEvents="none" />
      <View style={styles.blobBlue} pointerEvents="none" />

      <View style={[styles.safe, {paddingTop: insets.top}]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerBadge}>
              <Ionicons name="sparkles" size={12} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Baby Name AI</Text>
              <Text style={styles.headerSub}>Find the perfect name with AI</Text>
            </View>
          </View>

          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        <KeyboardAvoiding style={styles.flex} extraOffset={8}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={scrollToEnd}
            showsVerticalScrollIndicator={false}
          />

          {error ? (
            <Pressable
              style={styles.errorBanner}
              onPress={() => setError('')}
              accessibilityRole="button"
              accessibilityLabel="Dismiss error">
              <Ionicons name="alert-circle" size={16} color={C.primary} />
              <Text style={styles.errorText}>{error}</Text>
              <Ionicons name="close" size={14} color={C.muted} />
            </Pressable>
          ) : null}

          <View style={[styles.composerWrap, {paddingBottom: bottomPad}]}>
            <View
              style={[
                styles.composerCard,
                inputFocused && styles.composerCardFocused,
              ]}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about baby names…"
                placeholderTextColor={C.muted}
                editable={!loading}
                multiline
                maxLength={800}
                returnKeyType="send"
                blurOnSubmit={false}
                onFocus={() => {
                  setInputFocused(true);
                  scrollToEnd();
                }}
                onBlur={() => setInputFocused(false)}
                onSubmitEditing={onSend}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                onPress={onSend}
                disabled={!canSend}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Send message">
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={17} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoiding>
      </View>
    </View>
  );
};

const softShadow = Platform.select({
  ios: {
    shadowColor: '#2D3436',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  android: {elevation: 2},
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  flex: {flex: 1},
  safe: {flex: 1},
  blobCoral: {
    position: 'absolute',
    top: -50,
    right: -36,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,107,107,0.12)',
  },
  blobBlue: {
    position: 'absolute',
    bottom: 140,
    left: -60,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(94,194,215,0.14)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: C.text,
  },
  headerSub: {
    marginTop: 1,
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: C.muted,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.mint,
  },
  liveText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: C.text,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexGrow: 1,
  },
  listTopSpacer: {
    height: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 10,
  },
  heroIconOuter: {
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: C.primary,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: {elevation: 4},
    }),
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: C.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: C.muted,
    textAlign: 'center',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  topicWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.surface,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: C.border,
  },
  topicChipText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: C.text,
  },
  starterLabel: {
    alignSelf: 'flex-start',
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: C.muted,
    marginBottom: 10,
    marginLeft: 2,
    letterSpacing: 0.2,
  },
  starterWrap: {
    alignSelf: 'stretch',
    gap: 8,
  },
  starterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...softShadow,
  },
  starterIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterChipText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: C.text,
  },
  msgRow: {
    marginBottom: 12,
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowUser: {
    alignSelf: 'flex-end',
  },
  msgRowAi: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    maxWidth: '92%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: C.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 5,
  },
  bubbleAi: {
    flexShrink: 1,
    backgroundColor: C.surface,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: C.border,
    ...softShadow,
  },
  bubbleText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTextAi: {
    color: C.text,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  thinkingText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: C.muted,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: C.soft,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: C.primary,
    lineHeight: 18,
  },
  composerWrap: {
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  composerCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    ...softShadow,
  },
  composerCardFocused: {
    borderColor: 'rgba(255,107,107,0.45)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: C.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});

export default AiAssistant;
