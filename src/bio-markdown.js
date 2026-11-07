(function (root) {
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

if (typeof module === "object" && module.exports) module.exports = mdBio;
else root.VeloraBio = mdBio;
})(globalThis);
