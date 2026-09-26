import React, { useEffect, useState } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useApp } from '../../src/store';
import { Page, Card, Txt, Button, Tag } from '../../src/ui';
import { NewsCard } from '../../src/news';
import { money, percent, total } from '../../src/finance';
import { api } from '../../src/api';
type Note = { id: string; body: string; created_at: string };
export default function Position() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { portfolio, articles, colors: c, favorite, user, run, busy, isDemo } = useApp();
  const p = portfolio.positions.find((p) => p.id === id);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => {
    if (user)
      run(async () => {
        setNotes(await api<Note[]>(`/journal?instrument=${encodeURIComponent(id)}`));
      });
  }, [id, user]);
  if (!p)
    return (
      <Page>
        <Txt>Position not found.</Txt>
        <Button onPress={() => router.replace('/')}>Back to portfolio</Button>
      </Page>
    );
  const related = articles.filter((a) => a.symbols.includes(p.symbol));
  return (
    <Page>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 9 }}>
          <Tag color={p.color}>
            {p.assetClass.toUpperCase()} · {p.symbol}
          </Tag>
          <Txt size={32} weight="700">
            {p.name}
          </Txt>
          <Txt size={15} color={c.muted}>
            {money(p.price, p.currency)} per unit
          </Txt>
        </View>
        <Button onPress={() => favorite(p.id)}>
          {portfolio.favorites.includes(p.id) ? '★ Favorited' : '☆ Favorite'}
        </Button>
      </View>
      <Card>
        <Txt mono size={10} color={c.muted}>
          YOUR POSITION
        </Txt>
        <Txt size={39} weight="700">
          {money(p.value, p.currency)}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28 }}>
          {[
            {
              label: 'Units held',
              value: p.units.toLocaleString(undefined, { maximumFractionDigits: 6 }),
            },
            { label: 'Cost basis', value: money(p.cost, p.currency) },
            {
              label: 'Unrealized return',
              value: percent(
                p.cost && p.value !== null ? ((p.value - p.cost) / p.cost) * 100 : null,
              ),
            },
            {
              label: 'Portfolio weight',
              value:
                p.currency === 'USD' && p.value !== null && total(portfolio.positions)
                  ? `${((p.value / total(portfolio.positions)) * 100).toFixed(2)}%`
                  : '—',
            },
          ].map((m) => (
            <View key={m.label} style={{ gap: 8 }}>
              <Txt size={11} color={c.muted}>
                {m.label}
              </Txt>
              <Txt size={16}>{m.value}</Txt>
            </View>
          ))}
        </View>
        <Txt size={11} color={c.muted}>
          Held at {p.accounts.join(' · ')}
          {p.asOf ? ` · Data as of ${new Date(p.asOf).toLocaleString()}` : ''}
        </Txt>
      </Card>
      <Card>
        <Txt size={19} weight="700">
          A note to your future self
        </Txt>
        <Txt size={12} color={c.muted}>
          Your thesis, a question, or simply a thought worth keeping.
        </Txt>
        <TextInput
          accessibilityLabel="Journal entry"
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="Why is this in your portfolio?"
          placeholderTextColor={c.muted}
          style={{
            minHeight: 100,
            padding: 14,
            color: c.text,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 9,
            textAlignVertical: 'top',
          }}
        />
        <Button
          primary
          disabled={!note.trim() || busy}
          onPress={() => {
            if (!user) {
              setNotes((n) => [
                { id: String(Date.now()), body: note, created_at: new Date().toISOString() },
                ...n,
              ]);
              setNote('');
              return;
            }
            run(async () => {
              const n = await api<Note>('/journal', { instrumentId: id, body: note });
              setNotes((old) => [n, ...old]);
              setNote('');
            });
          }}
        >
          Save note
        </Button>
        {isDemo && (
          <Txt size={10} color={c.muted}>
            Demo notes last while this screen is open. Sign in to save permanently.
          </Txt>
        )}
        {notes.map((n) => (
          <View
            key={n.id}
            style={{ padding: 14, backgroundColor: c.panel2, borderRadius: 8, gap: 8 }}
          >
            <Txt size={13} style={{ lineHeight: 21 }}>
              {n.body}
            </Txt>
            <Txt size={10} color={c.muted}>
              {new Date(n.created_at).toLocaleDateString()}
            </Txt>
          </View>
        ))}
      </Card>
      <Txt size={20} weight="700">
        In the conversation
      </Txt>
      <ScrollView horizontal contentContainerStyle={{ gap: 14 }}>
        {related.map((a) => (
          <View key={a.id} style={{ width: 300 }}>
            <NewsCard article={a} />
          </View>
        ))}
        {!related.length && <Txt color={c.muted}>No relevant headlines available yet.</Txt>}
      </ScrollView>
    </Page>
  );
}
