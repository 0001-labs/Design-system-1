//#region src/markdown.ts
var e = /^ {0,3}(#{1,6})[ \t]+/, t = /^ *(?:([-*+])|(\d{1,9})[.)])[ \t]+(?:\[([ xX])\][ \t]+)?/, n = /^ {0,3}>[ \t]?/, r = /^ {0,3}(`{3,}|~{3,})/, i = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
function a(e, t) {
	let n = r.exec(e);
	return !!n && n[1][0] === t[0] && n[1].length >= t.length && !e.slice(n[0].length).trim();
}
function o(a) {
	return !!a.trim() && !r.test(a) && !i.test(a) && !e.test(a) && !t.test(a) && !n.test(a);
}
function s(s) {
	let c = s.replace(/\r\n?/g, "\n").split("\n"), l = [], u = 0;
	for (let e of c) l.push(u), u += e.length + 1;
	let d = [], f = (e, t, n, r = {}) => {
		d.push({
			kind: e,
			source: c.slice(t, n + 1).join("\n"),
			prefix: 0,
			...r,
			start: l[t]
		});
	}, p = 0;
	for (; p < c.length;) {
		let s = c[p];
		if (s.trim() === "$$") {
			let e = p + 1;
			for (; e < c.length && c[e].trim() !== "$$";) e++;
			f("equation", p, Math.min(e, c.length - 1), { prefix: s.length }), p = e + 1;
			continue;
		}
		if (p + 1 < c.length && s.includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(c[p + 1])) {
			let e = p + 1;
			for (; e + 1 < c.length && c[e + 1].trim() && c[e + 1].includes("|");) e++;
			f("table", p, e), p = e + 1;
			continue;
		}
		let l = r.exec(s);
		if (l) {
			let e = p + 1;
			for (; e < c.length && !a(c[e], l[1]);) e++;
			f("code", p, Math.min(e, c.length - 1), { prefix: s.length }), p = e + 1;
			continue;
		}
		if (!s.trim()) {
			p++;
			continue;
		}
		if (i.test(s)) {
			f("divider", p, p, { prefix: s.length }), p++;
			continue;
		}
		let u = e.exec(s);
		if (u) {
			f("heading", p, p, {
				level: u[1].length,
				prefix: u[0].length
			}), p++;
			continue;
		}
		let m = t.exec(s);
		if (m) {
			let e = /^ */.exec(s)[0].length, t = d[d.length - 1], n = 0;
			e && t?.kind === "bullet" ? n = e > (t.indent ?? 0) ? (t.depth ?? 0) + 1 : [...d].reverse().find((t) => t.kind === "bullet" && (t.indent ?? 0) <= e)?.depth ?? 1 : e && (n = Math.floor(e / (m[2] ? 3 : 2))), f("bullet", p, p, {
				prefix: m[0].length,
				indent: e,
				depth: n,
				checked: m[3] === void 0 ? void 0 : m[3] !== " ",
				number: m[2] ? Number(m[2]) : void 0
			}), p++;
			continue;
		}
		if (n.test(s)) {
			let e = p;
			for (; e + 1 < c.length && n.test(c[e + 1]);) e++;
			let t = /^>\s*\[!([a-z]+)\](-)?\s*/i.exec(s), r = t ? /^(#{1,6})\s+/.exec(s.slice(t[0].length)) : null;
			f(t ? "callout" : "quote", p, e, t ? {
				level: r?.[1].length,
				prefix: t[0].length + (r?.[0].length ?? 0),
				callout: t[1].toLowerCase(),
				folded: !!t[2]
			} : { prefix: n.exec(s)[0].length }), p = e + 1;
			continue;
		}
		let h = p;
		for (; h + 1 < c.length && o(c[h + 1]);) h++;
		f("paragraph", p, h), p = h + 1;
	}
	d.length || d.push({
		kind: "paragraph",
		source: "",
		prefix: 0,
		start: 0
	});
	let m = /^\n+/.exec(s)?.[0] ?? "", h = s.length > m.length ? /\n+$/.exec(s)?.[0] ?? "" : "", g = d[0], _ = d[d.length - 1];
	return m && g.kind === "paragraph" && (g.source = m + g.source, g.start = 0), h && _.kind === "paragraph" && (_.source += h), d;
}
function c(e) {
	let t = "";
	return e.forEach((n, r) => {
		r && (t += e[r - 1].kind === "bullet" && n.kind === "bullet" ? "\n" : "\n\n"), t += n.source;
	}), t;
}
function l(e) {
	let t = e.source.split("\n");
	return t.length > 1 && a(t[t.length - 1], r.exec(t[0])[1]);
}
function u(e, t) {
	if (e.kind !== "code" || !l(e)) return;
	let n = e.source.slice(0, e.prefix).replace(/^ {0,3}(`{3,}|~{3,})/, "").trim().toLowerCase();
	return n ? t.find((e) => e.fence?.toLowerCase() === n) : void 0;
}
function d(e, t, n) {
	let r = new RegExp(t.source, t.flags.replace(/[gy]/g, "") + "y");
	return {
		name: e,
		match(e, t) {
			r.lastIndex = t;
			let i = r.exec(e);
			return i && i[0].length && (!n || n(i)) ? i[0].length : 0;
		}
	};
}
var f = d("image", /!\[[^\]\n]*\]\([^\s()]+\)/), p = d("equation", /\$(?!\$)(?:\\.|[^$\n])+\$/), m = [f, p], h = [
	"**",
	"__",
	"~~",
	"==",
	"*",
	"_"
], g = {
	"**": "bold",
	__: "bold",
	"~~": "strike",
	"==": "highlight",
	"*": "italic",
	_: "italic"
}, _ = /^\[([^[\]]*)\]\(([^\s()]*)\)/, v = /(?:https?:\/\/|www\.)[^\s<>()]*[^\s<>().,;:!?'"]/g, y = (e) => !!e && /[\p{L}\p{N}]/u.test(e), b = (e) => !e || /\s/.test(e);
function x(e, t, n, r) {
	let i = 0;
	for (; t + i < r && e[t + i] === n;) i++;
	return i;
}
function S(e, t, n, r) {
	let i = x(e, t, n[0], r);
	return !(i < n.length || t + i >= r || b(e[t + i]) || n[0] === "_" && y(e[t - 1]));
}
function C(e, t, n, r) {
	for (let i = t; i < n; i++) {
		if (e[i] !== r[0]) continue;
		let a = x(e, i, r[0], n), o = r.length === 1 ? i : i + a - r.length;
		if (a >= r.length && !b(e[i - 1]) && o > t && !(r[0] === "_" && y(e[i + a]))) return o;
		i += a - 1;
	}
	return -1;
}
function w(e, t, n, r, i, a) {
	if (n <= t) return;
	if (i.href || i.code) {
		a.push({
			kind: "text",
			from: r + t,
			to: r + n,
			...i
		});
		return;
	}
	let o = e.slice(t, n), s = 0;
	for (let e of o.matchAll(v)) {
		let n = e.index;
		n > s && a.push({
			kind: "text",
			from: r + t + s,
			to: r + t + n,
			...i
		});
		let o = e[0];
		a.push({
			kind: "text",
			from: r + t + n,
			to: r + t + n + o.length,
			...i,
			href: o.startsWith("www.") ? `https://${o}` : o
		}), s = n + o.length;
	}
	s < o.length && a.push({
		kind: "text",
		from: r + t + s,
		to: r + n,
		...i
	});
}
function T(e, t, n, r, i, a, o) {
	let s = t, c = t, l = (t) => w(e, c, t, r, i, a);
	for (; s < n;) {
		let t = e[s];
		if (t === "`" && !i.code) {
			let t = 1;
			for (; e[s + t] === "`";) t++;
			let o = "`".repeat(t), u = e.indexOf(o, s + t);
			for (; u >= 0 && u + t < n && e[u + t] === "`";) {
				let t = u;
				for (; e[t] === "`";) t++;
				u = e.indexOf(o, t);
			}
			if (u >= 0 && u + t <= n) {
				l(s);
				let e = [r + s, r + u + t];
				a.push({
					kind: "syntax",
					from: r + s,
					to: r + s + t,
					group: e
				}), u > s + t && a.push({
					kind: "text",
					from: r + s + t,
					to: r + u,
					...i,
					code: !0
				}), a.push({
					kind: "syntax",
					from: r + u,
					to: r + u + t,
					group: e
				}), s = u + t, c = s;
				continue;
			}
		}
		if (!i.href && !i.code && o.length) {
			let t = 0, i = "";
			for (let r of o) {
				if (t = r.match(e, s), t && s + t <= n) {
					i = r.name;
					break;
				}
				t = 0;
			}
			if (t) {
				l(s), a.push({
					kind: "atom",
					atom: i,
					from: r + s,
					to: r + s + t,
					...i === "equation" ? { group: [r + s, r + s + t] } : {}
				}), s += t, c = s;
				continue;
			}
		}
		if (t === "[" && !i.href && !i.code) {
			let t = _.exec(e.slice(s, n));
			if (t) {
				l(s);
				let n = [r + s, r + s + t[0].length];
				a.push({
					kind: "syntax",
					from: r + s,
					to: r + s + 1,
					group: n
				}), T(e, s + 1, s + 1 + t[1].length, r, {
					...i,
					href: t[2]
				}, a, o), a.push({
					kind: "syntax",
					from: r + s + 1 + t[1].length,
					to: r + s + t[0].length,
					group: n
				}), s += t[0].length, c = s;
				continue;
			}
		}
		let u = !1;
		if (!i.code) for (let t of h) {
			if (!e.startsWith(t, s) || i[g[t]] || !S(e, s, t, n)) continue;
			let d = C(e, s + t.length, n, t);
			if (d < 0) continue;
			l(s);
			let f = [r + s, r + d + t.length];
			a.push({
				kind: "syntax",
				from: r + s,
				to: r + s + t.length,
				group: f
			}), T(e, s + t.length, d, r, {
				...i,
				[g[t]]: !0
			}, a, o), a.push({
				kind: "syntax",
				from: r + d,
				to: r + d + t.length,
				group: f
			}), s = d + t.length, c = s, u = !0;
			break;
		}
		u || s++;
	}
	l(n);
}
function E(e, t = m) {
	let r = [], i = e.source.split("\n"), a = e.kind === "code" && l(e);
	if (e.kind === "equation") return [{
		kind: "atom",
		atom: "equation-block",
		from: 0,
		to: e.source.length,
		group: [0, e.source.length]
	}];
	let o = u(e, t);
	if (o) return [{
		kind: "atom",
		atom: o.name,
		from: 0,
		to: e.source.length,
		group: [0, e.source.length]
	}];
	let s = 0;
	return i.forEach((o, c) => {
		if (c && r.push({
			kind: "break",
			from: s - 1,
			to: s
		}), e.kind === "code") c === 0 || a && c === i.length - 1 ? r.push({
			kind: "syntax",
			from: s,
			to: s + o.length,
			prefix: !0
		}) : o && r.push({
			kind: "text",
			from: s,
			to: s + o.length,
			code: !0
		});
		else if (e.kind === "divider") r.push({
			kind: "syntax",
			from: s,
			to: s + o.length,
			prefix: !0
		});
		else {
			let i = 0;
			c === 0 && (e.kind === "heading" || e.kind === "bullet") ? i = e.prefix : (e.kind === "quote" || e.kind === "callout") && (i = c === 0 && e.kind === "callout" ? e.prefix : n.exec(o)?.[0].length ?? 0), i && r.push({
				kind: "syntax",
				from: s,
				to: s + i,
				prefix: !0
			}), T(o, i, o.length, s, {}, r, t);
		}
		s += o.length + 1;
	}), r;
}
//#endregion
//#region src/document.ts
function D(e) {
	return s(e.replace(/\r\n?/g, "\n").replace(/^\n+|\n+$/g, "")).map(({ start: e, ...t }) => t);
}
var O = {
	kind: "paragraph",
	source: "",
	prefix: 0
};
function k(e) {
	return e.trim() ? D(e) : [O];
}
var A = c;
function j(e, t) {
	return e.block - t.block || e.offset - t.offset;
}
function M(e, t) {
	return j(e, t) <= 0 ? [e, t] : [t, e];
}
function N(e, t, n, r) {
	let [i, a] = M(t, n), o = e[i.block].source.slice(0, i.offset), c = e[a.block].source.slice(a.offset), l = o + r + c, u = o.length + r.length, d = s(l), f = d.map(({ start: e, ...t }) => t), p = [
		...e.slice(0, i.block),
		...f,
		...e.slice(a.block + 1)
	], m = {
		block: i.block + d.length - 1,
		offset: f[f.length - 1].source.length
	};
	for (let e = 0; e < d.length; e++) {
		let t = d[e];
		if (u < t.start) {
			m = {
				block: i.block + e,
				offset: 0
			};
			break;
		}
		if (u <= t.start + t.source.length) {
			m = {
				block: i.block + e,
				offset: u - t.start
			};
			break;
		}
	}
	return {
		blocks: p,
		caret: m
	};
}
function ee(e, t, n) {
	let [r, i] = M(t, n);
	return r.block === i.block ? e[r.block].source.slice(r.offset, i.offset) : c([
		{
			...e[r.block],
			source: e[r.block].source.slice(r.offset)
		},
		...e.slice(r.block + 1, i.block),
		{
			...e[i.block],
			source: e[i.block].source.slice(0, i.offset)
		}
	]);
}
function P(e) {
	let t = e.source.slice(0, e.prefix), n = e.checked === void 0 ? "" : "[ ] ";
	return e.number === void 0 ? t.replace(/\[[ xX]\][ \t]+$/, "") + n : t.replace(/\d+/, String(e.number + 1)).replace(/\[[ xX]\][ \t]+$/, "") + n;
}
function te(e, t) {
	let r = e[t.block], i = r.source, a = i.slice(0, t.offset), o = i.slice(t.offset);
	if (r.kind === "code") {
		if (!(t.offset === i.length && l(r))) return N(e, t, t, "\n");
	} else if (r.kind === "bullet") {
		if (!i.slice(r.prefix).trim()) return r.depth ? V(e, {
			anchor: t.block,
			focus: t.block
		}, -1) : N(e, {
			block: t.block,
			offset: 0
		}, {
			block: t.block,
			offset: i.length
		}, "");
		o = P(r) + o;
	} else if (r.kind === "quote") {
		let r = i.lastIndexOf("\n", t.offset - 1) + 1;
		if (!i.slice(r, t.offset).replace(n, "").trim() && !o.trim()) a = i.slice(0, Math.max(0, r - 1)), o = "";
		else return N(e, t, t, "\n> ");
	}
	let s = k(a), c = k(o), u = [
		...e.slice(0, t.block),
		...s,
		...c,
		...e.slice(t.block + 1)
	], d = c[0], f = d.kind === "bullet" || d.kind === "quote" ? d.prefix : 0;
	return {
		blocks: u,
		caret: {
			block: t.block + s.length,
			offset: f
		}
	};
}
function ne(e, t) {
	let n = e[t];
	return !n.prefix || n.kind === "code" || n.kind === "divider" ? null : N(e, {
		block: t,
		offset: 0
	}, {
		block: t,
		offset: n.prefix
	}, "");
}
function re(e, t) {
	if (t === 0) return null;
	let n = e[t - 1], r = {
		block: t - 1,
		offset: n.source.length
	};
	return n.kind === "divider" ? N(e, {
		block: t - 1,
		offset: 0
	}, {
		block: t,
		offset: 0
	}, "") : n.kind === "code" && e[t].source ? {
		blocks: [...e],
		caret: r
	} : N(e, r, {
		block: t,
		offset: 0
	}, "");
}
function ie(e, t) {
	if (t + 1 >= e.length) return null;
	let n = e[t + 1];
	if (n.kind === "divider") return N(e, {
		block: t,
		offset: e[t].source.length
	}, {
		block: t + 1,
		offset: n.source.length
	}, "");
	let r = re(e, t + 1);
	return r && {
		...r,
		caret: {
			block: t,
			offset: e[t].source.length
		}
	};
}
function F(e, t, n, r, i = r) {
	let [a, o] = M(t, n);
	if (a.block !== o.block) {
		let t = [...e], n = a, s = o;
		for (let c = o.block; c >= a.block; c--) {
			let l = c === a.block ? Math.max(a.offset, e[c].prefix) : e[c].prefix, u = c === o.block ? o.offset : e[c].source.length, d = e[c].source;
			if (c === a.block && d.slice(l - r.length, l) === r && d.endsWith(i) && (u -= i.length), c === o.block && d.slice(u, u + i.length) === i && d.slice(l, l + r.length) === r && (l += r.length), u <= l || e[c].kind === "code" || e[c].kind === "divider") continue;
			let f = F(t, {
				block: c,
				offset: l
			}, {
				block: c,
				offset: u
			}, r, i);
			t = f.blocks, c === a.block && (n = f.anchor), c === o.block && (s = f.focus);
		}
		return {
			blocks: t,
			anchor: n,
			focus: s
		};
	}
	let s = e[a.block].source, c = s.slice(a.offset, o.offset), l = r.length, u = i.length, d = (e) => ({
		block: a.block,
		offset: e
	});
	return s.slice(a.offset - l, a.offset) === r && s.slice(o.offset, o.offset + u) === i ? {
		blocks: N(e, d(a.offset - l), d(o.offset + u), c).blocks,
		anchor: d(a.offset - l),
		focus: d(o.offset - l)
	} : c.length > l + u && c.startsWith(r) && c.endsWith(i) ? {
		blocks: N(e, a, o, c.slice(l, c.length - u)).blocks,
		anchor: a,
		focus: d(o.offset - l - u)
	} : {
		blocks: N(e, a, o, r + c + i).blocks,
		anchor: d(a.offset + l),
		focus: d(a.offset + l + c.length)
	};
}
function I(e, t) {
	let n = e[t];
	if (n.kind !== "bullet" || n.checked === void 0) return null;
	let r = n.source.indexOf("[") + 1;
	return N(e, {
		block: t,
		offset: r
	}, {
		block: t,
		offset: r + 1
	}, n.checked ? " " : "x");
}
function L(e, t, n = t) {
	let r = (t) => Math.max(0, Math.min(e.length - 1, t));
	return {
		anchor: r(t),
		focus: r(n)
	};
}
function R(e, t, r) {
	let i = Math.min(t.anchor, t.focus), a = Math.max(t.anchor, t.focus), o = e.flatMap((e, t) => {
		if (t < i || t > a) return [e];
		let o = e.source.slice(e.prefix);
		if (e.kind === "code") {
			let t = e.source.split("\n").slice(1);
			l(e) && t.pop(), o = t.join("\n");
		} else e.kind === "quote" || e.kind === "callout" ? o = e.source.split("\n").map((t, r) => r === 0 ? t.slice(e.prefix) : t.replace(n, "")).join("\n") : e.kind === "divider" && (o = "");
		let c = {
			paragraph: "",
			h1: "# ",
			h2: "## ",
			h3: "### ",
			todo: "- [ ] ",
			bullet: "- ",
			numbered: `${t - i + 1}. `,
			quote: "> ",
			code: "",
			divider: "",
			callout: "> [!note] ",
			toggle: "> [!note]- ",
			"toggle-h1": "> [!note]- # ",
			"toggle-h2": "> [!note]- ## ",
			"toggle-h3": "> [!note]- ### ",
			table: "",
			equation: ""
		}[r], u = "`".repeat(Math.max(3, ...Array.from(o.matchAll(/`+/g), (e) => e[0].length + 1)));
		return s(r === "code" ? `${u}\n${o}\n${u}` : r === "divider" ? "---" : r === "equation" ? `$$\n${o}\n$$` : r === "table" ? "| Column 1 | Column 2 |\n| --- | --- |\n|  |  |" : r === "callout" || r.startsWith("toggle") ? c + o.split("\n").join("\n> ") : o.split("\n").map((e) => c + e).join("\n")).map(({ start: e, ...t }) => t);
	});
	return {
		blocks: o,
		caret: {
			block: i,
			offset: o[i].prefix
		}
	};
}
function z(e, t) {
	let n = Math.min(t.anchor, t.focus), r = Math.max(t.anchor, t.focus), i = [...e.slice(0, n), ...e.slice(r + 1)];
	i.length || i.push({ ...O });
	let a = Math.min(n, i.length - 1);
	return {
		blocks: i,
		caret: {
			block: a,
			offset: i[a].prefix
		}
	};
}
function B(e, t) {
	let n = Math.min(t.anchor, t.focus), r = Math.max(t.anchor, t.focus), i = e.slice(n, r + 1).map((e) => ({ ...e }));
	return {
		blocks: [
			...e.slice(0, r + 1),
			...i,
			...e.slice(r + 1)
		],
		caret: {
			block: r + 1,
			offset: i[0].prefix
		}
	};
}
function ae(e, t, n) {
	let r = Math.min(t.anchor, t.focus), i = Math.max(t.anchor, t.focus);
	if (n < 0 ? r === 0 : i === e.length - 1) return null;
	let a = [...e], o = a.splice(r, i - r + 1);
	return a.splice(r + n, 0, ...o), {
		blocks: a,
		caret: {
			block: r + n,
			offset: o[0].prefix
		}
	};
}
function oe(e) {
	let t = /* @__PURE__ */ new Map();
	return e.map((e) => {
		if (e.kind !== "bullet") return t.clear(), e;
		let n = e.indent ?? 0;
		for (let e of t.keys()) e > n && t.delete(e);
		if (e.number === void 0) return t.delete(n), e;
		let r = t.has(n) ? t.get(n) + 1 : e.number;
		if (t.set(n, r), r === e.number) return e;
		let i = e.source.replace(/^( *)(\d+)/, `$1${r}`);
		return {
			...e,
			source: i,
			number: r,
			prefix: e.prefix + String(r).length - String(e.number).length
		};
	});
}
function V(e, t, n) {
	let r = Math.min(t.anchor, t.focus), i = Math.max(t.anchor, t.focus), a = e[r];
	if (a.kind !== "bullet" || n === 1 && (r === 0 || e[r - 1].kind !== "bullet") || n === -1 && !(a.indent ?? 0)) return null;
	let o = e[r - 1], s = o?.indent ?? 0, c = n === 1 ? Math.max(0, s + (o.number === void 0 ? 2 : 3) - (a.indent ?? 0)) : -Math.min(a.indent ?? 0, a.number === void 0 ? 2 : 3);
	if (!c) return null;
	let l = e.map((e, t) => {
		if (t < r || t > i || e.kind !== "bullet") return e;
		let a = c > 0 ? " ".repeat(c) + e.source : e.source.slice(Math.min(-c, e.indent ?? 0));
		return {
			...e,
			source: a,
			prefix: e.prefix + a.length - e.source.length,
			indent: Math.max(0, (e.indent ?? 0) + c),
			depth: Math.max(0, (e.depth ?? 0) + n)
		};
	});
	return {
		blocks: oe(l),
		caret: {
			block: r,
			offset: l[r].prefix
		}
	};
}
function H(e, t, n) {
	let r = e[t];
	if (r.kind !== "callout") return null;
	let i = n === void 0 ? !r.folded : !n, a = r.source.replace(/^(>\s*\[![a-z]+\])-?/i, `$1${i ? "-" : ""}`), o = [...e];
	return o[t] = {
		...r,
		source: a,
		folded: i,
		prefix: r.prefix + a.length - r.source.length
	}, {
		blocks: o,
		caret: {
			block: t,
			offset: o[t].prefix
		}
	};
}
//#endregion
//#region src/history.ts
var se = class {
	past = [];
	future = [];
	lastKind = null;
	lastTime = 0;
	lastBlock = -1;
	constructor(e) {
		this.past.push(e);
	}
	get current() {
		return this.past[this.past.length - 1];
	}
	reset(e) {
		this.past = [e], this.future = [], this.lastKind = null;
	}
	record(e, t, n = Date.now()) {
		t !== "edit" && t === this.lastKind && n - this.lastTime < 700 && e.focus.block === this.lastBlock && !(t === "type" && ce(e)) ? this.past[this.past.length - 1] = e : this.past.push(e), this.future = [], this.lastKind = t, this.lastTime = n, this.lastBlock = e.focus.block;
	}
	undo() {
		if (this.past.length < 2) return null;
		let e = this.past.pop();
		this.future.push(e), this.lastKind = null;
		let t = le(this.current.blocks, e.blocks);
		return t ? {
			...this.current,
			anchor: t,
			focus: t
		} : this.current;
	}
	redo() {
		let e = this.future.pop();
		return e ? (this.past.push(e), this.lastKind = null, e) : null;
	}
}, ce = ({ blocks: e, focus: t }) => {
	let n = e[t.block]?.source ?? "";
	return /\s/.test(n[t.offset - 1] ?? "") && /\S/.test(n[t.offset - 2] ?? "");
}, U = (e, t) => e === t || e.kind === t.kind && e.source === t.source;
function le(e, t) {
	let n = 0;
	for (; n < e.length && n < t.length && U(e[n], t[n]);) n++;
	if (n === e.length && n === t.length) return null;
	let r = e.length, i = t.length;
	for (; r > n && i > n && U(e[r - 1], t[i - 1]);) r--, i--;
	if (r === n) return n > 0 ? {
		block: n - 1,
		offset: e[n - 1].source.length
	} : {
		block: 0,
		offset: 0
	};
	let a = e[r - 1].source;
	if (i === n) return {
		block: r - 1,
		offset: a.length
	};
	let o = t[i - 1].source, s = 0;
	if (r - 1 === n && i - 1 === n) for (; s < a.length && s < o.length && a[s] === o[s];) s++;
	let c = 0, l = Math.min(a.length, o.length) - s;
	for (; c < l && a[a.length - 1 - c] === o[o.length - 1 - c];) c++;
	return {
		block: r - 1,
		offset: a.length - c
	};
}
//#endregion
//#region src/table.ts
function W(e) {
	let t = 0;
	return e.split("\n").flatMap((e, n) => {
		let r = t;
		if (t += e.length + 1, n === 1) return [];
		let i = [-1], a = !1;
		for (let t = 0; t < e.length; t++) {
			if (e[t] === "\\") {
				t++;
				continue;
			}
			e[t] === "`" && (a = !a), e[t] === "|" && !a && i.push(t);
		}
		i.push(e.length);
		let o = [];
		for (let t = 1; t < i.length; t++) {
			let n = i[t - 1] + 1, a = i[t];
			if ((t === 1 || t === i.length - 1) && !e.slice(n, a).trim()) continue;
			let s = e.slice(n, a), c = n + (s.match(/^\s*/)?.[0].length ?? 0), l = Math.max(c, a - (s.match(/\s*$/)?.[0].length ?? 0));
			o.push({
				text: e.slice(c, l),
				from: r + c,
				to: r + l
			});
		}
		return [o];
	});
}
function ue(e) {
	return (e.split("\n")[1] ?? "").replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((e) => {
		let t = e.trim(), n = t.startsWith(":"), r = t.endsWith(":");
		return n && r ? "center" : r ? "end" : n ? "start" : null;
	});
}
var G = {
	start: ":---",
	center: ":---:",
	end: "---:"
};
function de(e, t = []) {
	let n = Math.max(1, ...e.map((e) => e.length)), r = (e) => `| ${Array.from({ length: n }, (t, n) => (e[n] ?? "").replace(/\r?\n/g, " ").replace(/(?<!\\)\|/g, "\\|")).join(" | ")} |`, i = `| ${Array.from({ length: n }, (e, n) => G[t[n] ?? ""] ?? "---").join(" | ")} |`;
	return [
		r(e[0] ?? [""]),
		i,
		...e.slice(1).map(r)
	].join("\n");
}
function fe(e) {
	return e.includes("	") ? de(e.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n").map((e) => e.split("	"))) : null;
}
function pe(e, t, n, r) {
	let i = W(e.source).map((e) => e.map((e) => e.text)), a = ue(e.source), o = Math.max(1, ...i.map((e) => e.length));
	return i.forEach((e) => {
		for (; e.length < o;) e.push("");
	}), t === "add-row" && i.splice(n + 1, 0, Array(o).fill("")), t === "delete-row" && n > 0 && i.length > 1 && i.splice(n, 1), t === "add-column" && (i.forEach((e) => e.splice(r + 1, 0, "")), a.splice(r + 1, 0, null)), t === "delete-column" && o > 1 && (i.forEach((e) => e.splice(r, 1)), a.splice(r, 1)), de(i, a);
}
//#endregion
//#region src/icons.ts
var me = {
	"./icons/check.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.68649 11.884L12.443 6.13601L11.736 5.42715L6.68835 10.4827L4.26399 8.0501L3.55696 8.74525L6.68649 11.884Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/note.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.9653 3.31348V12.6865H2.03467V3.31348H13.9653ZM3.03467 11.6865H12.9653V4.31348H3.03467V11.6865Z\" fill=\"#1E1E1E\"/>\n<path d=\"M8.00641 7.08004V7.99996H3.71344V7.08004H8.00641ZM9.9527 5.08004V5.99996H3.71344V5.08004H9.9527Z\" fill=\"#1E1E1E\"/>\n</svg>\n",
	"./icons/bold.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M5 3.5H8.75A2.25 2.25 0 0 1 8.75 8H5M5 8H9.25A2.25 2.25 0 0 1 9.25 12.5H5M5 3.5V12.5\" stroke=\"currentColor\" stroke-width=\"1.5\"/>\n</svg>\n",
	"./icons/bullet.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"4\" cy=\"5.5\" r=\"1.15\" fill=\"currentColor\"/>\n<circle cx=\"4\" cy=\"10.5\" r=\"1.15\" fill=\"currentColor\"/>\n<path d=\"M7 5H13V6H7ZM7 10H13V11H7Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/callout.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3.5H13.5V12.5H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<circle cx=\"5.5\" cy=\"8\" r=\"1.2\" fill=\"currentColor\"/>\n<path d=\"M8 6H11.5V7H8ZM8 9H11.5V10H8Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/close.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.1215 4.58087L8.70453 7.99397L12.1176 11.4169L11.4106 12.112L7.99847 8.69108L4.58636 12.112L3.87836 11.4031L7.29535 7.99005L3.88226 4.56716L4.58929 3.87201L8.0014 7.29294L11.4145 3.87201L12.1215 4.58087Z\" fill=\"#1E1E1E\"/>\n</svg>\n",
	"./icons/code-block.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3H13.5V13H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M6.5 6L4.5 8L6.5 10M9.5 6L11.5 8L9.5 10\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/code.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.5 4.5L3 8L6.5 11.5M9.5 4.5L13 8L9.5 11.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/comment.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5H13V10.5H8L5.5 12.75V10.5H3Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/delete.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\">\n<g id=\"Icons\">\n<g id=\"Delete\">\n<g id=\"Vector\">\n<path d=\"M7.0972 3.47745L13.9422 3.48149L13.9424 12.7615L7.09744 12.7655L2.31717 8.121L7.0972 3.47745ZM3.75174 8.12003L7.43924 11.7021H12.9422V4.51944H7.45877L3.75174 8.12003Z\" fill=\"currentColor\" />\n<path d=\"M8.16022 10.2823L7.45988 9.58199L8.92933 8.11177L7.45877 6.64608L8.16207 5.94278L9.63109 7.41184L11.1002 5.94278L11.8005 6.64312L10.3309 8.11372L11.8009 9.58047L11.0982 10.2827L9.62915 8.81366L8.16022 10.2823Z\" fill=\"currentColor\" />\n</g>\n</g>\n</g>\n</svg>\n",
	"./icons/divider.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 4H9V5H3ZM2 7.5H14V8.5H2ZM3 11H9V12H3Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/down.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\">\n  <path d=\"M7.49645 12.5178V2.86102e-06H8.50702L8.50841 12.5174L11.4156 9.61018L12.1095 10.317L8.00173 14.4248L3.8905 10.3135L4.59784 9.60619L7.49645 12.5178Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/duplicate.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\">\n<g id=\"Icons\">\n<g id=\"Duplicate\">\n<path id=\"âD\" d=\"M2.41924 3.49777C2.08493 3.49777 1.78024 3.57818 1.50517 3.73898C1.23434 3.90402 1.0164 4.12196 0.851364 4.39279C0.690557 4.66786 0.610153 4.97254 0.610153 5.30685C0.610153 5.63693 0.690557 5.93739 0.851364 6.20822C1.0164 6.47905 1.23434 6.69276 1.50517 6.84933C1.78024 7.01014 2.08493 7.09055 2.41924 7.09055H7.82109C8.15117 7.09055 8.45374 7.01014 8.72881 6.84933C9.00387 6.69276 9.22181 6.47905 9.38261 6.20822C9.54342 5.93739 9.62383 5.63693 9.62383 5.30685C9.62383 4.97254 9.54342 4.66786 9.38261 4.39279C9.22181 4.12196 9.00387 3.90402 8.72881 3.73898C8.45374 3.57818 8.15117 3.49777 7.82109 3.49777C7.49101 3.49777 7.18844 3.57818 6.91338 3.73898C6.64254 3.90402 6.42461 4.12196 6.25957 4.39279C6.09876 4.66786 6.01836 4.97254 6.01836 5.30685V10.677C6.01836 11.007 6.09876 11.3096 6.25957 11.5847C6.42461 11.8598 6.64254 12.0777 6.91338 12.2385C7.18844 12.4035 7.49101 12.4861 7.82109 12.4861C8.15117 12.4861 8.45374 12.4035 8.72881 12.2385C9.00387 12.0777 9.22181 11.8598 9.38261 11.5847C9.54342 11.3096 9.62383 11.007 9.62383 10.677C9.62383 10.3427 9.54342 10.0401 9.38261 9.76926C9.22181 9.49842 9.00387 9.2826 8.72881 9.1218C8.45374 8.96522 8.15117 8.88693 7.82109 8.88693H3.7205C3.58086 8.88693 3.46237 8.9356 3.36504 9.03293C3.26771 9.13026 3.21904 9.24663 3.21904 9.38205C3.21904 9.5217 3.26771 9.64019 3.36504 9.73752C3.46237 9.83485 3.58086 9.88351 3.7205 9.88351H7.80205C8.02633 9.88351 8.21676 9.95969 8.37334 10.112C8.52991 10.2686 8.6082 10.4569 8.6082 10.677C8.6082 10.897 8.52991 11.0832 8.37334 11.2356C8.22099 11.3921 8.03691 11.4704 7.82109 11.4704C7.60527 11.4704 7.41907 11.3921 7.2625 11.2356C7.10592 11.079 7.02763 10.8864 7.02763 10.6579V5.31955C7.02763 5.09527 7.10592 4.90484 7.2625 4.74826C7.41907 4.59168 7.60527 4.5134 7.82109 4.5134C8.03691 4.5134 8.22099 4.58957 8.37334 4.74191C8.52991 4.89849 8.6082 5.0868 8.6082 5.30685C8.6082 5.52691 8.52991 5.71522 8.37334 5.8718C8.21676 6.02837 8.02633 6.10666 7.80205 6.10666H2.43828C2.21399 6.10666 2.02145 6.02837 1.86064 5.8718C1.70407 5.71522 1.62578 5.52691 1.62578 5.30685C1.62578 5.0868 1.70195 4.89849 1.85429 4.74191C2.01087 4.58957 2.19918 4.5134 2.41924 4.5134C2.63082 4.5134 2.81491 4.59168 2.97148 4.74826C3.12806 4.90907 3.20634 5.0995 3.20634 5.31955V10.6579C3.20634 10.8864 3.12806 11.079 2.97148 11.2356C2.81491 11.3921 2.63082 11.4704 2.41924 11.4704C2.19918 11.4704 2.01087 11.3921 1.85429 11.2356C1.70195 11.0832 1.62578 10.897 1.62578 10.677C1.62578 10.4569 1.70407 10.2686 1.86064 10.112C2.02145 9.95969 2.21399 9.88351 2.43828 9.88351H3.7205C3.85169 9.88351 3.96595 9.83485 4.06328 9.73752C4.16061 9.64019 4.20927 9.5217 4.20927 9.38205C4.20927 9.24663 4.16061 9.13026 4.06328 9.03293C3.96595 8.9356 3.85169 8.88693 3.7205 8.88693H2.41924C2.08493 8.88693 1.78024 8.96522 1.50517 9.1218C1.23434 9.2826 1.0164 9.49842 0.851364 9.76926C0.690557 10.0401 0.610153 10.3427 0.610153 10.677C0.610153 11.007 0.690557 11.3096 0.851364 11.5847C1.0164 11.8598 1.23434 12.0777 1.50517 12.2385C1.78024 12.4035 2.08493 12.4861 2.41924 12.4861C2.74931 12.4861 3.04977 12.4035 3.3206 12.2385C3.59567 12.0777 3.8136 11.8598 3.97441 11.5847C4.13945 11.3096 4.22197 11.007 4.22197 10.677V5.30685C4.22197 4.97254 4.13945 4.66786 3.97441 4.39279C3.8136 4.12196 3.59567 3.90402 3.3206 3.73898C3.04977 3.57818 2.74931 3.49777 2.41924 3.49777Z\" fill=\"currentColor\" />\n<path id=\"âD_2\" d=\"M10.4239 3.37692V12.6069H12.6079C14.4409 12.6069 15.3899 11.4759 15.3899 9.23992V6.89992C15.3899 4.57292 14.4279 3.37692 12.5819 3.37692H10.4239ZM12.4909 4.44292C13.4919 4.44292 13.9469 5.22292 13.9469 6.75692V9.27892C13.9469 10.8389 13.5049 11.5409 12.4909 11.5409H11.8149V4.44292H12.4909Z\" fill=\"currentColor\" />\n</g>\n</g>\n</svg>\n",
	"./icons/equation.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 9.5L4.75 12.5L7.5 3.5H13.5M9.25 6.5L12.25 11M12.25 6.5L9.25 11\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/h1.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5V12.5M7 3.5V12.5M3 8H7M9.75 7L11.75 5.25V12.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/h2.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5V12.5M7 3.5V12.5M3 8H7M9.5 7.1A1.85 1.85 0 1 1 12.75 8.3L9.5 12.5H13.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/h3.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5V12.5M7 3.5V12.5M3 8H7M9.5 5.25H13.25L10.75 8.25H11.25A2.1 2.1 0 1 1 9.5 11.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/handle.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"5.5\" cy=\"4\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"5.5\" cy=\"8\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"5.5\" cy=\"12\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"10.5\" cy=\"4\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"10.5\" cy=\"8\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"10.5\" cy=\"12\" r=\"1.1\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/image.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3H13.5V13H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M2.5 11.5L6.5 7.5L9 10L10.5 8.5L13.5 11.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<circle cx=\"10.5\" cy=\"5.75\" r=\"1.1\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/indent.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5H13V4.5H3ZM8 7.5H13V8.5H8ZM3 11.5H13V12.5H3Z\" fill=\"currentColor\"/>\n<path d=\"M3 6L5.75 8L3 10Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/italic.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.5 3.5H11M5 12.5H9.5M8.75 3.5L7.25 12.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/link.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.25 4.75L9.5 3.5A2.12 2.12 0 0 1 12.5 6.5L11.25 7.75M7.75 11.25L6.5 12.5A2.12 2.12 0 0 1 3.5 9.5L4.75 8.25M6 10L10 6\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/mention.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"8\" cy=\"8\" r=\"2.4\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M10.4 8V9.4A1.3 1.3 0 0 0 13 9.4V8A5 5 0 1 0 11 12\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/numbered.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 4.5L3.9 3.25V7M2.6 9.75A1.3 1.3 0 1 1 4.9 10.6L2.6 12.9H5.3\" stroke=\"currentColor\" stroke-width=\"1\"/>\n<path d=\"M7 4.5H13V5.5H7ZM7 10.5H13V11.5H7Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/outdent.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5H13V4.5H3ZM8 7.5H13V8.5H8ZM3 11.5H13V12.5H3Z\" fill=\"currentColor\"/>\n<path d=\"M5.75 6L3 8L5.75 10Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/plus.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.50235 2.6739L8.4996 7.5035L13.3334 7.51044L13.325 8.50193L8.49328 8.49569L8.49951 13.3274L7.49764 13.3268L7.50039 8.49717L2.66663 8.49024L2.67503 7.49875L7.50672 7.50499L7.50117 2.67261L8.50235 2.6739Z\" fill=\"#1E1E1E\"/>\n</svg>\n",
	"./icons/quote.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5H4V12.5H3ZM6.5 5H13V6H6.5ZM6.5 7.5H13V8.5H6.5ZM6.5 10H11V11H6.5Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/search.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9.08545 6.62646C9.08545 5.25128 7.9704 4.13623 6.59521 4.13623C5.22003 4.13623 4.10498 5.25128 4.10498 6.62646C4.10498 8.00165 5.22003 9.1167 6.59521 9.1167C7.9704 9.1167 9.08545 8.00165 9.08545 6.62646ZM10.105 6.62646C10.105 7.39551 9.85647 8.10577 9.43701 8.68408L12.9146 12.1616L12.1929 12.8833L8.72412 9.41455C8.13339 9.86631 7.39632 10.1362 6.59521 10.1362C4.6567 10.1362 3.08545 8.56498 3.08545 6.62646C3.08545 4.68795 4.6567 3.1167 6.59521 3.1167C8.53373 3.1167 10.105 4.68795 10.105 6.62646Z\" fill=\"#1E1E1E\"/>\n</svg>\n",
	"./icons/strike.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M10.6 5.4C10.4 4.2 9.4 3.5 8 3.5C6.5 3.5 5.5 4.3 5.5 5.5C5.5 8.2 10.5 7.4 10.5 10.3C10.5 11.6 9.4 12.5 8 12.5C6.5 12.5 5.5 11.7 5.4 10.6M4 8H12\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/table.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3H13.5V13H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M6.2 3V13M9.8 3V13M2.5 8H13.5\" stroke=\"currentColor\" stroke-width=\"1\"/>\n</svg>\n",
	"./icons/text.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 4H13V5H3ZM3 7.5H13V8.5H3ZM3 11H9V12H3Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/todo.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3H6.5V7H2.5ZM2.5 9H6.5V13H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M3.5 5L4.4 5.9L5.7 4.2\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M8.5 4.5H13.5V5.5H8.5ZM8.5 10.5H13.5V11.5H8.5Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/toggle.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 5L7.5 8L3 11Z\" fill=\"currentColor\"/>\n<path d=\"M9.5 7.5H13.5V8.5H9.5Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/up.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.49645 3.48222V16H8.50702L8.50841 3.48259L11.4156 6.38982L12.1095 5.68299L8.00173 1.57524L3.8905 5.68647L4.59784 6.39381L7.49645 3.48222Z\" fill=\"#1E1E1E\"/>\n</svg>\n",
	"./icons/connect.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.7982 7.99673L7.65899 12.1359L6.94737 11.4243L9.87875 8.50597L3.88054 8.51223L3.88054 7.49375L9.87875 7.48749L6.9539 4.56264L7.66552 3.86407L11.7982 7.99673Z\" fill=\"black\"/>\n<path d=\"M3.37131 7.99987C3.37131 8.81187 2.71305 9.47013 1.90105 9.47013C1.08904 9.47013 0.430786 8.81187 0.430786 7.99987C0.430786 7.18787 1.08904 6.52961 1.90105 6.52961C2.71305 6.52961 3.37131 7.18787 3.37131 7.99987Z\" fill=\"black\"/>\n<path d=\"M15.5692 7.99987C15.5692 8.81187 14.911 9.47013 14.099 9.47013C13.2869 9.47013 12.6287 8.81187 12.6287 7.99987C12.6287 7.18787 13.2869 6.52961 14.099 6.52961C14.911 6.52961 15.5692 7.18787 15.5692 7.99987Z\" fill=\"black\"/>\n</svg>\n"
}, K = (e, t) => {
	let n = he(e, t);
	return n.textContent = t, n;
};
function he(e, t) {
	let n = document.createElement("span");
	return n.className = "aa-atom", n.contentEditable = "false", n.dataset.atom = e, n.dataset.source = t, n;
}
var q = (e) => e instanceof HTMLElement && e.classList.contains("aa-atom");
function ge(e, t, n = m) {
	if (!t) return "";
	let r = [];
	for (let i of E(e, n)) {
		if (!i.group) continue;
		let e = `${i.group[0]}-${i.group[1]}`;
		t.from <= i.group[1] && t.to >= i.group[0] && !r.includes(e) && r.push(e);
	}
	return `on:${r.join(",")}`;
}
function _e(e, t, n, r = m, i = K, a = []) {
	e.className = "aa-block", e.dataset.kind = t.kind;
	for (let n of [
		"spellcheck",
		"autocorrect",
		"autocapitalize"
	]) t.kind === "code" ? e.setAttribute(n, n === "spellcheck" ? "false" : "off") : e.removeAttribute(n);
	if (t.level ? e.dataset.level = String(t.level) : delete e.dataset.level, t.checked === void 0 ? delete e.dataset.checked : e.dataset.checked = t.checked ? "true" : "false", e.toggleAttribute("data-active", !!n), e.dataset.reveal = ge(t, n, r), e.style.setProperty("--aa-depth", String(t.depth ?? 0)), t.number === void 0 ? delete e.dataset.number : e.dataset.number = String(t.number), t.kind === "callout") {
		let r = me[`./icons/${t.folded ? "toggle" : t.callout === "tip" ? "check" : t.callout === "warning" || t.callout === "caution" ? "callout" : "note"}.svg`];
		e.style.setProperty("--aa-callout-icon", `url("data:image/svg+xml,${encodeURIComponent(r.replace(/currentColor/g, "black"))}")`), e.dataset.callout = t.callout, e.toggleAttribute("data-folded", !!t.folded), e.toggleAttribute("data-body-active", !!n && n.to > t.source.indexOf("\n") && t.source.includes("\n"));
	} else delete e.dataset.callout, e.removeAttribute("data-folded"), e.removeAttribute("data-body-active");
	if (t.kind === "table") {
		ye(e, t, a), J(e, a);
		return;
	}
	let o = u(t, r);
	e.toggleAttribute("data-drawn", !!o && !n), o ? e.dataset.fence = o.name : delete e.dataset.fence;
	let s = /* @__PURE__ */ new Map();
	for (let t of e.querySelectorAll(".aa-atom")) {
		let e = `${t.dataset.atom}\u0000${t.dataset.source}`;
		s.set(e, [...s.get(e) ?? [], t]);
	}
	let c = document.createDocumentFragment(), l = document.createElement("span");
	l.className = "aa-callout-body";
	let d = c, f = !1, p = !1;
	for (let e of o && n ? E(t, r.filter((e) => e !== o)) : E(t, r)) {
		if (t.kind === "callout" && e.from >= t.source.indexOf("\n") && t.source.includes("\n") && d === c && (c.append(l), d = l), p = e.kind === "break", e.kind === "break") {
			d.append(document.createElement("br"));
			continue;
		}
		let r = t.source.slice(e.from, e.to);
		if (!r) continue;
		if (e.kind === "atom") {
			e.group && n && n.from <= e.to && n.to >= e.from ? d.append(document.createTextNode(r)) : d.append(s.get(`${e.atom}\u0000${r}`)?.shift() ?? i(e.atom, r)), f = !0;
			continue;
		}
		if (e.kind === "syntax") {
			let i = document.createElement("span");
			i.className = "aa-syntax", t.kind === "heading" && e.prefix && n ? i.setAttribute("data-heading-prefix", "") : i.setAttribute("data-hidden", ""), i.textContent = r, d.append(i);
			continue;
		}
		f = !0;
		let o = e.href ? document.createElement("a") : document.createElement("span");
		o instanceof HTMLAnchorElement && (o.href = e.href, o.className = "aa-link", o.rel = "noopener"), e.bold && o.classList.add("aa-b"), e.italic && o.classList.add("aa-i"), e.strike && o.classList.add("aa-s"), e.code && (o.classList.add("aa-c"), o.spellcheck = !1), e.highlight && o.classList.add("aa-highlight"), o.textContent = r, ve(o, e.from, a), d.append(o);
	}
	if (o && n) {
		let e = i(o.name, t.source);
		e.dataset.source = "", e.dataset.preview = "", c.append(e);
	}
	if (!f || p) {
		let e = document.createElement("br");
		e.dataset.filler = "", c.append(e);
	}
	e.replaceChildren(c), J(e, a);
}
function ve(e, t, n) {
	let r = e.textContent ?? "", i = n.filter((e) => e.from < t + r.length && e.to > t);
	if (!i.length) return;
	let a = [.../* @__PURE__ */ new Set([
		0,
		r.length,
		...i.flatMap((e) => [Math.max(0, e.from - t), Math.min(r.length, e.to - t)])
	])].sort((e, t) => e - t);
	e.replaceChildren();
	for (let n = 1; n < a.length; n++) {
		let o = a[n - 1], s = a[n], c = document.createElement("span");
		c.textContent = r.slice(o, s);
		for (let e of i) e.from < t + s && e.to > t + o && (c.classList.add(...e.className.split(/\s+/).filter(Boolean)), e.label && (c.title = e.label));
		e.append(c);
	}
}
function J(e, t) {
	for (let n of t.filter((t) => t.from === t.to && t.from >= 0 && t.from <= be(e).length)) {
		let t = document.createElement("span");
		t.className = `${n.className} aa-peer-caret`, t.contentEditable = "false", t.dataset.label = n.label ?? "", t.title = n.label ?? "";
		let r = Ce(e, n.from), i = document.createRange();
		i.setStart(r.node, r.offset), i.collapse(!0), i.insertNode(t);
	}
}
function ye(e, t, n) {
	e.contentEditable = "false";
	let r = W(t.source), i = ue(t.source), a = document.createDocumentFragment(), o = 0;
	r.forEach((r, s) => {
		let c = document.createElement("span");
		c.className = "aa-table-row", c.style.setProperty("--aa-columns", String(r.length)), r.forEach((r, a) => {
			let l = document.createElement("span");
			l.className = "aa-table-cell", l.dataset.cell = `${s}:${a}`, i[a] && (l.dataset.align = i[a]), l.dataset.from = String(r.from), l.dataset.to = String(r.to), l.contentEditable = e.dataset.readonly === "true" ? "false" : "true";
			let u = document.createElement("span");
			u.className = "aa-syntax", u.dataset.hidden = "", u.textContent = t.source.slice(o, r.from);
			let d = document.createElement("span");
			if (d.textContent = r.text, ve(d, r.from, n), !r.text) {
				let e = document.createElement("br");
				e.dataset.filler = "", d.append(e);
			}
			l.append(u, d), c.append(l), o = r.to;
		}), a.append(c);
	});
	let s = document.createElement("span");
	s.className = "aa-syntax", s.dataset.hidden = "", s.textContent = t.source.slice(o), a.append(s), e.replaceChildren(a);
}
function be(e) {
	let t = "", n = (e) => {
		for (let r of Array.from(e.childNodes)) {
			if (r.nodeType === Node.TEXT_NODE) {
				t += (r.textContent ?? "").replace(/ /g, " ");
				continue;
			}
			if (r instanceof HTMLElement) {
				if (q(r)) {
					t += r.dataset.source ?? "";
					continue;
				}
				if (r.tagName === "BR") {
					"filler" in r.dataset || (t += "\n");
					continue;
				}
				/^(DIV|P)$/.test(r.tagName) && t && !t.endsWith("\n") && (t += "\n"), n(r);
			}
		}
	};
	return n(e), t;
}
function xe(e) {
	let t = e.parentElement;
	return !!t && !!t.closest(".aa-syntax[data-hidden]");
}
function Se(e, t, n) {
	let r = 0, i = -1, a = (e) => {
		let o = Array.from(e.childNodes);
		for (let s = 0; s < o.length; s++) {
			let c = o[s];
			if (e === t && s === n) return i = r, !0;
			if (c === t && c.nodeType === Node.TEXT_NODE) return i = r + n, !0;
			if (c.nodeType === Node.TEXT_NODE) {
				r += (c.textContent ?? "").length;
				continue;
			}
			if (c instanceof HTMLElement) {
				if (q(c)) {
					let e = (c.dataset.source ?? "").length;
					if (c === t || c.contains(t)) return i = c === t && n === 0 ? r : r + e, !0;
					r += e;
					continue;
				}
				if (c.tagName === "BR") {
					r += "filler" in c.dataset ? 0 : 1;
					continue;
				}
				if (a(c)) return !0;
			}
		}
		return e === t && n >= o.length && (i = r, !0);
	};
	return (t === e || e.contains(t)) && a(e), i < 0 ? r : i;
}
function Ce(e, t) {
	if (e.dataset.kind === "table") {
		let n = Array.from(e.querySelectorAll("[data-cell]")).find((e) => t >= Number(e.dataset.from) && t <= Number(e.dataset.to));
		if (n?.lastElementChild) return Ce(n.lastElementChild, t - Number(n.dataset.from));
	}
	let n = 0, r = null, i = (e) => {
		let a = Array.from(e.childNodes);
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			if (s.nodeType === Node.TEXT_NODE) {
				let e = (s.textContent ?? "").length;
				if (!xe(s) && t <= n + e) return r = {
					node: s,
					offset: Math.max(0, t - n)
				}, !0;
				n += e;
				continue;
			}
			if (s instanceof HTMLElement) {
				if (q(s)) {
					let i = (s.dataset.source ?? "").length;
					if (t === n) return r = {
						node: e,
						offset: o
					}, !0;
					if (t <= n + i) return r = {
						node: e,
						offset: o + 1
					}, !0;
					n += i;
					continue;
				}
				if (s.tagName === "BR") {
					if ("filler" in s.dataset) {
						if (t <= n) return r = {
							node: e,
							offset: o
						}, !0;
						continue;
					}
					if (t === n) return r = {
						node: e,
						offset: o
					}, !0;
					if (n += 1, t === n && o === a.length - 1) return r = {
						node: e,
						offset: o + 1
					}, !0;
					continue;
				}
				if (i(s)) return !0;
			}
		}
		return !1;
	};
	return i(e), r ?? {
		node: e,
		offset: e.childNodes.length
	};
}
//#endregion
//#region src/controls.ts
var we = [
	{
		kind: "paragraph",
		label: "Text",
		icon: "text"
	},
	{
		kind: "h1",
		label: "Heading 1",
		icon: "h1"
	},
	{
		kind: "h2",
		label: "Heading 2",
		icon: "h2"
	},
	{
		kind: "h3",
		label: "Heading 3",
		icon: "h3"
	},
	{
		kind: "todo",
		label: "To-do",
		icon: "todo"
	},
	{
		kind: "bullet",
		label: "Bulleted list",
		icon: "bullet"
	},
	{
		kind: "numbered",
		label: "Numbered list",
		icon: "numbered"
	},
	{
		kind: "quote",
		label: "Quote",
		icon: "quote"
	},
	{
		kind: "code",
		label: "Code",
		icon: "code-block"
	},
	{
		kind: "divider",
		label: "Divider",
		icon: "divider"
	},
	{
		kind: "callout",
		label: "Callout",
		icon: "callout"
	},
	{
		kind: "toggle",
		label: "Toggle",
		icon: "toggle"
	},
	{
		kind: "toggle-h1",
		label: "Heading 1",
		icon: "h1"
	},
	{
		kind: "toggle-h2",
		label: "Heading 2",
		icon: "h2"
	},
	{
		kind: "toggle-h3",
		label: "Heading 3",
		icon: "h3"
	},
	{
		kind: "table",
		label: "Table",
		icon: "table"
	},
	{
		kind: "equation",
		label: "Equation",
		icon: "equation"
	}
];
function Y(e, t, n, r = !1, i = !1) {
	let a = document.createElement("button");
	a.type = "button", a.title = e, a.setAttribute("aria-label", e);
	let o = document.createElement("span");
	o.className = "aa-icon";
	let s = me[`./icons/${t}.svg`];
	if (s && (o.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(s.replace(/currentColor/g, "black"))}")`), a.append(o), r) {
		let t = document.createElement("span");
		t.textContent = e, a.append(t);
	}
	return i || a.addEventListener("pointerdown", (e) => e.preventDefault()), a.addEventListener("click", n), a;
}
var Te = class extends (typeof HTMLElement > "u" ? class {} : HTMLElement) {
	editor = null;
	actions = [];
	connectedCallback() {
		this.setAttribute("role", "toolbar"), this.setAttribute("aria-label", "Text formatting"), this.refresh();
	}
	refresh() {
		this.replaceChildren(...this.actions.map((e) => {
			let t = Y(e.label, e.icon, () => {
				this.editor && !this.editor.readOnly && e.run(this.editor);
			});
			return t.classList.add("note-menu-row"), t;
		}));
	}
};
function X() {
	customElements.get("aa-toolbar") || customElements.define("aa-toolbar", Te);
}
function Ee(e) {
	let t = e.insert;
	return t ? {
		id: `insert-${e.name}`,
		label: t.label,
		icon: t.icon,
		keywords: t.keywords,
		run: (e) => {
			let n = e.activeBlock(), r = !n || !n.block.source.trim(), i = n ? r ? n.start : n.end : e.value.length, a = r && (n || !e.value) ? "" : "\n\n";
			e.replace(i, n && r ? n.end : i, a + t.source);
			let o = t.source.indexOf("\n") + 1;
			e.selectRange(i + a.length + o);
		}
	} : null;
}
function De(e, t) {
	X();
	let n = (t.atoms ?? []).map(Ee).filter((e) => !!e), r = e.element, i = document.createElement("aa-toolbar");
	i.className = "aa-controls aa-toolbar", i.hidden = !0, i.editor = e;
	let a = null, o = () => {
		a && e.selectRange(a.start, a.end);
	};
	i.actions = [
		...[
			"bold",
			"italic",
			"strike",
			"code",
			"link",
			"equation"
		].map((t) => ({
			id: t,
			icon: t,
			label: {
				bold: "Bold",
				italic: "Italic",
				strike: "Strikethrough",
				code: "Code",
				link: "Link",
				equation: "Equation"
			}[t],
			run: () => {
				o(), e.format(t);
			}
		})),
		{
			id: "turn",
			icon: "text",
			label: "Turn into",
			run: () => {
				o(), e.activeBlock() && M(we.map((t) => ({
					id: t.kind,
					label: t.label,
					icon: t.icon,
					run: () => e.turnInto(t.kind)
				})), i.getBoundingClientRect());
			}
		},
		...n.map((t) => ({
			...t,
			run: () => {
				o(), t.run(e);
			}
		})),
		...(Array.isArray(t.toolbar) ? t.toolbar : []).map((t) => ({
			...t,
			run: () => {
				o(), t.run(e);
			}
		}))
	], t.onFiles && (i.actions = [...i.actions, {
		id: "image",
		label: "Image or file",
		icon: "image",
		run: () => {
			let e = document.createElement("input");
			e.type = "file", e.multiple = !0, e.addEventListener("change", () => {
				o(), t.onFiles?.(Array.from(e.files ?? []));
			}, { once: !0 }), e.click();
		}
	}]), window.matchMedia?.("(pointer: coarse)").matches && (i.actions = [
		...i.actions,
		{
			id: "add",
			label: "Add a block",
			icon: "plus",
			run: () => {
				o(), b = e.activeBlock()?.index ?? -1;
				let t = e.activeBlock();
				t && (e.replace(t.end, t.end, "\n\n/"), te());
			}
		},
		{
			id: "indent",
			label: "Indent",
			icon: "indent",
			run: () => {
				o(), e.indent(1);
			}
		},
		{
			id: "outdent",
			label: "Outdent",
			icon: "outdent",
			run: () => {
				o(), e.indent(-1);
			}
		}
	]), i.refresh();
	let c = r.closest("dialog") ?? r.ownerDocument.body;
	t.toolbar && c.append(i);
	let l = document.createElement("div");
	l.className = "aa-controls aa-menu", l.hidden = !0, l.setAttribute("role", "menu"), l.setAttribute("aria-label", "Block commands");
	let u = document.createElement("div");
	u.className = "aa-controls aa-grip", u.hidden = !0;
	let d = document.createElement("div");
	d.className = "aa-drop-line", d.hidden = !0;
	let f = document.createElement("div");
	f.className = "aa-controls aa-find", f.hidden = !0, f.setAttribute("role", "search"), c.append(l, u, d, f);
	let p = document.createElement("form");
	p.className = "aa-controls aa-find aa-link-editor", p.hidden = !0, p.setAttribute("aria-label", "Edit link");
	let m = document.createElement("input");
	m.type = "text", m.placeholder = "Link URL", m.setAttribute("aria-label", "Link URL");
	let h = document.createElement("button");
	h.type = "submit", h.textContent = "Apply";
	let g = document.createElement("button");
	g.type = "button", g.textContent = "Cancel", p.append(m, h, g), c.append(p);
	let _ = null, v = () => {
		p.hidden = !0, _ && e.selectRange(_.start, _.end), _ = null;
	}, y = (t) => {
		if (_ = t.detail, !_ || e.readOnly) return;
		m.value = _.url, p.hidden = !1;
		let n = r.getBoundingClientRect(), a = 20 * (parseFloat(getComputedStyle(r).getPropertyValue("--sf")) || 1);
		p.style.left = `${Math.max(0, Math.min(n.left, window.innerWidth - 16 * a))}px`, p.style.top = `${Math.max(0, Math.min(n.top, window.innerHeight - 3 * a))}px`, i.hidden = !0, m.focus(), m.select();
	};
	p.addEventListener("submit", (t) => {
		if (t.preventDefault(), !_ || e.readOnly || !m.value.trim()) return;
		let n = m.value.trim().replace(/\(/g, "%28").replace(/\)/g, "%29"), r = _.text || n;
		e.replace(_.start, _.end, `[${r}](${n})`), p.hidden = !0, _ = null;
	}), g.addEventListener("click", v), p.addEventListener("keydown", (e) => {
		e.key === "Escape" && (e.preventDefault(), v());
	}), r.addEventListener("aa-link-request", y);
	let b = -1, x = 0, S = [], C = null, w, T = -1, E = -1, D = !1, O = (e) => {
		let t = 20 * (parseFloat(getComputedStyle(r).getPropertyValue("--sf")) || 1);
		l.style.left = `${Math.max(0, Math.min(e.left, window.innerWidth - 4 * t))}px`, l.style.top = `${Math.max(0, Math.min(e.bottom, window.innerHeight - Math.min(S.length, 12) * t))}px`;
	}, k = () => {
		l.hidden = !0, C = null, l.replaceChildren(), r.removeAttribute("aria-controls");
	}, A = (t) => {
		if (e.readOnly) return;
		let n = C;
		k(), e.transaction(() => {
			n && e.replace(n.from, n.to, ""), t.run(e);
		}), i.hidden = !0;
	}, j = () => {
		if (l.replaceChildren(...S.map((e, t) => {
			let n = Y(e.label, e.icon, () => A(e), !0);
			return n.classList.add("note-menu-row"), n.dataset.command = e.id, n.setAttribute("role", "menuitem"), e.id === "count" && (n.lastElementChild.textContent = e.label.split(",")[0], n.querySelector(".aa-icon")?.remove()), n.tabIndex = t === x ? 0 : -1, n.toggleAttribute("data-current", t === x), n;
		})), !S.length) {
			let e = document.createElement("span");
			e.className = "aa-menu-empty", e.textContent = "No matching commands", l.append(e);
		}
	};
	function M(t, n) {
		S = t.filter((t) => t.enabled?.(e) !== !1), x = 0, l.hidden = !1, j(), O(n);
	}
	let N = [...we.map((t) => ({
		id: t.kind,
		label: t.label,
		icon: t.icon,
		run: () => e.turnInto(t.kind)
	})), ...n];
	t.onFiles && N.push({
		id: "image",
		label: "Image or file",
		icon: "image",
		run: () => {
			let t = document.createElement("input");
			t.type = "file", t.multiple = !0, t.addEventListener("change", () => Array.from(t.files ?? []).forEach((t) => e.insertFile(t)), { once: !0 }), t.click();
		}
	});
	let ee = () => {
		if (b < 0) return;
		(e.activeBlock()?.index !== b || e.activeBlock()?.block.kind !== "table") && e.selectBlocks(b);
		let n = [
			...N,
			{
				id: "duplicate",
				label: "Duplicate",
				icon: "duplicate",
				run: () => e.blockAction("duplicate")
			},
			{
				id: "delete",
				label: "Delete",
				icon: "delete",
				run: () => e.blockAction("delete")
			},
			{
				id: "up",
				label: "Move up",
				icon: "up",
				run: () => e.blockAction("up")
			},
			{
				id: "down",
				label: "Move down",
				icon: "down",
				run: () => e.blockAction("down")
			},
			{
				id: "indent",
				label: "Indent",
				icon: "indent",
				run: () => e.indent(1),
				enabled: (e) => e.activeBlock()?.block.kind === "bullet"
			},
			{
				id: "outdent",
				label: "Outdent",
				icon: "outdent",
				run: () => e.indent(-1),
				enabled: (e) => e.activeBlock()?.block.kind === "bullet"
			},
			...[
				"add-row",
				"delete-row",
				"add-column",
				"delete-column"
			].map((t) => ({
				id: t,
				label: t.replace("-", " ").replace(/^./, (e) => e.toUpperCase()),
				icon: "table",
				enabled: (e) => e.activeBlock()?.block.kind === "table",
				run: () => e.table(t)
			})),
			...t.blockCommands ?? []
		], r = e.stats();
		n.push({
			id: "count",
			label: `${r.words} words, ${r.characters} characters`,
			icon: "text",
			run: () => {}
		}), C = null, M(n, u.getBoundingClientRect());
	}, P = Y("Block menu", "handle", ee, !1, !0);
	P.draggable = !0, P.addEventListener("dragstart", (e) => {
		T = b, e.dataTransfer?.setData("application/x-aa-block", String(T)), e.dataTransfer && (e.dataTransfer.effectAllowed = "move");
	}), P.addEventListener("dragend", () => {
		T = -1, d.hidden = !0;
	}), u.append(P, Y("Add a block", "plus", () => {
		e.selectBlocks(b);
		let t = e.activeBlock();
		t && (e.replace(t.end, t.end, "\n\n/"), te());
	}));
	let te = () => {
		if (D || e.readOnly || t.menus === !1) {
			k();
			return;
		}
		let n = e.activeBlock(), i = e.selection();
		if (!n || !i || i.start !== i.end || n.block.kind === "code" || n.block.kind === "table") return;
		let a = e.value.slice(n.start, i.end), o = /(?:^|\s)\/([^/\n]*)$/.exec(a);
		if (!o) {
			C && k();
			return;
		}
		let s = o[1].toLocaleLowerCase();
		C = {
			from: i.end - o[1].length - 1,
			to: i.end
		}, M([...N, ...t.commands ?? []].filter((e) => `${e.label} ${e.keywords ?? ""}`.toLocaleLowerCase().includes(s)), r.children[n.index]?.getBoundingClientRect() ?? r.getBoundingClientRect());
	}, ne = () => {
		if (!i.hidden) if (window.matchMedia?.("(pointer: coarse)").matches) {
			let e = window.visualViewport;
			i.dataset.docked = "", i.style.top = `${(e?.offsetTop ?? 0) + (e?.height ?? window.innerHeight) - i.getBoundingClientRect().height}px`, i.style.left = "0px";
		} else {
			delete i.dataset.docked;
			let e = (window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null)?.getBoundingClientRect?.() ?? r.getBoundingClientRect();
			i.style.left = `${Math.max(0, Math.min(e.left, window.innerWidth - i.getBoundingClientRect().width))}px`, i.style.top = `${Math.max(0, e.top - i.getBoundingClientRect().height)}px`;
		}
	}, re = () => {
		clearTimeout(w);
		let n = e.selection(), o = window.matchMedia?.("(pointer: coarse)").matches && r.contains(document.activeElement);
		if (!n || !o && n.start === n.end || e.readOnly) {
			i.hidden = !0;
			return;
		}
		a = n, w = setTimeout(() => {
			!D && t.toolbar && !e.readOnly && (i.hidden = !1, ne());
		}, 140);
	}, ie = (n) => {
		if (e.readOnly || t.menus === !1) return;
		let i = n.target.closest(".aa-block");
		if (!i || i.parentElement !== r) return;
		b = Array.from(r.children).indexOf(i);
		let a = i.getBoundingClientRect(), o = 20 * (parseFloat(getComputedStyle(r).getPropertyValue("--sf")) || 1);
		u.style.left = `${Math.max(0, a.left - 2 * o)}px`, u.style.top = `${a.top}px`, u.hidden = !1;
	}, F = document.createElement("input");
	F.placeholder = "Find", F.setAttribute("aria-label", "Find");
	let I = document.createElement("input");
	I.placeholder = "Replace", I.setAttribute("aria-label", "Replace");
	let L = document.createElement("span");
	L.setAttribute("aria-live", "polite");
	let R = [], z = -1, B = () => {
		f.hidden || (R = e.find(F.value), e.decorate(R.map((e) => ({
			from: e.start,
			to: e.end,
			className: "aa-find-match"
		})), "find"), L.textContent = `${R.length} matches`, z = Math.min(z, R.length - 1));
	}, ae = (t) => {
		if (!R.length) return;
		z = (z + t + R.length) % R.length;
		let n = R[z];
		e.selectRange(n.start, n.end), L.textContent = `${z + 1} of ${R.length}`;
	}, oe = () => {
		f.hidden = !0, e.decorate([], "find"), e.focus();
	};
	F.addEventListener("input", B), f.append(F, I, Y("Previous match", "up", () => ae(-1)), Y("Next match", "down", () => ae(1)), Y("Replace", "text", () => {
		let t = R[z < 0 ? 0 : z];
		!t || e.readOnly || (e.replace(t.start, t.end, I.value), B());
	}), Y("Replace all", "text", () => {
		if (!R.length || e.readOnly) return;
		let t = e.value;
		for (let e of [...R].reverse()) t = t.slice(0, e.start) + I.value + t.slice(e.end);
		e.replace(0, e.value.length, t), B();
	}), L, Y("Close find", "close", oe)), f.addEventListener("keydown", (e) => {
		e.key === "Escape" ? (e.preventDefault(), oe()) : e.key === "Enter" && (e.preventDefault(), ae(e.shiftKey ? -1 : 1));
	});
	let V = (t) => {
		if (t.isComposing || t.defaultPrevented) return;
		let n = /Mac|iPhone|iPad/.test(navigator.platform) ? t.metaKey : t.ctrlKey;
		if (n && t.key.toLowerCase() === "f") {
			t.preventDefault(), t.stopImmediatePropagation(), f.hidden = !1;
			let e = r.getBoundingClientRect();
			f.style.left = `${Math.max(0, e.left)}px`, f.style.top = `${Math.max(0, e.top)}px`, B(), F.focus();
			return;
		}
		if (n && t.key === "/") {
			t.preventDefault(), t.stopImmediatePropagation(), b = e.activeBlock()?.index ?? -1, ee();
			return;
		}
		if (!l.hidden) {
			if (t.key === "Escape") {
				t.preventDefault(), t.stopImmediatePropagation(), k();
				return;
			}
			if (t.key === "ArrowDown" || t.key === "ArrowUp") {
				t.preventDefault(), t.stopImmediatePropagation(), S.length && (x = (x + (t.key === "ArrowDown" ? 1 : -1) + S.length) % S.length), j();
				return;
			}
			t.key === "Enter" && S[x] && (t.preventDefault(), t.stopImmediatePropagation(), A(S[x]));
		}
	};
	l.addEventListener("keydown", V);
	let H = (e) => {
		!l.contains(e.target) && !u.contains(e.target) && k(), !r.contains(e.target) && !i.contains(e.target) && (i.hidden = !0);
	}, se = (t) => {
		if (e.readOnly || T < 0 && !Array.from(t.dataTransfer?.types ?? []).includes("Files")) return;
		let n = t.target.closest(".aa-block");
		if (!n || n.parentElement !== r) return;
		t.preventDefault();
		let i = n.getBoundingClientRect(), a = t.clientY > i.top + i.height / 2;
		E = Array.from(r.children).indexOf(n) + +!!a, d.style.left = `${i.left}px`, d.style.top = `${a ? i.bottom : i.top}px`, d.style.width = `${i.width}px`, d.hidden = !1;
	}, ce = (n) => {
		if (d.hidden = !0, T < 0 && E >= 0 && !e.readOnly && n.dataTransfer?.files.length && t.onFiles) {
			n.preventDefault(), n.stopImmediatePropagation();
			let r = s(e.value), i = E < r.length ? r[E].start : e.value.length;
			e.selectRange(i, i), t.onFiles(Array.from(n.dataTransfer.files)), E = -1;
			return;
		}
		T < 0 || E < 0 || e.readOnly || (n.preventDefault(), n.stopImmediatePropagation(), e.moveBlock(T, E > T ? E - 1 : E), T = -1, E = -1);
	}, U = () => {
		te(), B(), e.readOnly && (i.hidden = !0, u.hidden = !0, p.hidden = !0, _ = null);
	}, le = (n) => {
		let i = n.target.closest(".aa-block");
		i?.getAttribute("data-kind") !== "table" || e.readOnly || t.menus === !1 || (n.preventDefault(), b = Array.from(r.children).indexOf(i), ee(), l.style.left = `${n.clientX}px`, l.style.top = `${n.clientY}px`);
	}, W = (t) => {
		if (!(t.target instanceof Node && l.contains(t.target)) && (ne(), u.hidden = !0, !l.hidden)) {
			let t = e.activeBlock(), n = t ? r.children[t.index]?.getBoundingClientRect() : null;
			n && O(n);
		}
	};
	return r.addEventListener("aa-selectionchange", re), r.addEventListener("aa-change", U), r.addEventListener("mousemove", ie), r.addEventListener("contextmenu", le), r.addEventListener("keydown", V, !0), r.addEventListener("dragover", se), r.addEventListener("drop", ce, !0), document.addEventListener("pointerdown", H), window.addEventListener("resize", W), window.addEventListener("scroll", W, !0), window.visualViewport?.addEventListener("resize", W), () => {
		D = !0, clearTimeout(w), i.remove(), l.remove(), u.remove(), d.remove(), f.remove(), p.remove(), r.removeEventListener("aa-link-request", y), r.removeEventListener("aa-selectionchange", re), r.removeEventListener("aa-change", U), r.removeEventListener("mousemove", ie), r.removeEventListener("keydown", V, !0), r.removeEventListener("contextmenu", le), r.removeEventListener("dragover", se), r.removeEventListener("drop", ce, !0), document.removeEventListener("pointerdown", H), window.removeEventListener("resize", W), window.removeEventListener("scroll", W, !0), window.visualViewport?.removeEventListener("resize", W);
	};
}
//#endregion
//#region src/selection.ts
function Oe(e, t, n) {
	let r = [];
	for (let t of [...e].filter((e) => e.right > e.left && e.bottom > e.top).sort((e, t) => e.top - t.top || e.left - t.left)) {
		let e = r.find((e) => Math.min(e.bottom, t.bottom) - Math.max(e.top, t.top) > Math.min(e.bottom - e.top, t.bottom - t.top) / 2);
		if (!e) {
			r.push({
				...t,
				fragments: [t]
			});
			continue;
		}
		e.fragments.push(t), e.left = Math.min(e.left, t.left), e.right = Math.max(e.right, t.right), e.top = Math.min(e.top, t.top), e.bottom = Math.max(e.bottom, t.bottom);
	}
	for (let e of r) {
		let n = e.left;
		for (let t of e.fragments.sort((e, t) => e.left - t.left)) {
			if (t.left > n + 1) return null;
			n = Math.max(n, t.right);
		}
		let r = Math.max(0, t - (e.bottom - e.top)) / 2;
		e.top -= r, e.bottom += r;
	}
	let i = [];
	for (let e of r) {
		let t = i.at(-1), n = t?.at(-1);
		n && e.top <= n.bottom + 1 && e.left < n.right && e.right > n.left ? (n.bottom = e.top = (n.bottom + e.top) / 2, t.push(e)) : i.push([e]);
	}
	return i.map((e) => {
		let t = e[0], r = e.at(-1), i = [{
			x: t.left,
			y: t.top
		}, {
			x: t.right,
			y: t.top
		}];
		for (let t of e) i.push({
			x: t.right,
			y: t.top
		}, {
			x: t.right,
			y: t.bottom
		});
		i.push({
			x: r.left,
			y: r.bottom
		});
		for (let t of [...e].reverse()) i.push({
			x: t.left,
			y: t.bottom
		}, {
			x: t.left,
			y: t.top
		});
		return ke(i, n);
	}).join(" ");
}
function ke(e, t) {
	let n = e.filter((t, n) => !n || t.x !== e[n - 1].x || t.y !== e[n - 1].y);
	n[0].x === n.at(-1).x && n[0].y === n.at(-1).y && n.pop(), n = n.filter((e, t, n) => {
		let r = n[(t + n.length - 1) % n.length], i = n[(t + 1) % n.length];
		return !(r.x === e.x && e.x === i.x || r.y === e.y && e.y === i.y);
	});
	let r = (e) => Number(e.toFixed(3));
	return n.map((e, i) => {
		let a = n[(i + n.length - 1) % n.length], o = n[(i + 1) % n.length], s = Math.hypot(a.x - e.x, a.y - e.y), c = Math.hypot(o.x - e.x, o.y - e.y), l = Math.max(0, Math.min(t, s / 2, c / 2)), u = e.x + (a.x - e.x) * l / s, d = e.y + (a.y - e.y) * l / s, f = e.x + (o.x - e.x) * l / c, p = e.y + (o.y - e.y) * l / c;
		return `${i ? "L" : "M"}${r(u)} ${r(d)} Q${r(e.x)} ${r(e.y)} ${r(f)} ${r(p)}`;
	}).join(" ") + " Z";
}
function Ae(e) {
	let t = 0, n = !1, r = !1, i = /* @__PURE__ */ new Set(), a = window.matchMedia("(forced-colors: active)"), o = () => {
		for (let e of i) e.removeAttribute("data-aa-selection"), e.style.removeProperty("--aa-selection-mask"), e.style.removeProperty("--aa-selection-box"), e.style.removeProperty("--aa-selection-width"), e.style.removeProperty("--aa-selection-height");
		i.clear();
	}, s = () => {
		t = 0, o();
		let s = window.getSelection();
		if (n || r || a.matches || !s?.rangeCount || s.isCollapsed || !e.contains(s.anchorNode) || !e.contains(s.focusNode)) return;
		let c = s.getRangeAt(0);
		for (let t of Array.from(e.children)) {
			if (!t.classList.contains("aa-block") || t.dataset.kind === "table" || !c.intersectsNode(t)) continue;
			let e = document.createRange();
			if (e.selectNodeContents(t), c.compareBoundaryPoints(Range.START_TO_START, e) > 0 && e.setStart(c.startContainer, c.startOffset), c.compareBoundaryPoints(Range.END_TO_END, e) < 0 && e.setEnd(c.endContainer, c.endOffset), e.collapsed || typeof e.getClientRects != "function") continue;
			let n = t.getBoundingClientRect(), r = getComputedStyle(t);
			if (r.writingMode && r.writingMode !== "horizontal-tb" || Math.abs(n.width - t.offsetWidth) > 1) continue;
			let a = parseFloat(r.lineHeight) || parseFloat(r.fontSize) * 1.2, o = Array.from(e.getClientRects()).filter((e) => e.width > 0 && e.height > 0).map((e) => ({
				left: e.left - n.left + t.scrollLeft - t.clientLeft,
				right: e.right - n.left + t.scrollLeft - t.clientLeft,
				top: e.top - n.top + t.scrollTop - t.clientTop,
				bottom: e.bottom - n.top + t.scrollTop - t.clientTop
			}));
			if (!o.length) continue;
			let s = Math.min(...o.map((e) => e.left)), l = Math.min(...o.map((e) => e.top)) - a / 2, u = Math.max(...o.map((e) => e.right)) - s, d = Math.max(...o.map((e) => e.bottom)) - l + a / 2, f = parseFloat(r.getPropertyValue("--sf")) || 1, p = Oe(o.map((e) => ({
				left: e.left - s,
				right: e.right - s,
				top: e.top - l,
				bottom: e.bottom - l
			})), a, 2 * f);
			if (!p) continue;
			let m = `<svg xmlns="http://www.w3.org/2000/svg" width="${u}" height="${d}" viewBox="0 0 ${u} ${d}"><path d="${p}"/></svg>`;
			t.style.setProperty("--aa-selection-mask", `url("data:image/svg+xml,${encodeURIComponent(m)}")`), t.style.setProperty("--aa-selection-box", `${l}px auto auto ${s}px`), t.style.setProperty("--aa-selection-width", `${u}px`), t.style.setProperty("--aa-selection-height", `${d}px`), t.setAttribute("data-aa-selection", ""), i.add(t);
		}
	}, c = () => {
		!n && !t && (t = requestAnimationFrame(s));
	}, l = () => {
		r = !0, o();
	}, u = () => {
		r = !1, c();
	}, d = new ResizeObserver(c);
	d.observe(e);
	let f = new MutationObserver(c);
	return f.observe(e, {
		childList: !0,
		subtree: !0,
		characterData: !0
	}), document.addEventListener("selectionchange", c), document.addEventListener("scroll", c, !0), window.addEventListener("resize", c), e.addEventListener("compositionstart", l), e.addEventListener("compositionend", u), e.addEventListener("load", c, !0), document.fonts?.addEventListener("loadingdone", c), a.addEventListener?.("change", c), () => {
		n = !0, cancelAnimationFrame(t), o(), d.disconnect(), f.disconnect(), document.removeEventListener("selectionchange", c), document.removeEventListener("scroll", c, !0), window.removeEventListener("resize", c), e.removeEventListener("compositionstart", l), e.removeEventListener("compositionend", u), e.removeEventListener("load", c, !0), document.fonts?.removeEventListener("loadingdone", c), a.removeEventListener?.("change", c);
	};
}
//#endregion
//#region src/editor.ts
var je = {
	...f,
	draw(e, t) {
		let [, n = "", r = ""] = /^!\[([^\]]*)\]\(([^)]*)\)$/.exec(t) ?? [], i = r.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
		if (/^data:(audio|video)\//.test(r) || i && /^(mp4|webm|mov|mp3|wav|ogg|m4a)$/.test(i)) {
			let t = document.createElement(/^data:video\//.test(r) || /^(mp4|webm|mov)$/.test(i ?? "") ? "video" : "audio");
			t.src = r, t.controls = !0, t.preload = "metadata", t.setAttribute("aria-label", n), e.append(t);
		} else {
			let t = document.createElement("img");
			t.src = r, t.alt = n, t.loading = "lazy", t.draggable = !1, e.append(t);
		}
		let a = document.createElement("span");
		a.className = "aa-caption", a.textContent = n, a.contentEditable = "true", a.dataset.placeholder = "Add a caption", e.append(a);
	}
}, Me = typeof navigator < "u" && /Mac|iPhone|iPad/.test(navigator.platform);
function Z(e, t = {}) {
	let n = D(t.value ?? ""), r = !!t.readOnly, i = t.placeholder ?? "", a = !1, o = !1, s = null, c = !1, l = [], u = /* @__PURE__ */ new Map(), d = () => {}, f = 0, m = null, h = [
		...t.atoms ?? [je],
		{
			...p,
			draw: (e, n) => t.drawEquation ? t.drawEquation(e, n.slice(1, -1), !1) : void (e.textContent = n.slice(1, -1))
		},
		{
			name: "equation-block",
			match: () => 0,
			draw: (e, n) => t.drawEquation ? t.drawEquation(e, n.replace(/^\$\$\n?|\n?\$\$$/g, ""), !0) : void (e.textContent = n.replace(/^\$\$\n?|\n?\$\$$/g, ""))
		}
	], g = /* @__PURE__ */ new Map(), _ = (e, t) => {
		let n = he(e, t), i = h.find((t) => t.name === e);
		return i?.draw ? g.set(n, i.draw(n, t)) : n.textContent = t, n.querySelectorAll(".aa-caption").forEach((e) => e.contentEditable = r ? "false" : "true"), n;
	}, v = (t = !1) => {
		for (let [n, r] of g) !t && e.contains(n) || (g.delete(n), r?.());
	}, y = (e, t, n) => {
		e.dataset.readonly = String(r), _e(e, t, n, h, _, b(t));
	}, b = (e) => {
		if (!l.length) return [];
		let t = n.indexOf(e), r = t < 0 ? 0 : K({
			block: t,
			offset: 0
		});
		return l.map((e) => ({
			...e,
			from: e.from - r,
			to: e.to - r
		}));
	}, x = new se({
		blocks: n,
		anchor: {
			block: 0,
			offset: 0
		},
		focus: {
			block: 0,
			offset: 0
		}
	});
	e.classList.add("aa"), e.setAttribute("role", "textbox"), e.setAttribute("aria-multiline", "true");
	let S = () => {
		e.setAttribute("aria-readonly", String(r)), i ? e.setAttribute("aria-placeholder", i) : e.removeAttribute("aria-placeholder");
	};
	S();
	let C = () => Array.from(e.children), w = (e) => {
		let t = document.createElement("div");
		return t.contentEditable = r ? "false" : "true", y(t, e, null), t;
	}, T = () => {
		let t = e.firstElementChild;
		t && (n.length === 1 && !n[0].source && i ? t.dataset.placeholder = i : delete t.dataset.placeholder);
	}, E = () => {
		e.replaceChildren(...n.map(w)), T(), v();
	}, O = (t) => {
		let r = n, i = C(), a = 0;
		for (; a < r.length && a < t.length && r[a] === t[a];) a++;
		let o = r.length, s = t.length;
		for (; o > a && s > a && r[o - 1] === t[s - 1];) o--, s--;
		n = t;
		let c = t.slice(a, s).map(w), l = i[o] ?? null;
		for (let e = a; e < o; e++) i[e].remove();
		for (let t of c) e.insertBefore(t, l);
		T(), v();
	}, k = (t) => {
		let n = (t instanceof HTMLElement ? t : t?.parentElement ?? null)?.closest(".aa-block");
		return !n || n.parentElement !== e ? -1 : C().indexOf(n);
	}, P = () => {
		if (document.activeElement?.closest?.(".aa-caption")) return null;
		if (s) {
			let e = Math.min(s.anchor, s.focus), t = Math.max(s.anchor, s.focus);
			return {
				anchor: {
					block: e,
					offset: 0
				},
				focus: {
					block: t,
					offset: n[t].source.length
				}
			};
		}
		let e = window.getSelection();
		if (!e || !e.rangeCount || !e.anchorNode || !e.focusNode) return null;
		let t = k(e.anchorNode), r = k(e.focusNode);
		if (t < 0 || r < 0) return null;
		let i = C();
		return {
			anchor: {
				block: t,
				offset: Se(i[t], e.anchorNode, e.anchorOffset)
			},
			focus: {
				block: r,
				offset: Se(i[r], e.focusNode, e.focusOffset)
			}
		};
	}, ce = !1, U = (e, t = e) => {
		let r = C(), i = Ce(r[e.block], Math.min(e.offset, n[e.block].source.length)), a = Ce(r[t.block], Math.min(t.offset, n[t.block].source.length)), o = window.getSelection();
		if (o) {
			ce = !0;
			try {
				o.setBaseAndExtent(i.node, i.offset, a.node, a.offset);
			} finally {
				ce = !1;
			}
		}
	}, le = (e, t) => {
		if (!t) return null;
		let [r, i] = M(t.anchor, t.focus);
		return e < r.block || e > i.block ? null : {
			from: e === r.block ? r.offset : 0,
			to: e === i.block ? i.offset : n[e].source.length
		};
	}, G = (e = P()) => {
		if (a) return;
		let t = C(), r = !1;
		n.forEach((n, i) => {
			let a = le(i, e);
			t[i].dataset.reveal !== ge(n, a, h) && (y(t[i], n, a), r = !0);
		}), r && (v(), e && U(e.anchor, e.focus));
	}, me = (e) => n[e].kind === "bullet" && n[e + 1]?.kind === "bullet" ? 1 : 2, K = (e) => {
		let t = 0;
		for (let r = 0; r < e.block; r++) t += n[r].source.length + me(r);
		return t + e.offset;
	}, q = (e) => {
		let t = 0;
		for (let r = 0; r < n.length; r++) {
			let i = t + n[r].source.length;
			if (e <= i || r === n.length - 1) return {
				block: r,
				offset: Math.max(0, Math.min(e - t, n[r].source.length))
			};
			if (e < i + me(r)) return {
				block: r,
				offset: n[r].source.length
			};
			t = i + me(r);
		}
		return {
			block: 0,
			offset: 0
		};
	}, ve = (e, t) => ({
		blocks: n,
		anchor: e,
		focus: t
	}), J = (r, i, a, o) => {
		Q();
		let s = oe(r), c = (e) => ({
			...e,
			offset: Math.max(0, e.offset + s[e.block].prefix - r[e.block].prefix)
		});
		i = c(i), a = c(a), O(s), U(i, a), G({
			anchor: i,
			focus: a
		}), f || (x.record(ve(i, a), o), t.onChange?.(A(n)), e.dispatchEvent(new Event("aa-change")));
	}, ye = (r) => {
		Q(), O(r.blocks), U(r.anchor, r.focus), G({
			anchor: r.anchor,
			focus: r.focus
		}), t.onChange?.(A(n)), e.dispatchEvent(new Event("aa-change"));
	}, xe = () => {
		if (r) return !1;
		if (m) return m.undo();
		let e = x.undo();
		return e && ye(e), !!e;
	}, we = () => {
		if (r) return !1;
		if (m) return m.redo();
		let e = x.redo();
		return e && ye(e), !!e;
	}, Y = (e) => {
		let t = C().indexOf(e);
		if (t < 0) return;
		let r = be(e), i = r.replace(/^\[\] /, "- [ ] ");
		if (i === n[t].source) return;
		let a = i.length < n[t].source.length ? "delete" : "type", o = P(), { blocks: s, caret: c } = N(n, {
			block: t,
			offset: 0
		}, {
			block: t,
			offset: n[t].source.length
		}, i), l = (e) => e.block === t ? Te(s, t, c, i, e.offset) : {
			...e,
			block: e.block + (s.length - n.length) * +(e.block > t)
		}, u = (e) => i !== r && e.block === t ? {
			...e,
			offset: e.offset + i.length - r.length
		} : e, d = o ? l(u(o.anchor)) : c, f = o ? l(u(o.focus)) : c;
		J(s, d, f, a);
	}, Te = (e, t, n, r, i) => {
		let a = 0;
		for (let o = t; o <= n.block; o++) {
			let t = e[o].source.length;
			if (i <= a + t) return {
				block: o,
				offset: Math.max(0, i - a)
			};
			if (a = r.indexOf(e[o + 1]?.source ?? "", a + t), a < 0) break;
		}
		return n;
	}, X = (e, t, r = "edit") => {
		let { blocks: i, caret: a } = N(n, e.anchor, e.focus, t);
		J(i, a, a, r);
	}, Ee = (e) => {
		if (o) return;
		if (r) {
			e.preventDefault();
			return;
		}
		if (e.target.closest?.(".aa-caption")) return;
		let t = e.inputType;
		if (t === "historyUndo") {
			e.preventDefault(), xe();
			return;
		}
		if (t === "historyRedo") {
			e.preventDefault(), we();
			return;
		}
		if (a || e.isComposing) return;
		let i = P();
		if (!i) return;
		if (s && t.startsWith("insert")) {
			e.preventDefault(), X(i, e.data ?? "", "edit");
			return;
		}
		let [c, l] = M(i.anchor, i.focus), u = c.block !== l.block, d = !u && c.offset === l.offset, f = n[c.block];
		if (f.kind === "table") {
			let n = W(f.source).flat().find((e) => c.offset >= e.from && c.offset <= e.to);
			if (n && d && (t === "deleteContentBackward" && c.offset === n.from || t === "deleteContentForward" && c.offset === n.to)) {
				e.preventDefault();
				return;
			}
		}
		switch (t) {
			case "insertParagraph":
			case "insertLineBreak":
				e.preventDefault(), ke(i);
				return;
			case "insertFromPaste": {
				e.preventDefault();
				let t = e.dataTransfer?.getData("text/plain") ?? "";
				t && X(i, t.replace(/\r\n?/g, "\n"));
				return;
			}
			case "insertFromDrop":
				e.preventDefault();
				return;
			case "deleteContentBackward":
				if (!d) {
					e.preventDefault(), X(i, "");
					return;
				}
				if (c.offset <= f.prefix) {
					let t = ne(n, c.block);
					if (t) {
						e.preventDefault(), J(t.blocks, t.caret, t.caret, "edit");
						return;
					}
				}
				if (c.offset === 0) {
					e.preventDefault();
					let t = re(n, c.block);
					t && J(t.blocks, t.caret, t.caret, "edit");
				}
				return;
			case "deleteContentForward":
				if (!d) {
					e.preventDefault(), X(i, "");
					return;
				}
				if (c.offset === f.source.length) {
					e.preventDefault();
					let t = ie(n, c.block);
					t && J(t.blocks, t.caret, t.caret, "edit");
				}
				return;
			case "deleteByCut":
				e.preventDefault();
				return;
			case "formatBold":
				e.preventDefault(), Z(i, "**");
				return;
			case "formatItalic":
				e.preventDefault(), Z(i, "*");
				return;
			case "formatStrikeThrough":
				e.preventDefault(), Z(i, "~~");
				return;
			default:
				if (!u) return;
				e.preventDefault(), t.startsWith("insert") ? X(i, e.data ?? "", "type") : t.startsWith("delete") && X(i, "");
		}
	}, Oe = (i) => {
		if (o || r || a || i instanceof InputEvent && i.isComposing) return;
		let s = i.target.closest?.(".aa-caption");
		if (s) {
			let r = s.closest(".aa-atom"), i = r.closest(".aa-block"), a = C().indexOf(i), o = (r.dataset.source ?? "").replace(/^!\[[^\]]*\]/, `![${(s.textContent ?? "").replace(/\]/g, "").replace(/\n/g, " ")}]`);
			r.dataset.source = o;
			let c = [...n];
			c[a] = {
				...n[a],
				source: be(i)
			}, n = c;
			let l = {
				block: a,
				offset: Se(i, r, 1)
			};
			x.record(ve(l, l), "type"), t.onChange?.(A(n)), e.dispatchEvent(new Event("aa-change"));
			return;
		}
		let c = i.target?.closest?.(".aa-block");
		c && c.parentElement === e && Y(c);
	}, ke = (e, t = !1) => {
		if (n[e.focus.block].kind === "table") {
			let t = e.focus.block, r = [
				...n.slice(0, t + 1),
				{
					kind: "paragraph",
					source: "",
					prefix: 0
				},
				...n.slice(t + 1)
			], i = {
				block: t + 1,
				offset: 0
			};
			J(r, i, i, "edit");
			return;
		}
		if (n[e.focus.block].kind === "callout" && !t) {
			X(e, "\n> ");
			return;
		}
		if (t) {
			X(e, "\n");
			return;
		}
		let [r, i] = M(e.anchor, e.focus), a = n, o = r;
		j(r, i) !== 0 && ({blocks: a, caret: o} = N(n, r, i, ""));
		let s = te(a, o);
		J(s.blocks, s.caret, s.caret, "edit");
	}, Z = (e, t, r = t) => {
		let i = F(n, e.anchor, e.focus, t, r);
		i && J(i.blocks, i.anchor, i.focus, "edit");
	}, Ne = (t) => {
		let [r, i] = M(t.anchor, t.focus);
		if (r.block !== i.block) return;
		let a = r.offset, o = i.offset, s = n[r.block].source.slice(a, o), c = "";
		for (let e of n[r.block].source.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g)) if (r.offset >= e.index && i.offset <= e.index + e[0].length) {
			a = e.index, o = a + e[0].length, s = e[1], c = e[2];
			break;
		}
		e.dispatchEvent(new CustomEvent("aa-link-request", { detail: {
			start: K({
				block: r.block,
				offset: a
			}),
			end: K({
				block: r.block,
				offset: o
			}),
			text: s,
			url: c
		} }));
	}, Pe = () => {
		let e = window.getSelection();
		if (!e?.rangeCount) return null;
		let t = e.getRangeAt(0), n = t.getClientRects();
		if (n.length) return n[n.length - 1];
		let r = t.getBoundingClientRect();
		if (r.height) return r;
		let i = t.startContainer;
		if (i.nodeType === Node.TEXT_NODE && t.startOffset > 0) {
			let e = document.createRange();
			e.setStart(i, t.startOffset - 1), e.setEnd(i, t.startOffset);
			let n = e.getClientRects();
			if (n.length) return n[n.length - 1];
		}
		return (i instanceof HTMLElement ? i : i.parentElement)?.getBoundingClientRect() ?? null;
	}, Fe = (e, t, r) => {
		let i = C()[e], a = i.getBoundingClientRect(), o = r === "top" ? a.top + 2 : a.bottom - 2, s = null, c = 0, l = document.caretPositionFromPoint;
		if (l) {
			let e = l.call(document, t, o);
			e && (s = e.offsetNode, c = e.offset);
		} else if (document.caretRangeFromPoint) {
			let e = document.caretRangeFromPoint(t, o);
			e && (s = e.startContainer, c = e.startOffset);
		}
		let u = s && i.contains(s) ? {
			block: e,
			offset: Se(i, s, c)
		} : {
			block: e,
			offset: r === "top" ? Ie(e) : n[e].source.length
		};
		U(u), G({
			anchor: u,
			focus: u
		});
	}, Ie = (e) => {
		let t = n[e];
		return t.kind === "code" || t.kind === "divider" ? 0 : t.prefix;
	}, Q = () => {
		s = null;
		for (let e of C()) e.removeAttribute("data-selected");
	}, $ = (e, t = e) => {
		s = L(n, e, t);
		let r = Math.min(s.anchor, s.focus), i = Math.max(s.anchor, s.focus);
		U({
			block: r,
			offset: 0
		}, {
			block: i,
			offset: n[i].source.length
		}), G(), C().forEach((e, t) => e.toggleAttribute("data-selected", t >= r && t <= i));
	}, Le = (e, t) => {
		let r = Math.min(t.anchor, t.focus), i = Math.max(t.anchor, t.focus), a = e === "delete" ? z(n, t) : e === "duplicate" ? B(n, t) : ae(n, t, e === "up" ? -1 : 1);
		a && (J(a.blocks, a.caret, a.caret, "edit"), e !== "delete" && $(a.caret.block, a.caret.block + i - r));
	}, Re = (e) => {
		if (o || r || a || e.isComposing || e.defaultPrevented) return;
		let t = e.target.closest?.(".aa-caption");
		if (t) {
			if ((Me ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "a") {
				e.preventDefault();
				let n = document.createRange();
				n.selectNodeContents(t);
				let r = window.getSelection();
				r?.removeAllRanges(), r?.addRange(n);
				return;
			}
			(e.key === "Enter" || e.key === "Escape") && (e.preventDefault(), e.target.blur());
			return;
		}
		let i = Me ? e.metaKey : e.ctrlKey;
		if (i && !e.altKey && e.key.toLowerCase() === "z") {
			e.preventDefault(), e.shiftKey ? we() : xe();
			return;
		}
		if (i && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "y") {
			e.preventDefault(), we();
			return;
		}
		let l = P();
		if (!l) return;
		let u = e.key.toLowerCase();
		if (c = !1, i && e.shiftKey && u === "v") {
			c = !0;
			return;
		}
		if (e.key === "Escape") {
			e.preventDefault(), $(l.focus.block);
			return;
		}
		if (i && u === "a" && !e.altKey) {
			e.preventDefault();
			let t = n[l.focus.block], r = t.kind === "table" && !s ? W(t.source).flat().find((e) => l.focus.offset >= e.from && l.focus.offset <= e.to) : null;
			r && (l.anchor.offset !== r.from || l.focus.offset !== r.to) ? (U({
				block: l.focus.block,
				offset: r.from
			}, {
				block: l.focus.block,
				offset: r.to
			}), G()) : s ? $(0, n.length - 1) : $(l.focus.block);
			return;
		}
		let d = s ?? L(n, l.anchor.block, l.focus.block), f = n[l.focus.block];
		if (f.kind === "table" && !i && !e.shiftKey && l.anchor.offset === l.focus.offset && /^Arrow/.test(e.key)) {
			let t = W(f.source), n = t.flat(), r = n.findIndex((e) => l.focus.offset >= e.from && l.focus.offset <= e.to), i = n[r], a;
			if (i && e.key === "ArrowLeft" && l.focus.offset === i.from && (a = n[r - 1]), i && e.key === "ArrowRight" && l.focus.offset === i.to && (a = n[r + 1]), i && (e.key === "ArrowUp" || e.key === "ArrowDown") && (a = n[r + (e.key === "ArrowUp" ? -t[0].length : t[0].length)]), a) {
				e.preventDefault();
				let t = {
					block: l.focus.block,
					offset: e.key === "ArrowLeft" ? a.to : a.from
				};
				C()[t.block].querySelectorAll("[data-cell]")[n.indexOf(a)]?.focus(), U(t);
				return;
			}
		}
		if (e.key === "Tab" && !i && !e.altKey) {
			let t = n[l.focus.block];
			if (t.kind === "table") {
				e.preventDefault();
				let n = W(t.source).flat(), r = n[n.findIndex((e) => l.focus.offset >= e.from && l.focus.offset <= e.to) + (e.shiftKey ? -1 : 1)];
				if (r) {
					let e = {
						block: l.focus.block,
						offset: r.from
					};
					U(e), C()[e.block].querySelectorAll("[data-cell]")[n.indexOf(r)]?.focus(), U(e);
				} else e.shiftKey || ke(l);
				return;
			}
			if (t.kind === "bullet") {
				e.preventDefault();
				let t = V(n, d, e.shiftKey ? -1 : 1);
				t && J(t.blocks, t.caret, t.caret, "edit");
				return;
			}
		}
		if (i && e.altKey && u === "t") {
			e.preventDefault();
			let t = n;
			for (let e = 0; e < t.length; e++) t = H(t, e, !0)?.blocks ?? t;
			J(t, l.anchor, l.focus, "edit");
			return;
		}
		if (i && u === "d" && !e.altKey) {
			e.preventDefault(), Le("duplicate", d);
			return;
		}
		if (i && e.shiftKey && (u === "arrowup" || u === "arrowdown")) {
			e.preventDefault(), Le(u === "arrowup" ? "up" : "down", d);
			return;
		}
		let p = /^Digit[0-9]$/.test(e.code) ? Number(e.code.slice(-1)) : /^\d$/.test(u) ? Number(u) : -1;
		if (i && e.altKey && p >= 0) {
			let t = [
				"paragraph",
				"h1",
				"h2",
				"h3",
				"todo",
				"bullet",
				"numbered",
				"quote",
				"code"
			][p];
			if (t) {
				e.preventDefault();
				let r = R(n, d, t);
				J(r.blocks, r.caret, r.caret, "edit");
			}
			return;
		}
		if (i && e.key === "Enter") {
			e.preventDefault();
			let t = I(n, l.focus.block) ?? H(n, l.focus.block);
			t && J(t.blocks, t.caret, t.caret, "edit");
			return;
		}
		if (s) {
			if (u === "backspace" || u === "delete") {
				e.preventDefault(), Le("delete", s);
				return;
			}
			if (u === "arrowup" || u === "arrowdown") {
				e.preventDefault();
				let t = s.focus + (u === "arrowup" ? -1 : 1);
				$(e.shiftKey ? s.anchor : t, t);
				return;
			}
			if (u === "arrowleft" || u === "arrowright" || u === "enter") {
				e.preventDefault();
				let t = s.focus;
				Q();
				let r = {
					block: t,
					offset: u === "arrowright" ? n[t].source.length : Ie(t)
				};
				C()[t].focus(), U(r), G();
				return;
			}
		}
		if (!i && !e.altKey && e.shiftKey && (u === "arrowup" || u === "arrowdown")) {
			e.preventDefault(), $(l.anchor.block, l.focus.block + (u === "arrowup" ? -1 : 1));
			return;
		}
		if (e.key === "Enter" && !i && !e.altKey) {
			e.preventDefault(), ke(l, e.shiftKey);
			return;
		}
		if (i && !e.altKey) {
			let t = e.key.toLowerCase();
			if (t === "b" && !e.shiftKey) {
				e.preventDefault(), Z(l, "**");
				return;
			}
			if (t === "i" && !e.shiftKey) {
				e.preventDefault(), Z(l, "*");
				return;
			}
			if (t === "e" && !e.shiftKey) {
				e.preventDefault(), Z(l, "`");
				return;
			}
			if ((t === "x" || t === "s") && e.shiftKey) {
				e.preventDefault(), Z(l, "~~");
				return;
			}
			if (t === "k" && !e.shiftKey) {
				e.preventDefault(), Ne(l);
				return;
			}
			return;
		}
		if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey || j(l.anchor, l.focus) !== 0) return;
		let { block: m, offset: h } = l.focus, g = C()[m];
		if (e.key === "ArrowLeft" && h === 0 && m > 0) {
			e.preventDefault();
			let t = {
				block: m - 1,
				offset: n[m - 1].source.length
			};
			U(t), G({
				anchor: t,
				focus: t
			});
		} else if (e.key === "ArrowRight" && h === n[m].source.length && m + 1 < n.length) {
			e.preventDefault();
			let t = {
				block: m + 1,
				offset: Ie(m + 1)
			};
			U(t), G({
				anchor: t,
				focus: t
			});
		} else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
			let t = e.key === "ArrowUp";
			if (t ? m === 0 : m + 1 >= n.length) return;
			let r = Pe(), i = g.getBoundingClientRect();
			if (!r) return;
			let a = r.height || parseFloat(getComputedStyle(g).lineHeight) || 16;
			if (!(t ? r.top - i.top < a * .75 : i.bottom - r.bottom < a * .75)) return;
			e.preventDefault(), Fe(t ? m - 1 : m + 1, r.left, t ? "bottom" : "top");
		}
	}, ze = (e) => {
		if (e.target.closest?.(".aa-caption")) return;
		let t = P();
		!t || !e.clipboardData || j(t.anchor, t.focus) === 0 || (e.preventDefault(), e.clipboardData.setData("text/plain", ee(n, t.anchor, t.focus)), e.type === "cut" && !r && (s ? Le("delete", s) : X(t, "")));
	}, Be = (t) => {
		Q();
		let i = t.target, a = i?.closest?.("a.aa-link");
		if (a && e.contains(a)) {
			t.metaKey || t.ctrlKey || r ? (t.preventDefault(), window.open(a.href, "_blank", "noopener,noreferrer")) : t.preventDefault();
			return;
		}
		let o = i?.closest?.(".aa-block");
		if (!o || o.parentElement !== e || r) return;
		let s = C().indexOf(o), c = n[s];
		if (c.kind === "callout" && t.clientX - o.getBoundingClientRect().left < parseFloat(getComputedStyle(o).paddingLeft)) {
			t.preventDefault();
			let e = H(n, s);
			e && J(e.blocks, e.caret, e.caret, "edit");
			return;
		}
		if (c.kind !== "bullet" || c.checked === void 0) return;
		let l = o.getBoundingClientRect(), u = parseFloat(getComputedStyle(o).paddingLeft);
		if (t.clientX - l.left > u) return;
		t.preventDefault();
		let d = I(n, s);
		d && J(d.blocks, d.caret, d.caret, "edit");
	}, Ve = () => {
		let e = 0;
		return n.map((t, n) => {
			let r = e, i = e + t.source.length;
			return e = i + me(n), JSON.stringify(l.filter((e) => e.from <= i && e.to >= r).map((e) => ({
				...e,
				from: e.from - r,
				to: e.to - r
			})));
		});
	}, He = null, Ue = (e) => {
		He = null;
		let t = P(), r = C(), i = Ve(), a = !1;
		n.forEach((n, o) => {
			e[o] !== i[o] && (y(r[o], n, le(o, t)), a = !0);
		}), a && (t && U(t.anchor, t.focus), v());
	}, We = () => {
		a = !0;
	}, Ge = (t) => {
		if (a = !1, t.target.closest?.(".aa-caption")) {
			Oe(t);
			return;
		}
		let n = t.target?.closest?.(".aa-block");
		n && n.parentElement === e && Y(n), He && Ue(He);
	}, Ke = () => {
		!o && !a && !ce && !document.activeElement?.closest?.(".aa-caption") && !window.getSelection()?.anchorNode?.parentElement?.closest(".aa-caption") && (G(), e.dispatchEvent(new Event("aa-selectionchange")));
	}, qe = () => Q(), Je = (e) => Array.from(e?.files ?? []), Ye = (e) => {
		if (e.target.closest?.(".aa-caption")) return;
		let i = c;
		if (c = !1, r || o) return;
		let a = Je(e.clipboardData);
		if (a.length && t.onFiles) {
			e.preventDefault(), t.onFiles(a);
			return;
		}
		let l = P(), u = e.clipboardData?.getData("text/plain");
		if (!l || u === void 0) return;
		e.preventDefault();
		let [d, f] = M(l.anchor, l.focus), p = n[d.block];
		if (!i && !s && d.block === f.block && p.kind === "table" && u.includes("	")) {
			let e = W(p.source), t = e.findIndex((e) => e.some((e) => d.offset >= e.from && d.offset <= e.to)), r = t < 0 ? -1 : e[t].findIndex((e) => d.offset >= e.from && d.offset <= e.to);
			if (t >= 0 && r >= 0) {
				let i = e.map((e) => e.map((e) => e.text));
				u.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n").map((e) => e.split("	")).forEach((e, n) => {
					let a = i[t + n] ?? (i[t + n] = []);
					e.forEach((e, t) => {
						a[r + t] = e;
					});
				});
				let a = de(i, ue(p.source)), o = W(a)[t][r], s = N(n, {
					block: d.block,
					offset: 0
				}, {
					block: d.block,
					offset: p.source.length
				}, a), c = {
					block: d.block,
					offset: o.to
				};
				J(s.blocks, c, c, "edit");
				return;
			}
		}
		!i && d.block === f.block && d.offset !== f.offset && /^https?:\/\/[^\s<>]+$/i.test(u.trim()) ? Z(l, "[", `](${u.trim().replace(/\(/g, "%28").replace(/\)/g, "%29")})`) : X(l, (i ? null : fe(u)) ?? u.replace(/\r\n?/g, "\n"));
	}, Xe = (e) => {
		e.preventDefault();
		let n = Je(e.dataTransfer);
		if (!n.length || !t.onFiles || r || o) return;
		let i = document.caretRangeFromPoint?.(e.clientX, e.clientY), a = i ? k(i.startContainer) : -1;
		if (i && a >= 0) {
			let e = {
				block: a,
				offset: Se(C()[a], i.startContainer, i.startOffset)
			};
			C()[a].focus({ preventScroll: !0 }), U(e);
		}
		t.onFiles(n);
	};
	e.addEventListener("beforeinput", Ee), e.addEventListener("input", Oe), e.addEventListener("keydown", Re), e.addEventListener("copy", ze), e.addEventListener("cut", ze), e.addEventListener("click", Be), e.addEventListener("pointerdown", qe), e.addEventListener("drop", Xe), e.addEventListener("paste", Ye), e.addEventListener("compositionstart", We), e.addEventListener("compositionend", Ge), document.addEventListener("selectionchange", Ke), E();
	let Ze = Ae(e), Qe = (t) => {
		if (t !== r) {
			r = t, S(), Q();
			for (let e of C()) e.contentEditable = t || e.dataset.kind === "table" ? "false" : "true", e.dataset.readonly = String(t), e.querySelectorAll("[data-cell], .aa-caption").forEach((e) => e.contentEditable = t ? "false" : "true");
			e.dispatchEvent(new Event("aa-change"));
		}
	}, $e = {
		element: e,
		get value() {
			return A(n);
		},
		set value(t) {
			if (A(n) === t) return;
			let r = e.contains(document.activeElement) ? P() : null, i = n, a = D(t), o = (e, t) => JSON.stringify(e) === JSON.stringify(t), s = 0;
			for (; s < i.length && s < a.length && o(i[s], a[s]);) s++;
			let c = 0;
			for (; c < i.length - s && c < a.length - s && o(i[i.length - 1 - c], a[a.length - 1 - c]);) c++;
			let l = [
				...i.slice(0, s),
				...a.slice(s, a.length - c),
				...i.slice(i.length - c)
			];
			Q(), O(l);
			let u = (e) => {
				let t = e.block < s ? e.block : e.block >= i.length - c ? e.block + l.length - i.length : Math.min(e.block, l.length - 1);
				return {
					block: t,
					offset: Math.min(e.offset, l[t].source.length)
				};
			}, d = r ? u(r.anchor) : {
				block: 0,
				offset: 0
			}, f = r ? u(r.focus) : d;
			r && (U(d, f), G({
				anchor: d,
				focus: f
			})), x.reset({
				blocks: n,
				anchor: d,
				focus: f
			});
		},
		get readOnly() {
			return r;
		},
		set readOnly(e) {
			Qe(e);
		},
		get placeholder() {
			return i;
		},
		set placeholder(e) {
			i = e, T(), S();
		},
		focus() {
			let e = n.length - 1;
			C()[e]?.focus({ preventScroll: !0 });
			let t = {
				block: e,
				offset: n[e].source.length
			};
			U(t), G({
				anchor: t,
				focus: t
			});
		},
		blur() {
			document.activeElement?.blur();
		},
		selection() {
			let e = P();
			if (!e) return null;
			let [t, n] = M(e.anchor, e.focus);
			return {
				start: K(t),
				end: K(n)
			};
		},
		replace(t, r, i) {
			if (o) return;
			let { blocks: a, caret: s } = N(n, q(Math.min(t, r)), q(Math.max(t, r)), i);
			J(a, s, s, "edit"), e.contains(document.activeElement) || (C()[s.block]?.focus({ preventScroll: !0 }), U(s));
		},
		undo: xe,
		redo: we,
		activeBlock() {
			let e = P();
			if (!e) return null;
			let t = e.focus.block;
			return {
				index: t,
				block: n[t],
				start: K({
					block: t,
					offset: 0
				}),
				end: K({
					block: t,
					offset: n[t].source.length
				})
			};
		},
		selectBlocks: $,
		format(e) {
			if (r) return;
			let t = P();
			if (t) {
				if (e === "link") {
					Ne(t);
					return;
				}
				Z(t, {
					bold: "**",
					italic: "*",
					strike: "~~",
					code: "`",
					link: "[",
					equation: "$",
					highlight: "=="
				}[e]);
			}
		},
		turnInto(e) {
			if (r) return;
			let t = P();
			if (!t) return;
			let i = R(n, s ?? L(n, t.anchor.block, t.focus.block), e);
			J(i.blocks, i.caret, i.caret, "edit");
		},
		blockAction(e) {
			if (r) return;
			let t = P();
			t && Le(e, s ?? L(n, t.anchor.block, t.focus.block));
		},
		moveBlock(e, t) {
			if (r || e < 0 || t < 0 || e >= n.length || t >= n.length || e === t) return;
			let i = [...n], a = i.splice(e, 1)[0];
			i.splice(t, 0, a);
			let o = {
				block: t,
				offset: a.prefix
			};
			J(i, o, o, "edit"), $(t);
		},
		indent(e) {
			if (r) return;
			let t = P();
			if (!t) return;
			let i = V(n, s ?? L(n, t.anchor.block, t.focus.block), e);
			i && J(i.blocks, i.caret, i.caret, "edit");
		},
		toggle(e) {
			if (r) return;
			let t = P();
			if (!t) return;
			let i = H(n, t.focus.block, e) ?? I(n, t.focus.block);
			i && J(i.blocks, i.caret, i.caret, "edit");
		},
		table(e) {
			if (r) return;
			let t = P();
			if (!t) return;
			let i = t.focus.block, a = n[i];
			if (a.kind !== "table") return;
			let o = W(a.source), s = 0, c = 0;
			o.forEach((e, n) => e.forEach((e, r) => {
				t.focus.offset >= e.from && t.focus.offset <= e.to && (s = n, c = r);
			}));
			let l = pe(a, e, s, c), u = N(n, {
				block: i,
				offset: 0
			}, {
				block: i,
				offset: a.source.length
			}, l), d = {
				block: i,
				offset: W(l)[Math.min(s, W(l).length - 1)][Math.min(c, W(l)[0].length - 1)].from
			};
			J(u.blocks, d, d, "edit");
		},
		insertFile(e) {
			!r && !o && t.onFiles?.([e]);
		},
		decorate(e, t = "external") {
			let n = He ?? Ve();
			if (u.set(t, e.map((e) => ({ ...e }))), l = [...u.values()].flat(), a) {
				He = n;
				return;
			}
			Ue(n);
		},
		stats() {
			let e = n.flatMap((e) => e.kind === "code" ? [] : [e.source.slice(e.prefix)]).join(" ").replace(/[*_~`#>|=$\[\]()]/g, " ");
			return {
				words: typeof Intl.Segmenter == "function" ? [...new Intl.Segmenter(void 0, { granularity: "word" }).segment(e)].filter((e) => e.isWordLike).length : e.match(/\S+/g)?.length ?? 0,
				characters: [...A(n)].length,
				blocks: n.length
			};
		},
		find(e, t = !1) {
			if (!e) return [];
			let r = t ? A(n) : A(n).toLocaleLowerCase(), i = t ? e : e.toLocaleLowerCase(), a = [];
			for (let t = r.indexOf(i); t >= 0; t = r.indexOf(i, t + i.length)) a.push({
				start: t,
				end: t + e.length
			});
			return a;
		},
		selectRange(e, t = e) {
			let n = q(e), r = q(t);
			Q(), C()[n.block].focus(), U(n, r), G({
				anchor: n,
				focus: r
			});
		},
		transaction(r) {
			let i = A(n);
			f++;
			try {
				r();
			} finally {
				if (f--, !f && A(n) !== i) {
					let r = P() ?? {
						anchor: {
							block: 0,
							offset: 0
						},
						focus: {
							block: 0,
							offset: 0
						}
					};
					x.record(ve(r.anchor, r.focus), "edit"), t.onChange?.(A(n)), e.dispatchEvent(new Event("aa-change"));
				}
			}
		},
		setHistoryProvider(e) {
			m = e;
		},
		destroy() {
			o = !0, Ze(), d(), e.removeEventListener("beforeinput", Ee), e.removeEventListener("input", Oe), e.removeEventListener("keydown", Re), e.removeEventListener("copy", ze), e.removeEventListener("cut", ze), e.removeEventListener("click", Be), e.removeEventListener("pointerdown", qe), e.removeEventListener("drop", Xe), e.removeEventListener("paste", Ye), e.removeEventListener("compositionstart", We), e.removeEventListener("compositionend", Ge), document.removeEventListener("selectionchange", Ke), v(!0);
		}
	};
	return d = De($e, t), $e;
}
//#endregion
//#region src/element.ts
var Ne = class extends (typeof HTMLElement > "u" ? class {} : HTMLElement) {
	static observedAttributes = ["readonly", "placeholder"];
	#editor = null;
	#pending = null;
	#options = {};
	get options() {
		return this.#options;
	}
	set options(e) {
		this.#options = e;
	}
	constructor() {
		super();
		for (let e of [
			"options",
			"value",
			"readOnly"
		]) {
			let t = Object.getOwnPropertyDescriptor(this, e);
			t && (Reflect.deleteProperty(this, e), Reflect.set(this, e, t.value));
		}
	}
	connectedCallback() {
		this.#editor ||= Z(this, {
			...this.options,
			value: this.#pending ?? this.getAttribute("value") ?? "",
			readOnly: this.hasAttribute("readonly"),
			placeholder: this.getAttribute("placeholder") ?? "",
			toolbar: this.options.toolbar ?? this.hasAttribute("toolbar"),
			onChange: (e) => {
				this.options.onChange?.(e), this.dispatchEvent(new Event("input", { bubbles: !0 }));
			}
		});
	}
	disconnectedCallback() {
		this.#pending = this.#editor?.value ?? this.#pending, this.#editor?.destroy(), this.#editor = null;
	}
	attributeChangedCallback(e, t, n) {
		this.#editor && (e === "readonly" && (this.#editor.readOnly = n !== null), e === "placeholder" && (this.#editor.placeholder = n ?? ""));
	}
	get value() {
		return this.#editor ? this.#editor.value : this.#pending ?? this.getAttribute("value") ?? "";
	}
	set value(e) {
		this.#editor ? this.#editor.value = e : this.#pending = e;
	}
	get readOnly() {
		return this.hasAttribute("readonly");
	}
	set readOnly(e) {
		this.toggleAttribute("readonly", e);
	}
	focus() {
		this.#editor?.focus();
	}
	undo() {
		return this.#editor?.undo() ?? !1;
	}
	redo() {
		return this.#editor?.redo() ?? !1;
	}
	get editor() {
		return this.#editor;
	}
};
function Pe(e = "aa-editor") {
	customElements.get(e) || customElements.define(e, Ne);
}
//#endregion
//#region src/plain.ts
function Fe(e, t = {}) {
	let n = document.createElement("div");
	n.className = "aa-block", n.contentEditable = t.readOnly ? "false" : "plaintext-only", n.spellcheck = !1, n.textContent = t.value ?? e.textContent ?? "", e.classList.add("aa", "aa-plain"), e.setAttribute("role", "textbox"), e.setAttribute("aria-multiline", "true"), e.replaceChildren(n);
	let r = () => t.onChange?.(n.innerText), i = () => n.focus({ preventScroll: !0 }), a = (t) => {
		t.target === e && i();
	};
	n.addEventListener("input", r), e.addEventListener("click", a);
	let o = Ae(e);
	return {
		element: e,
		get value() {
			return n.innerText;
		},
		set value(e) {
			n.innerText !== e && (n.textContent = e);
		},
		get readOnly() {
			return n.contentEditable === "false";
		},
		set readOnly(e) {
			let t = e ? "false" : "plaintext-only";
			n.contentEditable !== t && (n.contentEditable = t);
		},
		focus: i,
		destroy() {
			o(), n.removeEventListener("input", r), e.removeEventListener("click", a);
		}
	};
}
//#endregion
export { Ne as AaEditorElement, Te as AaToolbarElement, m as DEFAULT_ATOMS, p as EQUATION, se as History, f as IMAGE, he as atomElement, d as atomPattern, E as blockRuns, Z as createEditor, Fe as createPlainEditor, Pe as defineAaEditor, X as defineAaToolbar, z as deleteBlocks, B as duplicateBlocks, pe as editTable, D as fromMarkdown, fe as fromTSV, je as imageAtom, V as indentBlocks, ie as joinWithNext, re as joinWithPrevious, ne as liftPrefix, ae as moveBlocks, s as parseBlocks, oe as renumber, N as replaceRange, L as select, c as serialize, ee as sliceMarkdown, te as splitAt, ue as tableAlignments, W as tableRows, A as toMarkdown, I as toggleBox, H as toggleCallout, R as turnInto, F as wrapSelection, de as writeTable };

