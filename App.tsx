import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import HomeScreen from './src/screens/HomeScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import VerdictScreen from './src/screens/VerdictScreen';
import ShareScreen from './src/screens/ShareScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { palette, fonts } from './src/theme/chemtrace';
import { de } from './src/locales/de';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.bg,
    card: palette.bg,
    text: palette.cream,
    primary: palette.rust,
    border: palette.terminalBg,
  },
};

export default function App() {
  const [loaded] = useFonts({
    Fraunces_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: palette.bg },
            headerTitleStyle: { fontFamily: fonts.display, color: palette.cream },
            headerTintColor: palette.cream,
            contentStyle: { backgroundColor: palette.bg },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: de.app.name }}
          />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{ title: de.review.heading }}
          />
          <Stack.Screen
            name="Verdict"
            component={VerdictScreen}
            options={{ title: de.verdict.heading }}
          />
          <Stack.Screen
            name="Share"
            component={ShareScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
