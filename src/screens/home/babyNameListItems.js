import React, {memo, useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Colors} from '../../styles';
import {styles} from './babyNamesScreenStyles';

const HIT_SLOP_12 = {top: 12, bottom: 12, left: 12, right: 12};

export const getCardBackgroundColor = gender => {
  if (gender === 'Female') {
    return Colors.secondary;
  }
  if (gender === 'Male') {
    return Colors.Boy;
  }
  if (gender === 'Unisex' || gender === 'Neutral') {
    return Colors.unisex;
  }
  return Colors.Boy;
};

export const EmptyNamesState = memo(() => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateText}>No results found</Text>
  </View>
));

EmptyNamesState.displayName = 'EmptyNamesState';

export const CompactNameRow = memo(function CompactNameRow({
  item,
  onLike,
  onDislike,
  onOpenDetails,
}) {
  const nameColor = getCardBackgroundColor(item.gender);

  const handleDislike = useCallback(() => onDislike(item.id), [onDislike, item.id]);
  const handleLike = useCallback(() => onLike(item.id), [onLike, item.id]);
  const handleDetails = useCallback(
    () => onOpenDetails(item),
    [onOpenDetails, item],
  );

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        onPress={handleDislike}
        style={styles.CompactdislikeButton}
        accessibilityRole="button"
        accessibilityLabel="Dislike">
        <AntDesign name="dislike2" size={20} color={Colors.WHITE} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDetails} style={styles.compactNameHit}>
        <Text style={[styles.compactNameText, {color: nameColor}]}>
          {item.name}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleLike}
        style={styles.CompactlikeButton}
        accessibilityRole="button"
        accessibilityLabel="Like">
        <AntDesign name="like2" size={20} color={Colors.WHITE} />
      </TouchableOpacity>
    </View>
  );
});

export const GridNameCard = memo(function GridNameCard({
  item,
  onLike,
  onDislike,
  onOpenDetails,
}) {
  const bg = getCardBackgroundColor(item.gender);

  const handleDislike = useCallback(() => onDislike(item.id), [onDislike, item.id]);
  const handleLike = useCallback(() => onLike(item.id), [onLike, item.id]);
  const handleDetails = useCallback(
    () => onOpenDetails(item),
    [onOpenDetails, item],
  );

  return (
    <View style={[styles.gridCard, {backgroundColor: bg}]}>
      <View style={styles.gridNameRow}>
        <Text style={styles.name}>{item.name}</Text>
      </View>
      <View style={styles.gridActionsRow}>
        <TouchableOpacity onPress={handleDislike} style={styles.cardActionBtn}>
          <AntDesign name="dislike2" size={25} color={Colors.WHITE} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDetails} style={styles.cardActionBtn}>
          <AntDesign
            name="exclamationcircle"
            size={20}
            color={Colors.WHITE}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLike} style={styles.cardActionBtn}>
          <AntDesign name="like2" size={25} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export const SwipeNameCard = memo(function SwipeNameCard({
  card,
  swipeDirection,
  onLike,
  onDislike,
  onOpenDetails,
  onShare,
}) {
  if (!card) {
    return null;
  }

  const bg = getCardBackgroundColor(card.gender);

  const handleDislike = useCallback(() => onDislike(card.id), [onDislike, card.id]);
  const handleLike = useCallback(() => onLike(card.id), [onLike, card.id]);
  const handleDetails = useCallback(
    () => onOpenDetails(card),
    [onOpenDetails, card],
  );
  const handleShare = useCallback(() => onShare(card.name), [onShare, card.name]);

  return (
    <View style={[styles.card, styles.cardCentered, {backgroundColor: bg}]}>
      <TouchableOpacity
        onPress={handleShare}
        hitSlop={HIT_SLOP_12}
        style={styles.cardActionBtn}>
        <AntDesign name="sharealt" size={28} color={Colors.WHITE} />
      </TouchableOpacity>

      {swipeDirection === 'right' ? (
        <Text style={styles.likeText}>Like</Text>
      ) : null}
      {swipeDirection === 'left' ? (
        <Text style={styles.dislikeText}>Dislike</Text>
      ) : null}

      <View style={styles.cardNameWrap}>
        <Text style={styles.cardHeroName} numberOfLines={2}>
          {card.name}
        </Text>
      </View>

      <View style={styles.cardActionsRow}>
        <TouchableOpacity onPress={handleDislike} style={styles.cardActionBtn}>
          <AntDesign name="dislike2" size={34} color={Colors.WHITE} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDetails} style={styles.cardActionBtn}>
          <AntDesign
            name="exclamationcircle"
            size={28}
            color={Colors.WHITE}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLike} style={styles.cardActionBtn}>
          <AntDesign name="like2" size={34} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
});
