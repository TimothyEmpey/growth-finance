import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Path, Line, Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';
import { useApp } from './store';
export function Txt({
  children,
  size = 14,
  color,
  weight = '400',
  mono = false,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  mono?: boolean;
  style?: any;
}) {
  const { colors: c } = useApp();
  return (
    <Text
      selectable
      style={[
        {
          color: color || c.text,
          fontSize: size,
          fontWeight: weight,
          fontFamily: mono ? 'SpaceMono_400Regular' : 'DMSans_400Regular',
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Icon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const { colors: c } = useApp();
  const paths: Record<string, string> = {
    portfolio: 'M3 20V11h4v9M10 20V5h4v15M17 20V2h4v18',
    news: 'M4 3h16v18H4zM8 7h8M8 11h8M8 15h3M14 15h2M8 18h8',
    breakdown: 'M12 3v9h9M9 3a9 9 0 1 0 12 12',
    account: 'M20 21v-2a7 7 0 0 0-14 0v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
    arrow: 'M5 17 19 3M5 3h14v14',
    plus: 'M12 5v14M5 12h14',
    search: 'm21 21-6-6M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14',
    close: 'm6 6 12 12M6 18 18 6',
    refresh: 'M20 7a8 8 0 1 0 0 10M20 2v6h-6',
    shield: 'M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6zM8 12l3 3 5-6',
    star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || c.muted}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={paths[name] || paths.portfolio} />
    </Svg>
  );
}
export function PixelMark({ size = 32 }: { size?: number }) {
  const { colors: c } = useApp();
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path fill={c.accent} d="M0 20h8v12H0zm12-8h8v20h-8zM24 0h8v32h-8z" />
    </Svg>
  );
}
export function Button({
  children,
  onPress,
  primary = false,
  disabled = false,
  icon,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors: c } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        {
          minHeight: 44,
          paddingHorizontal: 16,
          paddingVertical: 11,
          borderRadius: 10,
          flexDirection: 'row',
          gap: 9,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: primary ? c.accent : c.border,
          backgroundColor: primary ? c.accent : hovered ? c.panel2 : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={16} color={primary ? c.accentText : c.text} />}
      <Txt size={12} weight="700" color={primary ? c.accentText : c.text}>
        {children}
      </Txt>
    </Pressable>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors: c } = useApp();
  return (
    <View
      style={[
        {
          backgroundColor: c.panel,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          padding: 24,
          gap: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  const { colors: c } = useApp();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 5,
        backgroundColor: c.panel2,
      }}
    >
      <Txt size={10} mono color={color || c.muted}>
        {children}
      </Txt>
    </View>
  );
}
export function Input({
  value,
  onChangeText,
  placeholder,
  secure = false,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secure?: boolean;
}) {
  const { colors: c } = useApp();
  return (
    <TextInput
      accessibilityLabel={placeholder}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      autoCapitalize="none"
      placeholderTextColor={c.muted}
      style={{
        padding: 14,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: c.border,
        color: c.text,
        backgroundColor: c.bg,
        fontSize: 14,
        minHeight: 48,
      }}
    />
  );
}
export function Page({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: width > 1000 ? 36 : 20,
        paddingBottom: 44,
        gap: 26,
        maxWidth: 1360,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      {children}
    </ScrollView>
  );
}
export function Heading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  const { colors: c } = useApp();
  return (
    <View style={{ gap: 12 }}>
      <Txt mono size={10} color={c.muted}>
        {eyebrow}
      </Txt>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <View style={{ gap: 7 }}>
          <Txt size={30} weight="700">
            {title}
            <Txt size={30} color={c.accent}>
              .
            </Txt>
          </Txt>
          <Txt color={c.muted} size={13}>
            {subtitle}
          </Txt>
        </View>
        {action}
      </View>
    </View>
  );
}
export function Chart({
  values,
  height = 220,
  mini = false,
}: {
  values: number[];
  height?: number;
  mini?: boolean;
}) {
  const { colors: c } = useApp();
  if (values.length < 2)
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Txt color={c.muted}>Your chart starts after two daily snapshots.</Txt>
      </View>
    );
  const w = 900,
    h = height,
    min = Math.min(...values),
    max = Math.max(...values);
  const points = values.map(
    (v, i) =>
      `${(i * w) / (values.length - 1)},${h - 20 - ((v - min) / (max - min || 1)) * (h - 40)}`,
  );
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.accent} stopOpacity="0.18" />
          <Stop offset="1" stopColor={c.accent} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {!mini &&
        [0.15, 0.45, 0.75].map((y) => (
          <Line
            key={y}
            x1={0}
            x2={w}
            y1={h * y}
            y2={h * y}
            stroke={c.border}
            strokeDasharray="3 7"
          />
        ))}
      <Path d={`M0,${h} L${points.join(' L')} L${w},${h} Z`} fill="url(#fill)" />
      <Path
        d={`M${points.join(' L')}`}
        fill="none"
        stroke={c.accent}
        strokeWidth={mini ? 2 : 2.7}
        vectorEffect="non-scaling-stroke"
      />
    </Svg>
  );
}
export function Donut({ groups }: { groups: { name: string; value: number; color: string }[] }) {
  const { colors: c } = useApp();
  const sum = groups.reduce((s, g) => s + g.value, 0);
  let offset = 0;
  return (
    <View style={{ width: 210, height: 210, alignSelf: 'center' }}>
      <Svg width={210} height={210} viewBox="0 0 210 210">
        <Circle cx={105} cy={105} r={82} fill="none" stroke={c.border} strokeWidth={22} />
        {groups.map((g) => {
          const len = sum ? (g.value / sum) * 515.22 : 0;
          const start = offset;
          offset += len;
          return (
            <Circle
              key={g.name}
              cx={105}
              cy={105}
              r={82}
              fill="none"
              stroke={g.color}
              strokeWidth={22}
              strokeDasharray={`${Math.max(0, len - 4)} ${515.22 - Math.max(0, len - 4)}`}
              strokeDashoffset={-start}
              transform="rotate(-90 105 105)"
            />
          );
        })}
      </Svg>
      <View
        style={{
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Txt size={28} weight="700">
          {groups.length}
        </Txt>
        <Txt size={10} mono color={c.muted}>
          ASSET CLASSES
        </Txt>
      </View>
    </View>
  );
}
