import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Modal,
  Linking
} from 'react-native';
import Share from 'react-native-share';
import {styles} from './spreadTheWordStyles';


const SpreadTheWord = ({isVisible, onClose}) => {
  const shareLink = 'https://www.babynametogether.com/';
  const shareMessage =
    "Hey there! 👶📱 Discover the perfect name for your baby with this app. It's a fun and easy way to explore a wide range of baby names. Get it now on the Play Store: https://play.google.com/apps/internaltest/4701588407774598849 and start your exciting naming journey!";
  const shareOptions = {
    title: 'Share via',
    message: shareMessage,
    //url: shareLink,
  };

  const handleShare = async platform => {
    try {
      await Share.open(shareOptions);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      {/* Transparent overlay to capture taps and close the modal */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => handleShare('message')}>
              <Text>Share by Text Message</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare('email')}>
              <Text>Share by Email</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare('whatsapp')}>
              <Text>Share on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare('facebook')}>
              <Text>Share on Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare('instagram')}>
              <Text>Share on Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare('twitter')}>
              <Text>Share on Twitter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text>Close Modal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};


export default SpreadTheWord;
