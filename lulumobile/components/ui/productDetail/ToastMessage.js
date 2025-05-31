// ToastMessage.js
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

const ToastMessage = ({ message, visible, onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.delay(700),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        onHide(); // ẩn sau animation
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
      <View style={styles.toastBox}>
        <Text style={styles.toastText}>✔️ {message}</Text>
      </View>
    </Animated.View>
  );
};

export default ToastMessage;

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    zIndex: 1000,
  },
  toastBox: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
  }
});
