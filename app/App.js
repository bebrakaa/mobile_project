/**
 * App.js — корневой компонент приложения «Дорожный монитор».
 *
 * Это минимальная оболочка приложения: главный экран с описанием функций
 * и кнопкой «Открыть справку». Сама справка (screens/HelpScreen.js) загружает
 * markdown-документацию с GitHub Pages.
 *
 * НАСТРОЙКА: впишите адрес своего сайта в config.js (в корне проекта) —
 * это единственная правка, которую нужно сделать вручную.
 *
 * Запуск:  npm install  →  npx expo start  →  отсканировать QR-код в Expo Go.
 */

import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import HelpScreen from './screens/HelpScreen';

const ACCENT = '#F57C00'; // фирменный «дорожный оранжевый»
const INK = '#1D1B20';
const MUTED = '#8A8580';

const FEATURES = [
  ['🗺️', 'Карта дефектов', 'Повреждения покрытия, знаков и разметки на карте города'],
  ['📝', 'Подача заявки', 'Место, фото и категория дефекта — за одну минуту'],
  ['🔔', 'Статусы заявок', 'Заявка проходит путь от «На модерации» до «Выполнена»'],
];

/* Главный экран — демо-оболочка. В полноценном проекте вместо неё будет
   карта и лента заявок; кнопку «Справка» достаточно вызвать так же:
  navigation.navigate('Help') при использовании react-navigation. */
function HomeScreen({ onOpenHelp }) {
  return (
    <ScrollView style={st.screen} contentContainerStyle={st.content}>
      <Text style={st.emoji}>🛣️</Text>
      <Text style={st.title}>Дорожный монитор</Text>
      <Text style={st.subtitle}>
        Мониторинг состояния дорожной инфраструктуры
      </Text>

      {FEATURES.map(([icon, name, desc]) => (
        <View key={name} style={st.card}>
          <Text style={st.cardIcon}>{icon}</Text>
          <View style={st.cardTextWrap}>
            <Text style={st.cardTitle}>{name}</Text>
            <Text style={st.cardText}>{desc}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={st.button}
        activeOpacity={0.85}
        onPress={onOpenHelp}>
        <Text style={st.buttonText}>Открыть справку</Text>
      </TouchableOpacity>
      <Text style={st.hint}>
        Справка загружается из сети: документация обновляется на сайте, без
        пересборки приложения
      </Text>
    </ScrollView>
  );
}

export default function App() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <View style={st.root}>
      <StatusBar style="dark" />
      {helpOpen ? (
        <HelpScreen onClose={() => setHelpOpen(false)} />
      ) : (
        <HomeScreen onOpenHelp={() => setHelpOpen(true)} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F3F0' },
  screen: { flex: 1 },
  content: { padding: 20, paddingTop: 72, paddingBottom: 40 },

  emoji: { fontSize: 44, textAlign: 'center' },
  title: {
    fontSize: 26, fontWeight: '700', color: INK, textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14.5, color: MUTED, textAlign: 'center', marginTop: 4,
    marginBottom: 20, lineHeight: 20,
  },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#EDE8E3',
    padding: 14, marginBottom: 10,
  },
  cardIcon: { fontSize: 26, marginRight: 12 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 15.5, fontWeight: '600', color: INK },
  cardText: { fontSize: 13, color: MUTED, lineHeight: 18, marginTop: 2 },

  button: {
    backgroundColor: ACCENT, borderRadius: 28, paddingVertical: 16,
    alignItems: 'center', marginTop: 12,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  hint: {
    fontSize: 12.5, color: MUTED, textAlign: 'center', marginTop: 14,
    lineHeight: 18,
  },
});
