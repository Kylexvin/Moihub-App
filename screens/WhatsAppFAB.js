import React from 'react';
import { TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WhatsAppChannelFAB = () => {
  const openChannel = async () => {
    const channelUrl = 'https://whatsapp.com/channel/0029Vakr1ijGOj9kufZu2x33';
    try {
      await Linking.openURL(channelUrl);
    } catch (err) {
      console.warn('Failed to open channel link:', err);
    }
  };

  return (
    <TouchableOpacity style={styles.fab} onPress={openChannel}>
      <Ionicons name="logo-whatsapp" size={28} color="#fff" />
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#135029ff',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 999,
  },
});

export default WhatsAppChannelFAB;
