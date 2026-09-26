import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Animated, AccessibilityInfo, Pressable, Linking, Easing } from 'react-native';
import { useApp } from './store';
import { Txt, Tag, Icon, Card, PixelText } from './ui';
import { money, percent } from './finance';
import { Article } from '../shared/types';
export function Ticker() {
  const { portfolio, colors: c, isDemo } = useApp();
  const x = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let active = true;
    if (!trackWidth) return;
    x.setValue(0);
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!reduced && active) {
        animation = Animated.loop(
          Animated.timing(x, {
            toValue: -trackWidth,
            duration: Math.max(18000, trackWidth * 22),
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          { resetBeforeIteration: true },
        );
        animation.start();
      }
    });
    return () => {
      active = false;
      animation?.stop();
    };
  }, [trackWidth, x]);
  const tape = portfolio.positions.map((p, i) => (
    <View
      key={`${p.id}-${i}`}
      style={{
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRightWidth: 1,
        borderRightColor: c.border,
      }}
    >
      <PixelText text={p.symbol} color="#f1f6f8" scale={1.35} />
      <PixelText text={money(p.price, p.currency)} color="#f1f6f8" scale={1.25} />
      {isDemo && (
        <PixelText
          text={`${(p.change ?? 0) >= 0 ? '+' : '-'}${percent(p.change)?.replace(/^[+-]/, '') || ''}`}
          color={(p.change ?? 0) >= 0 ? '#5dff38' : '#ff4054'}
          scale={1.2}
        />
      )}
    </View>
  ));
  return (
    <View
      style={{
        overflow: 'hidden',
        paddingVertical: 8,
        backgroundColor: c.bg,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: c.border,
      }}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          width: trackWidth ? trackWidth * 2 : undefined,
          transform: [{ translateX: x }],
        }}
      >
        <View
          onLayout={(event) => setTrackWidth(Math.ceil(event.nativeEvent.layout.width))}
          style={{ flexDirection: 'row' }}
        >
          {tape}
        </View>
        <View style={{ flexDirection: 'row' }} aria-hidden>
          {tape}
        </View>
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
