/* Nookara Kit 2 — native elements for member profiles and account connections. */
(() => {
  'use strict';
  // BEGIN GENERATED BIO RENDERER
// Shared safe profile bio renderer. Raw HTML is always text.
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function mdInline(s, ph) {
  const hold = html => { ph.push(html); return `\u0000${ph.length - 1}\u0000`; };
  s = s.replace(/`([^`\n]+)`/g, (m, c) => hold(`<code class="md-code">${c}</code>`));
  s = s.replace(/\[([^\]\n]{1,200})\]\((https?:\/\/[^\s<>()]+)\)/g, (m, label, url) =>
    hold(`<a href="${url}" target="_blank" rel="noopener noreferrer nofollow ugc" title="${url}">${mdFormat(label)}</a>`));
  s = s.replace(/https?:\/\/(?:(?!&lt;|&gt;|&quot;)[^\s<>"'\u0000])+/gi, m => {
    let end = m.length;
    for (;;) {
      const part = m.slice(0, end);
      if (/&(?:amp|lt|gt|quot);$/.test(part)) break;
      const c = part[end - 1];
      if (c && '.,;:!?*|~'.includes(c)) { end--; continue; }
      if (c === ')' && part.split('(').length < part.split(')').length) { end--; continue; }
      if (c === ']' && part.split('[').length < part.split(']').length) { end--; continue; }
      break;
    }
    const url = m.slice(0, end);
    if (url.length < 9) return m;
    return hold(`<a href="${url}" target="_blank" rel="noopener noreferrer nofollow ugc">${url}</a>`) + m.slice(end);
  });
  return mdFormat(s);
}
function mdFormat(s) {
  return s
    .replace(/\|\|([\s\S]+?)\|\|/g, '<span class="md-spoiler">$1</span>')
    .replace(/\*\*([\s\S]+?)\*\*/g, '<b>$1</b>')
    .replace(/__([\s\S]+?)__/g, '<u>$1</u>')
    .replace(/~~([\s\S]+?)~~/g, '<s>$1</s>')
    .replace(/(^|\s)\*([^*\n]+?)\*(?=\s|$|[.,!?])/g, '$1<i>$2</i>')
    .replace(/(^|\s)_([^_\n]+?)_(?=\s|$|[.,!?])/g, '$1<i>$2</i>');
}
function mdBio(text) {
  const ph = [];
  const inl = line => mdInline(esc(line), ph);
  const out = [];
  const parts = String(text ?? '').replace(/\u0000/g, '').replace(/\r\n?/g, '\n').split('```');
  parts.forEach((part, pi) => {
    if (pi % 2 === 1) { out.push(`<pre class="md-pre"><code>${esc(part.replace(/^[a-z0-9+#-]{1,20}\n/i, '').replace(/^\n/, '').replace(/\n$/, ''))}</code></pre>`); return; }
    const lines = part.split('\n');
    let list = null, quote = null, inlineRun = false;
    const buildList = (items, depth) => {
      let html = '', i = 0;
      while (i < items.length) {
        const it = items[i]; const kids = []; let j = i + 1;
        while (j < items.length && items[j].depth > depth) kids.push(items[j++]);
        html += `<li>${it.html}${kids.length ? buildList(kids, depth + 1) : ''}</li>`; i = j;
      }
      return items[0].ordered ? `<ol class="md-list" start="${items[0].n}">${html}</ol>` : `<ul class="md-list">${html}</ul>`;
    };
    const flush = () => {
      if (list) { out.push(buildList(list, list[0].depth)); list = null; }
      if (quote) { out.push(`<blockquote class="md-quote">${quote.join('<br>')}</blockquote>`); quote = null; }
    };
    lines.forEach((line, li) => {
      const item = /^(\s*)([-*]|(\d{1,3})[.)])\s+(.+)$/.exec(line);
      if (item) {
        if (quote) flush();
        const it = { depth: Math.floor(item[1].replace(/\t/g, '  ').length / 2), ordered: !!item[3], n: Number(item[3]) || 1, html: inl(item[4]) };
        if (list && (it.depth > 0 || list[0].ordered === it.ordered)) list.push(it); else { flush(); list = [it]; }
        inlineRun = false; return;
      }
      const q = /^>{1,3} ?(.*)$/.exec(line);
      if (q && /^> /.test(line)) { if (list) flush(); (quote = quote || []).push(inl(q[1])); inlineRun = false; return; }
      flush();
      const h = /^(#{1,3})\s+(.+)$/.exec(line);
      if (h) { out.push(`<div class="md-h">${inl(h[2])}</div>`); inlineRun = false; return; }
      const sub = /^-#\s+(.+)$/.exec(line);
      if (sub) { out.push(`<small class="md-sub">${inl(sub[1])}</small>`); inlineRun = false; return; }
      if (!line.trim()) { if (inlineRun || (li > 0 && li < lines.length - 1)) out.push('<br>'); return; }
      if (inlineRun) out.push('<br>');
      out.push(inl(line)); inlineRun = true;
    });
    flush();
  });
  let html = out.join('');
  for (let n = 0; n < 4 && html.includes('\u0000'); n++) html = html.replace(/\u0000(\d+)\u0000/g, (m, i) => ph[Number(i)] ?? '');
  return html.replace(/\u0000/g, '').replace(/(<br>)+$/, '');
}
  // END GENERATED BIO RENDERER
  const RUNTIME = Symbol.for('velora.kit.v2');
  if (window[RUNTIME]) return;
  const SERVICE = 'https://nookara.cc';
  const SESSION_KEY = 'velora_kit_session_v2';
  const mounted = new Set();
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = String(text);
    return element;
  };
  function destination(value, launcher = false) {
    if (typeof value !== 'string' || !value.trim()) return '';
    if (launcher && /^hyperfocus:\/\/(play|add)\/[a-z0-9._%~-]+$/i.test(value)) return value;
    try {
      const parsed = new URL(value, SERVICE);
      return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : '';
    } catch { return ''; }
  }
  function link(label, target, className = 'text-link') {
    const anchor = node('a', className, label);
    anchor.href = destination(target, true) || SERVICE;
    anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
    return anchor;
  }
  const memberUrl = name => SERVICE + '/u/' + encodeURIComponent(name);
  function picture(source, className, alt = '') {
    const image = node('img', className);
    image.src = destination(source); image.alt = alt;
    image.loading = 'lazy'; image.decoding = 'async'; image.referrerPolicy = 'no-referrer';
    return image;
  }
  function portrait(person, size = 64) {
    const tile = node('span', 'portrait');
    tile.style.setProperty('--portrait-size', size + 'px');
    tile.append(node('span', 'initial', Array.from(person.username || '?')[0].toUpperCase()));
    if (destination(person.pfp_url)) {
      const image = picture(person.pfp_url, '', person.username + ' portrait');
      image.addEventListener('error', () => image.remove(), { once: true });
      tile.append(image);
    }
    return tile;
  }
  function action(label, callback, secondary = false) {
    const button = node('button', secondary ? 'action secondary' : 'action', label);
    button.type = 'button';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { await callback(); }
      catch (error) {
        const status = node('p', 'feedback', error.message || 'The request could not finish.');
        status.setAttribute('role', 'status'); button.after(status);
      } finally { button.disabled = false; }
    });
    return button;
  }
  class RequestFailure extends Error {
    constructor(status, data) { super(data.message || 'Nookara could not complete this request.'); this.status = status; this.code = data.error; }
  }
  class ResourceStore {
    constructor() { this.records = new Map(); }
    clear() { this.records.clear(); }
    read(key, loader) {
      const existing = this.records.get(key);
      if (existing && (existing.pending || Date.now() - existing.at < 25000)) return existing.promise;
      const record = { pending: true, at: Date.now() };
      record.promise = Promise.resolve().then(loader).then(value => { record.pending = false; return value; }, error => {
        if (this.records.get(key) === record) this.records.delete(key);
        throw error;
      });
      this.records.set(key, record); return record.promise;
    }
  }
  const resources = new ResourceStore();
  let memorySession;
  function sessionToken() {
    if (memorySession !== undefined) return memorySession;
    try { return localStorage.getItem(SESSION_KEY) || (location.origin === SERVICE ? localStorage.getItem('velora_token') : '') || ''; }
    catch { return ''; }
  }
  async function request(route, { method = 'GET', body, token = sessionToken() } = {}) {
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(SERVICE + route, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(12000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new RequestFailure(response.status, data);
    return data;
  }
  function remember(token) {
    memorySession = token;
    try { token ? localStorage.setItem(SESSION_KEY, token) : localStorage.removeItem(SESSION_KEY); } catch {}
    resources.clear();
  }
  async function viewer() {
    const token = sessionToken();
    if (!token) return null;
    return resources.read('viewer:' + token, async () => {
      try {
        const result = await request('/account/me', { token });
        if (!result.account?.username) throw new RequestFailure(401, {});
        const account = result.account, profile = result.profile || {};
        return { username: account.username, rank: account.rank, pfp: profile.pfp || '', color: profile.color || '', pro: !!account.pro };
      } catch (error) {
        if (error.status === 401 || error.code === 'domain_blacklisted') { remember(''); return null; }
        throw error;
      }
    });
  }
  function redraw() { for (const element of mounted) if (element.isConnected) element.render(); }
  function changed(user) { redraw(); window.dispatchEvent(new CustomEvent('velora-kit:session', { detail: { viewer: user } })); }
  let connecting;
  const APP_ID = document.currentScript?.dataset?.app || '';
  function connectApp() {
    const popup = window.open('about:blank', 'velora-kit-approval', `popup,width=900,height=${Math.max(320, Math.min(800, (window.screen?.availHeight || 900) - 80))},scrollbars=yes,resizable=yes`);
    if (!popup) return Promise.reject(new Error('Allow the account approval window, then try again.'));
    return new Promise((resolve, reject) => {
      let code = null, timer = null;
      const done = (fn, v) => { clearInterval(timer); removeEventListener('message', onMessage); fn(v); };
      const onMessage = async e => {
        if (e.origin !== new URL(SERVICE).origin || !code || e.data?.code !== code || e.data?.type !== 'nookara_app_grant') return;
        try {
          const x = await request('/auth/ext-code/exchange', { method: 'POST', body: { code, grant: e.data.grant }, token: '' });
          remember(x.token);
          const user = await viewer();
          if (!user) throw new Error('The approved session could not be opened.');
          changed(user); done(resolve, user);
        } catch (error) { done(reject, error); }
      };
      addEventListener('message', onMessage);
      request('/auth/ext-code', { method: 'POST', body: { app_id: APP_ID }, token: '' }).then(d => {
        if (!d.code) throw new Error('Account approval is temporarily unavailable.');
        code = d.code;
        popup.location.href = new URL('/login?code=' + encodeURIComponent(code), SERVICE).href;
        timer = setInterval(() => { if (popup.closed) done(reject, new Error('The account approval window was closed.')); }, 800);
      }).catch(error => { try { popup.close(); } catch {  } done(reject, error); });
    });
  }
  function connect() {
    if (connecting) return connecting;
    if (APP_ID) return (connecting = connectApp().finally(() => { connecting = null; }));
    const popup = window.open('about:blank', 'velora-kit-approval', `popup,width=500,height=${Math.max(320, Math.min(800, (window.screen?.availHeight || 900) - 80))},scrollbars=yes,resizable=yes`);
    if (!popup) return Promise.reject(new Error('Allow the account approval window, then try again.'));
    connecting = (async () => {
      const project = 'Nookara Kit / ' + location.hostname;
      const approval = await request('/auth/ext-code', { method: 'POST', body: { project_name: project, permissions_integer: 1 }, token: '' });
      if (!approval.code) throw new Error('Account approval is temporarily unavailable.');
      const url = new URL('/login', SERVICE);
      url.search = new URLSearchParams({ code: approval.code, project, permissions: '1' });
      popup.location.href = url.href;
      const started = Date.now();
      while (Date.now() - started < 300000) {
        let state;
        try { state = await request('/auth/ext-code/status?code=' + encodeURIComponent(approval.code), { token: '' }); }
        catch (error) { if (error.status && error.status < 500) throw error; }
        if (state?.ready && state.token) {
          remember(state.token);
          const user = await viewer();
          if (!user) throw new Error('The approved session could not be opened.');
          changed(user); return user;
        }
        if (state?.alive === false && Date.now() - started > 15000) throw new Error('Account approval was closed.');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      throw new Error('Account approval expired. Please start again.');
    })().finally(() => { connecting = null; try { popup.close(); } catch {} });
    return connecting;
  }
  function disconnect() { remember(''); changed(null); }
  const ELEMENT_STYLE = `

    :host{display:inline-block;max-width:100%;vertical-align:top;font:14px/1.6 var(--vk-font,"Segoe UI",system-ui,-apple-system,sans-serif);--base:var(--vk-base,#151517);--surface:var(--vk-surface,#1c1c20);--line:var(--vk-line,#292930);--ink:var(--vk-ink,#e7e7ea);--muted:var(--vk-muted,#a1a1aa);--accent:var(--vk-accent,#9d8ad1);--on:var(--vk-on-accent,#fff);--radius:var(--vk-radius,0px);color:var(--ink);color-scheme:dark}
    :host([theme=paper]){--base:var(--vk-base,#fff);--surface:var(--vk-surface,#f4f4f6);--line:var(--vk-line,#e2e2e8);--ink:var(--vk-ink,#18181b);--muted:var(--vk-muted,#6b6b76);color-scheme:light}
    :host(velora-card){width:340px}:host(velora-card[variant=compact]){width:auto}:host(velora-members){display:block}
    *,*::before,*::after{box-sizing:border-box}[hidden]{display:none!important}a{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer}button:disabled{cursor:default;opacity:.65}p{margin:0}a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
    .panel{background:var(--base);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;max-width:100%}.cover{height:96px;background:linear-gradient(135deg,var(--accent),#3b3552)}.cover img{display:block;width:100%;height:100%;object-fit:cover}
    .profile-head{padding:0 16px;margin-top:-30px;position:relative;display:flex;align-items:flex-end;gap:12px}.portrait{position:relative;display:inline-grid;place-items:center;width:var(--portrait-size,40px);height:var(--portrait-size,40px);flex-shrink:0;overflow:hidden;border-radius:50%;background:var(--surface)}.portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.initial{display:none}.portrait-ring{position:relative;display:inline-flex;flex:none}.profile-head .portrait{border:4px solid var(--base)}
    .signal{display:inline-block;width:9px;height:9px;border-radius:50%;background:#6b6b76;flex:none}.signal.online{background:var(--vk-online,#4ade80)}.signal.idle{background:var(--vk-idle,#facc15)}.signal.dnd{background:var(--vk-dnd,#f87171)}.portrait-ring>.signal{position:absolute;right:2px;bottom:2px;width:14px;height:14px;border:3px solid var(--base)}
.biography { font-size: 14.5px; line-height: 1.6; word-break: break-word; margin-bottom: 16px; }
.biography a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.biography .md-code { padding: 0 4px; background: #0a0a0c; border: 1px solid var(--line); font-family: Consolas, 'Cascadia Code', monospace; font-size: 13px; }
.biography .md-pre { margin: 6px 0; padding: 8px 10px; background: #0a0a0c; border: 1px solid var(--line); overflow-x: auto; font-family: Consolas, 'Cascadia Code', monospace; font-size: 13px; line-height: 1.45; white-space: pre; }
.biography .md-spoiler { background: #2c2c33; color: transparent; cursor: pointer; transition: color .2s, background .2s; }
.biography .md-spoiler.shown { background: rgba(255,255,255,.07); color: inherit; cursor: text; }
.biography .md-spoiler:not(.shown) * { color: transparent !important; background: none !important; }
.biography .md-h { margin: 4px 0 1px; font-size: 1.05em; font-weight: 700; line-height: 1.3; }
.biography .md-sub { display: block; color: var(--muted); font-size: 12.5px; line-height: 1.4; }
.biography .md-quote { margin: 3px 0; padding-left: 10px; border-left: 3px solid var(--line); color: var(--muted); }
.biography .md-list { margin: 3px 0; padding-left: 22px; }
.biography ul.md-list { list-style: disc; }
.biography ol.md-list { list-style: decimal; }
.biography .md-list li::marker { color: var(--accent); }
    .profile-body{padding:10px 16px 16px;display:grid;gap:10px}.name-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.handle{font-size:17px;font-weight:700;overflow-wrap:anywhere}.membership{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:2px 6px;border:1px solid var(--line);border-radius:var(--radius);color:var(--muted)}.muted{font-size:12px;color:var(--muted)}.biography{font-size:13px;line-height:1.6;color:var(--muted);white-space:normal;overflow-wrap:anywhere}
    .identity{display:flex;gap:10px;align-items:center;min-width:0}.identity>div{min-width:0}.compact{padding:10px 12px;min-width:min(220px,100%)}.compact .handle{font-size:14px}.compact .portrait-ring>.signal{width:12px;height:12px;right:0;bottom:0}.availability{display:inline-flex;gap:6px;align-items:center;font-size:13px}.availability>span{overflow-wrap:anywhere}
    .name-link{display:inline-flex;align-items:center;gap:5px;padding:2px 8px 2px 2px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);font-size:13px;font-weight:600;vertical-align:middle}.name-link .portrait{--portrait-size:18px!important}
    .awards{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.award{display:inline-flex}.award img{width:20px;height:20px;object-fit:contain}.award:not(:has(img)){display:none}
    .session{display:flex;gap:10px;align-items:center;padding:8px;background:var(--surface);border-left:2px solid var(--accent);border-radius:var(--radius);font-size:12px}.session>div{min-width:0}.session img{width:34px;height:34px;object-fit:cover}.session b{display:block;font-size:13px;overflow-wrap:anywhere}.session small{display:block;font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--vk-online,#4ade80)}.session p{overflow-wrap:anywhere}.sessions{display:grid;gap:8px}
    .divider{display:flex;align-items:center;gap:5px;padding:6px 12px;background:var(--surface);border:1px solid var(--line);border-top:0;border-radius:0 0 var(--radius) var(--radius);font-size:10.5px;color:var(--muted)}.divider svg{width:11px;height:11px}.profile-panel,.support-panel{border-bottom-left-radius:0;border-bottom-right-radius:0}.signature{font-weight:700}.divider:hover{color:var(--accent)}
    .action{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:8px 14px;border:0;border-radius:var(--radius);background:var(--accent);color:var(--on);font-size:13px;font-weight:600}.action.secondary{background:var(--surface);color:var(--ink);border:1px solid var(--line)}.action:hover{filter:brightness(1.1)}.logo{width:16px;height:16px;flex:none}.feedback{font-size:12px;color:var(--muted);overflow-wrap:anywhere}
    .library{width:360px;max-width:100%;display:grid;gap:8px}.game{display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--line);border-radius:var(--radius);background:var(--base)}.game>img{width:36px;height:36px;object-fit:cover}.game>div{min-width:0;flex:1}.game b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.game small{font-size:12px;color:var(--muted)}.game-symbol{display:none}.progress{display:block;height:4px;background:var(--surface);margin-top:4px;overflow:hidden}.progress>i{display:block;height:100%;background:var(--accent)}
    .support-panel{display:grid;gap:10px;padding:14px;width:280px}.support-panel .handle{font-size:14px}.amounts{display:flex;gap:6px}.amounts button{flex:1;padding:6px 0;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);color:var(--ink);font:inherit;font-size:13px}.amounts button[aria-pressed=true]{border-color:var(--accent);color:var(--accent)}.connector{display:inline-flex;gap:8px;align-items:center;flex-wrap:wrap}.member-note{padding:16px;background:var(--base);border:1px dashed var(--line);border-radius:var(--radius);display:grid;justify-items:start;gap:10px;font-size:13px;color:var(--muted)}.example{font-size:10px;color:var(--muted);margin-bottom:7px}.loading{padding:8px;font-size:12px;color:var(--muted)}.error{display:grid;gap:8px;padding:10px;border:1px solid var(--line);background:var(--base)}
  `;
  const SAMPLE_PERSON = { username: 'pixelgarden', rank: 'pro', pronouns: 'she / her', status: 'online', bio: 'Small games, late-night sketches, and things made for friends.', badges: [{ name: 'Early explorer' }, { name: 'Creator' }], activities: [{ type: 'playing', name: 'Moonlit Crossing', state: 'Taking the scenic route' }] };
  const SAMPLE_LIBRARY = { games: [{ name: 'Moonlit Crossing', seconds: 9360, ach: { unlocked: 8, total: 12 } }, { name: 'Paper Planets', seconds: 4200, ach: { unlocked: 3, total: 9 } }] };
  const descriptions = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb', offline: 'Offline' };
  function availability(person) {
    const row = node('span', 'availability');
    const status = !person.private && descriptions[person.status] ? person.status : 'offline';
    row.append(node('i', 'signal ' + status), node('span', '', person.private ? 'Limited profile' : descriptions[status]));
    return row;
  }
  function awards(person) {
    const collection = node('div', 'awards');
    for (const badge of (person.private ? [] : Array.isArray(person.badges) ? person.badges : []).slice(0, 24)) {
      const item = node('span', 'award'); item.title = badge.description || badge.name || '';
      if (destination(badge.icon_url)) item.append(picture(badge.icon_url, '', badge.name || 'Award'));
      else item.append(document.createTextNode(badge.name || 'Award')); collection.append(item);
    }
    if (!collection.childNodes.length) collection.append(node('p', 'muted', person.private ? 'Awards are not shared with this viewer.' : 'No awards to display.'));
    return collection;
  }
  function activities(person, library) {
    if (person.private) return [];
    const items = [];
    if (library?.playing?.name) items.push({ ...library.playing, type: 'playing' });
    for (const entry of [...(person.activities || []), ...(library?.activities || [])]) {
      if (entry?.name && !items.some(x => x.name.toLowerCase() === String(entry.name).toLowerCase())) items.push(entry);
    }
    return items.slice(0, 3);
  }
  function currentSession(entry) {
    const box = node('div', 'session');
    if (destination(entry.image || entry.icon)) box.append(picture(entry.image || entry.icon, '', ''));
    const text = node('div');
    const verb = { playing: 'Playing now', listening: 'Listening now', watching: 'Watching now', streaming: 'Streaming now', competing: 'Competing now' };
    text.append(node('small', '', verb[entry.type] || 'Current activity'), node('b', '', entry.name));
    if (entry.details) text.append(node('p', '', entry.details));
    if (entry.state) text.append(node('p', '', entry.state));
    box.append(text); return box;
  }
  function emblem() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'logo'); svg.setAttribute('aria-hidden', 'true');
    [20, 42, 64].forEach((y, index) => {
      const bar = document.createElementNS(svg.namespaceURI, 'rect');
      for (const [key, value] of Object.entries({ x: 20, y, width: 60, height: 16, fill: 'currentColor', opacity: 1 - index * .3 })) bar.setAttribute(key, value);
      svg.append(bar);
    }); return svg;
  }
  function portraitRing(person, size) {
    const ring = node('span', 'portrait-ring'); ring.append(portrait(person, size));
    if (!person.private) ring.append(node('i', 'signal ' + (descriptions[person.status] ? person.status : 'offline')));
    return ring;
  }
  function memberName(person) {
    const handle = link(person.username, memberUrl(person.username), 'handle');
    if (/^#[a-f0-9]{6}$/i.test(person.color || '')) handle.style.color = person.color;
    return handle;
  }
  function identity(person, size) {
    const row = node('div', 'identity'), text = node('div');
    text.append(memberName(person)); row.append(portraitRing(person, size), text); return row;
  }
  function signature(person) {
    const row = link('', memberUrl(person.username), 'divider');
    row.append(emblem(), node('span', '', 'Profile via '), node('b', 'signature', 'Nookara')); return row;
  }
  function profileCard(person, library, compact) {
    if (compact) {
      const panel = node('article', 'panel compact'), row = identity(person, 40), detail = row.lastElementChild;
      const active = activities(person, library)[0];
      detail.append(node('div', 'muted', active ? (active.type === 'listening' ? 'Listening to ' : 'Playing ') + active.name : person.private ? 'Limited profile' : descriptions[person.status] || 'Offline'));
      panel.append(row); return panel;
    }
    const wrap = node('div'), panel = node('article', 'panel profile-panel'), banner = node('div', 'cover');
    if (!person.private && destination(person.banner_url)) banner.append(picture(person.banner_url, '', ''));
    const head = node('div', 'profile-head'); head.append(portraitRing(person, 72));
    const body = node('div', 'profile-body'), names = node('div', 'name-row'); names.append(memberName(person));
    if (person.rank && person.rank !== 'free') names.append(node('span', 'membership', person.rank));
    const heading = node('div'); heading.append(names);
    if (person.private) heading.append(node('p', 'muted', 'This member shares their full profile with friends.'));
    else if (person.badges?.length) heading.append(awards(person));
    body.append(heading);
    if (!person.private && person.bio) {
      const bio = node('div', 'biography');
      bio.innerHTML = mdBio(person.bio);
      bio.addEventListener('click', event => {
        const spoiler = event.target.closest('.md-spoiler');
        if (spoiler && !spoiler.classList.contains('shown')) { event.preventDefault(); spoiler.classList.add('shown'); }
      });
      body.append(bio);
    }
    for (const entry of activities(person, library)) body.append(currentSession(entry));
    panel.append(banner, head, body); wrap.append(panel, signature(person)); return wrap;
  }
  const clamp = (value, fallback, min, max) => Math.max(min, Math.min(max, Math.trunc(Number(value)) || fallback));
  async function contents(element) {
    const kind = element.kind, example = element.hasAttribute('example');
    if (kind === 'connect') {
      const user = example ? null : await viewer(), row = node('div', 'connector');
      if (user) row.append(portrait({ username: user.username, pfp_url: user.pfp }, 26), node('span', '', 'Connected as ' + user.username), action('Disconnect', disconnect, true));
      else { const button = action('Connect your Nookara account ↗', connect); button.disabled = example; row.append(button); }
      return row;
    }
    if (kind === 'members') {
      const user = example ? null : await viewer();
      if (user && (element.getAttribute('plan') !== 'pro' || user.pro)) return node('slot');
      const notice = node('div', 'member-note');
      notice.append(node('b', '', user ? 'A Pro account is needed here.' : 'This section opens after account approval.'));
      if (user) notice.append(link('Explore Pro membership ↗', SERVICE + '/upgrade', 'action'));
      else { const button = action('Connect to continue ↗', connect); button.disabled = example; notice.append(button); }
      return notice;
    }
    const account = element.getAttribute('account')?.trim();
    if (!account && !example) throw new Error('Choose an account for this element.');
    const person = example ? SAMPLE_PERSON : await resources.read('person:' + account.toLowerCase(), () => request('/account/lookup/' + encodeURIComponent(account)));
    const needsLibrary = ['card', 'compact', 'now', 'library'].includes(kind);
    const library = example ? SAMPLE_LIBRARY : !person.private && needsLibrary ? await resources.read('library:' + account.toLowerCase(), () => request('/hyperfocus/profile/' + encodeURIComponent(account))).catch(() => null) : null;
    if (kind === 'portrait') return linkPortrait(person, clamp(element.getAttribute('size'), 64, 16, 320));
    if (kind === 'card' || kind === 'compact') return profileCard(person, library, kind === 'compact');
    if (kind === 'name') { const row = link('@' + person.username, memberUrl(person.username), 'name-link'); row.prepend(portrait(person, 25)); return row; }
    if (kind === 'presence') return availability(person);
    if (kind === 'awards') return awards(person);
    if (kind === 'shortcut') return link('Meet ' + person.username + ' on Nookara ↗', memberUrl(person.username), 'action secondary');
    const panel = node('div', kind === 'support' ? 'panel support-panel' : kind === 'library' ? '' : 'sessions');
    if (kind === 'support') {
      const heading = identity(person, 36);
      heading.lastElementChild.append(node('p', 'muted', 'Contribute Nookara credits'));
      panel.append(heading);
    }
    if (kind === 'now') {
      const entries = activities(person, library);
      if (entries.length) for (const entry of entries) panel.append(currentSession(entry));
      else panel.append(node('p', 'muted', 'No shared activity at the moment.'));
    } else if (kind === 'library') {
      const games = person.private ? [] : (library?.games || []).slice(0, clamp(element.getAttribute('limit'), 4, 1, 12)), list = node('div', 'library');
      for (const game of games) {
        const row = link('', destination(game.play, true) || memberUrl(person.username), 'game');
        row.append(destination(game.icon) ? picture(game.icon, '', '') : node('span', 'game-symbol', '◇'));
        const details = node('div'), minutes = Math.floor(Math.max(0, Number(game.seconds) || 0) / 60);
        details.append(node('b', '', game.name), node('small', '', Math.floor(minutes / 60) + ' hr ' + minutes % 60 + ' min recorded'));
        if (Number(game.ach?.total) > 0) {
          const total = Number(game.ach.total), unlocked = Math.max(0, Number(game.ach.unlocked) || 0);
          details.append(node('small', '', ' · ' + unlocked + ' of ' + total + ' achievements'));
          const progress = node('span', 'progress'), fill = node('i'); fill.style.width = Math.min(100, unlocked / total * 100) + '%'; progress.append(fill); details.append(progress);
        }
        row.append(details); list.append(row);
      }
      if (!games.length) list.append(node('p', 'muted', person.private ? 'Play history is not shared with this viewer.' : 'There is no shared play history yet.'));
      panel.append(list);
    } else if (kind === 'support') {
      let selected = clamp(element.getAttribute('amount'), 10, 1, 100000);
      const choices = node('div', 'amounts');
      const review = action('Review ' + selected + ' credits ↗', () => {
        const url = new URL('/pay/' + encodeURIComponent(person.username), SERVICE);
        url.search = new URLSearchParams({ amount: String(selected), note: element.getAttribute('note') || '' });
        window.open(url.href, '_blank', 'noopener,noreferrer');
      });
      for (const amount of [...new Set([5, 10, 25, 50, selected])].sort((a,b) => a-b)) {
        const button = node('button', '', amount + ''); button.type = 'button'; button.setAttribute('aria-pressed', String(amount === selected));
        button.addEventListener('click', () => {
          selected = amount; review.textContent = 'Review ' + selected + ' credits ↗';
          for (const option of choices.children) option.setAttribute('aria-pressed', String(option === button));
        }); choices.append(button);
      }
      review.disabled = example;
      panel.append(choices, review, node('p', 'muted', 'Nookara opens a separate confirmation before any credits move.'));
    }
    if (kind === 'support' || kind === 'library') { const wrap = node('div'); wrap.append(panel, signature(person)); return wrap; }
    return panel;
  }
  function linkPortrait(person, size) { const anchor = link('', memberUrl(person.username)); anchor.setAttribute('aria-label', 'Visit ' + person.username); anchor.append(portrait(person, size)); return anchor; }
  class MemberElement extends HTMLElement {
    static get observedAttributes() { return ['account', 'variant', 'theme', 'size', 'limit', 'amount', 'note', 'plan', 'example']; }
    constructor() {
      super(); this.attachShadow({ mode: 'open' }); this.revision = 0;
      this.styles = node('style'); this.styles.textContent = ELEMENT_STYLE;
      this.content = node('div'); this.content.setAttribute('aria-live', 'polite');
      this.shadowRoot.append(this.styles, this.content);
    }
    connectedCallback() { mounted.add(this); this.render(); }
    disconnectedCallback() { mounted.delete(this); this.revision++; }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    get kind() { return this.localName === 'velora-card' ? (this.getAttribute('variant') === 'compact' ? 'compact' : 'card') : this.localName.slice('velora-'.length); }
    async render() {
      const revision = ++this.revision;
      this.content.replaceChildren(node('p', 'loading', 'Opening Nookara…'));
      this.setAttribute('aria-busy', 'true');
      try {
        const result = await contents(this);
        if (revision !== this.revision || !this.isConnected) return;
        this.content.replaceChildren();
        if (this.hasAttribute('example')) this.content.append(node('p', 'example', 'Illustrative account'));
        this.content.append(result);
      } catch (error) {
        if (revision !== this.revision || !this.isConnected) return;
        const panel = node('div', 'error');
        const restricted = ['vpn_not_allowed', 'ip_banned'].includes(error.code);
        const message = error.status === 404 ? 'This account could not be located.' : restricted ? 'Account details are restricted on this connection.' : error.message || 'Nookara is temporarily out of reach.';
        panel.append(node('p', 'feedback', message));
        if (error.code === 'vpn_not_allowed') panel.append(action('Connect an existing account ↗', connect));
        else panel.append(action('Try loading again', () => { resources.clear(); return this.render(); }, true));
        this.content.replaceChildren(panel);
      } finally { if (revision === this.revision) this.setAttribute('aria-busy', 'false'); }
    }
  }
  for (const tag of ['card', 'portrait', 'name', 'presence', 'now', 'awards', 'library', 'support', 'shortcut', 'connect', 'members']) {
    if (!customElements.get('velora-' + tag)) customElements.define('velora-' + tag, class extends MemberElement {});
  }
  window.addEventListener('storage', event => {
    if (event.key === SESSION_KEY || (location.origin === SERVICE && event.key === 'velora_token')) { memorySession = undefined; resources.clear(); redraw(); }
  });
  setInterval(() => {
    if (document.hidden) return;
    for (const element of mounted) {
      if (!['card', 'compact', 'presence', 'now', 'library', 'awards'].includes(element.kind) || element.hasAttribute('example')) continue;
      const rect = element.getBoundingClientRect();
      if (rect.bottom >= 0 && rect.top <= innerHeight && rect.width) element.render();
    }
  }, 30000);
  window.VeloraKit = Object.freeze({ version: '2.0.2', viewer, connect, disconnect,
    refresh() { resources.clear(); redraw(); }, mount(root = document) { customElements.upgrade(root); },
  });
  window[RUNTIME] = window.VeloraKit;
  window.dispatchEvent(new CustomEvent('velora-kit:ready'));
})();
