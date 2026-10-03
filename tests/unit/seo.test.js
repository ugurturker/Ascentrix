import { describe, it, expect } from 'vitest';
import { I18N } from '../../src/modules/i18n.js';
import { MULTIPLIERS, protocolSteps } from '../../src/modules/peak.js';
import fs from 'fs';

const ORIGIN = 'https://ugurturker.github.io/Ascentrix';
const PAGES = [
  { file: 'seo.html', lang: 'tr' },
  { file: 'seo.en.html', lang: 'en' },
  { file: 'seo.de.html', lang: 'de' }
];
const read = (f) => fs.readFileSync(f, 'utf-8');

describe('Merdiven sabitleri kaynak kodla aynı', () => {
  // peak.js MULTIPLIERS: [1.00 Full, 0.80 Friction, 0.65 Fatigue, 0.50 Descent]
  // Yayınlanan metin bu diziden türetilir; elle yazılan çarpan kayabilir.
  const LADDER = '1.00T / 0.80T / 0.65T / 0.50T';

  it('protokolun kendisi 4 basamak ve 0.50 taban', () => {
    expect(MULTIPLIERS).toEqual([1.00, 0.80, 0.65, 0.50]);
    expect(protocolSteps(20).map((s) => s.work)).toEqual([20, 16, 13, 10]);
    // 5. basamak 0.50'de sabitlenir
    expect(protocolSteps(20, 5)[4].work).toBe(10);
  });

  it('eski yanlis carpanlar hicbir yerde kalmadi', () => {
    const files = ['index.html', 'seo.html', 'seo.en.html', 'seo.de.html', 'scripts/generate-og-image.js'];
    for (const f of files) {
      const c = read(f);
      expect(c, `${f} icinde 0.75 olmamali`).not.toContain('0.75T');
      expect(c, `${f} icinde 0.25T olmamali`).not.toContain('0.25T');
      expect(c, `${f} icinde 0,75 olmamali`).not.toContain('0,75T');
    }
  });

  it('dort basamak uc SEO sayfasinda da gorunuyor', () => {
    for (const { file } of PAGES) {
      const html = read(file);
      const times = [...html.matchAll(/class="seo-rung-time">([\d.]+T)</g)].map((m) => m[1]);
      expect(times, `${file} basamak sayisi`).toHaveLength(MULTIPLIERS.length);
      expect(times, `${file} basamaklar`).toEqual(['1.00T', '0.80T', '0.65T', '0.50T']);
      expect(html, `${file} og:description`).toContain(LADDER);
      expect(html, `${file} og:image:alt`).toContain(LADDER);
    }
  });

  it('index.html ve i18n direct_desc guncel carpanlari kullanıyor', () => {
    expect(read('index.html')).toContain(LADDER.split(' / ').join(' → '));
    for (const lang of ['tr', 'en', 'de']) {
      expect(I18N[lang].direct_desc, `${lang}.direct_desc`).toContain('1.00T');
      expect(I18N[lang].direct_desc, `${lang}.direct_desc`).toContain('0.50T');
      expect(I18N[lang].direct_desc, `${lang}.direct_desc`).not.toContain('0.75T');
    }
  });

  it('OG gorsel scripti kaynak carpanlari kullanıyor', () => {
    const script = read('scripts/generate-og-image.js');
    for (const m of MULTIPLIERS) expect(script, `OG scripti ${m}`).toContain(`${m.toFixed(2)}T`);
    expect(script).toContain('2.95');
  });

  it('CSS merdiveni 4 sutun olarak ayarliyor', () => {
    const css = read('src/styles/seo.css');
    expect(css).toMatch(/\.seo-ladder\s*\{[^}]*repeat\(4, 1fr\)/);
  });
});

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
}

function metaContent(html, attr, value) {
  const re = new RegExp(`<meta\\s+(?:name|property)="${attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

describe('SEO altyapısı — meta etiketleri', () => {
  it('index.html canonical + og + twitter + robots var', () => {
    const html = read('index.html');
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/">`);
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain(`property="og:url" content="${ORIGIN}/"`);
    expect(html).toContain(`property="og:image" content="${ORIGIN}/og-image.png"`);
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('name="robots"');
    expect(html).toMatch(/<title>.{20,}<\/title>/);
    expect(metaContent(html, 'description', '').length).toBeGreaterThan(80);
  });

  it('index.html hreflang üç dili de işaretliyor', () => {
    const html = read('index.html');
    expect(html).toContain(`hreflang="tr" href="${ORIGIN}/"`);
    expect(html).toContain(`hreflang="en" href="${ORIGIN}/seo.en.html"`);
    expect(html).toContain(`hreflang="de" href="${ORIGIN}/seo.de.html"`);
    expect(html).toContain('hreflang="x-default"');
  });

  it('tüm sayfalar geçerli JSON-LD içeriyor', () => {
    for (const { file } of [{ file: 'index.html' }, ...PAGES]) {
      const blocks = jsonLdBlocks(read(file));
      expect(blocks.length, `${file} JSON-LD yok`).toBeGreaterThan(0);
      for (const b of blocks) {
        expect(b['@context'], `${file} @context`).toBe('https://schema.org');
      }
    }
  });

  it('index.html WebSite + WebApplication + Organization tanımlı', () => {
    const graph = jsonLdBlocks(read('index.html'))[0]['@graph'];
    const types = graph.map((n) => n['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('WebApplication');
    expect(types).toContain('Organization');
  });

  it('WebApplication ücretsiz ve sıfır fiyatlı', () => {
    const graph = jsonLdBlocks(read('index.html'))[0]['@graph'];
    const app = graph.find((n) => n['@type'] === 'WebApplication');
    expect(app.isAccessibleForFree).toBe(true);
    expect(app.offers.price).toBe('0');
    expect(app.featureList.length).toBeGreaterThan(3);
  });
});

describe('SEO sayfaları', () => {
  it('üç dosya da mevcut', () => {
    for (const { file } of PAGES) expect(fs.existsSync(file), file).toBe(true);
  });

  it('her sayfa kendi lang, canonical ve title’ını taşıyor', () => {
    for (const { file, lang } of PAGES) {
      const html = read(file);
      expect(html, `${file} lang`).toContain(`<html lang="${lang}">`);
      expect(html, `${file} canonical`).toContain(`rel="canonical" href="${ORIGIN}/${file}"`);
      expect(html, `${file} og:url`).toContain(`property="og:url" content="${ORIGIN}/${file}"`);
      expect(html, `${file} og:locale`).toMatch(/property="og:locale" content="(tr_TR|en_US|de_DE)"/);
      const title = html.match(/<title>([\s\S]*?)<\/title>/)[1];
      expect(title.length, `${file} title`).toBeGreaterThan(25);
      expect(title.length, `${file} title max`).toBeLessThan(90);
      expect(metaContent(html, 'description', '').length, `${file} description`).toBeGreaterThan(80);
    }
  });

  it('hreflang dilleri karşılıklı ve x-default TR', () => {
    for (const { file } of PAGES) {
      const html = read(file);
      expect(html, `${file} tr`).toContain(`hreflang="tr" href="${ORIGIN}/seo.html"`);
      expect(html, `${file} en`).toContain(`hreflang="en" href="${ORIGIN}/seo.en.html"`);
      expect(html, `${file} de`).toContain(`hreflang="de" href="${ORIGIN}/seo.de.html"`);
      expect(html, `${file} x-default`).toContain(`hreflang="x-default" href="${ORIGIN}/seo.html"`);
    }
  });

  it('tüm og:image dosyaları gerçekten var', () => {
    for (const file of ['og-image.png', 'og-image.en.png', 'og-image.de.png']) {
      expect(fs.existsSync(`public/${file}`), file).toBe(true);
    }
  });

  it('FAQPage şeması sayfadaki görünür SSS ile aynı soruları içeriyor', () => {
    for (const { file } of PAGES) {
      const html = read(file);
      const graph = jsonLdBlocks(html)[0]['@graph'];
      const faq = graph.find((n) => n['@type'] === 'FAQPage');
      expect(faq, `${file} FAQPage`).toBeDefined();
      const schemaNames = faq.mainEntity.map((q) => q.name);
      const visible = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((m) => m[1].trim());
      expect(visible.length, `${file} görünür SSS sayısı`).toBe(schemaNames.length);
      for (const name of schemaNames) {
        expect(visible, `${file} görünmeyen SSS: ${name}`).toContain(name);
      }
    }
  });

  it('HowTo adımları sayfadaki bölümlere bağlı', () => {
    for (const { file } of PAGES) {
      const html = read(file);
      const graph = jsonLdBlocks(html)[0]['@graph'];
      const howto = graph.find((n) => n['@type'] === 'HowTo');
      expect(howto, `${file} HowTo`).toBeDefined();
      expect(howto.step.length).toBeGreaterThanOrEqual(4);
      for (const step of howto.step) {
        const anchor = step.url.split('#')[1];
        expect(html, `${file} eksik çapa #${anchor}`).toContain(`id="${anchor}"`);
      }
    }
  });

  it('her sayfa uygulamaya gerçek bir bağlantı veriyor', () => {
    for (const { file } of PAGES) {
      const html = read(file);
      expect(html, `${file} /Ascentrix/ bağlantısı`).toContain('href="/Ascentrix/"');
      expect(html, `${file} dil değiştirici`).toContain('seo.en.html');
      expect(html, `${file} dil değiştirici`).toContain('seo.de.html');
    }
  });

  it('SEO sayfaları uygulama JS paketini yüklemiyor', () => {
    for (const { file } of PAGES) {
      const html = read(file);
      expect(html, `${file} src/main.js yüklenmemeli`).not.toContain('/src/main.js');
      expect(html.includes('onclick='), `${file} inline onclick olmamalı`).toBe(false);
    }
  });
});

describe('Veri modeli metin tutarlılığı', () => {
  // store.js Firestore-only: giriş yapılmazsa veri oturumla sınırlı.
  // Kullanıcıya görünen metinlerde "localStorage" veya "sadece tarayıcı" iddiası kalmamalı.
  const banned = [/localStorage/i, /tarayıcınızda/i, /own browser/i, /eigenen Browser/i];

  it('donate_text üç dilde de Firestore gerçeğini anlatıyor', () => {
    for (const lang of ['tr', 'en', 'de']) {
      const text = I18N[lang].donate_text;
      expect(text, `${lang}.donate_text`).toMatch(/Firestore/);
      for (const re of banned) expect(text, `${lang}.donate_text: ${re}`).not.toMatch(re);
    }
  });

  it('auth kartı notu localStorage fallback vaat etmiyor', () => {
    const html = read('index.html');
    expect(html).not.toMatch(/Yapılandırma yoksa localStorage/);
    expect(html).toMatch(/oturumda tutulur/);
  });

  it('guest durum mesajı localStorage demiyor', () => {
    const main = read('src/main.js');
    expect(main).not.toMatch(/GUEST\].*localStorage/);
    expect(main).toMatch(/GUEST\]/);
  });

  it('SEO sayfalarının depolama SSS yanıtı store.js ile uyumlu', () => {
    for (const { file } of PAGES) {
      const html = read(file);
      const faq = jsonLdBlocks(html)[0]['@graph'].find((n) => n['@type'] === 'FAQPage');
      const storage = faq.mainEntity.find((q) => /stored|gespeichert|saklan/i.test(q.name));
      expect(storage, `${file} depolama SSS`).toBeDefined();
      expect(storage.acceptedAnswer.text, `${file} depolama yanıtı`).toMatch(/Firestore/);
      expect(storage.acceptedAnswer.text, `${file} depolama yanıtı`).toMatch(/session|Sitzung|oturum/);
    }
  });

  it('store.js gerçekten localStorage veri yazmıyor', () => {
    const store = read('src/modules/store.js');
    expect(store).toContain('Firestore-only');
    const writes = [...store.matchAll(/localStorage\.setItem\('([^']+)'/g)].map((m) => m[1]);
    for (const key of writes) expect(['ascentrix_theme', 'ascentrix_simplify']).toContain(key);
  });
});

describe('Search Console dogrulama dosyasi', () => {
  // Vite yalnizca public/ icerigini dist/ kokune kopyalar. Repo kokundeki bir
  // .html dosyasi hicbir zaman deploy edilmez -> dogrulama 404 doner.
  it('dogrulama dosyasi public/ altinda', () => {
    expect(fs.existsSync('public/google46148e0d0999a16c.html')).toBe(true);
    expect(fs.existsSync('google46148e0d0999a16c.html'), 'kokte kalan kopya 404 verir').toBe(false);
  });

  it('icerik google-site-verification biciminde', () => {
    const c = read('public/google46148e0d0999a16c.html').trim();
    expect(c).toBe('google-site-verification: google46148e0d0999a16c.html');
  });

  it('build ciktisina kopyalaniyor', () => {
    if (!fs.existsSync('dist')) return; // build henuz calismadi
    expect(fs.existsSync('dist/google46148e0d0999a16c.html'), 'dist icinde olmali').toBe(true);
  });
});

describe('Teknik SEO dosyaları', () => {
  it('robots.txt sitemap’i işaret ediyor', () => {
    const robots = read('public/robots.txt');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it('sitemap.xml dört URL’i de xhreflang ile listeliyor', () => {
    const xml = read('public/sitemap.xml');
    expect(xml).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    for (const url of [`${ORIGIN}/`, `${ORIGIN}/seo.html`, `${ORIGIN}/seo.en.html`, `${ORIGIN}/seo.de.html`]) {
      expect(xml, `sitemap: ${url}`).toContain(`<loc>${url}</loc>`);
    }
    const hreflangCount = (xml.match(/xhtml:link/g) || []).length;
    expect(hreflangCount).toBe(4 * 4);
  });

  it('vite build girdisi dört sayfayı da kapsıyor', () => {
    const cfg = read('vite.config.js');
    for (const { file } of [{ file: 'index.html' }, ...PAGES]) {
      expect(cfg, `vite input: ${file}`).toContain(`'${file}'`);
    }
  });

  it('i18n footer_about üç dilde de var', () => {
    for (const lang of ['tr', 'en', 'de']) {
      expect(I18N[lang].footer_about, `${lang}.footer_about`).toBeDefined();
    }
    expect(read('index.html')).toContain('data-i18n="footer_about"');
    expect(read('index.html')).toContain('href="/Ascentrix/seo.html"');
  });

  it('SEO sayfasi baglantisi ilk ekranda gorunur (ust cubukta)', () => {
    const html = read('index.html');
    // ust cubuk lang-bar ile ayni satirda olmali
    expect(html).toMatch(/class="top-bar">[\s\S]{0,400}?class="about-link"[\s\S]{0,400}?class="lang-bar"/);
    expect(html).toMatch(/class="about-link"[^>]*href="\/Ascentrix\/seo\.html"/);
    expect(html).toContain('data-i18n="nav_about"');
    for (const lang of ['tr', 'en', 'de']) {
      expect(I18N[lang].nav_about, `${lang}.nav_about`).toBeDefined();
    }
    const css = read('src/styles/main.css');
    expect(css).toContain('.top-bar');
    expect(css).toContain('.about-link');
  });
});