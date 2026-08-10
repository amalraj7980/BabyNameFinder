import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';

/** Shared compact control sizes (Preferences-aligned). */
export const ControlSizes = {
  buttonHeight: 42,
  buttonRadius: 21,
  buttonFont: 14,
  segmentHeight: 40,
  segmentFont: 13,
  chipPadH: 12,
  chipPadV: 7,
  chipFont: 12,
};

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'filled',
  icon,
  style,
  textStyle,
}) {
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.btn,
        isOutline ? styles.outline : styles.filled,
        (disabled || loading) && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={isOutline ? T.colors.primary : T.colors.textOnPrimary}
        />
      ) : (
        <View style={styles.btnInner}>
          {icon}
          <Text
            style={[
              styles.btnText,
              isOutline && styles.outlineText,
              textStyle,
            ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function ProgressSteps({step = 1, total = 3}) {
  return (
    <View style={styles.progressRow}>
      {Array.from({length: total}).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSeg,
            i < step ? styles.progressActive : styles.progressIdle,
          ]}
        />
      ))}
    </View>
  );
}

export function BrandMark({size = 56}) {
  const r = size / 2;
  return (
    <View style={[styles.brandWrap, {width: size * 1.55, height: size}]}>
      <View
        style={[
          styles.brandCircle,
          {
            width: size,
            height: size,
            borderRadius: r,
            backgroundColor: T.colors.primary,
            left: 0,
          },
        ]}
      />
      <View
        style={[
          styles.brandCircle,
          {
            width: size,
            height: size,
            borderRadius: r,
            backgroundColor: T.colors.partnerBlue,
            right: 0,
            opacity: 0.92,
          },
        ]}
      />
    </View>
  );
}

export function Chip({
  label,
  selected,
  locked,
  onPress,
  selectedColor = T.colors.chipSelectedMint,
  accent,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.chip,
        selected && {
          backgroundColor: selectedColor,
          borderColor: selectedColor,
        },
        accent && styles.chipAccent,
        locked && styles.chipLocked,
      ]}>
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          accent && styles.chipAccentText,
          locked && styles.chipLockedText,
        ]}>
        {label}
      </Text>
      {locked ? <Text style={styles.lock}>🔒</Text> : null}
    </TouchableOpacity>
  );
}

export function SegmentedTabs({options, value, onChange}) {
  return (
    <View style={styles.segmentRow}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}
            activeOpacity={0.85}>
            <Text
              style={[
                styles.segmentText,
                active && styles.segmentTextActive,
              ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ScreenScaffold({children, style}) {
  return <View style={[styles.scaffold, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  scaffold: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  btn: {
    height: ControlSizes.buttonHeight,
    borderRadius: ControlSizes.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  filled: {
    backgroundColor: T.colors.primary,
  },
  outline: {
    backgroundColor: T.colors.surface,
    borderWidth: 1.5,
    borderColor: T.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    color: T.colors.textOnPrimary,
    fontFamily: Fonts.bold,
    fontSize: ControlSizes.buttonFont,
  },
  outlineText: {
    color: T.colors.primary,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: T.space.lg,
    paddingTop: 8,
  },
  progressSeg: {
    flex: 1,
    height: 3,
    borderRadius: 3,
  },
  progressActive: {
    backgroundColor: T.colors.primary,
  },
  progressIdle: {
    backgroundColor: T.colors.progressTrack,
  },
  brandWrap: {
    position: 'relative',
    alignSelf: 'center',
  },
  brandCircle: {
    position: 'absolute',
    top: 0,
  },
  chip: {
    paddingHorizontal: ControlSizes.chipPadH,
    paddingVertical: ControlSizes.chipPadV,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.colors.chipInactiveBorder,
    backgroundColor: T.colors.chipInactiveBg,
    marginRight: 6,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipAccent: {
    borderColor: T.colors.primary,
    backgroundColor: T.colors.surface,
  },
  chipLocked: {
    opacity: 0.55,
  },
  chipText: {
    color: T.colors.textPrimary,
    fontFamily: Fonts.semibold,
    fontSize: ControlSizes.chipFont,
  },
  chipTextSelected: {
    color: T.colors.textOnPrimary,
  },
  chipAccentText: {
    color: T.colors.primary,
  },
  chipLockedText: {
    color: T.colors.chipLocked,
  },
  lock: {
    marginLeft: 5,
    fontSize: 9,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: ControlSizes.segmentHeight,
    borderRadius: ControlSizes.segmentHeight / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.colors.surface,
    borderWidth: 1,
    borderColor: T.colors.border,
  },
  segmentActive: {
    backgroundColor: T.colors.primary,
    borderColor: T.colors.primary,
  },
  segmentText: {
    fontFamily: Fonts.semibold,
    fontSize: ControlSizes.segmentFont,
    color: T.colors.textPrimary,
  },
  segmentTextActive: {
    color: T.colors.textOnPrimary,
  },
});
