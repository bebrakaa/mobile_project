/**
 * HelpScreen.js — экран «Справка» приложения «Дорожный монитор».
 *
 * Экран скачивает markdown-файлы документации с GitHub Pages по сети
 * (GET-запрос) и рендерит их через react-native-markdown-display.
 *
 * Что умеет (пригодится на защите):
 *  • страницы документации открываются по внутренним ссылкам ВНУТРИ этого
 *    экрана — ведётся стек истории с кнопкой «‹ Назад»;
 *  • внешние ссылки (гибдд.рф и т.п.) открываются в браузере устройства;
 *  • пути картинок автоматически превращаются в абсолютные адреса сайта;
 *  • списки с флажками «- [ ]» (вариант 3) отображаются символами ⬜ / ✅ —
 *    парсер markdown-it, в отличие от сайта на docsify, штатно их не рендерит;
 *  • если в config.js осталась заглушка вместо адреса сайта, экран показывает
 *    подсказку по настройке вместо непонятной сетевой ошибки;
 *  • при отсутствии сети — экран ошибки с кнопкой «Повторить».
 *
 * Вся настройка — один адрес в файле config.js в корне проекта.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
  ActivityIndicator,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { DOCS_BASE } from '../config';

// ─── Адрес сайта: нормализуем (лишние пробелы и слэши в конце не страшны) ──
const BASE = (DOCS_BASE || '').trim().replace(/\/+$/, '');

// ─── Проверка, что адрес вписан, а заглушка из config.js заменена ──────────
function isConfigured() {
  if (!BASE) return false;
  if (/ВАШ_ЛОГИН|ИМЯ_РЕПОЗИТОРИЯ/i.test(BASE)) return false; // заглушка
  return /^https:\/\/[\w-]+\.github\.io\/[\w.-]+/i.test(BASE);
}

const ACCENT = '#F57C00'; // фирменный «дорожный оранжевый»
const HOME = { title: 'Справка', url: `${BASE}/README.md` };

export default function HelpScreen({ onClose }) {
  // стек открытых страниц документации: [{ title, url }]
  const [stack, setStack] = useState([HOME]);
  const route = stack[stack.length - 1];
  const [md, setMd] = useState('');
  const [status, setStatus] = useState(
    isConfigured() ? 'loading' : 'setup', // loading | ok | error | setup
  );

  const load = useCallback(async (url) => {
    setStatus('loading');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      // Папка текущего файла — от неё считаются относительные пути картинок.
      const dir = url.replace(/README\.md.*$/, '');

      const fixed = text
        // 1) пути картинок от корня сайта: ](/images/…) → абсолютные
        .replace(/\]\(\/([^/])/g, `](${BASE}/$1`)
        // 2) относительные пути (имя файла рядом с README): ](forma.png) → абсолютные
        .replace(/\]\((?!https?:|#|\/)([^)]+)\)/g, (m, p) => `](${dir}${p})`)
        // 3) списки с флажками (вариант 3): markdown-it не рендерит «[ ]/[x]»,
        //    заменяем на символы-флажки — и список выглядит как чек-лист
        .replace(/^(\s*)-\s\[x\]\s/gim, '$1✅ ')
        .replace(/^(\s*)-\s\[\s\]\s/gim, '$1⬜ ');

      setMd(fixed);
      setStatus('ok');
    } catch (e) {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (status !== 'setup') load(route.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.url]);

  // docsify-ссылка https://…/repo/#/start/vhod/ → сырой файл …/repo/start/vhod/README.md
  const toRawUrl = (url) => {
    const [base, hash] = url.split('#');
    const path = (hash || '').replace(/^\/+/, '').replace(/\/+$/, '');
    const root = (base || BASE).replace(/\/+$/, '');
    return path ? `${root}/${path}/README.md` : `${root}/README.md`;
  };

  const openRoute = (rawUrl) => {
    const name = decodeURIComponent(rawUrl.split('/').slice(-2)[0] || 'Справка');
    const TITLES = {
      start: 'Начало работы', zayavki: 'Работа с заявками',
      faq: 'Частые вопросы', statusy: 'Статусы заявки',
      'podacha-zayavki': 'Подача заявки', 'vhod-i-akkount': 'Вход и аккаунт',
    };
    setStack([...stack, { title: TITLES[name] || route.title, url: rawUrl }]);
  };

  // Возврат true — пусть ссылку открывает система (браузер), false — мы обработали сами.
  const onLinkPress = (url) => {
    if (url.startsWith('/')) {                    // внутренняя ссылка от корня сайта
      openRoute(`${BASE}${url.replace(/\/+$/, '')}/README.md`);
      return false;
    }
    if (url.startsWith(BASE)) {                   // абсолютная внутренняя ссылка
      if (url.includes('#')) { openRoute(toRawUrl(url)); return false; }
      openRoute(`${url.replace(/\/+$/, '')}/README.md`);
      return false;
    }
    return true;                                  // внешняя — открыть в браузере
  };

  const canGoBack = stack.length > 1;

  // ── Экран настройки: показывается, пока в config.js стоит заглушка ────────
  if (status === 'setup') {
    return (
      <View style={s.root}>
        <View style={s.header}>
          <View style={s.backBtn} />
          <Text style={s.headerTitle} numberOfLines={1}>Справка</Text>
          {onClose ? (
            <TouchableOpacity style={s.backBtn} onPress={onClose}>
              <Text style={s.backIcon}>✕</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.backBtn} />
          )}
        </View>
        <ScrollView style={s.body} contentContainerStyle={s.content}>
          <Text style={s.setupTitle}>Нужна настройка — одна минута</Text>
          <Text style={s.setupText}>
            Справка загружается с вашего сайта на GitHub Pages, а адрес сайта
            ещё не вписан. Сделайте три шага:
          </Text>
          <Text style={s.setupStep}>
            {'1.  Опубликуйте документацию: содержимое папки docs-site — в репозиторий GitHub, затем Settings → Pages → ветка main (шаги 1–3 инструкции).'}
          </Text>
          <Text style={s.setupStep}>
            {'2.  Откройте файл config.js в корне проекта и впишите адрес сайта вместо заглушки, например:'}
          </Text>
          <Text style={s.setupCode}>https://vashe-imya.github.io/road-docs</Text>
          <Text style={s.setupStep}>
            {'3.  Сохраните файл и перезапустите: npx expo start -c'}
          </Text>
          <Text style={s.setupText}>
            Подробно — в инструкции, раздел «Шаг 4». После правки config.js
            этот экран сменится документацией.
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        {canGoBack ? (
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setStack(stack.slice(0, -1))}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
        <Text style={s.headerTitle} numberOfLines={1}>{route.title}</Text>
        {onClose ? (
          <TouchableOpacity style={s.backBtn} onPress={onClose}>
            <Text style={s.backIcon}>✕</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
      </View>

      {status === 'loading' && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={s.hint}>Загрузка справки…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={s.center}>
          <Text style={s.errTitle}>Не удалось загрузить справку</Text>
          <Text style={s.hint}>Проверьте подключение к сети и адрес сайта в config.js</Text>
          <TouchableOpacity style={s.retry} onPress={() => load(route.url)}>
            <Text style={s.retryText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'ok' && (
        <ScrollView style={s.body} contentContainerStyle={s.content}>
          <Markdown
            style={mdStyles}
            onLinkPress={(url) => onLinkPress(url)}>
            {md}
          </Markdown>
        </ScrollView>
      )}
    </View>
  );
}

/* Оформление markdown в фирменных цветах приложения. */
const mdStyles = {
  heading1: { fontSize: 22, fontWeight: '700', color: '#1D1B20', marginTop: 8, marginBottom: 10 },
  heading2: { fontSize: 18, fontWeight: '700', color: '#1D1B20', marginTop: 16, marginBottom: 8 },
  heading3: { fontSize: 15.5, fontWeight: '600', color: '#1D1B20', marginTop: 12, marginBottom: 6 },
  text: { fontSize: 14.5, color: '#3C3C3C', lineHeight: 21 },
  body: { fontSize: 14.5 },
  strong: { fontWeight: '700' },
  em: { fontStyle: 'italic' },
  del: { textDecorationLine: 'line-through', color: '#9A9A9A' },
  ins: { textDecorationLine: 'underline', color: ACCENT },
  link: { color: ACCENT, textDecorationLine: 'underline' },
  bullet_icon: { color: ACCENT },
  list_item: { marginVertical: 3 },
  blockquote: { backgroundColor: '#FFF3E9', borderLeftWidth: 3, borderLeftColor: ACCENT,
                paddingHorizontal: 12, paddingVertical: 6, marginVertical: 8, borderRadius: 6 },
  code_inline: { backgroundColor: '#F3F0F0', fontFamily: 'monospace', fontSize: 13,
                 color: '#8C4A0F', paddingHorizontal: 4 },
  fence: { backgroundColor: '#F7F5F4', borderRadius: 10, padding: 10, marginVertical: 8 },
  table: { borderWidth: 1, borderColor: '#E2DCD7', borderRadius: 8, marginVertical: 8 },
  thead: { backgroundColor: '#FBE9DC' },
  th: { padding: 8, fontWeight: '700', color: '#1D1B20' },
  td: { padding: 8, color: '#3C3C3C' },
  image: { width: 240, height: 480, resizeMode: 'contain', alignSelf: 'center', marginVertical: 10 },
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 48, paddingBottom: 10, paddingHorizontal: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFECEA',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, color: ACCENT, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1D1B20', flex: 1, textAlign: 'center' },
  body: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hint: { marginTop: 10, color: '#8A8580', fontSize: 14, textAlign: 'center' },
  errTitle: { fontSize: 16, fontWeight: '600', color: '#1D1B20' },
  retry: {
    marginTop: 16, backgroundColor: ACCENT, borderRadius: 24,
    paddingVertical: 10, paddingHorizontal: 28,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },

  setupTitle: { fontSize: 20, fontWeight: '700', color: '#1D1B20', marginBottom: 12 },
  setupText: { fontSize: 14.5, color: '#3C3C3C', lineHeight: 21, marginBottom: 10 },
  setupStep: { fontSize: 14.5, color: '#3C3C3C', lineHeight: 21, marginBottom: 8 },
  setupCode: {
    backgroundColor: '#F3F0F0', fontFamily: 'monospace', fontSize: 13,
    color: '#8C4A0F', padding: 10, borderRadius: 8, marginBottom: 10,
    overflow: 'hidden',
  },
});
