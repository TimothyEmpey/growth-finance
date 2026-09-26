import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useApp } from '../../src/store';
import { Page, Heading, Card, Txt, Donut, Tag } from '../../src/ui';
import { Ticker } from '../../src/news';
import { allocation, total, money } from '../../src/finance';
export default function Breakdown() {
  const { portfolio: p, colors: c } = useApp();
  const groups = allocation(p.positions);
  const value = total(p.positions);
  const ranked = [...p.positions]
    .filter((x) => x.currency === 'USD' && x.value !== null)
    .sort((a, b) => b.value! - a.value!);
  const top3 = ranked.slice(0, 3).reduce((s, p) => s + p.value!, 0);
  const { width } = useWindowDimensions();
  return (
    <Page>
      <Heading
        eyebrow="ZOOM OUT. UNDERSTAND MORE."
        title="The bigger picture"
        subtitle="A closer look at how your portfolio fits together."
      />
      <Ticker />
      <View style={{ flexDirection: width >= 1100 ? 'row' : 'column', gap: 18 }}>
        <Card style={{ flex: 1 }}>
          <Txt size={18} weight="700">
            A little of everything
          </Txt>
          <Txt size={12} color={c.muted}>
            Asset allocation · positive USD holdings
          </Txt>
          <Donut groups={groups} />
          {groups.map((g) => (
            <View key={g.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ height: 8, width: 8, borderRadius: 2, backgroundColor: g.color }} />
              <Txt size={12} style={{ flex: 1 }}>
                {g.name}
              </Txt>
              <Txt size={12} color={c.muted}>
                {money(g.value)}
              </Txt>
              <Txt mono size={11} style={{ width: 58, textAlign: 'right' }}>
                {((g.value / groups.reduce((s, x) => s + x.value, 0)) * 100).toFixed(1)}%
              </Txt>
            </View>
          ))}
        </Card>
        <Card style={{ flex: 1 }}>
          <Txt size={18} weight="700">
            The heavy hitters
          </Txt>
          <Txt size={12} color={c.muted}>
            Largest positions by portfolio weight
          </Txt>
          {ranked.slice(0, 6).map((x, i) => (
            <View key={x.id} style={{ gap: 10, paddingVertical: 7 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Txt mono size={10} color={c.muted}>
                  0{i + 1}
                </Txt>
                <Txt size={12} weight="700" style={{ flex: 1 }}>
                  {x.symbol}
                </Txt>
                <Txt mono size={11}>
                  {value ? ((x.value! / value) * 100).toFixed(1) : '0'}%
                </Txt>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: c.panel2 }}>
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: x.color,
                    width: `${Math.min(100, Math.max(0, value ? (x.value! / value) * 100 : 0))}%`,
                  }}
                />
              </View>
            </View>
          ))}
        </Card>
      </View>
      <View style={{ flexDirection: width >= 1100 ? 'row' : 'column', gap: 18 }}>
        <Card style={{ flex: 1 }}>
          <Tag color={c.accent}>CONCENTRATION</Tag>
          <Txt size={34} weight="700">
            {value ? ((top3 / value) * 100).toFixed(1) : '0'}%
          </Txt>
          <Txt size={13}>of your portfolio is in your top 3 positions.</Txt>
          <Txt size={12} color={c.muted} style={{ lineHeight: 21 }}>
            A useful perspective on concentration. These are descriptive analytics, not a
            recommendation to change your allocation.
          </Txt>
        </Card>
        <Card style={{ flex: 1 }}>
          <Tag color={c.accent}>YOUR CONNECTIONS</Tag>
          {p.accounts.map((a) => (
            <View key={a.id} style={{ paddingVertical: 8, gap: 5 }}>
              <Txt size={14} weight="700">
                {a.institution}
              </Txt>
              <Txt size={12} color={c.muted}>
                {a.name}
              </Txt>
            </View>
          ))}
          {!p.accounts.length && (
            <Txt color={c.muted}>Connect your first account to get started.</Txt>
          )}
        </Card>
      </View>
    </Page>
  );
}
