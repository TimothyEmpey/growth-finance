import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useApp } from '../../src/store';
import { Page, Heading, Txt, Button, Card } from '../../src/ui';
import { Ticker, NewsCard } from '../../src/news';
export default function Topics() {
  const { articles, colors: c, isDemo } = useApp();
  const [filter, setFilter] = useState('For you');
  const { width } = useWindowDimensions();
  const shown = articles.filter((a) => filter === 'For you' || a.category === filter);
  return (
    <Page>
      <Heading
        eyebrow="LESS NOISE. MORE SIGNAL."
        title="Hot topics"
        subtitle="The stories connected to your corner of the market."
      />
      <Ticker />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['For you', ...new Set(articles.map((a) => a.category))].map((f) => (
          <Button key={f} primary={f === filter} onPress={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </View>
      <View style={{ flexDirection: width >= 1100 ? 'row' : 'column', gap: 18 }}>
        {shown.slice(0, 2).map((a) => (
          <NewsCard key={a.id} article={a} featured />
        ))}
      </View>
      <View style={{ flexDirection: width >= 1100 ? 'row' : 'column', gap: 18 }}>
        {shown.slice(2).map((a) => (
          <NewsCard key={a.id} article={a} />
        ))}
      </View>
      {!shown.length && (
        <Card>
          <Txt>No headlines yet.</Txt>
          <Txt color={c.muted} size={13}>
            Stories will appear for your holdings once the news provider is configured and your
            accounts are synced.
          </Txt>
        </Card>
      )}
      <Txt mono size={9} color={c.muted}>
        {isDemo
          ? 'SAMPLE EDITORIAL CONTENT · LIVE NEWS APPEARS AFTER SETUP'
          : 'HEADLINES MATCH YOUR EQUITY SYMBOLS AND BROADER MARKET THEMES'}
      </Txt>
    </Page>
  );
}
