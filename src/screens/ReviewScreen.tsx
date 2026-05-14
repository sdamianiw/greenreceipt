import { useState } from 'react';
import {
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

export default function ReviewScreen({
  route,
}: RootStackScreenProps<'Review'>) {
  const [text, setText] = useState(route.params.ocrText);

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
      />
      <Pressable style={[styles.primaryButton, styles.primaryButtonDisabled]} disabled>
        <Text style={styles.primaryButtonText}>{de.review.classifyButton}</Text>
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
