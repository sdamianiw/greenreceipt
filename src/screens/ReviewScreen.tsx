import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { palette, fonts } from '../theme/chemtrace';
import { de } from '../locales/de';
import type { RootStackScreenProps } from '../types/navigation';
import { classify } from '../services/classify';
import { getOrCreateDeviceId } from '../services/deviceId';

export default function ReviewScreen({
  route,
  navigation,
}: RootStackScreenProps<'Review'>) {
  const [text, setText] = useState(route.params.ocrText);
  const [loading, setLoading] = useState(false);

  const onClassify = async () => {
    setLoading(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const verdict = await classify(text, deviceId);
      navigation.navigate('Verdict', { verdict });
    } catch (e) {
      // TODO T3: refine via `e instanceof z.ZodError` + Supabase FunctionsHttpError.context.response.status === 429.
      // For T2 mock-only path, this fallback chain is acceptable (mock never throws).
      const msg =
        e instanceof Error && e.message.includes('429')
          ? de.review.error.rateLimited
          : e instanceof Error && /parse|Zod/i.test(e.message)
            ? de.review.error.parse
            : de.review.error.network;
      Alert.alert(de.review.error.title, msg, [
        { text: de.review.error.retry, onPress: onClassify },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>{de.review.heading}</Text>
      <Text style={styles.instruction}>{de.review.instruction}</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        multiline
        placeholder={de.review.placeholder}
        placeholderTextColor={palette.creamDim}
        editable={!loading}
      />
      <Pressable
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={onClassify}
        disabled={loading}
        accessibilityLabel={
          loading ? de.review.classifying : de.review.classifyButton
        }
      >
        {loading ? (
          <ActivityIndicator color={palette.bg} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {de.review.classifyButton}
          </Text>
        )}
      </Pressable>
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  heading: {
    fontFamily: fonts.display,
    color: palette.cream,
    fontSize: 24,
  },
  instruction: {
    fontFamily: fonts.body,
    color: palette.creamDim,
    fontSize: 14,
  },
  input: {
    minHeight: 180,
    backgroundColor: palette.terminalBg,
    color: palette.cream,
    fontFamily: fonts.mono,
    fontSize: 15,
    lineHeight: 22,
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.creamDim,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: palette.rust,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    color: palette.bg,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  spacer: {
    height: 24,
  },
});
