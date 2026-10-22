//#region src/diagram-language.ts
var e = [
	"light-green",
	"light-blue",
	"pink",
	"yellow",
	"orange",
	"red",
	"white"
], t = 4, n = 40, r = 2, i = 12, a = 12, o = 7, s = 2, c = 200;
function l(e) {
	return e === void 0 || !Number.isFinite(e) ? 4 : Math.max(4, Math.min(40, Math.floor(e / 4) * 4));
}
var u = (e) => Math.round(e / 4) * 4, d = (e) => Math.round(e / 2) * 2, f = (e) => Math.ceil(e / 2) * 2, p = /^ {0,3}(`{3,}|~{3,})[ \t]*diagram(?:[ \t]+[^`\n]*?)?[ \t]*$/i, ee = /^#{1,4}[ \t]+(.+)$/, te = /^\/\//, ne = /[ \t]+(<->|->|<-|--)[ \t]+/, m = /[ \t]+@[ \t]*(\d{1,3})(?:[ \t]*,[ \t]*|[ \t]+)(\d{1,3})(?=[ \t]|$)/, h = /[ \t]+w(\d{1,2})(?=[ \t]|$)/i, g = RegExp(`[ \\t]+(${e.join("|")})(?=[ \\t]|$)`, "i"), re = RegExp(`^(.*\\S)[ \\t]+(${e.join("|")})$`, "i"), _ = /[ \t]+h(\d{1,2})(?=[ \t]|$)/i, ie = /^\[(.+)\]$/, ae = /^\{(.+)\}$/, oe = /^[-*+][ \t]+(.*)$/, v = /(?:^|[ \t]+)\(([1-9]\d{3})-(0?[1-9]|1[0-2])(?:[ \t]+(marker))?\)(?=[ \t]|$)/i, y = /(?:^|[ \t]+)\(([1-9]\d?)[x×]([1-9]\d?)(?:[ \t]+(marker))?\)(?=[ \t]|$)/i, b = /(?:^|[ \t]+)\(chart[ \t]+([1-9]\d?)[x×]([1-9]\d?)\)(?=[ \t]|$)/i, se = RegExp(`^(${e.join("|")})((?:[ \\t,]+-?\\d+(?:\\.\\d+)?)+)$`, "i"), ce = /^-?\d+(?:\.\d+)?(?:[ \t,]+-?\d+(?:\.\d+)?)*$/, x = 1, le = 2, S = 1, ue = RegExp(`^(${e.join("|")})((?:[ \\t,]+\\d{1,2}(?:-\\d{1,2})?(?::\\d{1,2}(?:-\\d{1,2})?)?)+)$`, "i"), C = 60;
function w(e) {
	let t = Math.max(0, ...e.map((e) => [...e].length));
	return t <= 3 ? 1 : Math.ceil(t * .32 + .75);
}
var de = RegExp(`^(${e.join("|")})((?:[ \\t,]+\\d{1,2}(?:-\\d{1,2})?)+)$`, "i");
function T(e, t) {
	return {
		first: (new Date(Date.UTC(e, t - 1, 1)).getUTCDay() + 6) % 7,
		count: new Date(Date.UTC(e, t, 0)).getUTCDate()
	};
}
function E(e) {
	let t = e.replace(/\r\n?/g, "\n").trim().split("\n");
	if (t.length < 2) return !1;
	let n = p.exec(t[0]);
	if (!n) return !1;
	let r = t[t.length - 1].trim();
	return r[0] === n[1][0] && /^(`{3,}|~{3,})$/.test(r) && r.length >= n[1].length;
}
function D(e) {
	return /^ {0,3}(?:`{3,}|~{3,})[ \t]*diagram\b[^\n]*[ \t]wrap\b/i.test(e.split("\n")[0] ?? "");
}
function O(e, t) {
	let n = e.replace(/[ \t]+wrap\b/i, "");
	return t ? `${n.trimEnd()} wrap` : n;
}
function k(e) {
	return e.replace(/\r\n?/g, "\n").trim().split("\n").slice(1, -1).join("\n");
}
function A(e) {
	let t = e.replace(/\r\n?/g, "\n").split("\n"), n = [], r = null;
	for (let e = 0; e < t.length; e++) {
		let i = /^ {0,3}(`{3,}|~{3,})/.exec(t[e]);
		if (r) {
			i && i[1][0] === r[0] && i[1].length >= r.length && !t[e].trim().slice(i[1].length).trim() && (r = null);
			continue;
		}
		let a = p.exec(t[e]);
		if (a) {
			let r = a[1], i = t.findIndex((t, n) => n > e && RegExp(`^ {0,3}${r[0] === "`" ? "`" : "~"}{${r.length},}[ \t]*$`).test(t));
			if (i < 0) break;
			n.push({
				start: e,
				end: i
			}), e = i;
		} else i && (r = i[1]);
	}
	return n;
}
function j(e) {
	let t = e.replace(/\r\n?/g, "\n").split("\n"), n = t.length;
	for (let { start: r, end: i } of A(e)) n += Math.max(1, L(t.slice(r + 1, i).join("\n")).rows) - (i - r + 1);
	return Math.max(1, n);
}
function M(e) {
	let t = e.replace(/\r\n?/g, "\n").split("\n"), n = 0;
	for (let { start: r, end: i } of A(e)) n = Math.max(n, L(t.slice(r + 1, i).join("\n")).columns);
	return Math.ceil(n / 4);
}
function N(e) {
	return Math.max(1, L(k(e)).rows);
}
function P(e, t) {
	let { first: n, count: r } = T(e, t);
	return Math.ceil((n + r) / 7);
}
var F = (e, t = c) => Math.max(0, Math.min(t, e)), I = (e) => e.trim().toLowerCase();
function L(e, t, n = {}) {
	let r = [], i = [], a = [], o = [], p, C;
	e.replace(/\r\n?/g, "\n").split("\n").forEach((e, t) => {
		let n = t + 1, r = e.replace(/\t/g, "  "), s = r.trim();
		if (!s || te.test(s)) return;
		let d = ee.exec(s);
		if (d && p === void 0 && !i.length) {
			p = d[1].trim();
			return;
		}
		let f = /^\s/.test(r), x = oe.exec(s);
		if ((f || x) && C) {
			if (C.end = n, C.postIt) {
				o.push(n);
				return;
			}
			if (C.month) {
				let e = (x ? x[1] : s).trim(), t = de.exec(e), r = e.split(/[ \t]+/);
				if (t) {
					let e = t[1].toLowerCase();
					for (let n of t[2].split(/[ \t,]+/).filter(Boolean)) {
						let [t, r = t] = n.split("-").map(Number);
						for (let n = t; n <= r; n++) C.month.marks.set(n, e);
					}
				} else r.length === 7 && !C.month.names ? C.month.names = r : o.push(n);
				return;
			}
			if (C.chart) {
				let e = C.chart, t = (x ? x[1] : s).trim(), r = se.exec(t);
				r ? e.series.push({
					color: r[1].toLowerCase(),
					values: r[2].split(/[ \t,]+/).filter(Boolean).map(Number)
				}) : e.across ? ce.test(t) && !e.down ? e.down = t.split(/[ \t,]+/).map(Number) : o.push(n) : e.across = t.split(/[ \t]+/);
				return;
			}
			if (C.grid) {
				let e = C.grid, t = (x ? x[1] : s).trim(), r = ue.exec(t), i = t.split(/[ \t]+/);
				if (r) {
					let t = r[1].toLowerCase();
					for (let n of r[2].split(/[ \t,]+/).filter(Boolean)) {
						let [r, i = `1-${e.rows}`] = n.split(":"), [a, o = a] = r.split("-").map(Number), [s, c = s] = i.split("-").map(Number);
						for (let n = Math.max(1, a); n <= Math.min(e.columns, o); n++) for (let r = Math.max(1, s); r <= Math.min(e.rows, c); r++) e.marks.set(`${n}:${r}`, t);
					}
				} else i.length === e.columns && !e.across ? e.across = i : (i.length === e.rows || i.length === e.rows + 1) && !e.down ? e.down = i : o.push(n);
				return;
			}
			let e = (x ? x[1] : s).trim();
			if (!e) return;
			let t = re.exec(e);
			C.boxes.push((t ? t[1] : e).replace(ie, "$1")), C.boxLines.push(n), t && ((C.tints ??= [])[C.boxes.length - 1] = t[2].toLowerCase());
			return;
		}
		if (ne.test(s)) {
			let e = s.split(ne);
			for (let t = 0; t + 2 < e.length; t += 2) {
				let r = e[t + 1], i = e[t].trim(), o = e[t + 2].trim();
				i && o && (a.push({
					from: i,
					to: o,
					arrow: r !== "--",
					reverse: r === "<-",
					line: n
				}), r === "<->" && a.push({
					from: o,
					to: i,
					arrow: !0,
					reverse: !1,
					line: n
				}));
			}
			C = void 0;
			return;
		}
		let w = s, T, E, D, O, k = m.exec(` ${w}`);
		k && (T = F(Number(k[1])), E = F(Number(k[2])), w = ` ${w}`.replace(m, "").trim());
		let A = /^\{/.test(w) ? _.exec(` ${w}`) : null;
		A && (O = Math.max(1, Math.min(c, Number(A[1]))), w = ` ${w}`.replace(_, "").trim());
		let j = h.exec(` ${w}`);
		j && (D = Math.max(1, Math.min(40, Number(j[1]))), w = ` ${w}`.replace(h, "").trim());
		let M, N = g.exec(` ${w}`), P = ` ${w}`.replace(g, "").trim();
		N && (P || s.split(/[ \t]/)[0].toLowerCase() !== N[1].toLowerCase()) && (M = N[1].toLowerCase(), w = P);
		let I = ae.exec(w), L = ie.exec(w), R = v.exec(w);
		if (R) {
			C = {
				label: w.replace(v, "").trim() || void 0,
				boxes: [],
				boxLines: [],
				x: T,
				y: E,
				w: 7,
				month: {
					year: Number(R[1]),
					month: Number(R[2]),
					marks: /* @__PURE__ */ new Map(),
					...R[3] ? { marker: !0 } : {}
				},
				line: n,
				end: n
			}, i.push(C);
			return;
		}
		let z = b.exec(w);
		if (z) {
			let e = w.replace(b, "").trim(), t = Math.min(60, Number(z[1])), r = Math.min(60, Number(z[2]));
			C = {
				label: e || void 0,
				boxes: [],
				boxLines: [],
				x: T,
				y: E,
				w: 2 + t + le + S,
				chart: {
					columns: t,
					rows: r,
					series: []
				},
				line: n,
				end: n
			}, i.push(C);
			return;
		}
		let B = y.exec(w);
		if (B) {
			let e = w.replace(y, "").trim(), t = Math.min(60, Number(B[1])), r = Math.min(60, Number(B[2]));
			C = {
				label: e || void 0,
				boxes: [],
				boxLines: [],
				x: T,
				y: E,
				w: t,
				grid: {
					columns: t,
					rows: r,
					marks: /* @__PURE__ */ new Map(),
					...B[3] ? { marker: !0 } : {}
				},
				line: n,
				end: n
			}, i.push(C);
			return;
		}
		if (!w && T === void 0) {
			o.push(n);
			return;
		}
		let V = Math.max(4, u(D ?? O ?? 12)), H = l(D);
		C = I ? {
			label: I[1].trim(),
			boxes: [],
			boxLines: [],
			x: T,
			y: E,
			w: V,
			h: V,
			postIt: !0,
			color: M,
			line: n,
			end: n
		} : L ? {
			boxes: [L[1].trim()],
			boxLines: [n],
			x: T,
			y: E,
			w: H,
			color: M,
			line: n,
			end: n
		} : {
			label: w || void 0,
			boxes: [],
			boxLines: [],
			x: T,
			y: E,
			w: H,
			color: M,
			line: n,
			end: n
		}, i.push(C);
	});
	let E = [];
	for (let e of i) e.postIt && e.x !== void 0 && e.y !== void 0 && (e.x = u(e.x), E.push({
		x: e.x,
		y: e.y,
		w: e.w,
		h: e.h
	}));
	let D = (e, t) => E.some((n) => e >= n.x && e < n.x + n.w && t >= n.y && t < n.y + n.h), O = new Set(a.flatMap((e) => [I(e.from), I(e.to)])), k = (e) => e.label !== void 0 && O.has(I(e.label)) || e.boxes.some((t) => O.has(I(t)) || e.label !== void 0 && O.has(I(`${e.label}.${t}`))), A = p === void 0 ? 0 : 3, j = 0, M = A, N = A, L = /* @__PURE__ */ new Map(), z = /* @__PURE__ */ new Set();
	for (let e of i) {
		e.grid && (e.w = e.grid.columns + +!!e.grid.down);
		let t = e.chart ? S + +!!e.label + (e.label && e.chart.down ? 1 : 0) + e.chart.rows + 1 + S : e.month ? +!!e.label + +!!e.month.names + P(e.month.year, e.month.month) : e.grid ? +!!e.label + (e.grid.across ? w(e.grid.across) : 0) + e.grid.rows + (e.grid.down && e.grid.down.length > e.grid.rows ? 1 : 0) : e.h ?? Math.max(1, +!!e.label + e.boxes.length);
		e.x === void 0 || e.y === void 0 ? (z.add(e), j > 0 && j + e.w > 12 && (j = 0, M = N + s), e.x ??= j, e.y ??= M, j = f(e.x + e.w + s), N = Math.max(N, e.y + t)) : !e.postIt && !D(e.x, e.y) && k(e) && (e.x = d(e.x)), L.set(e, {
			x: e.x,
			y: e.y,
			w: e.w,
			h: t
		});
	}
	n.room !== void 0 && fe(i, L, n.room);
	let B = [], V = [], U = [], W = [], G = /* @__PURE__ */ new Map(), K = /* @__PURE__ */ new Map();
	for (let e of i) {
		let t = L.get(e);
		if (e.postIt) {
			W.push(e.color ? {
				text: e.label,
				...t,
				color: e.color
			} : {
				text: e.label,
				...t
			}), r.push({
				text: e.label,
				x: t.x + 1,
				y: t.y + 1,
				w: Math.max(1, t.w - 2)
			}), G.has(I(e.label)) || G.set(I(e.label), t);
			continue;
		}
		if (e.chart) {
			let n = t.y + S;
			e.label && (r.push({
				text: e.label,
				x: t.x + S,
				y: n,
				w: t.w - 2
			}), G.has(I(e.label)) || G.set(I(e.label), t), n += 1 + +!!e.chart.down), U.push({
				...R(e.chart, t.x + S + x, n),
				frame: t
			});
			continue;
		}
		let n = t.y;
		if (e.label && (r.push({
			text: e.label,
			x: t.x,
			y: n,
			w: t.w
		}), G.has(I(e.label)) || G.set(I(e.label), t), K.set(t, e.label), n++), e.month) {
			e.month.names && (e.month.names.forEach((e, r) => V.push({
				text: e,
				x: t.x + r,
				y: n,
				name: !0
			})), n++);
			let { first: r, count: i } = T(e.month.year, e.month.month);
			for (let a = 1; a <= i; a++) {
				let i = r + a - 1, o = {
					text: String(a),
					x: t.x + i % 7,
					y: n + Math.floor(i / 7)
				}, s = e.month.marks.get(a);
				V.push(s ? {
					...o,
					color: s,
					...e.month.marker ? { marker: !0 } : {}
				} : o);
			}
		} else if (e.grid) {
			let { columns: r, rows: i, marks: a, across: o, down: s } = e.grid, c = t.x + +!!s;
			if (o) {
				let e = w(o);
				o.forEach((t, r) => {
					let o = Array.from({ length: i }, (e, t) => a.has(`${r + 1}:${t + 1}`)).some(Boolean);
					if (e > 1) {
						V.push(o ? {
							text: t,
							x: c + r,
							y: n + e - 1,
							name: !0,
							slant: !0
						} : {
							text: t,
							x: c + r,
							y: n + e - 1,
							slant: !0
						});
						return;
					}
					let s = o ? {
						text: t,
						x: c + r,
						y: n,
						name: !0,
						head: !0
					} : {
						text: t,
						x: c + r,
						y: n,
						head: !0
					};
					r > 0 && (s.shared = { left: !0 }), V.push(s);
				}), n += e;
			}
			let l = !!s && s.length > i;
			s?.forEach((e, r) => V.push(l ? {
				text: e,
				x: t.x,
				y: n + r,
				name: !0,
				row: !0,
				edge: !0
			} : {
				text: e,
				x: t.x,
				y: n + r,
				name: !0,
				row: !0
			}));
			for (let t = 1; t <= r; t++) for (let r = 1; r <= i; r++) {
				let i = a.get(`${t}:${r}`);
				i && V.push({
					text: "",
					x: c + t - 1,
					y: n + r - 1,
					color: i,
					...e.grid.marker ? { marker: !0 } : {}
				});
			}
		} else for (let [r, i] of e.boxes.entries()) {
			let a = e.tints?.[r] ?? e.color;
			B.push(a ? {
				text: i,
				x: t.x,
				y: n,
				w: t.w,
				color: a
			} : {
				text: i,
				x: t.x,
				y: n,
				w: t.w
			});
			let o = {
				x: t.x,
				y: n,
				w: t.w,
				h: 1
			};
			G.has(I(i)) || G.set(I(i), e.label ? o : t), e.label && !G.has(I(`${e.label}.${i}`)) && G.set(I(`${e.label}.${i}`), o), n++;
		}
	}
	let q = (e, t) => e.x < t.x + t.w && t.x < e.x + e.w;
	for (let e of B) {
		let t = {};
		for (let n of B) n !== e && (n.y === e.y - 1 && q(e, n) && (t.top = !0), n.y === e.y + 1 && q(e, n) && (t.bottom = !0), n.y === e.y && n.x + n.w === e.x && (t.left = !0), n.y === e.y && e.x + e.w === n.x && (t.right = !0));
		Object.keys(t).length && (e.shared = t);
	}
	let J = V.filter((e) => e.color && !e.marker);
	for (let e of J) {
		let t = {};
		for (let n of J) n.x === e.x && n.y === e.y - 1 && (t.top = !0), n.x === e.x && n.y === e.y + 1 && (t.bottom = !0), n.y === e.y && n.x === e.x - 1 && (t.left = !0), n.y === e.y && n.x === e.x + 1 && (t.right = !0);
		Object.keys(t).length && (e.shared = t);
	}
	let Y = (e) => {
		let n = K.get(e), r = n === void 0 ? void 0 : t?.(n);
		if (r !== void 0 && Number.isFinite(r)) return e.x + Math.max(.5, Math.min(e.w - .5, Math.round(r) / 2));
	}, pe = a.map((e) => ({
		join: e,
		a: G.get(I(e.reverse ? e.to : e.from)),
		b: G.get(I(e.reverse ? e.from : e.to))
	})), X = /* @__PURE__ */ new Map();
	for (let { a: e, b: t } of pe) {
		if (!e || !t || e === t || X.has(e) || e.y + e.h > t.y) continue;
		let n = Math.max(e.x, t.x), r = Math.min(e.x + e.w, t.x + t.w), i = Y(t);
		r > n && i !== void 0 && X.set(e, Math.min(r - .5, Math.max(n + .5, i)));
	}
	let Z = [], me = [];
	for (let { join: e, a: t, b: n } of pe) !t || !n || t === n ? o.push(e.line) : (Z.push({
		segments: H(t, n, Y, X.get(t)),
		arrow: e.arrow
	}), me.push({
		line: e.line,
		from: e.from,
		to: e.to
	}));
	let Q = 0, $ = 0;
	for (let e of L.values()) Q = Math.max(Q, e.x + e.w), $ = Math.max($, e.y + e.h);
	p !== void 0 && (r.unshift({
		text: p,
		x: 0,
		y: 0,
		w: Math.max(Q, 4),
		title: !0
	}), Q = Math.max(Q, 4), $ = Math.max($, 1));
	for (let e of Z) for (let t of e.segments) Q = Math.max(Q, Math.ceil(Math.max(t.x1, t.x2))), $ = Math.max($, Math.ceil(Math.max(t.y1, t.y2)));
	let he = (e) => e.postIt ? "post-it" : e.month ? "month" : e.grid ? "grid" : e.chart ? "chart" : e.label === void 0 ? "box" : "stack", ge = i.map((e) => ({
		kind: he(e),
		line: e.line,
		end: e.end,
		...e.label === void 0 ? {} : { name: e.label },
		boxes: e.boxes.map((t, n) => {
			let r = e.tints?.[n];
			return r ? {
				text: t,
				line: e.boxLines[n],
				color: r
			} : {
				text: t,
				line: e.boxLines[n]
			};
		}),
		...L.get(e),
		placed: !z.has(e),
		...e.color ? { color: e.color } : {}
	}));
	return {
		columns: Q,
		rows: $,
		labels: r,
		postIts: W,
		boxes: B,
		days: V,
		charts: U,
		lines: Z,
		groups: ge,
		joins: me,
		unread: [...new Set(o)].sort((e, t) => e - t)
	};
}
function R(e, t, n) {
	let r = e.series.flatMap((e) => e.values).filter(Number.isFinite), i = Math.max(0, ...r), a = i > 0 ? 10 ** Math.floor(Math.log10(i)) : 1, o = e.down?.length ? [...e.down].sort((e, t) => e - t) : [0, Math.ceil(i / a) * a || 1], s = o[0], c = o[o.length - 1] > s ? o[o.length - 1] : s + 1, l = (t) => n + e.rows * (1 - (t - s) / (c - s)), u = (n, r) => t + (r > 1 ? e.columns * n / (r - 1) : 0), d = e.across ?? [], f = (e) => String(Math.round(e * 10) / 10);
	return {
		x: t,
		y: n,
		w: e.columns,
		h: e.rows,
		across: d.map((e, t) => ({
			text: e,
			at: u(t, d.length)
		})),
		down: (e.down?.length ? o : []).map((e) => ({
			text: f(e),
			at: l(e)
		})),
		series: B(e.series.filter((e) => e.values.length).map((e) => {
			let t = e.values.map((t, n) => ({
				x: u(n, e.values.length),
				y: l(t)
			}));
			return {
				color: e.color,
				points: t,
				end: f(e.values[e.values.length - 1]),
				endAt: t[t.length - 1].y
			};
		}))
	};
}
var z = .85;
function B(e) {
	let t = [...e].sort((e, t) => e.endAt - t.endAt), n = [];
	for (let e of t) for (n.push({
		items: [e],
		top: e.endAt
	}); n.length > 1;) {
		let e = n[n.length - 1], t = n[n.length - 2];
		if (t.top + t.items.length * z <= e.top) break;
		let r = [...t.items, ...e.items], i = r.reduce((e, t) => e + t.endAt, 0) / r.length;
		n.splice(-2, 2, {
			items: r,
			top: i - (r.length - 1) * z / 2
		});
	}
	for (let e of n) e.items.forEach((t, n) => {
		t.endAt = e.top + n * z;
	});
	return e;
}
function V(e, t) {
	return (e + t) / 2;
}
function H(e, t, n, r) {
	let i = Math.max(e.x, t.x), a = Math.min(e.x + e.w, t.x + t.w), o = Math.max(e.y, t.y), s = Math.min(e.y + e.h, t.y + t.h);
	if (s > o && a <= i) {
		let n = V(o, s);
		return [e.x < t.x ? {
			x1: e.x + e.w,
			y1: n,
			x2: t.x,
			y2: n
		} : {
			x1: e.x,
			y1: n,
			x2: t.x + t.w,
			y2: n
		}];
	}
	if (a > i && s > o) return [];
	let c = e.y < t.y, l = c ? e.y + e.h : e.y, u = c ? t.y : t.y + t.h, d = c ? n(t) : void 0, f = c ? void 0 : n(e), p = c ? r : void 0;
	if (a > i) {
		let e = Math.min(a - .5, Math.max(i + .5, d ?? f ?? p ?? V(i, a)));
		return [{
			x1: e,
			y1: l,
			x2: e,
			y2: u
		}];
	}
	return U(f ?? p ?? V(e.x, e.x + e.w), l, d ?? V(t.x, t.x + t.w), u);
}
function U(e, t, n, r) {
	let i = Math.round((t + r) / 2);
	return i === r && (i = t), [
		{
			x1: e,
			y1: t,
			x2: e,
			y2: i
		},
		{
			x1: e,
			y1: i,
			x2: n,
			y2: i
		},
		{
			x1: n,
			y1: i,
			x2: n,
			y2: r
		}
	].filter((e) => e.x1 !== e.x2 || e.y1 !== e.y2);
}
function fe(e, t, n) {
	let r = e.map((e) => t.get(e));
	if (!r.length || Math.max(...r.map((e) => e.x + e.w)) <= n) return;
	let i = e.filter((e) => e.postIt).map((e) => t.get(e)), a = (e) => i.find((t) => t !== e && e.x >= t.x && e.x < t.x + t.w && e.y >= t.y && e.y < t.y + t.h), o = /* @__PURE__ */ new Map();
	for (let e of r) {
		let t = a(e) ?? e;
		o.set(t, [...o.get(t) ?? [], e]);
	}
	let c = [...o.keys()].sort((e, t) => e.x - t.x || e.y - t.y), l = [];
	for (let e of c) {
		let t = l[l.length - 1];
		t && e.x + e.w - t.start <= n ? t.units.push(e) : l.push({
			start: e.x,
			units: [e]
		});
	}
	if (l.length < 2) return;
	let u = 0;
	l.forEach((e, t) => {
		let n = e.units.flatMap((e) => o.get(e)), r = Math.min(...n.map((e) => e.y)), i = t ? u + s - r : 0;
		for (let t of n) t.x -= e.start, t.y += i;
		u = Math.max(u, ...n.map((e) => e.y + e.h));
	});
}
//#endregion
export { t as DIAGRAM_BOX_WIDTH, e as DIAGRAM_COLORS, i as DIAGRAM_FLOW_COLUMNS, C as DIAGRAM_GRID_SIDE, n as DIAGRAM_MAX_WIDTH, o as DIAGRAM_MONTH_WIDTH, a as DIAGRAM_POST_IT_SIZE, r as DIAGRAM_STEP, N as diagramBlockRows, l as diagramBoxWidth, O as diagramFenceWrapped, A as diagramFences, M as diagramListColumns, k as diagramSource, D as diagramWraps, w as gridHeadRows, E as isDiagramBlock, L as layoutDiagram, j as writingLineRows };

