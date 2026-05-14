import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VerdictResponse } from './verdict';

export type RootStackParamList = {
  Home: undefined;
  Review: { ocrText: string };
  Verdict: { verdict: VerdictResponse };
  Share: undefined;
  History: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
