import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono/400Regular';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useApp } from '../src/store';
function Routes() {
  const { colors: c, dark } = useApp();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(workspace)" />
        <Stack.Screen
          name="position/[id]"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Position details',
            headerStyle: { backgroundColor: c.panel },
            headerTintColor: c.text,
          }}
        />
      </Stack>
    </>
  );
}
export default function Layout() {
  useFonts({ DMSans_400Regular, SpaceMono_400Regular });
  return (
    <SafeAreaProvider>
      <Provider>
        <Routes />
      </Provider>
    </SafeAreaProvider>
  );
}
