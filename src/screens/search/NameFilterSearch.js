import React, {useState, useContext, useEffect, useCallback} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppContext} from '../../context/AppContext';
import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';

const C = {
  bg: '#FFF8F2',
  primary: '#FF6B6B',
  text: '#2C3340',
  muted: '#8B95A5',
  surface: '#FFFFFF',
  border: '#E6ECF3',
  boy: '#5EC2D7',
  girl: '#FF6B6B',
  unisex: '#98D8AA',
};

const GENDER_OPTIONS = [
  {label: 'All', value: 'all', color: C.text},
  {label: 'Boy', value: 'male', color: C.boy},
  {label: 'Girl', value: 'female', color: C.girl},
  {label: 'Unisex', value: 'unisex', color: C.unisex},
];

export default function NameFilterSearch({navigation}) {
  const insets = useSafeAreaInsets();
  const {seachfilterData, setSeachfilterData} = useContext(AppContext);

  const [focusedInput, setFocusedInput] = useState(null);
  const [isCompoundSwitchOn, setIsCompoundSwitchOn] = useState(false);

  useEffect(() => {
    setIsCompoundSwitchOn(!!seachfilterData?.compoundLetter);
  }, [seachfilterData]);

  const handleFilterChange = useCallback(
    (field, nextValue) => {
      setSeachfilterData(prev => ({
        ...prev,
        [field]: nextValue,
      }));
    },
    [setSeachfilterData],
  );

  const toggleCompoundSwitch = useCallback(() => {
    setIsCompoundSwitchOn(prev => {
      const next = !prev;
      handleFilterChange('compoundLetter', next);
      return next;
    });
  }, [handleFilterChange]);

  const handleApply = useCallback(() => {
    setSeachfilterData(prev => ({
      ...prev,
      search: false,
    }));
    navigation.goBack();
  }, [navigation, setSeachfilterData]);

  const handleReset = useCallback(() => {
    setSeachfilterData({
      firstLetter: '',
      lastLetter: '',
      contains: '',
      compoundLetter: false,
      gender: 'all',
      search: false,
    });
    setIsCompoundSwitchOn(false);
  }, [setSeachfilterData]);

  const Field = ({label, field, value}) => {
    const active = focusedInput === field;
    return (
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, active && styles.fieldLabelActive]}>
          {label}
        </Text>
        <TextInput
          style={[styles.input, active && styles.inputActive]}
          value={value}
          onChangeText={text => handleFilterChange(field, text)}
          onFocus={() => setFocusedInput(field)}
          onBlur={() => setFocusedInput(null)}
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    );
  };

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filter</Text>
        <TouchableOpacity onPress={handleReset} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: Math.max(insets.bottom, 16) + 24},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Field
              label="Starts with"
              field="firstLetter"
              value={seachfilterData?.firstLetter || ''}
            />
            <Field
              label="Ends with"
              field="lastLetter"
              value={seachfilterData?.lastLetter || ''}
            />
            <Field
              label="Contains"
              field="contains"
              value={seachfilterData?.contains || ''}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Compound names only</Text>
              <Switch
                trackColor={{false: '#D8DEE6', true: '#FFD0D0'}}
                thumbColor={isCompoundSwitchOn ? C.primary : '#F4F4F5'}
                ios_backgroundColor="#D8DEE6"
                onValueChange={toggleCompoundSwitch}
                value={isCompoundSwitchOn}
              />
            </View>

            <Text style={styles.sectionLabel}>Gender</Text>
            <View style={styles.genderWrap}>
              {GENDER_OPTIONS.map(opt => {
                const selected = seachfilterData?.gender === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.genderChip,
                      selected && {
                        backgroundColor: opt.color,
                        borderColor: opt.color,
                      },
                    ]}
                    onPress={() => handleFilterChange('gender', opt.value)}
                    activeOpacity={0.85}>
                    <Text
                      style={[
                        styles.genderChipText,
                        selected && styles.genderChipTextOn,
                        !selected && {color: opt.color},
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.88}>
            <Text style={styles.applyText}>Apply filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#2D3436',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: {elevation: 2},
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: C.text,
  },
  resetText: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: C.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    marginBottom: 20,
    ...softShadow,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: C.muted,
    marginBottom: 8,
  },
  fieldLabelActive: {
    color: C.primary,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: C.text,
    backgroundColor: '#FAFBFC',
  },
  inputActive: {
    borderColor: C.primary,
    backgroundColor: C.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    marginBottom: 14,
  },
  toggleLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: C.text,
  },
  sectionLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: C.muted,
    marginBottom: 12,
  },
  genderWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 10,
  },
  genderChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
    marginHorizontal: 4,
    marginBottom: 10,
  },
  genderChipText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  genderChipTextOn: {
    color: '#FFFFFF',
  },
  applyBtn: {
    height: 42,
    borderRadius: 21,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
