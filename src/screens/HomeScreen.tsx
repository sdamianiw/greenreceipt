import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { palette, fonts } from '../theme/chemtrace';
import { de } from '../locales/de';
import type { RootStackScreenProps } from '../types/navigation';

export default function HomeScreen({ navigation }: RootStackScreenProps<'Home'>) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.cream} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionWrap}>
        <Text style={styles.heading}>{de.home.permissionTitle}</Text>
        <Text style={styles.body}>{de.home.permissionMessage}</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>{de.home.permissionGrant}</Text>
        </Pressable>
      </View>
    );
  }

  const handleCapture = async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        Alert.alert(de.home.ocrError);
        return;
      }
      const result = await TextRecognition.recognize(photo.uri);
      const text = result.text?.trim() ?? '';
      if (__DEV__) console.log('[OCR] extracted:', text);
      if (!text) {
        Alert.alert(de.home.ocrEmpty);
        return;
      }
      navigation.navigate('Review', { ocrText: text });
    } catch (err) {
      console.warn('[OCR] error:', err);
      Alert.alert(de.home.ocrError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.overlay}>
        <Text style={styles.heading}>{de.home.heading}</Text>
        <Text style={styles.subheading}>{de.home.subheading}</Text>
        <Pressable
          style={[styles.primaryButton, busy && styles.primaryButtonDisabled]}
          disabled={busy}
          onPress={handleCapture}
        >
          {busy ? (
            <>
              <ActivityIndicator color={palette.bg} />
              <Text style={[styles.primaryButtonText, styles.busyText]}>
                {de.home.scanning}
              </Text>
            </>
          ) : (
            <Text style={styles.primaryButtonText}>{de.home.scanButton}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: palette.bg,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bg,
  },
  permissionWrap: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 16,
  },
  heading: {
    fontFamily: fonts.display,
    color: palette.cream,
    fontSize: 24,
  },
  subheading: {
    fontFamily: fonts.body,
    color: palette.creamDim,
    fontSize: 14,
  },
  body: {
    fontFamily: fonts.body,
    color: palette.cream,
    fontSize: 16,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: palette.rust,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    color: palette.bg,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  busyText: {
    marginLeft: 4,
  },
});
