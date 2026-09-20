// gamification.js — seviye / XP / rozetler
import { userData, saveUserData } from './store.js';
import { t, L, curLang } from './i18n.js';

export const LEVEL_TITLES = {
  1: { tr: 'Yeni Bağlanan', en: 'Newly Connected', de: 'Neu verbunden' },
  2: { tr: 'Kod Çırağı', en: 'Code Apprentice', de: 'Code-Lehrling' },
  3: { tr: 'Merdiven Operatörü', en: 'Ladder Operator', de: 'Leiter-Operator' },
  4: { tr: 'Simülasyon Kaşifi', en: 'Simulation Scout', de: 'Simulations-Scout' },
  5: { tr: 'İşlem Savaşçısı', en: 'Process Warrior', de: 'Prozess-Krieger' },
  6: { tr: 'Derinlik Sondası', en: 'Depth Probe', de: 'Tiefensonde' },
  7: { tr: 'Makine Terbiyecisi', en: 'Machine Tamer', de: 'Maschinenbändiger' },
  8: { tr: 'Zihin İşlemcisi', en: 'Mind Processor', de: 'Geist-Prozessor' },
  9: { tr: 'Kod Çözücü', en: 'Code Breaker', de: 'Code-Knacker' },
  10: { tr: 'Ajan Avcısı', en: 'Agent Hunter', de: 'Agentenjäger' },
  12: { tr: 'Ana Kapı', en: 'Main Gate', de: 'Haupttor' },
  15: { tr: 'Erişim Noktası', en: 'Access Point', de: 'Zugangspunkt' },
  18: { tr: 'Konsantrasyon Ajanı', en: 'Focus Agent', de: 'Konzentrations-Agent' },
  20: { tr: 'Kırmızı Hap', en: 'Red Pill', de: 'Rote Pille' },
  25: { tr: 'Zion Savunucusu', en: 'Zion Defender', de: 'Zion-Verteidiger' },
  30: { tr: 'Seçilmiş Kişi', en: 'The One', de: 'Der Auserwählte' }
};
export function levelTitle(level) {
  const e = LEVEL_TITLES[level];
  if (e) return L(e);
  return level > 30 ? L({ tr: 'Zihin Tanrısı', en: 'Mind Deity', de: 'Geist-Gottheit' }) : L({ tr: 'Odak Yolcusu', en: 'Focus Traveler', de: 'Fokus-Reisender' });
}
export function levelInfo(xp) {
  let level = 1, cumulative = 0;
  while (true) {
    const need = 80 + (level - 1) * 70;
    if (xp < cumulative + need) break;
    cumulative += need;
    level++;
  }
  const need = 80 + (level - 1) * 70;
  return { level, cur: xp - cumulative, need, title: levelTitle(level) };
}
export function levelInfoOf() { return levelInfo(userData.gamification.xp); }

export const ACHIEVEMENTS = [
  { id: 'first_step', name: { tr: 'Veri Girişi', en: 'Data Entry', de: 'Dateneingabe' }, desc: { tr: 'İlk odak adımını tamamla', en: 'Complete your first focus step', de: 'Schließe den ersten Fokusschritt ab' }, icon: '✦', xp: 20, unlocked: (s) => s.completedSteps >= 1 },
  { id: 'ladder_1', name: { tr: 'İlk Çıkış', en: 'First Exit', de: 'Erster Ausgang' }, desc: { tr: 'İlk tam döngüyü bitir (çıkış kapısı)', en: 'Finish your first full cycle (exit gate)', de: 'Beende den ersten vollen Zyklus (Ausgangstor)' }, icon: '★', xp: 40, unlocked: (s) => s.completedLadders >= 1 },
  { id: 'steps_10', name: { tr: 'On Katman', en: 'Ten Layers', de: 'Zehn Schichten' }, desc: { tr: '10 odak adımını tamamla', en: 'Complete 10 focus steps', de: 'Schließe 10 Fokusschritte ab' }, icon: '◆', xp: 30, unlocked: (s) => s.completedSteps >= 10 },
  { id: 'ladder_5', name: { tr: 'Ağ Kırıcı', en: 'Net Breaker', de: 'Netzbrecher' }, desc: { tr: '5 tam döngü bitir', en: 'Finish 5 full cycles', de: 'Beende 5 volle Zyklen' }, icon: '⬟', xp: 80, unlocked: (s) => s.completedLadders >= 5 },
  { id: 'peak_44', name: { tr: 'Kaynak Kodu', en: 'Source Code', de: 'Quellcode' }, desc: { tr: '44+ dk zirve adımını tamamla', en: 'Complete a 44+ min peak step', de: 'Schließe einen 44+ Min. Gipfelschritt ab' }, icon: '✧', xp: 60, unlocked: (s) => (s.maxStepMins || 0) >= 44 },
  { id: 'hours_5', name: { tr: 'Sinaps Hızlandırıcı', en: 'Synapse Accelerator', de: 'Synapsen-Beschleuniger' }, desc: { tr: 'Toplam 5 saat odaklan', en: 'Focus 5 hours in total', de: 'Insgesamt 5 Stunden fokussieren' }, icon: '●', xp: 60, unlocked: (s) => s.totalWorkSeconds >= 18000 },
  { id: 'hours_20', name: { tr: 'Donanım Yükseltmesi', en: 'Hardware Upgrade', de: 'Hardware-Upgrade' }, desc: { tr: 'Toplam 20 saat odaklan', en: 'Focus 20 hours in total', de: 'Insgesamt 20 Stunden fokussieren' }, icon: '❖', xp: 150, unlocked: (s) => s.totalWorkSeconds >= 72000 },
  { id: 'streak_3', name: { tr: 'Üç Günlük Ağ', en: 'Three-Day Net', de: 'Drei-Tage-Netz' }, desc: { tr: '3 gün üst üste çalış', en: 'Work 3 days in a row', de: '3 Tage in Folge arbeiten' }, icon: '▲', xp: 50, unlocked: (s) => s.streakDays >= 3 },
  { id: 'streak_7', name: { tr: 'Zion Direnci', en: 'Zion Resistance', de: 'Zion-Widerstand' }, desc: { tr: '7 gün üst üste çalış', en: 'Work 7 days in a row', de: '7 Tage in Folge arbeiten' }, icon: '▰', xp: 150, unlocked: (s) => s.streakDays >= 7 }
];

export function awardXp(amount) {
  if (!amount) return;
  // dynamic import to avoid cycle with audio/ui
  const prevLevel = levelInfoOf().level;
  userData.gamification.xp += amount;
  const nowLevel = levelInfoOf();
  saveUserData();
  // lazy load side effects
  import('./audio.js').then(m => {
    if (nowLevel.level > prevLevel) { m.playLevelUpSound(); setTimeout(() => import('./ui.js').then(u=>u.celebrate('level')), 250); showLevelBanner(nowLevel.level); }
  });
  import('./ui.js').then(u => {
    if (nowLevel.level > prevLevel) { u.showToast(t('toast_levelup', { x: nowLevel.level, y: nowLevel.title }), 'level'); }
    u.updateGamificationUI();
    checkAchievements();
  });
}

export function checkAchievements() {
  let gained = 0;
  Promise.all([import('./audio.js'), import('./ui.js')]).then(([audio, ui]) => {
    ACHIEVEMENTS.forEach(a => {
      if (userData.gamification.achievements.includes(a.id)) return;
      if (a.unlocked(userData.stats, userData.gamification)) {
        userData.gamification.achievements.push(a.id);
        audio.playBadgeSound();
        ui.showToast(t('toast_badge', { x: L(a.name), y: a.xp }), 'success');
        // awardXp will re-enter; avoid recursion deadlock by direct xp add for badge
        userData.gamification.xp += a.xp;
        saveUserData();
        gained++;
      }
    });
    if (gained) ui.renderBadges();
  });
}

function showLevelBanner(level) {
  import('./ui.js').then(m=>m.showLevelBanner(level));
}
