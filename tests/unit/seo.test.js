import { describe, it, expect } from 'vitest';
import { I18N } from '../../src/modules/i18n.js';
import fs from 'fs';

const ORIGIN = 'https://ugurturker.github.io/Ascentrix';
const PAGES = [
  { file: 'seo.html', lang: 'tr' },
  { file: 'seo.en.html', lang: 'en' },
  { file: 'seo.de.html', lang: 'de' }
];
const read = (f) => fs.readFileSync(f, 'utf-8');

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
});