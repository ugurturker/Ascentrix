// ============ MATRIX DIGITAL RAIN (Dijital Yağmur) ============
    const rainCanvas = document.getElementById('matrixRain');
    const rainCtx = rainCanvas.getContext('2d');
    const rainFontSize = 16;
    const RAIN_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let rainDrops = [];

    function resizeRain() {
        rainCanvas.width = window.innerWidth;
        rainCanvas.height = window.innerHeight;
        const cols = Math.floor(rainCanvas.width / rainFontSize);
        rainDrops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * -120));
    }

    function drawRain() {
        rainCtx.fillStyle = 'rgba(2, 8, 5, 0.08)';
        rainCtx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
        rainCtx.font = rainFontSize + 'px Consolas, monospace';
        for (let i = 0; i < rainDrops.length; i++) {
            const ch = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
            const x = i * rainFontSize;
            const y = rainDrops[i] * rainFontSize;
            const bright = Math.random() > 0.975;
            rainCtx.fillStyle = bright ? 'rgba(220, 255, 230, 0.95)' : 'rgba(0, 255, 65, 0.85)';
            rainCtx.fillText(ch, x, y);
            rainDrops[i] = (y > rainCanvas.height && Math.random() > 0.975) ? 0 : rainDrops[i] + 1;
        }
    }

    resizeRain();
    window.addEventListener('resize', resizeRain);
    setInterval(drawRain, 60);

    // Dynamic Time Multiplier Array (Spec 1): T*1.00, T*0.80, T*0.65, T*0.50, >4 cap 0.50
    const MULTIPLIERS = [1.00, 0.80, 0.65, 0.50];
    // Mola ritimleri — bilimsel varsayılan %25 (ultradian 90 dk + 52/17 ortak aralığı %20–30)
    const BREAK_MODES = {
        easy: { ratio: 0.40, min: 4, max: 30 },
        natural: { ratio: 0.25, min: 3, max: 20 },
        medium: { ratio: 0.20, min: 3, max: 15 },
        hard: { ratio: 0.12, min: 2, max: 10 }
    };
    function getBreakMode() {
        const m = userData.settings.breakMode;
        return BREAK_MODES[m] ? m : 'natural';
    }
    function protocolSteps(T, count = 4, breakMode) {
        T = Math.max(5, Math.round(T * 10) / 10);
        const r1 = v => Math.max(1, Math.round(v * 2) / 2);
        const bm = BREAK_MODES[breakMode] || BREAK_MODES[getBreakMode()] || BREAK_MODES.natural;
        const n = Math.max(1, Math.floor(count));
        const works = Array.from({ length: n }, (_, i) => {
            const m = i < MULTIPLIERS.length ? MULTIPLIERS[i] : 0.50;
            return Math.max(5, r1(T * m));
        });
        const brks = works.map(w => r1(Math.min(bm.max, Math.max(bm.min, w * bm.ratio))));
        return works.map((w, i) => ({
            work: w,
            break: brks[i],
            label: t('proto_step', { n: i + 1, x: fmtMin(w) })
        }));
    }
    function setBreakMode(mode) {
        if (!BREAK_MODES[mode]) return;
        userData.settings.breakMode = mode;
        saveUserData();
        maybeRefreshPlan();
        renderTracker();
        updateDisplay();
        renderPlanCard();
        syncBreakModeUI();
        showToast(t('toast_breakmode', { x: t('breakmode_' + mode) }), 'success');
    }
    function syncBreakModeUI() {
        const cur = getBreakMode();
        document.querySelectorAll('.bm-btn').forEach(b => b.classList.toggle('active', b.dataset.bmode === cur));
    }

    // ============ ÇOKLU DİL (i18n) ============
    function curLang() {
        try {
            const l = userData.settings.lang;
            return (l === 'en' || l === 'de') ? l : 'tr';
        } catch (e) { return 'tr'; }
    }
    function t(key, params) {
        const lang = curLang();
        let s = I18N[lang] && I18N[lang][key] !== undefined ? I18N[lang][key] : I18N.tr[key];
        if (s === undefined) return key;
        if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
        return s;
    }
    function L(obj) {
        if (obj == null) return '';
        if (typeof obj === 'string') return obj;
        const lang = curLang();
        return obj[lang] !== undefined ? obj[lang] : obj.tr;
    }
    function setLang(lang) {
        if (!I18N[lang]) return;
        userData.settings.lang = lang;
        saveUserData();
        applyLang();
    }
    function applyLang() {
        const lang = curLang();
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            el.placeholder = t(el.getAttribute('data-i18n-ph'));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.getAttribute('data-i18n-title'));
        });
        document.querySelectorAll('.lang-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === lang);
        });
        document.documentElement.lang = lang;
        document.title = t('appDocTitle');
        updateDisplay();
        renderTracker();
        updateGamificationUI();
        updateSoundUI();
        updateProfileUI();
        renderTPeakUI();
        renderPlanCard();
        renderStats();
        syncBreakModeUI();
        updateAlarmModeUI();
    }

    const I18N = {
    tr: {
        appDocTitle: 'Ascentrix',
        appSuffix: 'Ascentrix',
        nav_timer: 'Zamanlayıcı',
        nav_stats: 'İstatistikler',
        nav_profile: 'Profil & Ayarlar',
        hdr_timer_sub: 'Kırmızı hapı seçtin — Derin Odak Protokolü Başladı',
        direct_title: 'DİREK ODAKLAN',
        direct_desc: "Sayaç ileriye doğru sayar. Sıkıldığın yerde BİTİR'e bas — geçen süre T-Peak'in olur, ardından merdiven (0.75T → 0.50T → 0.25T) otomatik dizilir.",
        direct_start: 'Odaklanmaya Başla',
        direct_pause: 'Duraklat',
        direct_resume: 'Devam Et',
        direct_stop: 'BİTİR',
        direct_tpeakRow: 'Zirve Süresi (T-peak):',
        direct_clear: 'Temizle',
        plan_title: 'BUGÜNKÜ PLAN',
        plan_cap: 'Kapasite',
        plan_tpeak: 'T-Peak',
        plan_record: 'Rekor',
        plan_cappct: 'Kapasite %',
        plan_vol: 'Oturum hacmi:',
        plan_start: 'Çalışmaya Başla',
        plan_goal_done: ' — HEDEF TAMAMLANDI',
        breakmode_title: 'MOLA RİTMİ',
        breakmode_natural: 'Doğal Ritim',
        breakmode_easy: 'Kolay',
        breakmode_medium: 'Orta',
        breakmode_hard: 'Zor',
        breakmode_sci: "Bilimsel varsayılan: odak süresinin %25'i mola — 90 dk ultradian ritim ile 52/17 verimlilik araştırmasının ortak aralığı (%20–30).",
        toast_breakmode: 'Mola ritmi: {x}',
        alarm_mode_sound: '🔔 SESLİ',
        alarm_mode_silent: '🔕 SESSİZ',
        toast_alarm_mode: 'Alarm modu: {x}',
        ctl_finish: 'Bitir',
        log_early: ' — Erken bitir',
        toast_early: 'Erken bitirildi: {x} dk bankalandı',
        xp_level: 'SEVİYE',
        sound_on: '♪ AÇIK',
        sound_off: '♪ KAPALI',
        sound_title_on: 'Ses açık — kapatmak için tıkla',
        sound_title_off: 'Ses kapalı — açmak için tıkla',
        badge_active_a: 'ZİRVE SÜRESİ AKTİF — T-peak: ',
        badge_active_b: ' (günlük plan otomatik güncellenir)',
        timer_start: 'Başlat',
        timer_resume: 'Devam Et',
        timer_pause: 'Duraklat',
        ctl_back: 'Başa Dön',
        ctl_back_title: 'İlk odak adımına geri dön',
        ctl_reset: 'Sıfırla',
        ctl_skip: 'Atla',
        alarm_work_done: 'OTURUM BİTTİ',
        alarm_break_done: 'MOLA BİTTİ',
        alarm_session_done: 'OTURUM TAMAMLANDI',
        alarm_stop: 'Alarmı Durdur',
        alarm_go_break: 'Molaya Geç',
        alarm_go_work: 'Molayı Bitir',
        alarm_finish: 'Bitir',
        alarm_continue: 'Odaklanmaya Devam Et',
        status_break: 'Mola',
        status_fullbreak: 'Tam Mola',
        status_extra: 'EKSTRA ODAK — sınırsız',
        status_work_done: 'OTURUM BİTTİ — Alarmı Durdur!',
        status_ready_break: 'Mola için hazır — "Molaya Geç"e bas',
        status_break_done: 'MOLA BİTTİ — Alarmı Durdur!',
        status_ready_work: 'Çalışmaya hazır — "Molayı Bitir"e bas',
        status_session_done: 'OTURUM TAMAMLANDI — seçim yap',
        status_ready: 'Hazır',
        minUnit: 'dk',
        hourUnit: 'Saat',
        dayUnit: 'Gün',
        stats_title: 'Performans Analitiği',
        stats_sub: 'Kalıcı Bilişsel Veri Geçmişi',
        stats_goal: 'Günlük Odak Hedefi',
        stats_reset_daily: '↺ Günlük İlerlemeyi Sıfırla',
        confirm_daily_reset: 'Günlük ilerleme (bugünkü odak, T-Peak planı değil) sıfırlanacak. Emin misin?',
        toast_daily_reset: 'Günlük ilerleme sıfırlandı',
        stat_totalTime: 'Toplam Odak',
        stat_totalSteps: 'Tamamlanan Adımlar',
        stat_ladders: 'Tam Döngüler',
        stat_streak: 'Günlük Seri (Streak)',
        stat_level: 'Seviye',
        stat_xp: 'Toplam XP',
        stat_partial: 'Yarım Koşu (Güvenlik Ağı)',
        hist_title: 'T-Peak / Enerji Geçmişi',
        hist_today: 'Bugünkü T-Peak',
        hist_record: 'Rekor',
        hist_avg7: 'Son 7 Gün Ort.',
        hist_avg30: 'Son 30 Gün Ort.',
        hist_avgAll: 'Genel Ortalama',
        hist_energy: 'Enerji Seviyesi',
        hist_cap: 'Kapasite %',
        hist_gap: 'Rekora Uzaklık',
        hist_trend: 'Performans Trendi',
        hist_comp: 'Tamamlama (7 gün)',
        hist_todayFocus: 'Bugünkü Odak',
        hist_goal: 'Günlük Hedef',
        hist_extra: 'Ekstra Odak (7 gün)',
        chart_title: 'T-Peak Grafiği (tarih bazlı)',
        chart_empty: 'Grafik için en az 2 ölçüm gerekli',
        chart_record: 'rekor',
        chart_focus: 'odak',
        badges_title: 'Rozetler & Ödüller',
        badge_locked: 'Kilitli',
        log_title: 'Son Seans Geçmişi',
        th_date: 'Tarih / Saat',
        th_mode: 'Model',
        th_step: 'Adım',
        th_dur: 'Süre',
        profile_title: 'Kullanıcı Profili',
        profile_sub: 'Kişiselleştirilmiş Çalışma Parametreleri',
        profile_name: 'Kullanıcı Adı / Unvan',
        profile_name_ph: 'Örn: Araştırmacı',
        profile_goal: 'Günlük Hedef (Dakika)',
        profile_save: 'Ayarları Kaydet',
        donate_title: 'PROJEYİ DESTEKLE',
        donate_text: 'Merdiven Odak tamamen ücretsiz ve reklamsızdır; verileriniz yalnızca kendi tarayıcınızda saklanır. Patreon üzerinden yapacağınız küçük bir bağış, yeni özelliklerin geliştirilmesine ve uygulamanın sürdürülmesine doğrudan katkı sağlar. Desteğiniz için teşekkürler.',
        donate_btn: "Patreon'da Destekle",
        footer_copyright: '© 2026 CoderS568. Tüm hakları saklıdır. Lisanssız kopyalanamaz ve dağıtılamaz.',
        trend_up: 'Yükseliyor',
        trend_down: 'Düşüyor',
        trend_flat: 'Stabil',
        trend_na: 'Yetersiz veri',
        plan_note_measure: 'ölçüm bekleniyor — varsayılan plan',
        plan_note_lowadapt: 'düşük enerji adaptasyonu: hacim azaltıldı',
        plan_note_learned: 'geçmiş bırakmalara göre uyarlandı',
        plan_note_strong: 'güçlü geçmiş → İnen mod',
        toast_levelup: 'MATRİS YÜKSELTİLDİ! Seviye {x} - {y}',
        toast_badge: 'Rozet sentezlendi: {x} (+{y} XP)',
        toast_ladder: 'Kod tamamlandı! +{x} XP, +{y} Skor kazandın',
        toast_saved: 'Ayarlar kaydedildi',
        toast_alarm_off: 'Alarm durduruldu',
        toast_break_ready: "Mola hazır — başlamak için Başlat'a bas",
        toast_work_ready: "Sonraki adım hazır — Başlat'a bas",
        toast_skip: 'Sonraki adıma geçildi',
        toast_extra_start: 'Ekstra odak başladı — sınırsız',
        toast_extra_saved: 'Ekstra odak kaydedildi: +{x} dk',
        toast_test_run: 'Önce ana oturumu bitir ya da sıfırla',
        toast_test_nostart: 'Önce testi başlat',
        toast_test_short: 'Test çok kısa — en az 5 dakika dene',
        toast_test_record_mola: 'Yeni rekor! T-Peak: {x} dk — Mola 1 ({y} dk) hazır',
        toast_test_mola: "T-Peak: {x} dk — Mola 1 ({y} dk) hazır, Başlat'a bas",
        toast_tpeak_cleared: 'T-Peak temizlendi — ölçüm bekleniyor',
        toast_running: 'Oturum zaten devam ediyor',
        toast_partial: 'Yarım koşu kaydedildi ({x}/{y} adım)',
        toast_goal_done: 'Gün hedefi tamamlandı — yarın devam',
        toast_next_ready: 'Sıradaki oturum hazır — Çalışmaya Başla',
        toast_record: 'Yeni rekor! T-Peak: {x} dk',
        toast_tpeak_up: 'T-Peak yükseldi: {x} dk',
        toast_back_full: 'Tüm oturum en başa alındı',
        confirm_back: 'Oturum tamamen iptal edilip en başa dönülecek. Emin misiniz?',
        confirm_tpeak: 'Güncel T-Peak temizlenecek (rekor ve geçmiş korunur). Emin misin?',
        log_session: 'OTURUM {n}',
        log_extra: 'Ekstra Odak',
        log_test: 'T-Peak Testi',
        log_partial: 'Yarım Kaldı ({x}/{y})',
        step_title: '{n}.Adım',
        reason_reset: 'sıfırlama',
        reason_close: 'kapanış',
        proto_step: 'Oturum {n} ({x} dk)',
        toast_fullbreak_ready: "Tam mola hazır — başlamak için Başlat'a bas",
        toast_step_reset: 'Adım baştan başlatıldı',
        toast_break_reset: 'Mola baştan başlatıldı',
        toast_extra_reset: 'Ekstra sayaç sıfırlandı',
        banner_level: 'SEVİYE {x}'
    },
    en: {
        appDocTitle: 'Ascentrix',
        appSuffix: 'Ascentrix',
        nav_timer: 'Timer',
        nav_stats: 'Statistics',
        nav_profile: 'Profile & Settings',
        hdr_timer_sub: 'You took the red pill — Deep Focus Protocol engaged',
        direct_title: 'FOCUS NOW',
        direct_desc: 'The timer counts upward. Press FINISH wherever you lose focus — the elapsed time becomes your T-Peak, then the ladder (0.75T → 0.50T → 0.25T) is built automatically.',
        direct_start: 'Start Focusing',
        direct_pause: 'Pause',
        direct_resume: 'Resume',
        direct_stop: 'FINISH',
        direct_tpeakRow: 'Peak Duration (T-peak):',
        direct_clear: 'Clear',
        plan_title: "TODAY'S PLAN",
        plan_cap: 'Capacity',
        plan_tpeak: 'T-Peak',
        plan_record: 'Record',
        plan_cappct: 'Capacity %',
        plan_vol: 'Session volume:',
        plan_start: 'Start Working',
        plan_goal_done: ' — GOAL COMPLETED',
        breakmode_title: 'BREAK RHYTHM',
        breakmode_natural: 'Natural Rhythm',
        breakmode_easy: 'Easy',
        breakmode_medium: 'Medium',
        breakmode_hard: 'Hard',
        breakmode_sci: 'Science-based default: 25% of focus as break — the shared window of the 90-min ultradian rhythm and the 52/17 productivity study (20–30%).',
        toast_breakmode: 'Break rhythm: {x}',
        alarm_mode_sound: '🔔 SOUND',
        alarm_mode_silent: '🔕 SILENT',
        toast_alarm_mode: 'Alarm mode: {x}',
        ctl_finish: 'Finish',
        log_early: ' — Finished early',
        toast_early: 'Finished early: {x} min banked',
        xp_level: 'LEVEL',
        sound_on: '♪ ON',
        sound_off: '♪ OFF',
        sound_title_on: 'Sound on — click to mute',
        sound_title_off: 'Sound off — click to enable',
        badge_active_a: 'PEAK TIME ACTIVE — T-peak: ',
        badge_active_b: ' (daily plan updates automatically)',
        timer_start: 'Start',
        timer_resume: 'Resume',
        timer_pause: 'Pause',
        ctl_back: 'Restart',
        ctl_back_title: 'Return to the first focus step',
        ctl_reset: 'Reset',
        ctl_skip: 'Skip',
        alarm_work_done: 'SESSION DONE',
        alarm_break_done: 'BREAK OVER',
        alarm_session_done: 'CYCLE COMPLETE',
        alarm_stop: 'Stop Alarm',
        alarm_go_break: 'Take Break',
        alarm_go_work: 'End Break',
        alarm_finish: 'Finish',
        alarm_continue: 'Keep Focusing',
        status_break: 'Break',
        status_fullbreak: 'Full Break',
        status_extra: 'EXTRA FOCUS — unlimited',
        status_work_done: 'SESSION DONE — Stop the alarm!',
        status_ready_break: 'Ready for break — press "Take Break"',
        status_break_done: 'BREAK OVER — Stop the alarm!',
        status_ready_work: 'Ready to work — press "End Break"',
        status_session_done: 'CYCLE COMPLETE — make a choice',
        status_ready: 'Ready',
        minUnit: 'min',
        hourUnit: 'h',
        dayUnit: 'd',
        stats_title: 'Performance Analytics',
        stats_sub: 'Persistent cognitive data history',
        stats_goal: 'Daily Focus Goal',
        stats_reset_daily: '↺ Reset Daily Progress',
        confirm_daily_reset: 'Daily progress (today\'s focus) will be reset. Are you sure?',
        toast_daily_reset: 'Daily progress reset',
        stat_totalTime: 'Total Focus',
        stat_totalSteps: 'Completed Steps',
        stat_ladders: 'Full Cycles',
        stat_streak: 'Daily Streak',
        stat_level: 'Level',
        stat_xp: 'Total XP',
        stat_partial: 'Partial Runs (Safety Net)',
        hist_title: 'T-Peak / Energy History',
        hist_today: "Today's T-Peak",
        hist_record: 'Record',
        hist_avg7: 'Last 7 Days Avg.',
        hist_avg30: 'Last 30 Days Avg.',
        hist_avgAll: 'Overall Average',
        hist_energy: 'Energy Level',
        hist_cap: 'Capacity %',
        hist_gap: 'Gap to Record',
        hist_trend: 'Performance Trend',
        hist_comp: 'Completion (7 days)',
        hist_todayFocus: "Today's Focus",
        hist_goal: 'Daily Goal',
        hist_extra: 'Extra Focus (7 days)',
        chart_title: 'T-Peak Chart (by date)',
        chart_empty: 'At least 2 measurements needed for chart',
        chart_record: 'record',
        chart_focus: 'focus',
        badges_title: 'Badges & Rewards',
        badge_locked: 'Locked',
        log_title: 'Recent Session History',
        th_date: 'Date / Time',
        th_mode: 'Mode',
        th_step: 'Step',
        th_dur: 'Duration',
        profile_title: 'User Profile',
        profile_sub: 'Personalized study parameters',
        profile_name: 'Username / Title',
        profile_name_ph: 'E.g.: Researcher',
        profile_goal: 'Daily Goal (Minutes)',
        profile_save: 'Save Settings',
        donate_title: 'SUPPORT THE PROJECT',
        donate_text: 'Staircase Focus is completely free and ad-free; your data stays only in your own browser. A small donation via Patreon directly contributes to new features and keeping the app alive. Thank you for your support.',
        donate_btn: 'Support on Patreon',
        footer_copyright: '© 2026 CoderS568. All rights reserved. May not be copied or distributed without a license.',
        trend_up: 'Rising',
        trend_down: 'Falling',
        trend_flat: 'Stable',
        trend_na: 'Insufficient data',
        plan_note_measure: 'awaiting measurement — default plan',
        plan_note_lowadapt: 'low-energy adaptation: volume reduced',
        plan_note_learned: 'adapted from past drop-offs',
        plan_note_strong: 'strong history → Descending mode',
        toast_levelup: 'MATRIX UPGRADED! Level {x} - {y}',
        toast_badge: 'Badge synthesized: {x} (+{y} XP)',
        toast_ladder: 'Cycle complete! +{x} XP, +{y} Score earned',
        toast_saved: 'Settings saved',
        toast_alarm_off: 'Alarm stopped',
        toast_break_ready: "Break ready — press Start to begin",
        toast_work_ready: "Next step ready — press Start",
        toast_skip: 'Moved to next step',
        toast_extra_start: 'Extra focus started — unlimited',
        toast_extra_saved: 'Extra focus saved: +{x} min',
        toast_test_run: 'Finish or reset the main session first',
        toast_test_nostart: 'Start the test first',
        toast_test_short: 'Test too short — try at least 5 minutes',
        toast_test_record_mola: 'New record! T-Peak: {x} min — Break 1 ({y} min) ready',
        toast_test_mola: "T-Peak: {x} min — Break 1 ({y} min) ready, press Start",
        toast_tpeak_cleared: 'T-Peak cleared — measurement pending',
        toast_running: 'A session is already in progress',
        toast_partial: 'Partial run saved ({x}/{y} steps)',
        toast_goal_done: 'Daily goal completed — continue tomorrow',
        toast_next_ready: 'Next session ready — Start Working',
        toast_record: 'New record! T-Peak: {x} min',
        toast_tpeak_up: 'T-Peak increased: {x} min',
        toast_back_full: 'Entire session reset to start',
        confirm_back: 'The entire session will be cancelled and reset to start. Are you sure?',
        confirm_tpeak: 'Current T-Peak will be cleared (record and history kept). Are you sure?',
        log_session: 'SESSION {n}',
        log_extra: 'Extra Focus',
        log_test: 'T-Peak Test',
        log_partial: 'Aborted ({x}/{y})',
        step_title: 'Step {n}',
        reason_reset: 'reset',
        reason_close: 'tab closed',
        proto_step: 'Session {n} ({x} min)',
        toast_fullbreak_ready: 'Full break ready — press Start to begin',
        toast_step_reset: 'Step restarted',
        toast_break_reset: 'Break restarted',
        toast_extra_reset: 'Extra counter reset',
        toast_fullbreak_ready: 'Full break ready — press Start to begin',
        log_session: 'SESSION {n}',
        banner_level: 'LEVEL {x}'
    },
    de: {
        appDocTitle: 'Ascentrix',
        appSuffix: 'Ascentrix',
        nav_timer: 'Zeitgeber',
        nav_stats: 'Statistiken',
        nav_profile: 'Profil & Einstellungen',
        hdr_timer_sub: 'Du hast die rote Pille genommen — Tiefenfokus-Protokoll aktiv',
        direct_title: 'DIREKT FOKUSSIEREN',
        direct_desc: 'Der Zähler läuft vorwärts. Drücke FERTIG, sobald du die Konzentration verlierst — die Zeit wird dein T-Peak, danach wird die Treppe (0.75T → 0.50T → 0.25T) automatisch aufgebaut.',
        direct_start: 'Fokussieren starten',
        direct_pause: 'Pause',
        direct_resume: 'Fortsetzen',
        direct_stop: 'FERTIG',
        direct_tpeakRow: 'Spitzenzeit (T-Peak):',
        direct_clear: 'Löschen',
        plan_title: 'HEUTIGER PLAN',
        plan_cap: 'Kapazität',
        plan_tpeak: 'T-Peak',
        plan_record: 'Rekord',
        plan_cappct: 'Kapazität %',
        plan_vol: 'Sitzungsvolumen:',
        plan_start: 'Arbeit starten',
        plan_goal_done: ' — ZIEL ERREICHT',
        breakmode_title: 'PAUSENRHYTHMUS',
        breakmode_natural: 'Natürlicher Rhythmus',
        breakmode_easy: 'Leicht',
        breakmode_medium: 'Mittel',
        breakmode_hard: 'Schwer',
        breakmode_sci: 'Wissenschaftlicher Standard: 25 % der Fokuszeit als Pause — Schnittmenge aus 90-Min-Ultradian-Rhythmus und 52/17-Studie (20–30 %).',
        toast_breakmode: 'Pausenrhythmus: {x}',
        alarm_mode_sound: '🔔 TON AN',
        alarm_mode_silent: '🔕 STUMM',
        toast_alarm_mode: 'Alarmmodus: {x}',
        ctl_finish: 'Fertig',
        log_early: ' — Früh beendet',
        toast_early: 'Früh beendet: {x} Min. gutgeschrieben',
        xp_level: 'STUFE',
        sound_on: '♪ AN',
        sound_off: '♪ AUS',
        sound_title_on: 'Ton an — zum Stummschalten klicken',
        sound_title_off: 'Ton aus — zum Aktivieren klicken',
        badge_active_a: 'SPITZENZEIT AKTIV — T-Peak: ',
        badge_active_b: ' (Tagesplan wird automatisch aktualisiert)',
        timer_start: 'Start',
        timer_resume: 'Fortsetzen',
        timer_pause: 'Pause',
        ctl_back: 'Neustart',
        ctl_back_title: 'Zum ersten Fokusschritt zurückkehren',
        ctl_reset: 'Zurücksetzen',
        ctl_skip: 'Überspringen',
        alarm_work_done: 'SITZUNG FERTIG',
        alarm_break_done: 'PAUSE VORBEI',
        alarm_session_done: 'ZYKLUS ABGESCHLOSSEN',
        alarm_stop: 'Alarm stoppen',
        alarm_go_break: 'Pause machen',
        alarm_go_work: 'Pause beenden',
        alarm_finish: 'Beenden',
        alarm_continue: 'Weiter fokussieren',
        status_break: 'Pause',
        status_fullbreak: 'Volle Pause',
        status_extra: 'EXTRA-FOKUS — unbegrenzt',
        status_work_done: 'SITZUNG FERTIG — Alarm stoppen!',
        status_ready_break: 'Bereit für Pause — "Pause machen" drücken',
        status_break_done: 'PAUSE VORBEI — Alarm stoppen!',
        status_ready_work: 'Arbeitsbereit — "Pause beenden" drücken',
        status_session_done: 'ZYKLUS ABGESCHLOSSEN — wähle aus',
        status_ready: 'Bereit',
        minUnit: 'Min.',
        hourUnit: 'Std.',
        dayUnit: 'T',
        stats_title: 'Leistungsanalyse',
        stats_sub: 'Verlauf kognitiver Dauerdaten',
        stats_goal: 'Tägliches Fokus-Ziel',
        stats_reset_daily: '↺ Tagesfortschritt zurücksetzen',
        confirm_daily_reset: 'Tagesfortschritt wird zurückgesetzt. Sicher?',
        toast_daily_reset: 'Tagesfortschritt zurückgesetzt',
        stat_totalTime: 'Gesamtfokus',
        stat_totalSteps: 'Abgeschlossene Schritte',
        stat_ladders: 'Volle Zyklen',
        stat_streak: 'Tages-Serie',
        stat_level: 'Stufe',
        stat_xp: 'Gesamt-XP',
        stat_partial: 'Abgebrochene Läufe (Sicherheitsnetz)',
        hist_title: 'T-Peak- / Energieverlauf',
        hist_today: 'Heutiger T-Peak',
        hist_record: 'Rekord',
        hist_avg7: '7-Tage-Schnitt',
        hist_avg30: '30-Tage-Schnitt',
        hist_avgAll: 'Gesamtschnitt',
        hist_energy: 'Energiestufe',
        hist_cap: 'Kapazität %',
        hist_gap: 'Abstand zum Rekord',
        hist_trend: 'Leistungstrend',
        hist_comp: 'Abschluss (7 Tage)',
        hist_todayFocus: 'Heutiger Fokus',
        hist_goal: 'Tagesziel',
        hist_extra: 'Extra-Fokus (7 Tage)',
        chart_title: 'T-Peak-Diagramm (nach Datum)',
        chart_empty: 'Mindestens 2 Messungen für Diagramm nötig',
        chart_record: 'Rekord',
        chart_focus: 'Fokus',
        badges_title: 'Abzeichen & Belohnungen',
        badge_locked: 'Gesperrt',
        log_title: 'Letzte Sitzungen',
        th_date: 'Datum / Zeit',
        th_mode: 'Modus',
        th_step: 'Schritt',
        th_dur: 'Dauer',
        profile_title: 'Benutzerprofil',
        profile_sub: 'Personalisierte Lernparameter',
        profile_name: 'Benutzername / Titel',
        profile_name_ph: 'Z.B.: Forscher',
        profile_goal: 'Tagesziel (Minuten)',
        profile_save: 'Einstellungen speichern',
        donate_title: 'PROJEKT UNTERSTÜTZEN',
        donate_text: 'Treppenfokus ist völlig kostenlos und werbefrei; deine Daten bleiben nur in deinem eigenen Browser. Eine kleine Spende über Patreon trägt direkt zu neuen Funktionen und zum Erhalt der App bei. Danke für deine Unterstützung.',
        donate_btn: 'Auf Patreon unterstützen',
        footer_copyright: '© 2026 CoderS568. Alle Rechte vorbehalten. Vervielfältigung und Verbreitung ohne Lizenz untersagt.',
        trend_up: 'Steigend',
        trend_down: 'Fallend',
        trend_flat: 'Stabil',
        trend_na: 'Zu wenig Daten',
        plan_note_measure: 'Messung ausstehend — Standardplan',
        plan_note_lowadapt: 'Niedrigenergie-Anpassung: Volumen reduziert',
        plan_note_learned: 'aus früheren Abbrüchen angepasst',
        plan_note_strong: 'starke Historie → Absteigender Modus',
        toast_levelup: 'MATRIX-UPGRADE! Stufe {x} - {y}',
        toast_badge: 'Abzeichen synthetisiert: {x} (+{y} XP)',
        toast_ladder: 'Zyklus geschafft! +{x} XP, +{y} Score erhalten',
        toast_saved: 'Einstellungen gespeichert',
        toast_alarm_off: 'Alarm gestoppt',
        toast_break_ready: 'Pause bereit — zum Starten Start drücken',
        toast_work_ready: 'Nächster Schritt bereit — Start drücken',
        toast_skip: 'Zum nächsten Schritt gesprungen',
        toast_extra_start: 'Extra-Fokus gestartet — unbegrenzt',
        toast_extra_saved: 'Extra-Fokus gespeichert: +{x} Min.',
        toast_test_run: 'Erst die Hauptsitzung beenden oder zurücksetzen',
        toast_test_nostart: 'Erst den Test starten',
        toast_test_short: 'Test zu kurz — mindestens 5 Minuten versuchen',
        toast_test_record_mola: 'Neuer Rekord! T-Peak: {x} Min. — Pause 1 ({y} Min.) bereit',
        toast_test_mola: 'T-Peak: {x} Min. — Pause 1 ({y} Min.) bereit, Start drücken',
        toast_tpeak_cleared: 'T-Peak gelöscht — Messung ausstehend',
        toast_running: 'Eine Sitzung läuft bereits',
        toast_partial: 'Abgebrochener Lauf gespeichert ({x}/{y} Schritte)',
        toast_goal_done: 'Tagesziel erreicht — morgen weiter',
        toast_next_ready: 'Nächste Sitzung bereit — Arbeit starten',
        toast_record: 'Neuer Rekord! T-Peak: {x} Min.',
        toast_tpeak_up: 'T-Peak gestiegen: {x} Min.',
        toast_back_full: 'Gesamte Sitzung zurückgesetzt',
        confirm_back: 'Die gesamte Sitzung wird abgebrochen und zurückgesetzt. Sicher?',
        confirm_tpeak: 'Aktueller T-Peak wird gelöscht (Rekord und Verlauf bleiben). Sicher?',
        log_session: 'SITZUNG {n}',
        log_extra: 'Extra-Fokus',
        log_test: 'T-Peak-Test',
        log_partial: 'Abgebrochen ({x}/{y})',
        step_title: 'Schritt {n}',
        reason_reset: 'Zurücksetzen',
        reason_close: 'Tab geschlossen',
        proto_step: 'Sitzung {n} ({x} Min.)',
        toast_fullbreak_ready: 'Volle Pause bereit — zum Starten Start drücken',
        toast_step_reset: 'Schritt neu gestartet',
        toast_break_reset: 'Pause neu gestartet',
        toast_extra_reset: 'Extra-Zähler zurückgesetzt',
        toast_fullbreak_ready: 'Volle Pause bereit — zum Starten Start drücken',
        log_session: 'SITZUNG {n}',
        banner_level: 'STUFE {x}'
    }
    };
    function logLocale() {
        const lang = curLang();
        return lang === 'en' ? 'en-US' : lang === 'de' ? 'de-DE' : 'tr-TR';
    }

    // ============ SEVİYE / XP SİSTEMİ ============
    const LEVEL_TITLES = {
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

    function levelTitle(level) {
        const e = LEVEL_TITLES[level];
        if (e) return L(e);
        return level > 30 ? L({ tr: 'Zihin Tanrısı', en: 'Mind Deity', de: 'Geist-Gottheit' }) : L({ tr: 'Odak Yolcusu', en: 'Focus Traveler', de: 'Fokus-Reisender' });
    }

    function levelInfo(xp) {
        let level = 1, cumulative = 0;
        while (true) {
            const need = 80 + (level - 1) * 70;
            if (xp < cumulative + need) break;
            cumulative += need;
            level++;
        }
        const need = 80 + (level - 1) * 70;
        return { level: level, cur: xp - cumulative, need: need, title: levelTitle(level) };
    }

    // ============ ROZETLER ============
    const ACHIEVEMENTS = [
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

    // ============ YEREL DEPOLAMA (LOCAL STORAGE) ============
    function getDefaultUserData() {
        return {
            profile: { name: 'Neo', dailyGoalMins: 180, totalScore: 0 },
            stats: {
                totalWorkSeconds: 0, completedSteps: 0, completedLadders: 0,
                streakDays: 0, lastActiveDate: null, todayWorkMins: 0,
                todayDate: null, maxStepMins: 0, partialRuns: 0
            },
            gamification: { xp: 0, achievements: [] },
            settings: { soundEnabled: true, lang: 'tr', theme: 'matrix', simplifyLevel: 0, breakMode: 'natural', silentAlarm: false },
            logs: [],
            partialRuns: [],
            peak: { current: null, record: null, history: [], completions: [], extras: [], dailyFocus: [], upStamp: 0 },
            plan: null
        };
    }

    function isPlainObject(v) {
        return v !== null && typeof v === 'object' && !Array.isArray(v);
    }

    // Derin birleştirme: iç içe alt nesneler (stats, gamification vb.) bozulmaya karşı korunur
    function deepMerge(target, source) {
        const out = Object.assign({}, target);
        if (!isPlainObject(source)) return out;
        Object.keys(source).forEach((k) => {
            const sv = source[k];
            const tv = out[k];
            if (isPlainObject(sv) && isPlainObject(tv)) {
                out[k] = deepMerge(tv, sv);
            } else if (sv !== undefined) {
                out[k] = sv;
            }
        });
        return out;
    }

    function normalizeUserData(data) {
        const defs = getDefaultUserData();
        if (!isPlainObject(data)) return defs;
        const merged = deepMerge(defs, data);
        // Şema güvenliği: kritik alanların tip ve değerlerini doğrula
        if (!isPlainObject(merged.profile)) merged.profile = Object.assign({}, defs.profile);
        if (!isPlainObject(merged.stats)) merged.stats = Object.assign({}, defs.stats);
        if (!isPlainObject(merged.gamification)) merged.gamification = Object.assign({}, defs.gamification);
        if (!isPlainObject(merged.settings)) merged.settings = Object.assign({}, defs.settings);
        if (!Array.isArray(merged.logs)) merged.logs = [];
        if (!Array.isArray(merged.partialRuns)) merged.partialRuns = [];
        if (!isPlainObject(merged.peak)) merged.peak = { current: null, record: null, history: [], completions: [], extras: [], dailyFocus: [], upStamp: 0 };
        delete merged.peak.downStamp;
        if (!Array.isArray(merged.peak.history)) merged.peak.history = [];
        if (!Array.isArray(merged.peak.completions)) merged.peak.completions = [];
        if (!Array.isArray(merged.peak.extras)) merged.peak.extras = [];
        if (!Array.isArray(merged.peak.dailyFocus)) merged.peak.dailyFocus = [];

        if (typeof merged.peak.upStamp !== 'number') merged.peak.upStamp = 0;
        delete merged.peak.durationStats;
        if (!isPlainObject(merged.plan) && merged.plan !== null) merged.plan = null;
        // Eski sürümden T-peak taşıma
        if (merged.peak.current == null && typeof merged.settings.tPeak === 'number' && merged.settings.tPeak > 0) {
            merged.peak.current = merged.settings.tPeak;
            merged.peak.record = merged.settings.tPeak;
            merged.peak.history.push({ date: todayStr(), tpeak: merged.settings.tPeak });
        }
        delete merged.settings.tPeak;
        if (!Array.isArray(merged.gamification.achievements)) merged.gamification.achievements = [];
        delete merged.gamification.clearedDifficulties;
        if (typeof merged.profile.dailyGoalMins !== 'number' || !(merged.profile.dailyGoalMins > 0)) {
            merged.profile.dailyGoalMins = defs.profile.dailyGoalMins;
        }
        if (typeof merged.profile.totalScore !== 'number') merged.profile.totalScore = 0;
        delete merged.settings.difficulty;
  if (typeof merged.settings.theme !== 'string' || !['matrix','mario','aero','galaxy'].includes(merged.settings.theme)) merged.settings.theme = 'matrix';
  if (typeof merged.settings.simplifyLevel !== 'number' || merged.settings.simplifyLevel < 0 || merged.settings.simplifyLevel > 3) merged.settings.simplifyLevel = 0;
  if (typeof merged.settings.breakMode !== 'string' || !['natural','easy','medium','hard'].includes(merged.settings.breakMode)) merged.settings.breakMode = 'natural';
  if (typeof merged.settings.silentAlarm !== 'boolean') merged.settings.silentAlarm = false;
        return merged;
    }

    function loadUserData() {
        // Offline yedek kaldırıldı — sadece Firestore, bellekte başlar
        return getDefaultUserData();
    }

    let userData = loadUserData();

    // ============ DURUM DEĞİŞKENLERİ ============
    let currentModeKey = 'ascending';

    // Çalışma dizisi her zaman günlük otomatik plandan gelir.
    function buildSequence() {
        maybeRefreshPlan();
        if (userData.plan && Array.isArray(userData.plan.steps) && userData.plan.steps.length) {
            return userData.plan.steps;
        }
        return [
            { work: 15, break: 3, label: t('proto_step', { n: 1, x: 15 }) },
            { work: 20, break: 4, label: t('proto_step', { n: 2, x: 20 }) },
            { work: 25, break: 5, label: t('proto_step', { n: 3, x: 25 }) },
            { work: 20, break: 4, label: t('proto_step', { n: 4, x: 20 }) }
        ];
    }

    let stepIndex = 0;
    let isBreak = false;
    let timerInterval = null;
    let isRunning = false;
    let alarmActive = false;
    let workStepPending = false;
    let breakStepPending = false;
    let alarmMode = null; // 'work' | 'break' — hangi alarmın çaldığı
    let alarmTimer = null;
    let testRunning = false;
    let testSeconds = 0;
    let testInterval = null;
    let suppressPartial = false;
    let endAt = null; // hedef bitiş zamanı (ms) — arka plan kısıtlamasına karşı sayaç buradan hesaplanır
    let testBase = 0; // sıkılma testi kronometre referans zamanı (ms)
    let sessionDone = false;
    let extraActive = false;
    let extraSeconds = 0;
    let extraBase = 0;
    let extraInterval = null;
    let fullBreak = false;
    let customBreakMins = null; // erken bitirmede orantılı mola süresi (planı bozmaz)
    let currentSequence = (buildSessionPlan() || {}).steps || [];
    if (!currentSequence.length) {
        currentSequence = [
            { work: 15, break: 3, label: t('proto_step', { n: 1, x: 15 }) },
            { work: 20, break: 4, label: t('proto_step', { n: 2, x: 20 }) },
            { work: 25, break: 5, label: t('proto_step', { n: 3, x: 25 }) },
            { work: 20, break: 4, label: t('proto_step', { n: 4, x: 20 }) }
        ];
    }
    let totalSeconds = currentSequence[0].work * 60;
    let secondsLeft = totalSeconds;

    const container = document.querySelector('.container');
    const timerDisplay = document.getElementById('timerDisplay');

    // SVG Daire Kurulumu
    const circle = document.getElementById('progressCircle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = 0;

    function initApp() {
        checkDailyReset();
        const restored = loadTimerState();
        if (!restored) {
            currentSequence = buildSequence();
            totalSeconds = currentSequence[0]?.work * 60 || totalSeconds;
            secondsLeft = totalSeconds;
        } else {
            // Restore sonrası interval'i yeniden başlat (kaldığı yerden devam)
            if (isRunning && endAt && secondsLeft > 0) {
                // interval'i yeniden kur — toggleTimer içindeki aynı mantık
                try {
                    clearInterval(timerInterval);
                    timerInterval = setInterval(() => {
                        try {
                            const prev = secondsLeft;
                            secondsLeft = endAt ? Math.max(0, Math.round((endAt - Date.now()) / 1000)) : Math.max(0, secondsLeft - 1);
                            if (!isBreak) userData.stats.totalWorkSeconds += Math.max(0, prev - secondsLeft);
                            if (!isBreak && secondsLeft <= 5 && secondsLeft > 0) playTickSound();
                            updateDisplay();
                            saveTimerState();
                            if (secondsLeft <= 0) {
                                clearInterval(timerInterval);
                                isRunning = false;
                                timerDisplay.classList.remove('running');
                                if (!isBreak) {
                                    if (stepIndex >= currentSequence.length - 1) onSessionEnd();
                                    else onWorkFinished();
                                } else if (fullBreak) {
                                    playAlertSound();
                                    finishFullBreak();
                                } else {
                                    onBreakFinished();
                                }
                                saveTimerState();
                            }
                        } catch (e) { console.error('Timer interval hatası:', e); clearInterval(timerInterval); isRunning = false; saveTimerState(); }
                    }, 1000);
                    timerDisplay.classList.add('running');
                } catch(_){}
            }
            if (alarmActive) {
                // Alarm çalıyorsa döngüyü yeniden başlat (sessizde overlay)
                try {
                    if (isSilentAlarm()) showSilentOverlay();
                    else if (alarmMode === 'break') startBreakAlarmLoop();
                    else if (alarmMode === 'work') startAlarmLoop();
                } catch(_){}
            }
            if (extraActive && extraBase) {
                try {
                    clearInterval(extraInterval);
                    extraInterval = setInterval(() => {
                        extraSeconds = Math.floor((Date.now() - extraBase) / 1000);
                        updateDisplay();
                        saveTimerState();
                    }, 1000);
                } catch(_){}
            }
            if (testRunning && testBase) {
                try {
                    clearInterval(testInterval);
                    testInterval = setInterval(() => {
                        testSeconds = Math.floor((Date.now() - testBase) / 1000);
                        renderTestClock();
                        saveTimerState();
                    }, 1000);
                } catch(_){}
            }
        }
        updateProfileUI();
        renderTracker();
        updateDisplay();
        updateGamificationUI();
        updateSoundUI();
        renderTestClock();
        renderTPeakUI();
        renderPlanCard();
        renderStats();
        syncBreakModeUI();
        updateAlarmModeUI();
        saveTimerState();
    }

    function saveUserData() {
        // Sadece Firestore'a yaz — offline yedek yok, legacy <-> store sync
        try {
            import('./store.js').then(async m => {
                try {
                    Object.keys(userData).forEach(k => { m.userData[k] = JSON.parse(JSON.stringify(userData[k])); });
                    m.saveUserData();
                } catch(_){}
            }).catch(()=>{});
        } catch(_){}
        try {
            import('./firebase.js').then(async fb => {
                if (!fb.isFirebaseConfigured || !fb.auth?.currentUser || !fb.db) return;
                const { doc, setDoc } = await import('firebase/firestore');
                await setDoc(doc(fb.db, 'users', fb.auth.currentUser.uid), { data: userData, updatedAt: new Date().toISOString() }, { merge: true });
            }).catch(()=>{});
        } catch(_){}
    }

    // Timer oturumu kalıcılığı — tarayıcı reset/sayfa yenilemede kaldığı yerden devam
    function saveTimerState() {
        try {
            const data = {
                stepIndex, isBreak, secondsLeft, totalSeconds, isRunning, endAt,
                alarmActive, workStepPending, breakStepPending, alarmMode,
                testRunning, testSeconds, testBase, sessionDone,
                extraActive, extraSeconds, extraBase, fullBreak,
                currentSequence, currentModeKey, suppressPartial
            };
            localStorage.setItem('ascentrix_timer_state', JSON.stringify(data));
        } catch(_){}
    }
    function clearTimerState() {
        try { localStorage.removeItem('ascentrix_timer_state'); } catch(_){}
    }
    function loadTimerState() {
        try {
            const raw = localStorage.getItem('ascentrix_timer_state');
            if (!raw) return false;
            const d = JSON.parse(raw);
            if (typeof d.stepIndex !== 'number' || !Array.isArray(d.currentSequence) || d.currentSequence.length === 0) return false;
            stepIndex = d.stepIndex ?? 0;
            isBreak = !!d.isBreak;
            secondsLeft = typeof d.secondsLeft === 'number' ? d.secondsLeft : totalSeconds;
            totalSeconds = typeof d.totalSeconds === 'number' ? d.totalSeconds : secondsLeft;
            // endAt recalc for running timer
            if (d.isRunning && typeof d.endAt === 'number' && d.endAt > Date.now() - 86400000) {
                isRunning = true;
                endAt = d.endAt;
                const recalc = Math.max(0, Math.round((endAt - Date.now()) / 1000));
                // if still running, keep recalc, otherwise mark expired
                if (recalc > 0) secondsLeft = recalc;
                else { secondsLeft = 0; isRunning = false; endAt = null; }
            } else {
                isRunning = !!d.isRunning && !d.alarmActive;
                endAt = null;
                if (d.isRunning && !d.alarmActive) isRunning = false;
            }
            alarmActive = !!d.alarmActive;
            workStepPending = !!d.workStepPending;
            breakStepPending = !!d.breakStepPending;
            alarmMode = d.alarmMode ?? null;
            testRunning = !!d.testRunning;
            testSeconds = d.testSeconds ?? 0;
            testBase = d.testBase ?? 0;
            sessionDone = !!d.sessionDone;
            extraActive = !!d.extraActive;
            extraSeconds = d.extraSeconds ?? 0;
            extraBase = d.extraBase ?? 0;
            fullBreak = !!d.fullBreak;
            currentSequence = d.currentSequence;
            currentModeKey = d.currentModeKey || 'ascending';
            suppressPartial = !!d.suppressPartial;
            return true;
        } catch(e) { return false; }
    }

    function checkDailyReset() {
        const today = todayStr();
        if (userData.stats.todayDate !== today) {
            if (userData.stats.lastActiveDate) {
                const lastDate = new Date(userData.stats.lastActiveDate);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastDate.getTime() < yesterday.getTime()) {
                    userData.stats.streakDays = 0;
                }
            }
            userData.stats.todayWorkMins = 0;
            userData.stats.todayDate = today;
            saveUserData();
        }
    }

    // ============ OYUNLAŞTIRMA YARDIMCILARI ============
    function levelInfoOf() { return levelInfo(userData.gamification.xp); }

    function awardXp(amount) {
        if (!amount) return;
        const prevLevel = levelInfoOf().level;
        userData.gamification.xp += amount;
        const nowLevel = levelInfoOf();
        saveUserData();
        if (nowLevel.level > prevLevel) {
            showToast(t('toast_levelup', { x: nowLevel.level, y: nowLevel.title }), 'level');
            playLevelUpSound();
            setTimeout(() => celebrate('level'), 250);
            showLevelBanner(nowLevel.level);
        }
        updateGamificationUI();
        checkAchievements();
    }

    function checkAchievements() {
        let gained = 0;
        ACHIEVEMENTS.forEach(a => {
            if (userData.gamification.achievements.includes(a.id)) return;
            if (a.unlocked(userData.stats, userData.gamification)) {
                userData.gamification.achievements.push(a.id);
                playBadgeSound();
                showToast(t('toast_badge', { x: L(a.name), y: a.xp }), 'success');
                awardXp(a.xp);
                gained++;
            }
        });
        if (gained) renderBadges();
    }

    function updateGamificationUI() {
        const info = levelInfoOf();
        document.getElementById('levelNumber').innerText = info.level;
        document.getElementById('levelTitle').innerText = info.title;
        document.getElementById('xpText').innerText = `${info.cur} / ${info.need} XP`;
        const pct = Math.min(100, Math.round((info.cur / info.need) * 100));
        document.getElementById('xpBar').style.width = pct + '%';
    }

    // ============ SEKMELER / MODELLER ============
    function switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const map = { timerTab: 'tabBtnTimer', statsTab: 'tabBtnStats', profileTab: 'tabBtnProfile' };
        let btn = null;
        try {
            if (typeof event !== 'undefined' && event && event.target && event.target.classList && event.target.classList.contains('tab-btn')) {
                btn = event.target;
            }
        } catch (_) {}
        if (!btn && map[tabId]) btn = document.getElementById(map[tabId]);
        if (btn) btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        if (tabId === 'statsTab') {
            renderStats();
            updateGamificationUI();
        }
    }

    // ============ MERDİVEN TRACKER ============
    function renderTracker() {
        const tracker = document.getElementById('ladderTracker');
        tracker.style.gridTemplateColumns = `repeat(${currentSequence.length}, 1fr)`;
        tracker.innerHTML = '';
        currentSequence.forEach((step, idx) => {
            const card = document.createElement('div');
            card.className = `step-card ${idx === stepIndex ? 'active' : ''} ${idx < stepIndex ? 'completed' : ''}`;
            // Top-to-Bottom decryption sequence (spec 3): Step1 top, duration decays downward
            const lift = idx * 12;
            card.style.transform = `translateY(${lift}px)`;
            card.style.animationDelay = `${idx * 0.06}s`;
            card.innerHTML = `
                <div class="step-title">${t('step_title', { n: idx + 1 })}</div>
                <div class="step-time">${fmtMin(step.work)}${t('minUnit')}</div>
            `;
            tracker.appendChild(card);
        });
    }

    // ============ ZAMANLAYICI ============
    function updateDisplay() {
        if (extraActive) {
            const em = Math.floor(extraSeconds / 60);
            const es = extraSeconds % 60;
            document.getElementById('timeDisplay').innerText =
                `${em.toString().padStart(2, '0')}:${es.toString().padStart(2, '0')}`;
            document.getElementById('statusDisplay').innerText = t('status_extra');
            circle.style.stroke = "var(--work-color)";
            circle.style.strokeDashoffset = 0;
            container.classList.remove('break-mode');
            timerDisplay.classList.remove('break');
            timerDisplay.classList.remove('ending');
            timerDisplay.classList.add('running');
            // [REMOVED] Flow button deleted per spec — extra finish handled via status text
            return;
        }
        const mins = Math.floor(secondsLeft / 60);
        const secs = Math.floor(secondsLeft % 60);
        document.getElementById('timeDisplay').innerText =
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        const currentStep = currentSequence[stepIndex];
        const brk = (isBreak && !fullBreak && typeof customBreakMins === 'number' && customBreakMins > 0)
            ? customBreakMins
            : (currentStep ? currentStep.break : 0);
        document.getElementById('statusDisplay').innerText = isBreak
            ? `${fullBreak ? t('status_fullbreak') : t('status_break')} (${fmtMin(brk)} ${t('minUnit')})`
            : (currentStep ? currentStep.label : t('status_ready'));

        circle.style.stroke = isBreak ? "var(--break-color)" : "var(--work-color)";
        const offset = circumference - (secondsLeft / totalSeconds) * circumference;
        circle.style.strokeDashoffset = offset;

        container.classList.toggle('break-mode', isBreak);
        timerDisplay.classList.toggle('break', isBreak);
        timerDisplay.classList.toggle('ending', !isBreak && secondsLeft <= 5 && secondsLeft > 0);

        // [REMOVED] Extend Flow button deleted per spec
        const sBtn = document.getElementById('startBtn');
        if (sBtn && !sBtn.disabled) {
            sBtn.innerText = isRunning ? t('timer_pause') : (stepIndex === 0 && !isBreak && secondsLeft >= totalSeconds ? t('timer_start') : t('timer_resume'));
        }
    }

    function toggleTimer() {
        if (isRunning) {
            clearInterval(timerInterval);
            if (endAt) {
                secondsLeft = Math.max(0, Math.round((endAt - Date.now()) / 1000));
                endAt = null;
            }
            document.getElementById('startBtn').innerText = t('timer_resume');
            isRunning = false;
            timerDisplay.classList.remove('running');
            saveTimerState();
        } else {
            if (testRunning) { showToast(t('toast_test_run'), 'warn'); return; }
            endAt = Date.now() + secondsLeft * 1000;
            timerInterval = setInterval(() => {
                try {
                    const prev = secondsLeft;
                    secondsLeft = endAt ? Math.max(0, Math.round((endAt - Date.now()) / 1000)) : Math.max(0, secondsLeft - 1);
                    if (!isBreak) userData.stats.totalWorkSeconds += Math.max(0, prev - secondsLeft);
                    if (!isBreak && secondsLeft <= 5 && secondsLeft > 0) playTickSound();
                    updateDisplay();
                    if (secondsLeft <= 0) {
                        clearInterval(timerInterval);
                        isRunning = false;
                        timerDisplay.classList.remove('running');
                        if (!isBreak) {
                            if (stepIndex >= currentSequence.length - 1) onSessionEnd();
                            else onWorkFinished();
                        } else if (fullBreak) {
                            playAlertSound();
                            finishFullBreak();
                        } else {
                            onBreakFinished();
                        }
                    }
                } catch (e) {
                    console.error('Timer interval hatası:', e);
                    clearInterval(timerInterval);
                    isRunning = false;
                }
            }, 1000);
            document.getElementById('startBtn').innerText = t('timer_pause');
            isRunning = true;
            timerDisplay.classList.add('running');
            saveTimerState();
        }
    }

    // ============ MANUEL ALARM & MOLA AKIŞI ============
    // Çalışma alarmı: sert iki tonlu dijital siren, 900ms döngü.
    function startAlarmLoop() {
        stopAlarmLoop();
        try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(_){}
        ensureAudio();
        const ring = () => {
            playTone(880, 0, 0.4, 'square', 0.9);
            playTone(1174.66, 0.45, 0.4, 'square', 0.9);
        };
        ring();
        alarmTimer = setInterval(ring, 900);
    }

    function stopAlarmLoop() {
        try {
            if (alarmTimer) clearInterval(alarmTimer);
        } catch (e) {
            console.warn('Alarm durdurma hatası:', e);
        }
        alarmTimer = null;
    }

    // Çalışma adımı bitti: otomatik mola YOK. Döngüsel alarm başlar, kullanıcı manuel ilerler.
    function onWorkFinished() {
        stopAlarmLoop();
        alarmActive = false;
        workStepPending = false;
        breakStepPending = false;
        alarmMode = 'work';
        endAt = null;
        secondsLeft = 0;
        updateDisplay();
        document.getElementById('statusDisplay').innerText = t('status_work_done');
        alarmActive = true;
        container.classList.remove('alarm-mode-break');
        container.classList.add('alarm-mode');
        const bar = document.getElementById('alarmBar');
        bar.classList.remove('break');
        bar.style.display = 'block';
        document.getElementById('alarmTitle').innerText = t('alarm_work_done');
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopAlarmBtn').innerText = t('alarm_stop');
        document.getElementById('stopAlarmBtn').disabled = false;
        const goBtn = document.getElementById('goBreakBtn');
        goBtn.innerText = t('alarm_go_break');
        goBtn.disabled = true;
        if (isSilentAlarm()) showSilentOverlay();
        else startAlarmLoop();
        if (navigator.vibrate) navigator.vibrate([400, 300, 400, 300, 400]);
    }

    // Mola bitti: döngüsel MOLA alarmı başlar (farklı ses). Kullanıcı "Molayı Bitir" diyene kadar sürer.
    function onBreakFinished() {
        stopAlarmLoop();
        alarmActive = false;
        workStepPending = false;
        breakStepPending = false;
        alarmMode = 'break';
        endAt = null;
        secondsLeft = 0;
        updateDisplay();
        document.getElementById('statusDisplay').innerText = t('status_break_done');
        alarmActive = true;
        container.classList.remove('alarm-mode');
        container.classList.add('alarm-mode-break');
        const bar = document.getElementById('alarmBar');
        bar.classList.add('break');
        bar.style.display = 'block';
        document.getElementById('alarmTitle').innerText = t('alarm_break_done');
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopAlarmBtn').innerText = t('alarm_stop');
        document.getElementById('stopAlarmBtn').disabled = false;
        const goBtn = document.getElementById('goBreakBtn');
        goBtn.innerText = t('alarm_go_work');
        goBtn.disabled = true;
        if (isSilentAlarm()) showSilentOverlay();
        else startBreakAlarmLoop();
        if (navigator.vibrate) navigator.vibrate([300, 200, 300, 200, 300]);
    }

    // 1. Adım: kullanıcı alarmı kendisi durdurur (çalışma ve mola alarmlarında ortak).
    function stopAlarmFlow() {
        stopAlarmLoop();
        hideSilentOverlay();
        alarmActive = false;
        container.classList.remove('alarm-mode');
        container.classList.remove('alarm-mode-break');
        document.getElementById('stopAlarmBtn').disabled = true;
        document.getElementById('goBreakBtn').disabled = false;
        if (alarmMode === 'break') {
            breakStepPending = true;
            document.getElementById('statusDisplay').innerText = t('status_ready_work');
        } else {
            workStepPending = true;
            document.getElementById('statusDisplay').innerText = t('status_ready_break');
        }
        showToast(t('toast_alarm_off'), 'info');
    }

    // Alarm barı buton yönlendiricileri.
    function alarmPrimary() {
        if (alarmMode === 'session') finishSession();
        else stopAlarmFlow();
    }

    function alarmSecondary() {
        if (alarmMode === 'session') continueFocus();
        else if (alarmMode === 'break') goToWorkFlow();
        else goToBreakFlow();
    }

    // 2. Adım: kullanıcı molaya manuel geçer (mola duraklatılmış başlar).
    function goToBreakFlow() {
        if (alarmMode !== null && alarmMode !== 'work') return;
        if (!workStepPending && !alarmActive) return;
        stopAlarmLoop();
        hideSilentOverlay();
        alarmActive = false;
        workStepPending = false;
        alarmMode = null;
        container.classList.remove('alarm-mode');
        document.getElementById('alarmBar').classList.remove('break');
        document.getElementById('alarmBar').style.display = 'none';
        completeWorkStep();
        saveUserData();
        enterBreakPaused();
        playBreakSound();
    }

    // 2. Adım (mola tarafı): kullanıcı molayı bitirir, sonraki adım duraklatılmış hazırlanır.
    function goToWorkFlow() {
        if (alarmMode !== 'break') return;
        if (!breakStepPending && !alarmActive) return;
        stopAlarmLoop();
        hideSilentOverlay();
        alarmActive = false;
        breakStepPending = false;
        alarmMode = null;
        container.classList.remove('alarm-mode-break');
        document.getElementById('alarmBar').classList.remove('break');
        document.getElementById('alarmBar').style.display = 'none';
        if (advanceAfterBreak()) return;
        const startBtn = document.getElementById('startBtn');
        startBtn.innerText = t('timer_start');
        startBtn.disabled = false;
        showToast(t('toast_work_ready'), 'info');
    }

    function completeWorkStep(measured) {
        const currentStep = currentSequence[stepIndex];
        logSession(currentStep.work, currentStep.label);
        userData.stats.completedSteps++;
        userData.stats.todayWorkMins += currentStep.work;
        bumpDailyFocus(currentStep.work);
        userData.stats.maxStepMins = Math.max(userData.stats.maxStepMins || 0, currentStep.work);

        const today = todayStr();
        if (userData.stats.lastActiveDate !== today) {
            userData.stats.streakDays++;
            userData.stats.lastActiveDate = today;
        }

        awardXp(Math.round(currentStep.work));

        if (measured !== false) {
            const nr = setTPeak(currentStep.work, 'auto');
            if (nr) showToast(t('toast_record', { x: fmtMin(currentStep.work) }), 'level');
        }
    }

    function enterBreakPaused(customBreak) {
        const currentStep = currentSequence[stepIndex];
        isBreak = true;
        customBreakMins = (typeof customBreak === 'number' && customBreak > 0) ? customBreak : null;
        totalSeconds = (customBreakMins != null ? customBreakMins : currentStep.break) * 60;
        secondsLeft = totalSeconds;
        renderTracker();
        updateDisplay();
        const startBtn = document.getElementById('startBtn');
        startBtn.innerText = t('timer_start');
        startBtn.disabled = false;
        showToast(t('toast_break_ready'), 'info');
    }

    // Mola sonrası ilerleme: true dönerse döngü tamamlanmıştır.
    function advanceAfterBreak() {
        try {
            isBreak = false;
            customBreakMins = null;
            stepIndex++;

            if (stepIndex >= currentSequence.length) {
                completeLadder();
                return true;
            }
            totalSeconds = currentSequence[stepIndex].work * 60;
            secondsLeft = totalSeconds;
            saveUserData();
            renderTracker();
            updateDisplay();
            return false;
        } catch (e) {
            console.error('advanceAfterBreak hatası:', e);
            return false;
        }
    }

    function completeLadder() {
        userData.stats.completedLadders++;
        const todayL = todayStr();
        userData.peak.completions.unshift(todayL);
        if (userData.peak.completions.length > 90) userData.peak.completions.pop();
        awardXp(40);
        const score = Math.round(currentSequence.reduce((a, s) => a + s.work, 0));
        userData.profile.totalScore = (userData.profile.totalScore || 0) + score;
        saveUserData();
        playLadderSound();
        celebrate('ladder');
        showToast(t('toast_ladder', { x: 40, y: score }), 'success');
        suppressPartial = true;
    }

    // ============ OTURUM SONU, EKSTRA ODAK, SIKILDIM, TAM MOLA ============
    function todaySessionsDone() {
        const today = todayStr();
        return (userData.peak.completions || []).filter(d => d === today).length;
    }

    function bumpDailyFocus(mins) {
        if (!(mins > 0)) return;
        const today = todayStr();
        const arr = userData.peak.dailyFocus;
        const last = arr[arr.length - 1];
        if (last && last.date === today) last.minutes = Math.round((last.minutes + mins) * 10) / 10;
        else { arr.push({ date: today, minutes: Math.round(mins * 10) / 10 }); if (arr.length > 90) arr.shift(); }
    }

    // Dip adımın çalışması bitince: alarm yok, doğrudan "Odaklanmaya Devam Et" butonu.
    function onSessionEnd() {
        stopAlarmLoop();
        alarmActive = false;
        workStepPending = false;
        breakStepPending = false;
        alarmMode = null;
        endAt = null;
        secondsLeft = 0;
        completeWorkStep(true);
        saveUserData();
        showSessionBar(false);
        document.getElementById('statusDisplay').innerText = t('status_session_done');
    }

    function showSessionBar(ring) {
        alarmMode = 'session';
        container.classList.remove('alarm-mode');
        container.classList.add('alarm-mode-break');
        const bar = document.getElementById('alarmBar');
        bar.classList.add('break');
        bar.style.display = 'block';
        document.getElementById('alarmTitle').innerText = t('alarm_session_done');
        document.getElementById('startBtn').disabled = true;
        const btnA = document.getElementById('stopAlarmBtn');
        btnA.innerText = t('alarm_finish');
        btnA.disabled = false;
        const goBtn = document.getElementById('goBreakBtn');
        goBtn.innerText = t('alarm_continue');
        goBtn.disabled = false;
        // ring parametresi artık kullanılmıyor - alarm yok
    }

    // [Bitir]: oturumu kapat, tam molaya geç.
    function finishSession() {
        stopAlarmLoop();
        alarmActive = false;
        alarmMode = null;
        container.classList.remove('alarm-mode');
        container.classList.remove('alarm-mode-break');
        document.getElementById('alarmBar').classList.remove('break');
        document.getElementById('alarmBar').style.display = 'none';
        if (!sessionDone) {
            sessionDone = true;
            completeLadder();
        }
        enterFullBreak();
    }

    // [Odaklanmaya Devam Et]: sınırsız ekstra odak. Akış butonu ile bitirilir.
    function continueFocus() {
        stopAlarmLoop();
        alarmActive = false;
        alarmMode = null;
        container.classList.remove('alarm-mode');
        container.classList.remove('alarm-mode-break');
        document.getElementById('alarmBar').classList.remove('break');
        document.getElementById('alarmBar').style.display = 'none';
        extraActive = true;
        extraSeconds = 0;
        extraBase = Date.now();
        const startBtn = document.getElementById('startBtn');
        startBtn.innerText = t('timer_start');
        startBtn.disabled = true;
        updateDisplay();
        clearInterval(extraInterval);
        extraInterval = setInterval(() => {
            extraSeconds = Math.floor((Date.now() - extraBase) / 1000);
            updateDisplay();
        }, 1000);
        showToast(t('toast_extra_start'), 'success');
    }

    function endExtraFocus() {
        if (!extraActive) return;
        clearInterval(extraInterval);
        extraActive = false;
        document.getElementById('startBtn').disabled = false;
        const mins = extraSeconds / 60;
        if (mins >= 1) {
            const m = Math.round(mins * 10) / 10;
            userData.stats.totalWorkSeconds += Math.round(m * 60);
            userData.stats.todayWorkMins = Math.round((userData.stats.todayWorkMins + m) * 10) / 10;
            bumpDailyFocus(m);
            recordExtra(m);
            const now = new Date();
            userData.logs.unshift({
                timestamp: `${now.toLocaleDateString(logLocale())} ${now.toLocaleTimeString(logLocale(), { hour: '2-digit', minute: '2-digit' })}`,
                mode: t('log_session', { n: todaySessionsDone() + 1 }),
                step: t('log_extra'),
                duration: `${fmtMin(m)} ${t('minUnit')}`
            });
            if (userData.logs.length > 50) userData.logs.pop();
            showToast(t('toast_extra_saved', { x: fmtMin(m) }), 'success');
}
        saveUserData();
        if (!sessionDone) {
            sessionDone = true;
            completeLadder();
        }
        enterFullBreak();
    }

    function recordExtra(minutes) {
        const m = Math.round(minutes * 10) / 10;
        if (!(m >= 1)) return;
        const p = userData.peak;
        p.extras.unshift({ date: todayStr(), minutes: m });
        if (p.extras.length > 60) p.extras.pop();
        if (p.current == null || m > p.current) {
            p.current = m;
            if (p.record == null || m > p.record) {
                p.record = m;
                showToast(t('toast_record', { x: fmtMin(m) }), 'level');
            } else {
                showToast(t('toast_tpeak_up', { x: fmtMin(m) }), 'success');
            }
        }
        saveUserData();
        evaluateUpshift();
        maybeRefreshPlan();
        refreshPlanUI();
    }

    // Küçük ekstralar yeterli tekrara ulaştığında yukarı katkı.
    function evaluateUpshift() {
        const p = userData.peak;
        const since = Date.now() - 7 * 864e5;
        const recent = p.extras.filter(e => new Date(e.date + 'T00:00:00').getTime() >= since && e.minutes >= 3);
        const counted = p.upStamp || 0;
        if (recent.length - counted >= 3) {
            const avg = recent.reduce((a, e) => a + e.minutes, 0) / recent.length;
            if (p.current != null && avg >= Math.max(5, 0.25 * p.current)) {
                p.current = Math.round((p.current + 5) * 10) / 10;
                if (p.record == null || p.current > p.record) {
                    p.record = p.current;
                    showToast(t('toast_record', { x: fmtMin(p.current) }), 'level');
                } else {
                    showToast(t('toast_tpeak_up', { x: fmtMin(p.current) }), 'success');
                }
            }
p.upStamp = recent.length;
            saveUserData();
        }
    }

    // Sıkıldım/Atla anında T-Peak, gerçekleşen süreye doğru aşağı çekilir (taban 5 dk, rekor korunur).
    function pullTPeakDown(elapsedMin) {
        const p = userData.peak;
        if (p.current == null) return;
        const target = Math.max(5, Math.min(p.current, Math.round(elapsedMin * 10) / 10));
        if (target < p.current) {
            p.current = target;
            saveUserData();
            maybeRefreshPlan();
            refreshPlanUI();
        }
    }

    // Büyük Final Molası: toplam çalışma süresinin 5'te 1'i, çalışma süresine dahil değil.
    function enterFullBreak() {
        const totalWork = currentSequence.reduce((a, s) => a + s.work, 0);
        const mins = Math.max(1, Math.round((totalWork / 5) * 2) / 2);
        isBreak = true;
        fullBreak = true;
        totalSeconds = mins * 60;
        secondsLeft = totalSeconds;
        renderTracker();
        updateDisplay();
        document.getElementById('statusDisplay').innerText = `${t('status_fullbreak')} (${fmtMin(mins)} ${t('minUnit')})`;
        const startBtn = document.getElementById('startBtn');
        startBtn.innerText = t('timer_start');
        startBtn.disabled = false;
        showToast(t('toast_fullbreak_ready'), 'info');
    }

    // Tam mola bitince: otomatik başlatma YOK, sıradaki oturum hazırlanır.
    function finishFullBreak() {
        fullBreak = false;
        customBreakMins = null;
        stepIndex = 0;
        isBreak = false;
        endAt = null;
        currentSequence = buildSequence();
        totalSeconds = currentSequence[0].work * 60;
        secondsLeft = totalSeconds;
        document.getElementById('startBtn').innerText = t('timer_start');
        document.getElementById('startBtn').disabled = false;
        renderTracker();
        updateDisplay();
        maybeRefreshPlan();
        const goal = userData.profile.dailyGoalMins || 180;
        if ((userData.stats.todayWorkMins || 0) >= goal) {
            showToast(t('toast_goal_done'), 'success');
        } else {
            showToast(t('toast_next_ready'), 'success');
        }
    }

    // Mola alarmı: odak alarmından farklı — yumuşak üç tonlu dijital melodi, yavaş döngü.
    function startBreakAlarmLoop() {
        stopAlarmLoop();
        try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(_){}
        ensureAudio();
        const ring = () => {
            playTone(523.25, 0, 0.3, 'triangle', 0.4);
            playTone(659.25, 0.3, 0.3, 'triangle', 0.4);
            playTone(783.99, 0.6, 0.4, 'triangle', 0.4);
        };
        ring();
        alarmTimer = setInterval(ring, 1400);
    }

    // ============ SIKILMA EŞİĞİ TESTİ (T_peak) ============
    function fmtMin(m) {
        return String(Number(Number(m).toFixed(1)));
    }

    function renderTestClock() {
        const m = Math.floor(testSeconds / 60);
        const s = testSeconds % 60;
        document.getElementById('testClock').innerText =
            `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function togglePeakTest() {
        if (testRunning) {
            testSeconds = Math.max(testSeconds, Math.floor((Date.now() - testBase) / 1000));
            clearInterval(testInterval);
            testRunning = false;
        } else {
            if (isRunning || alarmActive || workStepPending || extraActive || fullBreak) {
                showToast(t('toast_test_run'), 'warn');
                return;
            }
            testRunning = true;
            testBase = Date.now() - testSeconds * 1000;
            testInterval = setInterval(() => {
                testSeconds = Math.floor((Date.now() - testBase) / 1000);
                renderTestClock();
            }, 1000);
        }
        renderTPeakUI();
    }

    function markActiveDay(t) {
        userData.stats.completedSteps++;
        userData.stats.maxStepMins = Math.max(userData.stats.maxStepMins || 0, t);
        const today = todayStr();
        if (userData.stats.lastActiveDate !== today) {
            userData.stats.streakDays++;
            userData.stats.lastActiveDate = today;
        }
    }

    function finishPeakTest() {
        if (!testRunning && testSeconds === 0) {
            showToast(t('toast_test_nostart'), 'warn');
            return;
        }
        if (testRunning) testSeconds = Math.floor((Date.now() - testBase) / 1000);
        clearInterval(testInterval);
        testRunning = false;
        const mins = testSeconds / 60;
        if (mins < 5) {
            showToast(t('toast_test_short'), 'warn');
            renderTPeakUI();
            return;
        }
        const tmin = Math.round(mins * 10) / 10;
        testSeconds = 0;
        renderTestClock();
        userData.stats.totalWorkSeconds += Math.round(tmin * 60);
        userData.stats.todayWorkMins = Math.round((userData.stats.todayWorkMins + tmin) * 10) / 10;
        bumpDailyFocus(tmin);
        logSession(tmin, t('log_test'));
        markActiveDay(tmin);
        if (stepIndex > 0 || isBreak || isRunning || secondsLeft < totalSeconds) resetSession();
        const newRecord = setTPeak(tmin, 'test');
        stepIndex = 0;
        enterBreakPaused();
        renderTPeakUI();
        const m1 = currentSequence[0] ? fmtMin(currentSequence[0].break) : '';
        showToast(newRecord ? t('toast_test_record_mola', { x: fmtMin(tmin), y: m1 }) : t('toast_test_mola', { x: fmtMin(tmin), y: m1 }), 'success');
    }

    function clearTPeak() {
        if (userData.peak.current == null) return;
        // Secure hacker-style confirmation
        if (!confirm(t('confirm_tpeak') + "\n\n[SYS_PURGE: CONFIRM // SECURE_DELETE]")) return;
        // Terminal delete audio: low buzz + glitch
        try { playTone(180,0,0.12,'square',0.14); playTone(90,0.13,0.15,'square',0.12); playTone(1200,0.28,0.06,'square',0.08); } catch(_){}
        userData.peak.current = null;
        saveUserData();
        resetTimer();
        renderTPeakUI();
        showToast('[SYS_PURGE: SUCCESS] — ' + t('toast_tpeak_cleared'), 'warn');
        // Glitch flash on container
        try {
            container.classList.add('purge-flash');
            setTimeout(()=> container.classList.remove('purge-flash'), 380);
        } catch(_){}
    }

    function renderTPeakUI() {
        const tpk = userData.peak.current;
        const has = tpk != null && tpk > 0;
        document.getElementById('tpeakVal').innerText = has ? fmtMin(tpk) + ' ' + t('minUnit') : '—';
        document.getElementById('testStartBtn').innerText = testRunning ? t('direct_pause') : (testSeconds > 0 ? t('direct_resume') : t('direct_start'));
        document.getElementById('testStopBtn').disabled = !testRunning && testSeconds === 0;
        document.getElementById('clearTpeakBtn').style.display = has ? 'inline-block' : 'none';
    }

    // ============ T-PEAK TABANLI ADAPTİF ENERJİ + OTOMATİK PLAN MOTORU ============
    // Döngü: Ölç → Analiz et → Planla → Uygula → Kaydet → Optimize et
    function todayStr() {
        // Yerel gün — UTC değil (00:00–03:00 arası kaymayı önler)
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function avgArr(a) {
        return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    }

    function avgLastDays(n) {
        const since = Date.now() - n * 864e5;
        const vals = userData.peak.history
            .filter(r => new Date(r.date + 'T00:00:00').getTime() >= since)
            .map(r => r.tpeak);
        return avgArr(vals);
    }

    function peakTrend() {
        const h = userData.peak.history;
        if (h.length < 6) return { trend: 'insufficient', label: t('trend_na') };
        const last6 = h.slice(-6);
        const a = avgArr(last6.slice(0, 3).map(r => r.tpeak));
        const b = avgArr(last6.slice(3, 6).map(r => r.tpeak));
        const mean = (a + b) / 2 || 1;
        const d = (b - a) / mean;
        if (d > 0.05) return { trend: 'up', label: t('trend_up') };
        if (d < -0.05) return { trend: 'down', label: t('trend_down') };
        return { trend: 'flat', label: t('trend_flat') };
    }

    function completionRate7() {
        const since = Date.now() - 7 * 864e5;
        const comp = (userData.peak.completions || [])
            .filter(d => new Date(d + 'T00:00:00').getTime() >= since).length;
        const aband = (userData.partialRuns || [])
            .filter(r => r.date && new Date(r.date + 'T00:00:00').getTime() >= since).length;
        const total = comp + aband;
        return total > 0 ? comp / total : null;
    }

    // Enerji = (Güncel / Referans) × 10, trend destekli. Referans (10/10) = rekor.
    function computeEnergy() {
        const p = userData.peak;
        if (p.record == null || p.current == null || !(p.record > 0)) return null;
        const base = p.current / p.record * 10;
        let adj = 0;
        const tr = peakTrend().trend;
        if (tr === 'up') adj += 0.5;
        else if (tr === 'down') adj -= 0.5;
        return Math.min(10, Math.max(0, Math.round((base + adj) * 10) / 10));
    }

    function setTPeak(t, source) {
        t = Math.round(Number(t) * 10) / 10;
        if (!(t > 0)) return false;
        const p = userData.peak;
        const today = todayStr();
        const last = p.history[p.history.length - 1];
        if (last && last.date === today) { if (t > last.tpeak) last.tpeak = t; }
        else { p.history.push({ date: today, tpeak: t }); if (p.history.length > 120) p.history.shift(); }
        if (source === 'test') p.current = t;
        else if (p.current == null || t > p.current) p.current = t;
        let newRecord = false;
        if (p.record == null || t > p.record) { p.record = t; newRecord = true; }
        saveUserData();
        maybeRefreshPlan();
        refreshPlanUI();
        return newRecord;
    }

    // Oturum mimarisi: Oturum 1 (T) → Mola 1 → Oturum 2 → Mola 2 → Oturum 3 → Mola 3 → Oturum 4 (dip) → Final molası.
    function buildSessionPlan() {
        const p = userData.peak;
        const energy = computeEnergy();
        const notes = [];
        let steps;
        if (p.current == null) {
            steps = protocolSteps(20);
            notes.push('measure');
        } else {
            steps = protocolSteps(p.current);
        }
        const capacity = (p.record && p.current) ? Math.round(p.current / p.record * 1000) / 10 : null;
        const totalWork = steps.reduce((a, s) => a + s.work, 0);
        currentModeKey = 'ascending';
        userData.plan = {
            date: todayStr(), mode: 'ascending', steps, energy, capacity, mult: 2.95, totalWork,
            record: p.record, tpeak: p.current,
            notes, rate: completionRate7(),
            compLen: (p.completions || []).length,
            abandLen: (userData.partialRuns || []).length,
            breakMode: getBreakMode()
        };
        saveUserData();
        return userData.plan;
    }

    function maybeRefreshPlan() {
        const idle = stepIndex === 0 && !isRunning && !isBreak && !alarmActive && !workStepPending && !breakStepPending && !testRunning;
        if (!idle) return;
        const pristine = secondsLeft >= totalSeconds - 0.5;
        const today = todayStr();
        const pl = userData.plan;
        const p = userData.peak;
        const compLen = (p.completions || []).length;
        const abandLen = (userData.partialRuns || []).length;
        const energyNow = computeEnergy();
        if (!pl || pl.date !== today || pl.tpeak !== p.current || pl.record !== p.record || pl.energy !== energyNow || pl.compLen !== compLen || pl.abandLen !== abandLen || pl.breakMode !== getBreakMode()) {
            buildSessionPlan();
            if (pristine && userData.plan && Array.isArray(userData.plan.steps) && userData.plan.steps.length) {
                // El değmemiş sayaç: yeni planın ilk adımına hizala
                currentSequence = userData.plan.steps;
                currentModeKey = userData.plan.mode || 'ascending';
                totalSeconds = currentSequence[0].work * 60;
                secondsLeft = totalSeconds;
                document.getElementById('startBtn').innerText = t('timer_start');
                renderTracker();
                updateDisplay();
            }
        }
        if (userData.plan && Array.isArray(userData.plan.steps) && userData.plan.steps.length) {
            currentSequence = userData.plan.steps;
            currentModeKey = userData.plan.mode || 'ascending';
        }
        renderPlanCard();
    }

    function renderPlanCard() {
        const pl = userData.plan;
        const p = userData.peak;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
        // T-Peak/Rekor/Enerji satırları her zaman CANLI değeri gösterir; adımlar koşan planı gösterir.
        const eLive = computeEnergy();
        set('planEnergy', eLive == null ? '—' : (Math.round(eLive * 10) / 10) + '/10');
        set('planTpeak', p.current == null ? '—' : fmtMin(p.current) + ' ' + t('minUnit'));
        set('planRecord', p.record == null ? '—' : fmtMin(p.record) + ' ' + t('minUnit'));
        set('planCap', (p.record && p.current) ? '%' + (Math.round(p.current / p.record * 1000) / 10) : '—');
        if (!pl) {
            set('planModeName', '—'); set('planSteps', '—'); set('planBreakMode', '—'); set('planGoal', '—'); set('planNotes', '');
            return;
        }
        set('planModeName', `~${fmtMin(pl.totalWork || 0)} ${t('minUnit')} (${pl.mult || 2}×T)`);
        set('planSteps', pl.steps.map(s => fmtMin(s.work)).join(' → ') + ' ' + t('minUnit'));
        set('planBreakMode', t('breakmode_' + (pl.breakMode || 'natural')) + ': ' + pl.steps.map(s => fmtMin(s.break)).join(' → ') + ' ' + t('minUnit'));
        set('planNotes', (pl.notes || []).filter(Boolean).map(n => t('plan_note_' + n) !== ('plan_note_' + n) ? t('plan_note_' + n) : n).join(' • '));
        const goal = userData.profile.dailyGoalMins || 180;
        const today = Math.round((userData.stats.todayWorkMins || 0) * 10) / 10;
        const done = today >= goal;
        set('planGoal', `${fmtMin(today)} / ${goal} ${t('minUnit')} (%${goal ? Math.min(100, Math.round(today / goal * 100)) : 0})` + (done ? t('plan_goal_done') : ''));
        const startBtn = document.getElementById('planStartBtn');
        if (startBtn) startBtn.disabled = done;
        const badge = document.getElementById('tpeakBadge');
        if (badge) {
            if (p.current != null) {
                badge.style.display = 'block';
                const bv = document.getElementById('tpeakBadgeVal');
                if (bv) bv.innerText = fmtMin(p.current) + ' ' + t('minUnit');
            } else badge.style.display = 'none';
        }
    }

    function startPlannedSession() {
        const td = document.getElementById('timerDisplay');
        if (td && td.scrollIntoView) { try { td.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {} }
        const idle = stepIndex === 0 && !isRunning && !isBreak && !alarmActive && !workStepPending && !breakStepPending && !extraActive;
        if (idle) {
            sessionDone = false;
            maybeRefreshPlan();
            toggleTimer();
        } else {
            showToast(t('toast_running'), 'info');
        }
    }

    function refreshPlanUI() {
        renderPlanCard();
        const statsTab = document.getElementById('statsTab');
        if (statsTab && statsTab.classList.contains('active')) renderStats();
    }

    function renderPeakHistory() {
        const p = userData.peak;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
        const f = v => (v == null ? '—' : fmtMin(v) + ' ' + t('minUnit'));
        set('histToday', f(p.current));
        set('histRecord', f(p.record));
        const a7 = avgLastDays(7), a30 = avgLastDays(30);
        const all = avgArr(p.history.map(r => r.tpeak));
        set('histAvg7', f(a7 == null ? null : Math.round(a7 * 10) / 10));
        set('histAvg30', f(a30 == null ? null : Math.round(a30 * 10) / 10));
        set('histAvgAll', f(all == null ? null : Math.round(all * 10) / 10));
        const e = computeEnergy();
        set('histEnergy', e == null ? '—' : (Math.round(e * 10) / 10) + '/10');
        set('histCap', (p.record && p.current) ? '%' + (Math.round(p.current / p.record * 1000) / 10) : '—');
        set('histGap', (p.record != null && p.current != null) ? fmtMin(Math.round((p.record - p.current) * 10) / 10) + ' ' + t('minUnit') : '—');
        set('histTrend', peakTrend().label);
        const r = completionRate7();
        set('histComp', r == null ? '—' : '%' + Math.round(r * 100));
        const goal = userData.profile.dailyGoalMins || 180;
        const today = Math.round((userData.stats.todayWorkMins || 0) * 10) / 10;
        set('histTodayFocus', fmtMin(today) + ' ' + t('minUnit'));
        set('histGoal', `${fmtMin(today)} / ${goal} ${t('minUnit')} (%${goal ? Math.min(100, Math.round(today / goal * 100)) : 0})`);
        const since7 = Date.now() - 7 * 864e5;
        const ex7 = p.extras.filter(e => new Date(e.date + 'T00:00:00').getTime() >= since7);
        set('histExtra', ex7.length ? `+${fmtMin(Math.round(ex7.reduce((a, e) => a + e.minutes, 0) * 10) / 10)} ${t('minUnit')} (${ex7.length}x)` : '—');
        drawTpeakChart();
    }

    function drawTpeakChart() {
        const cv = document.getElementById('tpeakChart');
        if (!cv) return;
        try {
            const dpr = window.devicePixelRatio || 1;
            const W = 560, H = 170;
            cv.width = W * dpr;
            cv.height = H * dpr;
            const ctx = cv.getContext('2d');
            if (!ctx) return;
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, W, H);
            const days = [];
            for (let k = 29; k >= 0; k--) {
                const d = new Date(Date.now() - k * 864e5);
                days.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
            }
            const tmap = {};
            userData.peak.history.forEach(r => { tmap[r.date] = r.tpeak; });
            const fmap = {};
            (userData.peak.dailyFocus || []).forEach(r => { fmap[r.date] = r.minutes; });
            const hasT = days.some(d => tmap[d] != null);
            const hasF = days.some(d => fmap[d] != null);
            ctx.font = '10px Consolas, monospace';
            if (!hasT && !hasF) {
                ctx.fillStyle = '#4fae63';
                ctx.textAlign = 'center';
                ctx.fillText(t('chart_empty'), W / 2, H / 2);
                return;
            }
            const vals = days.map(d => (tmap[d] == null ? null : tmap[d]));
            const fvals = days.map(d => fmap[d] || 0);
            const rec = userData.peak.record || 0;
            const allV = vals.filter(v => v != null).concat(fvals.filter(v => v > 0));
            const min = 0;
            const max = Math.max(10, ...allV, rec);
            const pad = { l: 34, r: 10, t: 12, b: 22 };
            const X = i => pad.l + i * (W - pad.l - pad.r) / (days.length - 1);
            const Y = v => { const sp = Math.max(1, max - min); return pad.t + (1 - (v - min) / sp) * (H - pad.t - pad.b); };
            ctx.strokeStyle = 'rgba(0,255,65,0.15)';
            ctx.fillStyle = '#4fae63';
            ctx.textAlign = 'right';
            ctx.lineWidth = 1;
            [min, (min + max) / 2, max].forEach(v => {
                const y = Y(v);
                ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
                ctx.fillText(fmtMin(Math.round(v * 10) / 10), pad.l - 4, y + 3);
            });
            if (rec > min) {
                ctx.strokeStyle = '#ff5757';
                ctx.setLineDash([5, 4]);
                ctx.beginPath(); ctx.moveTo(pad.l, Y(rec)); ctx.lineTo(W - pad.r, Y(rec)); ctx.stroke();
                ctx.setLineDash([]);
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ff5757';
                ctx.fillText(t('chart_record'), W - pad.r - 34, Y(rec) - 4);
            }
            const bw = (W - pad.l - pad.r) / days.length;
            ctx.fillStyle = 'rgba(0, 255, 204, 0.28)';
            fvals.forEach((v, i) => {
                if (!(v > 0)) return;
                const x = X(i) - bw * 0.3;
                const y = Y(v);
                ctx.fillRect(x, y, bw * 0.6, (H - pad.b) - y);
            });
            ctx.fillStyle = 'rgba(0,255,204,0.9)';
            ctx.textAlign = 'left';
            ctx.fillText(t('chart_focus'), pad.l + 2, pad.t + 8);
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(0,255,65,0.6)';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            let started = false;
            vals.forEach((v, i) => {
                if (v == null) { started = false; return; }
                const x = X(i), y = Y(v);
                if (!started) { ctx.moveTo(x, y); started = true; }
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1;
            vals.forEach((v, i) => {
                if (v == null) return;
                ctx.fillStyle = (i === vals.length - 1) || (vals.slice(i + 1).every(x => x == null)) ? '#00ffcc' : '#00ff41';
                ctx.beginPath(); ctx.arc(X(i), Y(i), 2.5, 0, Math.PI * 2); ctx.fill();
            });
            ctx.fillStyle = '#4fae63';
            ctx.textAlign = 'center';
            const fmtD = d => d.slice(5);
            ctx.fillText(fmtD(days[0]), X(0), H - 6);
            ctx.fillText(fmtD(days[15]), X(15), H - 6);
            ctx.fillText(fmtD(days[29]), X(29), H - 6);
        } catch (err) {
            console.warn('Grafik hatası:', err);
        }
    }

    function logSession(durationMins, stepLabel) {
        const now = new Date();
        const timeStr = `${now.toLocaleDateString(logLocale())} ${now.toLocaleTimeString(logLocale(), { hour: '2-digit', minute: '2-digit' })}`;

        userData.logs.unshift({
            timestamp: timeStr,
            mode: t('log_session', { n: todaySessionsDone() + 1 }),
            step: stepLabel,
            duration: `${fmtMin(durationMins)} ${t('minUnit')}`
        });

        if (userData.logs.length > 50) userData.logs.pop();
    }

    function resetTimer() {
        // SIFIRLA: yalnızca mevcut faz sayacını başa alır, adım/mola korunur.
        hideSilentOverlay();
        if (extraActive) {
            extraSeconds = 0;
            extraBase = Date.now();
            updateDisplay();
            showToast(t('toast_extra_reset'), 'info');
            return;
        }
        stopAlarmLoop();
        alarmActive = false;
        workStepPending = false;
        breakStepPending = false;
        alarmMode = null;
        container.classList.remove('alarm-mode');
        container.classList.remove('alarm-mode-break');
        document.getElementById('alarmBar').classList.remove('break');
        document.getElementById('alarmBar').style.display = 'none';
        document.getElementById('alarmTitle').innerText = t('alarm_work_done');
        document.getElementById('stopAlarmBtn').innerText = t('alarm_stop');
        document.getElementById('stopAlarmBtn').disabled = false;
        const goBtn = document.getElementById('goBreakBtn');
        goBtn.innerText = t('alarm_go_break');
        goBtn.disabled = true;
        secondsLeft = totalSeconds;
        if (isRunning) endAt = Date.now() + totalSeconds * 1000;
        const startBtn = document.getElementById('startBtn');
        startBtn.disabled = false;
        if (!isRunning) {
            startBtn.innerText = (stepIndex === 0 && !isBreak && secondsLeft >= totalSeconds) ? t('timer_start') : t('timer_resume');
        }
        renderTracker();
        updateDisplay();
        showToast(isBreak ? t('toast_break_reset') : t('toast_step_reset'), 'info');
    }

    // Tüm oturum tamamen sıfırlanır (Başa Dön için)
    function resetSession() {
        stopAlarmLoop();
        hideSilentOverlay();
        if (extraActive) { clearInterval(extraInterval); extraActive = false; }
        fullBreak = false;
        customBreakMins = null;
        if (!suppressPartial) capturePartialRun(t('reason_reset'), false);
        suppressPartial = false;
        endAt = null;
        alarmActive = false;
        workStepPending = false;
        breakStepPending = false;
        alarmMode = null;
        if (isRunning) clearInterval(timerInterval);
        isRunning = false;
        timerDisplay.classList.remove('running');
        container.classList.remove('alarm-mode');
        container.classList.remove('alarm-mode-break');
        document.getElementById('alarmBar').classList.remove('break');
        document.getElementById('alarmTitle').innerText = t('alarm_work_done');
        document.getElementById('stopAlarmBtn').innerText = t('alarm_stop');
        document.getElementById('stopAlarmBtn').disabled = false;
        const goBtn = document.getElementById('goBreakBtn');
        goBtn.innerText = t('alarm_go_break');
        goBtn.disabled = true;
        document.getElementById('alarmBar').style.display = 'none';
        document.getElementById('startBtn').disabled = false;
        stepIndex = 0;
        isBreak = false;
        currentSequence = buildSequence();
        totalSeconds = currentSequence[0].work * 60;
        secondsLeft = totalSeconds;
        document.getElementById('startBtn').innerText = t('timer_start');
        renderTracker();
        updateDisplay();
    }

    // ============ BAŞA DÖN ============
    function backToStart() {
        const hasProgress = stepIndex > 0 || isRunning || isBreak || extraActive || fullBreak || secondsLeft < totalSeconds;
        if (hasProgress && !confirm(t('confirm_back'))) return;
        resetSession();
        showToast(t('toast_back_full'), 'info');
    }

    function skipStep() {
        if (alarmActive || workStepPending || breakStepPending || extraActive) return;
        if (isRunning) {
            if (endAt) {
                secondsLeft = Math.max(0, Math.round((endAt - Date.now()) / 1000));
                endAt = null;
            }
            clearInterval(timerInterval);
            isRunning = false;
            timerDisplay.classList.remove('running');
        }
        if (!isBreak) {
            // Skip: atlanan dakikalar günlük odağa EKLEMEZ (spec)
            let elapsed = Math.max(0, totalSeconds - secondsLeft);
            if (isRunning && endAt) elapsed = Math.max(0, totalSeconds - Math.max(0, Math.round((endAt - Date.now()) / 1000)));
            const mins = elapsed / 60;
            const plannedW = currentSequence[stepIndex] ? currentSequence[stepIndex].work : 0;
            if (mins >= Math.max(1, 0.2 * plannedW)) pullTPeakDown(mins);
            // Log skip without counting to dailyFocus/todayWorkMins/XP
            const currentStep = currentSequence[stepIndex];
            const now = new Date();
            userData.logs.unshift({
                timestamp: `${now.toLocaleDateString(logLocale())} ${now.toLocaleTimeString(logLocale(), { hour: '2-digit', minute: '2-digit' })}`,
                mode: t('log_session', { n: todaySessionsDone() + 1 }),
                step: t('log_partial', { x: stepIndex + 1, y: currentSequence.length }) + ' — Atlandı',
                duration: `${fmtMin(plannedW)} ${t('minUnit')} (atlandı)`
            });
            if (userData.logs.length > 50) userData.logs.pop();
            // No completedSteps / todayWorkMins / bumpDailyFocus / awardXp
            saveUserData();
            if (stepIndex >= currentSequence.length - 1) { showSessionBar(false); return; }
            enterBreakPaused();
        } else if (fullBreak) {
            finishFullBreak();
        } else {
            if (advanceAfterBreak()) return;
            const startBtn = document.getElementById('startBtn');
            startBtn.innerText = t('timer_start');
            startBtn.disabled = false;
            showToast(t('toast_skip'), 'info');
            saveTimerState();
        }
        saveTimerState();
    }

    // Erken bitir: geçen süre günlüğe eklenir, sayaç kapanır, orantılı molaya geçilir
    function finishEarly() {
        if (alarmActive || workStepPending || breakStepPending || extraActive) return;
        if (fullBreak) { finishFullBreak(); saveTimerState(); return; }
        if (isRunning) {
            if (endAt) {
                secondsLeft = Math.max(0, Math.round((endAt - Date.now()) / 1000));
                endAt = null;
            }
            clearInterval(timerInterval);
            isRunning = false;
            timerDisplay.classList.remove('running');
        }
        if (!isBreak) {
            const elapsedSec = Math.max(0, totalSeconds - secondsLeft);
            const elapsedMin = Math.round((elapsedSec / 60) * 10) / 10;
            const plannedW = currentSequence[stepIndex] ? currentSequence[stepIndex].work : 0;
            if (elapsedMin >= Math.max(1, 0.2 * plannedW)) pullTPeakDown(elapsedMin);
            // Bankala: saniye sayacı zaten işledi, güne plan dakikası eklenir
            if (elapsedMin > 0) {
                userData.stats.todayWorkMins = Math.round((userData.stats.todayWorkMins + elapsedMin) * 10) / 10;
                bumpDailyFocus(elapsedMin);
                userData.stats.completedSteps++;
                userData.stats.maxStepMins = Math.max(userData.stats.maxStepMins || 0, elapsedMin);
                const today = todayStr();
                if (userData.stats.lastActiveDate !== today) {
                    userData.stats.streakDays++;
                    userData.stats.lastActiveDate = today;
                }
                awardXp(Math.round(elapsedMin));
            }
            const now = new Date();
            userData.logs.unshift({
                timestamp: `${now.toLocaleDateString(logLocale())} ${now.toLocaleTimeString(logLocale(), { hour: '2-digit', minute: '2-digit' })}`,
                mode: t('log_session', { n: todaySessionsDone() + 1 }),
                step: currentSequence[stepIndex].label + t('log_early'),
                duration: `${fmtMin(elapsedMin)} ${t('minUnit')}`
            });
            if (userData.logs.length > 50) userData.logs.pop();
            saveUserData();
            if (stepIndex >= currentSequence.length - 1) { showSessionBar(false); saveTimerState(); return; }
            // Mola, odaklanılan süreye göre aynı ritim oranıyla hesaplanır
            const bm = BREAK_MODES[getBreakMode()] || BREAK_MODES.natural;
            const breakMin = Math.max(1, Math.round(Math.min(bm.max, Math.max(bm.min, elapsedMin * bm.ratio)) * 2) / 2);
            enterBreakPaused(breakMin);
            showToast(t('toast_early', { x: fmtMin(elapsedMin) }), 'success');
            saveTimerState();
        } else {
            if (advanceAfterBreak()) { saveTimerState(); return; }
            const startBtn = document.getElementById('startBtn');
            startBtn.innerText = t('timer_start');
            startBtn.disabled = false;
            showToast(t('toast_skip'), 'info');
            saveTimerState();
        }
    }

    function renderStats() {
        const totalHours = (userData.stats.totalWorkSeconds / 3600).toFixed(1);
        document.getElementById('statTotalTime').innerText = `${totalHours} ${t('hourUnit')}`;
        document.getElementById('statTotalSteps').innerText = userData.stats.completedSteps;
        document.getElementById('statTotalLadders').innerText = userData.stats.completedLadders;
        document.getElementById('statStreak').innerText = `${userData.stats.streakDays} ${t('dayUnit')}`;

        const info = levelInfoOf();
        document.getElementById('statLevel').innerText = info.level;
        document.getElementById('statLevelTitle').innerText = info.title;
        document.getElementById('statXp').innerText = userData.gamification.xp;
        // [REMOVED] Pyramid Score deleted per spec
        document.getElementById('statPartial').innerText = userData.stats.partialRuns || 0;

        const goalMins = userData.profile.dailyGoalMins || 110;
        const currentMins = userData.stats.todayWorkMins || 0;
        const pct = Math.min(100, Math.round((currentMins / goalMins) * 100));

        document.getElementById('goalText').innerText = `${fmtMin(currentMins)} / ${goalMins} ${t('minUnit')}`;
        document.getElementById('goalBar').style.width = `${pct}%`;

        const tbody = document.getElementById('logTableBody');
        tbody.innerHTML = '';
        userData.logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${log.timestamp}</td>
                <td>${log.mode}</td>
                <td>${log.step}</td>
                <td>${log.duration}</td>
            `;
            tbody.appendChild(tr);
        });

        renderBadges();
        renderPeakHistory();
    }

    function renderBadges() {
        const grid = document.getElementById('badgeGrid');
        grid.innerHTML = '';
        ACHIEVEMENTS.forEach((a, i) => {
            const unlocked = userData.gamification.achievements.includes(a.id);
            const div = document.createElement('div');
            div.className = 'badge ' + (unlocked ? 'unlocked' : 'locked');
            div.style.animationDelay = `${i * 0.05}s`;
            div.innerHTML = `
                <div class="badge-icon">${a.icon}</div>
                <div class="badge-name">${L(a.name)}</div>
                <div class="badge-desc">${L(a.desc)}</div>
                ${unlocked ? `<div class="badge-desc" style="color: var(--accent); font-weight:700;">+${a.xp} XP</div>` : `<div class="badge-lock">${t('badge_locked')}</div>`}
            `;
            grid.appendChild(div);
        });
    }

    // ============ GÜVENLİK AĞI (yarım koşu kaydı) ============
    // Yarım kalan oturumlarda o ana kadarki adımlar asimetrik olarak saklanır.
    function capturePartialRun(reason, silent) {
        // Kilit: seans hiç başlamadıysa (adım 0 + süre tam + çalışmıyor + mola/alarm beklemesi yok) kayıt oluşturma
        const neverStarted = stepIndex === 0 && !isBreak && !isRunning && !alarmActive && !workStepPending && secondsLeft >= totalSeconds;
        if (neverStarted) return;
        const done = stepIndex + (isBreak ? 1 : 0);
        if (done <= 0 || done >= currentSequence.length) return;
        const mins = currentSequence.slice(0, done).reduce((a, s) => a + s.work, 0);
        const now = new Date();
        const timeStr = `${now.toLocaleDateString(logLocale())} ${now.toLocaleTimeString(logLocale(), { hour: '2-digit', minute: '2-digit' })}`;
        const rec = {
            timestamp: timeStr,
            date: todayStr(),
            mode: currentModeKey,
            steps: `${done}/${currentSequence.length}`,
            mins: Math.round(mins * 10) / 10,
            pct: Math.round(done / currentSequence.length * 100),
            reason: reason || 'yarıda kesildi'
        };
        userData.partialRuns.unshift(rec);
        if (userData.partialRuns.length > 20) userData.partialRuns.pop();
        userData.logs.unshift({
            timestamp: timeStr,
            mode: t('log_session', { n: todaySessionsDone() + 1 }),
            step: t('log_partial', { x: done, y: currentSequence.length }),
            duration: `${fmtMin(mins)} ${t('minUnit')}`
        });
        if (userData.logs.length > 50) userData.logs.pop();
        userData.stats.partialRuns = (userData.stats.partialRuns || 0) + 1;
        saveUserData();
        if (!silent) showToast(t('toast_partial', { x: done, y: currentSequence.length }), 'info');
    }

    // ============ KUTLAMA ANİMASYONLARI ============
    function celebrate(kind) {
        const colors = ['#00ff41', '#00ff9d', '#00ffcc', '#8cffab', '#2bff8a', '#c8ffd0'];
        const count = kind === 'level' ? 130 : 60;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'confetti';
            el.style.left = Math.random() * 100 + 'vw';
            el.style.backgroundColor = colors[i % colors.length];
            el.style.width = (6 + Math.random() * 6) + 'px';
            el.style.height = (8 + Math.random() * 6) + 'px';
            el.style.animationDuration = (2 + Math.random() * 2.2) + 's';
            el.style.animationDelay = (Math.random() * 0.8) + 's';
            el.style.setProperty('--rot', (Math.random() * 1080 - 540) + 'deg');
            document.body.appendChild(el);
            setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 4600);
        }
    }

    function showLevelBanner(level) {
        const banner = document.createElement('div');
        banner.className = 'levelup-banner';
        banner.innerHTML = `<div class="inner" data-text="${t('banner_level', { x: level })}">${t('banner_level', { x: level })}</div>`;
        document.body.appendChild(banner);
        setTimeout(() => { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 2700);
    }

    // ============ BİLDİRİM (TOAST) ============
    let toastEl = null;
    let toastTimer = null;

    function showToast(msg, type) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'toast';
            document.body.appendChild(toastEl);
        }
        const ico = type === 'success' ? '✓' : type === 'warn' ? '!' : type === 'level' ? '★' : 'i';
        toastEl.className = 'toast ' + (type || 'info');
        toastEl.innerHTML = `<span class="toast-ico">${ico}</span><span>${msg}</span>`;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
    }

    // ============ SES ============
    function playAlertSound() {
        playTone(587.33, 0, 0.35, 'sine', 0.16);
        playTone(880, 0.22, 0.5, 'sine', 0.16);
    }

    // ============ SES / GERİ BİLDİRİM SİSTEMİ ============
    let audioCtx = null;

    function soundEnabled() {
        return userData.settings.soundEnabled !== false;
    }

    function isSilentAlarm() {
        return userData.settings.silentAlarm === true;
    }

    // Sessiz alarm overlay: ses yerine ekranı kaplayan yanıp sönen uyarı
    function showSilentOverlay() {
        const ov = document.getElementById('silentOverlay');
        if (!ov) return;
        const title = document.getElementById('silentTitle');
        const btnA = document.getElementById('silentPrimaryBtn');
        const btnB = document.getElementById('silentSecondaryBtn');
        if (alarmMode === 'break') {
            if (title) title.innerText = t('alarm_break_done');
            if (btnA) btnA.innerText = t('alarm_stop');
            if (btnB) btnB.innerText = t('alarm_go_work');
        } else {
            if (title) title.innerText = t('alarm_work_done');
            if (btnA) btnA.innerText = t('alarm_stop');
            if (btnB) btnB.innerText = t('alarm_go_break');
        }
        ov.style.display = 'flex';
        ov.setAttribute('aria-hidden', 'false');
    }
    function hideSilentOverlay() {
        const ov = document.getElementById('silentOverlay');
        if (!ov) return;
        ov.style.display = 'none';
        ov.setAttribute('aria-hidden', 'true');
    }
    function toggleAlarmMode() {
        userData.settings.silentAlarm = !isSilentAlarm();
        saveUserData();
        updateAlarmModeUI();
        // Anlık geçiş: çalan alarm varsa yeni moda geçir
        if (alarmActive && (alarmMode === 'work' || alarmMode === 'break')) {
            if (isSilentAlarm()) {
                stopAlarmLoop();
                showSilentOverlay();
            } else {
                hideSilentOverlay();
                try {
                    if (alarmMode === 'break') startBreakAlarmLoop();
                    else startAlarmLoop();
                } catch(_){}
            }
        }
        const label = isSilentAlarm() ? t('alarm_mode_silent') : t('alarm_mode_sound');
        showToast(t('toast_alarm_mode', { x: label }), 'info');
        try { playClickSound(); } catch(_){}
    }
    function updateAlarmModeUI() {
        const silent = isSilentAlarm();
        const btn = document.getElementById('alarmModeBtn');
        if (btn) {
            btn.innerText = silent ? t('alarm_mode_silent') : t('alarm_mode_sound');
            btn.classList.toggle('off', silent);
        }
    }

    function ensureAudio() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
            return audioCtx;
        } catch (e) {
            return null;
        }
    }

    // Proaktif AudioContext oluşturma (ilk kullanıcı etkileşiminde)
    function primeAudio() {
        if (!audioCtx) ensureAudio();
    }
    document.addEventListener('click', primeAudio, { once: true });
    document.addEventListener('keydown', primeAudio, { once: true });

    function playTone(freq, delay, dur, type, gainVal) {
        if (!soundEnabled()) return;
        const ctx = ensureAudio();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            const t = ctx.currentTime + (delay || 0);
            const len = dur || 0.2;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(Math.min(gainVal || 0.12, 0.5), t + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + len);
            osc.connect(g);
            g.connect(ctx.destination);
            // Bellek sızıntısı önleme: işi biten node'ları GC'ye bırak
            osc.onended = () => {
                try { osc.disconnect(); } catch (_) {}
                try { g.disconnect(); } catch (_) {}
            };
            osc.start(t);
            osc.stop(t + len + 0.03);
        } catch (e) {
            console.log("Audio Error:", e);
        }
    }

    function playClickSound() { playTone(1400, 0, 0.03, 'square', 0.03); }
    function playTickSound() { playTone(1200, 0, 0.03, 'square', 0.04); }
    function playBreakSound() {
        playTone(660, 0, 0.3, 'sine', 0.11);
        playTone(990, 0.18, 0.45, 'sine', 0.11);
    }
    function playLadderSound() {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(f, i * 0.1, 0.25, 'square', 0.1));
        playTone(1318.5, 0.4, 0.5, 'square', 0.09);
    }
    function playLevelUpSound() {
        [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) => playTone(f, i * 0.09, 0.22, 'square', 0.08));
        playTone(2093, 0.72, 0.6, 'square', 0.07);
    }
    function playBadgeSound() {
        playTone(1567.98, 0, 0.08, 'square', 0.07);
        playTone(2093, 0.09, 0.14, 'square', 0.07);
    }
    // Genel buton tıklamalarına ses bağla (delegasyon)
    document.addEventListener('click', (e) => {
        if (e.target.closest('button')) playClickSound();
    });

    // Güvenlik ağı: sekme kapanırken yarım koşuyu sessizce kaydet.
    window.addEventListener('beforeunload', () => {
        stopAlarmLoop();
        if (extraActive) {
            const m = (Date.now() - extraBase) / 60000;
            if (m >= 1) {
                const p = userData.peak;
                p.extras.unshift({ date: todayStr(), minutes: Math.round(m * 10) / 10 });
                if (p.extras.length > 60) p.extras.pop();
                saveUserData();
            }
        }
        if (stepIndex > 0 || isBreak) capturePartialRun(t('reason_close'), true);
    });

    // ============ BİLDİRİM (Notification) YARDIMCISI ============
    function handleTimerExpiration() {
        if (!isRunning || secondsLeft > 0) return;
        clearInterval(timerInterval);
        isRunning = false;
        timerDisplay.classList.remove('running');
        if (!isBreak) {
            if (stepIndex >= currentSequence.length - 1) onSessionEnd();
            else onWorkFinished();
        } else if (fullBreak) {
            playAlertSound();
            finishFullBreak();
        } else {
            onBreakFinished();
        }
    }

    // Arka plan kısıtlamasına karşı: sekmeye dönünce sayacı zaman damgasından düzelt + alarm gecikmesini düzelt
    document.addEventListener('visibilitychange', () => {
        if (isRunning && endAt) {
            secondsLeft = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        }
        if (testRunning) {
            testSeconds = Math.floor((Date.now() - testBase) / 1000);
            renderTestClock();
        }
        if (extraActive) {
            extraSeconds = Math.floor((Date.now() - extraBase) / 1000);
        }
        if (!document.hidden) {
            try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(_){}
            if (isRunning && secondsLeft <= 0) {
                handleTimerExpiration();
            } else if (alarmActive) {
                // Alarm arka plandayken susturulmuş olabilir — geri dönünce tekrar başlat
                // Sessiz modda ses yok, overlay gösterilir
                try {
                    if (isSilentAlarm()) showSilentOverlay();
                    else if (alarmMode === 'break') startBreakAlarmLoop();
                    else if (alarmMode === 'work') startAlarmLoop();
                } catch(_){}
            }
        } else {
            // Sekme gizliyken süre dolduysa bildirimle uyarmayı dene (ses kısıtlı olsa bile)
            if (isRunning && secondsLeft <= 0) {
                handleTimerExpiration();
            }
        }
        updateDisplay();
    });

    function toggleSound() {
        userData.settings.soundEnabled = !soundEnabled();
        saveUserData();
        updateSoundUI();
        if (soundEnabled()) playClickSound();
    }

    function updateSoundUI() {
        const on = soundEnabled();
        const btn = document.getElementById('soundBtn');
        if (btn) {
            btn.innerText = on ? t('sound_on') : t('sound_off');
            btn.classList.toggle('off', !on);
            btn.title = on ? t('sound_title_on') : t('sound_title_off');
        }
    }

    // ============ PROFİL ============
    function updateProfileUI() {
        document.getElementById('userNameInput').value = userData.profile.name;
        document.getElementById('dailyGoalInput').value = userData.profile.dailyGoalMins;
        document.getElementById('welcomeTitle').innerText = `${userData.profile.name} - ${t('appSuffix')}`;
        // [REMOVED] Pyramid Score deleted per spec
    }

    function saveProfileSettings() {
        const name = document.getElementById('userNameInput').value.trim() || 'Neo';
        const goal = parseInt(document.getElementById('dailyGoalInput').value) || 180;

        userData.profile.name = name;
        userData.profile.dailyGoalMins = goal;

        saveUserData();
        updateProfileUI();
        showToast(t('toast_saved'), 'success');
    }

    function resetDailyProgress() {
        if (!confirm(t('confirm_daily_reset'))) return;
        userData.stats.todayWorkMins = 0;
        userData.stats.todayDate = todayStr();
        if (Array.isArray(userData.peak.dailyFocus)) {
            userData.peak.dailyFocus = userData.peak.dailyFocus.filter(d => d.date !== todayStr());
        }
        saveUserData();
        // Firestore sync
        try { import('./store.js').then(m => { try { m.resetDailyProgress(); m.saveUserData(); } catch(_){} }).catch(()=>{}); } catch(_){}
        updateProfileUI();
        renderTracker();
        updateDisplay();
        renderPlanCard();
        renderStats();
        try { playTone(900,0,0.08,'square',0.08); playTone(600,0.09,0.12,'square',0.08); } catch(_){}
        showToast(t('toast_daily_reset'), 'info');
    }

    // Periyodik timer persist — her 1sn ve her etkileşimde
    setInterval(saveTimerState, 1000);
    window.addEventListener('beforeunload', () => { try { saveTimerState(); } catch(_){} });
    document.addEventListener('visibilitychange', () => { if (document.hidden) try { saveTimerState(); } catch(_){} });

    // BAŞLANGIÇ: tüm modül durumu (let/const) init edildikten sonra çalıştır (TDZ koruması)
    initApp();


// ---- Vite module compatibility: expose globals for HTML onclick ----
try {
  const _g = typeof window !== 'undefined' ? window : globalThis;
  _g.switchTab = switchTab;
  _g.setLang = setLang;
  _g.setBreakMode = setBreakMode;
  _g.togglePeakTest = togglePeakTest;
  _g.finishPeakTest = finishPeakTest;
  _g.clearTPeak = clearTPeak;
  _g.startPlannedSession = startPlannedSession;
  _g.toggleSound = toggleSound;
  _g.toggleAlarmMode = toggleAlarmMode;
  _g.toggleTimer = toggleTimer;
  _g.backToStart = backToStart;
  _g.resetTimer = resetTimer;
  _g.skipStep = skipStep;
  _g.finishEarly = finishEarly;
  _g.saveProfileSettings = saveProfileSettings;
  _g.resetDailyProgress = resetDailyProgress;
  _g.alarmPrimary = alarmPrimary;
  _g.alarmSecondary = alarmSecondary;
  window._legacyUserData = userData;
  window.AscentrixStore = { saveUserData: () => { try { import('./store.js').then(m=>m.saveUserData()); } catch(_){} } };
} catch(e) { console.warn('expose failed', e); }
