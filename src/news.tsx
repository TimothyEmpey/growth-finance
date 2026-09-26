import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Animated, AccessibilityInfo, Pressable, Linking } from 'react-native';
import { useApp } from './store';
import { Txt, Tag, Icon, Card } from './ui';
import { money, percent } from './finance';
import { Article } from '../shared/types';
export function Ticker() {
  const { portfolio, colors: c, isDemo } = useApp();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!reduced && active) {
        animation = Animated.loop(
          Animated.timing(x, { toValue: -600, duration: 26000, useNativeDriver: true }),
        );
        animation.start();
      }
    });
    return () => {
      active = false;
      animation?.stop();
    };
  }, []);
  return (
    <View
      style={{
        overflow: 'hidden',
        paddingVertical: 14,
        backgroundColor: c.panel,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: c.border,
      }}
    >
      <Animated.View style={{ flexDirection: 'row', gap: 32, transform: [{ translateX: x }] }}>
        {[...portfolio.positions, ...portfolio.positions].map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Txt mono size={12}>
              {p.symbol}
            </Txt>
            <Txt mono size={12} color={c.accent}>
              {money(p.price, p.currency)}
            </Txt>
            {isDemo && (
              <Txt mono size={10} color={(p.change ?? 0) >= 0 ? c.accent : c.red}>
                {percent(p.change)}
              </Txt>
            )}
            <Txt color={c.border}>◆</Txt>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
export function NewsCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const { colors: c, isDemo } = useApp();
  return (
    <Card style={{ gap: 17, flex: 1, padding: featured ? 28 : 22 }}>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Tag color={c.accent}>{article.category.toUpperCase()}</Tag>
        <Txt mono size={9} color={c.muted}>
          {isDemo ? 'SAMPLE STORY' : new Date(article.publishedAt).toLocaleDateString()}
        </Txt>
      </View>
      {featured && (
        <View
          style={{
            height: 110,
            justifyContent: 'center',
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 7,
            paddingHorizontal: 18,
          }}
        >
          {Array.from({ length: 25 }, (_, i) => (
            <View
              key={i}
              style={{
                width: 9,
                backgroundColor: i > 16 ? c.accent : c.border,
                height: 16 + ((i * 13) % 31) + i * 2,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
          ))}
        </View>
      )}
      <Txt size={featured ? 25 : 19} weight="700" style={{ lineHeight: featured ? 33 : 27 }}>
        {article.title}
      </Txt>
      <Txt size={12} color={c.muted} style={{ lineHeight: 21 }}>
        {article.summary}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
        {article.symbols.map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
        }}
      >
        <Txt size={11} color={c.muted}>
          {article.source}
        </Txt>
        {article.url && (
          <Pressable
            accessibilityLabel={`Read ${article.title}`}
            onPress={() => {
              if (article.url?.startsWith('https://')) Linking.openURL(article.url);
            }}
            style={{ padding: 10 }}
          >
            <Icon name="arrow" size={17} color={c.accent} />
          </Pressable>
        )}
      </View>
    </Card>
  );
}
