import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(process.env.IWE_TEST_RUNTIME_PACKAGE || import.meta.url);
const { chromium } = require('playwright');
const web = process.env.IWE_TEST_WEB_URL || 'http://127.0.0.1:5173';
const panel = process.env.IWE_TEST_PANEL_URL || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const base = {
  hero_copy: 'Primer párrafo\n\nSegundo párrafo', mission_text: 'Misión', team_bio: 'Equipo',
  tours_copy: 'Viajes', contact_copy: 'Contacto', weather_copy: 'Clima',
  privacy_policy_text: '<p>Privacidad</p>', privacy_policy_title: 'Privacidad',
  reviews_direct_items: JSON.stringify([{ name: 'Cliente', quote: 'Excelente', rating: 5 }]),
  reviews_direct_published: '1', reviews_google_published: '0', reviews_tripadvisor_published: '0',
  tours_section_published: '1', contact_phone: '+123456789',
};
const translations = { ca: {}, en: {}, fr: {} };
const writes = [];
const rich = '<h2>Detalle</h2><p>Texto <strong>destacado</strong> &amp; claro</p><ul><li>Uno</li></ul>';
const pkg = { id:'test', title:'Paquete de prueba', duration:'2 días', description:rich, intro_text:rich, intro_title:'Introducción', price_amount:100, price_currency:'EUR', price_unit:'', published:1, media:[], image_url:'', highlights:[rich], itinerary:[rich], translations:{ ca:{},en:{},fr:{} } };
const post = { id:1, slug:'test', title:'Noticia de prueba', body:rich, status:'draft', origin:'web', cover_media_id:null, translations:{ca:{title:'',body:''},en:{title:'',body:''},fr:{title:'',body:''}}, social_links:[] };
await page.route('**/*', (route) => ['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
await page.route('**/api/**', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;
  if (!path.startsWith('/api/')) return route.continue();
  let data = [];
  if (path === '/api/auth/me') data = { user:{ id:999, email:'test@example.invalid', display_name:'Prueba', role:'admin', must_change_password:false } };
  if (path === '/api/content') data = { base, content:{...base,...(translations[url.searchParams.get('locale')] || {})}, translations };
  if (path.startsWith('/api/content/') && request.method() === 'PUT') {
    const key = decodeURIComponent(path.split('/').pop());
    const body = request.postDataJSON();
    base[key] = body.content_value;
    for (const locale of ['ca','en','fr']) translations[locale][key] = body.translations?.[locale] || '';
    writes.push({key,...body}); data = {content_key:key,content_value:base[key]};
  }
  if (path === '/api/packages') data = [pkg];
  if (path === '/api/packages/test') data = pkg;
  if (path === '/api/posts/test' || path === '/api/posts/1') data = post;
  await route.fulfill({status:200, contentType:'application/json',body:JSON.stringify({success:true,data})});
});
try {
  await page.goto(panel + '/content');
  const hero = page.getByRole('textbox',{name:'Texto descriptivo del Hero (Copy)',exact:true});
  await hero.waitFor();
  assert.equal(await hero.locator('p').count(),2,'Legacy paragraphs collapsed on opening');
  assert.equal(await page.locator('.tiptap').count(),8,'Missing long-text editor');
  await hero.fill('Formato conservado');
  await hero.press('ControlOrMeta+a');
  await hero.press('ControlOrMeta+b');
  assert.equal(await hero.locator('strong').innerText(),'Formato conservado');
  await page.getByRole('button',{name:'Guardar todos los cambios'}).click();
  await page.getByText('Todos los textos institucionales y sus traducciones fueron actualizados.').waitFor();
  assert.match(base.hero_copy,/<strong>Formato conservado<\/strong>/);
  await page.reload();
  await hero.locator('strong').waitFor();
  await page.getByRole('button',{name:/English/}).click();
  const englishHero = page.locator('.tiptap').first();
  await englishHero.fill('English formatted');
  await englishHero.press('ControlOrMeta+a'); await englishHero.press('ControlOrMeta+i');
  await page.getByRole('button',{name:'Guardar todos los cambios'}).click();
  await page.getByText('Todos los textos institucionales y sus traducciones fueron actualizados.').waitFor();
  assert.match(translations.en.hero_copy,/<em>English formatted<\/em>/);
  assert.match(base.hero_copy,/<strong>/,'Translation overwrote base content');
  await page.getByRole('button',{name:/Español/}).click();
  await hero.locator('strong').waitFor();
  console.log('PASS dashboard: 8 editors, legacy paragraphs, bold, save/reload, locale isolation');

  await page.goto(panel + '/posts/1');
  await page.getByRole('textbox',{name:'Contenido del post (Español - Principal)'}).locator('strong').waitFor();
  await page.getByRole('button',{name:/English/}).click();
  await page.locator('.tiptap').fill('English news');
  await page.getByRole('button',{name:/Español/}).click();
  await page.locator('.tiptap strong').waitFor();
  console.log('PASS news editor: existing formatting and locale switching');

  await page.goto(panel + '/packages');
  await page.getByText('Paquete de prueba',{exact:true}).waitFor();
  await page.getByRole('button',{name:/Editar/}).click();
  await page.getByRole('textbox',{name:'Descripción del Paquete (Español)',exact:true}).locator('strong').waitFor();
  assert.equal(await page.locator('[role="dialog"] .tiptap').count(),4,'Package body/introduction/list entries lack editors');
  console.log('PASS packages: description, introduction, highlights and itinerary editors');

  base.mission_text = rich; base.team_bio = rich; base.weather_copy = rich; base.contact_copy = rich;
  base.tours_copy = rich;
  await page.goto(web + '/');
  await page.locator('.hero-copy strong').waitFor();
  await page.locator('.large-copy strong').waitFor();
  await page.goto(web + '/paquete/test');
  await page.locator('.tour-description-wrap strong').waitFor();
  assert.equal(await page.locator('.tour-itinerary-list strong').innerText(),'destacado');
  assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),'Detalle Texto destacado & claro Uno');
  await page.goto(web + '/novedades/test');
  await page.locator('.news-article-content strong').waitFor();
  console.log('PASS public web: institutional text, package body/list and news render formatting; metadata is plain text');

  post.body = '<p onclick="window.__unsafe=1">Seguro <strong>visible</strong></p><script>window.__unsafe=1</script><img src=x onerror="window.__unsafe=1"><svg onload="window.__unsafe=1"></svg>';
  await page.reload();
  await page.locator('.news-article-content strong').waitFor();
  assert.equal(await page.locator('.news-article-content [onclick],.news-article-content img,.news-article-content svg,.news-article-content script').count(),0);
  assert.equal(await page.evaluate(()=>window.__unsafe),undefined);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS unsafe markup removed; zero browser exceptions; all API writes mocked (no real data changed)');
} catch (error) { console.error('URL',page.url(),'BODY',(await page.locator('body').innerText()).slice(0,2200),'ERRORS',errors); throw error; } finally { await browser.close(); }
