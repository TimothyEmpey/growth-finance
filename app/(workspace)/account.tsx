import React, { useState } from 'react';
import { View, Linking, useWindowDimensions } from 'react-native';
import { Page, Heading, Card, Txt, Button, Input, Tag, Icon } from '../../src/ui';
import { useApp } from '../../src/store';
import { api } from '../../src/api';
export default function Account() {
  const {
    user,
    colors: c,
    theme,
    setTheme,
    authenticate,
    busy,
    logout,
    portfolio,
    run,
    sync,
  } = useApp();
  const [register, setRegister] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { width } = useWindowDimensions();
  async function connect() {
    await run(async () => {
      const d = await api<{ url: string }>('/connections/portal', {});
      if (!d.url.startsWith('https://')) throw new Error('Invalid connection URL');
      await Linking.openURL(d.url);
    });
  }
  return (
    <Page>
      <Heading
        eyebrow="YOUR SPACE. YOUR PREFERENCES."
        title="Make yourself at home"
        subtitle="A few small settings. A view that’s entirely yours."
      />
      <View style={{ flexDirection: width >= 1100 ? 'row' : 'column', gap: 20 }}>
        <View style={{ flex: 1, gap: 20 }}>
          <Card>
            <Txt size={20} weight="700">
              {user
                ? `Hello, ${user.name}`
                : register
                  ? 'Your next chapter starts here'
                  : 'Welcome back'}
            </Txt>
            <Txt size={12} color={c.muted} style={{ lineHeight: 21 }}>
              {user
                ? user.email
                : 'Create your Growth Finance account to connect your brokerages and keep your financial world in one place.'}
            </Txt>
            {!user ? (
              <>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button primary={register} onPress={() => setRegister(true)}>
                    Create account
                  </Button>
                  <Button primary={!register} onPress={() => setRegister(false)}>
                    Sign in
                  </Button>
                </View>
                {register && <Input value={name} onChangeText={setName} placeholder="Your name" />}
                <Input value={email} onChangeText={setEmail} placeholder="Email address" />
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password (12+ characters)"
                  secure
                />
                <Button
                  primary
                  disabled={busy || !email || password.length < 12 || (register && !name.trim())}
                  onPress={() => authenticate(email, password, name, register)}
                >
                  {busy ? 'One moment…' : register ? 'Create your account →' : 'Sign in →'}
                </Button>
                <Txt size={11} color={c.muted}>
                  Account creation requires the local or deployed Growth Finance backend.
                </Txt>
              </>
            ) : (
              <Button onPress={logout} disabled={busy}>
                Sign out
              </Button>
            )}
          </Card>
          <Card>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Txt size={18} weight="700">
                Brokerage connections
              </Txt>
              <Icon name="shield" color={c.accent} />
            </View>
            <Txt size={12} color={c.muted} style={{ lineHeight: 21 }}>
              One secure connection portal for the brokerages available through your SnapTrade plan.
              Data access only. No trades or money movement.
            </Txt>
            {user &&
              portfolio.accounts.map((a) => (
                <View
                  key={a.id}
                  style={{ padding: 13, backgroundColor: c.panel2, borderRadius: 8, gap: 4 }}
                >
                  <Txt size={13}>{a.institution}</Txt>
                  <Txt size={11} color={c.muted}>
                    {a.name}
                  </Txt>
                </View>
              ))}
            <Button primary icon="plus" disabled={!user || busy} onPress={connect}>
              Connect a brokerage
            </Button>
            {user && (
              <Button icon="refresh" disabled={busy} onPress={sync}>
                {busy ? 'Syncing…' : 'I’ve connected · Sync accounts'}
              </Button>
            )}
            <Txt size={11} color={c.muted}>
              {user
                ? 'After completing the portal, return here and sync.'
                : 'Sign in first to connect your accounts.'}
            </Txt>
          </Card>
        </View>
        <View style={{ flex: 1, gap: 20 }}>
          <Card>
            <Txt size={18} weight="700">
              Set the mood
            </Txt>
            <Txt size={12} color={c.muted}>
              Your dashboard, in your preferred light.
            </Txt>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {(['dark', 'light', 'system'] as const).map((t) => (
                <Button key={t} primary={t === theme} onPress={() => setTheme(t)}>
                  {t === 'dark' ? '☾ Dark' : t === 'light' ? '☼ Light' : '◐ System'}
                </Button>
              ))}
            </View>
            <View
              style={{
                height: 100,
                backgroundColor: c.bg,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 10,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2,
                      backgroundColor: i === 0 ? c.accent : c.muted,
                    }}
                  />
                ))}
              </View>
              <View
                style={{ width: '60%', height: 7, backgroundColor: c.border, borderRadius: 3 }}
              />
              <View
                style={{ width: '38%', height: 18, backgroundColor: c.accent, borderRadius: 3 }}
              />
            </View>
          </Card>
          <Card>
            <Txt size={18} weight="700">
              The fine print
            </Txt>
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: c.border }}>
              <Txt size={13}>Privacy policy</Txt>
            </View>
            <View style={{ paddingVertical: 12 }}>
              <Txt size={13}>Support</Txt>
            </View>
          </Card>
          <Card>
            <Tag color={c.accent}>BUILT FOR PERSPECTIVE</Tag>
            <Txt size={13} style={{ lineHeight: 23 }}>
              A quieter place to keep track of your financial life.
            </Txt>
            <Txt mono size={10} color={c.muted}>
              GROWTH FINANCE / V1.0
            </Txt>
          </Card>
        </View>
      </View>
    </Page>
  );
}
