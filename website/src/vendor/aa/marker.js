//#region src/marker.ts
var e = "\n  <filter id=\"aa-marker\" x=\"-8%\" y=\"-8%\" width=\"116%\" height=\"116%\" color-interpolation-filters=\"sRGB\">\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.55\" numOctaves=\"2\" seed=\"7\" result=\"grain\"/>\n    <feColorMatrix in=\"grain\" type=\"luminanceToAlpha\" result=\"ga\"/>\n    <feComposite in=\"SourceGraphic\" in2=\"ga\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"-0.3\" k4=\"0\" result=\"inked\"/>\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.11\" numOctaves=\"2\" seed=\"11\" result=\"warp\"/>\n    <feDisplacementMap in=\"inked\" in2=\"warp\" scale=\"2.6\" xChannelSelector=\"R\" yChannelSelector=\"G\"/>\n  </filter>\n  <filter id=\"aa-marker-fine\" x=\"-12%\" y=\"-12%\" width=\"124%\" height=\"124%\" color-interpolation-filters=\"sRGB\">\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"1.1\" numOctaves=\"2\" seed=\"7\" result=\"grain\"/>\n    <feColorMatrix in=\"grain\" type=\"luminanceToAlpha\" result=\"ga\"/>\n    <feComposite in=\"SourceGraphic\" in2=\"ga\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"-0.3\" k4=\"0\" result=\"inked\"/>\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.22\" numOctaves=\"2\" seed=\"11\" result=\"warp\"/>\n    <feDisplacementMap in=\"inked\" in2=\"warp\" scale=\"1.3\" xChannelSelector=\"R\" yChannelSelector=\"G\"/>\n  </filter>\n  <filter id=\"aa-marker-rule\" x=\"-8%\" y=\"-50%\" width=\"116%\" height=\"200%\" color-interpolation-filters=\"sRGB\">\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.72\" numOctaves=\"2\" seed=\"5\" result=\"grain\"/>\n    <feColorMatrix in=\"grain\" type=\"luminanceToAlpha\" result=\"ga\"/>\n    <feComposite in=\"SourceGraphic\" in2=\"ga\" operator=\"arithmetic\" k1=\"0\" k2=\"1\" k3=\"-0.12\" k4=\"0\" result=\"inked\"/>\n    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.07\" numOctaves=\"2\" seed=\"3\" result=\"warp\"/>\n    <feDisplacementMap in=\"inked\" in2=\"warp\" scale=\"0.6\" xChannelSelector=\"R\" yChannelSelector=\"G\"/>\n  </filter>";
function t(e) {
	let t = e >>> 0 || 1;
	return () => (t ^= t << 13, t ^= t >>> 17, t ^= t << 5, (t >>> 0) / 4294967296);
}
function n(e, n) {
	let r = t(e), i = Array.from({ length: 3 }, (e, t) => ({
		frequency: (.6 + r()) / n / (t + 1),
		phase: r() * Math.PI * 2,
		weight: 1 / (t + 1)
	})), a = i.reduce((e, t) => e + t.weight, 0);
	return (e) => i.reduce((t, n) => t + Math.sin(e * n.frequency * Math.PI * 2 + n.phase) * n.weight, 0) / a;
}
function r(e, t) {
	if (e.length < 2) return e;
	let n = [];
	for (let r = 0; r < e.length - 1; r++) {
		let i = e[Math.max(0, r - 1)], a = e[r], o = e[r + 1], s = e[Math.min(e.length - 1, r + 2)], c = Math.max(1, Math.ceil(Math.hypot(o.x - a.x, o.y - a.y) / t));
		for (let e = 0; e < c; e++) {
			let t = e / c, r = t * t, l = r * t;
			n.push({
				x: .5 * (2 * a.x + (-i.x + o.x) * t + (2 * i.x - 5 * a.x + 4 * o.x - s.x) * r + (-i.x + 3 * a.x - 3 * o.x + s.x) * l),
				y: .5 * (2 * a.y + (-i.y + o.y) * t + (2 * i.y - 5 * a.y + 4 * o.y - s.y) * r + (-i.y + 3 * a.y - 3 * o.y + s.y) * l)
			});
		}
	}
	return n.push(e[e.length - 1]), n;
}
var i = (e) => Math.round(e * 10) / 10;
function a(e, a, o, { offset: s = 0, whole: c = !1 } = {}) {
	let l = r(e, 3);
	if (l.length < 2) return [];
	let u = t(o), d = n(Math.floor(u() * 1e9), 60), f = n(Math.floor(u() * 1e9), 60), p = n(Math.floor(u() * 1e9), 140), m = [0];
	for (let e = 1; e < l.length; e++) m.push(m[e - 1] + Math.hypot(l[e].x - l[e - 1].x, l[e].y - l[e - 1].y));
	let h = m[m.length - 1], g = c ? Infinity : 90 + u() * 50, _ = [];
	for (let e = 0; e < h - 3; e += g - 6) {
		let t = Math.min(h, e + g), n = [], r = [], o = a * .35;
		for (let i = 0; i < l.length; i++) {
			let c = m[i];
			if (c < e - o || c > t + o) continue;
			let u = l[Math.max(0, i - 1)], h = l[Math.min(l.length - 1, i + 1)], g = h.x - u.x, _ = h.y - u.y, v = Math.hypot(g, _) || 1, y = -_ / v, b = g / v, x = p(c) * a * .08 + s, S = .86 + .14 * Math.min(1, (c - e + o) / (a * 1.5), (t + o - c) / (a * 1.5)), C = a / 2 * S, w = C * (1 + d(c) * .14) + x, T = C * (1 + f(c) * .14) - x;
			c >= e && c <= t + o && n.push({
				x: l[i].x + y * w,
				y: l[i].y + b * w
			}), c >= e - o && c <= t && r.push({
				x: l[i].x - y * T,
				y: l[i].y - b * T
			});
		}
		if (n.length < 2 || r.length < 2) continue;
		let c = [...n, ...r.reverse()];
		_.push(`M${c.map((e) => `${i(e.x)} ${i(e.y)}`).join("L")}Z`);
	}
	return _;
}
function o(e, t, r) {
	let a = Math.hypot(t.x - e.x, t.y - e.y), o = Math.max(1, Math.round(a / 5)), s = n(r, 80), c = -(t.y - e.y) / (a || 1), l = (t.x - e.x) / (a || 1);
	return `M${Array.from({ length: o + 1 }, (n, r) => {
		let u = r / o, d = s(u * a) * .4;
		return `${i(e.x + (t.x - e.x) * u + c * d)} ${i(e.y + (t.y - e.y) * u + l * d)}`;
	}).join("L")}`;
}
var s = (e, t, n) => n.map((n) => ({
	d: n,
	tone: e,
	opacity: t
}));
function c(e, t, n, r = .86) {
	return [
		...s("body", r, a(e, t, n, { whole: !0 })),
		...s("pass", .3, a(e, t * .45, n + 1, {
			offset: t * .04,
			whole: !0
		})),
		...s("pass", .22, a(e, t * .16, n + 2, {
			offset: -t * .34,
			whole: !0
		}))
	];
}
function l(e, t, n, r, i) {
	let o = (e, t, n) => a([e, t], 1.6, i + n, { whole: !0 });
	return s("body", .3, [
		...o({
			x: e,
			y: t
		}, {
			x: e + n,
			y: t
		}, 1),
		...o({
			x: e,
			y: t + r
		}, {
			x: e + n,
			y: t + r
		}, 2),
		...o({
			x: e,
			y: t
		}, {
			x: e,
			y: t + r
		}, 3),
		...o({
			x: e + n,
			y: t
		}, {
			x: e + n,
			y: t + r
		}, 4)
	]);
}
function u(e, n, r, i) {
	let o = t(i), c = r * .08, l = e + c, u = n + c, d = r - c * 2, f = (e, t, n, r = 0) => {
		let i = (o() - .5) * d * .05;
		return a([{
			x: l - d * .02 + (o() - .5) * d * .04,
			y: u + d * e + i - r * d / 2
		}, {
			x: l + d * 1.02 + (o() - .5) * d * .04,
			y: u + d * e - i + r * d / 2
		}], d * t, n, { whole: !0 });
	}, p = (e, t, n) => a([{
		x: l + d * e + (o() - .5) * d * .04,
		y: u - d * .02
	}, {
		x: l + d * e - (o() - .5) * d * .04,
		y: u + d * 1.02
	}], d * t, n, { whole: !0 }), m = () => Math.floor(o() * 1e9), h = (e, t) => a([e, t], d * .05, m(), { whole: !0 });
	return [
		...s("body", 1, [
			.14,
			.31,
			.48,
			.66,
			.83
		].flatMap((e) => f(e, .38, m()))),
		...s("paper", .05, f(.5, .75, m())),
		...s("paper", .09, f(.3 + o() * .4, .34, m())),
		...s("pass", .05, f(.45 + o() * .1, .78, m())),
		...s("pass", .1, f(.25 + o() * .5, .36, m())),
		...s("pass", .06, f(.5, .9, m(), .35)),
		...s("pass", .12, f(.4 + o() * .2, .5, m(), -.3)),
		...s("pass", .06, p(.3 + o() * .4, .42, m())),
		...s("pass", .08, p(.2 + o() * .6, .3, m())),
		...s("edge", .16, h({
			x: l,
			y: u + d * .02
		}, {
			x: l + d,
			y: u + d * .02
		})),
		...s("edge", .16, h({
			x: l + d * .98,
			y: u
		}, {
			x: l + d * .98,
			y: u + d
		})),
		...s("edge", .16, h({
			x: l + d,
			y: u + d * .98
		}, {
			x: l,
			y: u + d * .98
		})),
		...s("edge", .16, h({
			x: l + d * .02,
			y: u + d
		}, {
			x: l + d * .02,
			y: u
		}))
	];
}
function d(e) {
	let t = Math.imul(e | 0, 2654435761) ^ 1831565813;
	return () => {
		t = t + 1831565813 | 0;
		let e = Math.imul(t ^ t >>> 15, 1 | t);
		return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
	};
}
function f(e, t) {
	let n = d(e), r = Array.from({ length: t + 2 }, () => n() * 2 - 1);
	return (e) => {
		let n = Math.max(0, Math.min(1, e)) * t, i = Math.floor(n), a = n - i;
		return r[i] + (r[i + 1] - r[i]) * (a * a * (3 - 2 * a));
	};
}
var p = (e) => e * e * (3 - 2 * e), m = (e) => e.reduce((t, n, r) => r ? t + Math.hypot(n.x - e[r - 1].x, n.y - e[r - 1].y) : 0, 0);
function h(e, t) {
	if (e.length < 2) return e.slice();
	let n = [0];
	for (let t = 1; t < e.length; t++) n.push(n[t - 1] + Math.hypot(e[t].x - e[t - 1].x, e[t].y - e[t - 1].y));
	let r = n[n.length - 1];
	if (!r) return e.slice();
	let i = [], a = 0;
	for (let o = 0; o < t; o++) {
		let s = r * o / (t - 1);
		for (; a < n.length - 2 && n[a + 1] < s;) a++;
		let c = (s - n[a]) / (n[a + 1] - n[a] || 1);
		i.push({
			x: e[a].x + (e[a + 1].x - e[a].x) * c,
			y: e[a].y + (e[a + 1].y - e[a].y) * c
		});
	}
	return i;
}
function g(e) {
	return e.map((t, n) => {
		let r = e[Math.max(0, n - 1)], i = e[Math.min(e.length - 1, n + 1)], a = i.x - r.x, o = i.y - r.y, s = Math.hypot(a, o) || 1;
		return {
			x: a / s,
			y: o / s
		};
	});
}
function _(e, t) {
	let n = g(e);
	return e.map((r, i) => {
		let a = t(i / (e.length - 1));
		return {
			x: r.x - n[i].y * a,
			y: r.y + n[i].x * a
		};
	});
}
function v(e, t) {
	let n = e.length;
	if (n < 2) return "";
	let { width: r, seed: a } = t, o = t.taperIn ?? .14, s = t.taperOut ?? .08, c = t.startWidth ?? .14, l = t.endWidth ?? .8, u = t.belly ?? .07, d = t.wobble ?? .14, m = t.edge ?? .055 * r + .35, h = t.chisel ?? .35, _ = f(7 * a + 1, Math.max(3, Math.round(n / 9))), v = f(13 * a + 2, Math.max(4, Math.round(n / 5))), y = f(17 * a + 3, Math.max(4, Math.round(n / 5))), b = g(e), x = [], S = [];
	e.forEach((e, t) => {
		let i = t / (n - 1), a = 1;
		o > 0 && i < o && (a *= c + (1 - c) * p(i / o)), s > 0 && i > 1 - s && (a *= l + (1 - l) * p((1 - i) / s)), a *= (1 + u * Math.sin(Math.PI * i)) * (1 + d * _(i));
		let f = Math.max(.25, r * a / 2), h = -b[t].y, g = b[t].x, C = f + m * v(i), w = f + m * y(i);
		x.push({
			x: e.x + h * C,
			y: e.y + g * C
		}), S.push({
			x: e.x - h * w,
			y: e.y - g * w
		});
	});
	let C = h * r, w = n - 1;
	return x[w] = {
		x: x[w].x + b[w].x * C,
		y: x[w].y + b[w].y * C
	}, S[0] = {
		x: S[0].x - b[0].x * C * .6,
		y: S[0].y - b[0].y * C * .6
	}, `M${[...x, ...S.reverse()].map((e) => `${i(e.x)} ${i(e.y)}`).join("L")}Z`;
}
var y = (e) => Math.max(16, Math.min(160, Math.round(m(e) / 5)));
function b(e, t) {
	let { width: n, seed: r } = t, i = h(e, y(e)), a = [{
		tone: "body",
		opacity: t.opacity ?? .92,
		d: v(i, t)
	}];
	if (n >= 3.5 && t.core !== !1) {
		let e = f(5 * r + 9, 5);
		a.push({
			tone: "pass",
			opacity: .3,
			d: v(_(i, (t) => e(t) * n * .17), {
				width: n * .45,
				seed: r + 31,
				taperIn: .2,
				taperOut: .16,
				startWidth: .2,
				endWidth: .5,
				edge: .03 * n + .3,
				chisel: .25
			})
		}), a.push({
			tone: "edge",
			opacity: .22,
			d: v(_(i, () => n * .3), {
				width: n * .16,
				seed: r + 57,
				taperIn: .25,
				taperOut: .2,
				startWidth: .15,
				endWidth: .4,
				edge: .5,
				chisel: .15
			})
		});
	}
	return n >= 14 && t.streaks !== !1 && [
		-.22,
		.05,
		.26
	].forEach((e, t) => {
		a.push({
			tone: "paper",
			opacity: .1 + t % 2 * .04,
			d: v(_(i, (r) => e * n * (1 + .15 * Math.sin(5 * r + t))), {
				width: n * (.09 + .04 * t),
				seed: r + 71 + 13 * t,
				taperIn: .3,
				taperOut: .25,
				startWidth: .2,
				endWidth: .3,
				edge: .6,
				chisel: .1
			})
		});
	}), a;
}
function x(e, t) {
	let { width: n, seed: r } = t, i = t.dashLength ?? 3.4 * n, a = t.gap ?? 1.6 * n, o = t.opacity ?? 1, s = h(e, Math.max(48, t.samples ?? y(e))), c = m(s), l = d(101 * r + 5), u = [], f = (e, t) => {
		let i = Math.max(0, Math.floor(e / c * (s.length - 1))), a = Math.min(s.length - 1, Math.ceil(t / c * (s.length - 1)));
		if (a - i < 1) return;
		let d = (l() - .5) * .06, f = Math.cos(d), p = Math.sin(d), m = h(s.slice(i, a + 1), 8), g = m.reduce((e, t) => e + t.x, 0) / m.length, _ = m.reduce((e, t) => e + t.y, 0) / m.length, y = m.map((e) => ({
			x: g + (e.x - g) * f - (e.y - _) * p,
			y: _ + (e.x - g) * p + (e.y - _) * f
		})), b = n * (.85 + .35 * l()), x = [{
			tone: "body",
			opacity: Math.round((.82 + .16 * l()) * o * 100) / 100,
			d: v(y, {
				width: b,
				seed: r + Math.round(e),
				taperIn: .18,
				taperOut: .18,
				startWidth: .55,
				endWidth: .5,
				belly: .05,
				wobble: .08,
				edge: .05 * b + .3,
				chisel: .35
			})
		}];
		l() < .35 && x.push({
			tone: "pass",
			opacity: Math.round(.3 * o * 100) / 100,
			d: v(y, {
				width: b * .5,
				seed: r + Math.round(e) + 7,
				taperIn: .3,
				taperOut: .3,
				startWidth: .3,
				endWidth: .3,
				edge: .4,
				chisel: .2
			})
		}), u.push(x);
	};
	for (let e = .3 * i * l(); e < c - 2;) {
		let t = Math.min(c, e + i * (.8 + .45 * l()));
		f(e, t), e = t + a * (.75 + .5 * l());
	}
	return u;
}
function S(e) {
	let t = 43758.5453 * Math.sin(127.1 * e + 311.7);
	return t - Math.floor(t);
}
//#endregion
export { e as MARKER_FILTERS, S as hashed, x as markerDashes, l as markerFrame, c as markerLine, o as markerRule, u as markerSquare, b as markerStroke, a as markerStrokes, v as ribbon };

