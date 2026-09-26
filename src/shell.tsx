import React from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { Slot, usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from './store';
import { Txt, Icon, PixelMark, PixelText, Tag } from './ui';
import { Ticker } from './news';
const nav = [
  { path: '/', label: 'Portfolio', icon: 'portfolio' },
  { path: '/topics', label: 'Hot topics', icon: 'news' },
  { path: '/breakdown', label: 'Breakdown', icon: 'breakdown' },
  { path: '/account', label: 'Account', icon: 'account' },
];
export function Shell() {
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  const { colors: c, isDemo, error, setError, user } = useApp();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const links = nav.map((n) => (
    <Pressable
      key={n.path}
      accessibilityRole="tab"
      accessibilityState={{ selected: path === n.path }}
      onPress={() => router.push(n.path as any)}
      style={({ hovered }: any) => ({
        flex: wide ? undefined : 1,
        flexDirection: wide ? 'row' : 'column',
        alignItems: 'center',
        gap: wide ? 12 : 5,
        paddingVertical: wide ? 14 : 11,
        paddingHorizontal: wide ? 16 : 2,
        borderRadius: 9,
        backgroundColor: path === n.path ? c.panel2 : hovered ? c.panel : 'transparent',
        borderLeftWidth: wide && path === n.path ? 2 : 0,
        borderLeftColor: c.accent,
      })}
    >
      <Icon name={n.icon} color={path === n.path ? c.accent : c.muted} size={wide ? 19 : 21} />
      <Txt
        size={wide ? 13 : 10}
        color={path === n.path ? c.text : c.muted}
        weight={path === n.path ? '700' : '400'}
      >
        {n.label}
      </Txt>
      {wide && path === n.path && (
        <View style={{ marginLeft: 'auto', height: 5, width: 5, backgroundColor: c.accent }} />
      )}
    </Pressable>
  ));
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, flexDirection: 'row', paddingTop: insets.top }}>
      {wide && (
        <View
          style={{ width: 230, borderRightWidth: 1, borderColor: c.border, padding: 24, gap: 40 }}
        >
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 }}>
            <PixelMark />
            <View>
              <PixelText text="GROWTH" color={c.text} scale={2.25} />
              <PixelText text="FINANCE" color={c.muted} scale={1} />
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Txt mono size={9} color={c.muted} style={{ padding: 14, letterSpacing: 2 }}>
              YOUR WORKSPACE
            </Txt>
            {links}
          </View>
          <View style={{ marginTop: 'auto', gap: 18 }}>
            <View
              style={{
                padding: 16,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                gap: 10,
              }}
            >
              <Icon name="shield" color={c.accent} />
              <Txt size={12}>Your money. Your view.</Txt>
              <Txt size={11} color={c.muted} style={{ lineHeight: 18 }}>
                Connected to your world.{'\n'}Always read-only.
              </Txt>
            </View>
            <Pressable
              onPress={() => router.push('/account')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  backgroundColor: c.panel2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Txt color={c.accent}>{user?.name?.[0]?.toUpperCase() || 'G'}</Txt>
              </View>
              <View>
                <Txt size={12}>{user?.name || 'Your personal space'}</Txt>
                <Txt size={10} color={c.muted}>
                  {isDemo ? 'Exploring demo' : 'Investor'}
                </Txt>
              </View>
            </Pressable>
          </View>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            height: 62,
            borderBottomWidth: 1,
            borderColor: c.border,
            paddingHorizontal: wide ? 36 : 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {wide ? (
            <Txt size={11} color={c.muted}>
              Workspace /{' '}
              <Txt size={11}>{nav.find((n) => n.path === path)?.label || 'Position'}</Txt>
            </Txt>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <PixelMark size={21} />
              <PixelText text="GROWTH FINANCE" color={c.text} scale={1.3} />
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 6, height: 6, backgroundColor: c.accent, borderRadius: 3 }} />
            <Tag>{isDemo ? 'DEMO WORKSPACE' : 'READ-ONLY'}</Tag>
          </View>
        </View>
        {!!error && (
          <Pressable
            accessibilityLabel="Dismiss error"
            onPress={() => setError('')}
            style={{ padding: 14, backgroundColor: c.panel2 }}
          >
            <Txt size={12} color={c.red}>
              {error} ×
            </Txt>
          </Pressable>
        )}
        <Ticker />
        <View style={{ flex: 1, minHeight: 0 }}>
          <Slot />
        </View>
        {!wide && (
          <View
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderColor: c.border,
              paddingBottom: Math.max(insets.bottom, 8),
              paddingHorizontal: 8,
              backgroundColor: c.panel,
            }}
          >
            {links}
          </View>
        )}
      </View>
    </View>
  );
}
