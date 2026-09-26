import React, { useState } from 'react';
import { View, Pressable, TextInput, useWindowDimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../src/store';
import { Page, Heading, Card, Txt, Button, Tag, Chart, Icon } from '../../src/ui';
import { money, percent, total, ordered } from '../../src/finance';
export default function Portfolio() {
  const { portfolio: p, colors: c, isDemo, favorite, sync, busy } = useApp();
  const [filter, setFilter] = useState('All assets');
  const [range, setRange] = useState('6M');
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const value = total(p.positions);
  const days: Record<string, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 181, ALL: 9999 };
  const history = p.history.slice(-days[range]);
  const delta = history.length > 1 ? value - history[0].value : null;
  const cost = p.positions
    .filter((x) => x.currency === 'USD' && x.cost !== null && x.value !== null)
    .reduce((s, x) => s + x.cost!, 0);
  const knownValue = p.positions
    .filter((x) => x.currency === 'USD' && x.cost !== null)
    .reduce((s, x) => s + (x.value ?? 0), 0);
  const positions = ordered(p.positions, p.favorites, filter, search);
  return (
    <Page>
      <Heading
        eyebrow="A LITTLE PERSPECTIVE. A LOT OF POSSIBILITY."
        title="Your portfolio"
        subtitle="Everything you own. One clear picture."
        action={
          <Button
            icon={isDemo ? 'plus' : 'refresh'}
            onPress={() => (isDemo ? router.push('/account') : sync())}
            disabled={busy}
          >
            {isDemo ? 'Connect a brokerage' : busy ? 'Syncing…' : 'Sync accounts'}
          </Button>
        }
      />
      <Card style={{ padding: compact ? 20 : 28, gap: 22 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <View style={{ gap: 8 }}>
            <Txt mono size={10} color={c.muted}>
              TOTAL PORTFOLIO VALUE · USD
            </Txt>
            <Txt size={compact ? 36 : 48} weight="700" style={{ letterSpacing: -1.5 }}>
              {money(value)}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
              <Tag color={delta === null ? c.muted : delta >= 0 ? c.accent : c.red}>
                {delta === null
                  ? 'BUILDING HISTORY'
                  : `${delta >= 0 ? '↗' : '↘'} ${money(Math.abs(delta))} (${percent(history[0].value ? (delta / history[0].value) * 100 : null)})`}
              </Tag>
              <Txt size={11} color={c.muted}>
                value change
              </Txt>
            </View>
          </View>
          {!compact && (
            <View style={{ gap: 8, alignItems: 'flex-end' }}>
              <Tag>{isDemo ? 'SAMPLE DATA' : 'BROKERAGE DATA'}</Tag>
              <Txt size={11} color={c.muted}>
                {isDemo
                  ? 'A glimpse of what’s possible'
                  : p.syncedAt
                    ? `Synced ${new Date(p.syncedAt).toLocaleString()}`
                    : 'Ready when you are'}
              </Txt>
            </View>
          )}
        </View>
        <Chart values={history.map((h) => h.value)} height={compact ? 190 : 235} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[history[0], history[Math.floor(history.length / 2)], history[history.length - 1]]
            .filter(Boolean)
            .map((h, i) => (
              <Txt key={i} mono size={9} color={c.muted}>
                {new Date(h.date + 'T12:00:00Z').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Txt>
            ))}
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {Object.keys(days).map((r) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: r === range }}
                key={r}
                onPress={() => setRange(r)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 6,
                  backgroundColor: r === range ? c.accent : c.panel2,
                }}
              >
                <Txt mono size={10} color={r === range ? c.accentText : c.muted}>
                  {r}
                </Txt>
              </Pressable>
            ))}
          </View>
          <Txt size={10} color={c.muted}>
            Value history includes deposits & withdrawals
          </Txt>
        </View>
      </Card>
      <View style={{ flexDirection: compact ? 'column' : 'row', gap: 14 }}>
        {[
          {
            label: 'UNREALIZED RETURN',
            value: cost ? money(knownValue - cost) : '—',
            note: cost
              ? `${percent(((knownValue - cost) / cost) * 100)} on known cost basis`
              : 'Cost basis appears after connection',
            color: c.accent,
          },
          {
            label: 'ASSETS IN YOUR ORBIT',
            value: String(p.positions.length).padStart(2, '0'),
            note: `Across ${new Set(p.positions.map((x) => x.assetClass)).size} asset classes`,
            color: c.text,
          },
          {
            label: 'CONNECTED ACCOUNTS',
            value: String(p.accounts.length).padStart(2, '0'),
            note: isDemo ? 'Illustrative brokerage accounts' : 'Read-only. Always in your control.',
            color: c.text,
          },
        ].map((s) => (
          <Card key={s.label} style={{ flex: 1, padding: 20, gap: 9 }}>
            <Txt size={9} mono color={c.muted}>
              {s.label}
            </Txt>
            <Txt size={27} weight="700" color={s.color}>
              {s.value}
            </Txt>
            <Txt size={11} color={c.muted}>
              {s.note}
            </Txt>
          </Card>
        ))}
      </View>
      {p.warnings.map((w, i) => (
        <Tag key={i} color={c.red}>
          {w}
        </Tag>
      ))}
      <View style={{ gap: 18 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Txt size={20} weight="700">
              Your positions
            </Txt>
            <Tag>{p.positions.length}</Tag>
          </View>
          <Txt size={11} color={c.muted}>
            ★ Favorites first
          </Txt>
        </View>
        <View
          style={{
            flexDirection: compact ? 'column' : 'row',
            gap: 12,
            justifyContent: 'space-between',
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {['All assets', 'Stocks', 'ETFs', 'Crypto', 'Bonds', 'Cash', 'Other'].map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: f === filter ? c.accent : c.border,
                  borderRadius: 7,
                  backgroundColor: f === filter ? c.panel2 : 'transparent',
                }}
              >
                <Txt size={11} color={f === filter ? c.accent : c.muted}>
                  {f}
                </Txt>
              </Pressable>
            ))}
          </ScrollView>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 8,
              paddingHorizontal: 12,
            }}
          >
            <Icon name="search" size={15} />
            <TextInput
              accessibilityLabel="Search positions"
              value={search}
              onChangeText={setSearch}
              placeholder="Find an asset…"
              placeholderTextColor={c.muted}
              style={{ color: c.text, paddingVertical: 11, width: 135, fontSize: 12 }}
            />
          </View>
        </View>
        <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
          <View
            style={{
              flexDirection: 'row',
              padding: 17,
              borderBottomWidth: 1,
              borderColor: c.border,
              gap: 12,
            }}
          >
            <Txt size={9} mono color={c.muted} style={{ flex: 1 }}>
              ASSET / NAME
            </Txt>
            {!compact && (
              <Txt size={9} mono color={c.muted} style={{ width: 110, textAlign: 'right' }}>
                PRICE
              </Txt>
            )}
            <Txt
              size={9}
              mono
              color={c.muted}
              style={{ width: compact ? 95 : 130, textAlign: 'right' }}
            >
              POSITION VALUE
            </Txt>
            {!compact && (
              <Txt size={9} mono color={c.muted} style={{ width: 90, textAlign: 'right' }}>
                RETURN
              </Txt>
            )}
            <View style={{ width: 30 }} />
          </View>
          {positions.map((x) => (
            <View
              key={x.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 17,
                borderBottomWidth: 1,
                borderColor: c.border,
                gap: 12,
              }}
            >
              <Pressable
                onPress={() => router.push({ pathname: '/position/[id]', params: { id: x.id } })}
                accessibilityLabel={`View ${x.name}`}
                style={({ hovered }: any) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 18,
                  gap: 12,
                  backgroundColor: hovered ? c.panel2 : 'transparent',
                })}
              >
                <View
                  style={{
                    height: 38,
                    width: 38,
                    borderRadius: 11,
                    backgroundColor: x.color + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt color={x.color} weight="800" size={x.symbol === 'BTC' ? 23 : 15}>
                    {x.symbol === 'BTC' ? '₿' : x.symbol === 'ETH' ? 'Ξ' : x.symbol.slice(0, 1)}
                  </Txt>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt weight="700" size={13}>
                    {x.symbol}
                  </Txt>
                  <Txt size={10} color={c.muted}>
                    {compact ? x.assetClass : x.name}
                  </Txt>
                </View>
                {!compact && (
                  <Txt size={12} style={{ width: 110, textAlign: 'right' }}>
                    {money(x.price, x.currency)}
                  </Txt>
                )}
                <View style={{ width: compact ? 95 : 130, alignItems: 'flex-end', gap: 4 }}>
                  <Txt size={13} weight="700">
                    {money(x.value, x.currency)}
                  </Txt>
                  <Txt size={10} color={c.muted}>
                    {x.units.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                    {x.assetClass === 'Cash' ? 'USD' : 'units'}
                  </Txt>
                </View>
                {!compact && (
                  <Txt
                    size={12}
                    color={
                      x.cost !== null && x.value !== null && x.value < x.cost ? c.red : c.accent
                    }
                    style={{ width: 90, textAlign: 'right' }}
                  >
                    {percent(
                      x.cost && x.value !== null ? ((x.value - x.cost) / x.cost) * 100 : null,
                    )}
                  </Txt>
                )}
              </Pressable>
              <Pressable
                onPress={() => favorite(x.id)}
                accessibilityLabel={`${p.favorites.includes(x.id) ? 'Unfavorite' : 'Favorite'} ${x.symbol}`}
                style={{ width: 30, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Txt size={21} color={p.favorites.includes(x.id) ? c.accent : c.muted}>
                  {p.favorites.includes(x.id) ? '★' : '☆'}
                </Txt>
              </Pressable>
            </View>
          ))}
          {!positions.length && (
            <View style={{ padding: 40, gap: 10 }}>
              <Txt>No positions here yet.</Txt>
              <Txt size={12} color={c.muted}>
                {p.positions.length
                  ? 'Try a different filter or search.'
                  : 'Connect a brokerage from Account, then sync to start your financial journal.'}
              </Txt>
            </View>
          )}
        </Card>
        <Txt mono size={9} color={c.muted}>
          {isDemo
            ? 'ILLUSTRATIVE DATA · NOT LIVE MARKET PRICES'
            : 'PRICES AS PROVIDED BY YOUR BROKERAGES · MAY BE DELAYED'}
        </Txt>
      </View>
    </Page>
  );
}
