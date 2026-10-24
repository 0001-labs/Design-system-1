//#region \0rolldown/runtime.js
var e = Object.defineProperty, t = (e, t, n) => () => {
	if (n) throw n[0];
	try {
		return e && (t = e(e = 0)), t;
	} catch (e) {
		throw n = [e], e;
	}
}, n = (t, n) => {
	let r = {};
	for (var i in t) e(r, i, {
		get: t[i],
		enumerable: !0
	});
	return n || e(r, Symbol.toStringTag, { value: "Module" }), r;
}, r = Symbol.for("yaml.alias"), i = Symbol.for("yaml.document"), a = Symbol.for("yaml.map"), o = Symbol.for("yaml.pair"), s = Symbol.for("yaml.scalar"), c = Symbol.for("yaml.seq"), l = Symbol.for("yaml.node.type"), u = (e) => !!e && typeof e == "object" && e[l] === r, d = (e) => !!e && typeof e == "object" && e[l] === i, f = (e) => !!e && typeof e == "object" && e[l] === a, p = (e) => !!e && typeof e == "object" && e[l] === o, m = (e) => !!e && typeof e == "object" && e[l] === s, h = (e) => !!e && typeof e == "object" && e[l] === c;
function g(e) {
	if (e && typeof e == "object") switch (e[l]) {
		case a:
		case c: return !0;
	}
	return !1;
}
function _(e) {
	if (e && typeof e == "object") switch (e[l]) {
		case r:
		case a:
		case s:
		case c: return !0;
	}
	return !1;
}
var v = (e) => (m(e) || g(e)) && !!e.anchor, y = Symbol("break visit"), b = Symbol("skip children"), x = Symbol("remove node");
function S(e, t) {
	let n = w(t);
	d(e) ? C(null, e.contents, n, Object.freeze([e])) === x && (e.contents = null) : C(null, e, n, Object.freeze([]));
}
S.BREAK = y, S.SKIP = b, S.REMOVE = x;
function C(e, t, n, r) {
	let i = T(e, t, n, r);
	if (_(i) || p(i)) return E(e, r, i), C(e, i, n, r);
	if (typeof i != "symbol") {
		if (g(t)) {
			r = Object.freeze(r.concat(t));
			for (let e = 0; e < t.items.length; ++e) {
				let i = C(e, t.items[e], n, r);
				if (typeof i == "number") e = i - 1;
				else if (i === y) return y;
				else i === x && (t.items.splice(e, 1), --e);
			}
		} else if (p(t)) {
			r = Object.freeze(r.concat(t));
			let e = C("key", t.key, n, r);
			if (e === y) return y;
			e === x && (t.key = null);
			let i = C("value", t.value, n, r);
			if (i === y) return y;
			i === x && (t.value = null);
		}
	}
	return i;
}
function w(e) {
	return typeof e == "object" && (e.Collection || e.Node || e.Value) ? Object.assign({
		Alias: e.Node,
		Map: e.Node,
		Scalar: e.Node,
		Seq: e.Node
	}, e.Value && {
		Map: e.Value,
		Scalar: e.Value,
		Seq: e.Value
	}, e.Collection && {
		Map: e.Collection,
		Seq: e.Collection
	}, e) : e;
}
function T(e, t, n, r) {
	if (typeof n == "function") return n(e, t, r);
	if (f(t)) return n.Map?.(e, t, r);
	if (h(t)) return n.Seq?.(e, t, r);
	if (p(t)) return n.Pair?.(e, t, r);
	if (m(t)) return n.Scalar?.(e, t, r);
	if (u(t)) return n.Alias?.(e, t, r);
}
function E(e, t, n) {
	let r = t[t.length - 1];
	if (g(r)) r.items[e] = n;
	else if (p(r)) e === "key" ? r.key = n : r.value = n;
	else if (d(r)) r.contents = n;
	else {
		let e = u(r) ? "alias" : "scalar";
		throw Error(`Cannot replace node with ${e} parent`);
	}
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/doc/directives.js
var D = {
	"!": "%21",
	",": "%2C",
	"[": "%5B",
	"]": "%5D",
	"{": "%7B",
	"}": "%7D"
}, ee = (e) => e.replace(/[!,[\]{}]/g, (e) => D[e]), O = class e {
	constructor(t, n) {
		this.docStart = null, this.docEnd = !1, this.yaml = Object.assign({}, e.defaultYaml, t), this.tags = Object.assign({}, e.defaultTags, n);
	}
	clone() {
		let t = new e(this.yaml, this.tags);
		return t.docStart = this.docStart, t;
	}
	atDocument() {
		let t = new e(this.yaml, this.tags);
		switch (this.yaml.version) {
			case "1.1":
				this.atNextDocument = !0;
				break;
			case "1.2": this.atNextDocument = !1, this.yaml = {
				explicit: e.defaultYaml.explicit,
				version: "1.2"
			}, this.tags = Object.assign({}, e.defaultTags);
		}
		return t;
	}
	add(t, n) {
		this.atNextDocument &&= (this.yaml = {
			explicit: e.defaultYaml.explicit,
			version: "1.1"
		}, this.tags = Object.assign({}, e.defaultTags), !1);
		let r = t.trim().split(/[ \t]+/), i = r.shift();
		switch (i) {
			case "%TAG": {
				if (r.length !== 2 && (n(0, "%TAG directive should contain exactly two parts"), r.length < 2)) return !1;
				let [e, t] = r;
				return this.tags[e] = t, !0;
			}
			case "%YAML": {
				if (this.yaml.explicit = !0, r.length !== 1) return n(0, "%YAML directive should contain exactly one part"), !1;
				let [e] = r;
				if (e === "1.1" || e === "1.2") return this.yaml.version = e, !0;
				{
					let t = /^\d+\.\d+$/.test(e);
					return n(6, `Unsupported YAML version ${e}`, t), !1;
				}
			}
			default: return n(0, `Unknown directive ${i}`, !0), !1;
		}
	}
	tagName(e, t) {
		if (e === "!") return "!";
		if (e[0] !== "!") return t(`Not a valid tag: ${e}`), null;
		if (e[1] === "<") {
			let n = e.slice(2, -1);
			return n === "!" || n === "!!" ? (t(`Verbatim tags aren't resolved, so ${e} is invalid.`), null) : (e[e.length - 1] !== ">" && t("Verbatim tags must end with a >"), n);
		}
		let [, n, r] = e.match(/^(.*!)([^!]*)$/s);
		r || t(`The ${e} tag has no suffix`);
		let i = this.tags[n];
		if (i) try {
			return i + decodeURIComponent(r);
		} catch (e) {
			return t(String(e)), null;
		}
		return n === "!" ? e : (t(`Could not resolve tag: ${e}`), null);
	}
	tagString(e) {
		for (let [t, n] of Object.entries(this.tags)) if (e.startsWith(n)) return t + ee(e.substring(n.length));
		return e[0] === "!" ? e : `!<${e}>`;
	}
	toString(e) {
		let t = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [], n = Object.entries(this.tags), r;
		if (e && n.length > 0 && _(e.contents)) {
			let t = {};
			S(e.contents, (e, n) => {
				_(n) && n.tag && (t[n.tag] = !0);
			}), r = Object.keys(t);
		} else r = [];
		for (let [i, a] of n) (i !== "!!" || a !== "tag:yaml.org,2002:") && (!e || r.some((e) => e.startsWith(a))) && t.push(`%TAG ${i} ${a}`);
		return t.join("\n");
	}
};
O.defaultYaml = {
	explicit: !1,
	version: "1.2"
}, O.defaultTags = { "!!": "tag:yaml.org,2002:" };
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/doc/anchors.js
function k(e) {
	if (/[\x00-\x19\s,[\]{}]/.test(e)) {
		let t = `Anchor must not contain whitespace or control characters: ${JSON.stringify(e)}`;
		throw Error(t);
	}
	return !0;
}
function te(e) {
	let t = /* @__PURE__ */ new Set();
	return S(e, { Value(e, n) {
		n.anchor && t.add(n.anchor);
	} }), t;
}
function A(e, t) {
	for (let n = 1;; ++n) {
		let r = `${e}${n}`;
		if (!t.has(r)) return r;
	}
}
function j(e, t) {
	let n = [], r = /* @__PURE__ */ new Map(), i = null;
	return {
		onAnchor: (r) => {
			n.push(r), i ??= te(e);
			let a = A(t, i);
			return i.add(a), a;
		},
		setAnchors: () => {
			for (let e of n) {
				let t = r.get(e);
				if (typeof t == "object" && t.anchor && (m(t.node) || g(t.node))) t.node.anchor = t.anchor;
				else {
					let t = /* @__PURE__ */ Error("Failed to resolve repeated object (this should not happen)");
					throw t.source = e, t;
				}
			}
		},
		sourceObjects: r
	};
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/doc/applyReviver.js
function ne(e, t, n, r) {
	if (r && typeof r == "object") {
		if (Array.isArray(r)) for (let t = 0, n = r.length; t < n; ++t) {
			let n = r[t], i = ne(e, r, String(t), n);
			i === void 0 ? delete r[t] : i !== n && (r[t] = i);
		}
		else if (r instanceof Map) for (let t of Array.from(r.keys())) {
			let n = r.get(t), i = ne(e, r, t, n);
			i === void 0 ? r.delete(t) : i !== n && r.set(t, i);
		}
		else if (r instanceof Set) for (let t of Array.from(r)) {
			let n = ne(e, r, t, t);
			n === void 0 ? r.delete(t) : n !== t && (r.delete(t), r.add(n));
		}
		else for (let [t, n] of Object.entries(r)) {
			let i = ne(e, r, t, n);
			i === void 0 ? delete r[t] : i !== n && (r[t] = i);
		}
	}
	return e.call(t, n, r);
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/toJS.js
function M(e, t, n) {
	if (Array.isArray(e)) return e.map((e, t) => M(e, String(t), n));
	if (e && typeof e.toJSON == "function") {
		if (!n || !v(e)) return e.toJSON(t, n);
		let r = {
			aliasCount: 0,
			count: 1,
			res: void 0
		};
		n.anchors.set(e, r), n.onCreate = (e) => {
			r.res = e, delete n.onCreate;
		};
		let i = e.toJSON(t, n);
		return n.onCreate && n.onCreate(i), i;
	}
	return typeof e == "bigint" && !n?.keep ? Number(e) : e;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/Node.js
var re = class {
	constructor(e) {
		Object.defineProperty(this, l, { value: e });
	}
	clone() {
		let e = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
		return this.range && (e.range = this.range.slice()), e;
	}
	toJS(e, { mapAsMap: t, maxAliasCount: n, onAnchor: r, reviver: i } = {}) {
		if (!d(e)) throw TypeError("A document argument is required");
		let a = {
			anchors: /* @__PURE__ */ new Map(),
			doc: e,
			keep: !0,
			mapAsMap: t === !0,
			mapKeyWarned: !1,
			maxAliasCount: typeof n == "number" ? n : 100
		}, o = M(this, "", a);
		if (typeof r == "function") for (let { count: e, res: t } of a.anchors.values()) r(t, e);
		return typeof i == "function" ? ne(i, { "": o }, "", o) : o;
	}
}, N = class extends re {
	constructor(e) {
		super(r), this.source = e, Object.defineProperty(this, "tag", { set() {
			throw Error("Alias nodes cannot have tags");
		} });
	}
	resolve(e, t) {
		if (t?.maxAliasCount === 0) throw ReferenceError("Alias resolution is disabled");
		let n;
		t?.aliasResolveCache ? n = t.aliasResolveCache : (n = [], S(e, { Node: (e, t) => {
			(u(t) || v(t)) && n.push(t);
		} }), t && (t.aliasResolveCache = n));
		let r;
		for (let e of n) {
			if (e === this) break;
			e.anchor === this.source && (r = e);
		}
		if (r && t) {
			let { anchors: e, doc: n, maxAliasCount: i } = t, a = e.get(r);
			/* istanbul ignore if */
			if (a ||= (M(r, null, t), e.get(r)), a?.res === void 0) throw ReferenceError("This should not happen: Alias anchor was not resolved?");
			if (i >= 0 && (a.count += 1, a.aliasCount === 0 && (a.aliasCount = P(n, r, e)), a.count * a.aliasCount > i)) throw ReferenceError("Excessive alias count indicates a resource exhaustion attack");
		}
		return r;
	}
	toJSON(e, t) {
		if (!t) return { source: this.source };
		let n = this.resolve(t.doc, t);
		if (!n) {
			let e = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
			throw ReferenceError(e);
		}
		return t.anchors.get(n).res;
	}
	toString(e, t, n) {
		let r = `*${this.source}`;
		if (e) {
			if (k(this.source), e.options.verifyAliasOrder && !e.anchors.has(this.source)) {
				let e = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
				throw Error(e);
			}
			if (e.implicitKey) return `${r} `;
		}
		return r;
	}
};
function P(e, t, n) {
	if (u(t)) {
		let r = t.resolve(e), i = n && r && n.get(r);
		return i ? i.count * i.aliasCount : 0;
	}
	if (g(t)) {
		let r = 0;
		for (let i of t.items) {
			let t = P(e, i, n);
			t > r && (r = t);
		}
		return r;
	}
	if (p(t)) {
		let r = P(e, t.key, n), i = P(e, t.value, n);
		return Math.max(r, i);
	}
	return 1;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/Scalar.js
var F = (e) => !e || typeof e != "function" && typeof e != "object", I = class extends re {
	constructor(e) {
		super(s), this.value = e;
	}
	toJSON(e, t) {
		return t?.keep ? this.value : M(this.value, e, t);
	}
	toString() {
		return String(this.value);
	}
};
I.BLOCK_FOLDED = "BLOCK_FOLDED", I.BLOCK_LITERAL = "BLOCK_LITERAL", I.PLAIN = "PLAIN", I.QUOTE_DOUBLE = "QUOTE_DOUBLE", I.QUOTE_SINGLE = "QUOTE_SINGLE";
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/doc/createNode.js
var ie = "tag:yaml.org,2002:";
function L(e, t, n) {
	if (t) {
		let e = n.filter((e) => e.tag === t), r = e.find((e) => !e.format) ?? e[0];
		if (!r) throw Error(`Tag ${t} not found`);
		return r;
	}
	return n.find((t) => t.identify?.(e) && !t.format);
}
function ae(e, t, n) {
	if (d(e) && (e = e.contents), _(e)) return e;
	if (p(e)) {
		let t = n.schema[a].createNode?.(n.schema, null, n);
		return t.items.push(e), t;
	}
	(e instanceof String || e instanceof Number || e instanceof Boolean || typeof BigInt < "u" && e instanceof BigInt) && (e = e.valueOf());
	let { aliasDuplicateObjects: r, onAnchor: i, onTagObj: o, schema: s, sourceObjects: l } = n, u;
	if (r && e && typeof e == "object") {
		if (u = l.get(e), u) return u.anchor ?? (u.anchor = i(e)), new N(u.anchor);
		u = {
			anchor: null,
			node: null
		}, l.set(e, u);
	}
	t?.startsWith("!!") && (t = ie + t.slice(2));
	let f = L(e, t, s.tags);
	if (!f) {
		if (e && typeof e.toJSON == "function" && (e = e.toJSON()), !e || typeof e != "object") {
			let t = new I(e);
			return u && (u.node = t), t;
		}
		f = e instanceof Map ? s[a] : Symbol.iterator in Object(e) ? s[c] : s[a];
	}
	o && (o(f), delete n.onTagObj);
	let m = f?.createNode ? f.createNode(n.schema, e, n) : typeof f?.nodeClass?.from == "function" ? f.nodeClass.from(n.schema, e, n) : new I(e);
	return t ? m.tag = t : f.default || (m.tag = f.tag), u && (u.node = m), m;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/Collection.js
function R(e, t, n) {
	let r = n;
	for (let e = t.length - 1; e >= 0; --e) {
		let n = t[e];
		if (typeof n == "number" && Number.isInteger(n) && n >= 0) {
			let e = [];
			e[n] = r, r = e;
		} else r = /* @__PURE__ */ new Map([[n, r]]);
	}
	return ae(r, void 0, {
		aliasDuplicateObjects: !1,
		keepUndefined: !1,
		onAnchor: () => {
			throw Error("This should not happen, please report a bug.");
		},
		schema: e,
		sourceObjects: /* @__PURE__ */ new Map()
	});
}
var oe = (e) => e == null || typeof e == "object" && !!e[Symbol.iterator]().next().done, se = class extends re {
	constructor(e, t) {
		super(e), Object.defineProperty(this, "schema", {
			value: t,
			configurable: !0,
			enumerable: !1,
			writable: !0
		});
	}
	clone(e) {
		let t = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
		return e && (t.schema = e), t.items = t.items.map((t) => _(t) || p(t) ? t.clone(e) : t), this.range && (t.range = this.range.slice()), t;
	}
	addIn(e, t) {
		if (oe(e)) this.add(t);
		else {
			let [n, ...r] = e, i = this.get(n, !0);
			if (g(i)) i.addIn(r, t);
			else if (i === void 0 && this.schema) this.set(n, R(this.schema, r, t));
			else throw Error(`Expected YAML collection at ${n}. Remaining path: ${r}`);
		}
	}
	deleteIn(e) {
		let [t, ...n] = e;
		if (n.length === 0) return this.delete(t);
		let r = this.get(t, !0);
		if (g(r)) return r.deleteIn(n);
		throw Error(`Expected YAML collection at ${t}. Remaining path: ${n}`);
	}
	getIn(e, t) {
		let [n, ...r] = e, i = this.get(n, !0);
		return r.length === 0 ? !t && m(i) ? i.value : i : g(i) ? i.getIn(r, t) : void 0;
	}
	hasAllNullValues(e) {
		return this.items.every((t) => {
			if (!p(t)) return !1;
			let n = t.value;
			return n == null || e && m(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
		});
	}
	hasIn(e) {
		let [t, ...n] = e;
		if (n.length === 0) return this.has(t);
		let r = this.get(t, !0);
		return g(r) ? r.hasIn(n) : !1;
	}
	setIn(e, t) {
		let [n, ...r] = e;
		if (r.length === 0) this.set(n, t);
		else {
			let e = this.get(n, !0);
			if (g(e)) e.setIn(r, t);
			else if (e === void 0 && this.schema) this.set(n, R(this.schema, r, t));
			else throw Error(`Expected YAML collection at ${n}. Remaining path: ${r}`);
		}
	}
}, z = (e) => e.replace(/^(?!$)(?: $)?/gm, "#");
function B(e, t) {
	return /^\n+$/.test(e) ? e.substring(1) : t ? e.replace(/^(?! *$)/gm, t) : e;
}
var V = (e, t, n) => e.endsWith("\n") ? B(n, t) : n.includes("\n") ? "\n" + B(n, t) : (e.endsWith(" ") ? "" : " ") + n, H = "flow", ce = "block", le = "quoted";
function ue(e, t, n = "flow", { indentAtStart: r, lineWidth: i = 80, minContentWidth: a = 20, onFold: o, onOverflow: s } = {}) {
	if (!i || i < 0) return e;
	i < a && (a = 0);
	let c = Math.max(1 + a, 1 + i - t.length);
	if (e.length <= c) return e;
	let l = [], u = {}, d = i - t.length;
	typeof r == "number" && (r > i - Math.max(2, a) ? l.push(0) : d = i - r);
	let f, p, m = !1, h = -1, g = -1, _ = -1;
	n === "block" && (h = de(e, h, t.length), h !== -1 && (d = h + c));
	for (let r; r = e[h += 1];) {
		if (n === "quoted" && r === "\\") {
			switch (g = h, e[h + 1]) {
				case "x":
					h += 3;
					break;
				case "u":
					h += 5;
					break;
				case "U":
					h += 9;
					break;
				default: h += 1;
			}
			_ = h;
		}
		if (r === "\n") n === "block" && (h = de(e, h, t.length)), d = h + t.length + c, f = void 0;
		else {
			if (r === " " && p && p !== " " && p !== "\n" && p !== "	") {
				let t = e[h + 1];
				t && t !== " " && t !== "\n" && t !== "	" && (f = h);
			}
			if (h >= d) {
				if (f) l.push(f), d = f + c, f = void 0;
				else if (n === "quoted") {
					for (; p === " " || p === "	";) p = r, r = e[h += 1], m = !0;
					let t = h > _ + 1 ? h - 2 : g - 1;
					if (u[t]) return e;
					l.push(t), u[t] = !0, d = t + c, f = void 0;
				} else m = !0;
			}
		}
		p = r;
	}
	if (m && s && s(), l.length === 0) return e;
	o && o();
	let v = e.slice(0, l[0]);
	for (let r = 0; r < l.length; ++r) {
		let i = l[r], a = l[r + 1] || e.length;
		i === 0 ? v = `\n${t}${e.slice(0, a)}` : (n === "quoted" && u[i] && (v += `${e[i]}\\`), v += `\n${t}${e.slice(i + 1, a)}`);
	}
	return v;
}
function de(e, t, n) {
	let r = t, i = t + 1, a = e[i];
	for (; a === " " || a === "	";) if (t < i + n) a = e[++t];
	else {
		do
			a = e[++t];
		while (a && a !== "\n");
		r = t, i = t + 1, a = e[i];
	}
	return r;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyString.js
var fe = (e, t) => ({
	indentAtStart: t ? e.indent.length : e.indentAtStart,
	lineWidth: e.options.lineWidth,
	minContentWidth: e.options.minContentWidth
}), U = (e) => /^(%|---|\.\.\.)/m.test(e);
function W(e, t, n) {
	if (!t || t < 0) return !1;
	let r = t - n, i = e.length;
	if (i <= r) return !1;
	for (let t = 0, n = 0; t < i; ++t) if (e[t] === "\n") {
		if (t - n > r) return !0;
		if (n = t + 1, i - n <= r) return !1;
	}
	return !0;
}
function pe(e, t) {
	let n = JSON.stringify(e);
	if (t.options.doubleQuotedAsJSON) return n;
	let { implicitKey: r } = t, i = t.options.doubleQuotedMinMultiLineLength, a = t.indent || (U(e) ? "  " : ""), o = "", s = 0;
	for (let e = 0, t = n[e]; t; t = n[++e]) if (t === " " && n[e + 1] === "\\" && n[e + 2] === "n" && (o += n.slice(s, e) + "\\ ", e += 1, s = e, t = "\\"), t === "\\") switch (n[e + 1]) {
		case "u":
			{
				o += n.slice(s, e);
				let t = n.substr(e + 2, 4);
				switch (t) {
					case "0000":
						o += "\\0";
						break;
					case "0007":
						o += "\\a";
						break;
					case "000b":
						o += "\\v";
						break;
					case "001b":
						o += "\\e";
						break;
					case "0085":
						o += "\\N";
						break;
					case "00a0":
						o += "\\_";
						break;
					case "2028":
						o += "\\L";
						break;
					case "2029":
						o += "\\P";
						break;
					default: t.substr(0, 2) === "00" ? o += "\\x" + t.substr(2) : o += n.substr(e, 6);
				}
				e += 5, s = e + 1;
			}
			break;
		case "n":
			if (r || n[e + 2] === "\"" || n.length < i) e += 1;
			else {
				for (o += n.slice(s, e) + "\n\n"; n[e + 2] === "\\" && n[e + 3] === "n" && n[e + 4] !== "\"";) o += "\n", e += 2;
				o += a, n[e + 2] === " " && (o += "\\"), e += 1, s = e + 1;
			}
			break;
		default: e += 1;
	}
	return o = s ? o + n.slice(s) : n, r ? o : ue(o, a, le, fe(t, !1));
}
function me(e, t) {
	if (t.options.singleQuote === !1 || t.implicitKey && e.includes("\n") || /[ \t]\n|\n[ \t]/.test(e)) return pe(e, t);
	let n = t.indent || (U(e) ? "  " : ""), r = "'" + e.replace(/'/g, "''").replace(/\n+/g, `$&\n${n}`) + "'";
	return t.implicitKey ? r : ue(r, n, H, fe(t, !1));
}
function G(e, t) {
	let { singleQuote: n } = t.options, r;
	if (n === !1) r = pe;
	else {
		let t = e.includes("\""), i = e.includes("'");
		r = t && !i ? me : i && !t ? pe : n ? me : pe;
	}
	return r(e, t);
}
var K;
try {
	K = /* @__PURE__ */ RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
} catch {
	K = /\n+(?!\n|$)/g;
}
function he({ comment: e, type: t, value: n }, r, i, a) {
	let { blockQuote: o, commentString: s, lineWidth: c } = r.options;
	if (!o || /\n[\t ]+$/.test(n)) return G(n, r);
	let l = r.indent || (r.forceBlockIndent || U(n) ? "  " : ""), u = o === "literal" ? !0 : o === "folded" || t === I.BLOCK_FOLDED ? !1 : t === I.BLOCK_LITERAL || !W(n, c, l.length);
	if (!n) return u ? "|\n" : ">\n";
	let d, f;
	for (f = n.length; f > 0; --f) {
		let e = n[f - 1];
		if (e !== "\n" && e !== "	" && e !== " ") break;
	}
	let p = n.substring(f), m = p.indexOf("\n");
	m === -1 ? d = "-" : n === p || m !== p.length - 1 ? (d = "+", a && a()) : d = "", p &&= (n = n.slice(0, -p.length), p[p.length - 1] === "\n" && (p = p.slice(0, -1)), p.replace(K, `$&${l}`));
	let h = !1, g, _ = -1;
	for (g = 0; g < n.length; ++g) {
		let e = n[g];
		if (e === " ") h = !0;
		else if (e === "\n") _ = g;
		else break;
	}
	let v = n.substring(0, _ < g ? _ + 1 : g);
	v &&= (n = n.substring(v.length), v.replace(/\n+/g, `$&${l}`));
	let y = (h ? l ? "2" : "1" : "") + d;
	if (e && (y += " " + s(e.replace(/ ?[\r\n]+/g, " ")), i && i()), !u) {
		let e = n.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${l}`), i = !1, a = fe(r, !0);
		o !== "folded" && t !== I.BLOCK_FOLDED && (a.onOverflow = () => {
			i = !0;
		});
		let s = ue(`${v}${e}${p}`, l, ce, a);
		if (!i) return `>${y}\n${l}${s}`;
	}
	return n = n.replace(/\n+/g, `$&${l}`), `|${y}\n${l}${v}${n}${p}`;
}
function ge(e, t, n, r) {
	let { type: i, value: a } = e, { actualString: o, implicitKey: s, indent: c, indentStep: l, inFlow: u } = t;
	if (s && a.includes("\n") || u && /[[\]{},]/.test(a)) return G(a, t);
	if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(a)) return s || u || !a.includes("\n") ? G(a, t) : he(e, t, n, r);
	if (!s && !u && i !== I.PLAIN && a.includes("\n")) return he(e, t, n, r);
	if (U(a)) {
		if (c === "") return t.forceBlockIndent = !0, he(e, t, n, r);
		if (s && c === l) return G(a, t);
	}
	let d = a.replace(/\n+/g, `$&\n${c}`);
	if (o) {
		let e = (e) => e.default && e.tag !== "tag:yaml.org,2002:str" && e.test?.test(d), { compat: n, tags: r } = t.doc.schema;
		if (r.some(e) || n?.some(e)) return G(a, t);
	}
	return s ? d : ue(d, c, H, fe(t, !1));
}
function _e(e, t, n, r) {
	let { implicitKey: i, inFlow: a } = t, o = typeof e.value == "string" ? e : Object.assign({}, e, { value: String(e.value) }), { type: s } = e;
	s !== I.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(o.value) && (s = I.QUOTE_DOUBLE);
	let c = (e) => {
		switch (e) {
			case I.BLOCK_FOLDED:
			case I.BLOCK_LITERAL: return i || a ? G(o.value, t) : he(o, t, n, r);
			case I.QUOTE_DOUBLE: return pe(o.value, t);
			case I.QUOTE_SINGLE: return me(o.value, t);
			case I.PLAIN: return ge(o, t, n, r);
			default: return null;
		}
	}, l = c(s);
	if (l === null) {
		let { defaultKeyType: e, defaultStringType: n } = t.options, r = i && e || n;
		if (l = c(r), l === null) throw Error(`Unsupported default string type ${r}`);
	}
	return l;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringify.js
function ve(e, t) {
	let n = Object.assign({
		blockQuote: !0,
		commentString: z,
		defaultKeyType: null,
		defaultStringType: "PLAIN",
		directives: null,
		doubleQuotedAsJSON: !1,
		doubleQuotedMinMultiLineLength: 40,
		falseStr: "false",
		flowCollectionPadding: !0,
		indentSeq: !0,
		lineWidth: 80,
		minContentWidth: 20,
		nullStr: "null",
		simpleKeys: !1,
		singleQuote: null,
		trailingComma: !1,
		trueStr: "true",
		verifyAliasOrder: !0
	}, e.schema.toStringOptions, t), r;
	switch (n.collectionStyle) {
		case "block":
			r = !1;
			break;
		case "flow":
			r = !0;
			break;
		default: r = null;
	}
	return {
		anchors: /* @__PURE__ */ new Set(),
		doc: e,
		flowCollectionPadding: n.flowCollectionPadding ? " " : "",
		indent: "",
		indentStep: typeof n.indent == "number" ? " ".repeat(n.indent) : "  ",
		inFlow: r,
		options: n
	};
}
function ye(e, t) {
	if (t.tag) {
		let n = e.filter((e) => e.tag === t.tag);
		if (n.length > 0) return n.find((e) => e.format === t.format) ?? n[0];
	}
	let n, r;
	if (m(t)) {
		r = t.value;
		let i = e.filter((e) => e.identify?.(r));
		if (i.length > 1) {
			let e = i.filter((e) => e.test);
			e.length > 0 && (i = e);
		}
		n = i.find((e) => e.format === t.format) ?? i.find((e) => !e.format);
	} else r = t, n = e.find((e) => e.nodeClass && r instanceof e.nodeClass);
	if (!n) {
		let e = r?.constructor?.name ?? (r === null ? "null" : typeof r);
		throw Error(`Tag not resolved for ${e} value`);
	}
	return n;
}
function q(e, t, { anchors: n, doc: r }) {
	if (!r.directives) return "";
	let i = [], a = (m(e) || g(e)) && e.anchor;
	a && k(a) && (n.add(a), i.push(`&${a}`));
	let o = e.tag ?? (t.default ? null : t.tag);
	return o && i.push(r.directives.tagString(o)), i.join(" ");
}
function be(e, t, n, r) {
	if (p(e)) return e.toString(t, n, r);
	if (u(e)) {
		if (t.doc.directives) return e.toString(t);
		if (t.resolvedAliases?.has(e)) throw TypeError("Cannot stringify circular structure without alias nodes");
		t.resolvedAliases ? t.resolvedAliases.add(e) : t.resolvedAliases = /* @__PURE__ */ new Set([e]), e = e.resolve(t.doc);
	}
	let i, a = _(e) ? e : t.doc.createNode(e, { onTagObj: (e) => i = e });
	i ??= ye(t.doc.schema.tags, a);
	let o = q(a, i, t);
	o.length > 0 && (t.indentAtStart = (t.indentAtStart ?? 0) + o.length + 1);
	let s = typeof i.stringify == "function" ? i.stringify(a, t, n, r) : m(a) ? _e(a, t, n, r) : a.toString(t, n, r);
	return o ? m(a) || s[0] === "{" || s[0] === "[" ? `${o} ${s}` : `${o}\n${t.indent}${s}` : s;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyPair.js
function xe({ key: e, value: t }, n, r, i) {
	let { allNullValues: a, doc: o, indent: s, indentStep: c, options: { commentString: l, indentSeq: u, simpleKeys: d } } = n, f = _(e) && e.comment || null;
	if (d) {
		if (f) throw Error("With simple keys, key nodes cannot have comments");
		if (g(e) || !_(e) && typeof e == "object") throw Error("With simple keys, collection cannot be used as a key value");
	}
	let p = !d && (!e || f && t == null && !n.inFlow || g(e) || (m(e) ? e.type === I.BLOCK_FOLDED || e.type === I.BLOCK_LITERAL : typeof e == "object"));
	n = Object.assign({}, n, {
		allNullValues: !1,
		implicitKey: !p && (d || !a),
		indent: s + c
	});
	let v = !1, y = !1, b = be(e, n, () => v = !0, () => y = !0);
	if (!p && !n.inFlow && b.length > 1024) {
		if (d) throw Error("With simple keys, single line scalar must not span more than 1024 characters");
		p = !0;
	}
	if (n.inFlow) {
		if (a || t == null) return v && r && r(), b === "" ? "?" : p ? `? ${b}` : b;
	} else if (a && !d || t == null && p) return b = `? ${b}`, f && !v ? b += V(b, n.indent, l(f)) : y && i && i(), b;
	v && (f = null), p ? (f && (b += V(b, n.indent, l(f))), b = `? ${b}\n${s}:`) : (b = `${b}:`, f && (b += V(b, n.indent, l(f))));
	let x, S, C;
	_(t) ? (x = !!t.spaceBefore, S = t.commentBefore, C = t.comment) : (x = !1, S = null, C = null, t && typeof t == "object" && (t = o.createNode(t))), n.implicitKey = !1, !p && !f && m(t) && (n.indentAtStart = b.length + 1), y = !1, !u && c.length >= 2 && !n.inFlow && !p && h(t) && !t.flow && !t.tag && !t.anchor && (n.indent = n.indent.substring(2));
	let w = !1, T = be(t, n, () => w = !0, () => y = !0), E = " ";
	if (f || x || S) {
		if (E = x ? "\n" : "", S) {
			let e = l(S);
			E += `\n${B(e, n.indent)}`;
		}
		T === "" && !n.inFlow ? E === "\n" && C && (E = "\n\n") : E += `\n${n.indent}`;
	} else if (!p && g(t)) {
		let e = T[0], r = T.indexOf("\n"), i = r !== -1, a = n.inFlow ?? t.flow ?? t.items.length === 0;
		if (i || !a) {
			let t = !1;
			if (i && (e === "&" || e === "!")) {
				let n = T.indexOf(" ");
				e === "&" && n !== -1 && n < r && T[n + 1] === "!" && (n = T.indexOf(" ", n + 1)), (n === -1 || r < n) && (t = !0);
			}
			t || (E = `\n${n.indent}`);
		}
	} else (T === "" || T[0] === "\n") && (E = "");
	return b += E + T, n.inFlow ? w && r && r() : C && !w ? b += V(b, n.indent, l(C)) : y && i && i(), b;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/log.js
function Se(e, t) {
	(e === "debug" || e === "warn") && console.warn(t);
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/merge.js
var Ce = "<<", we = {
	identify: (e) => e === Ce || typeof e == "symbol" && e.description === Ce,
	default: "key",
	tag: "tag:yaml.org,2002:merge",
	test: /^<<$/,
	resolve: () => Object.assign(new I(Symbol(Ce)), { addToJSMap: Ee }),
	stringify: () => Ce
}, Te = (e, t) => (we.identify(t) || m(t) && (!t.type || t.type === I.PLAIN) && we.identify(t.value)) && e?.doc.schema.tags.some((e) => e.tag === we.tag && e.default);
function Ee(e, t, n) {
	let r = Oe(e, n);
	if (h(r)) for (let n of r.items) De(e, t, n);
	else if (Array.isArray(r)) for (let n of r) De(e, t, n);
	else De(e, t, r);
}
function De(e, t, n) {
	let r = Oe(e, n);
	if (!f(r)) throw Error("Merge sources must be maps or map aliases");
	let i = r.toJSON(null, e, Map);
	for (let [e, n] of i) t instanceof Map ? t.has(e) || t.set(e, n) : t instanceof Set ? t.add(e) : Object.prototype.hasOwnProperty.call(t, e) || Object.defineProperty(t, e, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
	return t;
}
function Oe(e, t) {
	return e && u(t) ? t.resolve(e.doc, e) : t;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/addPairToJSMap.js
function ke(e, t, { key: n, value: r }) {
	if (_(n) && n.addToJSMap) n.addToJSMap(e, t, r);
	else if (Te(e, n)) Ee(e, t, r);
	else {
		let i = M(n, "", e);
		if (t instanceof Map) t.set(i, M(r, i, e));
		else if (t instanceof Set) t.add(i);
		else {
			let a = Ae(n, i, e), o = M(r, a, e);
			a in t ? Object.defineProperty(t, a, {
				value: o,
				writable: !0,
				enumerable: !0,
				configurable: !0
			}) : t[a] = o;
		}
	}
	return t;
}
function Ae(e, t, n) {
	if (t === null) return "";
	if (typeof t != "object") return String(t);
	if (_(e) && n?.doc) {
		let t = ve(n.doc, {});
		t.anchors = /* @__PURE__ */ new Set();
		for (let e of n.anchors.keys()) t.anchors.add(e.anchor);
		t.inFlow = !0, t.inStringifyKey = !0;
		let r = e.toString(t);
		if (!n.mapKeyWarned) {
			let e = JSON.stringify(r);
			e.length > 40 && (e = e.substring(0, 36) + "...\""), Se(n.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${e}. Set mapAsMap: true to use object keys.`), n.mapKeyWarned = !0;
		}
		return r;
	}
	return JSON.stringify(t);
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/Pair.js
function je(e, t, n) {
	return new Me(ae(e, void 0, n), ae(t, void 0, n));
}
var Me = class e {
	constructor(e, t = null) {
		Object.defineProperty(this, l, { value: o }), this.key = e, this.value = t;
	}
	clone(t) {
		let { key: n, value: r } = this;
		return _(n) && (n = n.clone(t)), _(r) && (r = r.clone(t)), new e(n, r);
	}
	toJSON(e, t) {
		return ke(t, t?.mapAsMap ? /* @__PURE__ */ new Map() : {}, this);
	}
	toString(e, t, n) {
		return e?.doc ? xe(this, e, t, n) : JSON.stringify(this);
	}
};
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyCollection.js
function Ne(e, t, n) {
	return (t.inFlow ?? e.flow ? Fe : Pe)(e, t, n);
}
function Pe({ comment: e, items: t }, n, { blockItemPrefix: r, flowChars: i, itemIndent: a, onChompKeep: o, onComment: s }) {
	let { indent: c, options: { commentString: l } } = n, u = Object.assign({}, n, {
		indent: a,
		type: null
	}), d = !1, f = [];
	for (let e = 0; e < t.length; ++e) {
		let i = t[e], o = null;
		if (_(i)) !d && i.spaceBefore && f.push(""), Ie(n, f, i.commentBefore, d), i.comment && (o = i.comment);
		else if (p(i)) {
			let e = _(i.key) ? i.key : null;
			e && (!d && e.spaceBefore && f.push(""), Ie(n, f, e.commentBefore, d));
		}
		d = !1;
		let s = be(i, u, () => o = null, () => d = !0);
		o && (s += V(s, a, l(o))), d && o && (d = !1), f.push(r + s);
	}
	let m;
	if (f.length === 0) m = i.start + i.end;
	else {
		m = f[0];
		for (let e = 1; e < f.length; ++e) {
			let t = f[e];
			m += t ? `\n${c}${t}` : "\n";
		}
	}
	return e ? (m += "\n" + B(l(e), c), s && s()) : d && o && o(), m;
}
function Fe({ items: e }, t, { flowChars: n, itemIndent: r }) {
	let { indent: i, indentStep: a, flowCollectionPadding: o, options: { commentString: s } } = t;
	r += a;
	let c = Object.assign({}, t, {
		indent: r,
		inFlow: !0,
		type: null
	}), l = !1, u = 0, d = [];
	for (let n = 0; n < e.length; ++n) {
		let i = e[n], a = null;
		if (_(i)) i.spaceBefore && d.push(""), Ie(t, d, i.commentBefore, !1), i.comment && (a = i.comment);
		else if (p(i)) {
			let e = _(i.key) ? i.key : null;
			e && (e.spaceBefore && d.push(""), Ie(t, d, e.commentBefore, !1), e.comment && (l = !0));
			let n = _(i.value) ? i.value : null;
			n ? (n.comment && (a = n.comment), n.commentBefore && (l = !0)) : i.value == null && e?.comment && (a = e.comment);
		}
		a && (l = !0);
		let o = be(i, c, () => a = null);
		l ||= d.length > u || o.includes("\n"), n < e.length - 1 ? o += "," : t.options.trailingComma && (t.options.lineWidth > 0 && (l ||= d.reduce((e, t) => e + t.length + 2, 2) + (o.length + 2) > t.options.lineWidth), l && (o += ",")), a && (o += V(o, r, s(a))), d.push(o), u = d.length;
	}
	let { start: f, end: m } = n;
	if (d.length === 0) return f + m;
	if (!l) {
		let e = d.reduce((e, t) => e + t.length + 2, 2);
		l = t.options.lineWidth > 0 && e > t.options.lineWidth;
	}
	if (l) {
		let e = f;
		for (let t of d) e += t ? `\n${a}${i}${t}` : "\n";
		return `${e}\n${i}${m}`;
	}
	return `${f}${o}${d.join(" ")}${o}${m}`;
}
function Ie({ indent: e, options: { commentString: t } }, n, r, i) {
	if (r && i && (r = r.replace(/^\n+/, "")), r) {
		let i = B(t(r), e);
		n.push(i.trimStart());
	}
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/YAMLMap.js
function Le(e, t) {
	let n = m(t) ? t.value : t;
	for (let r of e) if (p(r) && (r.key === t || r.key === n || m(r.key) && r.key.value === n)) return r;
}
var Re = class extends se {
	static get tagName() {
		return "tag:yaml.org,2002:map";
	}
	constructor(e) {
		super(a, e), this.items = [];
	}
	static from(e, t, n) {
		let { keepUndefined: r, replacer: i } = n, a = new this(e), o = (e, o) => {
			if (typeof i == "function") o = i.call(t, e, o);
			else if (Array.isArray(i) && !i.includes(e)) return;
			(o !== void 0 || r) && a.items.push(je(e, o, n));
		};
		if (t instanceof Map) for (let [e, n] of t) o(e, n);
		else if (t && typeof t == "object") for (let e of Object.keys(t)) o(e, t[e]);
		return typeof e.sortMapEntries == "function" && a.items.sort(e.sortMapEntries), a;
	}
	add(e, t) {
		let n;
		n = p(e) ? e : !e || typeof e != "object" || !("key" in e) ? new Me(e, e?.value) : new Me(e.key, e.value);
		let r = Le(this.items, n.key), i = this.schema?.sortMapEntries;
		if (r) {
			if (!t) throw Error(`Key ${n.key} already set`);
			m(r.value) && F(n.value) ? r.value.value = n.value : r.value = n.value;
		} else if (i) {
			let e = this.items.findIndex((e) => i(n, e) < 0);
			e === -1 ? this.items.push(n) : this.items.splice(e, 0, n);
		} else this.items.push(n);
	}
	delete(e) {
		let t = Le(this.items, e);
		return t ? this.items.splice(this.items.indexOf(t), 1).length > 0 : !1;
	}
	get(e, t) {
		let n = Le(this.items, e)?.value;
		return (!t && m(n) ? n.value : n) ?? void 0;
	}
	has(e) {
		return !!Le(this.items, e);
	}
	set(e, t) {
		this.add(new Me(e, t), !0);
	}
	toJSON(e, t, n) {
		let r = n ? new n() : t?.mapAsMap ? /* @__PURE__ */ new Map() : {};
		t?.onCreate && t.onCreate(r);
		for (let e of this.items) ke(t, r, e);
		return r;
	}
	toString(e, t, n) {
		if (!e) return JSON.stringify(this);
		for (let e of this.items) if (!p(e)) throw Error(`Map items must all be pairs; found ${JSON.stringify(e)} instead`);
		return !e.allNullValues && this.hasAllNullValues(!1) && (e = Object.assign({}, e, { allNullValues: !0 })), Ne(this, e, {
			blockItemPrefix: "",
			flowChars: {
				start: "{",
				end: "}"
			},
			itemIndent: e.indent || "",
			onChompKeep: n,
			onComment: t
		});
	}
}, ze = {
	collection: "map",
	default: !0,
	nodeClass: Re,
	tag: "tag:yaml.org,2002:map",
	resolve(e, t) {
		return f(e) || t("Expected a mapping for this tag"), e;
	},
	createNode: (e, t, n) => Re.from(e, t, n)
}, Be = class extends se {
	static get tagName() {
		return "tag:yaml.org,2002:seq";
	}
	constructor(e) {
		super(c, e), this.items = [];
	}
	add(e) {
		this.items.push(e);
	}
	delete(e) {
		let t = Ve(e);
		return typeof t == "number" && this.items.splice(t, 1).length > 0;
	}
	get(e, t) {
		let n = Ve(e);
		if (typeof n != "number") return;
		let r = this.items[n];
		return !t && m(r) ? r.value : r;
	}
	has(e) {
		let t = Ve(e);
		return typeof t == "number" && t < this.items.length;
	}
	set(e, t) {
		let n = Ve(e);
		if (typeof n != "number") throw Error(`Expected a valid index, not ${e}.`);
		let r = this.items[n];
		m(r) && F(t) ? r.value = t : this.items[n] = t;
	}
	toJSON(e, t) {
		let n = [];
		t?.onCreate && t.onCreate(n);
		let r = 0;
		for (let e of this.items) n.push(M(e, String(r++), t));
		return n;
	}
	toString(e, t, n) {
		return e ? Ne(this, e, {
			blockItemPrefix: "- ",
			flowChars: {
				start: "[",
				end: "]"
			},
			itemIndent: (e.indent || "") + "  ",
			onChompKeep: n,
			onComment: t
		}) : JSON.stringify(this);
	}
	static from(e, t, n) {
		let { replacer: r } = n, i = new this(e);
		if (t && Symbol.iterator in Object(t)) {
			let e = 0;
			for (let a of t) {
				if (typeof r == "function") {
					let n = t instanceof Set ? a : String(e++);
					a = r.call(t, n, a);
				}
				i.items.push(ae(a, void 0, n));
			}
		}
		return i;
	}
};
function Ve(e) {
	let t = m(e) ? e.value : e;
	return t && typeof t == "string" && (t = Number(t)), typeof t == "number" && Number.isInteger(t) && t >= 0 ? t : null;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/schema/common/seq.js
var He = {
	collection: "seq",
	default: !0,
	nodeClass: Be,
	tag: "tag:yaml.org,2002:seq",
	resolve(e, t) {
		return h(e) || t("Expected a sequence for this tag"), e;
	},
	createNode: (e, t, n) => Be.from(e, t, n)
}, Ue = {
	identify: (e) => typeof e == "string",
	default: !0,
	tag: "tag:yaml.org,2002:str",
	resolve: (e) => e,
	stringify(e, t, n, r) {
		return t = Object.assign({ actualString: !0 }, t), _e(e, t, n, r);
	}
}, We = {
	identify: (e) => e == null,
	createNode: () => new I(null),
	default: !0,
	tag: "tag:yaml.org,2002:null",
	test: /^(?:~|[Nn]ull|NULL)?$/,
	resolve: () => new I(null),
	stringify: ({ source: e }, t) => typeof e == "string" && We.test.test(e) ? e : t.options.nullStr
}, Ge = {
	identify: (e) => typeof e == "boolean",
	default: !0,
	tag: "tag:yaml.org,2002:bool",
	test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
	resolve: (e) => new I(e[0] === "t" || e[0] === "T"),
	stringify({ source: e, value: t }, n) {
		return e && Ge.test.test(e) && t === (e[0] === "t" || e[0] === "T") ? e : t ? n.options.trueStr : n.options.falseStr;
	}
};
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyNumber.js
function Ke({ format: e, minFractionDigits: t, tag: n, value: r }) {
	if (typeof r == "bigint") return String(r);
	let i = typeof r == "number" ? r : Number(r);
	if (!isFinite(i)) return isNaN(i) ? ".nan" : i < 0 ? "-.inf" : ".inf";
	let a = Object.is(r, -0) ? "-0" : JSON.stringify(r);
	if (!e && t && (!n || n === "tag:yaml.org,2002:float") && /^-?\d/.test(a) && !a.includes("e")) {
		let e = a.indexOf(".");
		e < 0 && (e = a.length, a += ".");
		let n = t - (a.length - e - 1);
		for (; n-- > 0;) a += "0";
	}
	return a;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/schema/core/float.js
var qe = {
	identify: (e) => typeof e == "number",
	default: !0,
	tag: "tag:yaml.org,2002:float",
	test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
	resolve: (e) => e.slice(-3).toLowerCase() === "nan" ? NaN : e[0] === "-" ? -Infinity : Infinity,
	stringify: Ke
}, Je = {
	identify: (e) => typeof e == "number",
	default: !0,
	tag: "tag:yaml.org,2002:float",
	format: "EXP",
	test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
	resolve: (e) => parseFloat(e),
	stringify(e) {
		let t = Number(e.value);
		return isFinite(t) ? t.toExponential() : Ke(e);
	}
}, Ye = {
	identify: (e) => typeof e == "number",
	default: !0,
	tag: "tag:yaml.org,2002:float",
	test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
	resolve(e) {
		let t = new I(parseFloat(e)), n = e.indexOf(".");
		return n !== -1 && e[e.length - 1] === "0" && (t.minFractionDigits = e.length - n - 1), t;
	},
	stringify: Ke
}, Xe = (e) => typeof e == "bigint" || Number.isInteger(e), Ze = (e, t, n, { intAsBigInt: r }) => r ? BigInt(e) : parseInt(e.substring(t), n);
function Qe(e, t, n) {
	let { value: r } = e;
	return Xe(r) && r >= 0 ? n + r.toString(t) : Ke(e);
}
var $e = {
	identify: (e) => Xe(e) && e >= 0,
	default: !0,
	tag: "tag:yaml.org,2002:int",
	format: "OCT",
	test: /^0o[0-7]+$/,
	resolve: (e, t, n) => Ze(e, 2, 8, n),
	stringify: (e) => Qe(e, 8, "0o")
}, et = {
	identify: Xe,
	default: !0,
	tag: "tag:yaml.org,2002:int",
	test: /^[-+]?[0-9]+$/,
	resolve: (e, t, n) => Ze(e, 0, 10, n),
	stringify: Ke
}, tt = {
	identify: (e) => Xe(e) && e >= 0,
	default: !0,
	tag: "tag:yaml.org,2002:int",
	format: "HEX",
	test: /^0x[0-9a-fA-F]+$/,
	resolve: (e, t, n) => Ze(e, 2, 16, n),
	stringify: (e) => Qe(e, 16, "0x")
}, nt = [
	ze,
	He,
	Ue,
	We,
	Ge,
	$e,
	et,
	tt,
	qe,
	Je,
	Ye
];
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/schema/json/schema.js
function rt(e) {
	return typeof e == "bigint" || Number.isInteger(e);
}
var it = ({ value: e }) => JSON.stringify(e), at = [
	{
		identify: (e) => typeof e == "string",
		default: !0,
		tag: "tag:yaml.org,2002:str",
		resolve: (e) => e,
		stringify: it
	},
	{
		identify: (e) => e == null,
		createNode: () => new I(null),
		default: !0,
		tag: "tag:yaml.org,2002:null",
		test: /^null$/,
		resolve: () => null,
		stringify: it
	},
	{
		identify: (e) => typeof e == "boolean",
		default: !0,
		tag: "tag:yaml.org,2002:bool",
		test: /^true$|^false$/,
		resolve: (e) => e === "true",
		stringify: it
	},
	{
		identify: rt,
		default: !0,
		tag: "tag:yaml.org,2002:int",
		test: /^-?(?:0|[1-9][0-9]*)$/,
		resolve: (e, t, { intAsBigInt: n }) => n ? BigInt(e) : parseInt(e, 10),
		stringify: ({ value: e }) => rt(e) ? e.toString() : JSON.stringify(e)
	},
	{
		identify: (e) => typeof e == "number",
		default: !0,
		tag: "tag:yaml.org,2002:float",
		test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
		resolve: (e) => parseFloat(e),
		stringify: it
	}
], ot = [ze, He].concat(at, {
	default: !0,
	tag: "",
	test: /^/,
	resolve(e, t) {
		return t(`Unresolved plain scalar ${JSON.stringify(e)}`), e;
	}
}), st = {
	identify: (e) => e instanceof Uint8Array,
	default: !1,
	tag: "tag:yaml.org,2002:binary",
	resolve(e, t) {
		if (typeof atob == "function") {
			let t = atob(e.replace(/[\n\r]/g, "")), n = new Uint8Array(t.length);
			for (let e = 0; e < t.length; ++e) n[e] = t.charCodeAt(e);
			return n;
		}
		return t("This environment does not support reading binary tags; either Buffer or atob is required"), e;
	},
	stringify({ comment: e, type: t, value: n }, r, i, a) {
		if (!n) return "";
		let o = n, s;
		if (typeof btoa == "function") {
			let e = "";
			for (let t = 0; t < o.length; ++t) e += String.fromCharCode(o[t]);
			s = btoa(e);
		} else throw Error("This environment does not support writing binary tags; either Buffer or btoa is required");
		if (t ??= I.BLOCK_LITERAL, t !== I.QUOTE_DOUBLE) {
			let e = Math.max(r.options.lineWidth - r.indent.length, r.options.minContentWidth), n = Math.ceil(s.length / e), i = Array(n);
			for (let t = 0, r = 0; t < n; ++t, r += e) i[t] = s.substr(r, e);
			s = i.join(t === I.BLOCK_LITERAL ? "\n" : " ");
		}
		return _e({
			comment: e,
			type: t,
			value: s
		}, r, i, a);
	}
};
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/pairs.js
function ct(e, t) {
	if (h(e)) for (let n = 0; n < e.items.length; ++n) {
		let r = e.items[n];
		if (!p(r)) {
			if (f(r)) {
				r.items.length > 1 && t("Each pair must have its own sequence indicator");
				let e = r.items[0] || new Me(new I(null));
				if (r.commentBefore && (e.key.commentBefore = e.key.commentBefore ? `${r.commentBefore}\n${e.key.commentBefore}` : r.commentBefore), r.comment) {
					let t = e.value ?? e.key;
					t.comment = t.comment ? `${r.comment}\n${t.comment}` : r.comment;
				}
				r = e;
			}
			e.items[n] = p(r) ? r : new Me(r);
		}
	}
	else t("Expected a sequence for this tag");
	return e;
}
function lt(e, t, n) {
	let { replacer: r } = n, i = new Be(e);
	i.tag = "tag:yaml.org,2002:pairs";
	let a = 0;
	if (t && Symbol.iterator in Object(t)) for (let e of t) {
		typeof r == "function" && (e = r.call(t, String(a++), e));
		let o, s;
		if (Array.isArray(e)) {
			if (e.length === 2) o = e[0], s = e[1];
			else throw TypeError(`Expected [key, value] tuple: ${e}`);
		} else if (e && e instanceof Object) {
			let t = Object.keys(e);
			if (t.length === 1) o = t[0], s = e[o];
			else throw TypeError(`Expected tuple with one key, not ${t.length} keys`);
		} else o = e;
		i.items.push(je(o, s, n));
	}
	return i;
}
var ut = {
	collection: "seq",
	default: !1,
	tag: "tag:yaml.org,2002:pairs",
	resolve: ct,
	createNode: lt
}, dt = class e extends Be {
	constructor() {
		super(), this.add = Re.prototype.add.bind(this), this.delete = Re.prototype.delete.bind(this), this.get = Re.prototype.get.bind(this), this.has = Re.prototype.has.bind(this), this.set = Re.prototype.set.bind(this), this.tag = e.tag;
	}
	toJSON(e, t) {
		if (!t) return super.toJSON(e);
		let n = /* @__PURE__ */ new Map();
		t?.onCreate && t.onCreate(n);
		for (let e of this.items) {
			let r, i;
			if (p(e) ? (r = M(e.key, "", t), i = M(e.value, r, t)) : r = M(e, "", t), n.has(r)) throw Error("Ordered maps must not include duplicate keys");
			n.set(r, i);
		}
		return n;
	}
	static from(e, t, n) {
		let r = lt(e, t, n), i = new this();
		return i.items = r.items, i;
	}
};
dt.tag = "tag:yaml.org,2002:omap";
var ft = {
	collection: "seq",
	identify: (e) => e instanceof Map,
	nodeClass: dt,
	default: !1,
	tag: "tag:yaml.org,2002:omap",
	resolve(e, t) {
		let n = ct(e, t), r = [];
		for (let { key: e } of n.items) m(e) && (r.includes(e.value) ? t(`Ordered maps must not include duplicate keys: ${e.value}`) : r.push(e.value));
		return Object.assign(new dt(), n);
	},
	createNode: (e, t, n) => dt.from(e, t, n)
};
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/bool.js
function pt({ value: e, source: t }, n) {
	return t && (e ? mt : ht).test.test(t) ? t : e ? n.options.trueStr : n.options.falseStr;
}
var mt = {
	identify: (e) => e === !0,
	default: !0,
	tag: "tag:yaml.org,2002:bool",
	test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
	resolve: () => new I(!0),
	stringify: pt
}, ht = {
	identify: (e) => e === !1,
	default: !0,
	tag: "tag:yaml.org,2002:bool",
	test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
	resolve: () => new I(!1),
	stringify: pt
}, gt = {
	identify: (e) => typeof e == "number",
	default: !0,
	tag: "tag:yaml.org,2002:float",
	test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
	resolve: (e) => e.slice(-3).toLowerCase() === "nan" ? NaN : e[0] === "-" ? -Infinity : Infinity,
	stringify: Ke
}, _t = {
	identify: (e) => typeof e == "number",
	default: !0,
	tag: "tag:yaml.org,2002:float",
	format: "EXP",
	test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
	resolve: (e) => parseFloat(e.replace(/_/g, "")),
	stringify(e) {
		let t = Number(e.value);
		return isFinite(t) ? t.toExponential() : Ke(e);
	}
}, vt = {
	identify: (e) => typeof e == "number",
	default: !0,
	tag: "tag:yaml.org,2002:float",
	test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
	resolve(e) {
		let t = new I(parseFloat(e.replace(/_/g, ""))), n = e.indexOf(".");
		if (n !== -1) {
			let r = e.substring(n + 1).replace(/_/g, "");
			r[r.length - 1] === "0" && (t.minFractionDigits = r.length);
		}
		return t;
	},
	stringify: Ke
}, yt = (e) => typeof e == "bigint" || Number.isInteger(e);
function bt(e, t, n, { intAsBigInt: r }) {
	let i = e[0];
	if ((i === "-" || i === "+") && (t += 1), e = e.substring(t).replace(/_/g, ""), r) {
		switch (n) {
			case 2:
				e = `0b${e}`;
				break;
			case 8:
				e = `0o${e}`;
				break;
			case 16: e = `0x${e}`;
		}
		let t = BigInt(e);
		return i === "-" ? BigInt(-1) * t : t;
	}
	let a = parseInt(e, n);
	return i === "-" ? -1 * a : a;
}
function xt(e, t, n) {
	let { value: r } = e;
	if (yt(r)) {
		let e = r.toString(t);
		return r < 0 ? "-" + n + e.substr(1) : n + e;
	}
	return Ke(e);
}
var St = {
	identify: yt,
	default: !0,
	tag: "tag:yaml.org,2002:int",
	format: "BIN",
	test: /^[-+]?0b[0-1_]+$/,
	resolve: (e, t, n) => bt(e, 2, 2, n),
	stringify: (e) => xt(e, 2, "0b")
}, Ct = {
	identify: yt,
	default: !0,
	tag: "tag:yaml.org,2002:int",
	format: "OCT",
	test: /^[-+]?0[0-7_]+$/,
	resolve: (e, t, n) => bt(e, 1, 8, n),
	stringify: (e) => xt(e, 8, "0")
}, wt = {
	identify: yt,
	default: !0,
	tag: "tag:yaml.org,2002:int",
	test: /^[-+]?[0-9][0-9_]*$/,
	resolve: (e, t, n) => bt(e, 0, 10, n),
	stringify: Ke
}, Tt = {
	identify: yt,
	default: !0,
	tag: "tag:yaml.org,2002:int",
	format: "HEX",
	test: /^[-+]?0x[0-9a-fA-F_]+$/,
	resolve: (e, t, n) => bt(e, 2, 16, n),
	stringify: (e) => xt(e, 16, "0x")
}, Et = class e extends Re {
	constructor(t) {
		super(t), this.tag = e.tag;
	}
	add(e) {
		let t;
		t = p(e) ? e : e && typeof e == "object" && "key" in e && "value" in e && e.value === null ? new Me(e.key, null) : new Me(e, null), Le(this.items, t.key) || this.items.push(t);
	}
	get(e, t) {
		let n = Le(this.items, e);
		return !t && p(n) ? m(n.key) ? n.key.value : n.key : n;
	}
	set(e, t) {
		if (typeof t != "boolean") throw Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof t}`);
		let n = Le(this.items, e);
		n && !t ? this.items.splice(this.items.indexOf(n), 1) : !n && t && this.items.push(new Me(e));
	}
	toJSON(e, t) {
		return super.toJSON(e, t, Set);
	}
	toString(e, t, n) {
		if (!e) return JSON.stringify(this);
		if (this.hasAllNullValues(!0)) return super.toString(Object.assign({}, e, { allNullValues: !0 }), t, n);
		throw Error("Set items must all have null values");
	}
	static from(e, t, n) {
		let { replacer: r } = n, i = new this(e);
		if (t && Symbol.iterator in Object(t)) for (let e of t) typeof r == "function" && (e = r.call(t, e, e)), i.items.push(je(e, null, n));
		return i;
	}
};
Et.tag = "tag:yaml.org,2002:set";
var Dt = {
	collection: "map",
	identify: (e) => e instanceof Set,
	nodeClass: Et,
	default: !1,
	tag: "tag:yaml.org,2002:set",
	createNode: (e, t, n) => Et.from(e, t, n),
	resolve(e, t) {
		if (f(e)) {
			if (e.hasAllNullValues(!0)) return Object.assign(new Et(), e);
			t("Set items must all have null values");
		} else t("Expected a mapping for this tag");
		return e;
	}
};
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/timestamp.js
function Ot(e, t) {
	let n = e[0], r = n === "-" || n === "+" ? e.substring(1) : e, i = (e) => t ? BigInt(e) : Number(e), a = r.replace(/_/g, "").split(":").reduce((e, t) => e * i(60) + i(t), i(0));
	return n === "-" ? i(-1) * a : a;
}
function kt(e) {
	let { value: t } = e, n = (e) => e;
	if (typeof t == "bigint") n = (e) => BigInt(e);
	else if (isNaN(t) || !isFinite(t)) return Ke(e);
	let r = "";
	t < 0 && (r = "-", t *= n(-1));
	let i = n(60), a = [t % i];
	return t < 60 ? a.unshift(0) : (t = (t - a[0]) / i, a.unshift(t % i), t >= 60 && (t = (t - a[0]) / i, a.unshift(t))), r + a.map((e) => String(e).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
}
var At = {
	identify: (e) => typeof e == "bigint" || Number.isInteger(e),
	default: !0,
	tag: "tag:yaml.org,2002:int",
	format: "TIME",
	test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
	resolve: (e, t, { intAsBigInt: n }) => Ot(e, n),
	stringify: kt
}, jt = {
	identify: (e) => typeof e == "number",
	default: !0,
	tag: "tag:yaml.org,2002:float",
	format: "TIME",
	test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
	resolve: (e) => Ot(e, !1),
	stringify: kt
}, Mt = {
	identify: (e) => e instanceof Date,
	default: !0,
	tag: "tag:yaml.org,2002:timestamp",
	test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
	resolve(e) {
		let t = e.match(Mt.test);
		if (!t) throw Error("!!timestamp expects a date, starting with yyyy-mm-dd");
		let [, n, r, i, a, o, s] = t.map(Number), c = t[7] ? Number((t[7] + "00").substr(1, 3)) : 0, l = Date.UTC(n, r - 1, i, a || 0, o || 0, s || 0, c), u = t[8];
		if (u && u !== "Z") {
			let e = Ot(u, !1);
			Math.abs(e) < 30 && (e *= 60), l -= 6e4 * e;
		}
		return new Date(l);
	},
	stringify: ({ value: e }) => e?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
}, Nt = [
	ze,
	He,
	Ue,
	We,
	mt,
	ht,
	St,
	Ct,
	wt,
	Tt,
	gt,
	_t,
	vt,
	st,
	we,
	ft,
	ut,
	Dt,
	At,
	jt,
	Mt
], Pt = /* @__PURE__ */ new Map([
	["core", nt],
	["failsafe", [
		ze,
		He,
		Ue
	]],
	["json", ot],
	["yaml11", Nt],
	["yaml-1.1", Nt]
]), Ft = {
	binary: st,
	bool: Ge,
	float: Ye,
	floatExp: Je,
	floatNaN: qe,
	floatTime: jt,
	int: et,
	intHex: tt,
	intOct: $e,
	intTime: At,
	map: ze,
	merge: we,
	null: We,
	omap: ft,
	pairs: ut,
	seq: He,
	set: Dt,
	timestamp: Mt
}, It = {
	"tag:yaml.org,2002:binary": st,
	"tag:yaml.org,2002:merge": we,
	"tag:yaml.org,2002:omap": ft,
	"tag:yaml.org,2002:pairs": ut,
	"tag:yaml.org,2002:set": Dt,
	"tag:yaml.org,2002:timestamp": Mt
};
function Lt(e, t, n) {
	let r = Pt.get(t);
	if (r && !e) return n && !r.includes(we) ? r.concat(we) : r.slice();
	let i = r;
	if (!i) {
		if (Array.isArray(e)) i = [];
		else {
			let e = Array.from(Pt.keys()).filter((e) => e !== "yaml11").map((e) => JSON.stringify(e)).join(", ");
			throw Error(`Unknown schema "${t}"; use one of ${e} or define customTags array`);
		}
	}
	if (Array.isArray(e)) for (let t of e) i = i.concat(t);
	else typeof e == "function" && (i = e(i.slice()));
	return n && (i = i.concat(we)), i.reduce((e, t) => {
		let n = typeof t == "string" ? Ft[t] : t;
		if (!n) {
			let e = JSON.stringify(t), n = Object.keys(Ft).map((e) => JSON.stringify(e)).join(", ");
			throw Error(`Unknown custom tag ${e}; use one of ${n}`);
		}
		return e.includes(n) || e.push(n), e;
	}, []);
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/schema/Schema.js
var Rt = (e, t) => e.key < t.key ? -1 : +(e.key > t.key), zt = class e {
	constructor({ compat: e, customTags: t, merge: n, resolveKnownTags: r, schema: i, sortMapEntries: o, toStringDefaults: l }) {
		this.compat = Array.isArray(e) ? Lt(e, "compat") : e ? Lt(null, e) : null, this.name = typeof i == "string" && i || "core", this.knownTags = r ? It : {}, this.tags = Lt(t, this.name, n), this.toStringOptions = l ?? null, Object.defineProperty(this, a, { value: ze }), Object.defineProperty(this, s, { value: Ue }), Object.defineProperty(this, c, { value: He }), this.sortMapEntries = typeof o == "function" ? o : o === !0 ? Rt : null;
	}
	clone() {
		let t = Object.create(e.prototype, Object.getOwnPropertyDescriptors(this));
		return t.tags = this.tags.slice(), t;
	}
};
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyDocument.js
function Bt(e, t) {
	let n = [], r = t.directives === !0;
	if (t.directives !== !1 && e.directives) {
		let t = e.directives.toString(e);
		t ? (n.push(t), r = !0) : e.directives.docStart && (r = !0);
	}
	r && n.push("---");
	let i = ve(e, t), { commentString: a } = i.options;
	if (e.commentBefore) {
		n.length !== 1 && n.unshift("");
		let t = a(e.commentBefore);
		n.unshift(B(t, ""));
	}
	let o = !1, s = null;
	if (e.contents) {
		if (_(e.contents)) {
			if (e.contents.spaceBefore && r && n.push(""), e.contents.commentBefore) {
				let t = a(e.contents.commentBefore);
				n.push(B(t, ""));
			}
			i.forceBlockIndent = !!e.comment, s = e.contents.comment;
		}
		let t = s ? void 0 : () => o = !0, c = be(e.contents, i, () => s = null, t);
		s && (c += V(c, "", a(s))), (c[0] === "|" || c[0] === ">") && n[n.length - 1] === "---" ? n[n.length - 1] = `--- ${c}` : n.push(c);
	} else n.push(be(e.contents, i));
	if (e.directives?.docEnd) {
		if (e.comment) {
			let t = a(e.comment);
			t.includes("\n") ? (n.push("..."), n.push(B(t, ""))) : n.push(`... ${t}`);
		} else n.push("...");
	} else {
		let t = e.comment;
		t && o && (t = t.replace(/^\n+/, "")), t && ((!o || s) && n[n.length - 1] !== "" && n.push(""), n.push(B(a(t), "")));
	}
	return n.join("\n") + "\n";
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/doc/Document.js
var Vt = class e {
	constructor(e, t, n) {
		this.commentBefore = null, this.comment = null, this.errors = [], this.warnings = [], Object.defineProperty(this, l, { value: i });
		let r = null;
		typeof t == "function" || Array.isArray(t) ? r = t : n === void 0 && t && (n = t, t = void 0);
		let a = Object.assign({
			intAsBigInt: !1,
			keepSourceTokens: !1,
			logLevel: "warn",
			prettyErrors: !0,
			strict: !0,
			stringKeys: !1,
			uniqueKeys: !0,
			version: "1.2"
		}, n);
		this.options = a;
		let { version: o } = a;
		n?._directives ? (this.directives = n._directives.atDocument(), this.directives.yaml.explicit && (o = this.directives.yaml.version)) : this.directives = new O({ version: o }), this.setSchema(o, n), this.contents = e === void 0 ? null : this.createNode(e, r, n);
	}
	clone() {
		let t = Object.create(e.prototype, { [l]: { value: i } });
		return t.commentBefore = this.commentBefore, t.comment = this.comment, t.errors = this.errors.slice(), t.warnings = this.warnings.slice(), t.options = Object.assign({}, this.options), this.directives && (t.directives = this.directives.clone()), t.schema = this.schema.clone(), t.contents = _(this.contents) ? this.contents.clone(t.schema) : this.contents, this.range && (t.range = this.range.slice()), t;
	}
	add(e) {
		Ht(this.contents) && this.contents.add(e);
	}
	addIn(e, t) {
		Ht(this.contents) && this.contents.addIn(e, t);
	}
	createAlias(e, t) {
		if (!e.anchor) {
			let n = te(this);
			e.anchor = !t || n.has(t) ? A(t || "a", n) : t;
		}
		return new N(e.anchor);
	}
	createNode(e, t, n) {
		let r;
		if (typeof t == "function") e = t.call({ "": e }, "", e), r = t;
		else if (Array.isArray(t)) {
			let e = t.filter((e) => typeof e == "number" || e instanceof String || e instanceof Number).map(String);
			e.length > 0 && (t = t.concat(e)), r = t;
		} else n === void 0 && t && (n = t, t = void 0);
		let { aliasDuplicateObjects: i, anchorPrefix: a, flow: o, keepUndefined: s, onTagObj: c, tag: l } = n ?? {}, { onAnchor: u, setAnchors: d, sourceObjects: f } = j(this, a || "a"), p = {
			aliasDuplicateObjects: i ?? !0,
			keepUndefined: s ?? !1,
			onAnchor: u,
			onTagObj: c,
			replacer: r,
			schema: this.schema,
			sourceObjects: f
		}, m = ae(e, l, p);
		return o && g(m) && (m.flow = !0), d(), m;
	}
	createPair(e, t, n = {}) {
		return new Me(this.createNode(e, null, n), this.createNode(t, null, n));
	}
	delete(e) {
		return Ht(this.contents) ? this.contents.delete(e) : !1;
	}
	deleteIn(e) {
		return oe(e) ? this.contents != null && (this.contents = null, !0) : Ht(this.contents) ? this.contents.deleteIn(e) : !1;
	}
	get(e, t) {
		return g(this.contents) ? this.contents.get(e, t) : void 0;
	}
	getIn(e, t) {
		return oe(e) ? !t && m(this.contents) ? this.contents.value : this.contents : g(this.contents) ? this.contents.getIn(e, t) : void 0;
	}
	has(e) {
		return g(this.contents) ? this.contents.has(e) : !1;
	}
	hasIn(e) {
		return oe(e) ? this.contents !== void 0 : g(this.contents) ? this.contents.hasIn(e) : !1;
	}
	set(e, t) {
		this.contents == null ? this.contents = R(this.schema, [e], t) : Ht(this.contents) && this.contents.set(e, t);
	}
	setIn(e, t) {
		oe(e) ? this.contents = t : this.contents == null ? this.contents = R(this.schema, Array.from(e), t) : Ht(this.contents) && this.contents.setIn(e, t);
	}
	setSchema(e, t = {}) {
		typeof e == "number" && (e = String(e));
		let n;
		switch (e) {
			case "1.1":
				this.directives ? this.directives.yaml.version = "1.1" : this.directives = new O({ version: "1.1" }), n = {
					resolveKnownTags: !1,
					schema: "yaml-1.1"
				};
				break;
			case "1.2":
			case "next":
				this.directives ? this.directives.yaml.version = e : this.directives = new O({ version: e }), n = {
					resolveKnownTags: !0,
					schema: "core"
				};
				break;
			case null:
				this.directives && delete this.directives, n = null;
				break;
			default: {
				let t = JSON.stringify(e);
				throw Error(`Expected '1.1', '1.2' or null as first argument, but found: ${t}`);
			}
		}
		if (t.schema instanceof Object) this.schema = t.schema;
		else if (n) this.schema = new zt(Object.assign(n, t));
		else throw Error("With a null YAML version, the { schema: Schema } option is required");
	}
	toJS({ json: e, jsonArg: t, mapAsMap: n, maxAliasCount: r, onAnchor: i, reviver: a } = {}) {
		let o = {
			anchors: /* @__PURE__ */ new Map(),
			doc: this,
			keep: !e,
			mapAsMap: n === !0,
			mapKeyWarned: !1,
			maxAliasCount: typeof r == "number" ? r : 100
		}, s = M(this.contents, t ?? "", o);
		if (typeof i == "function") for (let { count: e, res: t } of o.anchors.values()) i(t, e);
		return typeof a == "function" ? ne(a, { "": s }, "", s) : s;
	}
	toJSON(e, t) {
		return this.toJS({
			json: !0,
			jsonArg: e,
			mapAsMap: !1,
			onAnchor: t
		});
	}
	toString(e = {}) {
		if (this.errors.length > 0) throw Error("Document with errors cannot be stringified");
		if ("indent" in e && (!Number.isInteger(e.indent) || Number(e.indent) <= 0)) {
			let t = JSON.stringify(e.indent);
			throw Error(`"indent" option must be a positive integer, not ${t}`);
		}
		return Bt(this, e);
	}
};
function Ht(e) {
	if (g(e)) return !0;
	throw Error("Expected a YAML collection as document contents");
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/errors.js
var Ut = class extends Error {
	constructor(e, t, n, r) {
		super(), this.name = e, this.code = n, this.message = r, this.pos = t;
	}
}, Wt = class extends Ut {
	constructor(e, t, n) {
		super("YAMLParseError", e, t, n);
	}
}, Gt = class extends Ut {
	constructor(e, t, n) {
		super("YAMLWarning", e, t, n);
	}
}, Kt = (e, t) => (n) => {
	if (n.pos[0] === -1) return;
	n.linePos = n.pos.map((e) => t.linePos(e));
	let { line: r, col: i } = n.linePos[0];
	n.message += ` at line ${r}, column ${i}`;
	let a = i - 1, o = e.substring(t.lineStarts[r - 1], t.lineStarts[r]).replace(/[\n\r]+$/, "");
	if (a >= 60 && o.length > 80) {
		let e = Math.min(a - 39, o.length - 79);
		o = "…" + o.substring(e), a -= e - 1;
	}
	if (o.length > 80 && (o = o.substring(0, 79) + "…"), r > 1 && /^ *$/.test(o.substring(0, a))) {
		let n = e.substring(t.lineStarts[r - 2], t.lineStarts[r - 1]);
		n.length > 80 && (n = n.substring(0, 79) + "…\n"), o = n + o;
	}
	if (/[^ ]/.test(o)) {
		let e = 1, t = n.linePos[1];
		t?.line === r && t.col > i && (e = Math.max(1, Math.min(t.col - i, 80 - a)));
		let s = " ".repeat(a) + "^".repeat(e);
		n.message += `:\n\n${o}\n${s}\n`;
	}
};
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/resolve-props.js
function qt(e, { flow: t, indicator: n, next: r, offset: i, onError: a, parentIndent: o, startOnNewline: s }) {
	let c = !1, l = s, u = s, d = "", f = "", p = !1, m = !1, h = null, g = null, _ = null, v = null, y = null, b = null, x = null;
	for (let i of e) switch (m &&= (i.type !== "space" && i.type !== "newline" && i.type !== "comma" && a(i.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space"), !1), h &&= (l && i.type !== "comment" && i.type !== "newline" && a(h, "TAB_AS_INDENT", "Tabs are not allowed as indentation"), null), i.type) {
		case "space":
			!t && (n !== "doc-start" || r?.type !== "flow-collection") && i.source.includes("	") && (h = i), u = !0;
			break;
		case "comment": {
			u || a(i, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
			let e = i.source.substring(1) || " ";
			d ? d += f + e : d = e, f = "", l = !1;
			break;
		}
		case "newline":
			l ? d ? d += i.source : (!b || n !== "seq-item-ind") && (c = !0) : f += i.source, l = !0, p = !0, (g || _) && (v = i), u = !0;
			break;
		case "anchor":
			g && a(i, "MULTIPLE_ANCHORS", "A node can have at most one anchor"), i.source.endsWith(":") && a(i.offset + i.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", !0), g = i, x ??= i.offset, l = !1, u = !1, m = !0;
			break;
		case "tag":
			_ && a(i, "MULTIPLE_TAGS", "A node can have at most one tag"), _ = i, x ??= i.offset, l = !1, u = !1, m = !0;
			break;
		case n:
			(g || _) && a(i, "BAD_PROP_ORDER", `Anchors and tags must be after the ${i.source} indicator`), b && a(i, "UNEXPECTED_TOKEN", `Unexpected ${i.source} in ${t ?? "collection"}`), b = i, l = n === "seq-item-ind" || n === "explicit-key-ind", u = !1;
			break;
		case "comma": if (t) {
			y && a(i, "UNEXPECTED_TOKEN", `Unexpected , in ${t}`), y = i, l = !1, u = !1;
			break;
		}
		default: a(i, "UNEXPECTED_TOKEN", `Unexpected ${i.type} token`), l = !1, u = !1;
	}
	let S = e[e.length - 1], C = S ? S.offset + S.source.length : i;
	return m && r && r.type !== "space" && r.type !== "newline" && r.type !== "comma" && (r.type !== "scalar" || r.source !== "") && a(r.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space"), h && (l && h.indent <= o || r?.type === "block-map" || r?.type === "block-seq") && a(h, "TAB_AS_INDENT", "Tabs are not allowed as indentation"), {
		comma: y,
		found: b,
		spaceBefore: c,
		comment: d,
		hasNewline: p,
		anchor: g,
		tag: _,
		newlineAfterProp: v,
		end: C,
		start: x ?? C
	};
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/util-contains-newline.js
function Jt(e) {
	if (!e) return null;
	switch (e.type) {
		case "alias":
		case "scalar":
		case "double-quoted-scalar":
		case "single-quoted-scalar":
			if (e.source.includes("\n")) return !0;
			if (e.end) {
				for (let t of e.end) if (t.type === "newline") return !0;
			}
			return !1;
		case "flow-collection":
			for (let t of e.items) {
				for (let e of t.start) if (e.type === "newline") return !0;
				if (t.sep) {
					for (let e of t.sep) if (e.type === "newline") return !0;
				}
				if (Jt(t.key) || Jt(t.value)) return !0;
			}
			return !1;
		default: return !0;
	}
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/util-flow-indent-check.js
function Yt(e, t, n) {
	if (t?.type === "flow-collection") {
		let r = t.end[0];
		r.indent === e && (r.source === "]" || r.source === "}") && Jt(t) && n(r, "BAD_INDENT", "Flow end indicator should be more indented than parent", !0);
	}
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/util-map-includes.js
function Xt(e, t, n) {
	let { uniqueKeys: r } = e.options;
	if (r === !1) return !1;
	let i = typeof r == "function" ? r : (e, t) => e === t || m(e) && m(t) && e.value === t.value;
	return t.some((e) => i(e.key, n));
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/resolve-block-map.js
var Zt = "All mapping items must start at the same column";
function Qt({ composeNode: e, composeEmptyNode: t }, n, r, i, a) {
	let o = new ((a?.nodeClass) ?? Re)(n.schema);
	n.atRoot &&= !1;
	let s = r.offset, c = null;
	for (let a of r.items) {
		let { start: l, key: u, sep: d, value: f } = a, p = qt(l, {
			indicator: "explicit-key-ind",
			next: u ?? d?.[0],
			offset: s,
			onError: i,
			parentIndent: r.indent,
			startOnNewline: !0
		}), m = !p.found;
		if (m) {
			if (u && (u.type === "block-seq" ? i(s, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key") : "indent" in u && u.indent !== r.indent && i(s, "BAD_INDENT", Zt)), !p.anchor && !p.tag && !d) {
				c = p.end, p.comment && (o.comment ? o.comment += "\n" + p.comment : o.comment = p.comment);
				continue;
			}
			(p.newlineAfterProp || Jt(u)) && i(u ?? l[l.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
		} else p.found?.indent !== r.indent && i(s, "BAD_INDENT", Zt);
		n.atKey = !0;
		let h = p.end, g = u ? e(n, u, p, i) : t(n, h, l, null, p, i);
		n.schema.compat && Yt(r.indent, u, i), n.atKey = !1, Xt(n, o.items, g) && i(h, "DUPLICATE_KEY", "Map keys must be unique");
		let _ = qt(d ?? [], {
			indicator: "map-value-ind",
			next: f,
			offset: g.range[2],
			onError: i,
			parentIndent: r.indent,
			startOnNewline: !u || u.type === "block-scalar"
		});
		if (s = _.end, _.found) {
			m && (f?.type === "block-map" && !_.hasNewline && i(s, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings"), n.options.strict && p.start < _.found.offset - 1024 && i(g.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key"));
			let c = f ? e(n, f, _, i) : t(n, s, d, null, _, i);
			n.schema.compat && Yt(r.indent, f, i), s = c.range[2];
			let l = new Me(g, c);
			n.options.keepSourceTokens && (l.srcToken = a), o.items.push(l);
		} else {
			m && i(g.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values"), _.comment && (g.comment ? g.comment += "\n" + _.comment : g.comment = _.comment);
			let e = new Me(g);
			n.options.keepSourceTokens && (e.srcToken = a), o.items.push(e);
		}
	}
	return c && c < s && i(c, "IMPOSSIBLE", "Map comment with trailing content"), o.range = [
		r.offset,
		s,
		c ?? s
	], o;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/resolve-block-seq.js
function $t({ composeNode: e, composeEmptyNode: t }, n, r, i, a) {
	let o = new ((a?.nodeClass) ?? Be)(n.schema);
	n.atRoot &&= !1, n.atKey &&= !1;
	let s = r.offset, c = null;
	for (let { start: a, value: l } of r.items) {
		let u = qt(a, {
			indicator: "seq-item-ind",
			next: l,
			offset: s,
			onError: i,
			parentIndent: r.indent,
			startOnNewline: !0
		});
		if (!u.found) {
			if (u.anchor || u.tag || l) l?.type === "block-seq" ? i(u.end, "BAD_INDENT", "All sequence items must start at the same column") : i(s, "MISSING_CHAR", "Sequence item without - indicator");
			else {
				c = u.end, u.comment && (o.comment = u.comment);
				continue;
			}
		}
		let d = l ? e(n, l, u, i) : t(n, u.end, a, null, u, i);
		n.schema.compat && Yt(r.indent, l, i), s = d.range[2], o.items.push(d);
	}
	return o.range = [
		r.offset,
		s,
		c ?? s
	], o;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/resolve-end.js
function en(e, t, n, r) {
	let i = "";
	if (e) {
		let a = !1, o = "";
		for (let s of e) {
			let { source: e, type: c } = s;
			switch (c) {
				case "space":
					a = !0;
					break;
				case "comment": {
					n && !a && r(s, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
					let t = e.substring(1) || " ";
					i ? i += o + t : i = t, o = "";
					break;
				}
				case "newline":
					i && (o += e), a = !0;
					break;
				default: r(s, "UNEXPECTED_TOKEN", `Unexpected ${c} at node end`);
			}
			t += e.length;
		}
	}
	return {
		comment: i,
		offset: t
	};
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/resolve-flow-collection.js
var tn = "Block collections are not allowed within flow collections", nn = (e) => e && (e.type === "block-map" || e.type === "block-seq");
function rn({ composeNode: e, composeEmptyNode: t }, n, r, i, a) {
	let o = r.start.source === "{", s = o ? "flow map" : "flow sequence", c = new ((a?.nodeClass) ?? (o ? Re : Be))(n.schema);
	c.flow = !0;
	let l = n.atRoot;
	l && (n.atRoot = !1), n.atKey &&= !1;
	let u = r.offset + r.start.source.length;
	for (let a = 0; a < r.items.length; ++a) {
		let l = r.items[a], { start: d, key: f, sep: m, value: h } = l, g = qt(d, {
			flow: s,
			indicator: "explicit-key-ind",
			next: f ?? m?.[0],
			offset: u,
			onError: i,
			parentIndent: r.indent,
			startOnNewline: !1
		});
		if (!g.found) {
			if (!g.anchor && !g.tag && !m && !h) {
				a === 0 && g.comma ? i(g.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${s}`) : a < r.items.length - 1 && i(g.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${s}`), g.comment && (c.comment ? c.comment += "\n" + g.comment : c.comment = g.comment), u = g.end;
				continue;
			}
			!o && n.options.strict && Jt(f) && i(f, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
		}
		if (a === 0) g.comma && i(g.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${s}`);
		else if (g.comma || i(g.start, "MISSING_CHAR", `Missing , between ${s} items`), g.comment) {
			let e = "";
			loop: for (let t of d) switch (t.type) {
				case "comma":
				case "space": break;
				case "comment":
					e = t.source.substring(1);
					break loop;
				default: break loop;
			}
			if (e) {
				let t = c.items[c.items.length - 1];
				p(t) && (t = t.value ?? t.key), t.comment ? t.comment += "\n" + e : t.comment = e, g.comment = g.comment.substring(e.length + 1);
			}
		}
		if (!o && !m && !g.found) {
			let r = h ? e(n, h, g, i) : t(n, g.end, m, null, g, i);
			c.items.push(r), u = r.range[2], nn(h) && i(r.range, "BLOCK_IN_FLOW", tn);
		} else {
			n.atKey = !0;
			let a = g.end, p = f ? e(n, f, g, i) : t(n, a, d, null, g, i);
			nn(f) && i(p.range, "BLOCK_IN_FLOW", tn), n.atKey = !1;
			let _ = qt(m ?? [], {
				flow: s,
				indicator: "map-value-ind",
				next: h,
				offset: p.range[2],
				onError: i,
				parentIndent: r.indent,
				startOnNewline: !1
			});
			if (_.found) {
				if (!o && !g.found && n.options.strict) {
					if (m) for (let e of m) {
						if (e === _.found) break;
						if (e.type === "newline") {
							i(e, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
							break;
						}
					}
					g.start < _.found.offset - 1024 && i(_.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
				}
			} else h && ("source" in h && h.source?.[0] === ":" ? i(h, "MISSING_CHAR", `Missing space after : in ${s}`) : i(_.start, "MISSING_CHAR", `Missing , or : between ${s} items`));
			let v = h ? e(n, h, _, i) : _.found ? t(n, _.end, m, null, _, i) : null;
			v ? nn(h) && i(v.range, "BLOCK_IN_FLOW", tn) : _.comment && (p.comment ? p.comment += "\n" + _.comment : p.comment = _.comment);
			let y = new Me(p, v);
			if (n.options.keepSourceTokens && (y.srcToken = l), o) {
				let e = c;
				Xt(n, e.items, p) && i(a, "DUPLICATE_KEY", "Map keys must be unique"), e.items.push(y);
			} else {
				let e = new Re(n.schema);
				e.flow = !0, e.items.push(y);
				let t = (v ?? p).range;
				e.range = [
					p.range[0],
					t[1],
					t[2]
				], c.items.push(e);
			}
			u = v ? v.range[2] : _.end;
		}
	}
	let d = o ? "}" : "]", [f, ...m] = r.end, h = u;
	if (f?.source === d) h = f.offset + f.source.length;
	else {
		let e = s[0].toUpperCase() + s.substring(1), t = l ? `${e} must end with a ${d}` : `${e} in block collection must be sufficiently indented and end with a ${d}`;
		i(u, l ? "MISSING_CHAR" : "BAD_INDENT", t), f && f.source.length !== 1 && m.unshift(f);
	}
	if (m.length > 0) {
		let e = en(m, h, n.options.strict, i);
		e.comment && (c.comment ? c.comment += "\n" + e.comment : c.comment = e.comment), c.range = [
			r.offset,
			h,
			e.offset
		];
	} else c.range = [
		r.offset,
		h,
		h
	];
	return c;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/compose-collection.js
function an(e, t, n, r, i, a) {
	let o = n.type === "block-map" ? Qt(e, t, n, r, a) : n.type === "block-seq" ? $t(e, t, n, r, a) : rn(e, t, n, r, a), s = o.constructor;
	return i === "!" || i === s.tagName ? (o.tag = s.tagName, o) : (i && (o.tag = i), o);
}
function on(e, t, n, r, i) {
	let a = r.tag, o = a ? t.directives.tagName(a.source, (e) => i(a, "TAG_RESOLVE_FAILED", e)) : null;
	if (n.type === "block-seq") {
		let { anchor: e, newlineAfterProp: t } = r, n = e && a ? e.offset > a.offset ? e : a : e ?? a;
		n && (!t || t.offset < n.offset) && i(n, "MISSING_CHAR", "Missing newline after block sequence props");
	}
	let s = n.type === "block-map" ? "map" : n.type === "block-seq" ? "seq" : n.start.source === "{" ? "map" : "seq";
	if (!a || !o || o === "!" || o === Re.tagName && s === "map" || o === Be.tagName && s === "seq") return an(e, t, n, i, o);
	let c = t.schema.tags.find((e) => e.tag === o && e.collection === s);
	if (!c) {
		let r = t.schema.knownTags[o];
		if (r?.collection === s) t.schema.tags.push(Object.assign({}, r, { default: !1 })), c = r;
		else return r ? i(a, "BAD_COLLECTION_TYPE", `${r.tag} used for ${s} collection, but expects ${r.collection ?? "scalar"}`, !0) : i(a, "TAG_RESOLVE_FAILED", `Unresolved tag: ${o}`, !0), an(e, t, n, i, o);
	}
	let l = an(e, t, n, i, o, c), u = c.resolve?.(l, (e) => i(a, "TAG_RESOLVE_FAILED", e), t.options) ?? l, d = _(u) ? u : new I(u);
	return d.range = l.range, d.tag = o, c?.format && (d.format = c.format), d;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/resolve-block-scalar.js
function sn(e, t, n) {
	let r = t.offset, i = cn(t, e.options.strict, n);
	if (!i) return {
		value: "",
		type: null,
		comment: "",
		range: [
			r,
			r,
			r
		]
	};
	let a = i.mode === ">" ? I.BLOCK_FOLDED : I.BLOCK_LITERAL, o = t.source ? ln(t.source) : [], s = o.length;
	for (let e = o.length - 1; e >= 0; --e) {
		let t = o[e][1];
		if (t === "" || t === "\r") s = e;
		else break;
	}
	if (s === 0) {
		let e = i.chomp === "+" && o.length > 0 ? "\n".repeat(Math.max(1, o.length - 1)) : "", n = r + i.length;
		return t.source && (n += t.source.length), {
			value: e,
			type: a,
			comment: i.comment,
			range: [
				r,
				n,
				n
			]
		};
	}
	let c = t.indent + i.indent, l = t.offset + i.length, u = 0;
	for (let t = 0; t < s; ++t) {
		let [r, a] = o[t];
		if (a === "" || a === "\r") i.indent === 0 && r.length > c && (c = r.length);
		else {
			r.length < c && n(l + r.length, "MISSING_CHAR", "Block scalars with more-indented leading empty lines must use an explicit indentation indicator"), i.indent === 0 && (c = r.length), u = t, c === 0 && !e.atRoot && n(l, "BAD_INDENT", "Block scalar values in collections must be indented");
			break;
		}
		l += r.length + a.length + 1;
	}
	for (let e = o.length - 1; e >= s; --e) o[e][0].length > c && (s = e + 1);
	let d = "", f = "", p = !1;
	for (let e = 0; e < u; ++e) d += o[e][0].slice(c) + "\n";
	for (let e = u; e < s; ++e) {
		let [t, r] = o[e];
		l += t.length + r.length + 1;
		let s = r[r.length - 1] === "\r";
		/* istanbul ignore if already caught in lexer */
		if (s && (r = r.slice(0, -1)), r && t.length < c) {
			let e = `Block scalar lines must not be less indented than their ${i.indent ? "explicit indentation indicator" : "first line"}`;
			n(l - r.length - (s ? 2 : 1), "BAD_INDENT", e), t = "";
		}
		a === I.BLOCK_LITERAL ? (d += f + t.slice(c) + r, f = "\n") : t.length > c || r[0] === "	" ? (f === " " ? f = "\n" : !p && f === "\n" && (f = "\n\n"), d += f + t.slice(c) + r, f = "\n", p = !0) : r === "" ? f === "\n" ? d += "\n" : f = "\n" : (d += f + r, f = " ", p = !1);
	}
	switch (i.chomp) {
		case "-": break;
		case "+":
			for (let e = s; e < o.length; ++e) d += "\n" + o[e][0].slice(c);
			d[d.length - 1] !== "\n" && (d += "\n");
			break;
		default: d += "\n";
	}
	let m = r + i.length + t.source.length;
	return {
		value: d,
		type: a,
		comment: i.comment,
		range: [
			r,
			m,
			m
		]
	};
}
function cn({ offset: e, props: t }, n, r) {
	/* istanbul ignore if should not happen */
	if (t[0].type !== "block-scalar-header") return r(t[0], "IMPOSSIBLE", "Block scalar header not found"), null;
	let { source: i } = t[0], a = i[0], o = 0, s = "", c = -1;
	for (let t = 1; t < i.length; ++t) {
		let n = i[t];
		if (!s && (n === "-" || n === "+")) s = n;
		else {
			let r = Number(n);
			!o && r ? o = r : c === -1 && (c = e + t);
		}
	}
	c !== -1 && r(c, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${i}`);
	let l = !1, u = "", d = i.length;
	for (let e = 1; e < t.length; ++e) {
		let i = t[e];
		switch (i.type) {
			case "space": l = !0;
			case "newline":
				d += i.source.length;
				break;
			case "comment":
				n && !l && r(i, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters"), d += i.source.length, u = i.source.substring(1);
				break;
			case "error":
				r(i, "UNEXPECTED_TOKEN", i.message), d += i.source.length;
				break;
			/* istanbul ignore next should not happen */
			default: {
				r(i, "UNEXPECTED_TOKEN", `Unexpected token in block scalar header: ${i.type}`);
				let e = i.source;
				e && typeof e == "string" && (d += e.length);
			}
		}
	}
	return {
		mode: a,
		indent: o,
		chomp: s,
		comment: u,
		length: d
	};
}
function ln(e) {
	let t = e.split(/\n( *)/), n = t[0], r = n.match(/^( *)/), i = [r?.[1] ? [r[1], n.slice(r[1].length)] : ["", n]];
	for (let e = 1; e < t.length; e += 2) i.push([t[e], t[e + 1]]);
	return i;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/resolve-flow-scalar.js
function un(e, t, n) {
	let { offset: r, type: i, source: a, end: o } = e, s, c, l = (e, t, i) => n(r + e, t, i);
	switch (i) {
		case "scalar":
			s = I.PLAIN, c = dn(a, l);
			break;
		case "single-quoted-scalar":
			s = I.QUOTE_SINGLE, c = fn(a, l);
			break;
		case "double-quoted-scalar":
			s = I.QUOTE_DOUBLE, c = mn(a, l);
			break;
		/* istanbul ignore next should not happen */
		default: return n(e, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${i}`), {
			value: "",
			type: null,
			comment: "",
			range: [
				r,
				r + a.length,
				r + a.length
			]
		};
	}
	let u = r + a.length, d = en(o, u, t, n);
	return {
		value: c,
		type: s,
		comment: d.comment,
		range: [
			r,
			u,
			d.offset
		]
	};
}
function dn(e, t) {
	let n = "";
	switch (e[0]) {
		/* istanbul ignore next should not happen */
		case "	":
			n = "a tab character";
			break;
		case ",":
			n = "flow indicator character ,";
			break;
		case "%":
			n = "directive indicator character %";
			break;
		case "|":
		case ">":
			n = `block scalar indicator ${e[0]}`;
			break;
		case "@":
		case "`": n = `reserved character ${e[0]}`;
	}
	return n && t(0, "BAD_SCALAR_START", `Plain value cannot start with ${n}`), pn(e);
}
function fn(e, t) {
	return (e[e.length - 1] !== "'" || e.length === 1) && t(e.length, "MISSING_CHAR", "Missing closing 'quote"), pn(e.slice(1, -1)).replace(/''/g, "'");
}
function pn(e) {
	let t = /(.*?)\r?\n/sy, n = t.exec(e);
	if (!n) return e;
	let r, i;
	try {
		r = /* @__PURE__ */ RegExp("(?<![ 	])[ 	]+$"), i = /* @__PURE__ */ RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
	} catch {
		r = /[ \t]+$/, i = /^[ \t]+|[ \t]+$/g;
	}
	let a = n[1].replace(r, ""), o = " ", s = t.lastIndex;
	for (; n = t.exec(e);) {
		let e = n[1].replace(i, "");
		e === "" ? o === "\n" ? a += o : o = "\n" : (a += o + e, o = " "), s = t.lastIndex;
	}
	let c = /[ \t]*(.*)/sy;
	return c.lastIndex = s, n = c.exec(e), a + o + (n?.[1] ?? "");
}
function mn(e, t) {
	let n = "";
	for (let r = 1; r < e.length - 1; ++r) {
		let i = e[r];
		if (i !== "\r" || e[r + 1] !== "\n") {
			if (i === "\n") {
				let { fold: t, offset: i } = hn(e, r);
				n += t, r = i;
			} else if (i === "\\") {
				let i = e[++r], a = gn[i];
				if (a) n += a;
				else if (i === "\n") for (i = e[r + 1]; i === " " || i === "	";) i = e[++r + 1];
				else if (i === "\r" && e[r + 1] === "\n") for (i = e[++r + 1]; i === " " || i === "	";) i = e[++r + 1];
				else if (i === "x" || i === "u" || i === "U") {
					let a = i === "x" ? 2 : i === "u" ? 4 : 8;
					n += _n(e, r + 1, a, t), r += a;
				} else {
					let i = e.substr(r - 1, 2);
					t(r - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${i}`), n += i;
				}
			} else if (i === " " || i === "	") {
				let t = r, a = e[r + 1];
				for (; a === " " || a === "	";) a = e[++r + 1];
				a !== "\n" && (a !== "\r" || e[r + 2] !== "\n") && (n += r > t ? e.slice(t, r + 1) : i);
			} else n += i;
		}
	}
	return (e[e.length - 1] !== "\"" || e.length === 1) && t(e.length, "MISSING_CHAR", "Missing closing \"quote"), n;
}
function hn(e, t) {
	let n = "", r = e[t + 1];
	for (; (r === " " || r === "	" || r === "\n" || r === "\r") && (r !== "\r" || e[t + 2] === "\n");) r === "\n" && (n += "\n"), t += 1, r = e[t + 1];
	return n ||= " ", {
		fold: n,
		offset: t
	};
}
var gn = {
	0: "\0",
	a: "\x07",
	b: "\b",
	e: "\x1B",
	f: "\f",
	n: "\n",
	r: "\r",
	t: "	",
	v: "\v",
	N: "",
	_: "\xA0",
	L: "\u2028",
	P: "\u2029",
	" ": " ",
	"\"": "\"",
	"/": "/",
	"\\": "\\",
	"	": "	"
};
function _n(e, t, n, r) {
	let i = e.substr(t, n), a = i.length === n && /^[0-9a-fA-F]+$/.test(i) ? parseInt(i, 16) : NaN;
	try {
		return String.fromCodePoint(a);
	} catch {
		let i = e.substr(t - 2, n + 2);
		return r(t - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${i}`), i;
	}
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/compose-scalar.js
function vn(e, t, n, r) {
	let { value: i, type: a, comment: o, range: c } = t.type === "block-scalar" ? sn(e, t, r) : un(t, e.options.strict, r), l = n ? e.directives.tagName(n.source, (e) => r(n, "TAG_RESOLVE_FAILED", e)) : null, u;
	u = e.options.stringKeys && e.atKey ? e.schema[s] : l ? yn(e.schema, i, l, n, r) : t.type === "scalar" ? bn(e, i, t, r) : e.schema[s];
	let d;
	try {
		let a = u.resolve(i, (e) => r(n ?? t, "TAG_RESOLVE_FAILED", e), e.options);
		d = m(a) ? a : new I(a);
	} catch (e) {
		let a = e instanceof Error ? e.message : String(e);
		r(n ?? t, "TAG_RESOLVE_FAILED", a), d = new I(i);
	}
	return d.range = c, d.source = i, a && (d.type = a), l && (d.tag = l), u.format && (d.format = u.format), o && (d.comment = o), d;
}
function yn(e, t, n, r, i) {
	if (n === "!") return e[s];
	let a = [];
	for (let t of e.tags) if (!t.collection && t.tag === n) {
		if (t.default && t.test) a.push(t);
		else return t;
	}
	for (let e of a) if (e.test?.test(t)) return e;
	let o = e.knownTags[n];
	return o && !o.collection ? (e.tags.push(Object.assign({}, o, {
		default: !1,
		test: void 0
	})), o) : (i(r, "TAG_RESOLVE_FAILED", `Unresolved tag: ${n}`, n !== "tag:yaml.org,2002:str"), e[s]);
}
function bn({ atKey: e, directives: t, schema: n }, r, i, a) {
	let o = n.tags.find((t) => (t.default === !0 || e && t.default === "key") && t.test?.test(r)) || n[s];
	if (n.compat) {
		let e = n.compat.find((e) => e.default && e.test?.test(r)) ?? n[s];
		o.tag !== e.tag && a(i, "TAG_RESOLVE_FAILED", `Value may be parsed as either ${t.tagString(o.tag)} or ${t.tagString(e.tag)}`, !0);
	}
	return o;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/util-empty-scalar-position.js
function xn(e, t, n) {
	if (t) {
		n ??= t.length;
		for (let r = n - 1; r >= 0; --r) {
			let n = t[r];
			switch (n.type) {
				case "space":
				case "comment":
				case "newline":
					e -= n.source.length;
					continue;
			}
			for (n = t[++r]; n?.type === "space";) e += n.source.length, n = t[++r];
			break;
		}
	}
	return e;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/compose-node.js
var Sn = {
	composeNode: Cn,
	composeEmptyNode: wn
};
function Cn(e, t, n, r) {
	let i = e.atKey, { spaceBefore: a, comment: o, anchor: s, tag: c } = n, l, u = !0;
	switch (t.type) {
		case "alias":
			l = Tn(e, t, r), (s || c) && r(t, "ALIAS_PROPS", "An alias node must not specify any properties");
			break;
		case "scalar":
		case "single-quoted-scalar":
		case "double-quoted-scalar":
		case "block-scalar":
			l = vn(e, t, c, r), s && (l.anchor = s.source.substring(1));
			break;
		case "block-map":
		case "block-seq":
		case "flow-collection":
			try {
				l = on(Sn, e, t, n, r), s && (l.anchor = s.source.substring(1));
			} catch (e) {
				r(t, "RESOURCE_EXHAUSTION", e instanceof Error ? e.message : String(e));
			}
			break;
		default: r(t, "UNEXPECTED_TOKEN", t.type === "error" ? t.message : `Unsupported token (type: ${t.type})`), u = !1;
	}
	return l ??= wn(e, t.offset, void 0, null, n, r), s && l.anchor === "" && r(s, "BAD_ALIAS", "Anchor cannot be an empty string"), i && e.options.stringKeys && (!m(l) || typeof l.value != "string" || l.tag && l.tag !== "tag:yaml.org,2002:str") && r(c ?? t, "NON_STRING_KEY", "With stringKeys, all keys must be strings"), a && (l.spaceBefore = !0), o && (t.type === "scalar" && t.source === "" ? l.comment = o : l.commentBefore = o), e.options.keepSourceTokens && u && (l.srcToken = t), l;
}
function wn(e, t, n, r, { spaceBefore: i, comment: a, anchor: o, tag: s, end: c }, l) {
	let u = vn(e, {
		type: "scalar",
		offset: xn(t, n, r),
		indent: -1,
		source: ""
	}, s, l);
	return o && (u.anchor = o.source.substring(1), u.anchor === "" && l(o, "BAD_ALIAS", "Anchor cannot be an empty string")), i && (u.spaceBefore = !0), a && (u.comment = a, u.range[2] = c), u;
}
function Tn({ options: e }, { offset: t, source: n, end: r }, i) {
	let a = new N(n.substring(1));
	a.source === "" && i(t, "BAD_ALIAS", "Alias cannot be an empty string"), a.source.endsWith(":") && i(t + n.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", !0);
	let o = t + n.length, s = en(r, o, e.strict, i);
	return a.range = [
		t,
		o,
		s.offset
	], s.comment && (a.comment = s.comment), a;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/compose-doc.js
function En(e, t, { offset: n, start: r, value: i, end: a }, o) {
	let s = new Vt(void 0, Object.assign({ _directives: t }, e)), c = {
		atKey: !1,
		atRoot: !0,
		directives: s.directives,
		options: s.options,
		schema: s.schema
	}, l = qt(r, {
		indicator: "doc-start",
		next: i ?? a?.[0],
		offset: n,
		onError: o,
		parentIndent: 0,
		startOnNewline: !0
	});
	l.found && (s.directives.docStart = !0, i && (i.type === "block-map" || i.type === "block-seq") && !l.hasNewline && o(l.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker")), s.contents = i ? Cn(c, i, l, o) : wn(c, l.end, r, null, l, o);
	let u = s.contents.range[2], d = en(a, u, !1, o);
	return d.comment && (s.comment = d.comment), s.range = [
		n,
		u,
		d.offset
	], s;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/compose/composer.js
function Dn(e) {
	if (typeof e == "number") return [e, e + 1];
	if (Array.isArray(e)) return e.length === 2 ? e : [e[0], e[1]];
	let { offset: t, source: n } = e;
	return [t, t + (typeof n == "string" ? n.length : 1)];
}
function On(e) {
	let t = "", n = !1, r = !1;
	for (let i = 0; i < e.length; ++i) {
		let a = e[i];
		switch (a[0]) {
			case "#":
				t += (t === "" ? "" : r ? "\n\n" : "\n") + (a.substring(1) || " "), n = !0, r = !1;
				break;
			case "%":
				e[i + 1]?.[0] !== "#" && (i += 1), n = !1;
				break;
			default: n || (r = !0), n = !1;
		}
	}
	return {
		comment: t,
		afterEmptyLine: r
	};
}
var kn = class {
	constructor(e = {}) {
		this.doc = null, this.atDirectives = !1, this.prelude = [], this.errors = [], this.warnings = [], this.onError = (e, t, n, r) => {
			let i = Dn(e);
			r ? this.warnings.push(new Gt(i, t, n)) : this.errors.push(new Wt(i, t, n));
		}, this.directives = new O({ version: e.version || "1.2" }), this.options = e;
	}
	decorate(e, t) {
		let { comment: n, afterEmptyLine: r } = On(this.prelude);
		if (n) {
			let i = e.contents;
			if (t) e.comment = e.comment ? `${e.comment}\n${n}` : n;
			else if (r || e.directives.docStart || !i) e.commentBefore = n;
			else if (g(i) && !i.flow && i.items.length > 0) {
				let e = i.items[0];
				p(e) && (e = e.key);
				let t = e.commentBefore;
				e.commentBefore = t ? `${n}\n${t}` : n;
			} else {
				let e = i.commentBefore;
				i.commentBefore = e ? `${n}\n${e}` : n;
			}
		}
		if (t) {
			for (let t = 0; t < this.errors.length; ++t) e.errors.push(this.errors[t]);
			for (let t = 0; t < this.warnings.length; ++t) e.warnings.push(this.warnings[t]);
		} else e.errors = this.errors, e.warnings = this.warnings;
		this.prelude = [], this.errors = [], this.warnings = [];
	}
	streamInfo() {
		return {
			comment: On(this.prelude).comment,
			directives: this.directives,
			errors: this.errors,
			warnings: this.warnings
		};
	}
	*compose(e, t = !1, n = -1) {
		for (let t of e) yield* this.next(t);
		yield* this.end(t, n);
	}
	*next(e) {
		switch (e.type) {
			case "directive":
				this.directives.add(e.source, (t, n, r) => {
					let i = Dn(e);
					i[0] += t, this.onError(i, "BAD_DIRECTIVE", n, r);
				}), this.prelude.push(e.source), this.atDirectives = !0;
				break;
			case "document": {
				let t = En(this.options, this.directives, e, this.onError);
				this.atDirectives && !t.directives.docStart && this.onError(e, "MISSING_CHAR", "Missing directives-end/doc-start indicator line"), this.decorate(t, !1), this.doc && (yield this.doc), this.doc = t, this.atDirectives = !1;
				break;
			}
			case "byte-order-mark":
			case "space": break;
			case "comment":
			case "newline":
				this.prelude.push(e.source);
				break;
			case "error": {
				let t = e.source ? `${e.message}: ${JSON.stringify(e.source)}` : e.message, n = new Wt(Dn(e), "UNEXPECTED_TOKEN", t);
				this.atDirectives || !this.doc ? this.errors.push(n) : this.doc.errors.push(n);
				break;
			}
			case "doc-end": {
				if (!this.doc) {
					this.errors.push(new Wt(Dn(e), "UNEXPECTED_TOKEN", "Unexpected doc-end without preceding document"));
					break;
				}
				this.doc.directives.docEnd = !0;
				let t = en(e.end, e.offset + e.source.length, this.doc.options.strict, this.onError);
				if (this.decorate(this.doc, !0), t.comment) {
					let e = this.doc.comment;
					this.doc.comment = e ? `${e}\n${t.comment}` : t.comment;
				}
				this.doc.range[2] = t.offset;
				break;
			}
			default: this.errors.push(new Wt(Dn(e), "UNEXPECTED_TOKEN", `Unsupported token ${e.type}`));
		}
	}
	*end(e = !1, t = -1) {
		if (this.doc) this.decorate(this.doc, !0), yield this.doc, this.doc = null;
		else if (e) {
			let e = new Vt(void 0, Object.assign({ _directives: this.directives }, this.options));
			this.atDirectives && this.onError(t, "MISSING_CHAR", "Missing directives-end indicator line"), e.range = [
				0,
				t,
				t
			], this.decorate(e, !1), yield e;
		}
	}
}, An = Symbol("break visit"), jn = Symbol("skip children"), Mn = Symbol("remove item");
function Nn(e, t) {
	"type" in e && e.type === "document" && (e = {
		start: e.start,
		value: e.value
	}), Pn(Object.freeze([]), e, t);
}
Nn.BREAK = An, Nn.SKIP = jn, Nn.REMOVE = Mn, Nn.itemAtPath = (e, t) => {
	let n = e;
	for (let [e, r] of t) {
		let t = n?.[e];
		if (t && "items" in t) n = t.items[r];
		else return;
	}
	return n;
}, Nn.parentCollection = (e, t) => {
	let n = Nn.itemAtPath(e, t.slice(0, -1)), r = t[t.length - 1][0], i = n?.[r];
	if (i && "items" in i) return i;
	throw Error("Parent collection not found");
};
function Pn(e, t, n) {
	let r = n(t, e);
	if (typeof r == "symbol") return r;
	for (let i of ["key", "value"]) {
		let a = t[i];
		if (a && "items" in a) {
			for (let t = 0; t < a.items.length; ++t) {
				let r = Pn(Object.freeze(e.concat([[i, t]])), a.items[t], n);
				if (typeof r == "number") t = r - 1;
				else if (r === An) return An;
				else r === Mn && (a.items.splice(t, 1), --t);
			}
			typeof r == "function" && i === "key" && (r = r(t, e));
		}
	}
	return typeof r == "function" ? r(t, e) : r;
}
function Fn(e) {
	switch (e) {
		case "﻿": return "byte-order-mark";
		case "": return "doc-mode";
		case "": return "flow-error-end";
		case "": return "scalar";
		case "---": return "doc-start";
		case "...": return "doc-end";
		case "":
		case "\n":
		case "\r\n": return "newline";
		case "-": return "seq-item-ind";
		case "?": return "explicit-key-ind";
		case ":": return "map-value-ind";
		case "{": return "flow-map-start";
		case "}": return "flow-map-end";
		case "[": return "flow-seq-start";
		case "]": return "flow-seq-end";
		case ",": return "comma";
	}
	switch (e[0]) {
		case " ":
		case "	": return "space";
		case "#": return "comment";
		case "%": return "directive-line";
		case "*": return "alias";
		case "&": return "anchor";
		case "!": return "tag";
		case "'": return "single-quoted-scalar";
		case "\"": return "double-quoted-scalar";
		case "|":
		case ">": return "block-scalar-header";
	}
	return null;
}
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/parse/lexer.js
function In(e) {
	switch (e) {
		case void 0:
		case " ":
		case "\n":
		case "\r":
		case "	": return !0;
		default: return !1;
	}
}
var Ln = /* @__PURE__ */ new Set("0123456789ABCDEFabcdef"), Rn = /* @__PURE__ */ new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()"), zn = /* @__PURE__ */ new Set(",[]{}"), Bn = /* @__PURE__ */ new Set(" ,[]{}\n\r	"), Vn = (e) => !e || Bn.has(e), Hn = class {
	constructor() {
		this.atEnd = !1, this.blockScalarIndent = -1, this.blockScalarKeep = !1, this.buffer = "", this.flowKey = !1, this.flowLevel = 0, this.indentNext = 0, this.indentValue = 0, this.lineEndPos = null, this.next = null, this.pos = 0;
	}
	*lex(e, t = !1) {
		if (e) {
			if (typeof e != "string") throw TypeError("source is not a string");
			this.buffer = this.buffer ? this.buffer + e : e, this.lineEndPos = null;
		}
		this.atEnd = !t;
		let n = this.next ?? "stream";
		for (; n && (t || this.hasChars(1));) n = yield* this.parseNext(n);
	}
	atLineEnd() {
		let e = this.pos, t = this.buffer[e];
		for (; t === " " || t === "	";) t = this.buffer[++e];
		return !t || t === "#" || t === "\n" || t === "\r" && this.buffer[e + 1] === "\n";
	}
	charAt(e) {
		return this.buffer[this.pos + e];
	}
	continueScalar(e) {
		let t = this.buffer[e];
		if (this.indentNext > 0) {
			let n = 0;
			for (; t === " ";) t = this.buffer[++n + e];
			if (t === "\r") {
				let t = this.buffer[n + e + 1];
				if (t === "\n" || !t && !this.atEnd) return e + n + 1;
			}
			return t === "\n" || n >= this.indentNext || !t && !this.atEnd ? e + n : -1;
		}
		if (t === "-" || t === ".") {
			let t = this.buffer.substr(e, 3);
			if ((t === "---" || t === "...") && In(this.buffer[e + 3])) return -1;
		}
		return e;
	}
	getLine() {
		let e = this.lineEndPos;
		return (typeof e != "number" || e !== -1 && e < this.pos) && (e = this.buffer.indexOf("\n", this.pos), this.lineEndPos = e), e === -1 ? this.atEnd ? this.buffer.substring(this.pos) : null : (this.buffer[e - 1] === "\r" && --e, this.buffer.substring(this.pos, e));
	}
	hasChars(e) {
		return this.pos + e <= this.buffer.length;
	}
	setNext(e) {
		return this.buffer = this.buffer.substring(this.pos), this.pos = 0, this.lineEndPos = null, this.next = e, null;
	}
	peek(e) {
		return this.buffer.substr(this.pos, e);
	}
	*parseNext(e) {
		switch (e) {
			case "stream": return yield* this.parseStream();
			case "line-start": return yield* this.parseLineStart();
			case "block-start": return yield* this.parseBlockStart();
			case "doc": return yield* this.parseDocument();
			case "flow": return yield* this.parseFlowCollection();
			case "quoted-scalar": return yield* this.parseQuotedScalar();
			case "block-scalar": return yield* this.parseBlockScalar();
			case "plain-scalar": return yield* this.parsePlainScalar();
		}
	}
	*parseStream() {
		let e = this.getLine();
		if (e === null) return this.setNext("stream");
		if (e[0] === "﻿" && (yield* this.pushCount(1), e = e.substring(1)), e[0] === "%") {
			let t = e.length, n = e.indexOf("#");
			for (; n !== -1;) {
				let r = e[n - 1];
				if (r === " " || r === "	") {
					t = n - 1;
					break;
				}
				n = e.indexOf("#", n + 1);
			}
			for (;;) {
				let n = e[t - 1];
				if (n === " " || n === "	") --t;
				else break;
			}
			let r = (yield* this.pushCount(t)) + (yield* this.pushSpaces(!0));
			return yield* this.pushCount(e.length - r), this.pushNewline(), "stream";
		}
		if (this.atLineEnd()) {
			let t = yield* this.pushSpaces(!0);
			return yield* this.pushCount(e.length - t), yield* this.pushNewline(), "stream";
		}
		return yield "", yield* this.parseLineStart();
	}
	*parseLineStart() {
		let e = this.charAt(0);
		if (!e && !this.atEnd) return this.setNext("line-start");
		if (e === "-" || e === ".") {
			if (!this.atEnd && !this.hasChars(4)) return this.setNext("line-start");
			let e = this.peek(3);
			if ((e === "---" || e === "...") && In(this.charAt(3))) return yield* this.pushCount(3), this.indentValue = 0, this.indentNext = 0, e === "---" ? "doc" : "stream";
		}
		return this.indentValue = yield* this.pushSpaces(!1), this.indentNext > this.indentValue && !In(this.charAt(1)) && (this.indentNext = this.indentValue), yield* this.parseBlockStart();
	}
	*parseBlockStart() {
		let [e, t] = this.peek(2);
		if (!t && !this.atEnd) return this.setNext("block-start");
		if ((e === "-" || e === "?" || e === ":") && In(t)) {
			let e = (yield* this.pushCount(1)) + (yield* this.pushSpaces(!0));
			return this.indentNext = this.indentValue + 1, this.indentValue += e, "block-start";
		}
		return "doc";
	}
	*parseDocument() {
		yield* this.pushSpaces(!0);
		let e = this.getLine();
		if (e === null) return this.setNext("doc");
		let t = yield* this.pushIndicators();
		switch (e[t]) {
			case "#": yield* this.pushCount(e.length - t);
			case void 0: return yield* this.pushNewline(), yield* this.parseLineStart();
			case "{":
			case "[": return yield* this.pushCount(1), this.flowKey = !1, this.flowLevel = 1, "flow";
			case "}":
			case "]": return yield* this.pushCount(1), "doc";
			case "*": return yield* this.pushUntil(Vn), "doc";
			case "\"":
			case "'": return yield* this.parseQuotedScalar();
			case "|":
			case ">": return t += yield* this.parseBlockScalarHeader(), t += yield* this.pushSpaces(!0), yield* this.pushCount(e.length - t), yield* this.pushNewline(), yield* this.parseBlockScalar();
			default: return yield* this.parsePlainScalar();
		}
	}
	*parseFlowCollection() {
		let e, t, n = -1;
		do
			e = yield* this.pushNewline(), e > 0 ? (t = yield* this.pushSpaces(!1), this.indentValue = n = t) : t = 0, t += yield* this.pushSpaces(!0);
		while (e + t > 0);
		let r = this.getLine();
		if (r === null) return this.setNext("flow");
		if ((n !== -1 && n < this.indentNext && r[0] !== "#" || n === 0 && (r.startsWith("---") || r.startsWith("...")) && In(r[3])) && (n !== this.indentNext - 1 || this.flowLevel !== 1 || r[0] !== "]" && r[0] !== "}")) return this.flowLevel = 0, yield "", yield* this.parseLineStart();
		let i = 0;
		for (; r[i] === ",";) i += yield* this.pushCount(1), i += yield* this.pushSpaces(!0), this.flowKey = !1;
		switch (i += yield* this.pushIndicators(), r[i]) {
			case void 0: return "flow";
			case "#": return yield* this.pushCount(r.length - i), "flow";
			case "{":
			case "[": return yield* this.pushCount(1), this.flowKey = !1, this.flowLevel += 1, "flow";
			case "}":
			case "]": return yield* this.pushCount(1), this.flowKey = !0, --this.flowLevel, this.flowLevel ? "flow" : "doc";
			case "*": return yield* this.pushUntil(Vn), "flow";
			case "\"":
			case "'": return this.flowKey = !0, yield* this.parseQuotedScalar();
			case ":": {
				let e = this.charAt(1);
				if (this.flowKey || In(e) || e === ",") return this.flowKey = !1, yield* this.pushCount(1), yield* this.pushSpaces(!0), "flow";
			}
			default: return this.flowKey = !1, yield* this.parsePlainScalar();
		}
	}
	*parseQuotedScalar() {
		let e = this.charAt(0), t = this.buffer.indexOf(e, this.pos + 1);
		if (e === "'") for (; t !== -1 && this.buffer[t + 1] === "'";) t = this.buffer.indexOf("'", t + 2);
		else for (; t !== -1;) {
			let e = 0;
			for (; this.buffer[t - 1 - e] === "\\";) e += 1;
			if (e % 2 == 0) break;
			t = this.buffer.indexOf("\"", t + 1);
		}
		let n = this.buffer.substring(0, t), r = n.indexOf("\n", this.pos);
		if (r !== -1) {
			for (; r !== -1;) {
				let e = this.continueScalar(r + 1);
				if (e === -1) break;
				r = n.indexOf("\n", e);
			}
			r !== -1 && (t = r - (n[r - 1] === "\r" ? 2 : 1));
		}
		if (t === -1) {
			if (!this.atEnd) return this.setNext("quoted-scalar");
			t = this.buffer.length;
		}
		return yield* this.pushToIndex(t + 1, !1), this.flowLevel ? "flow" : "doc";
	}
	*parseBlockScalarHeader() {
		this.blockScalarIndent = -1, this.blockScalarKeep = !1;
		let e = this.pos;
		for (;;) {
			let t = this.buffer[++e];
			if (t === "+") this.blockScalarKeep = !0;
			else if (t > "0" && t <= "9") this.blockScalarIndent = Number(t) - 1;
			else if (t !== "-") break;
		}
		return yield* this.pushUntil((e) => In(e) || e === "#");
	}
	*parseBlockScalar() {
		let e = this.pos - 1, t = 0, n;
		loop: for (let r = this.pos; n = this.buffer[r]; ++r) switch (n) {
			case " ":
				t += 1;
				break;
			case "\n":
				e = r, t = 0;
				break;
			case "\r": {
				let e = this.buffer[r + 1];
				if (!e && !this.atEnd) return this.setNext("block-scalar");
				if (e === "\n") break;
			}
			default: break loop;
		}
		if (!n && !this.atEnd) return this.setNext("block-scalar");
		if (t >= this.indentNext) {
			this.indentNext = this.blockScalarIndent === -1 ? t : this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
			do {
				let t = this.continueScalar(e + 1);
				if (t === -1) break;
				e = this.buffer.indexOf("\n", t);
			} while (e !== -1);
			if (e === -1) {
				if (!this.atEnd) return this.setNext("block-scalar");
				e = this.buffer.length;
			}
		}
		let r = e + 1;
		for (n = this.buffer[r]; n === " ";) n = this.buffer[++r];
		if (n === "	") {
			for (; n === "	" || n === " " || n === "\r" || n === "\n";) n = this.buffer[++r];
			e = r - 1;
		} else if (!this.blockScalarKeep) do {
			let n = e - 1, r = this.buffer[n];
			r === "\r" && (r = this.buffer[--n]);
			let i = n;
			for (; r === " ";) r = this.buffer[--n];
			if (r === "\n" && n >= this.pos && n + 1 + t > i) e = n;
			else break;
		} while (1);
		return yield "", yield* this.pushToIndex(e + 1, !0), yield* this.parseLineStart();
	}
	*parsePlainScalar() {
		let e = this.flowLevel > 0, t = this.pos - 1, n = this.pos - 1, r;
		for (; r = this.buffer[++n];) if (r === ":") {
			let r = this.buffer[n + 1];
			if (In(r) || e && zn.has(r)) break;
			t = n;
		} else if (In(r)) {
			let i = this.buffer[n + 1];
			if (r === "\r" && (i === "\n" ? (n += 1, r = "\n", i = this.buffer[n + 1]) : t = n), i === "#" || e && zn.has(i)) break;
			if (r === "\n") {
				let e = this.continueScalar(n + 1);
				if (e === -1) break;
				n = Math.max(n, e - 2);
			}
		} else {
			if (e && zn.has(r)) break;
			t = n;
		}
		return !r && !this.atEnd ? this.setNext("plain-scalar") : (yield "", yield* this.pushToIndex(t + 1, !0), e ? "flow" : "doc");
	}
	*pushCount(e) {
		return e > 0 ? (yield this.buffer.substr(this.pos, e), this.pos += e, e) : 0;
	}
	*pushToIndex(e, t) {
		let n = this.buffer.slice(this.pos, e);
		return n ? (yield n, this.pos += n.length, n.length) : (t && (yield ""), 0);
	}
	*pushIndicators() {
		let e = 0;
		loop: for (;;) {
			switch (this.charAt(0)) {
				case "!":
					e += yield* this.pushTag(), e += yield* this.pushSpaces(!0);
					continue loop;
				case "&":
					e += yield* this.pushUntil(Vn), e += yield* this.pushSpaces(!0);
					continue loop;
				case "-":
				case "?":
				case ":": {
					let t = this.flowLevel > 0, n = this.charAt(1);
					if (In(n) || t && zn.has(n)) {
						t ? this.flowKey &&= !1 : this.indentNext = this.indentValue + 1, e += yield* this.pushCount(1), e += yield* this.pushSpaces(!0);
						continue loop;
					}
				}
			}
			break loop;
		}
		return e;
	}
	*pushTag() {
		if (this.charAt(1) === "<") {
			let e = this.pos + 2, t = this.buffer[e];
			for (; !In(t) && t !== ">";) t = this.buffer[++e];
			return yield* this.pushToIndex(t === ">" ? e + 1 : e, !1);
		}
		{
			let e = this.pos + 1, t = this.buffer[e];
			for (; t;) if (Rn.has(t)) t = this.buffer[++e];
			else if (t === "%" && Ln.has(this.buffer[e + 1]) && Ln.has(this.buffer[e + 2])) t = this.buffer[e += 3];
			else break;
			return yield* this.pushToIndex(e, !1);
		}
	}
	*pushNewline() {
		let e = this.buffer[this.pos];
		return e === "\n" ? yield* this.pushCount(1) : e === "\r" && this.charAt(1) === "\n" ? yield* this.pushCount(2) : 0;
	}
	*pushSpaces(e) {
		let t = this.pos - 1, n;
		do
			n = this.buffer[++t];
		while (n === " " || e && n === "	");
		let r = t - this.pos;
		return r > 0 && (yield this.buffer.substr(this.pos, r), this.pos = t), r;
	}
	*pushUntil(e) {
		let t = this.pos, n = this.buffer[t];
		for (; !e(n);) n = this.buffer[++t];
		return yield* this.pushToIndex(t, !1);
	}
}, Un = class {
	constructor() {
		this.lineStarts = [], this.addNewLine = (e) => this.lineStarts.push(e), this.linePos = (e) => {
			let t = 0, n = this.lineStarts.length;
			for (; t < n;) {
				let r = t + n >> 1;
				this.lineStarts[r] < e ? t = r + 1 : n = r;
			}
			if (this.lineStarts[t] === e) return {
				line: t + 1,
				col: 1
			};
			if (t === 0) return {
				line: 0,
				col: e
			};
			let r = this.lineStarts[t - 1];
			return {
				line: t,
				col: e - r + 1
			};
		};
	}
};
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/parse/parser.js
function Wn(e, t) {
	for (let n = 0; n < e.length; ++n) if (e[n].type === t) return !0;
	return !1;
}
function Gn(e) {
	for (let t = 0; t < e.length; ++t) switch (e[t].type) {
		case "space":
		case "comment":
		case "newline": break;
		default: return t;
	}
	return -1;
}
function Kn(e) {
	switch (e?.type) {
		case "alias":
		case "scalar":
		case "single-quoted-scalar":
		case "double-quoted-scalar":
		case "flow-collection": return !0;
		default: return !1;
	}
}
function qn(e) {
	switch (e.type) {
		case "document": return e.start;
		case "block-map": {
			let t = e.items[e.items.length - 1];
			return t.sep ?? t.start;
		}
		case "block-seq": return e.items[e.items.length - 1].start;
		/* istanbul ignore next should not happen */
		default: return [];
	}
}
function Jn(e) {
	if (e.length === 0) return [];
	let t = e.length;
	loop: for (; --t >= 0;) switch (e[t].type) {
		case "doc-start":
		case "explicit-key-ind":
		case "map-value-ind":
		case "seq-item-ind":
		case "newline": break loop;
	}
	for (; e[++t]?.type === "space";);
	return e.splice(t, e.length);
}
function Yn(e, t) {
	if (t.length < 1e5) Array.prototype.push.apply(e, t);
	else for (let n = 0; n < t.length; ++n) e.push(t[n]);
}
function Xn(e) {
	if (e.start.type === "flow-seq-start") for (let t of e.items) t.sep && !t.value && !Wn(t.start, "explicit-key-ind") && !Wn(t.sep, "map-value-ind") && (t.key && (t.value = t.key), delete t.key, Kn(t.value) ? t.value.end ? Yn(t.value.end, t.sep) : t.value.end = t.sep : Yn(t.start, t.sep), delete t.sep);
}
var Zn = class {
	constructor(e) {
		this.atNewLine = !0, this.atScalar = !1, this.indent = 0, this.offset = 0, this.onKeyLine = !1, this.stack = [], this.source = "", this.type = "", this.lexer = new Hn(), this.onNewLine = e;
	}
	*parse(e, t = !1) {
		this.onNewLine && this.offset === 0 && this.onNewLine(0);
		for (let n of this.lexer.lex(e, t)) yield* this.next(n);
		t || (yield* this.end());
	}
	*next(e) {
		if (this.source = e, this.atScalar) {
			this.atScalar = !1, yield* this.step(), this.offset += e.length;
			return;
		}
		let t = Fn(e);
		if (!t) {
			let t = `Not a YAML token: ${e}`;
			yield* this.pop({
				type: "error",
				offset: this.offset,
				message: t,
				source: e
			}), this.offset += e.length;
		} else if (t === "scalar") this.atNewLine = !1, this.atScalar = !0, this.type = "scalar";
		else {
			switch (this.type = t, yield* this.step(), t) {
				case "newline":
					this.atNewLine = !0, this.indent = 0, this.onNewLine && this.onNewLine(this.offset + e.length);
					break;
				case "space":
					this.atNewLine && e[0] === " " && (this.indent += e.length);
					break;
				case "explicit-key-ind":
				case "map-value-ind":
				case "seq-item-ind":
					this.atNewLine && (this.indent += e.length);
					break;
				case "doc-mode":
				case "flow-error-end": return;
				default: this.atNewLine = !1;
			}
			this.offset += e.length;
		}
	}
	*end() {
		for (; this.stack.length > 0;) yield* this.pop();
	}
	get sourceToken() {
		return {
			type: this.type,
			offset: this.offset,
			indent: this.indent,
			source: this.source
		};
	}
	*step() {
		let e = this.peek(1);
		if (this.type === "doc-end" && e?.type !== "doc-end") {
			for (; this.stack.length > 0;) yield* this.pop();
			this.stack.push({
				type: "doc-end",
				offset: this.offset,
				source: this.source
			});
		} else {
			if (!e) return yield* this.stream();
			switch (e.type) {
				case "document": return yield* this.document(e);
				case "alias":
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": return yield* this.scalar(e);
				case "block-scalar": return yield* this.blockScalar(e);
				case "block-map": return yield* this.blockMap(e);
				case "block-seq": return yield* this.blockSequence(e);
				case "flow-collection": return yield* this.flowCollection(e);
				case "doc-end": return yield* this.documentEnd(e);
			}
			/* istanbul ignore next should not happen */
			yield* this.pop();
		}
	}
	peek(e) {
		return this.stack[this.stack.length - e];
	}
	*pop(e) {
		let t = e ?? this.stack.pop();
		/* istanbul ignore if should not happen */
		if (!t) yield {
			type: "error",
			offset: this.offset,
			source: "",
			message: "Tried to pop an empty stack"
		};
		else if (this.stack.length === 0) yield t;
		else {
			let e = this.peek(1);
			switch (t.type === "block-scalar" ? t.indent = "indent" in e ? e.indent : 0 : t.type === "flow-collection" && e.type === "document" && (t.indent = 0), t.type === "flow-collection" && Xn(t), e.type) {
				case "document":
					e.value = t;
					break;
				case "block-scalar":
					e.props.push(t);
					break;
				case "block-map": {
					let n = e.items[e.items.length - 1];
					if (n.value) {
						e.items.push({
							start: [],
							key: t,
							sep: []
						}), this.onKeyLine = !0;
						return;
					}
					if (n.sep) n.value = t;
					else {
						Object.assign(n, {
							key: t,
							sep: []
						}), this.onKeyLine = !n.explicitKey;
						return;
					}
					break;
				}
				case "block-seq": {
					let n = e.items[e.items.length - 1];
					n.value ? e.items.push({
						start: [],
						value: t
					}) : n.value = t;
					break;
				}
				case "flow-collection": {
					let n = e.items[e.items.length - 1];
					!n || n.value ? e.items.push({
						start: [],
						key: t,
						sep: []
					}) : n.sep ? n.value = t : Object.assign(n, {
						key: t,
						sep: []
					});
					return;
				}
				/* istanbul ignore next should not happen */
				default: yield* this.pop(), yield* this.pop(t);
			}
			if ((e.type === "document" || e.type === "block-map" || e.type === "block-seq") && (t.type === "block-map" || t.type === "block-seq")) {
				let n = t.items[t.items.length - 1];
				n && !n.sep && !n.value && n.start.length > 0 && Gn(n.start) === -1 && (t.indent === 0 || n.start.every((e) => e.type !== "comment" || e.indent < t.indent)) && (e.type === "document" ? e.end = n.start : e.items.push({ start: n.start }), t.items.splice(-1, 1));
			}
		}
	}
	*stream() {
		switch (this.type) {
			case "directive-line":
				yield {
					type: "directive",
					offset: this.offset,
					source: this.source
				};
				return;
			case "byte-order-mark":
			case "space":
			case "comment":
			case "newline":
				yield this.sourceToken;
				return;
			case "doc-mode":
			case "doc-start": {
				let e = {
					type: "document",
					offset: this.offset,
					start: []
				};
				this.type === "doc-start" && e.start.push(this.sourceToken), this.stack.push(e);
				return;
			}
		}
		yield {
			type: "error",
			offset: this.offset,
			message: `Unexpected ${this.type} token in YAML stream`,
			source: this.source
		};
	}
	*document(e) {
		if (e.value) return yield* this.lineEnd(e);
		switch (this.type) {
			case "doc-start":
				Gn(e.start) === -1 ? e.start.push(this.sourceToken) : (yield* this.pop(), yield* this.step());
				return;
			case "anchor":
			case "tag":
			case "space":
			case "comment":
			case "newline":
				e.start.push(this.sourceToken);
				return;
		}
		let t = this.startBlockValue(e);
		t ? this.stack.push(t) : yield {
			type: "error",
			offset: this.offset,
			message: `Unexpected ${this.type} token in YAML document`,
			source: this.source
		};
	}
	*scalar(e) {
		if (this.type === "map-value-ind") {
			let t = Jn(qn(this.peek(2))), n;
			e.end ? (n = e.end, n.push(this.sourceToken), delete e.end) : n = [this.sourceToken];
			let r = {
				type: "block-map",
				offset: e.offset,
				indent: e.indent,
				items: [{
					start: t,
					key: e,
					sep: n
				}]
			};
			this.onKeyLine = !0, this.stack[this.stack.length - 1] = r;
		} else yield* this.lineEnd(e);
	}
	*blockScalar(e) {
		switch (this.type) {
			case "space":
			case "comment":
			case "newline":
				e.props.push(this.sourceToken);
				return;
			case "scalar":
				if (e.source = this.source, this.atNewLine = !0, this.indent = 0, this.onNewLine) {
					let e = this.source.indexOf("\n") + 1;
					for (; e !== 0;) this.onNewLine(this.offset + e), e = this.source.indexOf("\n", e) + 1;
				}
				yield* this.pop();
				break;
			/* istanbul ignore next should not happen */
			default: yield* this.pop(), yield* this.step();
		}
	}
	*blockMap(e) {
		let t = e.items[e.items.length - 1];
		switch (this.type) {
			case "newline":
				if (this.onKeyLine = !1, t.value) {
					let n = "end" in t.value ? t.value.end : void 0;
					(Array.isArray(n) ? n[n.length - 1] : void 0)?.type === "comment" ? n?.push(this.sourceToken) : e.items.push({ start: [this.sourceToken] });
				} else t.sep ? t.sep.push(this.sourceToken) : t.start.push(this.sourceToken);
				return;
			case "space":
			case "comment":
				if (t.value) e.items.push({ start: [this.sourceToken] });
				else if (t.sep) t.sep.push(this.sourceToken);
				else {
					if (this.atIndentedComment(t.start, e.indent)) {
						let n = e.items[e.items.length - 2]?.value?.end;
						if (Array.isArray(n)) {
							Yn(n, t.start), n.push(this.sourceToken), e.items.pop();
							return;
						}
					}
					t.start.push(this.sourceToken);
				}
				return;
		}
		if (this.indent >= e.indent) {
			let n = !this.onKeyLine && this.indent === e.indent, r = n && (t.sep || t.explicitKey) && this.type !== "seq-item-ind", i = [];
			if (r && t.sep && !t.value) {
				let n = [];
				for (let r = 0; r < t.sep.length; ++r) {
					let i = t.sep[r];
					switch (i.type) {
						case "newline":
							n.push(r);
							break;
						case "space": break;
						case "comment":
							i.indent > e.indent && (n.length = 0);
							break;
						default: n.length = 0;
					}
				}
				n.length >= 2 && (i = t.sep.splice(n[1]));
			}
			switch (this.type) {
				case "anchor":
				case "tag":
					r || t.value ? (i.push(this.sourceToken), e.items.push({ start: i }), this.onKeyLine = !0) : t.sep ? t.sep.push(this.sourceToken) : t.start.push(this.sourceToken);
					return;
				case "explicit-key-ind":
					!t.sep && !t.explicitKey ? (t.start.push(this.sourceToken), t.explicitKey = !0) : r || t.value ? (i.push(this.sourceToken), e.items.push({
						start: i,
						explicitKey: !0
					})) : this.stack.push({
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start: [this.sourceToken],
							explicitKey: !0
						}]
					}), this.onKeyLine = !0;
					return;
				case "map-value-ind":
					if (t.explicitKey) {
						if (!t.sep) {
							if (Wn(t.start, "newline")) Object.assign(t, {
								key: null,
								sep: [this.sourceToken]
							});
							else {
								let e = Jn(t.start);
								this.stack.push({
									type: "block-map",
									offset: this.offset,
									indent: this.indent,
									items: [{
										start: e,
										key: null,
										sep: [this.sourceToken]
									}]
								});
							}
						} else if (t.value) e.items.push({
							start: [],
							key: null,
							sep: [this.sourceToken]
						});
						else if (Wn(t.sep, "map-value-ind")) this.stack.push({
							type: "block-map",
							offset: this.offset,
							indent: this.indent,
							items: [{
								start: i,
								key: null,
								sep: [this.sourceToken]
							}]
						});
						else if (Kn(t.key) && !Wn(t.sep, "newline")) {
							let e = Jn(t.start), n = t.key, r = t.sep;
							r.push(this.sourceToken), delete t.key, delete t.sep, this.stack.push({
								type: "block-map",
								offset: this.offset,
								indent: this.indent,
								items: [{
									start: e,
									key: n,
									sep: r
								}]
							});
						} else i.length > 0 ? t.sep = t.sep.concat(i, this.sourceToken) : t.sep.push(this.sourceToken);
					} else t.sep ? t.value || r ? e.items.push({
						start: i,
						key: null,
						sep: [this.sourceToken]
					}) : Wn(t.sep, "map-value-ind") ? this.stack.push({
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start: [],
							key: null,
							sep: [this.sourceToken]
						}]
					}) : t.sep.push(this.sourceToken) : Object.assign(t, {
						key: null,
						sep: [this.sourceToken]
					});
					this.onKeyLine = !0;
					return;
				case "alias":
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": {
					let n = this.flowScalar(this.type);
					r || t.value ? (e.items.push({
						start: i,
						key: n,
						sep: []
					}), this.onKeyLine = !0) : t.sep ? this.stack.push(n) : (Object.assign(t, {
						key: n,
						sep: []
					}), this.onKeyLine = !0);
					return;
				}
				default: {
					let r = this.startBlockValue(e);
					if (r) {
						if (r.type === "block-seq") {
							if (!t.explicitKey && t.sep && !Wn(t.sep, "newline")) {
								yield* this.pop({
									type: "error",
									offset: this.offset,
									message: "Unexpected block-seq-ind on same line with key",
									source: this.source
								});
								return;
							}
						} else n && e.items.push({ start: i });
						this.stack.push(r);
						return;
					}
				}
			}
		}
		yield* this.pop(), yield* this.step();
	}
	*blockSequence(e) {
		let t = e.items[e.items.length - 1];
		switch (this.type) {
			case "newline":
				if (t.value) {
					let n = "end" in t.value ? t.value.end : void 0;
					(Array.isArray(n) ? n[n.length - 1] : void 0)?.type === "comment" ? n?.push(this.sourceToken) : e.items.push({ start: [this.sourceToken] });
				} else t.start.push(this.sourceToken);
				return;
			case "space":
			case "comment":
				if (t.value) e.items.push({ start: [this.sourceToken] });
				else {
					if (this.atIndentedComment(t.start, e.indent)) {
						let n = e.items[e.items.length - 2]?.value?.end;
						if (Array.isArray(n)) {
							Yn(n, t.start), n.push(this.sourceToken), e.items.pop();
							return;
						}
					}
					t.start.push(this.sourceToken);
				}
				return;
			case "anchor":
			case "tag":
				if (t.value || this.indent <= e.indent) break;
				t.start.push(this.sourceToken);
				return;
			case "seq-item-ind":
				if (this.indent !== e.indent) break;
				t.value || Wn(t.start, "seq-item-ind") ? e.items.push({ start: [this.sourceToken] }) : t.start.push(this.sourceToken);
				return;
		}
		if (this.indent > e.indent) {
			let t = this.startBlockValue(e);
			if (t) {
				this.stack.push(t);
				return;
			}
		}
		yield* this.pop(), yield* this.step();
	}
	*flowCollection(e) {
		let t = e.items[e.items.length - 1];
		if (this.type === "flow-error-end") {
			let e;
			do
				yield* this.pop(), e = this.peek(1);
			while (e?.type === "flow-collection");
		} else if (e.end.length === 0) {
			switch (this.type) {
				case "comma":
				case "explicit-key-ind":
					!t || t.sep ? e.items.push({ start: [this.sourceToken] }) : t.start.push(this.sourceToken);
					return;
				case "map-value-ind":
					!t || t.value ? e.items.push({
						start: [],
						key: null,
						sep: [this.sourceToken]
					}) : t.sep ? t.sep.push(this.sourceToken) : Object.assign(t, {
						key: null,
						sep: [this.sourceToken]
					});
					return;
				case "space":
				case "comment":
				case "newline":
				case "anchor":
				case "tag":
					!t || t.value ? e.items.push({ start: [this.sourceToken] }) : t.sep ? t.sep.push(this.sourceToken) : t.start.push(this.sourceToken);
					return;
				case "alias":
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": {
					let n = this.flowScalar(this.type);
					!t || t.value ? e.items.push({
						start: [],
						key: n,
						sep: []
					}) : t.sep ? this.stack.push(n) : Object.assign(t, {
						key: n,
						sep: []
					});
					return;
				}
				case "flow-map-end":
				case "flow-seq-end":
					e.end.push(this.sourceToken);
					return;
			}
			let n = this.startBlockValue(e);
			/* istanbul ignore else should not happen */
			n ? this.stack.push(n) : (yield* this.pop(), yield* this.step());
		} else {
			let t = this.peek(2);
			if (t.type === "block-map" && (this.type === "map-value-ind" && t.indent === e.indent || this.type === "newline" && !t.items[t.items.length - 1].sep)) yield* this.pop(), yield* this.step();
			else if (this.type === "map-value-ind" && t.type !== "flow-collection") {
				let n = Jn(qn(t));
				Xn(e);
				let r = e.end.splice(1, e.end.length);
				r.push(this.sourceToken);
				let i = {
					type: "block-map",
					offset: e.offset,
					indent: e.indent,
					items: [{
						start: n,
						key: e,
						sep: r
					}]
				};
				this.onKeyLine = !0, this.stack[this.stack.length - 1] = i;
			} else yield* this.lineEnd(e);
		}
	}
	flowScalar(e) {
		if (this.onNewLine) {
			let e = this.source.indexOf("\n") + 1;
			for (; e !== 0;) this.onNewLine(this.offset + e), e = this.source.indexOf("\n", e) + 1;
		}
		return {
			type: e,
			offset: this.offset,
			indent: this.indent,
			source: this.source
		};
	}
	startBlockValue(e) {
		switch (this.type) {
			case "alias":
			case "scalar":
			case "single-quoted-scalar":
			case "double-quoted-scalar": return this.flowScalar(this.type);
			case "block-scalar-header": return {
				type: "block-scalar",
				offset: this.offset,
				indent: this.indent,
				props: [this.sourceToken],
				source: ""
			};
			case "flow-map-start":
			case "flow-seq-start": return {
				type: "flow-collection",
				offset: this.offset,
				indent: this.indent,
				start: this.sourceToken,
				items: [],
				end: []
			};
			case "seq-item-ind": return {
				type: "block-seq",
				offset: this.offset,
				indent: this.indent,
				items: [{ start: [this.sourceToken] }]
			};
			case "explicit-key-ind": {
				this.onKeyLine = !0;
				let t = Jn(qn(e));
				return t.push(this.sourceToken), {
					type: "block-map",
					offset: this.offset,
					indent: this.indent,
					items: [{
						start: t,
						explicitKey: !0
					}]
				};
			}
			case "map-value-ind": {
				this.onKeyLine = !0;
				let t = Jn(qn(e));
				return {
					type: "block-map",
					offset: this.offset,
					indent: this.indent,
					items: [{
						start: t,
						key: null,
						sep: [this.sourceToken]
					}]
				};
			}
		}
		return null;
	}
	atIndentedComment(e, t) {
		return this.type !== "comment" || this.indent <= t ? !1 : e.every((e) => e.type === "newline" || e.type === "space");
	}
	*documentEnd(e) {
		this.type !== "doc-mode" && (e.end ? e.end.push(this.sourceToken) : e.end = [this.sourceToken], this.type === "newline" && (yield* this.pop()));
	}
	*lineEnd(e) {
		switch (this.type) {
			case "comma":
			case "doc-start":
			case "doc-end":
			case "flow-seq-end":
			case "flow-map-end":
			case "map-value-ind":
				yield* this.pop(), yield* this.step();
				break;
			case "newline": this.onKeyLine = !1;
			default: e.end ? e.end.push(this.sourceToken) : e.end = [this.sourceToken], this.type === "newline" && (yield* this.pop());
		}
	}
};
//#endregion
//#region node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/browser/dist/public-api.js
function Qn(e) {
	let t = e.prettyErrors !== !1;
	return {
		lineCounter: e.lineCounter || t && new Un() || null,
		prettyErrors: t
	};
}
function $n(e, t = {}) {
	let { lineCounter: n, prettyErrors: r } = Qn(t), i = new Zn(n?.addNewLine), a = new kn(t), o = null;
	for (let t of a.compose(i.parse(e), !0, e.length)) if (!o) o = t;
	else if (o.options.logLevel !== "silent") {
		o.errors.push(new Wt(t.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
		break;
	}
	return r && n && (o.errors.forEach(Kt(e, n)), o.warnings.forEach(Kt(e, n))), o;
}
function er(e, t, n) {
	let r = null;
	if (typeof t == "function" || Array.isArray(t) ? r = t : n === void 0 && t && (n = t), typeof n == "string" && (n = n.length), typeof n == "number") {
		let e = Math.round(n);
		n = e < 1 ? void 0 : e > 8 ? { indent: 8 } : { indent: e };
	}
	if (e === void 0) {
		let { keepUndefined: e } = n ?? t ?? {};
		if (!e) return;
	}
	return d(e) && !r ? e.toString(n) : new Vt(e, r, n).toString(n);
}
//#endregion
//#region src/vendor/idv1/words.ts
var tr = /* @__PURE__ */ "fuck.fuk.fck.fux.shit.sht.crap.turd.piss.cunt.twat.dick.dik.cock.knob.wank.jizz.cum.porn.sex.anal.anus.arse.ass.butt.boob.tit.puss.slut.whor.hoe.bich.btch.bitc.damn.hell.suck.fart.puke.barf.poo.smeg.dumb.ugly.fat.kill.dead.rape.hate.nazi.hitl.heil.kkk.isis.fag.nig.nigg.coon.spic.kike.gook.paki.dyke.homo.tard.jew.gay.lort.pik.pis.fis.fiss.kuss.knep.hore.lude.skid.nege.fand.svin.klam.baka.aho.kuso.unko.mank.chnk.ecch.etch.ero.hent.kasu.kuzu.busu.debu.hage.kich.yari.oppa.fick.fotz.hure.kack.arsc.fitt.kuk.hora.knul.puta.puto.cono.culo.mier.jode.pene.verg.merd.pute.bite.salo.cazz.figa.porr.ssib.shib.tmd.cao".split("."), nr = [
	"42",
	"49",
	"69"
];
function rr(e) {
	let t = e.toLowerCase();
	return tr.some((e) => t.includes(e));
}
function ir(e) {
	return rr(e.slice(0, 4)) || nr.includes(e.slice(4));
}
//#endregion
//#region src/vendor/idv1/shapes.ts
var ar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", or = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", sr = "0123456789", cr = /^[A-Za-z]{4}\d{2}$/, lr = /^(?:[A-Za-z]{2}\d{4}|[A-Za-z]{4}\d{2})$/, ur = /^\d{2}[A-Za-z]{4}$/, dr = /^[A-Za-z]{2}\d{2}(?:[A-Za-z][A-Za-z0-9]|\d[A-Za-z])$/, fr = (e, t) => e[Math.floor(t() * e.length)];
function pr(e, t = Math.random) {
	let n = e ?? fr("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", t) + fr("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", t);
	for (;;) {
		let e = n + String(Math.floor(t() * 1e4)).padStart(4, "0");
		if (!_r(e)) return e;
	}
}
var mr = {
	owner: "Jo4712",
	studio: "Jo0001",
	onboarding: "On0001",
	test: "Te0001"
}, hr = ["On4713"], gr, _r = (e) => (gr ??= new Set([...Object.values(mr), ...hr].map((e) => e.toLowerCase()))).has(e.toLowerCase());
function vr(e = Math.random) {
	for (let t = 0; t < 1e3; t++) {
		let t = Array.from({ length: 4 }, () => fr(ar, e)).join("") + String(Math.floor(e() * 100)).padStart(2, "0");
		if (!ir(t)) return t;
	}
	throw Error("No product code could be drawn.");
}
function yr(e = Math.random) {
	return fr(sr, e) + fr(sr, e) + Array.from({ length: 4 }, () => fr(or, e)).join("");
}
function br(e = Math.random) {
	let t = fr(ar, e) + fr(ar, e) + fr(sr, e) + fr(sr, e), n = fr(ar + sr, e), r = fr(ar + sr, e);
	return t + (/\d/.test(n) && /\d/.test(r) ? fr(ar, e) : n) + r;
}
var xr = {
	account: lr,
	product: cr,
	list: ur,
	item: dr
}, Sr = (e, t) => xr[e].test(t);
function Cr(e, t = {}) {
	let n = t.random ?? Math.random;
	return e === "account" ? pr(t.letters ?? null, n) : e === "product" ? vr(n) : e === "list" ? yr(n) : br(n);
}
//#endregion
//#region src/comments.ts
var wr = [
	"👍",
	"❤️",
	"😂",
	"🎉",
	"🙏",
	"👏",
	"😊",
	"🔥",
	"✅",
	"👀",
	"🤔",
	"💡",
	"🚀",
	"✨",
	"🙌",
	"💯"
];
function Tr(e, t) {
	let n = 0;
	for (; n < e.length && n < t.length && e[n] === t[n];) n++;
	let r = e.length, i = t.length;
	for (; r > n && i > n && e[r - 1] === t[i - 1];) r--, i--;
	let a = (t) => t === 0 || /\s/.test(e[t - 1]), o = n, s = r, c = i;
	for (; !a(o) && o > 0 && e[o - 1] === t[c - 1] && e[o - 1] === e[s - 1];) o--, s--, c--;
	return o < n && a(o) && (n = o, r = s, i = c), {
		start: n,
		end: r,
		text: t.slice(n, i)
	};
}
function Er(e, t) {
	let { start: n, end: r, text: i } = t, a = i.length - (r - n), { from: o, to: s } = e;
	return r <= o ? {
		from: o + a,
		to: s + a
	} : n === s && r === s ? {
		from: o,
		to: s + i.length
	} : n >= s ? {
		from: o,
		to: s
	} : n <= o && r >= s ? null : (n <= o ? (o = n + i.length, s += a) : r >= s ? s = n : s += a, o < s ? {
		from: o,
		to: s
	} : null);
}
function Dr(e, t, n) {
	return e.map((e) => {
		if (e.orphaned) return {
			...e,
			orphaned: !0
		};
		let r = Er(e, t);
		return r ? {
			...e,
			...r,
			quote: n.slice(r.from, r.to),
			orphaned: !1
		} : {
			...e,
			orphaned: !0
		};
	});
}
function Or(e, t) {
	if (!e.quote) return null;
	if (t.slice(e.from, e.to) === e.quote) return {
		from: e.from,
		to: e.to
	};
	let n = null;
	for (let r = t.indexOf(e.quote); r >= 0; r = t.indexOf(e.quote, r + 1)) (n === null || Math.abs(r - e.from) < Math.abs(n - e.from)) && (n = r);
	return n === null ? null : {
		from: n,
		to: n + e.quote.length
	};
}
function kr(e, t) {
	return e.map((e) => {
		let n = e.orphaned ? null : Or(e, t);
		return n ? {
			...e,
			...n,
			orphaned: !1
		} : {
			...e,
			orphaned: !0
		};
	});
}
function Ar(e, t) {
	let n = new Map(e.map((e) => [e.id, e]));
	return t.filter((e) => {
		let t = n.get(e.id);
		return !!t && !e.orphaned && (t.from !== e.from || t.to !== e.to || t.quote !== e.quote);
	}).map(({ id: e, from: t, to: n, quote: r }) => ({
		id: e,
		from: t,
		to: n,
		quote: r
	}));
}
function jr(e) {
	let t = (e) => (e.resolvedAt ? 2 : 0) + +!!e.orphaned;
	return [...e].sort((e, n) => t(e) - t(n) || e.from - n.from || e.createdAt - n.createdAt);
}
function Mr(e, t) {
	return e.filter((e) => !e.orphaned && !e.resolvedAt && e.from <= t && t <= e.to);
}
function Nr(e) {
	let t = e.filter((e) => e.resolvedAt).length;
	return {
		open: e.length - t,
		resolved: t
	};
}
function Pr(e, t) {
	if (e <= 0 && t <= 0) return "Comments";
	let n = `${Math.max(0, e)} comment${e === 1 ? "" : "s"}`;
	return t > 0 ? `${n} · ${t} resolved` : n;
}
function Fr(e, t) {
	let n = [], r = [...t].filter((e) => e.name.trim()).sort((e, t) => t.name.length - e.name.length), i = e;
	for (let e of r) {
		let t = `@${e.name.trim()}`;
		i.includes(t) && (n.push(e), i = i.split(t).join(" "));
	}
	return n;
}
function Ir(e, t) {
	let n = e.slice(0, t), r = n.lastIndexOf("@");
	if (r < 0 || r > 0 && !/\s/.test(n[r - 1])) return null;
	let i = n.slice(r + 1);
	return /\s/.test(i) || i.length > 40 ? null : {
		start: r,
		query: i
	};
}
function Lr(e, t = Date.now(), n) {
	let r = Math.round((t - e) / 1e3);
	if (r < 45) return "now";
	let i = Math.round(r / 60);
	if (i < 60) return `${i} minute${i === 1 ? "" : "s"} ago`;
	let a = Math.round(i / 60), o = new Date(e), s = new Date(t), c = (e) => Math.floor((e.getTime() - e.getTimezoneOffset() * 6e4) / 864e5), l = c(s) - c(o);
	return a < 24 && l === 0 ? `${a} hour${a === 1 ? "" : "s"} ago` : l === 1 ? "yesterday" : l < 7 ? `${l} days ago` : o.toLocaleDateString(n, {
		day: "numeric",
		month: "short",
		...o.getFullYear() === s.getFullYear() ? {} : { year: "numeric" }
	});
}
var Rr = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
function zr(e) {
	let t = e.trim();
	return Rr.test(t) ? [...t.split(/[\s　・]/)[0]].slice(0, 2).join("") : ([...t][0] ?? "?").toLocaleUpperCase();
}
var Br = [
	["#2e9e1f", "#99ff73"],
	["#4b44e6", "#b3aeff"],
	["#c4417f", "#f5aad1"],
	["#d93b3b", "#ff8f8f"],
	["#b27a00", "#fec20d"],
	["#6f6b1f", "#d2cd72"]
];
function Vr(e) {
	if (e.colour) return e.colour;
	let t = 0;
	for (let n of e.id) t = t * 31 + n.charCodeAt(0) >>> 0;
	let [n, r] = Br[t % Br.length];
	return `light-dark(${n}, ${r})`;
}
//#endregion
//#region src/comments-markdown.ts
var Hr = /<!--aa:(start|end) ([A-Za-z0-9]{6})-->/g, Ur = (e) => typeof e == "string" && /^\d{4}-\d\d-\d\dT.*Z$/.test(e) && Number.isFinite(Date.parse(e)), Wr = (e) => typeof e == "string" && Sr("account", e), Gr = (e) => typeof e == "string" && Sr("item", e), Kr = (e) => !!e && typeof e == "object" && !Array.isArray(e);
function qr(e) {
	if (!Kr(e) || !Array.isArray(e.threads) || e.threads.length > 1e4) throw Error("Expected threads array (at most 10000 threads).");
	let t = /* @__PURE__ */ new Set(), n = (e) => {
		if (!Gr(e) || t.has(e)) throw Error("Thread and comment IDs must be unique IDv1 item codes.");
		t.add(e);
	};
	for (let t of e.threads) {
		if (!Kr(t)) throw Error("Invalid thread.");
		if (n(t.id), typeof t.quote != "string" || !["open", "resolved"].includes(t.status) || !Array.isArray(t.comments) || !t.comments.length) throw Error("Invalid thread fields.");
		if (t.status === "resolved" && (!Ur(t.resolved) || !Wr(t.resolvedBy))) throw Error("Resolved threads need resolved and resolvedBy.");
		for (let e of t.comments) {
			if (!Kr(e)) throw Error("Invalid comment.");
			if (n(e.id), !Wr(e.author) || !Ur(e.created) || typeof e.body != "string" || !e.body.trim() || e.edited !== void 0 && !Ur(e.edited)) throw Error("Invalid comment author, date or body.");
			if (e.mentions !== void 0 && (!Array.isArray(e.mentions) || !e.mentions.every(Wr))) throw Error("Invalid mentions.");
			if (e.reactions !== void 0 && (!Kr(e.reactions) || !Object.values(e.reactions).every((e) => Array.isArray(e) && e.every(Wr)))) throw Error("Invalid reactions.");
		}
	}
	return e.threads;
}
function Jr(e) {
	let t = [], n = [], r = [...e.matchAll(/[^\n]*(?:\n|$)/g)].filter((e) => e[0]);
	for (let i = 0; i < r.length; i++) {
		let a = r[i], o = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)/.exec(a[0]);
		if (!o) continue;
		let s = a.index, c = s + a[0].length, l = i + 1;
		for (; l < r.length; l++) {
			let e = /^ {0,3}(`{3,}|~{3,})[ \t]*(?:\r?\n)?$/.exec(r[l][0]);
			if (e && e[1][0] === o[1][0] && e[1].length >= o[1].length) break;
		}
		let u = l < r.length, d = u ? r[l].index + r[l][0].length : e.length;
		t.push({
			from: s,
			to: d,
			info: o[2].trim(),
			body: e.slice(c, u ? r[l].index : d),
			closed: u
		}), n.push({
			from: s,
			to: d
		}), i = l;
	}
	for (let e of r) /^(?: {4}|\t)/.test(e[0]) && n.push({
		from: e.index,
		to: e.index + e[0].length
	});
	let i = (e) => n.some((t) => e >= t.from && e < t.to);
	for (let t = 0; t < e.length; t++) {
		if (e[t] !== "`" || i(t) || e[t - 1] === "\\") continue;
		let r = 1;
		for (; e[t + r] === "`";) r++;
		let a = t + r;
		for (; (a = e.indexOf("`".repeat(r), a)) >= 0 && (i(a) || e[a - 1] === "`" || e[a + r] === "`");) a += r;
		a >= 0 ? (n.push({
			from: t,
			to: a + r
		}), t = a + r - 1) : t += r - 1;
	}
	return {
		fences: t,
		protectedAt: i
	};
}
function Yr(e) {
	return /aa-comments/.test(e) && Jr(e).fences.some((e) => /^aa-comments(?:\s|$)/.test(e.info));
}
function Xr(e) {
	let { fences: t, protectedAt: n } = Jr(e), r = [], i = [], a = [], o = t.filter((e) => /^aa-comments(?:\s|$)/.test(e.info));
	for (let t of o) {
		if (o.length > 1) {
			i.push("Multiple aa-comments blocks.");
			break;
		}
		if (t.info !== "aa-comments v1") i.push("Unsupported aa-comments version.");
		else if (!t.closed || e.slice(t.to).trim()) i.push("The aa-comments block must be closed and last.");
		else try {
			if (t.body.length > 2e6) throw Error("Comment metadata exceeds 2 MB.");
			let n = $n(t.body, {
				schema: "core",
				uniqueKeys: !0
			});
			if (n.errors.length || n.warnings.length) throw Error("Invalid comment YAML.");
			a = qr(n.toJS({ maxAliasCount: 0 }));
			let i = e.slice(0, t.from), o = i.endsWith("\r\n\r\n") ? 4 : i.endsWith("\n\n") ? 2 : 0;
			r.push({
				from: t.from - o,
				to: t.to,
				metadata: !0
			});
		} catch (e) {
			i.push(String(e instanceof Error ? e.message : e)), a = [];
		}
	}
	let s = /* @__PURE__ */ new Map();
	for (let t of e.matchAll(Hr)) {
		if (n(t.index) || e[t.index - 1] === "\\" || !Gr(t[2])) continue;
		let i = {
			from: t.index,
			to: t.index + t[0].length
		};
		r.push(i);
		let a = s.get(t[2]) ?? {
			start: [],
			end: []
		};
		a[t[1]].push(i), s.set(t[2], a);
	}
	r.sort((e, t) => e.from - t.from);
	let c = (e) => e - r.reduce((t, n) => t + Math.max(0, Math.min(e, n.to) - n.from), 0), l = Object.create(null);
	for (let e of a) {
		let t = s.get(e.id);
		t?.start.length === 1 && t.end.length === 1 && t.start[0].to < t.end[0].from ? l[e.id] = {
			from: c(t.start[0].to),
			to: c(t.end[0].from)
		} : t && (t.start.length > 1 || t.end.length > 1) && i.push(`Duplicate anchors for ${e.id}.`);
	}
	let u = "", d = 0;
	for (let t of r) u += e.slice(d, t.from), d = t.to;
	return u += e.slice(d), {
		markdown: u,
		threads: a,
		anchors: l,
		diagnostics: i,
		spans: r
	};
}
function Zr(e, t) {
	return t - e.spans.reduce((e, n) => e + Math.max(0, Math.min(t, n.to) - n.from), 0);
}
function Qr(e, t, n = !0) {
	let r = t;
	for (let t of e.spans) (t.from < r || n && !t.metadata && t.from === r) && (r += t.to - t.from);
	return r;
}
function $r(e) {
	if (!e.threads.length) return e.markdown;
	qr({ threads: e.threads });
	let t = [];
	for (let n of e.threads) {
		let r = e.anchors[n.id];
		!r || r.from < 0 || r.to <= r.from || r.to > e.markdown.length || t.push({
			at: r.from,
			text: `<!--aa:start ${n.id}-->`,
			order: 1
		}, {
			at: r.to,
			text: `<!--aa:end ${n.id}-->`,
			order: 0
		});
	}
	t.sort((e, t) => t.at - e.at || t.order - e.order || t.text.localeCompare(e.text));
	let n = e.markdown;
	for (let e of t) n = n.slice(0, e.at) + e.text + n.slice(e.at);
	let r = er({ threads: e.threads }, {
		lineWidth: 0,
		aliasDuplicateObjects: !1
	}), i = "`".repeat(Math.max(3, ...[...r.matchAll(/`+/g)].map((e) => e[0].length + 1)));
	return `${n}\n\n${i}aa-comments v1\n${r}${i}`;
}
function ei(e) {
	let t = Xr(e);
	if (t.diagnostics.length) throw Error(`Cannot export Markdown: ${t.diagnostics.join(" ")}`);
	return t.markdown;
}
function ti(e, t) {
	let n = Tr(e.markdown, t), r = Object.create(null), i = e.threads.map((i) => {
		let a = e.anchors[i.id], o = a && Er(a, n);
		return !o || o.from >= o.to ? i : (r[i.id] = o, {
			...i,
			quote: t.slice(o.from, o.to)
		});
	});
	return {
		...e,
		markdown: t,
		threads: i,
		anchors: r
	};
}
function ni(e, t, n, r = (/* @__PURE__ */ new Date()).toISOString()) {
	if (!Wr(t)) throw Error("Author must be an IDv1 account code.");
	if (!Ur(r)) throw Error("Invalid UTC timestamp.");
	let i = Xr(e);
	if (i.diagnostics.length) throw Error(i.diagnostics.join(" "));
	let a = new Set(i.threads.flatMap((e) => [e.id, ...e.comments.map((e) => e.id)])), o = () => {
		let e;
		do
			e = Cr("item");
		while (a.has(e));
		return a.add(e), e;
	}, s = "body" in n ? n.body : "";
	if ("body" in n && !s.trim()) throw Error("A comment cannot be empty.");
	let c = () => ({
		id: o(),
		author: t,
		created: r,
		body: s
	});
	if (n.type === "add") {
		let { from: e, to: t } = n;
		if (!Number.isInteger(e) || !Number.isInteger(t) || e < 0 || t <= e || t > i.markdown.length) throw Error("Invalid comment range.");
		let { protectedAt: r } = Jr(i.markdown), a = (e) => {
			let t = i.markdown.slice(0, e);
			return ["columns", "tabs"].some((e) => t.lastIndexOf(`<${e}>`) > t.lastIndexOf(`</${e}>`));
		};
		if (r(e) || r(t - 1) || a(e) || a(t - 1) || /<(?:columns|tabs)>/.test(i.markdown.slice(e, t))) throw Error("Select prose outside code and nested writing surfaces.");
		let s = {
			id: o(),
			quote: i.markdown.slice(e, t),
			status: "open",
			comments: [c()]
		};
		i.threads.push(s), i.anchors[s.id] = {
			from: e,
			to: t
		};
	} else {
		let e = i.threads.find((e) => "thread" in n ? e.id === n.thread : e.comments.some((e) => e.id === n.comment));
		if (!e) throw Error("Comment or thread not found.");
		if (n.type === "reply") {
			if (e.status === "resolved") throw Error("Reopen the thread before replying.");
			e.comments.push(c());
		} else if (n.type === "resolve") e.status = "resolved", e.resolved = r, e.resolvedBy = t;
		else if (n.type === "reopen") e.status = "open", delete e.resolved, delete e.resolvedBy;
		else if (n.type === "remove") {
			if (e.comments[0].author !== t) throw Error("Only the thread author may delete it.");
			i.threads = i.threads.filter((t) => t !== e);
		} else {
			let i = e.comments.find((e) => e.id === n.comment);
			if (n.type === "edit") {
				if (i.author !== t) throw Error("Only the author may edit a comment.");
				i.body = s, i.edited = r;
			} else {
				if (!n.emoji.trim() || n.emoji.length > 32) throw Error("Invalid reaction.");
				i.reactions ??= Object.create(null);
				let e = i.reactions[n.emoji] ?? [];
				i.reactions[n.emoji] = e.includes(t) ? e.filter((e) => e !== t) : [...e, t];
			}
		}
	}
	return $r(i);
}
//#endregion
//#region src/comments-editor.ts
function ri(e, t, n) {
	if (t.comments) throw Error("Choose sourceComments or an external comments store, not both.");
	let r = t.sourceComments ?? {}, i = t.value ?? "", a = Xr(i);
	if (a.diagnostics.length) throw Error(a.diagnostics.join(" "));
	let o, s = [i], c = [], l = 0, u = !1, d = /* @__PURE__ */ new Set(), f = (e) => [r.me, ...r.people ?? []].find((t) => t?.id === e) ?? {
		id: e,
		name: e
	}, p = () => a.threads.map((e) => ({
		id: e.id,
		quote: a.anchors[e.id] ? a.markdown.slice(a.anchors[e.id].from, a.anchors[e.id].to) : e.quote,
		from: a.anchors[e.id]?.from ?? -1,
		to: a.anchors[e.id]?.to ?? -1,
		orphaned: !a.anchors[e.id],
		createdAt: Date.parse(e.comments[0].created),
		updatedAt: Math.max(...e.comments.map((e) => Date.parse(e.edited ?? e.created))),
		...e.status === "resolved" ? {
			resolvedAt: Date.parse(e.resolved),
			resolvedBy: f(e.resolvedBy)
		} : {},
		canDelete: e.comments[0].author === r.me?.id,
		comments: e.comments.map((e) => ({
			id: e.id,
			author: f(e.author),
			body: e.body,
			createdAt: Date.parse(e.created),
			...e.edited ? { editedAt: Date.parse(e.edited) } : {},
			mentions: e.mentions?.map(f),
			reactions: Object.entries(e.reactions ?? {}).filter(([, e]) => e.length).map(([e, t]) => ({
				emoji: e,
				count: t.length,
				reacted: t.includes(r.me?.id ?? ""),
				names: t.map((e) => f(e).name)
			}))
		}))
	})), m = () => {
		for (let e of d) e(p());
	}, h = (e, n = !1) => {
		if (e === i) return;
		i = e, a = Xr(i);
		let r = Date.now();
		n && l && r - l < 700 && s.length > 1 ? s[s.length - 1] = i : s.push(i), l = n ? r : 0, c = [], m(), t.onChange?.(i);
	}, g = async (t) => {
		if (u || o.readOnly || !r.me) throw Error("Comments are read only.");
		let n = ni(i, r.me.id, t);
		h(n), e.dispatchEvent(new Event("aa-change"));
	}, _ = {
		me: r.me,
		panel: r.panel,
		subscribe(e) {
			return d.add(e), e(p()), () => {
				d.delete(e);
			};
		},
		people(e) {
			return [r.me, ...r.people ?? []].filter((t) => !!t && t.name.toLowerCase().includes(e.toLowerCase()));
		},
		add(e, t) {
			return g({
				type: "add",
				from: e.from,
				to: e.to,
				body: t
			});
		},
		reply(e, t) {
			return g({
				type: "reply",
				thread: e,
				body: t
			});
		},
		edit(e, t) {
			return g({
				type: "edit",
				comment: e,
				body: t
			});
		},
		resolve(e, t) {
			return g({
				type: t ? "resolve" : "reopen",
				thread: e
			});
		},
		remove(e) {
			return g({
				type: "remove",
				thread: e
			});
		},
		react(e, t) {
			return g({
				type: "react",
				comment: e,
				emoji: t
			});
		}
	};
	o = n(e, {
		...t,
		sourceComments: void 0,
		comments: _,
		value: a.markdown,
		onChange(e) {
			let t = Math.abs(e.length - a.markdown.length) === 1 && !/\s$/.test(e);
			h($r(ti(a, e)), t);
		}
	});
	let v = (n) => {
		i = n, a = Xr(n), o.value = a.markdown, m(), t.onChange?.(i), e.dispatchEvent(new Event("aa-change"));
	}, y = () => o.readOnly || s.length < 2 ? !1 : (c.push(s.pop()), l = 0, v(s[s.length - 1]), !0), b = () => {
		if (o.readOnly || !c.length) return !1;
		let e = c.pop();
		return s.push(e), l = 0, v(e), !0;
	};
	o.setHistoryProvider({
		undo: y,
		redo: b
	});
	let x = () => m();
	e.addEventListener("aa-change", x);
	let S = (e, t = !0) => Qr(a, e, t), C = (e) => Zr(a, e), w = {
		exportMarkdown: () => ei(i),
		undo: y,
		redo: b,
		selection() {
			let e = o.selection();
			return e && {
				start: S(e.start),
				end: S(e.end, e.start === e.end)
			};
		},
		selectRange(e, t = e) {
			o.selectRange(C(e), C(t));
		},
		replace(t, n, r) {
			if (o.readOnly) return;
			if (!Number.isInteger(t) || !Number.isInteger(n) || t < 0 || n < t || n > i.length) throw Error("Invalid source range.");
			let s = i.slice(0, t) + r + i.slice(n), c = Xr(s);
			if (c.diagnostics.length) throw Error(c.diagnostics.join(" "));
			c.markdown === a.markdown || /aa-comments|<!--aa:/.test(r) ? (o.value = c.markdown, h(s), e.dispatchEvent(new Event("aa-change"))) : o.replace(C(t), C(n), r);
		},
		rangeOf(e, t) {
			return o.rangeOf(C(e), C(t));
		},
		find(e, t) {
			return o.find(e, t).map((e) => ({
				start: S(e.start),
				end: S(e.end, !1)
			}));
		},
		activeBlock() {
			let e = o.activeBlock();
			return e && {
				...e,
				start: S(e.start),
				end: S(e.end, !1)
			};
		},
		decorate(e, t) {
			o.decorate(e.map((e) => ({
				...e,
				from: C(e.from),
				to: C(e.to)
			})), t);
		},
		transaction(e) {
			o.transaction(e);
		},
		setHistoryProvider(e) {
			if (e) throw Error("Source comments require revision-checked document writes; the Yjs text adapter is not supported yet.");
			o.setHistoryProvider({
				undo: y,
				redo: b
			});
		},
		destroy() {
			u = !0, e.removeEventListener("aa-change", x), d.clear(), o.destroy();
		}
	};
	return new Proxy(o, {
		get(e, t) {
			if (t === "value") return i;
			if (t in w) return Reflect.get(w, t);
			if (t === "comments") {
				let t = e.comments;
				return t && {
					open: t.open,
					start: t.start,
					close: t.close,
					get threads() {
						return t.threads.map((e) => ({
							...e,
							from: e.orphaned ? -1 : S(e.from),
							to: e.orphaned ? -1 : S(e.to, !1)
						}));
					}
				};
			}
			return Reflect.get(e, t);
		},
		set(e, t, n) {
			if (t !== "value") return Reflect.set(e, t, n);
			if (n === i) return !0;
			let r = Xr(n);
			if (r.diagnostics.length) throw Error(r.diagnostics.join(" "));
			return i = n, a = r, o.value = r.markdown, s = [i], c = [], l = 0, m(), !0;
		}
	});
}
//#endregion
//#region src/markdown.ts
var ii = /^ {0,3}(#{1,6})[ \t]+/, ai = /^ *(?:([-*+])|(\d{1,9})[.)])[ \t]+(?:\[([ xX])\][ \t]+)?/, oi = /^ {0,3}>[ \t]?/, si = /^ {0,3}(`{3,}|~{3,})/, ci = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/, li = [
	"gray",
	"brown",
	"orange",
	"yellow",
	"green",
	"blue",
	"purple",
	"pink",
	"red",
	"white"
], ui = /^>\s*\[!([^\]\n]*)\](-)?[ \t]*/;
function di(e) {
	let t = ui.exec(e);
	if (!t) return null;
	let n = "", r, i;
	for (let e of t[1].trim().split(/\s+/).filter(Boolean)) {
		let t = e.toLowerCase();
		li.includes(t) ? i = t : /^[a-z]+$/i.test(e) ? n = t : r = e;
	}
	return {
		kind: n,
		icon: r,
		color: i,
		folded: !!t[2],
		length: t[0].length
	};
}
function fi(e) {
	return `> [!${[
		e.kind,
		e.icon,
		e.color
	].filter(Boolean).join(" ")}]${e.folded ? "-" : ""}`;
}
function pi(e) {
	return e.icon !== void 0 || e.color !== void 0 || !e.kind;
}
var mi = /^\s*<columns>\s*$/, hi = /^\s*<\/columns>\s*$/, gi = /^\s*<column>\s*$/, _i = /^\s*<\/column>\s*$/;
function vi(e) {
	let t = [], n = null;
	for (let r of e.replace(/\r\n?/g, "\n").split("\n")) mi.test(r) || hi.test(r) || (gi.test(r) ? (n = [], t.push(n)) : _i.test(r) ? n = null : n && n.push(r.replace(/^\t{1,2}/, "")));
	let r = t.map((e) => e.join("\n").replace(/^\n+|\n+$/g, ""));
	return r.length ? r : ["", ""];
}
function yi(e) {
	return [
		"<columns>",
		...e.flatMap((e) => [
			"<column>",
			...e ? [e] : [],
			"</column>"
		]),
		"</columns>"
	].join("\n");
}
var bi = /^\s*<table_of_contents\s*\/>\s*$/, xi = /^\s*<tabs>\s*$/, Si = /^\s*<\/tabs>\s*$/, Ci = /^\s*<tab\b([^>]*)>\s*$/, wi = /^\s*<\/tab>\s*$/, Ti = (e) => e.replace(/&quot;/g, "\"").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"), Ei = (e) => e.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " ");
function Di(e) {
	let t = [], n = null;
	for (let r of e.replace(/\r\n?/g, "\n").split("\n")) {
		if (xi.test(r) || Si.test(r)) continue;
		let e = Ci.exec(r);
		if (e) {
			let r = {};
			for (let t of e[1].matchAll(/([a-z]+)="([^"]*)"/g)) r[t[1]] = Ti(t[2]);
			n = {
				name: r.name ?? "",
				...r.icon ? { icon: r.icon } : {},
				content: "",
				lines: []
			}, t.push(n);
		} else wi.test(r) ? n = null : n && n.lines.push(r.replace(/^\t{1,2}/, ""));
	}
	let r = t.map(({ lines: e, ...t }) => ({
		...t,
		content: e.join("\n").replace(/^\n+|\n+$/g, "")
	}));
	return r.length ? r : [{
		name: "",
		content: ""
	}];
}
function Oi(e) {
	return [
		"<tabs>",
		...e.flatMap((e) => [
			`<tab name="${Ei(e.name)}"${e.icon ? ` icon="${Ei(e.icon)}"` : ""}>`,
			...e.content ? [e.content] : [],
			"</tab>"
		]),
		"</tabs>"
	].join("\n");
}
function ki(e, t, n, r) {
	let i = Mi(e), a = i[t], o = i[n];
	if (t === n || !a || !o || a.kind === "columns") return null;
	let s = o.kind === "columns" ? vi(o.source) : [o.source];
	r === "start" ? s.unshift(a.source) : s.push(a.source);
	let c = i.filter((e, n) => n !== t).map((e) => e === o ? {
		...e,
		kind: "columns",
		prefix: 9,
		source: yi(s)
	} : e), l = Math.min(t, n), u = Math.max(t, n);
	return {
		start: i[l].start,
		end: i[u].start + i[u].source.length,
		text: Ni(c.slice(l, u))
	};
}
function Ai(e, t) {
	let n = si.exec(e);
	return !!n && n[1][0] === t[0] && n[1].length >= t.length && !e.slice(n[0].length).trim();
}
function ji(e) {
	return !!e.trim() && !si.test(e) && !ci.test(e) && !ii.test(e) && !ai.test(e) && !oi.test(e) && !mi.test(e) && !xi.test(e) && !bi.test(e);
}
function Mi(e) {
	let t = e.replace(/\r\n?/g, "\n").split("\n"), n = [], r = 0;
	for (let e of t) n.push(r), r += e.length + 1;
	let i = [], a = (e, r, a, o = {}) => {
		i.push({
			kind: e,
			source: t.slice(r, a + 1).join("\n"),
			prefix: 0,
			...o,
			start: n[r]
		});
	}, o = 0;
	for (; o < t.length;) {
		let e = t[o];
		if (e.trim() === "$$") {
			let n = o + 1;
			for (; n < t.length && t[n].trim() !== "$$";) n++;
			a("equation", o, Math.min(n, t.length - 1), { prefix: e.length }), o = n + 1;
			continue;
		}
		if (o + 1 < t.length && e.includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(t[o + 1])) {
			let e = o + 1;
			for (; e + 1 < t.length && t[e + 1].trim() && t[e + 1].includes("|");) e++;
			a("table", o, e), o = e + 1;
			continue;
		}
		if (mi.test(e)) {
			let n = o + 1;
			for (; n < t.length && !hi.test(t[n]);) n++;
			a("columns", o, Math.min(n, t.length - 1), { prefix: e.length }), o = n + 1;
			continue;
		}
		if (bi.test(e)) {
			a("toc", o, o), o++;
			continue;
		}
		if (xi.test(e)) {
			let n = o + 1;
			for (; n < t.length && !Si.test(t[n]);) n++;
			a("tabs", o, Math.min(n, t.length - 1), { prefix: e.length }), o = n + 1;
			continue;
		}
		let n = si.exec(e);
		if (n) {
			let r = o + 1;
			for (; r < t.length && !Ai(t[r], n[1]);) r++;
			a("code", o, Math.min(r, t.length - 1), { prefix: e.length }), o = r + 1;
			continue;
		}
		if (!e.trim()) {
			o++;
			continue;
		}
		if (ci.test(e)) {
			a("divider", o, o, { prefix: e.length }), o++;
			continue;
		}
		let r = ii.exec(e);
		if (r) {
			a("heading", o, o, {
				level: r[1].length,
				prefix: r[0].length
			}), o++;
			continue;
		}
		let s = ai.exec(e);
		if (s) {
			let t = /^ */.exec(e)[0].length, n = i[i.length - 1], r = 0;
			t && n?.kind === "bullet" ? r = t > (n.indent ?? 0) ? (n.depth ?? 0) + 1 : [...i].reverse().find((e) => e.kind === "bullet" && (e.indent ?? 0) <= t)?.depth ?? 1 : t && (r = Math.floor(t / (s[2] ? 3 : 2))), a("bullet", o, o, {
				prefix: s[0].length,
				indent: t,
				depth: r,
				checked: s[3] === void 0 ? void 0 : s[3] !== " ",
				number: s[2] ? Number(s[2]) : void 0
			}), o++;
			continue;
		}
		if (oi.test(e)) {
			let n = o;
			for (; n + 1 < t.length && oi.test(t[n + 1]);) n++;
			let r = di(e), i = r ? /^(#{1,6})\s+/.exec(e.slice(r.length)) : null;
			a(r ? "callout" : "quote", o, n, r ? {
				level: i?.[1].length,
				prefix: r.length + (i?.[0].length ?? 0),
				callout: r.kind,
				folded: r.folded,
				...r.icon === void 0 ? {} : { icon: r.icon },
				...r.color ? { color: r.color } : {},
				...pi(r) ? { box: !0 } : {}
			} : { prefix: oi.exec(e)[0].length }), o = n + 1;
			continue;
		}
		let c = o;
		for (; c + 1 < t.length && ji(t[c + 1]);) c++;
		a("paragraph", o, c), o = c + 1;
	}
	i.length || i.push({
		kind: "paragraph",
		source: "",
		prefix: 0,
		start: 0
	});
	let s = /^\n+/.exec(e)?.[0] ?? "", c = e.length > s.length ? /\n+$/.exec(e)?.[0] ?? "" : "", l = i[0], u = i[i.length - 1];
	return s && l.kind === "paragraph" && (l.source = s + l.source, l.start = 0), c && u.kind === "paragraph" && (u.source += c), i;
}
function Ni(e) {
	let t = "";
	return e.forEach((n, r) => {
		r && (t += e[r - 1].kind === "bullet" && n.kind === "bullet" ? "\n" : "\n\n"), t += n.source;
	}), t;
}
function Pi(e) {
	let t = e.source.split("\n");
	return t.length > 1 && Ai(t[t.length - 1], si.exec(t[0])[1]);
}
function Fi(e, t) {
	if (e.kind !== "code" || !Pi(e)) return;
	let n = e.source.slice(0, e.prefix).replace(/^ {0,3}(`{3,}|~{3,})/, "").trim().toLowerCase().split(/\s+/)[0];
	return n ? t.find((e) => e.fence?.toLowerCase() === n) : void 0;
}
function Ii(e, t, n) {
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
var Li = Ii("image", /!\[[^\]\n]*\]\([^\s()]+(?: "w\d+")?\)/);
function Ri(e) {
	let [, t = "", n = "", r] = /^!\[([^\]]*)\]\(([^\s)]*)(?: "w(\d+)")?\)$/.exec(e) ?? [];
	return {
		alt: t,
		src: n,
		width: r ? Number(r) : null
	};
}
function zi(e, t, n) {
	return `![${e}](${t}${n ? ` "w${n}"` : ""})`;
}
var Bi = Ii("equation", /\$(?!\$)(?:\\.|[^$\n])+\$/), Vi = [Li, Bi], Hi = [
	"gray",
	"red",
	"orange",
	"green",
	"blue",
	"purple"
], Ui = /<u>|<span color="(gray|red|orange|green|blue|purple)">/y, Wi = [
	"**",
	"__",
	"~~",
	"==",
	"*",
	"_"
], Gi = {
	"**": "bold",
	__: "bold",
	"~~": "strike",
	"==": "highlight",
	"*": "italic",
	_: "italic"
}, Ki = /^\[([^[\]]*)\]\(([^\s()]*)\)/, qi = /(?:https?:\/\/|www\.)[^\s<>()]*[^\s<>().,;:!?'"]/g, Ji = (e) => !!e && /[\p{L}\p{N}]/u.test(e), Yi = (e) => !e || /\s/.test(e);
function Xi(e, t, n, r) {
	let i = 0;
	for (; t + i < r && e[t + i] === n;) i++;
	return i;
}
function Zi(e, t, n, r) {
	let i = Xi(e, t, n[0], r);
	return !(i < n.length || t + i >= r || Yi(e[t + i]) || n[0] === "_" && Ji(e[t - 1]));
}
function Qi(e, t, n, r) {
	for (let i = t; i < n; i++) {
		if (e[i] !== r[0]) continue;
		let a = Xi(e, i, r[0], n), o = r.length === 1 ? i : i + a - r.length;
		if (a >= r.length && !Yi(e[i - 1]) && o > t && !(r[0] === "_" && Ji(e[i + a]))) return o;
		i += a - 1;
	}
	return -1;
}
function $i(e, t, n, r, i, a) {
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
	for (let e of o.matchAll(qi)) {
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
function ea(e, t, n, r, i, a, o) {
	let s = t, c = t, l = (t) => $i(e, c, t, r, i, a);
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
			let t = Ki.exec(e.slice(s, n));
			if (t) {
				l(s);
				let n = [r + s, r + s + t[0].length];
				a.push({
					kind: "syntax",
					from: r + s,
					to: r + s + 1,
					group: n
				}), ea(e, s + 1, s + 1 + t[1].length, r, {
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
		if (t === "<" && !i.code) {
			Ui.lastIndex = s;
			let t = Ui.exec(e), u = t?.[1], d = u ? "</span>" : "</u>", f = t && !(u ? i.color : i.underline) ? e.indexOf(d, s + t[0].length) : -1;
			if (t && f >= 0 && f + d.length <= n) {
				l(s);
				let n = [r + s, r + f + d.length];
				a.push({
					kind: "syntax",
					from: r + s,
					to: r + s + t[0].length,
					group: n
				}), ea(e, s + t[0].length, f, r, u ? {
					...i,
					color: u
				} : {
					...i,
					underline: !0
				}, a, o), a.push({
					kind: "syntax",
					from: r + f,
					to: r + f + d.length,
					group: n
				}), s = f + d.length, c = s;
				continue;
			}
		}
		let u = !1;
		if (!i.code) for (let t of Wi) {
			if (!e.startsWith(t, s) || i[Gi[t]] || !Zi(e, s, t, n)) continue;
			let d = Qi(e, s + t.length, n, t);
			if (d < 0) continue;
			l(s);
			let f = [r + s, r + d + t.length];
			a.push({
				kind: "syntax",
				from: r + s,
				to: r + s + t.length,
				group: f
			}), ea(e, s + t.length, d, r, {
				...i,
				[Gi[t]]: !0
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
function ta(e, t = Vi) {
	let n = [], r = e.source.split("\n"), i = e.kind === "code" && Pi(e);
	if (e.kind === "equation") return [{
		kind: "atom",
		atom: "equation-block",
		from: 0,
		to: e.source.length,
		group: [0, e.source.length]
	}];
	if (e.kind === "columns") return [{
		kind: "atom",
		atom: "columns",
		from: 0,
		to: e.source.length
	}];
	if (e.kind === "toc") return [{
		kind: "atom",
		atom: "toc",
		from: 0,
		to: e.source.length
	}];
	if (e.kind === "tabs") return [{
		kind: "atom",
		atom: "tabs",
		from: 0,
		to: e.source.length
	}];
	let a = Fi(e, t);
	if (a) return [{
		kind: "atom",
		atom: a.name,
		from: 0,
		to: e.source.length,
		group: [0, e.source.length]
	}];
	let o = 0;
	return r.forEach((a, s) => {
		if (s && n.push({
			kind: "break",
			from: o - 1,
			to: o
		}), e.kind === "code") s === 0 || i && s === r.length - 1 ? n.push({
			kind: "syntax",
			from: o,
			to: o + a.length,
			prefix: !0
		}) : a && n.push({
			kind: "text",
			from: o,
			to: o + a.length,
			code: !0
		});
		else if (e.kind === "divider") n.push({
			kind: "syntax",
			from: o,
			to: o + a.length,
			prefix: !0
		});
		else {
			let r = 0;
			s === 0 && (e.kind === "heading" || e.kind === "bullet") ? r = e.prefix : (e.kind === "quote" || e.kind === "callout") && (r = s === 0 && e.kind === "callout" ? e.prefix : oi.exec(a)?.[0].length ?? 0), r && n.push({
				kind: "syntax",
				from: o,
				to: o + r,
				prefix: !0
			}), ea(a, r, a.length, o, {}, n, t);
		}
		o += a.length + 1;
	}), n;
}
//#endregion
//#region src/document.ts
function na(e) {
	return Mi(e.replace(/\r\n?/g, "\n").replace(/^\n+|\n+$/g, "")).map(({ start: e, ...t }) => t);
}
var ra = {
	kind: "paragraph",
	source: "",
	prefix: 0
};
function ia(e) {
	return e.trim() ? na(e) : [ra];
}
var J = Ni;
function aa(e, t) {
	return e.block - t.block || e.offset - t.offset;
}
function oa(e, t) {
	return aa(e, t) <= 0 ? [e, t] : [t, e];
}
function Y(e, t, n, r) {
	let [i, a] = oa(t, n), o = e[i.block].source.slice(0, i.offset), s = e[a.block].source.slice(a.offset), c = o + r + s, l = o.length + r.length, u = Mi(c), d = u.map(({ start: e, ...t }) => t), f = [
		...e.slice(0, i.block),
		...d,
		...e.slice(a.block + 1)
	], p = {
		block: i.block + u.length - 1,
		offset: d[d.length - 1].source.length
	};
	for (let e = 0; e < u.length; e++) {
		let t = u[e];
		if (l < t.start) {
			p = {
				block: i.block + e,
				offset: 0
			};
			break;
		}
		if (l <= t.start + t.source.length) {
			p = {
				block: i.block + e,
				offset: l - t.start
			};
			break;
		}
	}
	return {
		blocks: f,
		caret: p
	};
}
function sa(e, t, n) {
	let [r, i] = oa(t, n);
	return r.block === i.block ? e[r.block].source.slice(r.offset, i.offset) : Ni([
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
function ca(e) {
	let t = e.source.slice(0, e.prefix), n = e.checked === void 0 ? "" : "[ ] ";
	return e.number === void 0 ? t.replace(/\[[ xX]\][ \t]+$/, "") + n : t.replace(/\d+/, String(e.number + 1)).replace(/\[[ xX]\][ \t]+$/, "") + n;
}
function la(e, t) {
	let n = e[t.block], r = n.source, i = r.slice(0, t.offset), a = r.slice(t.offset);
	if (n.kind === "code") {
		if (!(t.offset === r.length && Pi(n))) return Y(e, t, t, "\n");
	} else if (n.kind === "bullet") {
		if (!r.slice(n.prefix).trim()) return n.depth ? wa(e, {
			anchor: t.block,
			focus: t.block
		}, -1) : Y(e, {
			block: t.block,
			offset: 0
		}, {
			block: t.block,
			offset: r.length
		}, "");
		a = ca(n) + a;
	} else if (n.kind === "quote") {
		let n = r.lastIndexOf("\n", t.offset - 1) + 1;
		if (!r.slice(n, t.offset).replace(oi, "").trim() && !a.trim()) i = r.slice(0, Math.max(0, n - 1)), a = "";
		else return Y(e, t, t, "\n> ");
	}
	let o = ia(i), s = ia(a), c = [
		...e.slice(0, t.block),
		...o,
		...s,
		...e.slice(t.block + 1)
	], l = s[0], u = l.kind === "bullet" || l.kind === "quote" ? l.prefix : 0;
	return {
		blocks: c,
		caret: {
			block: t.block + o.length,
			offset: u
		}
	};
}
function ua(e, t) {
	let n = e[t];
	return !n.prefix || n.kind === "code" || n.kind === "divider" ? null : Y(e, {
		block: t,
		offset: 0
	}, {
		block: t,
		offset: n.prefix
	}, "");
}
function da(e, t) {
	if (t === 0) return null;
	let n = e[t - 1], r = {
		block: t - 1,
		offset: n.source.length
	};
	return n.kind === "divider" ? Y(e, {
		block: t - 1,
		offset: 0
	}, {
		block: t,
		offset: 0
	}, "") : n.kind === "code" && e[t].source ? {
		blocks: [...e],
		caret: r
	} : Y(e, r, {
		block: t,
		offset: 0
	}, "");
}
function fa(e, t) {
	if (t + 1 >= e.length) return null;
	let n = e[t + 1];
	if (n.kind === "divider") return Y(e, {
		block: t,
		offset: e[t].source.length
	}, {
		block: t + 1,
		offset: n.source.length
	}, "");
	let r = da(e, t + 1);
	return r && {
		...r,
		caret: {
			block: t,
			offset: e[t].source.length
		}
	};
}
function pa(e, t, n, r, i = r) {
	let [a, o] = oa(t, n);
	if (a.block !== o.block) {
		let t = [...e], n = a, s = o;
		for (let c = o.block; c >= a.block; c--) {
			let l = c === a.block ? Math.max(a.offset, e[c].prefix) : e[c].prefix, u = c === o.block ? o.offset : e[c].source.length, d = e[c].source;
			if (c === a.block && d.slice(l - r.length, l) === r && d.endsWith(i) && (u -= i.length), c === o.block && d.slice(u, u + i.length) === i && d.slice(l, l + r.length) === r && (l += r.length), u <= l || e[c].kind === "code" || e[c].kind === "divider") continue;
			let f = pa(t, {
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
		blocks: Y(e, d(a.offset - l), d(o.offset + u), c).blocks,
		anchor: d(a.offset - l),
		focus: d(o.offset - l)
	} : c.length > l + u && c.startsWith(r) && c.endsWith(i) ? {
		blocks: Y(e, a, o, c.slice(l, c.length - u)).blocks,
		anchor: a,
		focus: d(o.offset - l - u)
	} : {
		blocks: Y(e, a, o, r + c + i).blocks,
		anchor: d(a.offset + l),
		focus: d(a.offset + l + c.length)
	};
}
var ma = /<span color="[a-z]+">$/, ha = /<span color="[a-z]+">([\s\S]*?)<\/span>/g;
function ga(e, t, n, r) {
	let [i, a] = oa(t, n), o = [...e], s = i, c = a, l = !1;
	for (let e = a.block; e >= i.block; e--) {
		let t = o[e];
		if (t.kind === "code" || t.kind === "divider") continue;
		let n = e === i.block ? Math.max(i.offset, t.prefix) : t.prefix, u = e === a.block ? a.offset : t.source.length;
		if (u <= n) continue;
		let d = t.source, f = d.slice(n, u), p = ma.exec(d.slice(0, n)), m = n, h = u, g;
		if (p && d.startsWith("</span>", u)) m = n - p[0].length, h = u + 7, g = f.replace(ha, "$1");
		else {
			let e = /^<span color="[a-z]+">([\s\S]*)<\/span>$/.exec(f);
			if (g = (e && !e[1].includes("</span>") ? e[1] : f).replace(ha, "$1"), !r && g === f) continue;
		}
		let _ = r ? `<span color="${r}">` : "";
		o = Y(o, {
			block: e,
			offset: m
		}, {
			block: e,
			offset: h
		}, r ? `${_}${g}</span>` : g).blocks, l = !0, e === i.block && (s = {
			block: e,
			offset: m + _.length
		}), e === a.block && (c = {
			block: e,
			offset: m + _.length + g.length
		});
	}
	return l ? {
		blocks: o,
		anchor: s,
		focus: c
	} : null;
}
function _a(e, t) {
	let n = e[t];
	if (n.kind !== "bullet" || n.checked === void 0) return null;
	let r = n.source.indexOf("[") + 1;
	return Y(e, {
		block: t,
		offset: r
	}, {
		block: t,
		offset: r + 1
	}, n.checked ? " " : "x");
}
function va(e, t, n = t) {
	let r = (t) => Math.max(0, Math.min(e.length - 1, t));
	return {
		anchor: r(t),
		focus: r(n)
	};
}
function ya(e, t, n) {
	let r = Math.min(t.anchor, t.focus), i = Math.max(t.anchor, t.focus), a = e.flatMap((e, t) => {
		if (t < r || t > i) return [e];
		let a = e.source.slice(e.prefix);
		if (e.kind === "code") {
			let t = e.source.split("\n").slice(1);
			Pi(e) && t.pop(), a = t.join("\n");
		} else e.kind === "quote" || e.kind === "callout" ? a = e.source.split("\n").map((t, n) => n === 0 ? t.slice(e.prefix) : t.replace(oi, "")).join("\n") : e.kind === "divider" && (a = "");
		let o = {
			paragraph: "",
			h1: "# ",
			h2: "## ",
			h3: "### ",
			todo: "- [ ] ",
			bullet: "- ",
			numbered: `${t - r + 1}. `,
			quote: "> ",
			code: "",
			divider: "",
			callout: "> [!💡] ",
			toggle: "> [!note]- ",
			"toggle-h1": "> [!note]- # ",
			"toggle-h2": "> [!note]- ## ",
			"toggle-h3": "> [!note]- ### ",
			table: "",
			equation: ""
		}[n], s = "`".repeat(Math.max(3, ...Array.from(a.matchAll(/`+/g), (e) => e[0].length + 1)));
		return Mi(n === "code" ? `${s}\n${a}\n${s}` : n === "divider" ? "---" : n === "equation" ? `$$\n${a}\n$$` : n === "table" ? "| Column 1 | Column 2 |\n| --- | --- |\n|  |  |" : n === "callout" || n.startsWith("toggle") ? o + a.split("\n").join("\n> ") : a.split("\n").map((e) => o + e).join("\n")).map(({ start: e, ...t }) => t);
	});
	return {
		blocks: a,
		caret: {
			block: r,
			offset: a[r].prefix
		}
	};
}
function ba(e, t) {
	let n = Math.min(t.anchor, t.focus), r = Math.max(t.anchor, t.focus), i = [...e.slice(0, n), ...e.slice(r + 1)];
	i.length || i.push({ ...ra });
	let a = Math.min(n, i.length - 1);
	return {
		blocks: i,
		caret: {
			block: a,
			offset: i[a].prefix
		}
	};
}
function xa(e, t) {
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
function Sa(e, t, n) {
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
function Ca(e) {
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
function wa(e, t, n) {
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
		blocks: Ca(l),
		caret: {
			block: r,
			offset: l[r].prefix
		}
	};
}
function Ta(e, t, n) {
	let r = e[t];
	if (r.kind !== "callout") return null;
	let i = n === void 0 ? !r.folded : !n, a = r.source.replace(/^(>\s*\[![^\]\n]*\])-?/, `$1${i ? "-" : ""}`), o = [...e];
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
function Ea(e, t, n) {
	let r = e[t];
	if (r.kind !== "callout") return null;
	let i = di(r.source);
	if (!i) return null;
	let a = n.icon === void 0 ? i.icon : n.icon ?? void 0, o = n.color === void 0 ? i.color : n.color ?? void 0, s = fi({
		kind: a !== void 0 || o !== void 0 ? "" : i.kind,
		icon: a,
		color: o,
		folded: i.folded
	}), c = r.source.slice(i.length), l = s + (/[ \t]*$/.exec(r.source.slice(0, i.length))[0] || (c && !c.startsWith("\n") ? " " : "")) + c, u = [...e];
	return u[t] = Mi(l).map(({ start: e, ...t }) => t)[0], {
		blocks: u,
		caret: {
			block: t,
			offset: u[t].prefix
		}
	};
}
//#endregion
//#region src/history.ts
var Da = class {
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
		t !== "edit" && t === this.lastKind && n - this.lastTime < 700 && e.focus.block === this.lastBlock && !(t === "type" && Oa(e)) ? this.past[this.past.length - 1] = e : this.past.push(e), this.future = [], this.lastKind = t, this.lastTime = n, this.lastBlock = e.focus.block;
	}
	undo() {
		if (this.past.length < 2) return null;
		let e = this.past.pop();
		this.future.push(e), this.lastKind = null;
		let t = Aa(this.current.blocks, e.blocks);
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
}, Oa = ({ blocks: e, focus: t }) => {
	let n = e[t.block]?.source ?? "";
	return /\s/.test(n[t.offset - 1] ?? "") && /\S/.test(n[t.offset - 2] ?? "");
}, ka = (e, t) => e === t || e.kind === t.kind && e.source === t.source;
function Aa(e, t) {
	let n = 0;
	for (; n < e.length && n < t.length && ka(e[n], t[n]);) n++;
	if (n === e.length && n === t.length) return null;
	let r = e.length, i = t.length;
	for (; r > n && i > n && ka(e[r - 1], t[i - 1]);) r--, i--;
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
function ja(e) {
	let t = 0;
	return e.split("\n").flatMap((e, n) => {
		let r = t;
		if (t += e.length + 1, n === 1) return [];
		let i = [-1], a = !1;
		for (let t = 0; t < e.length; t++) e[t] === "\\" ? t++ : (e[t] === "`" && (a = !a), e[t] === "|" && !a && i.push(t));
		i.push(e.length);
		let o = [];
		for (let t = 1; t < i.length; t++) {
			let n = i[t - 1] + 1, a = i[t];
			if ((t === 1 || t === i.length - 1) && !e.slice(n, a).trim()) continue;
			let s = e.slice(n, a), c = n + (s.match(/^[ \t]?/)?.[0].length ?? 0), l = Math.max(c, a - (s.match(/[ \t]?$/)?.[0].length ?? 0));
			o.push({
				text: e.slice(c, l),
				from: r + c,
				to: r + l
			});
		}
		return [o];
	});
}
function Ma(e) {
	return (e.split("\n")[1] ?? "").replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((e) => {
		let t = e.trim(), n = t.startsWith(":"), r = t.endsWith(":");
		return n && r ? "center" : r ? "end" : n ? "start" : null;
	});
}
var Na = {
	start: ":---",
	center: ":---:",
	end: "---:"
};
function Pa(e, t = []) {
	let n = Math.max(1, ...e.map((e) => e.length)), r = (e) => `| ${Array.from({ length: n }, (t, n) => (e[n] ?? "").replace(/\r?\n/g, " ").replace(/(?<!\\)\|/g, "\\|")).join(" | ")} |`, i = `| ${Array.from({ length: n }, (e, n) => Na[t[n] ?? ""] ?? "---").join(" | ")} |`;
	return [
		r(e[0] ?? [""]),
		i,
		...e.slice(1).map(r)
	].join("\n");
}
function Fa(e) {
	return e.includes("	") ? Pa(e.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n").map((e) => e.split("	"))) : null;
}
function Ia(e, t, n, r) {
	let i = ja(e.source).map((e) => e.map((e) => e.text)), a = Ma(e.source), o = Math.max(1, ...i.map((e) => e.length));
	return i.forEach((e) => {
		for (; e.length < o;) e.push("");
	}), t === "add-row" && i.splice(n + 1, 0, Array(o).fill("")), t === "delete-row" && n > 0 && i.length > 1 && i.splice(n, 1), t === "add-column" && (i.forEach((e) => e.splice(r + 1, 0, "")), a.splice(r + 1, 0, null)), t === "delete-column" && o > 1 && (i.forEach((e) => e.splice(r, 1)), a.splice(r, 1)), Pa(i, a);
}
//#endregion
//#region src/icons.ts
var La = {
	"./icons/check.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.68649 11.884L12.443 6.13601L11.736 5.42715L6.68835 10.4827L4.26399 8.0501L3.55696 8.74525L6.68649 11.884Z\" fill=\"currentColor\"/>\n</svg>\n",
	"./icons/note.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.9653 3.31348V12.6865H2.03467V3.31348H13.9653ZM3.03467 11.6865H12.9653V4.31348H3.03467V11.6865Z\" fill=\"#1E1E1E\"/>\n<path d=\"M8.00641 7.08004V7.99996H3.71344V7.08004H8.00641ZM9.9527 5.08004V5.99996H3.71344V5.08004H9.9527Z\" fill=\"#1E1E1E\"/>\n</svg>\n",
	"./icons/send.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 12.5V4.5M4.75 7.75L8 4.5L11.25 7.75\" stroke=\"currentColor\" stroke-width=\"1\"/>\n</svg>\n",
	"./icons/chevron-up.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.25 9.75L8 6L11.75 9.75\" stroke=\"currentColor\"/>\n</svg>\n",
	"./icons/chevron-down.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.25 6.25L8 10L11.75 6.25\" stroke=\"currentColor\"/>\n</svg>\n",
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
	"./icons/connect.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.7982 7.99673L7.65899 12.1359L6.94737 11.4243L9.87875 8.50597L3.88054 8.51223L3.88054 7.49375L9.87875 7.48749L6.9539 4.56264L7.66552 3.86407L11.7982 7.99673Z\" fill=\"black\"/>\n<path d=\"M3.37131 7.99987C3.37131 8.81187 2.71305 9.47013 1.90105 9.47013C1.08904 9.47013 0.430786 8.81187 0.430786 7.99987C0.430786 7.18787 1.08904 6.52961 1.90105 6.52961C2.71305 6.52961 3.37131 7.18787 3.37131 7.99987Z\" fill=\"black\"/>\n<path d=\"M15.5692 7.99987C15.5692 8.81187 14.911 9.47013 14.099 9.47013C13.2869 9.47013 12.6287 8.81187 12.6287 7.99987C12.6287 7.18787 13.2869 6.52961 14.099 6.52961C14.911 6.52961 15.5692 7.18787 15.5692 7.99987Z\" fill=\"black\"/>\n</svg>\n",
	"./icons/slash.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M10.25 3L5.75 13\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/underline.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M5.5 3.25V8A2.5 2.5 0 0 0 10.5 8V3.25M4 12.75H12\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n",
	"./icons/color.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"6\" cy=\"6\" r=\"5\" stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"/>\n<circle cx=\"6\" cy=\"6\" r=\"3\" fill=\"currentColor\"/>\n</svg></svg>\n",
	"./icons/tabs.svg": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 13V3H6.5V6H13.5V13Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M9.5 6V3H13.5V6\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>\n"
}, Ra = (e, t) => {
	let n = za(e, t);
	return n.textContent = t, n;
};
function za(e, t) {
	let n = document.createElement("span");
	return n.className = "aa-atom", n.contentEditable = "false", n.dataset.atom = e, n.dataset.source = t, n;
}
var Ba = (e) => e instanceof HTMLElement && e.classList.contains("aa-atom");
function Va(e, t, n = Vi) {
	if (!t || Fi(e, n)) return "";
	let r = [];
	for (let i of ta(e, n)) {
		if (!i.group) continue;
		let e = `${i.group[0]}-${i.group[1]}`;
		t.from <= i.group[1] && t.to >= i.group[0] && !r.includes(e) && r.push(e);
	}
	return `on:${r.join(",")}`;
}
function Ha(e, t, n, r = Vi, i = Ra, a = []) {
	e.className = "aa-block", e.dataset.kind = t.kind;
	for (let n of [
		"spellcheck",
		"autocorrect",
		"autocapitalize"
	]) t.kind === "code" ? e.setAttribute(n, n === "spellcheck" ? "false" : "off") : e.removeAttribute(n);
	if (t.level ? e.dataset.level = String(t.level) : delete e.dataset.level, t.checked === void 0 ? delete e.dataset.checked : e.dataset.checked = t.checked ? "true" : "false", e.toggleAttribute("data-active", !!n), e.toggleAttribute("data-empty", t.kind === "heading" && !t.source.slice(t.prefix).trim()), e.dataset.reveal = Va(t, n, r), e.style.setProperty("--aa-depth", String(t.depth ?? 0)), t.number === void 0 ? delete e.dataset.number : e.dataset.number = String(t.number), t.kind === "callout") {
		let r = t.box && t.icon && /^https?:\/\//i.test(t.icon) ? t.icon : void 0;
		if (e.toggleAttribute("data-box", !!t.box), t.box && t.icon && !r ? e.dataset.icon = t.icon : delete e.dataset.icon, e.toggleAttribute("data-picture", !!r), r ? e.style.setProperty("--aa-callout-picture", `url("${r.replace(/["\\\s]/g, (e) => encodeURIComponent(e))}")`) : e.style.removeProperty("--aa-callout-picture"), t.box && t.color ? e.dataset.fill = t.color : delete e.dataset.fill, t.box) e.style.removeProperty("--aa-callout-icon");
		else {
			let n = La[`./icons/${t.folded ? "toggle" : t.callout === "tip" ? "check" : t.callout === "warning" || t.callout === "caution" ? "callout" : "note"}.svg`];
			e.style.setProperty("--aa-callout-icon", `url("data:image/svg+xml,${encodeURIComponent(n.replace(/currentColor/g, "black"))}")`);
		}
		e.dataset.callout = t.callout, e.toggleAttribute("data-folded", !!t.folded), e.toggleAttribute("data-body-active", !!n && n.to > t.source.indexOf("\n") && t.source.includes("\n"));
	} else delete e.dataset.callout, delete e.dataset.icon, delete e.dataset.fill, e.removeAttribute("data-box"), e.removeAttribute("data-picture"), e.style.removeProperty("--aa-callout-picture"), e.removeAttribute("data-folded"), e.removeAttribute("data-body-active");
	if (t.kind === "table") {
		Ga(e, t, a), Wa(e, a);
		return;
	}
	let o = Fi(t, r);
	e.toggleAttribute("data-drawn", !!o || t.kind === "columns" || t.kind === "tabs" || t.kind === "toc"), o ? e.dataset.fence = o.name : delete e.dataset.fence;
	let s = /* @__PURE__ */ new Map();
	for (let t of e.querySelectorAll(".aa-atom")) {
		let e = `${t.dataset.atom}\u0000${t.dataset.source}`;
		s.set(e, [...s.get(e) ?? [], t]);
	}
	let c = document.createDocumentFragment(), l = document.createElement("span");
	l.className = "aa-callout-body";
	let u = c, d = !1, f = !1;
	for (let e of ta(t, r)) {
		if (t.kind === "callout" && e.from >= t.source.indexOf("\n") && t.source.includes("\n") && u === c && (c.append(l), u = l), f = e.kind === "break", e.kind === "break") {
			u.append(document.createElement("br"));
			continue;
		}
		let r = t.source.slice(e.from, e.to);
		if (!r) continue;
		if (e.kind === "atom") {
			e.group && n && !o && n.from <= e.to && n.to >= e.from ? u.append(document.createTextNode(r)) : u.append(s.get(`${e.atom}\u0000${r}`)?.shift() ?? i(e.atom, r)), d = !0;
			continue;
		}
		if (e.kind === "syntax") {
			let e = document.createElement("span");
			e.className = "aa-syntax", e.setAttribute("data-hidden", ""), e.textContent = r, u.append(e);
			continue;
		}
		d = !0;
		let p = e.href ? document.createElement("a") : document.createElement("span");
		p instanceof HTMLAnchorElement && (p.href = e.href, p.className = "aa-link", p.rel = "noopener"), e.bold && p.classList.add("aa-b"), e.italic && p.classList.add("aa-i"), e.strike && p.classList.add("aa-s"), e.underline && p.classList.add("aa-u"), e.color && (p.dataset.color = e.color), e.code && (p.classList.add("aa-c"), p.spellcheck = !1), e.highlight && p.classList.add("aa-highlight"), p.textContent = r, Ua(p, e.from, a), u.append(p);
	}
	if (!d || f) {
		let e = document.createElement("br");
		e.dataset.filler = "", c.append(e);
	}
	e.replaceChildren(c), Wa(e, a);
}
function Ua(e, t, n) {
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
		for (let e of i) if (e.from < t + s && e.to > t + o) {
			c.classList.add(...e.className.split(/\s+/).filter(Boolean)), e.label && (c.title = e.label);
			for (let [t, n] of Object.entries(e.attributes ?? {})) c.setAttribute(t, c.hasAttribute(t) ? `${c.getAttribute(t)} ${n}` : n);
		}
		e.append(c);
	}
}
function Wa(e, t) {
	for (let n of t.filter((t) => t.from === t.to && t.from >= 0 && t.from <= Ka(e).length)) {
		let t = document.createElement("span");
		t.className = `${n.className} aa-peer-caret`, t.contentEditable = "false", t.dataset.label = n.label ?? "", n.label && (t.dataset.initial = zr(n.label)), t.title = n.label ?? "";
		let r = Ya(e, n.from), i = document.createRange();
		i.setStart(r.node, r.offset), i.collapse(!0), i.insertNode(t);
	}
}
function Ga(e, t, n) {
	e.contentEditable = "false";
	let r = ja(t.source), i = Ma(t.source), a = document.createDocumentFragment(), o = 0;
	r.forEach((r, s) => {
		let c = document.createElement("span");
		c.className = "aa-table-row", c.style.setProperty("--aa-columns", String(r.length)), r.forEach((r, a) => {
			let l = document.createElement("span");
			l.className = "aa-table-cell", l.dataset.cell = `${s}:${a}`, i[a] && (l.dataset.align = i[a]), l.dataset.from = String(r.from), l.dataset.to = String(r.to), l.contentEditable = e.dataset.readonly === "true" ? "false" : "true";
			let u = document.createElement("span");
			u.className = "aa-syntax", u.dataset.hidden = "", u.textContent = t.source.slice(o, r.from);
			let d = document.createElement("span");
			if (d.textContent = r.text, Ua(d, r.from, n), !r.text) {
				let e = document.createElement("br");
				e.dataset.filler = "", d.append(e);
			}
			l.append(u, d), c.append(l), o = r.to;
		}), a.append(c);
	});
	let s = document.createElement("span");
	s.className = "aa-syntax", s.dataset.hidden = "", s.textContent = t.source.slice(o), a.append(s), e.replaceChildren(a);
}
function Ka(e) {
	let t = "", n = (e) => {
		for (let r of Array.from(e.childNodes)) r.nodeType === Node.TEXT_NODE ? t += (r.textContent ?? "").replace(/ /g, " ") : r instanceof HTMLElement && (Ba(r) ? t += r.dataset.source ?? "" : r.tagName === "BR" ? "filler" in r.dataset || (t += "\n") : (/^(DIV|P)$/.test(r.tagName) && t && !t.endsWith("\n") && (t += "\n"), n(r)));
	};
	return n(e), t;
}
function qa(e) {
	let t = e.parentElement;
	return !!t && !!t.closest(".aa-syntax[data-hidden]");
}
function Ja(e, t, n) {
	let r = 0, i = -1, a = (e) => {
		let o = Array.from(e.childNodes);
		for (let s = 0; s < o.length; s++) {
			let c = o[s];
			if (e === t && s === n) return i = r, !0;
			if (c === t && c.nodeType === Node.TEXT_NODE) return i = r + n, !0;
			if (c.nodeType === Node.TEXT_NODE) r += (c.textContent ?? "").length;
			else if (c instanceof HTMLElement) {
				if (Ba(c)) {
					let e = (c.dataset.source ?? "").length;
					if (c === t || c.contains(t)) return i = c === t && n === 0 ? r : r + e, !0;
					r += e;
				} else if (c.tagName === "BR") r += "filler" in c.dataset ? 0 : 1;
				else if (a(c)) return !0;
			}
		}
		return e === t && n >= o.length && (i = r, !0);
	};
	return (t === e || e.contains(t)) && a(e), i < 0 ? r : i;
}
function Ya(e, t) {
	if (e.dataset.kind === "table") {
		let n = Array.from(e.querySelectorAll("[data-cell]")).find((e) => t >= Number(e.dataset.from) && t <= Number(e.dataset.to));
		if (n?.lastElementChild) return Ya(n.lastElementChild, t - Number(n.dataset.from));
	}
	let n = 0, r = null, i = (e) => {
		let a = Array.from(e.childNodes);
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			if (s.nodeType === Node.TEXT_NODE) {
				let e = (s.textContent ?? "").length;
				if (!qa(s) && t <= n + e) return r = {
					node: s,
					offset: Math.max(0, t - n)
				}, !0;
				n += e;
			} else if (s instanceof HTMLElement) {
				if (Ba(s)) {
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
				} else if (s.tagName === "BR") {
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
				} else if (i(s)) return !0;
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
//#region src/vendor/drag/util.ts
function Xa(e) {
	let t = !1, n;
	return ((...r) => (t || (t = !0, n = e(...r)), n));
}
//#endregion
//#region src/vendor/drag/sortable.ts
var Za = {
	instructions: "Press space to lift. Then use the arrow keys to move, space to drop and escape to cancel.",
	lifted: (e) => `Lifted ${e.item}, position ${e.position} of ${e.count} in ${e.list}.`,
	moved: (e) => `${e.item}, position ${e.position} of ${e.count} in ${e.list}.`,
	outside: (e) => `${e} is outside every list.`,
	combining: (e, t) => `${e} is over ${t}. Drop to put them together.`,
	combined: (e, t) => `Dropped ${e} onto ${t}.`,
	dropped: (e) => `Dropped ${e.item} at position ${e.position} of ${e.count} in ${e.list}.`,
	returned: (e) => `${e.item} is back at position ${e.position} of ${e.count} in ${e.list}.`
}, Qa = {
	touchHold: 250,
	dragDistance: 5,
	outOfTheWay: {
		duration: 200,
		easing: "cubic-bezier(0.2, 0, 0, 1)"
	},
	drop: {
		minDuration: 330,
		maxDuration: 550,
		easing: "cubic-bezier(.2, 1, .1, 1)"
	},
	autoScrollEdge: 60
}, $a = 1500, eo = 24, to = [
	"color",
	"font",
	"letter-spacing",
	"line-height",
	"-webkit-font-smoothing"
], no = "input, textarea, select, option, button, a[href], [contenteditable]:not([contenteditable=\"false\"])", ro = "data-0001-drag-sortable-style", io = "\n[data-drag-handle]:not([data-drag-handle=\"text\"]){-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;cursor:grab;touch-action:manipulation}\n:root[data-drag-active],:root[data-drag-active] *{-webkit-user-select:none!important;user-select:none!important;cursor:grabbing!important}\n";
function ao(e = {}) {
	let t = {
		touchHold: e.touchHold ?? Qa.touchHold,
		dragDistance: e.dragDistance ?? Qa.dragDistance,
		outOfTheWay: e.outOfTheWay ?? Qa.outOfTheWay,
		drop: e.drop ?? Qa.drop,
		autoScrollEdge: e.autoScrollEdge ?? Qa.autoScrollEdge
	}, n = {
		...Za,
		...e.messages
	}, r = e.pointerPoint ?? ((e) => ({
		x: e.clientX,
		y: e.clientY
	})), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = null, c = null, l = !1, u = !1, d = !1, f = null, p = null;
	function m(e) {
		let t = {
			element: e.element,
			id: e.id,
			type: e.type ?? "default",
			axis: e.axis ?? "vertical",
			isDropDisabled: e.isDropDisabled ?? (() => !1),
			isCombineEnabled: e.isCombineEnabled ?? (() => !1),
			label: () => e.label ?? e.element.getAttribute("aria-label") ?? e.id,
			still: e.still ?? !1,
			lockAxis: e.lockAxis,
			renderPreview: e.renderPreview
		};
		return i.set(e.element, t), Xa(() => {
			i.get(e.element) === t && i.delete(e.element);
		});
	}
	function h(e) {
		let t = e.handle ?? e.element, n = {
			element: e.element,
			id: e.id,
			type: e.type ?? "default",
			handle: t,
			canDrag: e.canDrag ?? (() => !0),
			allowInteractive: e.allowInteractive ?? !1,
			label: () => e.label ?? uo(e.element, t),
			text: e.text
		};
		a.set(e.element, n), o.set(t, n), t.setAttribute("data-drag-handle", e.text ? "text" : "");
		let r = !e.text && !t.hasAttribute("tabindex") && !t.matches(no);
		r && (t.tabIndex = 0);
		let i = t.getAttribute("aria-describedby");
		return g(t.ownerDocument), f && !e.text && t.setAttribute("aria-describedby", [i, f.id].filter(Boolean).join(" ")), Xa(() => {
			if (a.get(e.element) === n && a.delete(e.element), o.get(t) === n) {
				if (o.delete(t), t.removeAttribute("data-drag-handle"), r && t.removeAttribute("tabindex"), e.text) return;
				i ? t.setAttribute("aria-describedby", i) : t.removeAttribute("aria-describedby");
			}
		});
	}
	function g(e) {
		if (!l) {
			if (l = !0, window.addEventListener("pointerdown", S, !0), window.addEventListener("keydown", b, !0), !e.querySelector(`style[${ro}]`)) {
				let t = e.createElement("style");
				t.setAttribute(ro, ""), t.textContent = io, e.head.appendChild(t);
			}
			f = lo(e, `0001-drag-instructions-${++oo}`), f.textContent = n.instructions, p = lo(e, `0001-drag-live-${oo}`), p.setAttribute("aria-live", "assertive"), p.setAttribute("aria-atomic", "true");
		}
	}
	function _(e) {
		p && (p.textContent = e);
	}
	function v(e) {
		let t = e.destination;
		return t ? {
			item: e.item.label(),
			list: t.container.registration.label(),
			position: t.index + 1,
			count: t.container.slots.length + 1
		} : null;
	}
	function y(e) {
		let t = v(e);
		_(t ? n.moved(t) : n.outside(e.item.label()));
	}
	function b(e) {
		if (u || c || s || e.key !== " " || e.defaultPrevented || e.target instanceof Element && e.target.matches("input, textarea, select, [contenteditable]:not([contenteditable=\"false\"])")) return;
		let t = e.target instanceof HTMLElement ? o.get(e.target) : void 0;
		if (!t || t.text || !t.canDrag({
			input: "keyboard",
			target: t.handle
		})) return;
		e.preventDefault(), e.stopPropagation(), te();
		let n = mo(t.element);
		M(t, -1, n.left + n.width / 2, n.top + n.height / 2, "SNAP");
	}
	function x(e) {
		let t = e instanceof Element ? e : null, n = !1;
		for (; t;) {
			let e = t instanceof HTMLElement ? o.get(t) : void 0;
			if (e) return n && !e.allowInteractive ? null : e;
			t.matches(no) && (n = !0), t = t.parentElement;
		}
		return null;
	}
	function S(e) {
		if (u || c || s || e.pointerType === "mouse" && e.button !== 0) return;
		let n = x(e.target), i = e.target instanceof Element ? e.target : null;
		if (!n || !n.canDrag({
			input: e.pointerType || "mouse",
			target: i
		})) return;
		let a = e.pointerType !== "touch" && n.text ? Math.max(0, n.text.hold()) : 0;
		s = {
			item: n,
			pointerId: e.pointerId,
			pointerType: e.pointerType,
			startX: r(e).x,
			startY: r(e).y,
			timer: null,
			held: a > 0
		}, (e.pointerType === "touch" || a > 0) && (s.timer = setTimeout(() => {
			s && M(s.item, s.pointerId, s.startX, s.startY);
		}, a || t.touchHold)), te();
	}
	function C(e) {
		if (s && e.pointerId === s.pointerId) {
			let n = r(e);
			if (Math.hypot(n.x - s.startX, n.y - s.startY) < t.dragDistance) return;
			if (s.pointerType === "touch" || s.held) {
				let e = s.pointerType === "touch" ? void 0 : s.item.text?.axis, t = Math.abs(e === "x" ? n.x - s.startX : n.y - s.startY), r = Math.abs(e === "x" ? n.y - s.startY : n.x - s.startX);
				if (!e || t < 2 * r) {
					j();
					return;
				}
			}
			M(s.item, s.pointerId, s.startX, s.startY);
		}
		if (c && e.pointerId === c.pointerId && !c.dropping) {
			let t = r(e);
			re(t.x, t.y);
		}
	}
	function w(e) {
		s && e.pointerId === s.pointerId ? j() : c && e.pointerId === c.pointerId && !c.dropping && (ne(), fe("DROP"));
	}
	function T(e) {
		s && e.pointerId === s.pointerId && j(), c && e.pointerId === c.pointerId && !c.dropping && fe("CANCEL");
	}
	function E(e) {
		let t = c;
		if (t && !t.dropping) {
			if (e.key === "Escape") e.preventDefault(), e.stopPropagation(), fe("CANCEL");
			else if (t.mode === "SNAP") {
				if (e.key === " " || e.key === "Enter") fe("DROP");
				else if (e.key in so) I(t, so[e.key]);
				else if (e.key !== "Tab") return;
				e.preventDefault(), e.stopPropagation();
			}
		}
	}
	function D(e) {
		c && e.cancelable && e.preventDefault();
	}
	function ee(e) {
		(s || c) && e.preventDefault();
	}
	function O() {
		j(), c && !c.dropping && fe("CANCEL");
	}
	function k() {
		if (!c || c.dropping || c.impactFrame !== null) return;
		let e = c.overlay.ownerDocument.defaultView;
		e && (c.impactFrame = e.requestAnimationFrame(() => {
			c && (c.impactFrame = null, c.mode === "SNAP" ? ae(c, !1) : F(c));
		}));
	}
	function te() {
		window.addEventListener("pointermove", C, !0), window.addEventListener("pointerup", w, !0), window.addEventListener("pointercancel", T, !0), window.addEventListener("touchmove", D, {
			capture: !0,
			passive: !1
		}), window.addEventListener("contextmenu", ee, !0), window.addEventListener("keydown", E, !0), window.addEventListener("blur", O), window.addEventListener("scroll", k, !0);
	}
	function A() {
		window.removeEventListener("pointermove", C, !0), window.removeEventListener("pointerup", w, !0), window.removeEventListener("pointercancel", T, !0), window.removeEventListener("touchmove", D, !0), window.removeEventListener("contextmenu", ee, !0), window.removeEventListener("keydown", E, !0), window.removeEventListener("blur", O), window.removeEventListener("scroll", k, !0);
	}
	function j() {
		s && (s.timer && clearTimeout(s.timer), s = null, c || A());
	}
	function ne() {
		let e = (e) => {
			e.preventDefault(), e.stopPropagation();
		};
		window.addEventListener("click", e, {
			capture: !0,
			once: !0
		}), setTimeout(() => window.removeEventListener("click", e, !0), 0);
	}
	function M(t, r, a, o, l = "FLUID") {
		s?.timer && clearTimeout(s.timer), s = null, e.onBeforeCapture?.({
			draggableId: t.id,
			mode: l
		});
		let u = ve(t);
		if (!u) {
			A();
			return;
		}
		let f = u.element.ownerDocument, p = f.defaultView ?? window, m = G(u);
		if (!m) {
			A();
			return;
		}
		d = p.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? !1;
		let h = mo(u.element), g = p.getComputedStyle(u.element), y = {
			top: _o(g.marginTop),
			left: _o(g.marginLeft),
			vertical: _o(g.marginTop) + _o(g.marginBottom),
			horizontal: _o(g.marginLeft) + _o(g.marginRight)
		}, b = fo(u.element, h), x = /* @__PURE__ */ new Map(), S = [], C = 0;
		for (let e of i.values()) {
			if (e.type !== u.type || !e.element.isConnected) continue;
			let t = K(e), n = e === m, r = p.getComputedStyle(e.element), i = e.axis === "vertical", a = mo(e.element), o = fo(e.element, a), s = _o(i ? r.rowGap : r.columnGap) * o, c = [];
			t.forEach((e, t) => {
				e === u ? C = t : c.push({
					item: e,
					original: t,
					box: mo(e.element)
				});
			});
			let l = yo(e.element), d = x.get(l) ?? null;
			!d && l && (d = {
				element: l,
				liftLeft: l.scrollLeft,
				liftTop: l.scrollTop,
				box: mo(l)
			}, x.set(l, d)), S.push({
				registration: e,
				box: a,
				scale: o,
				gap: s,
				paddingStart: _o(i ? r.paddingTop : r.paddingLeft) * o,
				scroller: d,
				slots: c,
				room: e.still ? 0 : (i ? h.height + y.vertical * b : h.width + y.horizontal * b) + s,
				marginStart: (i ? y.top : y.left) * b,
				isHome: n
			});
		}
		let w = S.find((e) => e.isHome);
		if (!w) {
			A();
			return;
		}
		let T = f.createElement("div");
		T.setAttribute("data-drag-overlay", ""), Object.assign(T.style, {
			position: "fixed",
			inset: "0",
			pointerEvents: "none",
			zIndex: "2147483000",
			contain: "layout style"
		});
		for (let t of e.inheritProperties ?? []) T.style.setProperty(t, g.getPropertyValue(t));
		let E = w.registration.renderPreview?.(u.element) ?? e.renderPreview?.(u.element) ?? bo(u.element);
		for (let e of to) E.style.setProperty(e, g.getPropertyValue(e));
		E.setAttribute("data-drag-preview", ""), E.setAttribute("aria-hidden", "true"), Object.assign(E.style, {
			position: "absolute",
			left: `${h.left}px`,
			top: `${h.top}px`,
			width: `${u.element.offsetWidth ? u.element.offsetWidth : h.width}px`,
			height: `${u.element.offsetHeight ? u.element.offsetHeight : h.height}px`,
			transformOrigin: "0 0",
			margin: "0",
			boxSizing: "border-box",
			translate: "none",
			transform: po(0, 0, b),
			transition: "none",
			willChange: "transform",
			pointerEvents: "none"
		}), T.appendChild(E), f.body.appendChild(T);
		let D = u.element;
		c = {
			item: u,
			mode: l,
			pointerId: r,
			startX: a,
			startY: o,
			lastX: a,
			lastY: o,
			liftBox: h,
			previewScale: b,
			sourceIndex: C,
			home: w,
			containers: S,
			scrollers: [...x.values()],
			windowLiftX: p.scrollX,
			windowLiftY: p.scrollY,
			overlay: T,
			preview: E,
			destination: {
				container: w,
				index: C
			},
			shifts: /* @__PURE__ */ new Map(),
			sourceVisibility: D.style.visibility,
			reserved: null,
			scrollFrame: null,
			impactFrame: null,
			dropping: !1,
			combine: null,
			lockAxis: w.registration.lockAxis ?? e.lockAxis
		}, D.style.visibility = "hidden", D.setAttribute("data-drag-source", ""), w.registration.element.setAttribute("data-drag-over", ""), f.documentElement.setAttribute("data-drag-active", u.type), e.onDragStart?.(he(c));
		let ee = v(c);
		ee && _(n.lifted(ee));
	}
	function re(e, t) {
		let n = c;
		if (!n) return;
		n.lastX = e, n.lastY = t;
		let r = n.lockAxis === "y" ? 0 : e - n.startX, i = n.lockAxis === "x" ? 0 : t - n.startY;
		n.preview.style.transform = po(r, i, n.previewScale), F(n), le(n);
	}
	function N(e, t) {
		let n = e.overlay.ownerDocument.defaultView ?? window, r = n.scrollX - e.windowLiftX, i = n.scrollY - e.windowLiftY, a = t.scroller;
		return a?.element && (r += a.element.scrollLeft - a.liftLeft, i += a.element.scrollTop - a.liftTop), {
			x: r,
			y: i
		};
	}
	function P(e, t) {
		let n = N(e, t), r = t.box, i = t.scroller, a = {
			...r,
			left: r.left - n.x,
			top: r.top - n.y
		};
		return i?.element ? ho(a, i.box) : a;
	}
	function F(t) {
		let r = t.lastX, i = t.lastY, a = null, o = Infinity;
		for (let e of t.containers) {
			if (e.registration.isDropDisabled()) continue;
			let n = P(t, e);
			if (!go(n, r, i)) continue;
			let s = n.width * n.height;
			s < o && (a = e, o = s);
		}
		let s = a && t.mode === "FLUID" ? se(t, a) : null;
		if (s && a) {
			z(t, {
				container: a,
				slot: s
			}) && (e.onDragUpdate?.(ge(t)), _(n.combining(t.item.label(), s.item.label())));
			return;
		}
		let c = z(t, null), l = null;
		a && (l = {
			container: a,
			index: B(t, a)
		});
		let u = t.destination;
		u?.container === l?.container && u?.index === l?.index ? c && (e.onDragUpdate?.(ge(t)), y(t)) : (t.destination = l, H(t, u?.container ?? null), t.overlay.ownerDocument.documentElement.toggleAttribute("data-drag-outside", !l), e.onDragUpdate?.(ge(t)), y(t));
	}
	function I(t, n) {
		let r = t.destination ?? {
			container: t.home,
			index: t.sourceIndex
		}, i = r.container.registration.axis === "vertical" ? n.y : n.x, a = null;
		if (i !== 0) {
			let e = r.index + i;
			e >= 0 && e <= r.container.slots.length && (a = {
				container: r.container,
				index: e
			});
		} else {
			let e = ie(t, r.container, n);
			e && (a = {
				container: e,
				index: L(t, e)
			});
		}
		if (!a) return;
		let o = t.destination?.container ?? null;
		t.destination = a, H(t, o), ae(t, !0), R(t), e.onDragUpdate?.(ge(t)), y(t);
	}
	function ie(e, t, n) {
		let r = co(P(e, t)), i = null, a = Infinity;
		for (let o of e.containers) {
			if (o === t || o.registration.isDropDisabled()) continue;
			let s = co(P(e, o)), c = (s.x - r.x) * n.x + (s.y - r.y) * n.y;
			if (c <= 1) continue;
			let l = c + (Math.abs((s.x - r.x) * n.y) + Math.abs((s.y - r.y) * n.x)) * 2;
			l < a && (i = o, a = l);
		}
		return i;
	}
	function L(e, t) {
		let n = t.registration.axis === "vertical", r = N(e, t), i = vo(e.preview.style.transform), a = n ? e.liftBox.top + i.y + e.liftBox.height / 2 : e.liftBox.left + i.x + e.liftBox.width / 2;
		return t.slots.filter((i) => V(e, t, i) - (n ? r.y : r.x) + (n ? i.box.height : i.box.width) / 2 < a).length;
	}
	function ae(e, n) {
		let r = U(e), { duration: i, easing: a } = t.outOfTheWay;
		e.preview.style.transition = n && !d ? `transform ${i}ms ${a}` : "none", e.preview.style.transform = po(r.x, r.y, e.previewScale);
	}
	function R(e) {
		let n = e.overlay.ownerDocument.defaultView;
		if (!n) return;
		let r = U(e), i = {
			left: e.liftBox.left + r.x,
			top: e.liftBox.top + r.y,
			width: e.liftBox.width,
			height: e.liftBox.height
		}, a = t.autoScrollEdge, o = e.destination?.container.scroller, s = (e) => ({
			x: Math.min(0, i.left - a - e.left) + Math.max(0, i.left + i.width + a - e.left - e.width),
			y: Math.min(0, i.top - a - e.top) + Math.max(0, i.top + i.height + a - e.top - e.height)
		});
		if (o?.element) {
			let e = s(o.box);
			(e.x || e.y) && o.element.scrollBy(e.x, e.y);
		}
		let c = s({
			left: 0,
			top: 0,
			width: n.innerWidth,
			height: n.innerHeight
		});
		(c.x || c.y) && n.scrollBy(c.x, c.y), ae(e, !0);
	}
	function oe(e, t) {
		let n = t.registration.axis === "vertical", r = n ? e.liftBox.top : e.liftBox.left, i = n ? e.liftBox.height : e.liftBox.width, a = n ? e.lockAxis === "x" ? 0 : e.lastY - e.startY : e.lockAxis === "y" ? 0 : e.lastX - e.startX;
		return {
			start: r + a,
			end: r + a + i
		};
	}
	function se(e, t) {
		let n = e.destination;
		if (!n || n.container !== t || !t.registration.isCombineEnabled()) return null;
		let r = t.registration.axis === "vertical", i = r ? N(e, t).y : N(e, t).x, a = oe(e, t);
		return t.slots.find((o, s) => {
			let c = r ? o.box.height : o.box.width, l = s >= n.index, u = V(e, t, o) - i + (l ? t.room : 0), d = c / 4, f = l ? a.end : a.start;
			return f > u + d && f < u + c - d;
		}) ?? null;
	}
	function z(e, t) {
		return e.combine?.slot !== t?.slot && (e.combine?.slot.item.element.removeAttribute("data-drag-combine"), t?.slot.item.element.setAttribute("data-drag-combine", ""), e.combine = t, !0);
	}
	function B(e, t) {
		let n = t.registration.axis === "vertical", r = N(e, t), { start: i, end: a } = oe(e, t), o = n ? r.y : r.x, s = t.slots.map((r) => V(e, t, r) - o + (n ? r.box.height : r.box.width) / 2), c = s.length;
		if (e.destination?.container !== t) {
			let e = (i + a) / 2;
			return s.filter((t) => t < e).length;
		}
		let l = e.destination.index;
		for (; l > 0 && i < s[l - 1];) l--;
		if (l !== e.destination.index) return l;
		for (; l < c && a > s[l] + t.room;) l++;
		return l;
	}
	function V(e, t, n) {
		let r = t.registration.axis === "vertical" ? n.box.top : n.box.left;
		return t.isHome && n.original > e.sourceIndex ? r - t.room : r;
	}
	function H(e, t) {
		let n = e.destination, r = /* @__PURE__ */ new Set([e.home]);
		t && r.add(t), n && r.add(n.container);
		for (let t of r) t.slots.forEach((r, i) => {
			let a = 0;
			t.isHome && r.original > e.sourceIndex && (a -= t.room), n?.container === t && i >= n.index && (a += t.room), ce(e, r.item.element, a / t.scale, t.registration.axis);
		});
		let i = n && !n.container.isHome ? n.container : null;
		e.reserved !== i && (e.reserved?.registration.element.style.removeProperty("--drag-reserve"), e.reserved?.registration.element.removeAttribute("data-drag-over"), i && !i.registration.still && i.registration.element.style.setProperty("--drag-reserve", `${i.room}px`), e.reserved = i);
		for (let t of e.containers) n?.container === t ? t.registration.element.setAttribute("data-drag-over", "") : t.registration.element.removeAttribute("data-drag-over");
	}
	function ce(e, n, r, i) {
		let a = e.shifts.get(n);
		if ((a?.value ?? 0) !== r) {
			if (a) a.value = r;
			else {
				e.shifts.set(n, {
					value: r,
					translate: n.style.translate,
					transition: n.style.transition
				});
				let { duration: i, easing: a } = t.outOfTheWay;
				n.style.transition = d ? "none" : `translate ${i}ms ${a}`;
			}
			n.style.translate = r === 0 ? "none" : i === "vertical" ? `0 ${r}px` : `${r}px 0`, n.style.setProperty("--drag-shift", `${r}px`);
		}
	}
	function le(e) {
		if (e.scrollFrame !== null) return;
		let t = e.overlay.ownerDocument.defaultView;
		if (!t) return;
		let n = () => {
			c !== e || e.dropping || (e.scrollFrame = null, ue(e) && (F(e), e.scrollFrame = t.requestAnimationFrame(n)));
		};
		de(e, e.destination?.container.scroller ?? null, t) && (e.scrollFrame = t.requestAnimationFrame(n));
	}
	function ue(e) {
		let t = e.overlay.ownerDocument.defaultView;
		if (!t) return !1;
		let n = e.destination?.container.scroller ?? null, r = de(e, n, t);
		if (!r) return !1;
		if (n?.element) {
			let e = {
				left: n.element.scrollLeft,
				top: n.element.scrollTop
			};
			if (n.element.scrollBy(r.x, r.y), n.element.scrollLeft !== e.left || n.element.scrollTop !== e.top) return !0;
		}
		let i = de(e, null, t);
		if (!i) return !1;
		let a = {
			x: t.scrollX,
			y: t.scrollY
		};
		return t.scrollBy(i.x, i.y), t.scrollX !== a.x || t.scrollY !== a.y;
	}
	function de(e, n, r) {
		let i = n?.element ? n.box : {
			left: 0,
			top: 0,
			width: r.innerWidth,
			height: r.innerHeight
		}, a = t.autoScrollEdge, o = (e, t, n) => {
			let r = e - t, i = t + n - e;
			return r < a ? -24 * ((a - Math.max(r, 0)) / a) ** 2 : i < a ? eo * ((a - Math.max(i, 0)) / a) ** 2 : 0;
		}, s = o(e.lastX, i.left, i.width), c = o(e.lastY, i.top, i.height);
		return s || c ? {
			x: s,
			y: c
		} : null;
	}
	async function fe(n) {
		let r = c;
		if (!r || r.dropping) return;
		if (r.dropping = !0, r.scrollFrame !== null && cancelAnimationFrame(r.scrollFrame), r.impactFrame !== null && cancelAnimationFrame(r.impactFrame), n === "DROP" && r.combine) {
			let { container: e, slot: i } = r.combine, a = {
				...he(r),
				destination: null,
				combine: _e(r),
				reason: n
			}, o = e.registration.axis === "vertical", s = N(r, e), c = e.slots.indexOf(i), l = V(r, e, i) + (r.destination && c >= r.destination.index ? e.room : 0), u = (o ? i.box.left : l) - s.x - r.liftBox.left, f = (o ? l : i.box.top) - s.y - r.liftBox.top, { maxDuration: p, easing: m } = t.drop;
			if (d) {
				pe(r, a);
				return;
			}
			r.preview.style.transition = `transform ${p}ms ${m}, opacity ${p}ms ${m}`, r.preview.style.transform = po(u, f, r.previewScale * .75), r.preview.style.opacity = "0";
			let h = !1, g = () => {
				h || (h = !0, pe(r, a));
			};
			r.preview.addEventListener("transitionend", g, { once: !0 }), setTimeout(g, p + 50);
			return;
		}
		if (z(r, null), n === "DROP" && !r.destination && r.mode === "FLUID" && e.onDropOutside?.(he(r), {
			x: r.lastX,
			y: r.lastY
		})) {
			pe(r, {
				...he(r),
				destination: null,
				combine: null,
				reason: "DROP"
			});
			return;
		}
		let i = n === "CANCEL" || !r.destination;
		if (i) {
			let e = r.destination?.container ?? null;
			r.destination = {
				container: r.home,
				index: r.sourceIndex
			}, H(r, e);
		}
		let a = null;
		if (n === "DROP" && e.prepareDrop) {
			r.preparing = !0;
			let o = [...r.shifts.keys()].filter((e) => e.isConnected), s = new Map(o.map((e) => [e, e.getBoundingClientRect()]));
			for (let [e, t] of r.shifts) e.style.transition = "none", e.style.translate = t.translate;
			let l = e.prepareDrop({
				...he(r),
				destination: i ? null : ye(r.destination),
				combine: null,
				reason: n
			}), u = l instanceof Promise ? await l : l, f = typeof u == "function" ? u : () => u;
			if (a = f(), c !== r || (a?.isConnected && (r.landing = {
				element: a,
				visibility: a.style.visibility
			}, a.style.visibility = "hidden"), await new Promise((e) => requestAnimationFrame(() => e())), c !== r)) return;
			let p = f();
			if (p !== a && (r.landing && (r.landing.element.style.visibility = r.landing.visibility), a = p, a?.isConnected && (r.landing = {
				element: a,
				visibility: a.style.visibility
			}, a.style.visibility = "hidden")), !d) for (let e of o) {
				if (!e.isConnected || e === a) continue;
				let n = s.get(e), r = e.getBoundingClientRect(), i = n.left - r.left, o = n.top - r.top;
				(i || o) && e.animate([{ translate: `${i}px ${o}px` }, { translate: getComputedStyle(e).translate }], {
					duration: t.outOfTheWay.duration,
					easing: t.outOfTheWay.easing
				});
			}
		}
		let o = a?.isConnected ? a.getBoundingClientRect() : null, s = o ? {
			x: o.left - r.liftBox.left,
			y: o.top - r.liftBox.top
		} : U(r), l = vo(r.preview.style.transform), u = Math.hypot(s.x - l.x, s.y - l.y), { minDuration: f, maxDuration: p, easing: m } = t.drop, h = !i && !!r.destination?.container.registration.still, g = u < .5 || d || h ? 0 : f + (p - f) * Math.min(u / $a, 1), _ = {
			...he(r),
			destination: i || !r.destination ? null : ye(r.destination),
			combine: null,
			reason: n
		};
		if (g === 0) {
			pe(r, _);
			return;
		}
		r.preview.style.transition = `transform ${g}ms ${m}`, r.preview.style.transform = po(s.x, s.y, r.previewScale);
		let v = !1, y = () => {
			v || (v = !0, pe(r, _));
		};
		r.preview.addEventListener("transitionend", y, { once: !0 }), setTimeout(y, g + 50);
	}
	function U(e) {
		let t = e.destination ?? {
			container: e.home,
			index: e.sourceIndex
		}, n = t.container, r = n.registration.axis === "vertical", i = N(e, n), a = n.slots, o, s = n.registration.still, c = s ? W(n, t.index) : void 0;
		if (n.isHome && t.index === e.sourceIndex) o = r ? e.liftBox.top : e.liftBox.left;
		else if (c) o = r ? c.box.top : c.box.left;
		else if (s && a.length > 0) {
			let e = a[a.length - 1];
			o = (r ? e.box.top + e.box.height : e.box.left + e.box.width) + n.gap;
		} else if (t.index < a.length) o = V(e, n, a[t.index]);
		else if (a.length > 0) {
			let t = a[a.length - 1], i = r ? e.liftBox.height : e.liftBox.width;
			o = V(e, n, t) + (r ? t.box.height : t.box.width) + n.room - i;
		} else o = (r ? n.box.top : n.box.left) + n.paddingStart + n.marginStart;
		let l = r ? e.liftBox.left - e.home.box.left : e.liftBox.top - e.home.box.top, u = n.isHome ? r ? e.liftBox.left : e.liftBox.top : (r ? n.box.left : n.box.top) + l, d = o - (r ? i.y : i.x), f = u - (r ? i.x : i.y);
		return {
			x: (r ? f : d) - e.liftBox.left,
			y: (r ? d : f) - e.liftBox.top
		};
	}
	function W(e, t) {
		return e.isHome ? e.slots.find((e) => e.original === t) : e.slots[t];
	}
	function pe(t, r) {
		let i = v(t);
		try {
			e.onDragEnd?.(r);
		} finally {
			me(t);
		}
		if (r.combine && t.combine ? _(n.combined(t.item.label(), t.combine.slot.item.label())) : i && _(r.reason === "DROP" && r.destination ? n.dropped(i) : n.returned(i)), t.mode === "SNAP") {
			for (let e of a.values()) if (e.id === t.item.id && e.element.isConnected) {
				e.handle.focus({ preventScroll: !0 });
				break;
			}
		}
	}
	function me(e) {
		let t = e.item.element, n = e.overlay.ownerDocument.defaultView ?? window;
		for (let [t, n] of e.shifts) t.style.transition = "none", t.style.translate = n.translate, t.style.removeProperty("--drag-shift");
		let r = [...e.shifts];
		n.requestAnimationFrame(() => {
			n.requestAnimationFrame(() => {
				for (let [e, t] of r) e.style.transition = t.transition;
			});
		}), e.landing && (e.landing.element.style.visibility = e.landing.visibility), t.style.visibility = e.sourceVisibility, t.removeAttribute("data-drag-source"), e.combine?.slot.item.element.removeAttribute("data-drag-combine"), e.reserved?.registration.element.style.removeProperty("--drag-reserve");
		for (let t of e.containers) t.registration.element.removeAttribute("data-drag-over");
		e.overlay.remove(), t.ownerDocument.documentElement.removeAttribute("data-drag-active"), t.ownerDocument.documentElement.removeAttribute("data-drag-outside"), c = null, A();
	}
	function G(e) {
		let t = e.element.parentElement;
		for (; t;) {
			let n = i.get(t);
			if (n && n.type === e.type) return n;
			t = t.parentElement;
		}
		return null;
	}
	function K(e) {
		let t = [];
		for (let n of a.values()) n.type === e.type && n.element.isConnected && G(n) === e && t.push(n);
		return t.sort((e, t) => e.element.compareDocumentPosition(t.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
	}
	function he(e) {
		return {
			draggableId: e.item.id,
			type: e.item.type,
			source: {
				droppableId: e.home.registration.id,
				index: e.sourceIndex
			},
			mode: e.mode
		};
	}
	function ge(e) {
		return {
			...he(e),
			destination: e.destination && !e.combine ? ye(e.destination) : null,
			combine: _e(e)
		};
	}
	function _e(e) {
		return e.combine ? {
			draggableId: e.combine.slot.item.id,
			droppableId: e.combine.container.registration.id
		} : null;
	}
	function ve(e) {
		if (e.element.isConnected && a.get(e.element) === e) return e;
		for (let t of a.values()) if (t.id === e.id && t.type === e.type && t.element.isConnected) return t;
		return null;
	}
	function ye(e) {
		return {
			droppableId: e.container.registration.id,
			index: e.index
		};
	}
	return {
		container: m,
		item: h,
		isDragging: () => c !== null,
		cancel: () => {
			j(), c && !c.dropping && fe("CANCEL");
		},
		destroy: () => {
			u = !0, j(), c && !c.preparing && me(c), window.removeEventListener("pointerdown", S, !0), window.removeEventListener("keydown", b, !0), f?.remove(), p?.remove(), l = !1, i.clear(), a.clear(), o.clear();
		}
	};
}
var oo = 0, so = {
	ArrowUp: {
		x: 0,
		y: -1
	},
	ArrowDown: {
		x: 0,
		y: 1
	},
	ArrowLeft: {
		x: -1,
		y: 0
	},
	ArrowRight: {
		x: 1,
		y: 0
	}
};
function co(e) {
	return {
		x: e.left + e.width / 2,
		y: e.top + e.height / 2
	};
}
function lo(e, t) {
	let n = e.createElement("div");
	return n.id = t, Object.assign(n.style, {
		position: "absolute",
		width: "1px",
		height: "1px",
		margin: "-1px",
		padding: "0",
		overflow: "hidden",
		clip: "rect(0 0 0 0)",
		whiteSpace: "nowrap",
		border: "0"
	}), e.body.appendChild(n), n;
}
function uo(e, t) {
	let n = e.getAttribute("aria-label") ?? t.getAttribute("aria-label") ?? e.textContent?.replace(/\s+/g, " ").trim() ?? "";
	return n.length > 60 ? `${n.slice(0, 59)}…` : n || "Item";
}
function fo(e, t) {
	if (e.offsetWidth <= 0 || t.width <= 0) return 1;
	let n = t.width / e.offsetWidth;
	return Math.abs(n - 1) < .02 ? 1 : n;
}
function po(e, t, n) {
	return `translate3d(${e}px, ${t}px, 0)${n === 1 ? "" : ` scale(${n})`}`;
}
function mo(e) {
	let t = e.getBoundingClientRect();
	return {
		left: t.left,
		top: t.top,
		width: t.width,
		height: t.height
	};
}
function ho(e, t) {
	let n = Math.max(e.left, t.left), r = Math.max(e.top, t.top), i = Math.min(e.left + e.width, t.left + t.width), a = Math.min(e.top + e.height, t.top + t.height);
	return {
		left: n,
		top: r,
		width: Math.max(0, i - n),
		height: Math.max(0, a - r)
	};
}
function go(e, t, n) {
	return t >= e.left && t < e.left + e.width && n >= e.top && n < e.top + e.height;
}
function _o(e) {
	let t = Number.parseFloat(e);
	return Number.isFinite(t) ? t : 0;
}
function vo(e) {
	let t = /translate3d\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px/.exec(e);
	return t ? {
		x: Number(t[1]),
		y: Number(t[2])
	} : {
		x: 0,
		y: 0
	};
}
function yo(e) {
	let t = e.ownerDocument.defaultView, n = e.parentElement;
	for (; n && n !== e.ownerDocument.body && n !== e.ownerDocument.documentElement;) {
		let e = t?.getComputedStyle(n), r = (e) => e === "auto" || e === "scroll" || e === "overlay";
		if (e && (r(e.overflowY) || r(e.overflowX))) return n;
		n = n.parentElement;
	}
	return null;
}
function bo(e) {
	let t = e.cloneNode(!0);
	t.removeAttribute("id"), t.removeAttribute("data-drag-source"), t.style.visibility = "visible";
	for (let e of t.querySelectorAll("[id]")) e.removeAttribute("id");
	for (let e of t.querySelectorAll("[data-drag-handle]")) e.removeAttribute("data-drag-handle");
	return t.removeAttribute("data-drag-handle"), t;
}
var xo = 8, So = "button, input, textarea, select, video, audio, .aa-caption, [data-aa-interactive]", Co = (e, t) => {
	let n = e?.closest(So);
	return !!n && t.contains(n);
}, wo = [
	"--aa-unit",
	"--aa-sf",
	"--aa-rule-color",
	"--aa-gap",
	"--aa-indent"
];
function To(e, t, n) {
	let r = e.element, i = document.createElement("div");
	i.className = "aa-drop-line", i.hidden = !0, n.append(i);
	let a = document.createElement("div");
	a.className = "aa-drop-line aa-drop-side", a.hidden = !0, n.append(a);
	let o = null, s = null, c = () => Array.from(r.children), l = () => !e.readOnly && t.menus !== !1 && (e.reordering || e.placing), u = () => l() && e.placing;
	r.toggleAttribute("data-movable", l());
	let d = null, f = null, p = (e, t) => {
		let n = window.getSelection();
		return !n?.rangeCount || n.isCollapsed ? !1 : Array.from(n.getRangeAt(0).getClientRects()).some((n) => e >= n.left && e <= n.right && t >= n.top && t <= n.bottom);
	}, m = (e, t) => {
		let n = document.caretPositionFromPoint?.(e, t);
		if (n) return {
			node: n.offsetNode,
			offset: n.offset
		};
		let r = document.caretRangeFromPoint?.(e, t);
		return r ? {
			node: r.startContainer,
			offset: r.startOffset
		} : null;
	}, h = (e, t) => {
		let n = m(e, t), i = (n?.node instanceof Element ? n.node : n?.node.parentElement)?.closest(".aa-block");
		n && i && i.parentElement === r && (i.focus({ preventScroll: !0 }), window.getSelection()?.collapse(n.node, n.offset));
	}, g = () => {
		f && window.getSelection()?.rangeCount && window.getSelection().removeAllRanges();
	}, _ = [], v = {
		x: 0,
		y: 0
	}, y = !1, b = ao({
		inheritProperties: wo,
		renderPreview: (e) => {
			let t = e.cloneNode(!0);
			return t.removeAttribute("contenteditable"), t.removeAttribute("data-selected"), t.setAttribute("data-lifted", ""), t;
		},
		onDragStart: (t) => {
			let n = c()[t.source.index], i = d?.selected ?? [], a = n && i.includes(n) ? i : [];
			_ = c().map((e) => e.getBoundingClientRect()), v = {
				x: window.scrollX,
				y: window.scrollY
			}, f = {
				caret: a.length ? null : e.selection(),
				group: a,
				from: t.source.index
			}, document.addEventListener("pointermove", S, !0);
			for (let e of a) e !== n && e.setAttribute("data-ghost", "");
			r.setAttribute("data-dragging", ""), document.addEventListener("selectionchange", g), g();
		},
		prepareDrop: (e) => {
			y = !0;
			let t = c()[e.source.index], n = t?.textContent, i = t?.querySelector(":scope > .aa-atom")?.dataset.source, a = r;
			for (let e = r.parentElement; e; e = e.parentElement) e.classList.contains("aa") && (a = e);
			let l = new Set(a.querySelectorAll(".aa-block")), u = s && { ...s }, d = o && { ...o }, f = r.parentElement?.classList.contains("aa-columns") ? r.parentElement : null, p = f ? Array.from(a.querySelectorAll(".aa-columns")).indexOf(f) : -1, m = e.source.index, h = d ? d.index - +(m < d.index) : -1;
			return x(e), () => {
				if (u) {
					let e = f?.isConnected ? f : a.querySelectorAll(".aa-columns")[p], t = "swap" in u ? u.swap : u.slot, n = (e?.querySelectorAll(":scope > .aa-column")[t])?.querySelector(":scope > .aa-block");
					if (n) return n;
				}
				if (d) {
					let e = (r.isConnected ? r : a).querySelectorAll(":scope > .aa-block")[h]?.querySelectorAll(":scope > .aa-atom.aa-columns > .aa-column"), t = (e?.[d.at === "start" ? 0 : e.length - 1])?.querySelector(":scope > .aa-block");
					if (t) return t;
				}
				if (t?.isConnected && a.contains(t)) return t;
				let e = Array.from(a.querySelectorAll(".aa-block")).filter((e) => i === void 0 ? !e.querySelector(".aa-block") && e.textContent === n : e.querySelector(":scope > .aa-atom")?.dataset.source === i);
				return e.find((e) => !l.has(e)) ?? e[0] ?? null;
			};
		},
		onDragEnd: (e) => {
			y || x(e), y = !1;
		}
	});
	function x(t) {
		let { caret: n, group: i } = f ?? {
			caret: null,
			group: []
		};
		f = null, _ = [], document.removeEventListener("pointermove", S, !0);
		let d = o, p = s;
		o = null, s = null, a.hidden = !0, a.removeAttribute("data-swap");
		for (let e of r.querySelectorAll(":scope > [data-ghost]")) e.removeAttribute("data-ghost");
		r.removeAttribute("data-dragging"), document.removeEventListener("selectionchange", g);
		let m = c(), h = t.source.index, v = t.destination?.index;
		if (!(t.reason === "DROP" && d && i.length <= 1 && u() && T(h, d.index, d.at))) {
			if (t.reason === "DROP" && p && i.length <= 1 && u()) r.dispatchEvent(new CustomEvent("aa-column-carry", {
				bubbles: !0,
				detail: {
					from: h,
					...p
				}
			}));
			else {
				if (t.reason === "DROP" && v !== void 0 && l() && e.reordering) {
					if (i.length > 1) {
						let t = m.indexOf(i[0]), n = i.length, r = m.filter((e, t) => t !== h).slice(0, v).filter((e) => !i.includes(e)).length;
						if (r !== t) {
							e.moveBlock(t, r, n);
							return;
						}
						e.selectBlocks(t, t + n - 1);
						return;
					}
					if (v !== h) {
						e.moveBlock(h, v);
						return;
					}
				}
				n ? e.selectRange(n.start, n.end) : i.length && e.selectBlocks(m.indexOf(i[0]), m.indexOf(i[i.length - 1]));
			}
		}
	}
	b.container({
		element: r,
		id: "aa",
		type: "aa-block",
		isDropDisabled: () => !l()
	});
	function S(e) {
		if (!f || f.group.length > 1 || !u() || C(e)) return;
		let t = parseFloat(getComputedStyle(r).getPropertyValue("--aa-unit")) || 20, n = window.scrollX - v.x, i = window.scrollY - v.y, s = e.clientX + n, c = e.clientY + i, l = _.findIndex((e, n) => n !== f.from && c >= e.top && c <= e.bottom && s >= e.left - t && s <= e.right + t), d = _[l], p = d ? new DOMRect(d.left - n, d.top - i, d.width, d.height) : null, m = p ? Math.min(p.width / 5, 4 * t) : 0, h = p ? e.clientX < p.left + m ? "start" : e.clientX > p.right - m ? "end" : null : null;
		!h || !p ? (o = null, a.hidden = !0) : (a.removeAttribute("data-swap"), o = {
			index: l,
			at: h
		}, a.style.left = `${h === "start" ? p.left : p.right}px`, a.style.top = `${p.top}px`, a.style.height = `${p.height}px`, a.style.width = "", a.hidden = !1);
	}
	function C(e) {
		s = null;
		let t = r.parentElement;
		if (!r.classList.contains("aa-column") || !t?.classList.contains("aa-columns")) return !1;
		let n = parseFloat(getComputedStyle(r).getPropertyValue("--aa-unit")) || 20, i = t.getBoundingClientRect();
		if (e.clientY < i.top - n || e.clientY > i.bottom + n) return !1;
		let c = r.getBoundingClientRect();
		if (e.clientX >= c.left && e.clientX <= c.right) return !1;
		let l = Array.from(t.children).filter((e) => e.classList.contains("aa-column")), u = l.indexOf(r), d = r.querySelectorAll(":scope > .aa-block").length <= 1, f = d ? l.filter((e) => e !== r) : l;
		a.removeAttribute("data-swap");
		let p = d ? l.findIndex((t) => {
			let n = t.getBoundingClientRect();
			return t !== r && e.clientX >= n.left && e.clientX <= n.right;
		}) : -1;
		if (p >= 0) {
			let e = (l[p].querySelector(":scope > .aa-block") ?? l[p]).getBoundingClientRect();
			return s = { swap: p }, o = null, a.setAttribute("data-swap", ""), a.style.left = `${e.left}px`, a.style.top = `${e.top}px`, a.style.height = `${e.height}px`, a.style.width = `${e.width}px`, a.hidden = !1, !0;
		}
		let m = f.map((e) => e.getBoundingClientRect()), h = m.filter((t) => t.left + t.width / 2 < e.clientX).length;
		if (a.hidden = !0, d && h === u) return !0;
		s = { slot: h };
		let g = m.length > 1 ? m[1].left - m[0].right : 2 * n, _ = h === 0 ? m[0].left - g / 2 : h === m.length ? m[m.length - 1].right + g / 2 : (m[h - 1].right + m[h].left) / 2;
		return o = null, a.style.left = `${_}px`, a.style.top = `${i.top}px`, a.style.height = `${i.height}px`, a.style.width = "", a.hidden = !1, !0;
	}
	function w(t) {
		let n = Mi(e.value)[c().indexOf(t)];
		return !!n && /^(?:!\[[^\]\n]*\]\([^)\n]*\)\s*)+$/.test(n.source.trim());
	}
	function T(t, n, r) {
		if (Mi(e.value).length !== c().length) return !1;
		let i = ki(e.value, t, n, r);
		return i ? (e.replace(i.start, i.end, i.text), !0) : !1;
	}
	let E = (e) => {
		let t = e.target instanceof Element ? e.target : null, n = t?.closest?.(".aa-block"), i = !!n && ne === n;
		if (M(), !n || n.parentElement !== r) {
			d = null;
			return;
		}
		O();
		let a = c().filter((e) => e.hasAttribute("data-selected")), o = a.includes(n) ? a : [];
		d = {
			block: n,
			mouse: e.pointerType === "mouse" && e.button === 0,
			plain: !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey,
			own: Co(t, n),
			inSelection: p(e.clientX, e.clientY),
			selected: o,
			grabbed: i,
			x: e.clientX,
			y: e.clientY
		}, (o.length || i || w(n)) && d.mouse && d.plain && !d.own && !d.inSelection && l() && e.preventDefault();
	};
	window.addEventListener("pointerdown", E, !0);
	let D = 0, ee = /* @__PURE__ */ new Map();
	function O() {
		for (let [e, t] of ee) e.parentElement !== r && (t(), ee.delete(e));
		for (let e of c()) !ee.has(e) && e.classList.contains("aa-block") && ee.set(e, b.item({
			element: e,
			id: `aa-block-${++D}`,
			type: "aa-block",
			text: {
				hold: () => d?.block === e && (d.selected.length || d.grabbed || w(e)) ? 0 : 400,
				axis: "y"
			},
			canDrag: ({ input: t }) => t === "mouse" && l() && !!d && d.block === e && d.mouse && d.plain && !d.own && !d.inSelection
		}));
	}
	O();
	let k = new MutationObserver(O);
	k.observe(r, { childList: !0 });
	let te = (e) => {
		e.detail > 1 && !b.isDragging() && b.cancel();
	}, A = (e) => {
		let t = d;
		d = null, !(!(t?.selected.length || t?.grabbed) || t.inSelection || b.isDragging() || f || !l() || e.type !== "pointerup") && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 5 && h(e.clientX, e.clientY);
	};
	r.addEventListener("mousedown", te, !0), window.addEventListener("pointerup", A, !0), window.addEventListener("pointercancel", A, !0);
	let j = null, ne = null;
	function M() {
		j && clearTimeout(j.timer), j = null, ne?.removeAttribute("data-grab"), ne = null;
	}
	let re = (e) => {
		if (e.pointerType !== "mouse" || e.buttons || b.isDragging() || !l()) {
			M();
			return;
		}
		let t = e.target instanceof Element ? e.target : null, n = t?.closest?.(".aa-block");
		if (!n || n.parentElement !== r || Co(t, n)) {
			M();
			return;
		}
		if (j?.block === n && Math.hypot(e.clientX - j.x, e.clientY - j.y) < xo) return;
		M();
		let i = setTimeout(() => {
			j?.block === n && l() && (ne = n, n.setAttribute("data-grab", ""));
		}, 400);
		j = {
			block: n,
			x: e.clientX,
			y: e.clientY,
			timer: i
		};
	};
	r.addEventListener("pointermove", re), r.addEventListener("pointerleave", M), r.addEventListener("keydown", M);
	let N = (e) => {
		let t = c().findIndex((t) => {
			let n = t.getBoundingClientRect();
			return e < n.top + n.height / 2;
		});
		return t < 0 ? r.children.length : t;
	}, P = (e) => {
		let t = c(), n = t[e], r = t[e - 1];
		if (e < 0 || !n && !r) {
			i.hidden = !0;
			return;
		}
		let a = (n ?? r).getBoundingClientRect(), o = n && r ? (r.getBoundingClientRect().bottom + a.top) / 2 : n ? a.top : a.bottom;
		i.style.left = `${a.left}px`, i.style.top = `${o}px`, i.style.width = `${a.width}px`, i.hidden = !1;
	}, F = -1, I = (n) => !e.readOnly && e.placing && !!t.onFiles && Array.from(n.dataTransfer?.types ?? []).includes("Files"), ie = (e) => {
		I(e) && (e.preventDefault(), F = N(e.clientY), P(F));
	}, L = (e) => {
		r.contains(e.relatedTarget) || (i.hidden = !0, F = -1);
	}, ae = (e) => {
		i.hidden = !0;
		let n = F;
		if (F = -1, n < 0 || !I(e) || !e.dataTransfer?.files.length) return;
		e.preventDefault(), e.stopImmediatePropagation();
		let r = c(), a = r[n] ?? r[r.length - 1];
		a.focus({ preventScroll: !0 }), window.getSelection()?.collapse(a, r[n] ? 0 : a.childNodes.length), t.onFiles(Array.from(e.dataTransfer.files));
	}, R = () => {
		b.cancel(), d = null, M(), o = null, s = null, a.hidden = !0, i.hidden = !0, F = -1, r.toggleAttribute("data-movable", l());
	};
	return r.addEventListener("aa-movement-change", R), r.addEventListener("dragover", ie), r.addEventListener("dragleave", L), r.addEventListener("drop", ae, !0), () => {
		k.disconnect(), b.destroy(), ee.clear(), f = null, d = null, document.removeEventListener("selectionchange", g), i.remove(), a.remove(), document.removeEventListener("pointermove", S, !0), r.removeAttribute("data-movable"), r.removeAttribute("data-dragging"), window.removeEventListener("pointerdown", E, !0), r.removeEventListener("mousedown", te, !0), window.removeEventListener("pointerup", A, !0), window.removeEventListener("pointercancel", A, !0), M(), r.removeEventListener("pointermove", re), r.removeEventListener("pointerleave", M), r.removeEventListener("keydown", M), r.removeEventListener("aa-movement-change", R), r.removeEventListener("dragover", ie), r.removeEventListener("dragleave", L), r.removeEventListener("drop", ae, !0);
	};
}
//#endregion
//#region src/ds1/0-face/overlay-swipe.ts
var Eo = 10, Do = .998, Oo = (e) => e / 1e3 * Do / .0020000000000000018, ko = (e, t, n = .55) => e * t * n / (t + n * Math.abs(e)), Ao = /* @__PURE__ */ new Set([
	"none",
	"bottom",
	"end",
	"start"
]);
function jo(e) {
	let t = e.getAttribute("data-ds-edge");
	return t && Ao.has(t) ? t : e.classList.contains("ds-overlay--sheet") ? "bottom" : e.classList.contains("ds-overlay--drawer") ? e.classList.contains("ds-overlay--start") ? "start" : "end" : "none";
}
function Mo(e, t) {
	if (t === "bottom" || t === "none") return {
		axis: "y",
		sign: 1
	};
	let n = e.ownerDocument.defaultView?.getComputedStyle(e).direction === "rtl";
	return {
		axis: "x",
		sign: t === "end" === n ? -1 : 1
	};
}
function No(e, t, n, r) {
	let i = t.ownerDocument.defaultView;
	for (let a of e) {
		if (!(a instanceof Element)) continue;
		let e = i?.getComputedStyle(a);
		if (n === "y") {
			if (/auto|scroll/.test(e?.overflowY ?? "") && a.scrollHeight > a.clientHeight && (r > 0 ? a.scrollTop > 0 : a.scrollTop + a.clientHeight < a.scrollHeight - 1)) return !0;
		} else if (/auto|scroll/.test(e?.overflowX ?? "") && a.scrollWidth > a.clientWidth) return !0;
		if (a === t) break;
	}
	return !1;
}
function Po(e, t, n) {
	let r = e.ownerDocument.defaultView?.getComputedStyle(e).transform;
	if (!r || r === "none" || typeof DOMMatrixReadOnly > "u") return 0;
	try {
		let e = new DOMMatrixReadOnly(r);
		return n * (t === "y" ? e.m42 : e.m41);
	} catch {
		return 0;
	}
}
function Fo(e, t = {}) {
	let n = () => (typeof t.edge == "function" ? t.edge() : t.edge) ?? jo(e), r = null, i = 0, a = e.ownerDocument.defaultView, o = (e) => a?.requestAnimationFrame ? a.requestAnimationFrame(e) : a?.setTimeout(e, 16) ?? 0, s = (t, n, r) => {
		e.style.setProperty("--ds-overlay-drag", `${r * t}px`), e.style.setProperty("--ds-overlay-progress", String(n > 0 ? Math.min(1, Math.max(0, t / n)) : 0));
	}, c = () => {
		e.style.removeProperty("--ds-overlay-drag"), e.style.removeProperty("--ds-overlay-progress"), e.removeAttribute("data-ds-overlay-dragging");
	}, l = () => {
		e.removeAttribute("data-ds-overlay-dragging"), e.style.setProperty("--ds-overlay-drag", "0px"), e.style.setProperty("--ds-overlay-progress", "0");
	}, u = () => {
		if (e.removeAttribute("data-ds-overlay-dragging"), t.onDismiss) t.onDismiss(e);
		else {
			let t = new CustomEvent("ds-close-request", {
				detail: { reason: "swipe" },
				bubbles: !0,
				composed: !0,
				cancelable: !0
			});
			e.dispatchEvent(t) && e.close();
		}
		let n = ++i;
		o(() => o(() => {
			n === i && e.open && l();
		}));
	}, d = (t) => {
		let i = n();
		if (!e.open || i === "none") return;
		if (t.touches.length !== 1) {
			r?.mode === "drag" && l(), r = null;
			return;
		}
		let a = t.composedPath();
		if (a.some((e) => e instanceof Element && e.matches("[data-ds-overlay-no-swipe], input[type=\"range\"], [role=\"slider\"]"))) return;
		let o = t.touches[0], { axis: s, sign: c } = Mo(e, i);
		r = {
			id: o.identifier,
			x: o.clientX,
			y: o.clientY,
			base: Math.max(0, Po(e, s, c)),
			start: 0,
			mode: "pending",
			offset: 0,
			samples: [],
			target: t.target,
			path: a
		};
	}, f = (t) => {
		if (!r || r.mode === "ignore") return;
		let o = [...t.touches].find((e) => e.identifier === r.id);
		if (!o) return;
		let c = n();
		if (c === "none") {
			r = null;
			return;
		}
		let { axis: l, sign: u } = Mo(e, c), d = o.clientX - r.x, f = o.clientY - r.y, p = l === "y" ? f * u : d * u, m = l === "y" ? d : f;
		if (r.mode === "pending") {
			if (Math.hypot(d, f) < Eo) return;
			if (Math.abs(p) <= Math.abs(m) || No(r.path, e, l, p)) {
				r.mode = "ignore";
				return;
			}
			r.mode = "drag", r.start = p, i++, e.setAttribute("data-ds-overlay-dragging", "");
		}
		t.preventDefault();
		let h = e.getBoundingClientRect(), g = l === "y" ? h.height : h.width, _ = r.base + p - r.start;
		r.offset = _ < 0 ? ko(_, g || 1) : _, s(r.offset, g, u);
		let v = t.timeStamp || (a?.performance?.now() ?? Date.now());
		for (r.samples.push({
			time: v,
			offset: r.offset
		}); r.samples.length > 2 && v - r.samples[0].time > 150;) r.samples.shift();
	}, p = (t) => {
		if (!r || [...t.touches].some((e) => e.identifier === r.id)) return;
		let i = r;
		if (r = null, i.mode !== "drag") return;
		let o = n(), { axis: s } = Mo(e, o), c = e.getBoundingClientRect(), d = s === "y" ? c.height : c.width, f = t.timeStamp || (a?.performance?.now() ?? Date.now()), p = i.samples.filter((e) => f - e.time <= 100), m = p[0], h = p[p.length - 1], g = m && h ? h.time - m.time : 0, _ = m && h && g > 0 ? (h.offset - m.offset) / g * 1e3 : 0, v = i.offset + Oo(_);
		t.type !== "touchcancel" && o !== "none" && i.offset > 0 && v > d / 2 && _ > -100 ? u() : l();
	}, m = new MutationObserver(() => {
		e.open && (i++, r = null, c());
	});
	return m.observe(e, {
		attributes: !0,
		attributeFilter: ["open"]
	}), e.addEventListener("touchstart", d, { passive: !0 }), e.addEventListener("touchmove", f, { passive: !1 }), e.addEventListener("touchend", p, { passive: !0 }), e.addEventListener("touchcancel", p, { passive: !0 }), () => {
		m.disconnect(), e.removeEventListener("touchstart", d), e.removeEventListener("touchmove", f), e.removeEventListener("touchend", p), e.removeEventListener("touchcancel", p), i++, r = null, c();
	};
}
//#endregion
//#region src/sheet.ts
var Io = 400;
function Lo(e) {
	let t = e.root.ownerDocument, n = t.createElement("dialog");
	n.className = "aa-sheet ds-overlay ds-overlay--sheet", n.setAttribute("aria-label", e.title), e.nonModal && (n.style.zIndex = "var(--ds-overlay-layer, 1)");
	let r = t.createElement("div");
	r.className = "aa-sheet-head";
	let i = t.createElement("h2");
	i.className = "aa-sheet-title", i.textContent = e.title;
	let a = t.createElement("button");
	a.type = "button", a.className = "aa-sheet-cancel", a.textContent = "Cancel", r.append(i, a), n.append(r);
	let o = null;
	for (let r of e.groups) {
		if (!r.rows.length) continue;
		let e = t.createElement("div");
		if (e.className = "aa-sheet-group", e.setAttribute("role", "group"), r.label) {
			let n = t.createElement("div");
			n.className = "aa-sheet-label", n.textContent = r.label, e.append(n), e.setAttribute("aria-label", r.label);
		}
		for (let i of r.rows) {
			let r = t.createElement("button");
			r.type = "button", r.className = "aa-sheet-row", r.dataset.command = i.id;
			let a = t.createElement("span");
			a.className = "aa-icon";
			let s = i.icon ? La[`./icons/${i.icon}.svg`] : void 0;
			s && (a.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(s.replace(/currentColor/g, "black"))}")`);
			let c = t.createElement("span");
			if (c.className = "aa-sheet-words", c.textContent = i.label, r.append(a, c), i.key) {
				let e = t.createElement("span");
				e.className = "aa-sheet-key", e.setAttribute("aria-hidden", "true"), e.textContent = i.key, r.append(e);
			}
			r.addEventListener("click", () => {
				o = i, n.close();
			}), e.append(r);
		}
		n.append(e);
	}
	a.addEventListener("click", () => n.close()), n.addEventListener("click", (e) => {
		e.target === n && n.close();
	});
	let s = Fo(n);
	n.addEventListener("close", () => {
		s();
		let t = o;
		o = null, setTimeout(() => n.remove(), Io), e.onClose?.(t), t?.run();
	}, { once: !0 }), e.root.append(n), e.nonModal && typeof n.show == "function" ? n.show() : typeof n.showModal == "function" ? n.showModal() : n.setAttribute("open", "");
	let c = (t) => {
		e.nonModal && t.key === "Escape" && !t.defaultPrevented && (t.preventDefault(), t.stopPropagation(), n.close());
	};
	return n.addEventListener("keydown", c), n.addEventListener("close", () => n.removeEventListener("keydown", c), { once: !0 }), n.tabIndex = -1, n.focus(), () => {
		n.open ? n.close() : n.remove();
	};
}
//#endregion
//#region src/ds1/0-face/tooltips.ts
var Ro = 2e3, zo = 10, Bo = Symbol.for("ds-one:tooltips");
function Vo() {
	if (typeof document > "u" || !document.body) return;
	let e = document.documentElement;
	if (e.hasAttribute("data-ds-tooltips-ready")) return;
	e.setAttribute("data-ds-tooltips-ready", "");
	let t = document.createElement("div");
	t.setAttribute("data-ds-tooltip", ""), t.setAttribute("role", "tooltip"), t.id = "ds-tooltip";
	let n = document.createElement("style");
	n.textContent = "\n    [data-ds-tooltip] {\n      position: fixed; z-index: 2147483646; top: 0; left: 0; pointer-events: none; visibility: hidden;\n      max-width: 320px; min-height: 16px; box-sizing: border-box; padding: 0 2.5px; border-radius: 4px;\n      background: var(--ds-tooltip-background, light-dark(#000, #fff));\n      color: var(--ds-tooltip-color, light-dark(#fff, #000));\n      font-family: var(--typeface-regular, var(--font-regular, system-ui)), sans-serif;\n      font-size: 14px; font-weight: 400; line-height: 16px; letter-spacing: 0; white-space: nowrap;\n    }\n    [data-ds-tooltip].is-wide { white-space: normal; }\n    [data-ds-tooltip].is-visible { visibility: visible; }\n    @media print { [data-ds-tooltip] { display: none; } }\n  ", document.head.appendChild(n), document.body.appendChild(t);
	let r = null, i, a = (e) => {
		let n = e.getBoundingClientRect(), r = t.offsetWidth, i = t.offsetHeight, a = Math.min(Math.max(4, n.left + n.width / 2 - r / 2), window.innerWidth - r - 4), o = n.top - i - 2 >= 4 ? n.top - i - 2 : n.bottom + 2;
		t.style.transform = `translate(${Math.round(a)}px, ${Math.round(o)}px)`;
	}, o = (e) => {
		let n = e.dataset.tooltip;
		if (!n) return !1;
		t.textContent = n;
		let r = e.dataset.tooltipColour;
		return r ? (t.style.setProperty("--ds-tooltip-background", r), t.style.setProperty("--ds-tooltip-color", "#1e1e1e")) : (t.style.removeProperty("--ds-tooltip-background"), t.style.removeProperty("--ds-tooltip-color")), t.classList.remove("is-wide"), t.scrollWidth > 320 && t.classList.add("is-wide"), a(e), !0;
	}, s = typeof MutationObserver == "function" ? new MutationObserver(() => {
		r && (!r.isConnected || !o(r)) && l();
	}) : null, c = (e, n = {}) => {
		clearTimeout(i), i = void 0, r && r !== e && l(), o(e) && (r = e, e.getRootNode() === document && e.setAttribute("aria-describedby", t.id), s?.disconnect(), s?.observe(e, {
			attributes: !0,
			attributeFilter: ["data-tooltip", "data-tooltip-colour"]
		}), t.classList.add("is-visible"), n.duration !== void 0 && n.duration >= 0 && (i = setTimeout(l, n.duration)));
	};
	function l() {
		clearTimeout(i), i = void 0, s?.disconnect(), r?.removeAttribute("aria-describedby"), r = null, t.classList.remove("is-visible");
	}
	window[Bo] = {
		show: c,
		hide: l
	};
	let u = (e) => {
		for (let t of e.composedPath()) {
			if (t === document || t === window) break;
			if (t.hasAttribute?.("data-tooltip")) return t;
		}
		return e.target?.closest?.("[data-tooltip]") ?? null;
	}, d = (e) => {
		let t = e.composedPath()[0];
		try {
			return !!t?.matches?.(":focus-visible");
		} catch {
			return !1;
		}
	}, f = (e) => e.pointerType === "touch";
	document.addEventListener("pointerover", (e) => {
		if (f(e)) return;
		let t = u(e);
		t !== r && (t ? c(t) : l());
	}, { passive: !0 }), document.addEventListener("pointerleave", (e) => {
		f(e) || l();
	}, { passive: !0 }), document.addEventListener("focusin", (e) => {
		let t = u(e);
		t && d(e) && c(t);
	}), document.addEventListener("focusout", l), document.addEventListener("keydown", (e) => {
		e.key === "Escape" && l();
	}), window.addEventListener("scroll", l, {
		passive: !0,
		capture: !0
	});
	let p = null, m = !1, h = () => {
		p && clearTimeout(p.timer), p = null;
	};
	document.addEventListener("pointerdown", (e) => {
		if (m = !1, !f(e)) return;
		h(), l();
		let t = u(e);
		if (!t?.dataset.tooltip) return;
		let n = e;
		p = {
			target: t,
			id: n.pointerId,
			x: n.clientX,
			y: n.clientY,
			timer: setTimeout(() => {
				p &&= (m = !0, c(p.target, { duration: Ro }), null);
			}, 500)
		};
	}, {
		passive: !0,
		capture: !0
	}), document.addEventListener("pointermove", (e) => {
		let t = e;
		p && t.pointerId === p.id && Math.hypot(t.clientX - p.x, t.clientY - p.y) > zo && h();
	}, {
		passive: !0,
		capture: !0
	}), document.addEventListener("pointerup", (e) => {
		if (!p || e.pointerId !== p.id) return;
		let { target: t } = p;
		h(), t.hasAttribute("data-tooltip-press") && c(t, { duration: Ro });
	}, {
		passive: !0,
		capture: !0
	}), document.addEventListener("pointercancel", h, {
		passive: !0,
		capture: !0
	}), document.addEventListener("click", (e) => {
		m && (m = !1, e.preventDefault(), e.stopPropagation());
	}, { capture: !0 });
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", Vo, { once: !0 }) : Vo());
//#endregion
//#region src/controls.ts
var Ho = [
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
		label: "Toggle heading 1",
		icon: "h1"
	},
	{
		kind: "toggle-h2",
		label: "Toggle heading 2",
		icon: "h2"
	},
	{
		kind: "toggle-h3",
		label: "Toggle heading 3",
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
], Uo = {
	h1: "#",
	h2: "##",
	h3: "###",
	todo: "[ ]",
	bullet: "-",
	numbered: "1.",
	quote: ">",
	code: "```",
	divider: "---",
	callout: "> [!",
	table: "|",
	equation: "$$"
};
function Wo(e, t, n, r = !1, i) {
	let a = document.createElement("button");
	a.type = "button", a.setAttribute("aria-label", e), r || (a.dataset.tooltip = i ? `${e} ${i}` : e);
	let o = document.createElement("span");
	o.className = "aa-icon";
	let s = La[`./icons/${t}.svg`];
	if (s && (o.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(s.replace(/currentColor/g, "black"))}")`), a.append(o), r) {
		let t = document.createElement("span");
		t.textContent = e, a.append(t);
	}
	return a.addEventListener("pointerdown", (e) => e.preventDefault()), a.addEventListener("click", n), a;
}
var Go = class extends (typeof HTMLElement > "u" ? class {} : HTMLElement) {
	editor = null;
	actions = [];
	below = null;
	connectedCallback() {
		this.classList.add("ds-context", "ds-context--bar"), this.setAttribute("role", "toolbar"), this.setAttribute("aria-label", "Text formatting"), this.refresh();
	}
	refresh() {
		if (this.replaceChildren(...this.actions.map((e) => {
			let t = Wo(e.label, e.icon, () => {
				this.editor && !this.editor.readOnly && e.run(this.editor);
			}, !1, e.shortcut);
			return t.classList.add("note-menu-row", "ds-context__item--icon"), t.dataset.action = e.id, t;
		})), !Yo()) for (let e = this.actions.length; e % 5; e++) {
			let e = document.createElement("span");
			e.className = "aa-toolbar-spacer", e.setAttribute("aria-hidden", "true"), e.append(Wo("Placeholder", "plus", () => {}).firstElementChild), this.append(e);
		}
		this.below && this.append(this.below);
	}
};
function Ko() {
	customElements.get("aa-toolbar") || customElements.define("aa-toolbar", Go);
}
function qo(e) {
	let t = e.insert;
	return t ? {
		id: `insert-${e.name}`,
		label: t.label,
		icon: t.icon,
		keywords: t.keywords,
		preview: t.preview,
		run: (e) => {
			let n = e.activeBlock(), r = !n || !n.block.source.trim(), i = n ? r ? n.start : n.end : e.value.length, a = r && (n || !e.value) ? "" : "\n\n";
			e.replace(i, n && r ? n.end : i, a + t.source);
			let o = t.source.indexOf("\n") + 1;
			e.selectRange(i + a.length + o);
		}
	} : null;
}
function Jo() {
	let e = window.visualViewport;
	return {
		top: e?.offsetTop ?? 0,
		left: e?.offsetLeft ?? 0,
		width: e?.width ?? window.innerWidth,
		height: e?.height ?? window.innerHeight
	};
}
var Yo = () => !!window.matchMedia?.("(pointer: coarse)").matches;
function Xo(e) {
	let t = getComputedStyle(e);
	return parseFloat(t.getPropertyValue("--ds-sf")) || parseFloat(t.getPropertyValue("--sf")) || 1;
}
function Zo(e) {
	let t = Jo();
	e.dataset.docked = "", e.style.left = `${t.left}px`, e.style.width = `${t.width}px`;
	let n = t.height >= window.innerHeight - 1 && parseFloat(getComputedStyle(e).getPropertyValue("--aa-safe-bottom")) || 0;
	e.style.top = `${t.top + t.height - e.getBoundingClientRect().height - n}px`;
}
function Qo(e, t, n, r) {
	let i = e.top - t.height;
	return {
		left: Math.max(n.left, Math.min(e.left + (e.width - t.width) / 2, n.left + n.width - t.width)),
		top: Math.max(n.top, Math.min(i >= n.top ? i : e.bottom + 0, n.top + n.height - t.height))
	};
}
function $o(e, t) {
	Ko(), Vo();
	let n = (t.atoms ?? []).map(qo).filter((e) => !!e), r = e.element, i = document.createElement("aa-toolbar");
	i.className = "aa-controls aa-toolbar", i.hidden = !0, i.editor = e;
	let a = null, o = null, s = () => {
		a && e.selectRange(a.start, a.end);
	}, c = (e) => Ho.map((t) => ({
		id: t.kind,
		label: t.label,
		icon: t.icon,
		key: Uo[t.kind],
		run: () => {
			s(), e(t.kind);
		}
	})), l = (n, r) => {
		i.hidden = !0, Lo({
			title: n,
			groups: r,
			root: m,
			nonModal: t.nonModalSheets,
			onClose: (t) => {
				if (!t) {
					let t = a?.end ?? e.selection()?.end;
					a = null, t !== void 0 && (o = {
						start: t,
						end: t
					}, e.selectRange(t)), i.hidden = !0;
				}
			}
		});
	}, u = (t) => {
		let n = e.activeBlock();
		if (!n || n.block.kind === "paragraph" && !n.block.source.trim()) {
			e.turnInto(t);
			return;
		}
		let i = ya([{
			kind: "paragraph",
			source: "",
			prefix: 0
		}], {
			anchor: 0,
			focus: 0
		}, t), a = i.blocks.map((e) => e.source).join("\n\n");
		a ? (e.replace(n.end, n.end, `\n\n${a}`), e.selectRange(n.end + 2 + i.caret.offset)) : (e.selectRange(n.end), r.children[n.index]?.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			bubbles: !0,
			cancelable: !0
		})));
	}, d = (t, n, r) => ({
		id: t,
		icon: t,
		label: n,
		shortcut: r,
		run: () => {
			s(), e.format(t);
		}
	}), f = [{
		id: "color-default",
		label: "Default",
		icon: "color",
		run: () => e.color(null)
	}, ...Hi.map((t) => ({
		id: `color-${t}`,
		label: t === "gray" ? "Grey" : t[0].toUpperCase() + t.slice(1),
		icon: "color",
		ink: t,
		run: () => e.color(t)
	}))];
	i.actions = [
		{
			id: "color",
			icon: "color",
			label: "Text colour",
			run: () => {
				s(), z(f, (i.querySelector("[data-action=\"color\"]") ?? i).getBoundingClientRect());
			}
		},
		d("bold", "Bold", "⌘B"),
		d("italic", "Italic", "⌘I"),
		d("underline", "Underline", "⌘U"),
		d("strike", "Strikethrough", "⌘⇧S"),
		d("link", "Link", "⌘K"),
		d("code", "Code", "⌘E"),
		d("equation", "Equation"),
		...t.comments ? [{
			id: "comment",
			icon: "comment",
			label: "Comment",
			shortcut: "⌘⇧M",
			run: () => {
				s(), e.comments?.start();
			}
		}] : [],
		...(Array.isArray(t.toolbar) ? t.toolbar : []).map((t) => ({
			...t,
			run: () => {
				s(), t.run(e);
			}
		}))
	];
	let p = [
		{
			id: "turn",
			icon: "text",
			label: "Turn into",
			run: () => {
				s(), e.activeBlock() && (Yo() ? l("Turn into", [{ rows: c((t) => e.turnInto(t)) }]) : z(Ho.map((t) => ({
					id: t.kind,
					label: t.label,
					icon: t.icon,
					run: () => e.turnInto(t.kind)
				})), (i.querySelector("[data-action=\"turn\"]") ?? i).getBoundingClientRect()));
			}
		},
		...n.map((t) => ({
			...t,
			run: () => {
				s(), t.run(e);
			}
		})),
		...t.onFiles ? [{
			id: "image",
			label: "Image or file",
			icon: "image",
			run: () => {
				let e = document.createElement("input");
				e.type = "file", e.multiple = !0, e.addEventListener("change", () => {
					s(), t.onFiles?.(Array.from(e.files ?? []));
				}, { once: !0 }), e.click();
			}
		}] : []
	];
	if (Yo() && (i.actions = [...i.actions, ...p]), t.prompt) {
		let t = document.createElement("form");
		t.className = "aa-toolbar-ask";
		let n = document.createElement("textarea");
		n.rows = 1, n.placeholder = "Ask AI", n.setAttribute("aria-label", "Ask AI about the selected words"), n.autocomplete = "off", t.append(n);
		let r = (e) => {
			i.toggleAttribute("data-asking", e);
			for (let t of i.querySelectorAll("button")) t.inert = e;
			e || (n.scrollTop = 0);
		};
		n.addEventListener("focus", () => r(!0)), n.addEventListener("blur", () => r(!1)), t.addEventListener("submit", (t) => {
			t.preventDefault();
			let i = n.value.trim(), o = a;
			i && o && !n.disabled && !e.readOnly && (n.disabled = !0, r(!1), e.selectRange(o.start, o.end), e.askAbout(i).then((e) => {
				n.value = e ? "" : n.value, e || (n.placeholder = "Not answered");
			}).catch(() => {
				n.placeholder = "Not answered";
			}).finally(() => {
				n.disabled = !1, setTimeout(() => {
					n.placeholder = "Ask AI";
				}, 2e3);
			}));
		}), n.addEventListener("keydown", (e) => {
			e.isComposing || e.key === "Enter" && !e.shiftKey && (e.preventDefault(), t.requestSubmit());
		}), i.below = t;
	}
	Yo() && (i.actions = [
		{
			id: "insert",
			label: "Insert block",
			icon: "plus",
			run: () => {
				s(), l("Insert block", [{
					label: "Blocks",
					rows: c(u)
				}, {
					label: "More",
					rows: [...B.filter((e) => !Ho.some((t) => t.kind === e.id)), ...t.commands ?? []].map((t) => ({
						id: t.id,
						label: t.label,
						icon: t.icon,
						run: () => {
							s(), t.run(e);
						}
					}))
				}]);
			}
		},
		...i.actions,
		...t.menus === !1 ? [] : [{
			id: "block",
			label: "Block commands",
			icon: "slash",
			run: () => {
				s(), re = e.activeBlock()?.index ?? -1, V(i.querySelector("[data-action=\"block\"]")?.getBoundingClientRect());
			}
		}],
		{
			id: "indent",
			label: "Indent",
			icon: "indent",
			run: () => {
				s(), e.indent(1);
			}
		},
		{
			id: "outdent",
			label: "Outdent",
			icon: "outdent",
			run: () => {
				s(), e.indent(-1);
			}
		}
	]), i.refresh();
	let m = r.closest("dialog") ?? r.ownerDocument.body;
	t.toolbar && m.append(i);
	let h = document.createElement("div");
	h.className = "aa-controls aa-menu", h.hidden = !0, h.setAttribute("role", "menu"), h.setAttribute("aria-label", "Block commands");
	let g = document.createElement("div");
	g.className = "aa-menu-list", g.setAttribute("role", "none");
	let _ = Wo("Close", "close", () => R(), !0);
	_.classList.add("note-menu-row"), _.dataset.command = "close", _.setAttribute("role", "menuitem"), _.tabIndex = -1, _.querySelector(".aa-icon")?.remove();
	let v = document.createElement("kbd");
	v.textContent = "esc", _.append(v);
	let y = document.createElement("div");
	y.className = "aa-controls aa-find", y.hidden = !0, y.setAttribute("role", "search");
	let b = document.createElement("div");
	b.className = "aa-controls aa-command-preview", b.hidden = !0, b.setAttribute("aria-hidden", "true");
	let x, S, C = () => {
		S?.(), S = void 0, x = void 0, b.replaceChildren(), b.hidden = !0, b.remove();
	}, w = () => {
		if (!x?.preview || h.hidden) {
			b.hidden = !0;
			return;
		}
		let e = Jo(), t = 20 * Xo(r), n = h.getBoundingClientRect(), i = b.getBoundingClientRect().width || 16 * t, a = n.right + t / 2, o = n.left - t / 2 - i;
		if (a + i > e.left + e.width && o < e.left) {
			b.hidden = !0;
			return;
		}
		b.hidden = !1, b.style.left = `${a + i <= e.left + e.width ? a : o}px`;
		let s = b.getBoundingClientRect().height;
		b.style.top = `${Math.max(e.top, Math.min(Math.round(n.top / t) * t, e.top + e.height - s))}px`;
	}, T = (e = "keyboard", t = !1) => {
		let n = P[N];
		n === x && !t ? w() : (C(), n?.preview && (x = n, b.hidden = !1, m.append(b), S = n.preview(b, { input: e }), w()));
	};
	m.append(h, y);
	let E = document.createElement("form");
	E.className = "aa-controls aa-find aa-link-editor", E.hidden = !0, E.setAttribute("aria-label", "Edit link");
	let D = document.createElement("input");
	D.type = "text", D.placeholder = "Link URL", D.setAttribute("aria-label", "Link URL");
	let ee = document.createElement("button");
	ee.type = "submit", ee.textContent = "Apply";
	let O = document.createElement("button");
	O.type = "button", O.textContent = "Cancel", E.append(D, ee, O), m.append(E);
	let k = null, te = () => {
		E.hidden = !0, k && e.selectRange(k.start, k.end), k = null;
	}, A = (t) => {
		if (k = t.detail, k && !e.readOnly) {
			if (D.value = k.url, E.hidden = !1, i.hidden = !0, Yo()) Zo(E);
			else {
				delete E.dataset.docked, E.style.width = "";
				let e = r.getBoundingClientRect(), t = 20 * Xo(r), n = Jo();
				E.style.left = `${Math.max(n.left, Math.min(e.left, n.left + n.width - 16 * t))}px`, E.style.top = `${Math.max(n.top, Math.min(e.top, n.top + n.height - 3 * t))}px`;
			}
			D.focus(), D.select();
		}
	};
	E.addEventListener("submit", (t) => {
		if (t.preventDefault(), !k || e.readOnly || !D.value.trim()) return;
		let n = D.value.trim().replace(/\(/g, "%28").replace(/\)/g, "%29"), r = k.text || n;
		e.replace(k.start, k.end, `[${r}](${n})`), E.hidden = !0, k = null;
	}), O.addEventListener("click", te), E.addEventListener("keydown", (e) => {
		e.key === "Escape" && (e.preventDefault(), te());
	}), r.addEventListener("aa-link-request", A);
	let j = null, ne = () => {
		j?.remove(), j = null;
	}, M = (t, n) => {
		if (ne(), e.readOnly) return;
		let i = document.createElement("div");
		i.className = "aa-controls aa-menu aa-reaction-picker aa-callout-icons", i.setAttribute("role", "menu"), i.setAttribute("aria-label", "Callout icon");
		let a = (n) => {
			ne(), e.callout({ icon: n }, t), e.focus();
		};
		for (let e of wr) {
			let t = document.createElement("button");
			t.type = "button", t.setAttribute("role", "menuitem"), t.textContent = e, t.setAttribute("aria-label", `Icon ${e}`), t.addEventListener("pointerdown", (e) => e.preventDefault()), t.addEventListener("click", (t) => {
				t.preventDefault(), a(e);
			}), i.append(t);
		}
		let o = document.createElement("button");
		o.type = "button", o.setAttribute("role", "menuitem"), o.className = "aa-callout-icons-none", o.textContent = "No icon", o.addEventListener("pointerdown", (e) => e.preventDefault()), o.addEventListener("click", (e) => {
			e.preventDefault(), a(null);
		}), i.append(o), i.addEventListener("keydown", (t) => {
			t.key === "Escape" && (t.preventDefault(), t.stopPropagation(), ne(), e.focus());
		}), m.append(i), j = i;
		let s = 20 * Xo(r), c = Jo(), l = 8 * s, u = 3 * s, d = 4 * s / 20;
		i.style.left = `${Math.max(c.left, Math.min(n.left, c.left + c.width - l))}px`, i.style.top = `${n.bottom + d + u <= c.top + c.height ? n.bottom + d : Math.max(c.top, n.top - d - u)}px`, i.querySelector("button")?.focus();
	};
	r.addEventListener("aa-callout-icon", (e) => {
		let t = e.detail;
		M(t.index, t.rect);
	}), document.addEventListener("pointerdown", (e) => {
		j && !j.contains(e.target) && ne();
	}, !0);
	let re = -1, N = 0, P = [], F = null, I, ie = !1, L = (e) => {
		let t = 20 * Xo(r), n = Jo(), i = h.getBoundingClientRect(), a = i.height || (Math.min(P.length, 8) + 1) * t;
		for (let e of Array.from(g.querySelectorAll("button > span:not(.aa-icon)"))) e.toggleAttribute("data-cut", e.scrollWidth > e.clientWidth + 1);
		h.style.left = `${Math.max(n.left, Math.min(e.left, n.left + n.width - i.width))}px`;
		let o = e.bottom, s = e.top - a, c = o + a <= n.top + n.height;
		h.style.top = `${c || s < n.top ? Math.max(n.top, Math.min(o, n.top + n.height - a)) : s}px`;
	}, ae = () => {
		clearTimeout(I), i.contains(document.activeElement) && document.activeElement.blur(), i.hidden = !0;
		let t = e.selection();
		o = t ? { ...t } : null;
	}, R = () => {
		delete h.dataset.palette, C(), h.hidden = !0, F = null, g.replaceChildren(), h.replaceChildren(), r.removeAttribute("aria-controls");
	}, oe = (t) => {
		if (e.readOnly) return;
		let n = F;
		if (R(), e.transaction(() => {
			n && e.replace(n.from, n.to, ""), t.run(e);
		}), Yo()) {
			let t = e.selection();
			t && t.start !== t.end && e.selectRange(t.end);
		}
		t.id.startsWith("color-") ? (i.hidden = !1, ce()) : ae();
	}, se = () => {
		if (g.replaceChildren(...P.map((e, t) => {
			let n = Wo(e.label, e.icon, () => oe(e), !("palette" in h.dataset));
			return "palette" in h.dataset && (n.classList.add("aa-colour-swatch"), n.querySelector(".aa-icon")?.removeAttribute("style")), e.ink && n.querySelector(".aa-icon")?.setAttribute("data-color", e.ink), e.swatch && n.querySelector(".aa-icon")?.setAttribute("data-fill", e.swatch), n.classList.add("note-menu-row"), n.dataset.command = e.id, n.setAttribute("role", "menuitem"), e.id === "count" && (n.lastElementChild.textContent = e.label.split(",")[0], n.querySelector(".aa-icon")?.remove()), n.tabIndex = t === N ? 0 : -1, n.toggleAttribute("data-current", t === N), n.addEventListener("pointerenter", () => {
				N = t, Array.from(g.children).forEach((e, t) => e.toggleAttribute("data-current", t === N)), T("pointer", !0);
			}), n;
		})), !P.length) {
			let e = document.createElement("span");
			e.className = "aa-menu-empty", e.textContent = "No matching commands", g.append(e);
		}
		h.replaceChildren(g, _), T();
		let e = g.children[N];
		e && typeof e.scrollIntoView == "function" && e.scrollIntoView({ block: "nearest" });
	};
	function z(t, n) {
		P = t.filter((t) => t.enabled?.(e) !== !1), h.toggleAttribute("data-palette", P.length > 0 && P.every((e) => e.id.startsWith("color-"))), h.setAttribute("aria-label", "palette" in h.dataset ? "Text colour" : "Block commands"), N = 0, h.hidden = !1, se(), L(n), w();
	}
	let B = [...Ho.map((t) => ({
		id: t.kind,
		label: t.label,
		icon: t.icon,
		run: () => e.turnInto(t.kind)
	})), ...n];
	t.onFiles && B.push({
		id: "image",
		label: "Image or file",
		icon: "image",
		run: () => {
			let t = document.createElement("input");
			t.type = "file", t.multiple = !0, t.addEventListener("change", () => Array.from(t.files ?? []).forEach((t) => e.insertFile(t)), { once: !0 }), t.click();
		}
	});
	let V = (n) => {
		if (re < 0 || t.menus === !1) return;
		let i = e.activeBlock();
		(i?.index !== re || i.block.kind !== "table" && !Yo()) && e.selectBlocks(re);
		let a = [
			...B,
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
				enabled: (e) => e.reordering,
				run: () => e.blockAction("up")
			},
			{
				id: "down",
				label: "Move down",
				icon: "down",
				enabled: (e) => e.reordering,
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
			...li.map((t) => ({
				id: `fill-${t}`,
				label: `${t === "gray" ? "Grey" : t[0].toUpperCase() + t.slice(1)} fill`,
				icon: "color",
				swatch: t,
				keywords: "callout colour background",
				enabled: (e) => e.activeBlock()?.block.kind === "callout",
				run: () => e.callout({ color: t }, re)
			})),
			...t.blockCommands ?? []
		], o = e.stats();
		a.push({
			id: "count",
			label: `${o.words} words, ${o.characters} characters`,
			icon: "text",
			run: () => {}
		}), F = null, z(a, n ?? (r.children[re] ?? r).getBoundingClientRect());
	}, H = () => {
		if (ie || e.readOnly || t.menus === !1) {
			R();
			return;
		}
		let n = e.activeBlock(), i = e.selection();
		if (!n || !i || i.start !== i.end || n.block.kind === "code" || n.block.kind === "table") return;
		let a = e.value.slice(n.start, i.end), o = /(?:^|\s)\/([^/\n]*)$/.exec(a);
		if (!o) {
			F && R();
			return;
		}
		let s = o[1].toLocaleLowerCase();
		F = {
			from: i.end - o[1].length - 1,
			to: i.end
		}, z([...B, ...t.commands ?? []].filter((e) => `${e.label} ${e.keywords ?? ""}`.toLocaleLowerCase().includes(s)), r.children[n.index]?.getBoundingClientRect() ?? r.getBoundingClientRect());
	}, ce = () => {
		if (!i.hidden) {
			if (Yo()) i.below && i.lastElementChild !== i.below && i.append(i.below), Zo(i);
			else {
				delete i.dataset.docked, i.style.width = "";
				let t = a ? e.rangeOf(a.start, a.end) : null, n = Array.from(t?.getClientRects?.() ?? []).filter((e) => e.width > 0 && e.height > 0), o = n[0], s = o ? n.filter((e) => Math.abs(e.top - o.top) < 2) : [], c = t?.getBoundingClientRect?.() ?? r.getBoundingClientRect(), l = s.length ? {
					left: Math.min(...s.map((e) => e.left)),
					top: Math.min(...s.map((e) => e.top)),
					width: Math.max(...s.map((e) => e.right)) - Math.min(...s.map((e) => e.left)),
					bottom: c.bottom
				} : c, u = Qo(l, i.getBoundingClientRect(), Jo(), Xo(r));
				if (i.below) {
					let e = l.top - i.getBoundingClientRect().height < Jo().top;
					e && i.firstElementChild !== i.below ? i.prepend(i.below) : !e && i.lastElementChild !== i.below && i.append(i.below);
				}
				i.style.left = `${u.left}px`, i.style.top = `${u.top}px`;
			}
		}
	}, le = () => {
		if (clearTimeout(I), i.contains(document.activeElement)) return;
		let n = e.selection();
		if (n && n.start === o?.start && n.end === o?.end) {
			i.hidden = !0;
			return;
		}
		o = null;
		let s = Yo() && r.contains(document.activeElement);
		!n || !s && n.start === n.end || e.readOnly ? i.hidden = !0 : (a = n, I = setTimeout(() => {
			!ie && t.toolbar && !e.readOnly && (i.hidden = !1, ce());
		}, 140));
	}, ue = document.createElement("input");
	ue.placeholder = "Find", ue.setAttribute("aria-label", "Find");
	let de = document.createElement("input");
	de.placeholder = "Replace", de.setAttribute("aria-label", "Replace");
	let fe = document.createElement("span");
	fe.setAttribute("aria-live", "polite");
	let U = [], W = -1, pe = () => {
		y.hidden || (U = e.find(ue.value), e.decorate(U.map((e) => ({
			from: e.start,
			to: e.end,
			className: "aa-find-match"
		})), "find"), fe.textContent = `${U.length} matches`, W = Math.min(W, U.length - 1));
	}, me = (t) => {
		if (!U.length) return;
		W = (W + t + U.length) % U.length;
		let n = U[W];
		e.selectRange(n.start, n.end), fe.textContent = `${W + 1} of ${U.length}`;
	}, G = () => {
		y.hidden = !0, e.decorate([], "find"), e.focus();
	};
	ue.addEventListener("input", pe), y.append(ue, de, Wo("Previous match", "up", () => me(-1)), Wo("Next match", "down", () => me(1)), Wo("Replace", "text", () => {
		let t = U[W < 0 ? 0 : W];
		t && !e.readOnly && (e.replace(t.start, t.end, de.value), pe());
	}), Wo("Replace all", "text", () => {
		if (!U.length || e.readOnly) return;
		let t = e.value;
		for (let e of [...U].reverse()) t = t.slice(0, e.start) + de.value + t.slice(e.end);
		e.replace(0, e.value.length, t), pe();
	}), fe, Wo("Close find", "close", G)), y.addEventListener("keydown", (e) => {
		e.key === "Escape" ? (e.preventDefault(), G()) : e.key === "Enter" && (e.preventDefault(), me(e.shiftKey ? -1 : 1));
	});
	let K = () => {
		clearTimeout(I);
		let t = document.activeElement;
		t instanceof HTMLElement && [
			i,
			h,
			E,
			y
		].some((e) => e.contains(t)) && t.blur(), R(), i.hidden = !0, E.hidden = !0, k = null, y.hidden = !0, e.decorate([], "find"), a = null, o = null;
	}, he = (t) => {
		if (t.key !== "Escape" || t.isComposing || t.defaultPrevented) return;
		let n = t.target;
		n && [
			r,
			i,
			h,
			E,
			y
		].some((e) => e.contains(n)) && (i.hidden && h.hidden && E.hidden && y.hidden || (t.preventDefault(), t.stopImmediatePropagation(), e.dismiss()));
	}, ge = (n) => {
		if (n.isComposing || n.defaultPrevented) return;
		let i = /Mac|iPhone|iPad/.test(navigator.platform) ? n.metaKey : n.ctrlKey;
		if (i && n.key.toLowerCase() === "f") {
			n.preventDefault(), n.stopImmediatePropagation(), y.hidden = !1;
			let e = r.getBoundingClientRect();
			y.style.left = `${Math.max(0, e.left)}px`, y.style.top = `${Math.max(0, e.top)}px`, pe(), ue.focus();
		} else i && n.key === "/" && t.menus !== !1 ? (n.preventDefault(), n.stopImmediatePropagation(), re = e.activeBlock()?.index ?? -1, V()) : h.hidden || (n.key === "Escape" ? (n.preventDefault(), n.stopImmediatePropagation(), R()) : n.key === "ArrowDown" || n.key === "ArrowUp" ? (n.preventDefault(), n.stopImmediatePropagation(), P.length && (N = (N + (n.key === "ArrowDown" ? 1 : -1) + P.length) % P.length), se()) : n.key === "Enter" && P[N] && (n.preventDefault(), n.stopImmediatePropagation(), oe(P[N])));
	};
	h.addEventListener("keydown", ge);
	let _e = (e) => {
		let t = e.target;
		h.contains(t) || R(), [
			i,
			h,
			E,
			y
		].some((e) => e.contains(t)) || (ae(), E.hidden = !0, k = null);
	}, ve = () => {
		H(), pe(), e.readOnly && (i.hidden = !0, E.hidden = !0, k = null);
	}, ye = (n) => {
		let i = n.target.closest(".aa-block");
		i?.getAttribute("data-kind") !== "table" || e.readOnly || t.menus === !1 || (n.preventDefault(), re = Array.from(r.children).indexOf(i), V(), h.style.left = `${n.clientX}px`, h.style.top = `${n.clientY}px`);
	}, q = (t) => {
		if (!(t.target instanceof Node && h.contains(t.target)) && (ce(), !E.hidden && "docked" in E.dataset && Zo(E), !h.hidden)) {
			let t = e.activeBlock(), n = t ? r.children[t.index]?.getBoundingClientRect() : null;
			n && (L(n), w());
		}
	}, be = () => {
		o = null;
	};
	r.addEventListener("pointerdown", be), r.addEventListener("aa-dismiss", K), document.addEventListener("keydown", he, !0), r.addEventListener("aa-selectionchange", le), r.addEventListener("aa-change", ve), r.addEventListener("contextmenu", ye), r.addEventListener("keydown", ge, !0), document.addEventListener("pointerdown", _e), window.addEventListener("resize", q), window.addEventListener("scroll", q, !0), window.visualViewport?.addEventListener("resize", q), window.visualViewport?.addEventListener("scroll", q);
	let xe = To(e, t, m);
	return () => {
		C(), b.remove(), ie = !0, clearTimeout(I), xe(), i.remove(), h.remove(), y.remove(), E.remove(), r.removeEventListener("aa-link-request", A), r.removeEventListener("aa-selectionchange", le), r.removeEventListener("aa-change", ve), r.removeEventListener("aa-dismiss", K), r.removeEventListener("keydown", ge, !0), r.removeEventListener("contextmenu", ye), r.removeEventListener("pointerdown", be), document.removeEventListener("keydown", he, !0), document.removeEventListener("pointerdown", _e), window.removeEventListener("resize", q), window.removeEventListener("scroll", q, !0), window.visualViewport?.removeEventListener("resize", q), window.visualViewport?.removeEventListener("scroll", q);
	};
}
//#endregion
//#region src/selection.ts
function es(e, t, n) {
	let r = [];
	for (let t of [...e].filter((e) => e.right > e.left && e.bottom > e.top).sort((e, t) => e.top - t.top || e.left - t.left)) {
		let e = r.find((e) => Math.min(e.bottom, t.bottom) - Math.max(e.top, t.top) > Math.min(e.bottom - e.top, t.bottom - t.top) / 2);
		e ? (e.fragments.push(t), e.left = Math.min(e.left, t.left), e.right = Math.max(e.right, t.right), e.top = Math.min(e.top, t.top), e.bottom = Math.max(e.bottom, t.bottom)) : r.push({
			...t,
			fragments: [t]
		});
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
		return ts(i, n);
	}).join(" ");
}
function ts(e, t) {
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
function ns(e) {
	let t = e.ownerDocument, n = t.defaultView ?? window, r = 0, i = !1, a = !1, o = /* @__PURE__ */ new Set(), s = n.matchMedia("(forced-colors: active)"), c = () => {
		for (let e of o) e.removeAttribute("data-aa-selection"), e.style.removeProperty("--aa-selection-mask"), e.style.removeProperty("--aa-selection-box"), e.style.removeProperty("--aa-selection-width"), e.style.removeProperty("--aa-selection-height");
		o.clear();
	}, l = () => {
		r = 0, c();
		let l = n.getSelection();
		if (i || a || s.matches || !l?.rangeCount || l.isCollapsed || !e.contains(l.anchorNode) || !e.contains(l.focusNode)) return;
		let u = l.getRangeAt(0);
		for (let r of Array.from(e.children)) {
			if (!r.classList.contains("aa-block") || r.dataset.kind === "table" || !u.intersectsNode(r)) continue;
			let e = t.createRange();
			if (e.selectNodeContents(r), u.compareBoundaryPoints(Range.START_TO_START, e) > 0 && e.setStart(u.startContainer, u.startOffset), u.compareBoundaryPoints(Range.END_TO_END, e) < 0 && e.setEnd(u.endContainer, u.endOffset), e.collapsed || typeof e.getClientRects != "function") continue;
			let i = r.getBoundingClientRect(), a = n.getComputedStyle(r);
			if (a.writingMode && a.writingMode !== "horizontal-tb" || Math.abs(i.width - r.offsetWidth) > 1) continue;
			let s = parseFloat(a.lineHeight) || parseFloat(a.fontSize) * 1.2, c = Array.from(e.getClientRects()).filter((e) => e.width > 0 && e.height > 0).map((e) => ({
				left: e.left - i.left + r.scrollLeft - r.clientLeft,
				right: e.right - i.left + r.scrollLeft - r.clientLeft,
				top: e.top - i.top + r.scrollTop - r.clientTop,
				bottom: e.bottom - i.top + r.scrollTop - r.clientTop
			}));
			if (!c.length) continue;
			let l = Math.min(...c.map((e) => e.left)), d = Math.min(...c.map((e) => e.top)) - s / 2, f = Math.max(...c.map((e) => e.right)) - l, p = Math.max(...c.map((e) => e.bottom)) - d + s / 2, m = parseFloat(a.getPropertyValue("--sf")) || 1, h = es(c.map((e) => ({
				left: e.left - l,
				right: e.right - l,
				top: e.top - d,
				bottom: e.bottom - d
			})), s, 2 * m);
			if (!h) continue;
			let g = `<svg xmlns="http://www.w3.org/2000/svg" width="${f}" height="${p}" viewBox="0 0 ${f} ${p}"><path d="${h}"/></svg>`;
			r.style.setProperty("--aa-selection-mask", `url("data:image/svg+xml,${encodeURIComponent(g)}")`), r.style.setProperty("--aa-selection-box", `${d}px auto auto ${l}px`), r.style.setProperty("--aa-selection-width", `${f}px`), r.style.setProperty("--aa-selection-height", `${p}px`), r.setAttribute("data-aa-selection", ""), o.add(r);
		}
	}, u = () => {
		!i && !r && (r = n.requestAnimationFrame(l));
	}, d = () => {
		a = !0, c();
	}, f = () => {
		a = !1, u();
	}, p = new (n.ResizeObserver ?? ResizeObserver)(u);
	p.observe(e);
	let m = new (n.MutationObserver ?? MutationObserver)(u);
	return m.observe(e, {
		childList: !0,
		subtree: !0,
		characterData: !0
	}), t.addEventListener("selectionchange", u), t.addEventListener("scroll", u, !0), n.addEventListener("resize", u), e.addEventListener("compositionstart", d), e.addEventListener("compositionend", f), e.addEventListener("load", u, !0), t.fonts?.addEventListener("loadingdone", u), s.addEventListener?.("change", u), () => {
		i = !0, n.cancelAnimationFrame(r), c(), p.disconnect(), m.disconnect(), t.removeEventListener("selectionchange", u), t.removeEventListener("scroll", u, !0), n.removeEventListener("resize", u), e.removeEventListener("compositionstart", d), e.removeEventListener("compositionend", f), e.removeEventListener("load", u, !0), t.fonts?.removeEventListener("loadingdone", u), s.removeEventListener?.("change", u);
	};
}
//#endregion
//#region src/span.ts
var rs = 24, is = "button, input, textarea, select, video, audio, .aa-caption, [data-aa-interactive]";
function as(e, t) {
	let n = () => Array.from(e.children).filter((e) => e.classList.contains("aa-block")), r = (t) => {
		let n = (t instanceof Element ? t : t?.parentElement)?.closest(".aa-block");
		return n && n.parentElement === e ? n : null;
	}, i = (e, t) => {
		let n = document.caretPositionFromPoint?.(e, t);
		if (n) return {
			node: n.offsetNode,
			offset: n.offset
		};
		let r = document.caretRangeFromPoint?.(e, t);
		return r ? {
			node: r.startContainer,
			offset: r.startOffset
		} : null;
	}, a = (e, t) => {
		let a = n();
		if (!a.length) return null;
		let s = a.map((e) => e.getBoundingClientRect()), c = s.findIndex((e) => t < e.bottom);
		c < 0 && (c = a.length - 1), c > 0 && t < s[c].top && s[c].top - t > t - s[c - 1].bottom && c--;
		let l = a[c], u = s[c];
		if (t < u.top) return {
			block: l,
			offset: 0
		};
		if (t >= u.bottom) return {
			block: l,
			offset: o(l)
		};
		let d = i(Math.min(Math.max(e, u.left + 1), u.right - 1), t);
		return !d || r(d.node) !== l ? {
			block: l,
			offset: e < u.left + u.width / 2 ? 0 : o(l)
		} : {
			block: l,
			offset: Ja(l, d.node, d.offset)
		};
	}, o = (e) => Ja(e, e, e.childNodes.length), s = (e, t) => {
		let n = r(e);
		return n && e ? {
			block: n,
			offset: Ja(n, e, t)
		} : null;
	}, c = !1, l = (e, t) => {
		let n = window.getSelection();
		if (!n || !e.block.isConnected || !t.block.isConnected) return;
		let r = Ya(e.block, e.offset), i = Ya(t.block, t.offset);
		if (n.anchorNode !== r.node || n.anchorOffset !== r.offset || n.focusNode !== i.node || n.focusOffset !== i.offset) {
			c = !0;
			try {
				n.setBaseAndExtent(r.node, r.offset, i.node, i.offset);
			} finally {
				c = !1;
			}
		}
	}, u = null, d = 0, f = (e) => {
		if (u = null, e.pointerType !== "mouse" || e.button !== 0 || e.altKey || e.metaKey || e.ctrlKey || t()) return;
		let n = e.target instanceof Element ? e.target : null;
		if (!r(n) || n?.closest(is)) return;
		let i = a(e.clientX, e.clientY);
		if (i) {
			if (e.shiftKey) {
				let t = window.getSelection(), n = t?.rangeCount ? s(t.anchorNode, t.anchorOffset) : null;
				if (!n || n.block === i.block) return;
				e.preventDefault(), u = {
					pointer: e.pointerId,
					start: n,
					words: !1,
					anchor: n,
					focus: i,
					x: e.clientX,
					y: e.clientY
				}, l(n, i);
			} else u = {
				pointer: e.pointerId,
				start: i,
				words: !1,
				anchor: null,
				focus: null,
				x: e.clientX,
				y: e.clientY
			};
		}
	}, p = () => {
		if (!u?.anchor) return;
		let e = a(u.x, u.y);
		e && (u.focus = e, l(u.anchor, e));
	}, m = (t) => {
		if (u && t.pointerId === u.pointer) {
			if (!(t.buttons & 1) || e.hasAttribute("data-dragging")) b();
			else {
				if (u.x = t.clientX, u.y = t.clientY, !u.anchor) {
					let e = a(t.clientX, t.clientY);
					if (!e || e.block === u.start.block) return;
					let n = window.getSelection(), r = u.words && n?.rangeCount ? s(n.anchorNode, n.anchorOffset) : null;
					u.anchor = r?.block === u.start.block ? r : u.start;
				}
				p(), y();
			}
		}
	}, h = (e) => {
		u?.anchor && e.buttons & 1 && e.preventDefault();
	}, g = (e) => {
		u && e.detail > 1 && (u.words = !0);
	}, _ = (e) => {
		u?.anchor && e.preventDefault();
	}, v = () => {
		!c && u?.anchor && u.focus && l(u.anchor, u.focus);
	}, y = () => {
		if (d || !u?.anchor) return;
		let t = u.y < rs ? u.y - rs : u.y > window.innerHeight - rs ? u.y - (window.innerHeight - rs) : 0;
		t && (d = requestAnimationFrame(() => {
			d = 0, u?.anchor && (os(e).scrollBy(0, Math.sign(t) * Math.min(Math.abs(t), rs)), p(), y());
		}));
	}, b = () => {
		u = null, d && cancelAnimationFrame(d), d = 0;
	}, x = (e) => {
		u && e.pointerId === u.pointer && b();
	};
	return window.addEventListener("pointerdown", f, !0), window.addEventListener("pointermove", m, !0), window.addEventListener("pointerup", x, !0), window.addEventListener("pointercancel", x, !0), window.addEventListener("mousemove", h, !0), window.addEventListener("mousedown", g, !0), document.addEventListener("selectstart", _, !0), document.addEventListener("selectionchange", v), () => {
		b(), window.removeEventListener("pointerdown", f, !0), window.removeEventListener("pointermove", m, !0), window.removeEventListener("pointerup", x, !0), window.removeEventListener("pointercancel", x, !0), window.removeEventListener("mousemove", h, !0), window.removeEventListener("mousedown", g, !0), document.removeEventListener("selectstart", _, !0), document.removeEventListener("selectionchange", v);
	};
}
function os(e) {
	for (let t = e.parentElement; t; t = t.parentElement) {
		let e = getComputedStyle(t).overflowY;
		if ((e === "auto" || e === "scroll") && t.scrollHeight > t.clientHeight) return t;
	}
	return window;
}
var ss = 4e3, cs = /* @__PURE__ */ new Set([
	"paragraph",
	"heading",
	"bullet",
	"quote",
	"callout"
]), ls = /[\p{L}\p{M}\p{N}_]/u, us = /[\p{L}\p{M}\p{N}_]+(?:['’][\p{L}\p{M}\p{N}_]+)*|\s+|[^]/gu, ds = /(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
function fs(e) {
	return cs.has(e.kind) && e.source.length <= ss && /\p{L}/u.test(e.source);
}
function ps(e, t) {
	if (!fs(e)) return [];
	let n = [];
	for (let r of ta(e, t)) {
		if (r.kind !== "text" || r.code) continue;
		let e = n[n.length - 1];
		e && e[1] === r.from ? e[1] = r.to : n.push([r.from, r.to]);
	}
	for (let t of e.source.matchAll(ds)) {
		let e = t.index, r = e + t[0].length;
		n = n.flatMap(([t, n]) => n <= e || t >= r ? [[t, n]] : [...t < e ? [[t, e]] : [], ...n > r ? [[r, n]] : []]);
	}
	return n;
}
var ms = (e) => Array.from(e.matchAll(us), (e) => ({
	text: e[0],
	at: e.index
}));
function hs(e, t) {
	let n = ms(e), r = ms(t), i = (t) => t < n.length ? n[t].at : e.length, a = (e, t) => r.slice(e, t).map((e) => e.text).join(""), o = 0;
	for (; o < n.length && o < r.length && n[o].text === r[o].text;) o++;
	let s = n.length, c = r.length;
	for (; s > o && c > o && n[s - 1].text === r[c - 1].text;) s--, c--;
	let l = s - o, u = c - o;
	if (!l && !u) return [];
	if (l * u > 25e4) return [{
		from: i(o),
		to: i(s),
		text: a(o, c)
	}];
	let d = Array.from({ length: l + 1 }, () => new Uint16Array(u + 1));
	for (let e = l - 1; e >= 0; e--) for (let t = u - 1; t >= 0; t--) d[e][t] = n[o + e].text === r[o + t].text ? d[e + 1][t + 1] + 1 : Math.max(d[e + 1][t], d[e][t + 1]);
	let f = [], p = 0, m = 0, h = null, g = () => {
		h && f.push({
			from: i(o + h[0]),
			to: i(o + p),
			text: a(o + h[1], o + m)
		}), h = null;
	};
	for (; p < l || m < u;) p < l && m < u && n[o + p].text === r[o + m].text ? (g(), p++, m++) : (h ??= [p, m], m < u && (p >= l || d[p][m + 1] >= d[p + 1][m]) ? m++ : p++);
	return g(), f;
}
var gs = (e, t) => {
	let n = 0;
	for (; n < e.length && n < t.length && e[n] === t[n];) n++;
	let r = 0;
	for (; r < e.length - n && r < t.length - n && e[e.length - 1 - r] === t[t.length - 1 - r];) r++;
	return Math.max(e.length, t.length) - n - r;
};
function _s(e, t) {
	let n = Mi(e);
	if (n.length !== 1) return "";
	let { start: r, ...i } = n[0], a = [];
	for (let n of ta(i, t)) {
		let t = n.kind === "text" && !n.code ? [
			"text",
			n.bold,
			n.italic,
			n.strike,
			n.highlight,
			n.href
		] : [n.kind, e.slice(n.from, n.to)];
		(t[0] !== "text" || JSON.stringify(a[a.length - 1]) !== JSON.stringify(t)) && a.push(t);
	}
	return JSON.stringify([
		i.kind,
		i.prefix,
		i.level,
		i.checked,
		i.number,
		i.callout,
		i.icon,
		i.color,
		i.folded,
		a
	]);
}
var vs = (e, t) => `${e}\u0000${t}`;
function ys(e, t, n = {}) {
	let { source: r } = e, [, i, , a] = /^(\s*)([^]*?)(\s*)$/.exec(r), o = i + t.trim() + a, s = ps(e, n.atoms);
	if (o === r || !t.trim() || !s.length) return {
		edits: [],
		partial: !1
	};
	let c = hs(r, o).filter((e) => s.some(([t, n]) => e.from >= t && e.to <= n)), l = s.reduce((e, [t, n]) => e + n - t, 0);
	if (c.reduce((e, t) => e + gs(r.slice(t.from, t.to), t.text), 0) > Math.max(12, l / 2)) return {
		edits: [],
		partial: !1
	};
	let u = _s(r, n.atoms), d = [], f = !1, p = r, m = 0;
	for (let e of c) {
		let t = r.slice(e.from, e.to);
		if (/\n/.test(t + e.text) || n.rejected?.has(vs(t, e.text))) continue;
		let i = n.protect;
		if (i && e.from <= i[1] && e.to >= i[0]) {
			f = !0;
			continue;
		}
		let a = p.slice(0, e.from + m) + e.text + p.slice(e.to + m);
		_s(a, n.atoms) === u && (d.push(e), p = a, m += e.text.length - t.length);
	}
	return {
		edits: d,
		partial: f
	};
}
function bs(e, t) {
	let n = e;
	for (let e = t.length - 1; e >= 0; e--) n = n.slice(0, t[e].from) + t[e].text + n.slice(t[e].to);
	return n;
}
function xs(e, t) {
	let n = bs(e, t), r = [], i = 0;
	for (let e of t) {
		let t = e.from + i;
		i += e.text.length - (e.to - e.from);
		let [a, o] = Cs(n, t, t + e.text.length);
		for (; a < o && /\s/.test(n[a]);) a++;
		for (; o > a && /\s/.test(n[o - 1]);) o--;
		if (a === o) continue;
		let s = r[r.length - 1];
		s && a <= s[1] ? s[1] = Math.max(s[1], o) : r.push([a, o]);
	}
	return r;
}
function Ss(e, t) {
	let n = 0;
	for (let r of t) {
		if (e <= r.from) break;
		if (e < r.to) return r.from + n + Math.min(e - r.from, r.text.length);
		n += r.text.length - (r.to - r.from);
	}
	return e + n;
}
function Cs(e, t, n = t) {
	for (; t > 0 && ls.test(e[t - 1]);) t--;
	for (; n < e.length && ls.test(e[n]);) n++;
	return [t, n];
}
function ws(e, t, n = !0) {
	let r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = [], c = /* @__PURE__ */ new Set(), l, u = !1, d = (e, t) => {
		o.delete(e), o.set(e, t), o.size > 200 && o.delete(o.keys().next().value);
	}, f = (t, a) => {
		let o = e.blocks().indexOf(t);
		if (!n || o < 0 || e.busy()) return;
		let l = e.selection(), u = null;
		if (l) {
			let [e, n] = l.anchor.block < l.focus.block || l.anchor.block === l.focus.block && l.anchor.offset <= l.focus.offset ? [l.anchor, l.focus] : [l.focus, l.anchor];
			e.block <= o && n.block >= o && (u = Cs(t.source, e.block === o ? e.offset : 0, n.block === o ? n.offset : t.source.length));
		}
		let { edits: f, partial: p } = ys(t, a, {
			atoms: e.atoms,
			protect: u,
			rejected: c
		});
		r.delete(t), i.delete(t);
		let m = t;
		f.length && (e.apply(o, bs(t.source, f), (e) => Ss(e, f), xs(t.source, f)), m = e.blocks()[o], p && d(m.source, a), s.push({
			value: e.value(),
			pairs: f.map((e) => vs(t.source.slice(e.from, e.to), e.text))
		}), s.length > 50 && s.shift()), p && (r.add(m), i.add(m));
	}, p = (n, i) => {
		let s = new AbortController();
		a.set(n, s);
		let c = o.get(n.source), l;
		if (c !== void 0) l = Promise.resolve(c);
		else {
			let r = e.blocks(), a = r.slice(Math.max(0, i - 2), i).map((e) => e.source).join("\n\n").slice(-1e3), o = r.slice(i + 1, i + 2).map((e) => e.source).join("\n\n").slice(0, 500);
			try {
				l = Promise.resolve(t(n.source, {
					kind: n.kind,
					before: a,
					after: o,
					signal: s.signal
				}));
			} catch (e) {
				l = Promise.reject(e);
			}
		}
		l.then((e) => {
			a.get(n) === s && (a.delete(n), !(s.signal.aborted || typeof e != "string") && (d(n.source, e), f(n, e)));
		}, () => {
			a.get(n) === s && (a.delete(n), r.delete(n));
		});
	}, m = () => {
		if (!n || e.busy()) return;
		let t = e.blocks(), s = e.selection(), c = s ? Math.min(s.anchor.block, s.focus.block) : -1, l = s ? Math.max(s.anchor.block, s.focus.block) : -2;
		for (let e of r) {
			let n = t.indexOf(e);
			n < 0 ? (r.delete(e), i.delete(e)) : a.has(e) || n >= c && n <= l && (!u || i.has(e) && !o.has(e.source)) || p(e, n);
		}
	}, h = () => {
		clearTimeout(l);
		for (let e of a.values()) e.abort();
		a.clear(), r.clear(), i.clear(), u = !1;
	};
	return {
		get enabled() {
			return n;
		},
		set enabled(e) {
			n = e, e || h();
		},
		written(t, o) {
			if (!n) return;
			let s = e.blocks(), c = new Set(t), d = new Set(s), f = !1;
			for (let e of t) d.has(e) || (f ||= r.has(e), r.delete(e), i.delete(e), a.get(e)?.abort(), a.delete(e));
			if (o || f) for (let e of s) !c.has(e) && fs(e) && r.add(e);
			u = !1, clearTimeout(l), l = setTimeout(() => {
				u = !0, m();
			}, 400), m();
		},
		moved() {
			m();
		},
		undoing() {
			let t = e.value();
			for (let e = s.length - 1; e >= 0; e--) if (s[e].value === t) {
				for (let t of s[e].pairs) c.add(t);
				s.splice(e, 1);
				break;
			}
			h();
		},
		stop: h
	};
}
//#endregion
//#region src/shimmer.ts
var Ts = 60, Es = 6;
function Ds(e) {
	let t = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(e);
	if (t) return (.2126 * t[1] + .7152 * t[2] + .0722 * t[3]) / 255;
	let n = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(e);
	if (n) return .2126 * n[1] + .7152 * n[2] + .0722 * n[3];
	let r = /^ok(?:lch|lab)\(\s*([\d.]+)(%?)/.exec(e);
	if (r) return r[2] ? r[1] / 100 : +r[1];
	let i = /^(?:lch|lab)\(\s*([\d.]+)/.exec(e);
	return i ? i[1] / 100 : null;
}
function Os(e, t, n = e.closest("dialog") ?? e.ownerDocument.body) {
	let r = e.ownerDocument, i = r.defaultView;
	if (!i || !t.length || !e.isConnected || i.matchMedia?.("(forced-colors: active)").matches) return () => {};
	let a = i.getComputedStyle(e), o = [
		"--aa-shimmer",
		"--ds-accent-color",
		"--accent-color"
	].map((e) => a.getPropertyValue(e).trim()).find(Boolean), s = Ds(a.color), c = s === null ? !!i.matchMedia?.("(prefers-color-scheme: dark)").matches : s > .5, l = [];
	if (t.forEach(([t, n], i) => {
		let a = r.createRange();
		try {
			let r = Ya(e, t), i = Ya(e, n);
			a.setStart(r.node, r.offset), a.setEnd(i.node, i.offset);
		} catch {
			return;
		}
		if (!(a.collapsed || typeof a.getClientRects != "function")) for (let e of Array.from(a.getClientRects())) {
			if (e.width <= 0 || e.height <= 0) continue;
			let t = r.createElement("div");
			t.className = "aa-shimmer", t.setAttribute("aria-hidden", "true"), c && (t.dataset.dark = ""), Object.assign(t.style, {
				left: `${e.left}px`,
				top: `${e.top}px`,
				width: `${e.width}px`,
				height: `${e.height}px`,
				animationDelay: `${Math.min(i, Es) * Ts}ms`
			}), o && t.style.setProperty("--aa-shimmer-color", o), l.push(t);
		}
	}), !l.length) return () => {};
	n.append(...l);
	let u = () => {
		clearTimeout(d), r.removeEventListener("scroll", u, !0), i.removeEventListener("resize", u);
		for (let e of l) e.remove();
	}, d = setTimeout(u, 1360);
	return r.addEventListener("scroll", u, !0), i.addEventListener("resize", u), u;
}
//#endregion
//#region node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/css-tag.js
var ks = globalThis, As = ks.ShadowRoot && (ks.ShadyCSS === void 0 || ks.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, js = Symbol(), Ms = /* @__PURE__ */ new WeakMap(), Ns = class {
	constructor(e, t, n) {
		if (this._$cssResult$ = !0, n !== js) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, t = this.t;
		if (As && e === void 0) {
			let n = t !== void 0 && t.length === 1;
			n && (e = Ms.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && Ms.set(t, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, Ps = (e) => new Ns(typeof e == "string" ? e : e + "", void 0, js), Fs = (e, ...t) => new Ns(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, js), Is = (e, t) => {
	if (As) e.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let n of t) {
		let t = document.createElement("style"), r = ks.litNonce;
		r !== void 0 && t.setAttribute("nonce", r), t.textContent = n.cssText, e.appendChild(t);
	}
}, Ls = As ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return Ps(t);
})(e) : e, { is: Rs, defineProperty: zs, getOwnPropertyDescriptor: Bs, getOwnPropertyNames: Vs, getOwnPropertySymbols: Hs, getPrototypeOf: Us } = Object, Ws = globalThis, Gs = Ws.trustedTypes, Ks = Gs ? Gs.emptyScript : "", qs = Ws.reactiveElementPolyfillSupport, Js = (e, t) => e, Ys = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? Ks : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, Xs = (e, t) => !Rs(e, t), Zs = {
	attribute: !0,
	type: String,
	converter: Ys,
	reflect: !1,
	useDefault: !1,
	hasChanged: Xs
};
Symbol.metadata ??= Symbol("metadata"), Ws.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var Qs = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = Zs) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && zs(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = Bs(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? Zs;
	}
	static _$Ei() {
		if (this.hasOwnProperty(Js("elementProperties"))) return;
		let e = Us(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(Js("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Js("properties"))) {
			let e = this.properties, t = [...Vs(e), ...Hs(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(Ls(e));
		} else e !== void 0 && t.push(Ls(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return Is(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? Ys : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? Ys : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? Xs)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
Qs.elementStyles = [], Qs.shadowRootOptions = { mode: "open" }, Qs[Js("elementProperties")] = /* @__PURE__ */ new Map(), Qs[Js("finalized")] = /* @__PURE__ */ new Map(), qs?.({ ReactiveElement: Qs }), (Ws.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/lit-html.js
var $s = globalThis, ec = (e) => e, tc = $s.trustedTypes, nc = tc ? tc.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, rc = "$lit$", ic = `lit$${Math.random().toFixed(9).slice(2)}$`, ac = "?" + ic, oc = `<${ac}>`, sc = document, cc = () => sc.createComment(""), lc = (e) => e === null || typeof e != "object" && typeof e != "function", uc = Array.isArray, dc = (e) => uc(e) || typeof e?.[Symbol.iterator] == "function", fc = "[ 	\n\f\r]", pc = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, mc = /-->/g, hc = />/g, gc = RegExp(`>|${fc}(?:([^\\s"'>=/]+)(${fc}*=${fc}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), _c = /'/g, vc = /"/g, yc = /^(?:script|style|textarea|title)$/i, X = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), bc = Symbol.for("lit-noChange"), Z = Symbol.for("lit-nothing"), xc = /* @__PURE__ */ new WeakMap(), Sc = sc.createTreeWalker(sc, 129);
function Cc(e, t) {
	if (!uc(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return nc === void 0 ? t : nc.createHTML(t);
}
var wc = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = pc;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === pc ? c[1] === "!--" ? o = mc : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = gc) : (yc.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = gc) : o = hc : o === gc ? c[0] === ">" ? (o = i ?? pc, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? gc : c[3] === "\"" ? vc : _c) : o === vc || o === _c ? o = gc : o === mc || o === hc ? o = pc : (o = gc, i = void 0);
		let d = o === gc && e[t + 1].startsWith("/>") ? " " : "";
		a += o === pc ? n + oc : l >= 0 ? (r.push(s), n.slice(0, l) + rc + n.slice(l) + ic + d) : n + ic + (l === -2 ? t : d);
	}
	return [Cc(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Tc = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = wc(t, n);
		if (this.el = e.createElement(l, r), Sc.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = Sc.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(rc)) {
					let t = u[o++], n = i.getAttribute(e).split(ic), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ac : r[1] === "?" ? jc : r[1] === "@" ? Mc : kc
					}), i.removeAttribute(e);
				} else e.startsWith(ic) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (yc.test(i.tagName)) {
					let e = i.textContent.split(ic), t = e.length - 1;
					if (t > 0) {
						i.textContent = tc ? tc.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], cc()), Sc.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], cc());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === ac) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(ic, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += ic.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = sc.createElement("template");
		return n.innerHTML = e, n;
	}
};
function Ec(e, t, n = e, r) {
	if (t === bc) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = lc(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = Ec(e, i._$AS(e, t.values), i, r)), t;
}
var Dc = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? sc).importNode(t, !0);
		Sc.currentNode = r;
		let i = Sc.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Oc(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Nc(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = Sc.nextNode(), a++);
		}
		return Sc.currentNode = sc, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Oc = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = Z, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = Ec(this, e, t), lc(e) ? e === Z || e == null || e === "" ? (this._$AH !== Z && this._$AR(), this._$AH = Z) : e !== this._$AH && e !== bc && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? dc(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== Z && lc(this._$AH) ? this._$AA.nextSibling.data = e : this.T(sc.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Tc.createElement(Cc(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Dc(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = xc.get(e.strings);
		return t === void 0 && xc.set(e.strings, t = new Tc(e)), t;
	}
	k(t) {
		uc(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(cc()), this.O(cc()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ec(e).nextSibling;
			ec(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, kc = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = Z, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = Z;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = Ec(this, e, t, 0), a = !lc(e) || e !== this._$AH && e !== bc, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = Ec(this, r[n + o], t, o), s === bc && (s = this._$AH[o]), a ||= !lc(s) || s !== this._$AH[o], s === Z ? e = Z : e !== Z && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === Z ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ac = class extends kc {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === Z ? void 0 : e;
	}
}, jc = class extends kc {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== Z);
	}
}, Mc = class extends kc {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = Ec(this, e, t, 0) ?? Z) === bc) return;
		let n = this._$AH, r = e === Z && n !== Z || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== Z && (n === Z || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Nc = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		Ec(this, e);
	}
}, Pc = {
	M: rc,
	P: ic,
	A: ac,
	C: 1,
	L: wc,
	R: Dc,
	D: dc,
	V: Ec,
	I: Oc,
	H: kc,
	N: jc,
	U: Mc,
	B: Ac,
	F: Nc
}, Fc = $s.litHtmlPolyfillSupport;
Fc?.(Tc, Oc), ($s.litHtmlVersions ??= []).push("3.3.3");
var Ic = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Oc(t.insertBefore(cc(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Lc = globalThis, Rc = class extends Qs {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ic(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return bc;
	}
};
Rc._$litElement$ = !0, Rc.finalized = !0, Lc.litElementHydrateSupport?.({ LitElement: Rc });
var zc = Lc.litElementPolyfillSupport;
zc?.({ LitElement: Rc }), (Lc.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/vendor/ds1/0-face/define.ts
function Bc(e, t) {
	typeof customElements < "u" && (customElements.get(e) || customElements.define(e, t));
}
//#endregion
//#region src/vendor/ds1/0-face/cut-fade.ts
var Vc = "data-cut";
[
	".ds-row__name",
	".ds-sidebar__label",
	".ds-menu__item",
	".ds-badge__label",
	".ds-notice__title",
	".ds-notice__text",
	".ds-progress__label",
	".ds-stat__figure",
	".ds-document__toc-list a",
	".ds-footer__links a",
	".item-text"
].join(", ");
function Hc(e) {
	return e.scrollWidth > e.clientWidth + 1;
}
function Uc(e) {
	let t = [];
	for (let n of e) n.isConnected && t.push([n, Hc(n)]);
	tl();
	for (let [e, n] of t) {
		let t = e.getAttribute(Vc);
		n ? t !== "end" && e.setAttribute(Vc, "end") : t === "end" && e.removeAttribute(Vc);
	}
}
var Wc = /* @__PURE__ */ new Set(), Gc = /* @__PURE__ */ new Set(), Kc = !1, qc = (e) => {
	typeof requestAnimationFrame == "function" ? requestAnimationFrame(e) : setTimeout(e, 0);
};
function Jc() {
	Kc = !1;
	let e = [...Gc];
	Gc.clear();
	let t = /* @__PURE__ */ new Set();
	for (let n of e) if (!n.stopped) for (let e of n.refresh()) t.add(e);
	Uc(t);
}
function Yc(e) {
	e.stopped || (Gc.add(e), !Kc && (Kc = !0, qc(Jc)));
}
var Xc, Zc = /* @__PURE__ */ new Map();
function Qc(e) {
	if (typeof ResizeObserver > "u") return;
	Xc ??= new ResizeObserver((e) => Uc(e.map((e) => e.target)));
	let t = Zc.get(e) ?? 0;
	t || Xc.observe(e), Zc.set(e, t + 1);
}
function $c(e) {
	let t = Zc.get(e);
	t && (t > 1 ? Zc.set(e, t - 1) : (Zc.delete(e), Xc?.unobserve(e)));
}
var el = !1;
function tl() {
	if (el || typeof document > "u") return;
	el = !0;
	let e = () => {
		for (let e of Wc) Yc(e);
	}, t = document.fonts;
	t?.ready?.then(e, () => {}), t?.addEventListener?.("loadingdone", e);
}
function nl(e = {}) {
	let t = [], n = /* @__PURE__ */ new Set(), r = e.text && typeof MutationObserver < "u" ? new MutationObserver(() => Yc(a)) : void 0, i = () => {
		let e = /* @__PURE__ */ new Set();
		for (let n of t) {
			let t = typeof n == "function" ? n() : n instanceof Element ? [n] : n;
			for (let n of t) e.add(n);
		}
		return e;
	}, a = {
		stopped: !1,
		refresh() {
			let e = i(), t = e.size !== n.size;
			for (let r of n) e.has(r) || ($c(r), t = !0);
			for (let r of e) n.has(r) || (Qc(r), t = !0);
			if (r && t) {
				r.disconnect();
				for (let t of e) r.observe(t, {
					childList: !0,
					characterData: !0,
					subtree: !0
				});
			}
			return n = e, n;
		}
	};
	return Wc.add(a), {
		watch(e) {
			t.push(e), Yc(a);
		},
		select(e, n) {
			t.push(() => e.querySelectorAll(n)), Yc(a);
		},
		measure() {
			Yc(a);
		},
		disconnect() {
			a.stopped = !0, Wc.delete(a), Gc.delete(a);
			for (let e of n) $c(e);
			r?.disconnect(), n = /* @__PURE__ */ new Set(), t.length = 0;
		}
	};
}
var rl = class {
	watcher;
	words;
	host;
	options;
	constructor(e, t) {
		this.host = e, this.options = t, e.addController(this);
	}
	hostConnected() {
		this.hostDisconnected();
		let e = nl(), { selector: t, targets: n, text: r } = this.options;
		t && e.watch(() => (this.host.renderRoot ?? this.host).querySelectorAll(t)), n && e.watch(n), this.watcher = e, r && typeof MutationObserver < "u" && (this.words = new MutationObserver(() => this.measure()), this.words.observe(this.host, {
			childList: !0,
			characterData: !0,
			subtree: !0
		}));
	}
	hostUpdated() {
		this.measure();
	}
	hostDisconnected() {
		this.words?.disconnect(), this.words = void 0, this.watcher?.disconnect(), this.watcher = void 0;
	}
	measure() {
		this.watcher?.measure();
	}
}, il = [
	"da",
	"de",
	"en",
	"es",
	"fi",
	"fr",
	"is",
	"it",
	"ja",
	"ko",
	"nb",
	"nn",
	"no",
	"pt",
	"pt-BR",
	"sv",
	"zh"
], al = {
	da: {
		code: "da",
		label: "Danish",
		nativeLabel: "Dansk",
		aliases: ["da-dk"]
	},
	de: {
		code: "de",
		label: "German",
		nativeLabel: "Deutsch",
		aliases: [
			"de-de",
			"de-at",
			"de-ch"
		]
	},
	en: {
		code: "en",
		label: "English",
		nativeLabel: "English",
		aliases: [
			"en-us",
			"en-gb",
			"en-ca",
			"en-au",
			"en-nz",
			"en-ie"
		]
	},
	es: {
		code: "es",
		label: "Spanish",
		nativeLabel: "Español",
		aliases: [
			"es-es",
			"es-mx",
			"es-ar",
			"es-cl",
			"es-co"
		]
	},
	fi: {
		code: "fi",
		label: "Finnish",
		nativeLabel: "Suomi",
		aliases: ["fi-fi"]
	},
	fr: {
		code: "fr",
		label: "French",
		nativeLabel: "Français",
		aliases: [
			"fr-fr",
			"fr-ca",
			"fr-be",
			"fr-ch"
		]
	},
	is: {
		code: "is",
		label: "Icelandic",
		nativeLabel: "Íslenska",
		aliases: ["is-is"]
	},
	it: {
		code: "it",
		label: "Italian",
		nativeLabel: "Italiano",
		aliases: ["it-it", "it-ch"]
	},
	ja: {
		code: "ja",
		label: "Japanese",
		nativeLabel: "日本語",
		aliases: ["ja-jp"]
	},
	ko: {
		code: "ko",
		label: "Korean",
		nativeLabel: "한국어",
		aliases: ["ko-kr"]
	},
	nb: {
		code: "nb",
		label: "Norwegian Bokmål",
		nativeLabel: "Norsk bokmål",
		aliases: ["nb-no"]
	},
	nn: {
		code: "nn",
		label: "Norwegian Nynorsk",
		nativeLabel: "Norsk nynorsk",
		aliases: ["nn-no"]
	},
	no: {
		code: "no",
		label: "Norwegian",
		nativeLabel: "Norsk",
		aliases: ["no-no"]
	},
	pt: {
		code: "pt",
		label: "Portuguese",
		nativeLabel: "Português",
		aliases: ["pt-pt"]
	},
	"pt-BR": {
		code: "pt-BR",
		label: "Brazilian Portuguese",
		nativeLabel: "Português (Brasil)",
		aliases: ["pt-br"]
	},
	sv: {
		code: "sv",
		label: "Swedish",
		nativeLabel: "Svenska",
		aliases: ["sv-se", "sv-fi"]
	},
	zh: {
		code: "zh",
		label: "Chinese",
		nativeLabel: "中文",
		aliases: [
			"zh-cn",
			"zh-tw",
			"zh-hk",
			"zh-sg",
			"zh-hans",
			"zh-hant"
		]
	}
}, ol = {
	nb: ["no", "nn"],
	no: ["nb", "nn"],
	nn: ["nb", "no"],
	pt: ["pt-BR"],
	"pt-BR": ["pt"]
}, sl = /* @__PURE__ */ new Map();
for (let e of il) {
	sl.set(e.toLowerCase(), e);
	for (let t of al[e].aliases) sl.set(t, e);
}
var cl = new Map(il.map((e, t) => [e, t]));
function ll(e) {
	return typeof e == "string" && cl.has(e);
}
function ul(e) {
	return e.split("-")[0] ?? "";
}
function dl(e, t) {
	return t.has(e) ? e : ol[e]?.find((e) => t.has(e)) ?? null;
}
function fl(e, t = "en", n = il) {
	let r = new Set(n), i = String(e ?? "").split(",").map((e) => e.split(";")[0]?.trim().toLowerCase().replace(/_/g, "-") ?? "").filter(Boolean);
	for (let e of i) {
		let t = sl.get(e), n = t ? dl(t, r) : null;
		if (n) return n;
		let i = sl.get(ul(e)), a = i ? dl(i, r) : null;
		if (a) return a;
	}
	return t;
}
function pl(e) {
	let t = [], n = (e) => {
		e && !t.includes(e) && t.push(e);
	};
	n(e);
	let r = String(e ?? "").toLowerCase().replace(/_/g, "-"), i = sl.get(r);
	n(i), n(ul(r));
	let a = i ?? sl.get(ul(r));
	for (let e of a ? ol[a] ?? [] : []) n(e);
	return t;
}
//#endregion
//#region src/vendor/ds1/0-face/language-routing.ts
var ml = {};
function hl(e) {
	ml = {
		...ml,
		...e
	};
}
function gl(e) {
	let t = {
		...ml,
		...e
	};
	return {
		languages: t.languages?.length ? t.languages : il,
		defaultLanguage: t.defaultLanguage || "en",
		prefixDefaultLanguage: t.prefixDefaultLanguage ?? !1
	};
}
function _l(e) {
	return String(e ?? "").toLowerCase().replace(/_/g, "-");
}
function vl(e, t = gl().languages) {
	let n = _l(e);
	return n ? t.find((e) => _l(e) === n) ?? null : null;
}
function yl(e) {
	let t = e.search(/[?#]/);
	return t === -1 ? [e, ""] : [e.slice(0, t), e.slice(t)];
}
function bl(e, t) {
	let { languages: n } = gl(t), [r, i] = yl(e || "/"), a = r.startsWith("/") ? r : `/${r}`, o = a.split("/")[1] ?? "", s = vl(o, n);
	return s ? {
		language: s,
		restPath: `${a.slice(o.length + 1) || "/"}${i}`
	} : {
		language: null,
		restPath: `${a}${i}`
	};
}
//#endregion
//#region src/vendor/ds1/0-face/translations-format.ts
var xl = "en", Sl = /\{\{\s*([\w.-]+)\s*\}\}|\{([\w.-]+)\}/g;
function Cl(e, t) {
	return t ? e.replace(Sl, (e, n, r) => {
		let i = n ?? r;
		return Object.prototype.hasOwnProperty.call(t, i) ? String(t[i]) : e;
	}) : e;
}
function wl(e, t, n, r) {
	let i = pl(t);
	i.includes(xl) || i.push(xl);
	for (let t of i) for (let i of n) {
		let n = i?.[t]?.[e];
		if (n) return {
			text: Cl(n, r),
			language: t
		};
	}
	return {
		text: Cl(e, r),
		language: null
	};
}
function Tl(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function El(e, t) {
	if (!Tl(t)) return null;
	let n = t[e];
	if (Tl(n)) return t;
	let r = Object.values(t);
	return r.length > 0 && r.every((e) => typeof e == "string") ? { [e]: t } : r.length > 0 && r.every(Tl) ? t : null;
}
//#endregion
//#region src/vendor/ds1/0-face/translations/da.json
var Dl, Ol, kl = t((() => {
	Dl = {
		Save: "Gem",
		Cancel: "Annuller",
		Delete: "Slet",
		Close: "Luk",
		Back: "Tilbage",
		Next: "Næste",
		Done: "Færdig",
		Continue: "Fortsæt",
		Search: "Søg",
		Edit: "Rediger",
		Yes: "Ja",
		No: "Nej",
		"Sign in": "Log ind",
		"Sign out": "Log ud",
		Email: "E-mail",
		Password: "Adgangskode",
		"Nothing here yet": "Intet her endnu",
		Loading: "Indlæser",
		"{value} of {max}": "{value} af {max}",
		"{value} of {max}, over by {over}": "{value} af {max}, {over} for meget",
		Failed: "Mislykkedes",
		Today: "I dag",
		Yesterday: "I går",
		Tomorrow: "I morgen",
		Settings: "Indstillinger",
		Language: "Sprog",
		Theme: "Tema",
		Light: "Lys",
		Dark: "Mørk",
		System: "System",
		Shape: "Form",
		Square: "Firkantet",
		Rounded: "Afrundet",
		Circular: "Cirkulær",
		Note: "Note",
		Page: "Side",
		Red: "Rød",
		Orange: "Orange",
		Yellow: "Gul",
		"Apple green": "Æblegrøn",
		Green: "Grøn",
		"Light blue": "Lyseblå",
		Blue: "Blå",
		Pink: "Lyserød",
		"This is a beta version": "Dette er en betaversion",
		"Report issue": "Rapportér et problem",
		"Issue report": "Problemrapport",
		"Describe the issue:": "Beskriv problemet:",
		"App version:": "App-version:",
		Danish: "Dansk",
		German: "Tysk",
		English: "Engelsk",
		Spanish: "Spansk",
		Finnish: "Finsk",
		French: "Fransk",
		Icelandic: "Islandsk",
		Italian: "Italiensk",
		Japanese: "Japansk",
		Korean: "Koreansk",
		"Norwegian Bokmål": "Norsk bokmål",
		"Norwegian Nynorsk": "Nynorsk",
		Norwegian: "Norsk",
		Portuguese: "Portugisisk",
		"Brazilian Portuguese": "Brasiliansk portugisisk",
		Swedish: "Svensk",
		Chinese: "Kinesisk",
		"Show password": "Vis adgangskode",
		"Hide password": "Skjul adgangskode",
		OK: "OK",
		Copied: "Kopieret",
		"Could not copy": "Kunne ikke kopiere",
		Notifications: "Notifikationer",
		"Try again": "Prøv igen",
		Undo: "Fortryd",
		Redo: "Gentag",
		Copy: "Kopiér",
		"Copy link": "Kopiér link",
		Remove: "Fjern",
		Rename: "Omdøb",
		Duplicate: "Dupliker",
		Download: "Hent",
		Refresh: "Opdater",
		Open: "Åbn",
		Send: "Send",
		Clear: "Ryd",
		Saved: "Gemt",
		"Saving…": "Gemmer…",
		Untitled: "Uden titel",
		Account: "Konto",
		Carousel: "Karrusel",
		Slide: "Dias",
		Slides: "Dias",
		"Slide {index}": "Dias {index}",
		"{index} of {count}": "{index} af {count}",
		"Previous slide": "Forrige dias",
		"Next slide": "Næste dias",
		"Move row {index}": "Flyt række {index}",
		"Row {from} moved to {to}": "Række {from} flyttet til {to}",
		Pause: "Pause",
		Play: "Afspil",
		Menu: "Menu",
		Contents: "Indhold",
		"key.ctrl": "Ctrl",
		"key.shift": "Skift",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "Mellemrum",
		"key.backspace": "Backspace",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "Forrige måned",
		"Next month": "Næste måned",
		"Previous year": "Forrige år",
		"Next year": "Næste år",
		"Earlier years": "Tidligere år",
		"Later years": "Senere år",
		"Choose a month and year": "Vælg måned og år",
		"Choose a date": "Vælg en dato",
		Date: "Dato",
		"W{week}": "U{week}",
		Total: "I alt",
		"End date": "Slutdato",
		"Include time": "Medtag klokkeslæt",
		Time: "Klokkeslæt"
	}, Ol = { da: Dl };
})), Al, jl, Ml = t((() => {
	Al = {
		Save: "Speichern",
		Cancel: "Abbrechen",
		Delete: "Löschen",
		Close: "Schließen",
		Back: "Zurück",
		Next: "Weiter",
		Done: "Fertig",
		Continue: "Weiter",
		Search: "Suchen",
		Edit: "Bearbeiten",
		Yes: "Ja",
		No: "Nein",
		"Sign in": "Anmelden",
		"Sign out": "Abmelden",
		Email: "E-Mail",
		Password: "Passwort",
		"Nothing here yet": "Hier ist noch nichts",
		Loading: "Wird geladen",
		"{value} of {max}": "{value} von {max}",
		"{value} of {max}, over by {over}": "{value} von {max}, {over} darüber",
		Failed: "Fehlgeschlagen",
		Today: "Heute",
		Yesterday: "Gestern",
		Tomorrow: "Morgen",
		Settings: "Einstellungen",
		Language: "Sprache",
		Theme: "Thema",
		Light: "Hell",
		Dark: "Dunkel",
		System: "System",
		Shape: "Form",
		Square: "Eckig",
		Rounded: "Abgerundet",
		Circular: "Rund",
		Note: "Notiz",
		Page: "Seite",
		Red: "Rot",
		Orange: "Orange",
		Yellow: "Gelb",
		"Apple green": "Apfelgrün",
		Green: "Grün",
		"Light blue": "Hellblau",
		Blue: "Blau",
		Pink: "Rosa",
		"This is a beta version": "Dies ist eine Betaversion",
		"Report issue": "Problem melden",
		"Issue report": "Problembericht",
		"Describe the issue:": "Beschreiben Sie das Problem:",
		"App version:": "App-Version:",
		Danish: "Dänisch",
		German: "Deutsch",
		English: "Englisch",
		Spanish: "Spanisch",
		Finnish: "Finnisch",
		French: "Französisch",
		Icelandic: "Isländisch",
		Italian: "Italienisch",
		Japanese: "Japanisch",
		Korean: "Koreanisch",
		"Norwegian Bokmål": "Norwegisch (Bokmål)",
		"Norwegian Nynorsk": "Norwegisch (Nynorsk)",
		Norwegian: "Norwegisch",
		Portuguese: "Portugiesisch",
		"Brazilian Portuguese": "Brasilianisches Portugiesisch",
		Swedish: "Schwedisch",
		Chinese: "Chinesisch",
		"Show password": "Passwort anzeigen",
		"Hide password": "Passwort verbergen",
		OK: "OK",
		Copied: "Kopiert",
		"Could not copy": "Kopieren fehlgeschlagen",
		Notifications: "Mitteilungen",
		"Try again": "Erneut versuchen",
		Undo: "Widerrufen",
		Redo: "Wiederholen",
		Copy: "Kopieren",
		"Copy link": "Link kopieren",
		Remove: "Entfernen",
		Rename: "Umbenennen",
		Duplicate: "Duplizieren",
		Download: "Herunterladen",
		Refresh: "Aktualisieren",
		Open: "Öffnen",
		Send: "Senden",
		Clear: "Leeren",
		Saved: "Gespeichert",
		"Saving…": "Wird gespeichert …",
		Untitled: "Ohne Titel",
		Account: "Konto",
		Carousel: "Karussell",
		Slide: "Folie",
		Slides: "Folien",
		"Slide {index}": "Folie {index}",
		"{index} of {count}": "{index} von {count}",
		"Previous slide": "Vorherige Folie",
		"Next slide": "Nächste Folie",
		"Move row {index}": "Zeile {index} verschieben",
		"Row {from} moved to {to}": "Zeile {from} nach {to} verschoben",
		Pause: "Pause",
		Play: "Abspielen",
		Menu: "Menü",
		Contents: "Inhalt",
		"key.ctrl": "Strg",
		"key.shift": "Umschalt",
		"key.alt": "Alt",
		"key.enter": "Eingabe",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "Leertaste",
		"key.backspace": "Rücktaste",
		"key.delete": "Entf",
		"key.home": "Pos1",
		"key.end": "Ende",
		"key.pageup": "Bild auf",
		"key.pagedown": "Bild ab",
		"Previous month": "Vorheriger Monat",
		"Next month": "Nächster Monat",
		"Previous year": "Vorheriges Jahr",
		"Next year": "Nächstes Jahr",
		"Earlier years": "Frühere Jahre",
		"Later years": "Spätere Jahre",
		"Choose a month and year": "Monat und Jahr wählen",
		"Choose a date": "Datum wählen",
		Date: "Datum",
		"W{week}": "KW{week}",
		Total: "Gesamt",
		"End date": "Enddatum",
		"Include time": "Uhrzeit hinzufügen",
		Time: "Uhrzeit"
	}, jl = { de: Al };
})), Nl, Pl, Fl = t((() => {
	Nl = {
		Save: "Save",
		Cancel: "Cancel",
		Delete: "Delete",
		Close: "Close",
		Back: "Back",
		Next: "Next",
		Done: "Done",
		Continue: "Continue",
		Search: "Search",
		Edit: "Edit",
		Yes: "Yes",
		No: "No",
		"Sign in": "Sign in",
		"Sign out": "Sign out",
		Email: "Email",
		Password: "Password",
		"Nothing here yet": "Nothing here yet",
		Loading: "Loading",
		"{value} of {max}": "{value} of {max}",
		"{value} of {max}, over by {over}": "{value} of {max}, over by {over}",
		Failed: "Failed",
		Today: "Today",
		Yesterday: "Yesterday",
		Tomorrow: "Tomorrow",
		Settings: "Settings",
		Language: "Language",
		Theme: "Theme",
		Light: "Light",
		Dark: "Dark",
		System: "System",
		Shape: "Shape",
		Square: "Square",
		Rounded: "Rounded",
		Circular: "Circular",
		Note: "Note",
		Page: "Page",
		Red: "Red",
		Orange: "Orange",
		Yellow: "Yellow",
		"Apple green": "Apple green",
		Green: "Green",
		"Light blue": "Light blue",
		Blue: "Blue",
		Pink: "Pink",
		"This is a beta version": "This is a beta version",
		"Report issue": "Report issue",
		"Issue report": "Issue report",
		"Describe the issue:": "Describe the issue:",
		"App version:": "App version:",
		Danish: "Danish",
		German: "German",
		English: "English",
		Spanish: "Spanish",
		Finnish: "Finnish",
		French: "French",
		Icelandic: "Icelandic",
		Italian: "Italian",
		Japanese: "Japanese",
		Korean: "Korean",
		"Norwegian Bokmål": "Norwegian Bokmål",
		"Norwegian Nynorsk": "Norwegian Nynorsk",
		Norwegian: "Norwegian",
		Portuguese: "Portuguese",
		"Brazilian Portuguese": "Brazilian Portuguese",
		Swedish: "Swedish",
		Chinese: "Chinese",
		"Show password": "Show password",
		"Hide password": "Hide password",
		OK: "OK",
		Copied: "Copied",
		"Could not copy": "Could not copy",
		Notifications: "Notifications",
		"Try again": "Try again",
		Undo: "Undo",
		Redo: "Redo",
		Copy: "Copy",
		"Copy link": "Copy link",
		Remove: "Remove",
		Rename: "Rename",
		Duplicate: "Duplicate",
		Download: "Download",
		Refresh: "Refresh",
		Open: "Open",
		Send: "Send",
		Clear: "Clear",
		Saved: "Saved",
		"Saving…": "Saving…",
		Untitled: "Untitled",
		Account: "Account",
		Carousel: "Carousel",
		Slide: "Slide",
		Slides: "Slides",
		"Slide {index}": "Slide {index}",
		"{index} of {count}": "{index} of {count}",
		"Previous slide": "Previous slide",
		"Next slide": "Next slide",
		"Move row {index}": "Move row {index}",
		"Row {from} moved to {to}": "Row {from} moved to {to}",
		Pause: "Pause",
		Play: "Play",
		Menu: "Menu",
		Contents: "Contents",
		"key.ctrl": "Ctrl",
		"key.shift": "Shift",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "Space",
		"key.backspace": "Backspace",
		"key.delete": "Del",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "PgUp",
		"key.pagedown": "PgDn",
		"Previous month": "Previous month",
		"Next month": "Next month",
		"Previous year": "Previous year",
		"Next year": "Next year",
		"Earlier years": "Earlier years",
		"Later years": "Later years",
		"Choose a month and year": "Choose a month and year",
		"Choose a date": "Choose a date",
		Date: "Date",
		"W{week}": "W{week}",
		Total: "Total",
		"End date": "End date",
		"Include time": "Include time",
		Time: "Time"
	}, Pl = { en: Nl };
})), Il, Ll, Rl = t((() => {
	Il = {
		Save: "Guardar",
		Cancel: "Cancelar",
		Delete: "Eliminar",
		Close: "Cerrar",
		Back: "Atrás",
		Next: "Siguiente",
		Done: "Listo",
		Continue: "Continuar",
		Search: "Buscar",
		Edit: "Editar",
		Yes: "Sí",
		No: "No",
		"Sign in": "Iniciar sesión",
		"Sign out": "Cerrar sesión",
		Email: "Correo electrónico",
		Password: "Contraseña",
		"Nothing here yet": "Aún no hay nada aquí",
		Loading: "Cargando",
		"{value} of {max}": "{value} de {max}",
		"{value} of {max}, over by {over}": "{value} de {max}, {over} de más",
		Failed: "Fallido",
		Today: "Hoy",
		Yesterday: "Ayer",
		Tomorrow: "Mañana",
		Settings: "Ajustes",
		Language: "Idioma",
		Theme: "Tema",
		Light: "Claro",
		Dark: "Oscuro",
		System: "Sistema",
		Shape: "Forma",
		Square: "Cuadrada",
		Rounded: "Redondeada",
		Circular: "Circular",
		Note: "Nota",
		Page: "Página",
		Red: "Rojo",
		Orange: "Naranja",
		Yellow: "Amarillo",
		"Apple green": "Verde manzana",
		Green: "Verde",
		"Light blue": "Azul claro",
		Blue: "Azul",
		Pink: "Rosa",
		"This is a beta version": "Esta es una versión beta",
		"Report issue": "Informar de un problema",
		"Issue report": "Informe de problema",
		"Describe the issue:": "Describe el problema:",
		"App version:": "Versión de la app:",
		Danish: "Danés",
		German: "Alemán",
		English: "Inglés",
		Spanish: "Español",
		Finnish: "Finés",
		French: "Francés",
		Icelandic: "Islandés",
		Italian: "Italiano",
		Japanese: "Japonés",
		Korean: "Coreano",
		"Norwegian Bokmål": "Noruego bokmal",
		"Norwegian Nynorsk": "Noruego nynorsk",
		Norwegian: "Noruego",
		Portuguese: "Portugués",
		"Brazilian Portuguese": "Portugués de Brasil",
		Swedish: "Sueco",
		Chinese: "Chino",
		"Show password": "Mostrar contraseña",
		"Hide password": "Ocultar contraseña",
		OK: "Aceptar",
		Copied: "Copiado",
		"Could not copy": "No se pudo copiar",
		Notifications: "Notificaciones",
		"Try again": "Reintentar",
		Undo: "Deshacer",
		Redo: "Rehacer",
		Copy: "Copiar",
		"Copy link": "Copiar enlace",
		Remove: "Quitar",
		Rename: "Renombrar",
		Duplicate: "Duplicar",
		Download: "Descargar",
		Refresh: "Actualizar",
		Open: "Abrir",
		Send: "Enviar",
		Clear: "Borrar",
		Saved: "Guardado",
		"Saving…": "Guardando…",
		Untitled: "Sin título",
		Account: "Cuenta",
		Carousel: "Carrusel",
		Slide: "Diapositiva",
		Slides: "Diapositivas",
		"Slide {index}": "Diapositiva {index}",
		"{index} of {count}": "{index} de {count}",
		"Previous slide": "Diapositiva anterior",
		"Next slide": "Diapositiva siguiente",
		"Move row {index}": "Mover fila {index}",
		"Row {from} moved to {to}": "Fila {from} movida a {to}",
		Pause: "Pausar",
		Play: "Reproducir",
		Menu: "Menú",
		Contents: "Contenido",
		"key.ctrl": "Ctrl",
		"key.shift": "Mayús",
		"key.alt": "Alt",
		"key.enter": "Entrar",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "Espacio",
		"key.backspace": "Retroceso",
		"key.delete": "Supr",
		"key.home": "Inicio",
		"key.end": "Fin",
		"key.pageup": "Re Pág",
		"key.pagedown": "Av Pág",
		"Previous month": "Mes anterior",
		"Next month": "Mes siguiente",
		"Previous year": "Año anterior",
		"Next year": "Año siguiente",
		"Earlier years": "Años anteriores",
		"Later years": "Años siguientes",
		"Choose a month and year": "Elegir mes y año",
		"Choose a date": "Elegir una fecha",
		Date: "Fecha",
		"W{week}": "S{week}",
		Total: "Total",
		"End date": "Fecha de fin",
		"Include time": "Incluir hora",
		Time: "Hora"
	}, Ll = { es: Il };
})), zl, Bl, Vl = t((() => {
	zl = {
		Save: "Tallenna",
		Cancel: "Peruuta",
		Delete: "Poista",
		Close: "Sulje",
		Back: "Takaisin",
		Next: "Seuraava",
		Done: "Valmis",
		Continue: "Jatka",
		Search: "Hae",
		Edit: "Muokkaa",
		Yes: "Kyllä",
		No: "Ei",
		"Sign in": "Kirjaudu sisään",
		"Sign out": "Kirjaudu ulos",
		Email: "Sähköposti",
		Password: "Salasana",
		"Nothing here yet": "Täällä ei ole vielä mitään",
		Loading: "Ladataan",
		"{value} of {max}": "{value}/{max}",
		"{value} of {max}, over by {over}": "{value}/{max}, {over} yli",
		Failed: "Epäonnistui",
		Today: "Tänään",
		Yesterday: "Eilen",
		Tomorrow: "Huomenna",
		Settings: "Asetukset",
		Language: "Kieli",
		Theme: "Teema",
		Light: "Vaalea",
		Dark: "Tumma",
		System: "Järjestelmä",
		Shape: "Muoto",
		Square: "Kulmikas",
		Rounded: "Pyöristetty",
		Circular: "Pyöreä",
		Note: "Muistiinpano",
		Page: "Sivu",
		Red: "Punainen",
		Orange: "Oranssi",
		Yellow: "Keltainen",
		"Apple green": "Omenanvihreä",
		Green: "Vihreä",
		"Light blue": "Vaaleansininen",
		Blue: "Sininen",
		Pink: "Vaaleanpunainen",
		"This is a beta version": "Tämä on beetaversio",
		"Report issue": "Ilmoita ongelmasta",
		"Issue report": "Ongelmaraportti",
		"Describe the issue:": "Kuvaile ongelma:",
		"App version:": "Sovelluksen versio:",
		Danish: "Tanska",
		German: "Saksa",
		English: "Englanti",
		Spanish: "Espanja",
		Finnish: "Suomi",
		French: "Ranska",
		Icelandic: "Islanti",
		Italian: "Italia",
		Japanese: "Japani",
		Korean: "Korea",
		"Norwegian Bokmål": "Norjan bokmål",
		"Norwegian Nynorsk": "Norjan nynorsk",
		Norwegian: "Norja",
		Portuguese: "Portugali",
		"Brazilian Portuguese": "Brasilianportugali",
		Swedish: "Ruotsi",
		Chinese: "Kiina",
		"Show password": "Näytä salasana",
		"Hide password": "Piilota salasana",
		OK: "OK",
		Copied: "Kopioitu",
		"Could not copy": "Kopiointi epäonnistui",
		Notifications: "Ilmoitukset",
		"Try again": "Yritä uudelleen",
		Undo: "Kumoa",
		Redo: "Tee uudelleen",
		Copy: "Kopioi",
		"Copy link": "Kopioi linkki",
		Remove: "Poista",
		Rename: "Nimeä uudelleen",
		Duplicate: "Monista",
		Download: "Lataa",
		Refresh: "Päivitä",
		Open: "Avaa",
		Send: "Lähetä",
		Clear: "Tyhjennä",
		Saved: "Tallennettu",
		"Saving…": "Tallennetaan…",
		Untitled: "Nimetön",
		Account: "Tili",
		Carousel: "Karuselli",
		Slide: "Dia",
		Slides: "Diat",
		"Slide {index}": "Dia {index}",
		"{index} of {count}": "{index}/{count}",
		"Previous slide": "Edellinen dia",
		"Next slide": "Seuraava dia",
		"Move row {index}": "Siirrä riviä {index}",
		"Row {from} moved to {to}": "Rivi {from} siirretty kohtaan {to}",
		Pause: "Tauko",
		Play: "Toista",
		Menu: "Valikko",
		Contents: "Sisällys",
		"key.ctrl": "Ctrl",
		"key.shift": "Vaihto",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Sarkain",
		"key.space": "Välilyönti",
		"key.backspace": "Askelpalautin",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "Edellinen kuukausi",
		"Next month": "Seuraava kuukausi",
		"Previous year": "Edellinen vuosi",
		"Next year": "Seuraava vuosi",
		"Earlier years": "Aiemmat vuodet",
		"Later years": "Myöhemmät vuodet",
		"Choose a month and year": "Valitse kuukausi ja vuosi",
		"Choose a date": "Valitse päivämäärä",
		Date: "Päivämäärä",
		"W{week}": "Vk{week}",
		Total: "Yhteensä",
		"End date": "Päättymispäivä",
		"Include time": "Sisällytä kellonaika",
		Time: "Kellonaika"
	}, Bl = { fi: zl };
})), Hl, Ul, Wl = t((() => {
	Hl = {
		Save: "Enregistrer",
		Cancel: "Annuler",
		Delete: "Supprimer",
		Close: "Fermer",
		Back: "Retour",
		Next: "Suivant",
		Done: "Terminé",
		Continue: "Continuer",
		Search: "Rechercher",
		Edit: "Modifier",
		Yes: "Oui",
		No: "Non",
		"Sign in": "Se connecter",
		"Sign out": "Se déconnecter",
		Email: "E-mail",
		Password: "Mot de passe",
		"Nothing here yet": "Rien ici pour l’instant",
		Loading: "Chargement",
		"{value} of {max}": "{value} sur {max}",
		"{value} of {max}, over by {over}": "{value} sur {max}, dépassé de {over}",
		Failed: "Échec",
		Today: "Aujourd’hui",
		Yesterday: "Hier",
		Tomorrow: "Demain",
		Settings: "Paramètres",
		Language: "Langue",
		Theme: "Thème",
		Light: "Clair",
		Dark: "Sombre",
		System: "Système",
		Shape: "Forme",
		Square: "Carrée",
		Rounded: "Arrondie",
		Circular: "Circulaire",
		Note: "Note",
		Page: "Page",
		Red: "Rouge",
		Orange: "Orange",
		Yellow: "Jaune",
		"Apple green": "Vert pomme",
		Green: "Vert",
		"Light blue": "Bleu clair",
		Blue: "Bleu",
		Pink: "Rose",
		"This is a beta version": "Ceci est une version bêta",
		"Report issue": "Signaler un problème",
		"Issue report": "Rapport de problème",
		"Describe the issue:": "Décrivez le problème :",
		"App version:": "Version de l’app :",
		Danish: "Danois",
		German: "Allemand",
		English: "Anglais",
		Spanish: "Espagnol",
		Finnish: "Finnois",
		French: "Français",
		Icelandic: "Islandais",
		Italian: "Italien",
		Japanese: "Japonais",
		Korean: "Coréen",
		"Norwegian Bokmål": "Norvégien bokmål",
		"Norwegian Nynorsk": "Norvégien nynorsk",
		Norwegian: "Norvégien",
		Portuguese: "Portugais",
		"Brazilian Portuguese": "Portugais brésilien",
		Swedish: "Suédois",
		Chinese: "Chinois",
		"Show password": "Afficher le mot de passe",
		"Hide password": "Masquer le mot de passe",
		OK: "OK",
		Copied: "Copié",
		"Could not copy": "Impossible de copier",
		Notifications: "Notifications",
		"Try again": "Réessayer",
		Undo: "Annuler",
		Redo: "Rétablir",
		Copy: "Copier",
		"Copy link": "Copier le lien",
		Remove: "Retirer",
		Rename: "Renommer",
		Duplicate: "Dupliquer",
		Download: "Télécharger",
		Refresh: "Actualiser",
		Open: "Ouvrir",
		Send: "Envoyer",
		Clear: "Effacer",
		Saved: "Enregistré",
		"Saving…": "Enregistrement…",
		Untitled: "Sans titre",
		Account: "Compte",
		Carousel: "Carrousel",
		Slide: "Diapositive",
		Slides: "Diapositives",
		"Slide {index}": "Diapositive {index}",
		"{index} of {count}": "{index} sur {count}",
		"Previous slide": "Diapositive précédente",
		"Next slide": "Diapositive suivante",
		"Move row {index}": "Déplacer la ligne {index}",
		"Row {from} moved to {to}": "Ligne {from} déplacée en {to}",
		Pause: "Pause",
		Play: "Lecture",
		Menu: "Menu",
		Contents: "Sommaire",
		"key.ctrl": "Ctrl",
		"key.shift": "Maj",
		"key.alt": "Alt",
		"key.enter": "Entrée",
		"key.escape": "Échap",
		"key.tab": "Tab",
		"key.space": "Espace",
		"key.backspace": "Retour arrière",
		"key.delete": "Suppr",
		"key.home": "Origine",
		"key.end": "Fin",
		"key.pageup": "Page préc.",
		"key.pagedown": "Page suiv.",
		"Previous month": "Mois précédent",
		"Next month": "Mois suivant",
		"Previous year": "Année précédente",
		"Next year": "Année suivante",
		"Earlier years": "Années précédentes",
		"Later years": "Années suivantes",
		"Choose a month and year": "Choisir le mois et l’année",
		"Choose a date": "Choisir une date",
		Date: "Date",
		"W{week}": "S{week}",
		Total: "Total",
		"End date": "Date de fin",
		"Include time": "Inclure l’heure",
		Time: "Heure"
	}, Ul = { fr: Hl };
})), Gl, Kl, ql = t((() => {
	Gl = {
		Save: "Vista",
		Cancel: "Hætta við",
		Delete: "Eyða",
		Close: "Loka",
		Back: "Til baka",
		Next: "Næsta",
		Done: "Lokið",
		Continue: "Halda áfram",
		Search: "Leita",
		Edit: "Breyta",
		Yes: "Já",
		No: "Nei",
		"Sign in": "Skrá inn",
		"Sign out": "Skrá út",
		Email: "Netfang",
		Password: "Lykilorð",
		"Nothing here yet": "Ekkert hér enn",
		Loading: "Hleður",
		"{value} of {max}": "{value} af {max}",
		"{value} of {max}, over by {over}": "{value} af {max}, {over} umfram",
		Failed: "Mistókst",
		Today: "Í dag",
		Yesterday: "Í gær",
		Tomorrow: "Á morgun",
		Settings: "Stillingar",
		Language: "Tungumál",
		Theme: "Þema",
		Light: "Ljóst",
		Dark: "Dökkt",
		System: "Kerfi",
		Shape: "Lögun",
		Square: "Ferhyrnt",
		Rounded: "Ávalt",
		Circular: "Hringlaga",
		Page: "Síða",
		Red: "Rauður",
		Orange: "Appelsínugulur",
		Yellow: "Gulur",
		Green: "Grænn",
		"Light blue": "Ljósblár",
		Blue: "Blár",
		Pink: "Bleikur",
		Danish: "Danska",
		German: "Þýska",
		English: "Enska",
		Spanish: "Spænska",
		Finnish: "Finnska",
		French: "Franska",
		Icelandic: "Íslenska",
		Italian: "Ítalska",
		Japanese: "Japanska",
		Korean: "Kóreska",
		"Norwegian Bokmål": "Norskt bókmál",
		"Norwegian Nynorsk": "Nýnorska",
		Norwegian: "Norska",
		Portuguese: "Portúgalska",
		"Brazilian Portuguese": "Brasílísk portúgalska",
		Swedish: "Sænska",
		Chinese: "Kínverska",
		"Show password": "Sýna lykilorð",
		"Hide password": "Fela lykilorð",
		OK: "Í lagi",
		Copied: "Afritað",
		"Could not copy": "Ekki tókst að afrita",
		Notifications: "Tilkynningar",
		"Try again": "Reyna aftur",
		Undo: "Afturkalla",
		Redo: "Endurgera",
		Copy: "Afrita",
		"Copy link": "Afrita tengil",
		Remove: "Fjarlægja",
		Rename: "Endurnefna",
		Duplicate: "Tvítaka",
		Download: "Sækja",
		Refresh: "Endurnýja",
		Open: "Opna",
		Send: "Senda",
		Clear: "Hreinsa",
		Saved: "Vistað",
		"Saving…": "Vistar…",
		Untitled: "Ónefnt",
		Account: "Aðgangur",
		Carousel: "Hringekja",
		Slide: "Glæra",
		Slides: "Glærur",
		"Slide {index}": "Glæra {index}",
		"{index} of {count}": "{index} af {count}",
		"Previous slide": "Fyrri glæra",
		"Next slide": "Næsta glæra",
		"Move row {index}": "Færa röð {index}",
		"Row {from} moved to {to}": "Röð {from} færð í {to}",
		Pause: "Gera hlé",
		Play: "Spila",
		Menu: "Valmynd",
		Contents: "Efnisyfirlit",
		"key.ctrl": "Ctrl",
		"key.shift": "Shift",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "Bilslá",
		"key.backspace": "Backspace",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "Fyrri mánuður",
		"Next month": "Næsti mánuður",
		"Previous year": "Fyrra ár",
		"Next year": "Næsta ár",
		"Earlier years": "Fyrri ár",
		"Later years": "Síðari ár",
		"Choose a month and year": "Velja mánuð og ár",
		"Choose a date": "Veldu dagsetningu",
		Date: "Dagsetning",
		"W{week}": "V{week}",
		Total: "Samtals",
		"End date": "Lokadagur",
		"Include time": "Taka með tíma",
		Time: "Tími"
	}, Kl = { is: Gl };
})), Jl, Yl, Xl = t((() => {
	Jl = {
		Save: "Salva",
		Cancel: "Annulla",
		Delete: "Elimina",
		Close: "Chiudi",
		Back: "Indietro",
		Next: "Avanti",
		Done: "Fine",
		Continue: "Continua",
		Search: "Cerca",
		Edit: "Modifica",
		Yes: "Sì",
		No: "No",
		"Sign in": "Accedi",
		"Sign out": "Esci",
		Email: "Email",
		Password: "Password",
		"Nothing here yet": "Ancora niente qui",
		Loading: "Caricamento",
		"{value} of {max}": "{value} su {max}",
		"{value} of {max}, over by {over}": "{value} su {max}, {over} in più",
		Failed: "Non riuscito",
		Today: "Oggi",
		Yesterday: "Ieri",
		Tomorrow: "Domani",
		Settings: "Impostazioni",
		Language: "Lingua",
		Theme: "Tema",
		Light: "Chiaro",
		Dark: "Scuro",
		System: "Sistema",
		Shape: "Forma",
		Square: "Quadrata",
		Rounded: "Arrotondata",
		Circular: "Circolare",
		Note: "Nota",
		Page: "Pagina",
		Red: "Rosso",
		Orange: "Arancione",
		Yellow: "Giallo",
		"Apple green": "Verde mela",
		Green: "Verde",
		"Light blue": "Azzurro",
		Blue: "Blu",
		Pink: "Rosa",
		"This is a beta version": "Questa è una versione beta",
		"Report issue": "Segnala un problema",
		"Issue report": "Segnalazione di problema",
		"Describe the issue:": "Descrivi il problema:",
		"App version:": "Versione dell’app:",
		Danish: "Danese",
		German: "Tedesco",
		English: "Inglese",
		Spanish: "Spagnolo",
		Finnish: "Finlandese",
		French: "Francese",
		Icelandic: "Islandese",
		Italian: "Italiano",
		Japanese: "Giapponese",
		Korean: "Coreano",
		"Norwegian Bokmål": "Norvegese bokmål",
		"Norwegian Nynorsk": "Norvegese nynorsk",
		Norwegian: "Norvegese",
		Portuguese: "Portoghese",
		"Brazilian Portuguese": "Portoghese brasiliano",
		Swedish: "Svedese",
		Chinese: "Cinese",
		"Show password": "Mostra password",
		"Hide password": "Nascondi password",
		OK: "OK",
		Copied: "Copiato",
		"Could not copy": "Impossibile copiare",
		Notifications: "Notifiche",
		"Try again": "Riprova",
		Undo: "Annulla",
		Redo: "Ripeti",
		Copy: "Copia",
		"Copy link": "Copia link",
		Remove: "Rimuovi",
		Rename: "Rinomina",
		Duplicate: "Duplica",
		Download: "Scarica",
		Refresh: "Aggiorna",
		Open: "Apri",
		Send: "Invia",
		Clear: "Cancella",
		Saved: "Salvato",
		"Saving…": "Salvataggio…",
		Untitled: "Senza titolo",
		Account: "Account",
		Carousel: "Carosello",
		Slide: "Slide",
		Slides: "Slide",
		"Slide {index}": "Slide {index}",
		"{index} of {count}": "{index} di {count}",
		"Previous slide": "Slide precedente",
		"Next slide": "Slide successiva",
		"Move row {index}": "Sposta la riga {index}",
		"Row {from} moved to {to}": "Riga {from} spostata in {to}",
		Pause: "Pausa",
		Play: "Riproduci",
		Menu: "Menu",
		Contents: "Indice",
		"key.ctrl": "Ctrl",
		"key.shift": "Maiusc",
		"key.alt": "Alt",
		"key.enter": "Invio",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "Spazio",
		"key.backspace": "Backspace",
		"key.delete": "Canc",
		"key.home": "Home",
		"key.end": "Fine",
		"key.pageup": "Pag su",
		"key.pagedown": "Pag giù",
		"Previous month": "Mese precedente",
		"Next month": "Mese successivo",
		"Previous year": "Anno precedente",
		"Next year": "Anno successivo",
		"Earlier years": "Anni precedenti",
		"Later years": "Anni successivi",
		"Choose a month and year": "Scegli mese e anno",
		"Choose a date": "Scegli una data",
		Date: "Data",
		"W{week}": "S{week}",
		Total: "Totale",
		"End date": "Data di fine",
		"Include time": "Includi ora",
		Time: "Ora"
	}, Yl = { it: Jl };
})), Zl, Ql, $l = t((() => {
	Zl = {
		Save: "保存",
		Cancel: "キャンセル",
		Delete: "削除",
		Close: "閉じる",
		Back: "戻る",
		Next: "次へ",
		Done: "完了",
		Continue: "続ける",
		Search: "検索",
		Edit: "編集",
		Yes: "はい",
		No: "いいえ",
		"Sign in": "サインイン",
		"Sign out": "サインアウト",
		Email: "メール",
		Password: "パスワード",
		"Nothing here yet": "まだ何もありません",
		Loading: "読み込み中",
		"{value} of {max}": "{max}中{value}",
		"{value} of {max}, over by {over}": "{max}中{value}、{over}超過",
		Failed: "失敗",
		Today: "今日",
		Yesterday: "昨日",
		Tomorrow: "明日",
		Settings: "設定",
		Language: "言語",
		Theme: "テーマ",
		Light: "ライト",
		Dark: "ダーク",
		System: "システム",
		Shape: "形状",
		Square: "角型",
		Rounded: "角丸",
		Circular: "円形",
		Note: "メモ",
		Page: "ページ",
		Red: "赤",
		Orange: "オレンジ",
		Yellow: "黄色",
		"Apple green": "アップルグリーン",
		Green: "緑",
		"Light blue": "ライトブルー",
		Blue: "青",
		Pink: "ピンク",
		"This is a beta version": "これはベータ版です",
		"Report issue": "問題を報告",
		"Issue report": "問題の報告",
		"Describe the issue:": "問題の内容：",
		"App version:": "アプリのバージョン：",
		Danish: "デンマーク語",
		German: "ドイツ語",
		English: "英語",
		Spanish: "スペイン語",
		Finnish: "フィンランド語",
		French: "フランス語",
		Icelandic: "アイスランド語",
		Italian: "イタリア語",
		Japanese: "日本語",
		Korean: "韓国語",
		"Norwegian Bokmål": "ノルウェー語（ブークモール）",
		"Norwegian Nynorsk": "ノルウェー語（ニーノシュク）",
		Norwegian: "ノルウェー語",
		Portuguese: "ポルトガル語",
		"Brazilian Portuguese": "ポルトガル語（ブラジル）",
		Swedish: "スウェーデン語",
		Chinese: "中国語",
		"Show password": "パスワードを表示",
		"Hide password": "パスワードを非表示",
		OK: "OK",
		Copied: "コピーしました",
		"Could not copy": "コピーできませんでした",
		Notifications: "通知",
		"Try again": "もう一度試す",
		Undo: "取り消す",
		Redo: "やり直す",
		Copy: "コピー",
		"Copy link": "リンクをコピー",
		Remove: "取り除く",
		Rename: "名前を変更",
		Duplicate: "複製",
		Download: "ダウンロード",
		Refresh: "更新",
		Open: "開く",
		Send: "送信",
		Clear: "クリア",
		Saved: "保存しました",
		"Saving…": "保存中…",
		Untitled: "名称未設定",
		Account: "アカウント",
		Carousel: "カルーセル",
		Slide: "スライド",
		Slides: "スライド",
		"Slide {index}": "スライド {index}",
		"{index} of {count}": "{count} 枚中 {index} 枚目",
		"Previous slide": "前のスライド",
		"Next slide": "次のスライド",
		"Move row {index}": "{index} 行目を移動",
		"Row {from} moved to {to}": "{from} 行目を {to} 行目に移動しました",
		Pause: "一時停止",
		Play: "再生",
		Menu: "メニュー",
		Contents: "目次",
		"key.ctrl": "Ctrl",
		"key.shift": "Shift",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "スペース",
		"key.backspace": "Backspace",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "前の月",
		"Next month": "次の月",
		"Previous year": "前の年",
		"Next year": "次の年",
		"Earlier years": "前の12年",
		"Later years": "次の12年",
		"Choose a month and year": "年と月を選択",
		"Choose a date": "日付を選択",
		Date: "日付",
		"W{week}": "第{week}週",
		Total: "合計",
		"End date": "終了日",
		"Include time": "時刻を含める",
		Time: "時刻"
	}, Ql = { ja: Zl };
})), eu, tu, nu = t((() => {
	eu = {
		Save: "저장",
		Cancel: "취소",
		Delete: "삭제",
		Close: "닫기",
		Back: "뒤로",
		Next: "다음",
		Done: "완료",
		Continue: "계속",
		Search: "검색",
		Edit: "편집",
		Yes: "예",
		No: "아니요",
		"Sign in": "로그인",
		"Sign out": "로그아웃",
		Email: "이메일",
		Password: "비밀번호",
		"Nothing here yet": "아직 아무것도 없습니다",
		Loading: "불러오는 중",
		"{value} of {max}": "{max} 중 {value}",
		"{value} of {max}, over by {over}": "{max} 중 {value}, {over} 초과",
		Failed: "실패",
		Today: "오늘",
		Yesterday: "어제",
		Tomorrow: "내일",
		Settings: "설정",
		Language: "언어",
		Theme: "테마",
		Light: "라이트",
		Dark: "다크",
		System: "시스템",
		Shape: "모양",
		Square: "사각형",
		Rounded: "둥근 모서리",
		Circular: "원형",
		Note: "메모",
		Page: "페이지",
		Red: "빨강",
		Orange: "주황",
		Yellow: "노랑",
		"Apple green": "애플 그린",
		Green: "초록",
		"Light blue": "하늘색",
		Blue: "파랑",
		Pink: "분홍",
		"This is a beta version": "베타 버전입니다",
		"Report issue": "문제 신고",
		"Issue report": "문제 신고",
		"Describe the issue:": "문제를 설명해 주세요:",
		"App version:": "앱 버전:",
		Danish: "덴마크어",
		German: "독일어",
		English: "영어",
		Spanish: "스페인어",
		Finnish: "핀란드어",
		French: "프랑스어",
		Icelandic: "아이슬란드어",
		Italian: "이탈리아어",
		Japanese: "일본어",
		Korean: "한국어",
		"Norwegian Bokmål": "노르웨이어(보크말)",
		"Norwegian Nynorsk": "노르웨이어(니노르스크)",
		Norwegian: "노르웨이어",
		Portuguese: "포르투갈어",
		"Brazilian Portuguese": "브라질 포르투갈어",
		Swedish: "스웨덴어",
		Chinese: "중국어",
		"Show password": "비밀번호 표시",
		"Hide password": "비밀번호 숨기기",
		OK: "확인",
		Copied: "복사됨",
		"Could not copy": "복사하지 못했습니다",
		Notifications: "알림",
		"Try again": "다시 시도",
		Undo: "실행 취소",
		Redo: "다시 실행",
		Copy: "복사",
		"Copy link": "링크 복사",
		Remove: "제거",
		Rename: "이름 변경",
		Duplicate: "복제",
		Download: "다운로드",
		Refresh: "새로 고침",
		Open: "열기",
		Send: "보내기",
		Clear: "지우기",
		Saved: "저장됨",
		"Saving…": "저장 중…",
		Untitled: "제목 없음",
		Account: "계정",
		Carousel: "캐러셀",
		Slide: "슬라이드",
		Slides: "슬라이드",
		"Slide {index}": "슬라이드 {index}",
		"{index} of {count}": "{count}개 중 {index}번째",
		"Previous slide": "이전 슬라이드",
		"Next slide": "다음 슬라이드",
		"Move row {index}": "{index}행 이동",
		"Row {from} moved to {to}": "{from}행을 {to}행으로 이동함",
		Pause: "일시정지",
		Play: "재생",
		Menu: "메뉴",
		Contents: "목차",
		"key.ctrl": "Ctrl",
		"key.shift": "Shift",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "스페이스",
		"key.backspace": "Backspace",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "이전 달",
		"Next month": "다음 달",
		"Previous year": "이전 연도",
		"Next year": "다음 연도",
		"Earlier years": "이전 연도들",
		"Later years": "다음 연도들",
		"Choose a month and year": "연도와 월 선택",
		"Choose a date": "날짜 선택",
		Date: "날짜",
		"W{week}": "{week}주",
		Total: "합계",
		"End date": "종료일",
		"Include time": "시간 포함",
		Time: "시간"
	}, tu = { ko: eu };
})), ru, iu, au = t((() => {
	ru = {
		Save: "Lagre",
		Cancel: "Avbryt",
		Delete: "Slett",
		Close: "Lukk",
		Back: "Tilbake",
		Next: "Neste",
		Done: "Ferdig",
		Continue: "Fortsett",
		Search: "Søk",
		Edit: "Rediger",
		Yes: "Ja",
		No: "Nei",
		"Sign in": "Logg inn",
		"Sign out": "Logg ut",
		Email: "E-post",
		Password: "Passord",
		"Nothing here yet": "Ingenting her ennå",
		Loading: "Laster inn",
		"{value} of {max}": "{value} av {max}",
		"{value} of {max}, over by {over}": "{value} av {max}, {over} for mye",
		Failed: "Mislyktes",
		Today: "I dag",
		Yesterday: "I går",
		Tomorrow: "I morgen",
		Settings: "Innstillinger",
		Language: "Språk",
		Theme: "Tema",
		Light: "Lys",
		Dark: "Mørk",
		System: "System",
		Shape: "Form",
		Square: "Firkantet",
		Rounded: "Avrundet",
		Circular: "Sirkulær",
		Note: "Notat",
		Page: "Side",
		Red: "Rød",
		Orange: "Oransje",
		Yellow: "Gul",
		"Apple green": "Eplegrønn",
		Green: "Grønn",
		"Light blue": "Lyseblå",
		Blue: "Blå",
		Pink: "Rosa",
		"This is a beta version": "Dette er en betaversjon",
		"Report issue": "Rapporter et problem",
		"Issue report": "Problemrapport",
		"Describe the issue:": "Beskriv problemet:",
		"App version:": "Appversjon:",
		Danish: "Dansk",
		German: "Tysk",
		English: "Engelsk",
		Spanish: "Spansk",
		Finnish: "Finsk",
		French: "Fransk",
		Icelandic: "Islandsk",
		Italian: "Italiensk",
		Japanese: "Japansk",
		Korean: "Koreansk",
		"Norwegian Bokmål": "Norsk bokmål",
		"Norwegian Nynorsk": "Norsk nynorsk",
		Norwegian: "Norsk",
		Portuguese: "Portugisisk",
		"Brazilian Portuguese": "Brasiliansk portugisisk",
		Swedish: "Svensk",
		Chinese: "Kinesisk",
		"Show password": "Vis passord",
		"Hide password": "Skjul passord",
		OK: "OK",
		Copied: "Kopiert",
		"Could not copy": "Kunne ikke kopiere",
		Notifications: "Varsler",
		"Try again": "Prøv igjen",
		Undo: "Angre",
		Redo: "Gjør om",
		Copy: "Kopier",
		"Copy link": "Kopier lenke",
		Remove: "Fjern",
		Rename: "Gi nytt navn",
		Duplicate: "Dupliser",
		Download: "Last ned",
		Refresh: "Oppdater",
		Open: "Åpne",
		Send: "Send",
		Clear: "Tøm",
		Saved: "Lagret",
		"Saving…": "Lagrer…",
		Untitled: "Uten tittel",
		Account: "Konto",
		Carousel: "Karusell",
		Slide: "Lysbilde",
		Slides: "Lysbilder",
		"Slide {index}": "Lysbilde {index}",
		"{index} of {count}": "{index} av {count}",
		"Previous slide": "Forrige lysbilde",
		"Next slide": "Neste lysbilde",
		"Move row {index}": "Flytt rad {index}",
		"Row {from} moved to {to}": "Rad {from} flyttet til {to}",
		Pause: "Pause",
		Play: "Spill av",
		Menu: "Meny",
		Contents: "Innhold",
		"key.ctrl": "Ctrl",
		"key.shift": "Skift",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "Mellomrom",
		"key.backspace": "Tilbake",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "Forrige måned",
		"Next month": "Neste måned",
		"Previous year": "Forrige år",
		"Next year": "Neste år",
		"Earlier years": "Tidligere år",
		"Later years": "Senere år",
		"Choose a month and year": "Velg måned og år",
		"Choose a date": "Velg en dato",
		Date: "Dato",
		"W{week}": "U{week}",
		Total: "Totalt",
		"End date": "Sluttdato",
		"Include time": "Ta med klokkeslett",
		Time: "Klokkeslett"
	}, iu = { nb: ru };
})), ou, su, cu = t((() => {
	ou = {
		Save: "Guardar",
		Cancel: "Cancelar",
		Delete: "Eliminar",
		Close: "Fechar",
		Back: "Voltar",
		Next: "Seguinte",
		Done: "Concluído",
		Continue: "Continuar",
		Search: "Pesquisar",
		Edit: "Editar",
		Yes: "Sim",
		No: "Não",
		"Sign in": "Iniciar sessão",
		"Sign out": "Terminar sessão",
		Email: "E-mail",
		Password: "Palavra-passe",
		"Nothing here yet": "Ainda não há nada aqui",
		Loading: "A carregar",
		"{value} of {max}": "{value} de {max}",
		"{value} of {max}, over by {over}": "{value} de {max}, {over} acima",
		Failed: "Falhou",
		Today: "Hoje",
		Yesterday: "Ontem",
		Tomorrow: "Amanhã",
		Settings: "Definições",
		Language: "Idioma",
		Theme: "Tema",
		Light: "Claro",
		Dark: "Escuro",
		System: "Sistema",
		Shape: "Forma",
		Square: "Quadrada",
		Rounded: "Arredondada",
		Circular: "Circular",
		Note: "Nota",
		Page: "Página",
		Red: "Vermelho",
		Orange: "Laranja",
		Yellow: "Amarelo",
		"Apple green": "Verde-maçã",
		Green: "Verde",
		"Light blue": "Azul-claro",
		Blue: "Azul",
		Pink: "Cor-de-rosa",
		"This is a beta version": "Esta é uma versão beta",
		"Report issue": "Comunicar um problema",
		"Issue report": "Relatório de problema",
		"Describe the issue:": "Descreva o problema:",
		"App version:": "Versão da app:",
		Danish: "Dinamarquês",
		German: "Alemão",
		English: "Inglês",
		Spanish: "Espanhol",
		Finnish: "Finlandês",
		French: "Francês",
		Icelandic: "Islandês",
		Italian: "Italiano",
		Japanese: "Japonês",
		Korean: "Coreano",
		"Norwegian Bokmål": "Norueguês bokmål",
		"Norwegian Nynorsk": "Norueguês nynorsk",
		Norwegian: "Norueguês",
		Portuguese: "Português",
		"Brazilian Portuguese": "Português do Brasil",
		Swedish: "Sueco",
		Chinese: "Chinês",
		"Show password": "Mostrar palavra-passe",
		"Hide password": "Ocultar palavra-passe",
		OK: "OK",
		Copied: "Copiado",
		"Could not copy": "Não foi possível copiar",
		Notifications: "Notificações",
		"Try again": "Tentar novamente",
		Undo: "Desfazer",
		Redo: "Refazer",
		Copy: "Copiar",
		"Copy link": "Copiar ligação",
		Remove: "Remover",
		Rename: "Mudar o nome",
		Duplicate: "Duplicar",
		Download: "Descarregar",
		Refresh: "Atualizar",
		Open: "Abrir",
		Send: "Enviar",
		Clear: "Limpar",
		Saved: "Guardado",
		"Saving…": "A guardar…",
		Untitled: "Sem título",
		Account: "Conta",
		Carousel: "Carrossel",
		Slide: "Diapositivo",
		Slides: "Diapositivos",
		"Slide {index}": "Diapositivo {index}",
		"{index} of {count}": "{index} de {count}",
		"Previous slide": "Diapositivo anterior",
		"Next slide": "Diapositivo seguinte",
		"Move row {index}": "Mover linha {index}",
		"Row {from} moved to {to}": "Linha {from} movida para {to}",
		Pause: "Pausar",
		Play: "Reproduzir",
		Menu: "Menu",
		Contents: "Índice",
		"key.ctrl": "Ctrl",
		"key.shift": "Shift",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "Espaço",
		"key.backspace": "Retrocesso",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "Mês anterior",
		"Next month": "Mês seguinte",
		"Previous year": "Ano anterior",
		"Next year": "Ano seguinte",
		"Earlier years": "Anos anteriores",
		"Later years": "Anos seguintes",
		"Choose a month and year": "Escolher mês e ano",
		"Choose a date": "Escolher uma data",
		Date: "Data",
		"W{week}": "S{week}",
		Total: "Total",
		"End date": "Data de fim",
		"Include time": "Incluir hora",
		Time: "Hora"
	}, su = { pt: ou };
})), lu, uu = t((() => {
	lu = { "pt-BR": {
		Save: "Salvar",
		Cancel: "Cancelar",
		Delete: "Excluir",
		Close: "Fechar",
		Back: "Voltar",
		Next: "Próximo",
		Done: "Concluído",
		Continue: "Continuar",
		Search: "Buscar",
		Edit: "Editar",
		Yes: "Sim",
		No: "Não",
		"Sign in": "Entrar",
		"Sign out": "Sair",
		Email: "E-mail",
		Password: "Senha",
		"Nothing here yet": "Nada aqui ainda",
		Loading: "Carregando",
		"{value} of {max}": "{value} de {max}",
		"{value} of {max}, over by {over}": "{value} de {max}, {over} acima",
		Failed: "Falhou",
		Today: "Hoje",
		Yesterday: "Ontem",
		Tomorrow: "Amanhã",
		Settings: "Configurações",
		Language: "Idioma",
		Theme: "Tema",
		Light: "Claro",
		Dark: "Escuro",
		System: "Sistema",
		Shape: "Formato",
		Square: "Quadrado",
		Rounded: "Arredondado",
		Circular: "Circular",
		Note: "Nota",
		Page: "Página",
		Red: "Vermelho",
		Orange: "Laranja",
		Yellow: "Amarelo",
		"Apple green": "Verde-maçã",
		Green: "Verde",
		"Light blue": "Azul-claro",
		Blue: "Azul",
		Pink: "Rosa",
		"This is a beta version": "Esta é uma versão beta",
		"Report issue": "Relatar problema",
		"Issue report": "Relatório de problema",
		"Describe the issue:": "Descreva o problema:",
		"App version:": "Versão do app:",
		Danish: "Dinamarquês",
		German: "Alemão",
		English: "Inglês",
		Spanish: "Espanhol",
		Finnish: "Finlandês",
		French: "Francês",
		Icelandic: "Islandês",
		Italian: "Italiano",
		Japanese: "Japonês",
		Korean: "Coreano",
		"Norwegian Bokmål": "Norueguês bokmål",
		"Norwegian Nynorsk": "Norueguês nynorsk",
		Norwegian: "Norueguês",
		Portuguese: "Português",
		"Brazilian Portuguese": "Português do Brasil",
		Swedish: "Sueco",
		Chinese: "Chinês",
		"Show password": "Mostrar senha",
		"Hide password": "Ocultar senha",
		OK: "OK",
		Copied: "Copiado",
		"Could not copy": "Não foi possível copiar",
		Notifications: "Notificações",
		"Try again": "Tentar novamente",
		Undo: "Desfazer",
		Redo: "Refazer",
		Copy: "Copiar",
		"Copy link": "Copiar link",
		Remove: "Remover",
		Rename: "Renomear",
		Duplicate: "Duplicar",
		Download: "Baixar",
		Refresh: "Atualizar",
		Open: "Abrir",
		Send: "Enviar",
		Clear: "Limpar",
		Saved: "Salvo",
		"Saving…": "Salvando…",
		Untitled: "Sem título",
		Account: "Conta",
		Carousel: "Carrossel",
		Slide: "Slide",
		Slides: "Slides",
		"Slide {index}": "Slide {index}",
		"{index} of {count}": "{index} de {count}",
		"Previous slide": "Slide anterior",
		"Next slide": "Próximo slide",
		"Move row {index}": "Mover linha {index}",
		"Row {from} moved to {to}": "Linha {from} movida para {to}",
		Pause: "Pausar",
		Play: "Reproduzir",
		Menu: "Menu",
		Contents: "Sumário",
		"key.ctrl": "Ctrl",
		"key.shift": "Shift",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "Espaço",
		"key.backspace": "Backspace",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "Mês anterior",
		"Next month": "Próximo mês",
		"Previous year": "Ano anterior",
		"Next year": "Próximo ano",
		"Earlier years": "Anos anteriores",
		"Later years": "Anos seguintes",
		"Choose a month and year": "Escolher mês e ano",
		"Choose a date": "Escolher uma data",
		Date: "Data",
		"W{week}": "S{week}",
		Total: "Total",
		"End date": "Data de término",
		"Include time": "Incluir horário",
		Time: "Horário"
	} };
})), du, fu, pu = t((() => {
	du = {
		Save: "Spara",
		Cancel: "Avbryt",
		Delete: "Radera",
		Close: "Stäng",
		Back: "Tillbaka",
		Next: "Nästa",
		Done: "Klar",
		Continue: "Fortsätt",
		Search: "Sök",
		Edit: "Redigera",
		Yes: "Ja",
		No: "Nej",
		"Sign in": "Logga in",
		"Sign out": "Logga ut",
		Email: "E-post",
		Password: "Lösenord",
		"Nothing here yet": "Inget här än",
		Loading: "Läser in",
		"{value} of {max}": "{value} av {max}",
		"{value} of {max}, over by {over}": "{value} av {max}, {over} för mycket",
		Failed: "Misslyckades",
		Today: "I dag",
		Yesterday: "I går",
		Tomorrow: "I morgon",
		Settings: "Inställningar",
		Language: "Språk",
		Theme: "Tema",
		Light: "Ljust",
		Dark: "Mörkt",
		System: "System",
		Shape: "Form",
		Square: "Fyrkantig",
		Rounded: "Rundad",
		Circular: "Cirkulär",
		Note: "Anteckning",
		Page: "Sida",
		Red: "Röd",
		Orange: "Orange",
		Yellow: "Gul",
		"Apple green": "Äppelgrön",
		Green: "Grön",
		"Light blue": "Ljusblå",
		Blue: "Blå",
		Pink: "Rosa",
		"This is a beta version": "Det här är en betaversion",
		"Report issue": "Rapportera problem",
		"Issue report": "Problemrapport",
		"Describe the issue:": "Beskriv problemet:",
		"App version:": "Appversion:",
		Danish: "Danska",
		German: "Tyska",
		English: "Engelska",
		Spanish: "Spanska",
		Finnish: "Finska",
		French: "Franska",
		Icelandic: "Isländska",
		Italian: "Italienska",
		Japanese: "Japanska",
		Korean: "Koreanska",
		"Norwegian Bokmål": "Norskt bokmål",
		"Norwegian Nynorsk": "Nynorska",
		Norwegian: "Norska",
		Portuguese: "Portugisiska",
		"Brazilian Portuguese": "Brasiliansk portugisiska",
		Swedish: "Svenska",
		Chinese: "Kinesiska",
		"Show password": "Visa lösenord",
		"Hide password": "Dölj lösenord",
		OK: "OK",
		Copied: "Kopierat",
		"Could not copy": "Kunde inte kopiera",
		Notifications: "Aviseringar",
		"Try again": "Försök igen",
		Undo: "Ångra",
		Redo: "Gör om",
		Copy: "Kopiera",
		"Copy link": "Kopiera länk",
		Remove: "Ta bort",
		Rename: "Byt namn",
		Duplicate: "Duplicera",
		Download: "Hämta",
		Refresh: "Uppdatera",
		Open: "Öppna",
		Send: "Skicka",
		Clear: "Rensa",
		Saved: "Sparat",
		"Saving…": "Sparar…",
		Untitled: "Namnlös",
		Account: "Konto",
		Carousel: "Karusell",
		Slide: "Bild",
		Slides: "Bilder",
		"Slide {index}": "Bild {index}",
		"{index} of {count}": "{index} av {count}",
		"Previous slide": "Föregående bild",
		"Next slide": "Nästa bild",
		"Move row {index}": "Flytta rad {index}",
		"Row {from} moved to {to}": "Rad {from} flyttad till {to}",
		Pause: "Pausa",
		Play: "Spela upp",
		Menu: "Meny",
		Contents: "Innehåll",
		"key.ctrl": "Ctrl",
		"key.shift": "Skift",
		"key.alt": "Alt",
		"key.enter": "Retur",
		"key.escape": "Esc",
		"key.tab": "Tabb",
		"key.space": "Blanksteg",
		"key.backspace": "Backsteg",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "Föregående månad",
		"Next month": "Nästa månad",
		"Previous year": "Föregående år",
		"Next year": "Nästa år",
		"Earlier years": "Tidigare år",
		"Later years": "Senare år",
		"Choose a month and year": "Välj månad och år",
		"Choose a date": "Välj ett datum",
		Date: "Datum",
		"W{week}": "V{week}",
		Total: "Totalt",
		"End date": "Slutdatum",
		"Include time": "Inkludera tid",
		Time: "Tid"
	}, fu = { sv: du };
})), mu, hu, gu = t((() => {
	mu = {
		Save: "保存",
		Cancel: "取消",
		Delete: "删除",
		Close: "关闭",
		Back: "返回",
		Next: "下一步",
		Done: "完成",
		Continue: "继续",
		Search: "搜索",
		Edit: "编辑",
		Yes: "是",
		No: "否",
		"Sign in": "登录",
		"Sign out": "退出登录",
		Email: "邮箱",
		Password: "密码",
		"Nothing here yet": "这里还没有内容",
		Loading: "正在加载",
		"{value} of {max}": "{value}/{max}",
		"{value} of {max}, over by {over}": "{value}/{max}，超出 {over}",
		Failed: "失败",
		Today: "今天",
		Yesterday: "昨天",
		Tomorrow: "明天",
		Settings: "设置",
		Language: "语言",
		Theme: "主题",
		Light: "浅色",
		Dark: "深色",
		System: "跟随系统",
		Shape: "形状",
		Square: "方形",
		Rounded: "圆角",
		Circular: "圆形",
		Note: "笔记",
		Page: "页面",
		Red: "红色",
		Orange: "橙色",
		Yellow: "黄色",
		"Apple green": "苹果绿",
		Green: "绿色",
		"Light blue": "浅蓝色",
		Blue: "蓝色",
		Pink: "粉色",
		"This is a beta version": "这是测试版",
		"Report issue": "报告问题",
		"Issue report": "问题报告",
		"Describe the issue:": "描述问题：",
		"App version:": "应用版本：",
		Danish: "丹麦语",
		German: "德语",
		English: "英语",
		Spanish: "西班牙语",
		Finnish: "芬兰语",
		French: "法语",
		Icelandic: "冰岛语",
		Italian: "意大利语",
		Japanese: "日语",
		Korean: "韩语",
		"Norwegian Bokmål": "书面挪威语",
		"Norwegian Nynorsk": "挪威尼诺斯克语",
		Norwegian: "挪威语",
		Portuguese: "葡萄牙语",
		"Brazilian Portuguese": "巴西葡萄牙语",
		Swedish: "瑞典语",
		Chinese: "中文",
		"Show password": "显示密码",
		"Hide password": "隐藏密码",
		OK: "确定",
		Copied: "已复制",
		"Could not copy": "无法复制",
		Notifications: "通知",
		"Try again": "重试",
		Undo: "撤销",
		Redo: "重做",
		Copy: "复制",
		"Copy link": "复制链接",
		Remove: "移除",
		Rename: "重命名",
		Duplicate: "创建副本",
		Download: "下载",
		Refresh: "刷新",
		Open: "打开",
		Send: "发送",
		Clear: "清除",
		Saved: "已保存",
		"Saving…": "正在保存…",
		Untitled: "未命名",
		Account: "账户",
		Carousel: "轮播",
		Slide: "幻灯片",
		Slides: "幻灯片",
		"Slide {index}": "幻灯片 {index}",
		"{index} of {count}": "第 {index} 张，共 {count} 张",
		"Previous slide": "上一张",
		"Next slide": "下一张",
		"Move row {index}": "移动第 {index} 行",
		"Row {from} moved to {to}": "第 {from} 行已移到第 {to} 行",
		Pause: "暂停",
		Play: "播放",
		Menu: "菜单",
		Contents: "目录",
		"key.ctrl": "Ctrl",
		"key.shift": "Shift",
		"key.alt": "Alt",
		"key.enter": "Enter",
		"key.escape": "Esc",
		"key.tab": "Tab",
		"key.space": "空格",
		"key.backspace": "Backspace",
		"key.delete": "Delete",
		"key.home": "Home",
		"key.end": "End",
		"key.pageup": "Page Up",
		"key.pagedown": "Page Down",
		"Previous month": "上个月",
		"Next month": "下个月",
		"Previous year": "上一年",
		"Next year": "下一年",
		"Earlier years": "更早的年份",
		"Later years": "更晚的年份",
		"Choose a month and year": "选择月份和年份",
		"Choose a date": "选择日期",
		Date: "日期",
		"W{week}": "第{week}周",
		Total: "合计",
		"End date": "结束日期",
		"Include time": "包含时间",
		Time: "时间"
	}, hu = { zh: mu };
})), _u = /* @__PURE__ */ n({ SHARED_WORDS: () => vu }), vu, yu = t((() => {
	kl(), Ml(), Fl(), Rl(), Vl(), Wl(), ql(), Xl(), $l(), nu(), au(), cu(), uu(), pu(), gu(), vu = {
		...Pl,
		...Ol,
		...jl,
		...Ll,
		...Bl,
		...Ul,
		...Kl,
		...Yl,
		...Ql,
		...tu,
		...iu,
		...su,
		...lu,
		...fu,
		...hu
	};
})), bu = {}, xu = "./translations.json", Su = "language", Cu = "ds-one:i18n-debug", wu = "en", Q = typeof window < "u" && window.DS_ONE_I18N ? { ...window.DS_ONE_I18N } : {}, Tu;
function Eu() {
	try {
		return typeof window < "u" ? window.localStorage ?? void 0 : void 0;
	} catch {
		return;
	}
}
function Du() {
	return Q.storageKey || Su;
}
function Ou() {
	if (Q.persist === !1) return null;
	try {
		return Eu()?.getItem(Du()) || null;
	} catch {
		return null;
	}
}
function ku(e) {
	if (Q.persist !== !1) try {
		Eu()?.setItem(Du(), e);
	} catch {}
}
function Au(e) {
	return e ? e.toLowerCase().split(/[-_]/)[0] ?? "" : "";
}
function ju(e) {
	let t = Q.languages;
	if (!t || t.length === 0) return Au(e) || null;
	let n = (e || "").toLowerCase().replace("_", "-"), r = t.find((e) => e.toLowerCase() === n);
	if (r) return r;
	let i = Au(e);
	return t.find((e) => e.toLowerCase() === i) ?? null;
}
function Mu(e) {
	let t = Q.languageFile;
	return t ? Pu(typeof t == "function" ? t(e) : t.split("{language}").join(e)) : null;
}
var Nu = !1;
function Pu(e) {
	if (!e) return null;
	let t = e.trim();
	return t ? t.startsWith("./") || t.startsWith("../") || t.startsWith("/") || /^https?:\/\//i.test(t) ? t : `./${t}` : null;
}
function Fu() {
	return typeof document > "u" || !document.querySelector ? null : document.querySelector("script[data-ds-one-translations]")?.getAttribute("data-ds-one-translations") || document.querySelector("meta[name=\"ds-one:translations\"]")?.getAttribute("content") || document.querySelector("link[rel=\"ds-one-translations\"]")?.getAttribute("href") || null;
}
function Iu() {
	let e = [], t = typeof window < "u" ? window.DS_ONE_TRANSLATIONS_FILE : null, n = Fu(), r = Pu(t ?? "");
	r && e.push(r);
	let i = Pu(n ?? "");
	return i && !e.includes(i) && e.push(i), e.length === 0 && e.push(Pu(Q.translationsFile ?? "") ?? xu), e;
}
function Lu() {
	let e = Iu(), t = Mu(ju(ed.value) ?? wu);
	return t ? [t, ...e.filter((e) => e !== t)] : e;
}
function Ru(e) {
	let t = ju(ed.value) ?? wu;
	return Mu(t) === e ? t : void 0;
}
function zu(e) {
	return !e || typeof e != "object" ? !1 : Object.values(e).every((e) => e && typeof e == "object");
}
var Bu = /* @__PURE__ */ new Map();
function Vu(e, t) {
	let n = Bu.get(e);
	return n || (n = Hu(e, t).then((t) => (t || Bu.delete(e), t)), Bu.set(e, n)), n;
}
async function Hu(e, t) {
	try {
		let n = await fetch(e);
		if (!n.ok) return null;
		let r = await n.json(), i = t ? El(t, r) ?? r : r;
		return zu(i) ? Object.keys(i).length === 0 ? (console.warn(`[Design system 1] No languages found in ${e}`), null) : i : (console.warn(`[Design system 1] Invalid translation format in ${e}. Expected object with language codes as keys.`), null);
	} catch {
		return null;
	}
}
function Uu(e) {
	typeof window > "u" ? bu = {
		...bu,
		...e
	} : window.DS_ONE_TRANSLATIONS = {
		...window.DS_ONE_TRANSLATIONS,
		...e
	};
}
async function Wu() {
	if (Nu || (Nu = !0, typeof window > "u")) return !1;
	if (window.DS_ONE_TRANSLATIONS && Object.keys(window.DS_ONE_TRANSLATIONS).length > 0) return md(`Translations already loaded (${Object.keys(window.DS_ONE_TRANSLATIONS).length} languages), skipping auto-load`), !0;
	let e = Lu();
	for (let t of e) {
		let e = await Vu(t, Ru(t));
		if (!e) continue;
		Uu(e);
		let n = Object.keys(e);
		return md(`External translations loaded from ${t}: ${n.length} language(s) – ${n.join(", ")}`), window.dispatchEvent(new CustomEvent("translations-ready")), !0;
	}
	return md(`No external translations found at ${e[0] ?? xu}. Using bundled translations.`), !1;
}
var Gu = /* @__PURE__ */ new Map();
function Ku(e) {
	if (typeof window > "u" || !Q.languageFile) return Promise.resolve();
	let t = ju(e) ?? wu;
	if (qu()[t]) return Promise.resolve();
	let n = Gu.get(t);
	return n || (n = (async () => {
		let e = Mu(t), n = e ? await Vu(e, t) : null;
		for (let e of Iu()) {
			if (n) break;
			n = await Vu(e);
		}
		n && (Uu(n), window.dispatchEvent(new CustomEvent("translations-ready")));
	})(), Gu.set(t, n)), n;
}
function qu() {
	return typeof window < "u" && window.DS_ONE_TRANSLATIONS ? window.DS_ONE_TRANSLATIONS : bu;
}
function Ju() {
	return Q.languages?.length ? Q.languages : null;
}
function Yu(e) {
	if (!e) return null;
	let t = Ju(), n = t ? t.filter(ll) : il;
	return (n.length ? fl(e, null, n) : null) || (t ? ju(e) : null);
}
function Xu() {
	if (typeof navigator > "u" || !navigator) return wu;
	let e = [navigator.language, ...Array.isArray(navigator.languages) ? navigator.languages : []].filter((e) => !!e);
	for (let t of e) {
		let e = Yu(t);
		if (e) return e;
	}
	return !Ju() && e[0] ? e[0] : wu;
}
function Zu(e) {
	typeof window < "u" && typeof window.dispatchEvent == "function" && window.dispatchEvent(new CustomEvent("language-changed", {
		detail: { language: e },
		bubbles: !0,
		composed: !0
	}));
}
function Qu() {
	if (!Q.languageFromAddress || typeof window > "u") return null;
	let e = window.location?.pathname;
	return e ? bl(e, rd()).language : null;
}
function $u() {
	let e = Q.langTarget;
	return e === !1 ? null : e || (typeof document < "u" ? document.documentElement ?? null : null);
}
var ed = {
	value: Qu() || Ou() || Xu(),
	set: function(e, t = {}) {
		this.value = e, t.remember !== !1 && ku(e), Ku(e);
		let n = $u();
		n && (n.lang = e), Zu(e);
	}
};
function td(e) {
	let t = Q.persist, n = Du(), r = Q.languages, i = Q.languageFromAddress, a = Q.routing;
	if (Q = {
		...Q,
		...e
	}, nd(), Q.persist !== t || Du() !== n || Q.languages !== r || Q.languageFromAddress !== i || Q.languageFromAddress && Q.routing !== a) {
		let e = Ou(), t = e || Xu();
		e && Ju() && (t = Yu(e) ?? wu), t = Qu() ?? t, t !== ed.value && (ed.value = t, Zu(t));
	}
	e.sharedWords && ad(), Nu && Q.languageFile && Ku(ed.value);
}
function nd() {
	(Q.routing || Q.languages) && hl(rd());
}
function rd() {
	return {
		...Q.languages ? { languages: Q.languages } : {},
		...Q.routing
	};
}
var id = null;
function ad() {
	return id ||= Promise.resolve().then(() => (yu(), _u)).then(({ SHARED_WORDS: e }) => {
		Tu = e, typeof window < "u" && window.dispatchEvent(new CustomEvent("translations-ready"));
	}), id;
}
var od = [], sd = 1e3, cd = null, ld = !1, ud = typeof window < "u" ? window : void 0;
function dd() {
	if (cd) return;
	let e = new Promise((e) => setTimeout(e, sd));
	cd = Promise.race([Promise.allSettled(od.splice(0)), e]).then(() => {
		cd = null, ld = !0, fd() && ud && (ud.dispatchEvent(new CustomEvent("translations-loaded")), Zu(ed.value));
	});
}
if (nd(), Q.sharedWords && od.push(ad()), typeof window < "u" && typeof document < "u") {
	let e = () => {};
	od.push(new Promise((t) => e = t));
	let t = () => {
		Q.autoLoad === !1 ? e() : Wu().finally(e);
	};
	document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t) : setTimeout(t, 0);
}
var fd = () => typeof window < "u" && typeof window.addEventListener == "function" && typeof window.dispatchEvent == "function";
fd() && (window.addEventListener("translations-ready", dd), setTimeout(() => {
	fd() && !ld && window === ud && dd();
}, 100));
var pd = /* @__PURE__ */ new Set();
function md(e) {
	hd() && console.info(`[Design system 1] ${e}`);
}
function hd() {
	if (typeof window > "u") return !1;
	if (window.DS_ONE_I18N_DEBUG === !0) return !0;
	try {
		return Eu()?.getItem(Cu) === "on";
	} catch {
		return !1;
	}
}
function gd() {
	let e = Q.reportMissingKeys;
	try {
		if (typeof e == "function" ? e() : e) return !0;
	} catch {}
	return hd();
}
function _d(e, t) {
	if (!gd()) return;
	let n = `${t}:${e}`;
	pd.has(n) || (pd.add(n), console.warn(`[Design system 1 (Internationalization)] No translation found for key "${e}" in "${t}"`));
}
function vd(e, t) {
	return yd(e, ed.value, t);
}
globalThis[Symbol.for("design-system-1.translate")] = vd;
function yd(e, t, n) {
	let r = qu(), i = wl(e, t, [r, Tu], n);
	if (i.language !== null) return i.text;
	let a = pl(t);
	return !a.includes(wu) && !r?.[wu] && a.some((e) => r?.[e]) && Ku(wu), _d(e, a[a.length - 1] ?? t), i.text;
}
function bd(e, t) {
	return vd(e, t);
}
//#endregion
//#region src/vendor/ds1/0-face/tooltips.ts
var xd = 2e3, Sd = 10, Cd = Symbol.for("ds-one:tooltips");
function wd() {
	if (typeof document > "u" || !document.body) return;
	let e = document.documentElement;
	if (e.hasAttribute("data-ds-tooltips-ready")) return;
	e.setAttribute("data-ds-tooltips-ready", "");
	let t = document.createElement("div");
	t.setAttribute("data-ds-tooltip", ""), t.setAttribute("role", "tooltip"), t.id = "ds-tooltip";
	let n = document.createElement("style");
	n.textContent = "\n    [data-ds-tooltip] {\n      position: fixed; z-index: 2147483646; top: 0; left: 0; pointer-events: none; visibility: hidden;\n      max-width: 320px; min-height: 16px; box-sizing: border-box; padding: 0 2.5px; border-radius: 4px;\n      background: var(--ds-tooltip-background, light-dark(#000, #fff));\n      color: var(--ds-tooltip-color, light-dark(#fff, #000));\n      font-family: var(--typeface-regular, var(--font-regular, system-ui)), sans-serif;\n      font-size: 14px; font-weight: 400; line-height: 16px; letter-spacing: 0; white-space: nowrap;\n    }\n    [data-ds-tooltip].is-wide { white-space: normal; }\n    [data-ds-tooltip].is-visible { visibility: visible; }\n    @media print { [data-ds-tooltip] { display: none; } }\n  ", document.head.appendChild(n), document.body.appendChild(t);
	let r = null, i, a = (e) => {
		let n = e.getBoundingClientRect(), r = t.offsetWidth, i = t.offsetHeight, a = Math.min(Math.max(4, n.left + n.width / 2 - r / 2), window.innerWidth - r - 4), o = n.top - i - 2 >= 4 ? n.top - i - 2 : n.bottom + 2;
		t.style.transform = `translate(${Math.round(a)}px, ${Math.round(o)}px)`;
	}, o = (e) => {
		let n = e.dataset.tooltip;
		if (!n) return !1;
		t.textContent = n;
		let r = e.dataset.tooltipColour;
		return r ? (t.style.setProperty("--ds-tooltip-background", r), t.style.setProperty("--ds-tooltip-color", "#1e1e1e")) : (t.style.removeProperty("--ds-tooltip-background"), t.style.removeProperty("--ds-tooltip-color")), t.classList.remove("is-wide"), t.scrollWidth > 320 && t.classList.add("is-wide"), a(e), !0;
	}, s = typeof MutationObserver == "function" ? new MutationObserver(() => {
		r && (!r.isConnected || !o(r)) && l();
	}) : null, c = (e, n = {}) => {
		clearTimeout(i), i = void 0, r && r !== e && l(), o(e) && (r = e, e.getRootNode() === document && e.setAttribute("aria-describedby", t.id), s?.disconnect(), s?.observe(e, {
			attributes: !0,
			attributeFilter: ["data-tooltip", "data-tooltip-colour"]
		}), t.classList.add("is-visible"), n.duration !== void 0 && n.duration >= 0 && (i = setTimeout(l, n.duration)));
	};
	function l() {
		clearTimeout(i), i = void 0, s?.disconnect(), r?.removeAttribute("aria-describedby"), r = null, t.classList.remove("is-visible");
	}
	window[Cd] = {
		show: c,
		hide: l
	};
	let u = (e) => {
		for (let t of e.composedPath()) {
			if (t === document || t === window) break;
			if (t.hasAttribute?.("data-tooltip")) return t;
		}
		return e.target?.closest?.("[data-tooltip]") ?? null;
	}, d = (e) => {
		let t = e.composedPath()[0];
		try {
			return !!t?.matches?.(":focus-visible");
		} catch {
			return !1;
		}
	}, f = (e) => e.pointerType === "touch";
	document.addEventListener("pointerover", (e) => {
		if (f(e)) return;
		let t = u(e);
		t !== r && (t ? c(t) : l());
	}, { passive: !0 }), document.addEventListener("pointerleave", (e) => {
		f(e) || l();
	}, { passive: !0 }), document.addEventListener("focusin", (e) => {
		let t = u(e);
		t && d(e) && c(t);
	}), document.addEventListener("focusout", l), document.addEventListener("keydown", (e) => {
		e.key === "Escape" && l();
	}), window.addEventListener("scroll", l, {
		passive: !0,
		capture: !0
	});
	let p = null, m = !1, h = () => {
		p && clearTimeout(p.timer), p = null;
	};
	document.addEventListener("pointerdown", (e) => {
		if (m = !1, !f(e)) return;
		h(), l();
		let t = u(e);
		if (!t?.dataset.tooltip) return;
		let n = e;
		p = {
			target: t,
			id: n.pointerId,
			x: n.clientX,
			y: n.clientY,
			timer: setTimeout(() => {
				p &&= (m = !0, c(p.target, { duration: xd }), null);
			}, 500)
		};
	}, {
		passive: !0,
		capture: !0
	}), document.addEventListener("pointermove", (e) => {
		let t = e;
		p && t.pointerId === p.id && Math.hypot(t.clientX - p.x, t.clientY - p.y) > Sd && h();
	}, {
		passive: !0,
		capture: !0
	}), document.addEventListener("pointerup", (e) => {
		if (!p || e.pointerId !== p.id) return;
		let { target: t } = p;
		h(), t.hasAttribute("data-tooltip-press") && c(t, { duration: xd });
	}, {
		passive: !0,
		capture: !0
	}), document.addEventListener("pointercancel", h, {
		passive: !0,
		capture: !0
	}), document.addEventListener("click", (e) => {
		m && (m = !1, e.preventDefault(), e.stopPropagation());
	}, { capture: !0 });
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", wd, { once: !0 }) : wd());
//#endregion
//#region src/vendor/ds1/2-core/styles/ds-text.css?inline
var Td = "[data-ds-shape=square],:host([data-ds-shape=square]){--ds-corner-size:0px;--ds-corner-shape:round;--ds-button-inset:.5px}[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:4px;--ds-corner-shape:round;--ds-button-inset:2.5px}[data-ds-shape=circular],:host([data-ds-shape=circular]){--ds-corner-size:999px;--ds-corner-shape:round;--ds-button-inset:5px}@supports (corner-shape:squircle){[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:8px;--ds-corner-shape:squircle}}:root,:host,:where([data-ds-surface]){--ds-unit:calc(var(--ds-1,20px) * var(--ds-sf,1));--ds-control-height:calc(var(--ds-control-size,var(--ds-08,16px)) * var(--ds-sf,1));--ds-row-height:calc(var(--ds-row-size,var(--ds-1,20px)) * var(--ds-sf,1));--ds-type-size-default:calc(var(--ds-text-size,14px) * var(--ds-sf,1));--ds-type-size-small:calc(var(--ds-small-text-size,10px) * var(--ds-sf,1));--ds-type-size-heading:calc(var(--ds-heading-text-size,13px) * var(--ds-sf,1));--ds-type-size-display:calc(var(--ds-display-text-size,20px) * var(--ds-sf,1));--ds-type-lineheight-default:calc(var(--ds-text-leading,16px) * var(--ds-sf,1));--ds-type-letterspacing-default:calc(var(--ds-text-tracking,-.3px) * var(--ds-sf,1));--ds-radius:calc(var(--ds-corner-size,4px) * var(--ds-sf,1));--ds-radius-card:calc(var(--ds-card-corner-size,4px) * var(--ds-sf,1))}:host{height:var(--ds-control-height);font-family:var(--ds-typeface-regular);font-size:var(--ds-type-size-default);font-weight:var(--ds-type-weight-default);line-height:var(--ds-type-lineheight-default);letter-spacing:var(--ds-type-letterspacing-default);text-align:left;vertical-align:middle;white-space:nowrap;word-break:normal;overflow-wrap:normal;-webkit-hyphens:manual;hyphens:manual;color:var(--ds-text-tone,inherit);justify-content:flex-start;align-items:center;display:inline-flex}:host([hidden]){display:none!important}:host([data-language=ja]){font-family:var(--ds-typeface-regular-jp,var(--typeface-regular-jp))}:host([data-language=zh]),:host([data-language=zh-hant]){font-family:var(--ds-typeface-regular-zh-hant,var(--typeface-regular-zh-hant));font-weight:var(--ds-type-weight-default,400)}:host([data-language=zh-hans]){font-family:var(--ds-typeface-regular-zh-hans,var(--typeface-regular-zh-hans));font-weight:var(--ds-type-weight-default,400)}:host span{color:inherit}:host([literal]){height:auto;min-height:var(--ds-control-height);min-width:0;max-width:100%;overflow:var(--ds-text-overflow,hidden);font-family:var(--ds-typeface-regular);font-feature-settings:var(--ds-font-features);font-size:var(--ds-type-size-default);font-weight:var(--ds-type-weight-default);line-height:var(--ds-type-lineheight-default);letter-spacing:var(--ds-type-letterspacing-default);text-overflow:clip;white-space:nowrap;display:inline-block}:host([literal]:not([wrap])[data-cut=end]){-webkit-mask-image:linear-gradient(to right, #000 calc(100% - var(--ds-unit)), transparent);mask-image:linear-gradient(to right, #000 calc(100% - var(--ds-unit)), transparent)}:host([literal]:not([wrap])[data-cut=end]:dir(rtl)){-webkit-mask-image:linear-gradient(to left, #000 calc(100% - var(--ds-unit)), transparent);mask-image:linear-gradient(to left, #000 calc(100% - var(--ds-unit)), transparent)}:host([strong]){font-weight:var(--ds-type-weight-bold)}:host([wrap]){height:auto;min-height:var(--ds-control-height);max-width:100%;line-height:var(--ds-unit);white-space:normal;display:inline-block;overflow:visible}:host([tone=muted]){--ds-text-tone:var(--ds-text-color-muted)}:host([tone=title]){--ds-text-tone:var(--ds-title-color)}:host([tone=danger]){--ds-text-tone:var(--ds-danger-color)}:host([tone=warning]){--ds-text-tone:var(--ds-warning-color)}:host([size=small]){font-size:var(--ds-type-size-small)}:host([size=heading]){height:auto;font-size:var(--ds-type-size-heading);line-height:var(--ds-type-lineheight-default)}:host([size=display]){height:auto;min-height:calc(2 * var(--ds-unit));font-size:var(--ds-type-size-display);line-height:calc(2 * var(--ds-unit));letter-spacing:calc(var(--ds-display-text-tracking,-.4px) * var(--ds-sf,1));display:inline-block}";
Bc("ds-text", class extends Rc {
	static get properties() {
		return {
			text: {
				type: String,
				reflect: !0
			},
			literal: {
				type: Boolean,
				reflect: !0
			},
			tone: {
				type: String,
				reflect: !0
			},
			size: {
				type: String,
				reflect: !0
			},
			strong: {
				type: Boolean,
				reflect: !0
			},
			wrap: {
				type: Boolean,
				reflect: !0
			},
			_text: {
				type: String,
				state: !0
			}
		};
	}
	_slotKey = "";
	cuts = new rl(this, {
		targets: () => this.literal && !this.wrap ? [this] : [],
		text: !0
	});
	boundHandlers;
	constructor() {
		super(), this.text = "", this.literal = !1, this.strong = !1, this.wrap = !1, this._text = "", this._currentLanguage = ed.value, this.boundHandlers = { languageChanged: (() => {
			this._currentLanguage = ed.value, this._updateLanguageAttribute(), this._loadText(), this.requestUpdate();
		}) };
	}
	static styles = Ps(Td);
	connectedCallback() {
		if (super.connectedCallback(), !this.text && !this.literal) {
			let e = this.textContent?.trim() || "";
			e && (this._slotKey = e, this.textContent = "");
		}
		this._currentLanguage = ed.value, this._updateLanguageAttribute(), this._loadText(), window.addEventListener("language-changed", this.boundHandlers.languageChanged), window.addEventListener("translations-loaded", this.boundHandlers.languageChanged);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.removeEventListener("language-changed", this.boundHandlers.languageChanged), window.removeEventListener("translations-loaded", this.boundHandlers.languageChanged);
	}
	willUpdate(e) {
		super.willUpdate(e), (e.has("text") || e.has("literal")) && this._loadText();
	}
	_updateLanguageAttribute() {
		let e = (this._currentLanguage || ed.value || "").toLowerCase().split(/[-_]/).filter(Boolean), t = e[0] || "";
		if (t === "ja") this.setAttribute("data-language", "ja");
		else if (t === "zh") {
			let t = e.includes("hans") || e.includes("cn") || e.includes("sg"), n = e.includes("hant") || e.includes("tw") || e.includes("hk") || e.includes("mo");
			t ? this.setAttribute("data-language", "zh-hans") : n ? this.setAttribute("data-language", "zh-hant") : this.setAttribute("data-language", "zh");
		} else this.removeAttribute("data-language");
	}
	_loadText() {
		let e = this.text || this._slotKey;
		if (!e) this._text = "", this._updateLanguageAttribute();
		else if (this.literal) this._text = e, this._updateLanguageAttribute();
		else {
			try {
				let t = bd(e);
				this._text = t || e;
			} catch (t) {
				console.error("Error loading text for key:", e, t), this._text = e;
			}
			this._updateLanguageAttribute();
		}
	}
	render() {
		return this.literal && !this.text ? X`<slot></slot>` : X`<span>${this._text || this.text || this._slotKey}</span>`;
	}
});
//#endregion
//#region src/vendor/ds1/3-unit/styles/ds-table-of-contents.css?inline
var Ed = "[data-ds-shape=square],:host([data-ds-shape=square]){--ds-corner-size:0px;--ds-corner-shape:round;--ds-button-inset:.5px}[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:4px;--ds-corner-shape:round;--ds-button-inset:2.5px}[data-ds-shape=circular],:host([data-ds-shape=circular]){--ds-corner-size:999px;--ds-corner-shape:round;--ds-button-inset:5px}@supports (corner-shape:squircle){[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:8px;--ds-corner-shape:squircle}}:root,:host,:where([data-ds-surface]){--ds-unit:calc(var(--ds-1,20px) * var(--ds-sf,1));--ds-control-height:calc(var(--ds-control-size,var(--ds-08,16px)) * var(--ds-sf,1));--ds-row-height:calc(var(--ds-row-size,var(--ds-1,20px)) * var(--ds-sf,1));--ds-type-size-default:calc(var(--ds-text-size,14px) * var(--ds-sf,1));--ds-type-size-small:calc(var(--ds-small-text-size,10px) * var(--ds-sf,1));--ds-type-size-heading:calc(var(--ds-heading-text-size,13px) * var(--ds-sf,1));--ds-type-size-display:calc(var(--ds-display-text-size,20px) * var(--ds-sf,1));--ds-type-lineheight-default:calc(var(--ds-text-leading,16px) * var(--ds-sf,1));--ds-type-letterspacing-default:calc(var(--ds-text-tracking,-.3px) * var(--ds-sf,1));--ds-radius:calc(var(--ds-corner-size,4px) * var(--ds-sf,1));--ds-radius-card:calc(var(--ds-card-corner-size,4px) * var(--ds-sf,1))}:host{width:var(--ds-toc-width,calc(12 * var(--ds-unit)));max-width:100%;color:var(--ds-text-color);font-family:var(--ds-typeface-regular);font-size:var(--ds-type-size-default);font-weight:var(--ds-type-weight-default);line-height:var(--ds-type-lineheight-default);letter-spacing:var(--ds-type-letterspacing-default);display:block}:host([hidden]){display:none!important}.title{min-height:var(--ds-unit);align-items:flex-end;display:flex}.links{margin-top:var(--ds-unit)}a,::slotted(a){box-sizing:border-box;min-height:var(--ds-unit);padding-top:calc(4px * var(--ds-sf));color:var(--ds-toc-color,var(--ds-text-color-muted));font:inherit;line-height:var(--ds-type-lineheight-default);letter-spacing:inherit;white-space:nowrap;text-overflow:clip;padding-inline-start:calc(var(--toc-depth,0) * var(--ds-unit));text-decoration:none;display:block;overflow:hidden}a[data-cut=end],::slotted(a[data-cut=end]){-webkit-mask-image:linear-gradient(to right, #000 calc(100% - var(--ds-unit)), transparent);mask-image:linear-gradient(to right, #000 calc(100% - var(--ds-unit)), transparent)}:host(:dir(rtl)) a[data-cut=end],:host(:dir(rtl)) ::slotted(a[data-cut=end]){-webkit-mask-image:linear-gradient(to left, #000 calc(100% - var(--ds-unit)), transparent);mask-image:linear-gradient(to left, #000 calc(100% - var(--ds-unit)), transparent)}a:hover,::slotted(a:hover){color:var(--ds-text-color);text-decoration:underline}a[aria-current],::slotted(a[aria-current]){color:var(--ds-toc-current-color,var(--ds-sharp-blue))}a:focus-visible,::slotted(a:focus-visible){outline:1px solid var(--ds-focus-ring);outline-offset:1px}";
//#endregion
//#region src/table-of-contents.ts
Bc("ds-table-of-contents", class extends Rc {
	static properties = {
		items: { attribute: !1 },
		label: { type: String },
		literal: { type: Boolean },
		target: { attribute: !1 },
		current: { state: !0 }
	};
	static styles = Ps(Ed);
	cuts = new rl(this, {
		selector: "a",
		targets: () => this.querySelectorAll(":scope > a"),
		text: !0
	});
	links = [];
	sections = [];
	scroller = null;
	frame = 0;
	observer;
	resize;
	relabel = () => this.requestUpdate();
	constructor() {
		super(), this.items = [], this.label = "Contents", this.literal = !1, this.current = "";
	}
	connectedCallback() {
		super.connectedCallback(), this.addEventListener("click", this.follow), window.addEventListener("scroll", this.schedule, { passive: !0 }), window.addEventListener("resize", this.schedule, { passive: !0 }), window.addEventListener("hashchange", this.schedule), window.addEventListener("language-changed", this.relabel), window.addEventListener("translations-loaded", this.relabel), this.observer = new MutationObserver(() => this.refresh()), this.observer.observe(this, {
			subtree: !0,
			childList: !0,
			characterData: !0,
			attributes: !0,
			attributeFilter: ["href", "data-depth"]
		}), typeof ResizeObserver < "u" && (this.resize = new ResizeObserver(this.schedule)), this.updateComplete.then(() => {
			this.isConnected && this.refresh();
		}), this.ownerDocument.fonts?.ready.then(this.schedule);
	}
	disconnectedCallback() {
		this.removeEventListener("click", this.follow), window.removeEventListener("scroll", this.schedule), this.scroller?.removeEventListener("scroll", this.schedule), window.removeEventListener("resize", this.schedule), window.removeEventListener("hashchange", this.schedule), window.removeEventListener("language-changed", this.relabel), window.removeEventListener("translations-loaded", this.relabel), this.observer?.disconnect(), this.resize?.disconnect(), cancelAnimationFrame(this.frame), super.disconnectedCallback();
	}
	updated(e) {
		(e.has("items") || e.has("target")) && this.refresh();
	}
	destination(e) {
		try {
			let t = new URL(e.href, this.ownerDocument.baseURI), n = new URL(this.ownerDocument.URL);
			if (!t.hash || t.origin !== n.origin || t.pathname !== n.pathname || t.search !== n.search) return null;
			let r = decodeURIComponent(t.hash.slice(1));
			return this.target ? [...this.target.querySelectorAll("[id]")].find((e) => e.id === r) ?? null : this.getRootNode().getElementById(r) ?? null;
		} catch {
			return null;
		}
	}
	refresh() {
		if (!this.isConnected) return;
		this.links = this.items.length ? [...this.renderRoot.querySelectorAll("a")] : [...this.querySelectorAll("a[href]")], this.sections = this.links.flatMap((e) => {
			let t = this.destination(e);
			return t ? [{
				link: e,
				heading: t
			}] : [];
		});
		for (let e of this.links) {
			let t = Number(e.dataset.depth ?? 0);
			e.style.setProperty("--toc-depth", String(Number.isFinite(t) ? Math.max(0, t) : 0));
		}
		this.scroller?.removeEventListener("scroll", this.schedule), this.scroller = null;
		let e = (e) => e.parentElement ?? (e.getRootNode() instanceof ShadowRoot ? e.getRootNode().host : null);
		for (let t = this.sections[0] ? e(this.sections[0].heading) : null; t; t = e(t)) if (/(auto|scroll)/.test(getComputedStyle(t).overflowY)) {
			this.scroller = t;
			break;
		}
		this.scroller?.addEventListener("scroll", this.schedule, { passive: !0 }), this.resize?.disconnect(), this.resize?.observe(this), this.target && this.resize?.observe(this.target), this.scroller && this.resize?.observe(this.scroller), this.schedule();
	}
	schedule = () => {
		this.isConnected && (cancelAnimationFrame(this.frame), this.frame = requestAnimationFrame(() => this.track()));
	};
	track() {
		for (let e of this.links) e.scrollWidth > e.clientWidth ? e.setAttribute("data-tooltip", e.textContent?.trim() ?? "") : e.removeAttribute("data-tooltip");
		if (!this.sections.length) {
			this.mark("");
			return;
		}
		let e = this.scroller?.getBoundingClientRect()?.top ?? 0, t = this.scroller?.clientHeight ?? window.innerHeight, n = this.scroller?.scrollTop ?? window.scrollY, r = this.scroller?.scrollHeight ?? this.ownerDocument.documentElement.scrollHeight, i = n > 0 && n + t >= r - 1, a = this.renderRoot.querySelector(".title")?.getBoundingClientRect().height || 20, o = e + (i ? t : a), s = this.sections[0].link.getAttribute("href");
		for (let { link: e, heading: t } of this.sections) if (t.getBoundingClientRect().top <= o) s = e.getAttribute("href");
		else break;
		this.mark(s);
	}
	mark(e) {
		for (let t of this.links) t.getAttribute("href") === e ? t.setAttribute("aria-current", "location") : t.removeAttribute("aria-current");
		this.current !== e && (this.current = e, this.dispatchEvent(new CustomEvent("toc-change", {
			detail: { href: e },
			bubbles: !0,
			composed: !0
		})));
	}
	follow = (e) => {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
		let t = e.composedPath().find((e) => e instanceof HTMLAnchorElement);
		if (!t || !this.links.includes(t) || t.target === "_blank" || t.hasAttribute("download")) return;
		let n = this.destination(t);
		n && (e.preventDefault(), n.scrollIntoView({
			block: "start",
			behavior: "auto"
		}), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "-1"), n.focus({ preventScroll: !0 }), history.pushState(history.state, "", t.href), this.mark(t.getAttribute("href")));
	};
	render() {
		let e = this.label || "Contents", t = this.literal ? e : bd(e) || e;
		return X`<nav aria-label=${t} part="navigation">
      <div class="title"><ds-text literal strong role="heading" aria-level="2" part="title">${t}</ds-text></div>
      <div class="links" part="links"><slot @slotchange=${() => this.refresh()}>
        ${this.items.map((e) => X`<a href=${e.href} data-depth=${e.depth ?? 0} aria-current=${this.current === e.href ? "location" : Z} part="link">${e.label}</a>`)}
      </slot></div>
    </nav>`;
	}
}), td({
	autoLoad: !1,
	persist: !1,
	langTarget: !1
});
function Dd(e, t, n, r) {
	e.classList.add("aa-toc"), e.setAttribute("data-aa-interactive", "");
	let i = document.createElement("ds-table-of-contents");
	i.label = "Table of contents", i.literal = !0, i.target = n;
	let a = document.createElement("span");
	a.className = "aa-toc-empty", a.textContent = "Add headings to show them here.", e.append(i, a);
	let o = `aa-heading-${crypto.randomUUID()}`, s = 0, c = "";
	return () => {
		let e = t().flatMap((e, t) => {
			if (e.kind !== "heading") return [];
			let r = ta(e).filter((e) => e.kind === "text").map((t) => e.source.slice(t.from, t.to)).join("").trim();
			if (!r) return [];
			let i = n.children[t];
			return i ? (i.id ||= `${o}-${s++}`, [{
				index: t,
				text: r,
				level: e.level ?? 1,
				id: i.id
			}]) : [];
		}), l = JSON.stringify(e);
		if (l !== c) {
			c = l;
			let t = Math.min(...e.map((e) => e.level));
			i.replaceChildren(...e.map((e) => {
				let n = document.createElement("a");
				return n.href = `#${e.id}`, n.dataset.depth = String(e.level - t), n.textContent = e.text, n.addEventListener("click", (t) => {
					t.preventDefault(), t.stopPropagation(), r(e.index);
				}), n;
			})), a.hidden = !!e.length;
		}
		i.refresh?.();
	};
}
//#endregion
//#region node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/directives/if-defined.js
var $ = (e) => e ?? Z, Od = class extends Rc {
	static properties = { disabled: {
		type: Boolean,
		reflect: !0,
		noAccessor: !0
	} };
	#e = !1;
	#t;
	get hostControl() {
		return !0;
	}
	syncControl() {
		this.isConnected && this.#n();
	}
	get disabled() {
		return this.#e;
	}
	set disabled(e) {
		let t = this.#e;
		this.#e = !!e, this.isConnected && this.#n(), this.requestUpdate("disabled", t);
	}
	constructor() {
		super(), this.addEventListener("keydown", this.#i), this.addEventListener("keyup", this.#a), this.addEventListener("click", this.#r, { capture: !0 });
	}
	connectedCallback() {
		super.connectedCallback(), this.hostControl && !this.hasAttribute("role") && this.setAttribute("role", "button"), this.#n();
	}
	#n() {
		this.toggleAttribute("disabled", this.#e), this.hostControl && (this.hasAttribute("role") || this.setAttribute("role", "button"), this.#e ? (this.#t === void 0 && (this.#t = this.getAttribute("tabindex")), this.setAttribute("aria-disabled", "true"), this.setAttribute("tabindex", "-1")) : (this.removeAttribute("aria-disabled"), this.#t === void 0 ? this.hasAttribute("tabindex") || this.setAttribute("tabindex", "0") : (this.#t === null ? this.setAttribute("tabindex", "0") : this.setAttribute("tabindex", this.#t), this.#t = void 0)));
	}
	#r = (e) => {
		this.disabled && (e.preventDefault(), e.stopImmediatePropagation());
	};
	#i = (e) => {
		this.hostControl && !this.disabled && e.target === this && (e.key === "Enter" ? (e.preventDefault(), this.click()) : e.key === " " && e.preventDefault());
	};
	#a = (e) => {
		this.hostControl && !this.disabled && e.target === this && e.key === " " && (e.preventDefault(), this.click());
	};
}, kd = "[data-ds-shape=square],:host([data-ds-shape=square]){--ds-corner-size:0px;--ds-corner-shape:round;--ds-button-inset:.5px}[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:4px;--ds-corner-shape:round;--ds-button-inset:2.5px}[data-ds-shape=circular],:host([data-ds-shape=circular]){--ds-corner-size:999px;--ds-corner-shape:round;--ds-button-inset:5px}@supports (corner-shape:squircle){[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:8px;--ds-corner-shape:squircle}}:root,:host,:where([data-ds-surface]){--ds-unit:calc(var(--ds-1,20px) * var(--ds-sf,1));--ds-control-height:calc(var(--ds-control-size,var(--ds-08,16px)) * var(--ds-sf,1));--ds-row-height:calc(var(--ds-row-size,var(--ds-1,20px)) * var(--ds-sf,1));--ds-type-size-default:calc(var(--ds-text-size,14px) * var(--ds-sf,1));--ds-type-size-small:calc(var(--ds-small-text-size,10px) * var(--ds-sf,1));--ds-type-size-heading:calc(var(--ds-heading-text-size,13px) * var(--ds-sf,1));--ds-type-size-display:calc(var(--ds-display-text-size,20px) * var(--ds-sf,1));--ds-type-lineheight-default:calc(var(--ds-text-leading,16px) * var(--ds-sf,1));--ds-type-letterspacing-default:calc(var(--ds-text-tracking,-.3px) * var(--ds-sf,1));--ds-radius:calc(var(--ds-corner-size,4px) * var(--ds-sf,1));--ds-radius-card:calc(var(--ds-card-corner-size,4px) * var(--ds-sf,1))}:host([control=host]),:host([control=slotted]) ::slotted(:is(button,a)){box-sizing:border-box!important;align-items:center!important;justify-content:var(--ds-button-align,flex-start)!important;gap:var(--ds-button-gap,calc(4px * var(--ds-sf)))!important;min-width:0!important;max-width:100%!important;height:var(--ds-button-height,var(--ds-control-height))!important;padding:var(--ds-button-padding,0)!important;border-radius:var(--ds-radius)!important;corner-shape:var(--ds-corner-shape,round)!important;background:var(--ds-button-background,transparent)!important;color:var(--ds-button-color,var(--ds-button-text-color))!important;font-family:var(--ds-typeface-regular)!important;font-feature-settings:var(--ds-font-features)!important;font-size:var(--ds-type-size-default)!important;font-weight:var(--ds-type-weight-default)!important;line-height:var(--ds-type-lineheight-default)!important;letter-spacing:var(--ds-type-letterspacing-default)!important;white-space:nowrap!important;cursor:pointer!important;-webkit-user-select:none!important;user-select:none!important;-webkit-tap-highlight-color:transparent!important;outline:none!important;transition:opacity .12s!important;display:inline-flex!important}:host([control=host]) ::slotted(*){flex:none!important}:host([fit][control=slotted]) ::slotted(:is(button,a)){width:max-content!important;min-width:var(--ds-button-min-width,0px)!important;justify-content:var(--ds-button-align,flex-start)!important}:host([control=host][primary]),:host([control=slotted][primary]){--ds-button-padding:0 calc(var(--ds-button-inset,4px) * var(--ds-sf));--ds-button-background:var(--ds-button-background-color-primary);--ds-button-color:var(--ds-button-text-color-on-accent)}:host([control=host][secondary]),:host([control=slotted][secondary]){--ds-button-padding:0 calc(var(--ds-button-inset,4px) * var(--ds-sf));--ds-button-background:var(--ds-button-background-color-secondary)}:host([control=host][secondary]:hover:not([disabled])),:host([control=slotted][secondary]:hover:not([disabled])){--ds-button-background:var(--ds-fill-hover)}:host([control=host][active]),:host([control=slotted][active]){--ds-button-background:var(--ds-fill)}:host([control=host][role=tab]),:host([control=host][choice]),:host([control=slotted][choice]){--ds-button-padding:0 calc(4px * var(--ds-sf));--ds-button-color:var(--ds-text-color-muted)}:host([control=host][role=tab]:hover:not([disabled])),:host([control=host][choice]:hover:not([disabled])),:host([control=slotted][choice]:hover:not([disabled])){--ds-button-background:color-mix(in srgb, var(--ds-fill) 72%, transparent);--ds-button-color:var(--ds-text-color)}:host([control=host][role=tab][active]),:host([control=host][role=tab][active]:hover:not([disabled])),:host([control=host][choice][active]),:host([control=host][choice][active]:hover:not([disabled])),:host([control=slotted][choice][active]),:host([control=slotted][choice][active]:hover:not([disabled])){--ds-button-background:var(--ds-fill);--ds-button-color:var(--ds-text-color)}:host([control=host]) ::slotted([slot=icon]){width:var(--ds-control-height)!important;height:var(--ds-control-height)!important;justify-content:center!important;align-items:center!important;display:inline-flex!important}:host([control=host]) ::slotted([slot=trailing]){color:var(--ds-text-color-muted)!important;font-variant-numeric:tabular-nums!important}:host([control=host][icon]),:host([control=slotted][icon]){width:var(--ds-button-height,var(--ds-control-height))!important;height:var(--ds-button-height,var(--ds-control-height))!important;color:var(--ds-button-color,var(--ds-text-color-muted))!important;justify-content:center!important;padding:0!important}:host([control=host][icon]:hover:not([disabled])){--ds-button-color:var(--ds-text-color)}:host([control=host][role=option]),:host([control=host][role=menuitem]),:host([control=host][role=menuitemradio]),:host([control=host][role=menuitemcheckbox]){--ds-button-height:auto;--ds-button-padding:calc(4px * var(--ds-sf)) calc(6px * var(--ds-sf));width:var(--ds-button-width,100%)!important;min-height:var(--ds-row-height)!important;border-radius:var(--ds-radius)!important}:host([control=host][role=option]:hover),:host([control=host][role=menuitem]:hover),:host([control=host][role=menuitemradio]:hover),:host([control=host][role=menuitemcheckbox]:hover),:host([control=host][role=option]:focus-visible),:host([control=host][role=menuitem]:focus-visible){--ds-button-background:var(--ds-fill);outline:none!important}:host([control=host][role=option][active]){--ds-button-background:var(--ds-fill)}:host([control=host]:focus-visible),:host([control=slotted]) ::slotted(:is(button,a):focus-visible){outline:2px solid var(--ds-focus-ring)!important;outline-offset:1px!important}:host([control=host][disabled]),:host([control=slotted]) ::slotted(:is(button:disabled,a[aria-disabled=true])){cursor:default!important;opacity:.5!important;pointer-events:none!important}:host([control=slotted]) ::slotted(:is(button,a)){appearance:none!important;box-sizing:border-box!important;width:100%!important;min-height:var(--ds-button-height,var(--ds-control-height))!important;max-height:var(--ds-button-height,var(--ds-control-height))!important;box-shadow:none!important;text-align:start!important;text-transform:none!important;text-overflow:clip!important;border:0!important;margin:0!important;text-decoration:none!important;overflow:hidden!important}:host([control=slotted][icon]) ::slotted(:is(button,a)){justify-content:center!important}:host([control=slotted]){min-height:var(--ds-row-height);vertical-align:bottom;width:var(--ds-button-width,max-content);align-items:flex-end;overflow:visible}:host([control=slotted][icon]){width:max(var(--ds-row-height), var(--ds-button-height,var(--ds-control-height)))!important;height:max(var(--ds-row-height), var(--ds-button-height,var(--ds-control-height)))!important;justify-content:flex-start!important}:host([control=slotted][icon]) ::slotted(:is(button,a)){width:var(--ds-button-height,var(--ds-control-height))!important}:host([control=slotted][fixed]){width:var(--ds-button-width,calc(4 * var(--ds-unit)))}:host([control=slotted][wide]){width:var(--ds-button-width,calc(8 * var(--ds-unit)))}:host([control=slotted][fit]){width:max-content}:host([control=host][danger]),:host([control=slotted][danger]){--ds-button-color:var(--ds-danger-color,var(--ds-tuned-red))}:host([hidden]){display:none!important}:host([menu-item]){--ds-button-height:var(--ds-row-height);--ds-button-align:flex-start;--ds-button-padding:0 calc(4px * var(--ds-sf));flex:none;width:100%}:host([menu-item][control=host]),:host([menu-item][control=slotted]) ::slotted(:is(button,a)){align-items:flex-end!important}:host([menu-item]:is(:hover,:focus-within):not([disabled])){--ds-button-background:var(--ds-fill)}:host([menu-item][control=slotted]) ::slotted([aria-checked=true]){box-shadow:inset 0 0 0 1px var(--ds-focus-ring)!important}:host([control=host][paper]),:host([control=slotted][paper]) ::slotted(:is(button,a)){border-start-start-radius:var(--ds-radius)!important;border-start-end-radius:var(--ds-radius)!important;border-end-end-radius:0!important;border-end-start-radius:0!important;align-items:flex-end!important}:host([control=host][segment]){border-radius:0!important}:host([control=host]:is([segment=first],[segment=only])){border-start-start-radius:var(--ds-radius)!important;border-end-start-radius:var(--ds-radius)!important}:host([control=host]:is([segment=last],[segment=only])){border-start-end-radius:var(--ds-radius)!important;border-end-end-radius:var(--ds-radius)!important}:host([control=host]:not([icon]):not([split]):not([menu-item])){min-width:max-content!important;min-width:calc-size(max-content, round(up, size, var(--ds-unit)))!important}:host([control=slotted]) ::slotted(:is(button,a)){min-width:max-content!important;overflow:visible!important}", Ad = ":host{vertical-align:bottom;min-width:0;width:var(--ds-button-width,max-content);flex:none;max-width:100%;display:inline-flex;overflow:visible}:host([fixed]){width:var(--ds-button-width,calc(4 * var(--ds-unit)))}:host([wide]){width:var(--ds-button-width,calc(8 * var(--ds-unit)))}:host([fit]){flex:none;width:max-content}:host([fit]) :is(button,a){width:max-content;min-width:var(--ds-button-min-width,0px);justify-content:var(--ds-button-align,flex-start);flex:none}:host([fit]) :is(button,a) ds-text,:host([fit]) :is(button,a) ::slotted(*){flex:none;width:max-content}:is(button,a){box-sizing:border-box;max-height:var(--ds-control-height);height:var(--ds-control-height);min-height:var(--ds-control-height);border-radius:var(--ds-radius);corner-shape:var(--ds-corner-shape,round);cursor:pointer;width:100%;min-width:0;max-width:100%;color:var(--button-color,var(--button-text-color));font-family:var(--ds-typeface-regular);font-size:var(--ds-type-size-default);line-height:var(--ds-type-lineheight-default);letter-spacing:var(--ds-type-letterspacing-default);-webkit-tap-highlight-color:transparent;white-space:nowrap;text-overflow:clip;background-color:#0000;border:none;justify-content:flex-start;align-items:center;padding:0;text-decoration:none;display:inline-flex;overflow:clip visible}:is(button,a) ds-text,:is(button,a) ::slotted(*){text-overflow:clip;white-space:nowrap;text-align:left;max-width:100%;color:inherit;justify-content:flex-start;overflow:clip visible}:is(button,a)[primary]{background-color:var(--accent-color);color:var(--button-text-color-on-light,var(--black));font-family:var(--ds-typeface-regular);padding:0 calc(var(--ds-button-inset,4px) * var(--ds-sf));text-decoration-line:none}:is(button,a)[secondary]{background-color:var(--button-background-color-secondary);color:var(--ds-button-color,var(--ds-button-text-color));font-family:var(--ds-typeface-regular);padding:0 calc(var(--ds-button-inset,4px) * var(--ds-sf))}:host(:is([menu-item],[role=option],[role^=menuitem])) :is(button,a){height:var(--ds-button-height,var(--ds-row-height));min-height:var(--ds-button-height,var(--ds-row-height));max-height:var(--ds-button-height,var(--ds-row-height));align-items:flex-end;justify-content:var(--ds-button-align,flex-start);padding:0 calc(var(--ds-button-inset,4px) * var(--ds-sf))}:host([danger]) :is(button,a){color:var(--ds-danger-color,var(--ds-tuned-red))}:is(button:disabled,a[aria-disabled=true]){cursor:default;opacity:.5}.loading{opacity:.7}:host([icon]){width:var(--ds-control-height);height:var(--ds-control-height);flex:none}:host([icon]) :is(button,a){width:var(--ds-control-height);justify-content:center;padding:0!important}:host([icon]) ::slotted(ds-icon){width:var(--ds-control-height);height:var(--ds-control-height);flex:none}:host([square]){width:var(--ds-control-height);flex:none}:host([square]) :is(button,a){width:var(--ds-control-height);justify-content:center;padding:0!important}:host(:is([primary],[secondary]):not([icon])) ::slotted(ds-icon:last-child:not(:first-child)){margin-inline-end:calc(-4px * var(--ds-sf))}:host(:is([primary],[secondary]):not([icon])) ::slotted(ds-icon:first-child:not(:last-child)){margin-inline-start:calc(-4px * var(--ds-sf))}:host([paper]) :is(button,a){height:var(--ds-row-height);min-height:var(--ds-row-height);max-height:var(--ds-row-height);padding:0 calc(10px * var(--ds-sf));border-radius:var(--ds-radius) var(--ds-radius) 0 0;background-color:var(--ds-button-background,transparent);color:var(--ds-button-color,var(--button-text-color));align-items:flex-end}:host([segment]) :is(button,a){border-radius:0!important}:host(:is([segment=first],[segment=only])) :is(button,a){border-start-start-radius:var(--ds-radius)!important;border-end-start-radius:var(--ds-radius)!important}:host(:is([segment=last],[segment=only])) :is(button,a){border-start-end-radius:var(--ds-radius)!important;border-end-end-radius:var(--ds-radius)!important}:host(:not([icon]):not([split]):not([menu-item])){min-width:max-content;min-width:calc-size(max-content, round(up, size, var(--ds-unit)))}:is(button,a),:is(button,a) ds-text,:is(button,a) ::slotted(*){text-overflow:clip;overflow:visible;-webkit-mask-image:none;mask-image:none}", jd = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Md = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), Nd = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, Pd = class extends Nd {
	constructor(e) {
		if (super(e), this.it = Z, e.type !== jd.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
	}
	render(e) {
		if (e === Z || e == null) return this._t = void 0, this.it = e;
		if (e === bc) return e;
		if (typeof e != "string") throw Error(this.constructor.directiveName + "() called with a non-string value");
		if (e === this.it) return this._t;
		this.it = e;
		let t = [e];
		return t.raw = t, this._t = {
			_$litType$: this.constructor.resultType,
			strings: t,
			values: []
		};
	}
};
Pd.directiveName = "unsafeHTML", Pd.resultType = 1;
var Fd = Md(Pd), Id = ":host{--ds-icon-box:calc(var(--ds-icon-size,14px) * var(--ds-sf));width:var(--ds-icon-box);height:calc(var(--ds-icon-box) / var(--ds-icon-ratio,1));color:var(--ds-icon-color,currentColor);background:0 0;flex:none;justify-content:center;align-items:center;display:inline-flex}:host([hidden]){display:none!important}:host([size=small]){--ds-icon-size:12px}:host([size=large]){--ds-icon-size:16px}:host([variant=primary]){color:var(--ds-button-text-color-on-accent);background:var(--ds-accent-color)}:host([variant=secondary]){background:var(--ds-fill)}svg,::slotted(svg),::slotted(img){width:100%;height:100%;display:block}::slotted(img){object-fit:contain;border-radius:var(--ds-icon-radius,0px)}", Ld = {
	app: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"4.5\" y=\"2.5\" width=\"7\" height=\"11\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M6.5 11.5H9.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	apple: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.0351 10.793C11.8838 11.1424 11.7048 11.464 11.4974 11.7597C11.2147 12.1627 10.9832 12.4418 10.8048 12.5967C10.5283 12.851 10.232 12.9812 9.91475 12.9886C9.68698 12.9886 9.41229 12.9238 9.09255 12.7924C8.77176 12.6615 8.47695 12.5967 8.20739 12.5967C7.92469 12.5967 7.62148 12.6615 7.29717 12.7924C6.97237 12.9238 6.71071 12.9924 6.51065 12.9991C6.2064 13.0121 5.90314 12.8782 5.60044 12.5967C5.40723 12.4282 5.16557 12.1393 4.87607 11.73C4.56547 11.293 4.3101 10.7862 4.11005 10.2085C3.8958 9.58443 3.78839 8.98013 3.78839 8.39508C3.78839 7.72492 3.9332 7.14691 4.22325 6.66254C4.45121 6.27348 4.75447 5.96658 5.13403 5.74128C5.51359 5.51597 5.9237 5.40116 6.36535 5.39382C6.60701 5.39382 6.92391 5.46857 7.31773 5.61548C7.71043 5.76288 7.96259 5.83763 8.07314 5.83763C8.15579 5.83763 8.4359 5.75023 8.91077 5.57597C9.35983 5.41437 9.73883 5.34746 10.0493 5.37382C10.8906 5.44172 11.5227 5.77337 11.9431 6.37089C11.1906 6.8268 10.8184 7.46536 10.8258 8.28453C10.8326 8.9226 11.0641 9.45357 11.519 9.87516C11.7252 10.0708 11.9554 10.2221 12.2116 10.3295C12.156 10.4906 12.0974 10.6449 12.0351 10.793ZM10.1055 3.20006C10.1055 3.70017 9.92277 4.16713 9.55859 4.59933C9.11909 5.11315 8.5875 5.41005 8.01104 5.3632C8.0037 5.3032 7.99944 5.24006 7.99944 5.1737C7.99944 4.69359 8.20844 4.17978 8.5796 3.75967C8.76491 3.54696 9.00058 3.37009 9.28637 3.22901C9.57155 3.09002 9.84129 3.01316 10.095 3C10.1024 3.06686 10.1055 3.13372 10.1055 3.20006Z\" fill=\"currentColor\"/>\n</svg>",
	archive: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3.5H13.5V5.5H12.5V12.5H3.5V5.5H2.5Z\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M6.5 8.5H9.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	bag: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"2.5\" y=\"5.5\" width=\"11\" height=\"8\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M5.5 7.5V4.5C5.5 3.12 6.62 2 8 2C9.38 2 10.5 3.12 10.5 4.5V7.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	calendar: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"3.5\" y=\"4.5\" width=\"9\" height=\"8\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M3.5 6.5H12.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M5.5 3.5V5.5M10.5 3.5V5.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M5.5 8.5H9.5M5.5 10.5H9.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	camera: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 12.5V4.5H5.5L6.5 3.5H9.5L10.5 4.5H13.5V12.5Z\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<circle cx=\"8\" cy=\"8.5\" r=\"2\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<rect x=\"11\" y=\"6\" width=\"1\" height=\"1\" fill=\"currentColor\"/>\n</svg>",
	check: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.68649 11.884L12.443 6.13601L11.736 5.42715L6.68835 10.4827L4.26399 8.0501L3.55696 8.74525L6.68649 11.884Z\" fill=\"currentColor\"/>\n</svg>",
	close: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.1215 4.58087L8.70453 7.99397L12.1176 11.4169L11.4106 12.112L7.99847 8.69108L4.58636 12.112L3.87836 11.4031L7.29535 7.99005L3.88226 4.56716L4.58929 3.87201L8.0014 7.29294L11.4145 3.87201L12.1215 4.58087Z\" fill=\"currentColor\"/>\n</svg>",
	collapse: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2 4L6 8L10 4\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</svg></svg>",
	compose: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 2.5H2.5V13.5H13.5V8\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M6.5 9.5V8L12 2.5L13.5 4L8 9.5H6.5Z\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	delete: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 14\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M1 3H11M4.5 3V1.5H7.5V3M2.5 3V12.5C2.5 13.0523 2.94772 13.5 3.5 13.5H8.5C9.05228 13.5 9.5 13.0523 9.5 12.5V3\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>\n<line x1=\"4.5\" y1=\"5.5\" x2=\"4.5\" y2=\"11\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>\n<line x1=\"7.5\" y1=\"5.5\" x2=\"7.5\" y2=\"11\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>\n</svg></svg>",
	down: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\">\n  <path d=\"M7.49645 12.5178V2.86102e-06H8.50702L8.50841 12.5174L11.4156 9.61018L12.1095 10.317L8.00173 14.4248L3.8905 10.3135L4.59784 9.60619L7.49645 12.5178Z\" fill=\"currentColor\"/>\n</svg>",
	duplicate: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\">\n<g id=\"Icons\">\n<g id=\"Duplicate\">\n<path id=\"âD\" d=\"M2.41924 3.49777C2.08493 3.49777 1.78024 3.57818 1.50517 3.73898C1.23434 3.90402 1.0164 4.12196 0.851364 4.39279C0.690557 4.66786 0.610153 4.97254 0.610153 5.30685C0.610153 5.63693 0.690557 5.93739 0.851364 6.20822C1.0164 6.47905 1.23434 6.69276 1.50517 6.84933C1.78024 7.01014 2.08493 7.09055 2.41924 7.09055H7.82109C8.15117 7.09055 8.45374 7.01014 8.72881 6.84933C9.00387 6.69276 9.22181 6.47905 9.38261 6.20822C9.54342 5.93739 9.62383 5.63693 9.62383 5.30685C9.62383 4.97254 9.54342 4.66786 9.38261 4.39279C9.22181 4.12196 9.00387 3.90402 8.72881 3.73898C8.45374 3.57818 8.15117 3.49777 7.82109 3.49777C7.49101 3.49777 7.18844 3.57818 6.91338 3.73898C6.64254 3.90402 6.42461 4.12196 6.25957 4.39279C6.09876 4.66786 6.01836 4.97254 6.01836 5.30685V10.677C6.01836 11.007 6.09876 11.3096 6.25957 11.5847C6.42461 11.8598 6.64254 12.0777 6.91338 12.2385C7.18844 12.4035 7.49101 12.4861 7.82109 12.4861C8.15117 12.4861 8.45374 12.4035 8.72881 12.2385C9.00387 12.0777 9.22181 11.8598 9.38261 11.5847C9.54342 11.3096 9.62383 11.007 9.62383 10.677C9.62383 10.3427 9.54342 10.0401 9.38261 9.76926C9.22181 9.49842 9.00387 9.2826 8.72881 9.1218C8.45374 8.96522 8.15117 8.88693 7.82109 8.88693H3.7205C3.58086 8.88693 3.46237 8.9356 3.36504 9.03293C3.26771 9.13026 3.21904 9.24663 3.21904 9.38205C3.21904 9.5217 3.26771 9.64019 3.36504 9.73752C3.46237 9.83485 3.58086 9.88351 3.7205 9.88351H7.80205C8.02633 9.88351 8.21676 9.95969 8.37334 10.112C8.52991 10.2686 8.6082 10.4569 8.6082 10.677C8.6082 10.897 8.52991 11.0832 8.37334 11.2356C8.22099 11.3921 8.03691 11.4704 7.82109 11.4704C7.60527 11.4704 7.41907 11.3921 7.2625 11.2356C7.10592 11.079 7.02763 10.8864 7.02763 10.6579V5.31955C7.02763 5.09527 7.10592 4.90484 7.2625 4.74826C7.41907 4.59168 7.60527 4.5134 7.82109 4.5134C8.03691 4.5134 8.22099 4.58957 8.37334 4.74191C8.52991 4.89849 8.6082 5.0868 8.6082 5.30685C8.6082 5.52691 8.52991 5.71522 8.37334 5.8718C8.21676 6.02837 8.02633 6.10666 7.80205 6.10666H2.43828C2.21399 6.10666 2.02145 6.02837 1.86064 5.8718C1.70407 5.71522 1.62578 5.52691 1.62578 5.30685C1.62578 5.0868 1.70195 4.89849 1.85429 4.74191C2.01087 4.58957 2.19918 4.5134 2.41924 4.5134C2.63082 4.5134 2.81491 4.59168 2.97148 4.74826C3.12806 4.90907 3.20634 5.0995 3.20634 5.31955V10.6579C3.20634 10.8864 3.12806 11.079 2.97148 11.2356C2.81491 11.3921 2.63082 11.4704 2.41924 11.4704C2.19918 11.4704 2.01087 11.3921 1.85429 11.2356C1.70195 11.0832 1.62578 10.897 1.62578 10.677C1.62578 10.4569 1.70407 10.2686 1.86064 10.112C2.02145 9.95969 2.21399 9.88351 2.43828 9.88351H3.7205C3.85169 9.88351 3.96595 9.83485 4.06328 9.73752C4.16061 9.64019 4.20927 9.5217 4.20927 9.38205C4.20927 9.24663 4.16061 9.13026 4.06328 9.03293C3.96595 8.9356 3.85169 8.88693 3.7205 8.88693H2.41924C2.08493 8.88693 1.78024 8.96522 1.50517 9.1218C1.23434 9.2826 1.0164 9.49842 0.851364 9.76926C0.690557 10.0401 0.610153 10.3427 0.610153 10.677C0.610153 11.007 0.690557 11.3096 0.851364 11.5847C1.0164 11.8598 1.23434 12.0777 1.50517 12.2385C1.78024 12.4035 2.08493 12.4861 2.41924 12.4861C2.74931 12.4861 3.04977 12.4035 3.3206 12.2385C3.59567 12.0777 3.8136 11.8598 3.97441 11.5847C4.13945 11.3096 4.22197 11.007 4.22197 10.677V5.30685C4.22197 4.97254 4.13945 4.66786 3.97441 4.39279C3.8136 4.12196 3.59567 3.90402 3.3206 3.73898C3.04977 3.57818 2.74931 3.49777 2.41924 3.49777Z\" fill=\"currentColor\" />\n<path id=\"âD_2\" d=\"M10.4239 3.37692V12.6069H12.6079C14.4409 12.6069 15.3899 11.4759 15.3899 9.23992V6.89992C15.3899 4.57292 14.4279 3.37692 12.5819 3.37692H10.4239ZM12.4909 4.44292C13.4919 4.44292 13.9469 5.22292 13.9469 6.75692V9.27892C13.9469 10.8389 13.5049 11.5409 12.4909 11.5409H11.8149V4.44292H12.4909Z\" fill=\"currentColor\" />\n</g>\n</g>\n</svg>",
	email: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 11\" fill=\"none\">\n  <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M14.0871 0.989435L0.930906 0.988037L0.930542 11L13.0753 11H14.0871V0.989435ZM7.50709 8.0566L1.94249 2.49201L1.94248 9.98814H13.0753V2.48839L7.50709 8.0566ZM2.85116 2L7.50709 6.65593L12.1515 1.99952L2.85116 2Z\" fill=\"currentColor\"/>\n</svg></svg>",
	expand: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\">\n  <path d=\"M0 5.81415V0H5.80924L5.81842 0.990424H1.70698L11.0089 10.2943L10.9997 6.18585H12V12H6.19076L6.18158 11.0096H10.293L0.99115 1.70573L1.00033 5.81415H0Z\" fill=\"currentColor\"/>\n</svg></svg>",
	folder: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 13.5V3.5H6.5L8 5.5H13.5V13.5Z\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	google: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.0004 8.11502C13.0004 7.77514 12.9723 7.43342 12.9123 7.09904H8.10071V9.02447H10.8561C10.7418 9.64542 10.3744 10.1948 9.83641 10.5438V11.7932H11.4803C12.4456 10.9223 13.0004 9.63627 13.0004 8.11502Z\" fill=\"#4285F4\"/>\n<path d=\"M8.10074 13.0001C9.47654 13.0001 10.6368 12.5573 11.4821 11.793L9.83829 10.5437C9.38094 10.8487 8.79049 11.0214 8.10259 11.0214C6.77176 11.0214 5.64336 10.1413 5.23849 8.95818H3.54215V10.2461C4.40813 11.9345 6.17195 13.0001 8.10074 13.0001Z\" fill=\"#34A853\"/>\n<path d=\"M5.23681 8.95856C5.02313 8.33756 5.02313 7.66515 5.23681 7.04416V5.75627H3.54234C2.81882 7.1691 2.81863 8.83323 3.54215 10.2461L5.23681 8.95856Z\" fill=\"#FBBC04\"/>\n<path d=\"M8.10074 4.97895C8.82799 4.96793 9.53089 5.23616 10.0576 5.72854L11.514 4.30101C10.5918 3.45222 9.36784 2.98556 8.10074 3.00026C6.17195 3.00026 4.40832 4.06603 3.54234 5.75627L5.23681 7.04416C5.63981 5.85915 6.76989 4.97895 8.10074 4.97895Z\" fill=\"#EA4335\"/>\n</svg>",
	home: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M1 5L6 1L11 5V11H7.5V7.5H4.5V11H1V5Z\" fill=\"currentColor\"/>\n</svg></svg>",
	left: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\">\n  <path d=\"M1.90697 8.60594H15.0636V9.61651L1.90734 9.61791L4.81456 12.5251L4.10774 13.219L0 9.11123L4.11122 5L4.81855 5.70734L1.90697 8.60594Z\" fill=\"currentColor\"/>\n</svg>",
	lists: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 4H13.5M2.5 8H13.5M2.5 12H13.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	lock: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8 2.60742C9.53669 2.60746 10.7822 3.85296 10.7822 5.38965V7.64746H11.5996V13.3926H4.40039V7.64746H5.21777V5.38965C5.21779 3.85295 6.4633 2.60744 8 2.60742ZM8 3.62695C7.02663 3.62697 6.23733 4.41628 6.2373 5.38965V7.64746H9.7627V5.38965C9.76267 4.41629 8.97336 3.62699 8 3.62695Z\" fill=\"currentColor\"/>\n</svg>",
	loop: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.0037 1.96826L12.0037 7.12486L14.9023 4.21328L15.6096 4.92061L11.4984 9.03184L7.39064 4.92409L8.08449 4.21727L10.9917 7.12449L10.9931 2.98673L5.00853 3.00323V1.98475L12.0037 1.96826Z\" fill=\"currentColor\"/>\n<path d=\"M3.99657 14.0318L3.99657 8.87523L1.09796 11.7868L0.390625 11.0795L4.50185 6.96825L8.6096 11.076L7.91576 11.7828L5.00853 8.8756L5.00714 13.0134L10.9917 12.9972V14.0157L3.99657 14.0318Z\" fill=\"currentColor\"/>\n<path d=\"M10.9917 12.9972V14.0157H12.0037V12.9973V9.85949L10.9917 9.85912V12.9972Z\" fill=\"currentColor\"/>\n<path d=\"M3.99657 5.1225V6.14098H5.00853V5.12251V1.98475L3.99657 1.98438V5.1225Z\" fill=\"currentColor\"/>\n</svg>",
	mic: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 10 14\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"2.5\" y=\"1\" width=\"5\" height=\"7\" rx=\"2.5\" stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"/>\n<path d=\"M1 6C1 8.76142 2.79086 11 5 11C7.20914 11 9 8.76142 9 6\" stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"/>\n<line x1=\"5\" y1=\"11\" x2=\"5\" y2=\"13\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>\n</svg></svg>",
	more: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><circle cx=\"4.5\" cy=\"12\" r=\"0.75\" fill=\"currentColor\"/><circle cx=\"8\" cy=\"12\" r=\"0.75\" fill=\"currentColor\"/><circle cx=\"11.5\" cy=\"12\" r=\"0.75\" fill=\"currentColor\"/></svg>",
	note: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.9653 3.31348V12.6865H2.03467V3.31348H13.9653ZM3.03467 11.6865H12.9653V4.31348H3.03467V11.6865Z\" fill=\"currentColor\"/>\n<path d=\"M8.00641 7.08004V7.99996H3.71344V7.08004H8.00641ZM9.9527 5.08004V5.99996H3.71344V5.08004H9.9527Z\" fill=\"currentColor\"/>\n</svg>",
	open: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M1.96 7.81289V1.9592H7.80797L7.81721 2.95636H3.67836L13.0422 12.3235L13.033 8.18711H14.04V14.0408H8.19203L8.18279 13.0436H12.3216L2.95776 3.67653L2.967 7.81289H1.96Z\" fill=\"currentColor\"/>\n</svg>",
	pad: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"3.5\" y=\"2.5\" width=\"9\" height=\"11\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M3.5 5.5H12.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<rect x=\"6\" y=\"8\" width=\"1\" height=\"1\" fill=\"currentColor\"/>\n<rect x=\"9\" y=\"8\" width=\"1\" height=\"1\" fill=\"currentColor\"/>\n<rect x=\"6\" y=\"11\" width=\"1\" height=\"1\" fill=\"currentColor\"/>\n<rect x=\"9\" y=\"11\" width=\"1\" height=\"1\" fill=\"currentColor\"/>\n</svg>",
	pen: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 13.5L3.5 10.5L11 3L13 5L5.5 12.5Z\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M9.5 4.5L11.5 6.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	plus: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.50235 2.6739L8.4996 7.5035L13.3334 7.51044L13.325 8.50193L8.49328 8.49569L8.49951 13.3274L7.49764 13.3268L7.50039 8.49717L2.66663 8.49024L2.67503 7.49875L7.50672 7.50499L7.50117 2.67261L8.50235 2.6739Z\" fill=\"currentColor\"/>\n</svg>",
	right: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.1566 8.60594H0V9.61651L13.1562 9.61791L10.249 12.5251L10.9558 13.219L15.0636 9.11123L10.9524 5L10.245 5.70734L13.1566 8.60594Z\" fill=\"currentColor\"/>\n</svg>",
	sdown: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.50361 11.1717L8.50222 2.92134L7.49165 2.92134L7.49165 11.1713L4.58442 8.26409L3.89058 8.97091L7.99833 13.0787L12.1096 8.96744L11.4022 8.2601L8.50361 11.1717Z\" fill=\"currentColor\"/>\n</svg>",
	search: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9.08545 6.62646C9.08545 5.25128 7.9704 4.13623 6.59521 4.13623C5.22003 4.13623 4.10498 5.25128 4.10498 6.62646C4.10498 8.00165 5.22003 9.1167 6.59521 9.1167C7.9704 9.1167 9.08545 8.00165 9.08545 6.62646ZM10.105 6.62646C10.105 7.39551 9.85647 8.10577 9.43701 8.68408L12.9146 12.1616L12.1929 12.8833L8.72412 9.41455C8.13339 9.86631 7.39632 10.1362 6.59521 10.1362C4.6567 10.1362 3.08545 8.56498 3.08545 6.62646C3.08545 4.68795 4.6567 3.1167 6.59521 3.1167C8.53373 3.1167 10.105 4.68795 10.105 6.62646Z\" fill=\"currentColor\"/>\n</svg>",
	see: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.07669 3.70416C10.1007 3.70416 11.795 4.74149 12.9566 5.73248C13.5418 6.23179 14.005 6.72991 14.3218 7.10358C14.4804 7.29069 14.6032 7.44763 14.687 7.55865C14.7289 7.61411 14.7615 7.65861 14.7837 7.68951C14.7947 7.70477 14.8031 7.71711 14.8091 7.72565C14.812 7.72971 14.8143 7.73297 14.8159 7.73541C14.8167 7.73644 14.8174 7.73762 14.8179 7.73834L14.8189 7.73932C14.819 7.73947 14.8195 7.74054 14.4409 8.00006L14.8189 8.25983L14.8179 8.2608C14.8174 8.2616 14.8168 8.26345 14.8159 8.26471C14.8142 8.26716 14.812 8.27042 14.8091 8.27448C14.8031 8.28303 14.7947 8.29531 14.7837 8.31061C14.7615 8.34152 14.7289 8.38597 14.687 8.44147C14.6032 8.5525 14.4805 8.70941 14.3218 8.89655C14.005 9.27021 13.5418 9.76835 12.9566 10.2676C11.795 11.2586 10.1006 12.296 8.07669 12.296C6.05499 12.296 4.32326 11.2606 3.12552 10.2725C2.52184 9.77448 2.04049 9.27717 1.7095 8.90436C1.54374 8.71764 1.4147 8.56095 1.32669 8.45026C1.28274 8.39498 1.24843 8.35111 1.22513 8.32037C1.21356 8.30511 1.20507 8.29275 1.19876 8.28424C1.19566 8.28005 1.19275 8.27694 1.19095 8.27448C1.19016 8.27341 1.18952 8.27227 1.189 8.27155L1.18802 8.27057V8.26959L0.99173 8.00006L1.18802 7.73053V7.72955L1.189 7.72858C1.18953 7.72784 1.19013 7.72676 1.19095 7.72565C1.19276 7.72318 1.19563 7.72011 1.19876 7.71588C1.20506 7.70738 1.21356 7.69502 1.22513 7.67975C1.24842 7.64902 1.28277 7.6051 1.32669 7.54987C1.4147 7.43918 1.54374 7.28248 1.7095 7.09576C2.04048 6.72296 2.52183 6.22565 3.12552 5.7276C4.32326 4.73948 6.05499 3.70417 8.07669 3.70416ZM8.07669 4.62213C6.36481 4.62213 4.83715 5.50531 3.7095 6.43561C3.15087 6.8965 2.70364 7.35865 2.39603 7.70514C2.29735 7.81629 2.21535 7.91722 2.147 8.00006C2.21534 8.08289 2.29738 8.18387 2.39603 8.29498C2.70365 8.64147 3.15087 9.10363 3.7095 9.56451C4.83715 10.4948 6.36481 11.378 8.07669 11.378C9.7862 11.378 11.2738 10.4968 12.3609 9.5694C12.9 9.10949 13.3285 8.64854 13.6216 8.3028C13.7189 8.18799 13.7987 8.0844 13.8648 8.00006C13.7987 7.91573 13.7189 7.81214 13.6216 7.69733C13.3285 7.35158 12.9 6.89064 12.3609 6.43073C11.2738 5.50334 9.78624 4.62213 8.07669 4.62213ZM14.9976 8.00006L14.8199 8.25983L14.4409 8.00006L14.8199 7.7403L14.9976 8.00006Z\" fill=\"currentColor\"/>\n<path d=\"M8.15292 5.66766C9.44109 5.66766 10.4858 6.71157 10.4859 7.99969C10.4859 9.28796 9.44119 10.3327 8.15292 10.3327C6.8648 10.3325 5.82089 9.28786 5.82089 7.99969C5.82106 6.71167 6.8649 5.66783 8.15292 5.66766Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"0.81\"/>\n</svg>",
	shared: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"5\" cy=\"8\" r=\"3.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<clipPath id=\"shared-behind\"><path d=\"M0 0H16V16H0ZM10 8A5 5 0 1 0 0 8A5 5 0 1 0 10 8Z\" clip-rule=\"evenodd\"/></clipPath>\n<circle cx=\"11\" cy=\"8\" r=\"3.5\" stroke=\"currentColor\" stroke-width=\"0.92\" clip-path=\"url(#shared-behind)\"/>\n</svg>",
	star: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.38604 13.4L5.77704 9.26605L2.42304 7.01705H6.53104L8.00004 2.58405L9.49504 7.01705H13.577L10.223 9.26605L11.64 13.4L8.00004 10.761L4.38604 13.4Z\" fill=\"currentColor\"/>\n</svg>",
	stats: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4 7V13M8 3V13M12 5V13\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	store: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"4\" y=\"4\" width=\"8\" height=\"8\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M8 4V12M4 8H12\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	sup: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.49658 4.82836L7.49798 13.0787L8.50855 13.0787L8.50855 4.82873L11.4158 7.73596L12.1096 7.02913L8.00187 2.92138L3.89064 7.03261L4.59798 7.73995L7.49658 4.82836Z\" fill=\"currentColor\"/>\n</svg>",
	template: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"3.5\" y=\"2.5\" width=\"9\" height=\"11\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M5.5 6.5H9.5M5.5 8.5H9.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
	unlock: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M10.8617 2.90512C12.3984 2.90512 13.6438 4.15073 13.644 5.68735V7.95688H12.6244V5.68735C12.6243 4.71406 11.835 3.92465 10.8617 3.92465C9.88855 3.92482 9.09917 4.71417 9.09903 5.68735V7.59164H9.81583V13.3377H2.61563V7.59164H8.0795V5.68735C8.07964 4.15084 9.32522 2.90529 10.8617 2.90512ZM3.63516 12.3172H8.79532V8.61118H3.63516V12.3172Z\" fill=\"currentColor\"/>\n</svg>",
	unmic: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 10 14\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"2.5\" y=\"1\" width=\"5\" height=\"7\" rx=\"2.5\" stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"/>\n<path d=\"M1 6C1 8.76142 2.79086 11 5 11C7.20914 11 9 8.76142 9 6\" stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"/>\n<line x1=\"5\" y1=\"11\" x2=\"5\" y2=\"13\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>\n<line x1=\"1\" y1=\"1\" x2=\"9\" y2=\"13\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>\n</svg></svg>",
	unsee: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.4541 12.789L13.1743 12.0688L12.6027 11.4967L12.6 11.4994L12.0137 10.9144C11.7332 11.103 11.4336 11.283 11.1164 11.4457L11.4068 11.7363L11.4046 11.7385L12.4541 12.789Z\" fill=\"currentColor\"/>\n<path d=\"M5.96371 6.28857L9.79315 10.1213C10.0642 9.91923 10.2966 9.66816 10.4772 9.38122L6.69735 5.60959C6.41317 5.78931 6.16435 6.0199 5.96371 6.28857Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M3.68238 4.00893L3.09583 3.42183L3.79957 2.7181L3.816 2.70167L5.35651 4.24363L6.05746 4.94524L6.712 5.6004L10.4818 9.3738L11.3559 10.2487L12.0181 10.9115L12.6027 11.4967L12.6 11.4994L12.0137 10.9144C11.7332 11.103 11.4336 11.283 11.1164 11.4457L11.4068 11.7363L11.4046 11.7385L11.1136 11.4472L10.4275 10.7604L9.79075 10.1231L5.96207 6.29078L5.08276 5.41064L4.4124 4.73965L3.68238 4.00893ZM12.6382 10.4584C12.7502 10.37 12.8582 10.2812 12.9619 10.1927C13.5472 9.69339 14.0104 9.19525 14.3271 8.82158C14.4858 8.63445 14.6085 8.47754 14.6924 8.36651C14.7343 8.31101 14.7669 8.26656 14.7891 8.23565L14.7965 8.22527L14.8089 8.20741L14.8145 8.19951L14.8213 8.18975C14.8218 8.18905 14.8222 8.18816 14.8225 8.18737L14.8232 8.18584L14.8242 8.18487L15.0029 7.9251L14.8252 7.66533L14.4463 7.9251C14.8248 7.66558 14.8243 7.66451 14.8242 7.66436L14.8232 7.66338L14.8213 7.66045L14.8145 7.65069C14.8085 7.64215 14.8 7.62981 14.7891 7.61455C14.7669 7.58365 14.7343 7.53915 14.6924 7.48369C14.6085 7.37267 14.4858 7.21573 14.3271 7.02862C14.0104 6.65495 13.5472 6.15682 12.9619 5.65752C11.8003 4.66652 10.106 3.6292 8.08203 3.6292C7.38933 3.6292 6.73067 3.75074 6.11587 3.95029L6.86093 4.69373C7.25481 4.60011 7.6629 4.54717 8.08203 4.54717C9.79158 4.54717 11.2792 5.42838 12.3662 6.35576C12.9053 6.81567 13.3338 7.27662 13.627 7.62237C13.7119 7.72259 13.7835 7.81425 13.8443 7.89203L13.8701 7.9251L13.8442 7.95828C13.7834 8.03603 13.7119 8.12766 13.627 8.22783C13.3338 8.57358 12.9053 9.03452 12.3662 9.49444C12.2436 9.599 12.116 9.70298 11.9835 9.80517L12.6382 10.4584ZM5.58478 6.99004L9.09135 10.4996C8.80023 10.6051 8.48611 10.6626 8.15857 10.6626C6.64663 10.6626 5.42096 9.43698 5.42096 7.92504C5.42096 7.59666 5.47878 7.28179 5.58478 6.99004ZM10.371 11.7804L9.65051 11.0593C9.15436 11.2126 8.62958 11.303 8.08203 11.303C6.37015 11.303 4.84249 10.4199 3.71484 9.48955C3.15622 9.02867 2.70899 8.56651 2.40137 8.22002C2.31556 8.12337 2.24231 8.03438 2.17972 7.95834L2.15234 7.9251L2.17972 7.89186C2.24231 7.81582 2.31553 7.72686 2.40137 7.63018C2.70898 7.28369 3.15621 6.82154 3.71484 6.36065C3.93564 6.17849 4.17177 5.99814 4.42162 5.82588L3.76309 5.16678C3.53867 5.32681 3.32756 5.49036 3.13086 5.65264C2.52717 6.15069 2.04582 6.648 1.71484 7.0208C1.54908 7.20752 1.42004 7.36421 1.33203 7.4749C1.28811 7.53014 1.25376 7.57406 1.23047 7.60479C1.22314 7.61446 1.21704 7.62297 1.21196 7.63006L1.2041 7.64092C1.20236 7.64328 1.20069 7.64527 1.19925 7.647L1.19629 7.65069L1.19434 7.65362L1.19336 7.65557L0.99707 7.9251L1.19336 8.19561L1.19434 8.19658L1.19629 8.19951L1.19926 8.20322C1.20071 8.20495 1.20238 8.20695 1.2041 8.20928L1.21195 8.22013C1.21704 8.22723 1.22314 8.23575 1.23047 8.24541C1.25377 8.27615 1.28809 8.32002 1.33203 8.3753C1.42004 8.48598 1.54908 8.64268 1.71484 8.8294C2.04583 9.20221 2.52718 9.69952 3.13086 10.1976C4.3286 11.1857 6.06033 12.221 8.08203 12.221C8.90391 12.221 9.67144 12.0499 10.371 11.7804ZM10.8048 8.62904C10.8644 8.4044 10.8962 8.16843 10.8962 7.92504C10.8962 6.4131 9.6705 5.18743 8.15857 5.18743C7.91309 5.18743 7.67517 5.21974 7.44881 5.28033L10.8048 8.62904ZM9.79315 10.1213L5.96371 6.28857C6.16435 6.0199 6.41317 5.78931 6.69735 5.60959L10.4772 9.38122C10.2966 9.66816 10.0642 9.91923 9.79315 10.1213Z\" fill=\"currentColor\"/>\n</svg>",
	unstar: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M10.1972 12.3545L7.99995 10.7617L4.3857 13.4014L5.7773 9.2666L2.42281 7.01758H4.86031L10.1972 12.3545Z\" fill=\"currentColor\"/>\n<path d=\"M13.039 12.6807L12.3193 13.4014L2.96089 4.03418L3.68062 3.31348L13.039 12.6807Z\" fill=\"currentColor\"/>\n<path d=\"M9.49507 7.01758H13.5771L10.5205 9.06738L7.01363 5.56055L7.99995 2.58496L9.49507 7.01758Z\" fill=\"currentColor\"/>\n</svg>",
	up: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.49645 3.48222V16H8.50702L8.50841 3.48259L11.4156 6.38982L12.1095 5.68299L8.00173 1.57524L3.8905 5.68647L4.59784 6.39381L7.49645 3.48222Z\" fill=\"currentColor\"/>\n</svg>",
	views: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"7\" cy=\"7\" r=\"4.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M10.2 10.2L13.5 13.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>"
}, Rd = /* @__PURE__ */ "1x.1xdots.1xgrid.1xlines.2x.2xdots.2xgrid.2xgrid-alt.2xgrid-alt-2.2xgrid-alt-3.2xlines.4x4.airtable.android.archive-alt.arrange-archive.arrange-check.arrange-chevron.arrange-connect.arrange-draft.arrange-dropdown.arrange-home.arrange-link.arrange-menu.arrange-more.arrange-page.arrange-plus.arrange-site.attach.audio.avatar.badge-bands.badge-bands-3d.badge-blue-fan.badge-blue-fan-3d.badge-bricks.badge-bricks-3d.badge-broken-stripes.badge-broken-stripes-3d.badge-checker.badge-checker-3d.badge-diamond.badge-diamond-3d.badge-fan.badge-fan-3d.badge-fan-dark.badge-fan-dark-3d.badge-halves.badge-halves-3d.badge-halves-green.badge-halves-green-3d.badge-red.badge-red-3d.badge-red-blue-bricks.badge-red-blue-bricks-3d.badge-round-fan.badge-round-fan-3d.badge-shard.badge-shard-3d.badge-split-circle.badge-split-circle-3d.badge-tall-bricks.badge-tall-bricks-3d.badge-weave.badge-weave-3d.bag-alt.bank.banknote.block-accordion.block-banner.block-breadcrumbs.block-button.block-divider.block-forms.block-group.block-heading.block-image.block-logo-marquee.block-page-progress.block-section.block-table.block-tabs.block-text.bold.bolt.book.book-alt.box.briefcase.building.bullet.callout.car.card.cart.categories.check-alt.chevron-down.chevron-left.chevron-right.chevron-up.chrome.cloud.code.code-block.coffee.coins.color.column.comment.connect.content.cursor.curve.default.dictate.dislike.divider.dot-bank.dot-banknote.dot-banknotes.dot-card.dot-coin.dot-coins.dot-happy.dot-neutral.dot-receipt.dot-sad.dot-safe.dot-transfer.dot-wallet.download.drive.drop.dropbox.dumbbell.edge-brand.equation.exercise.eye.eye-off.facebook.figma.firefox.flame.flip.food.form.fuel.gallery.game.gift.github.globe.group.group-alt.group-alt-2.h1.h2.h3.handle.head.health.heart.help.help-alt.history.home-alt.icon.image.in.income.indent.info.instagram.italic.item.jpbank.key.keyboard.life.like.link.linkedin.linux.list-line.lock-filled.logo-marquee.loom.map.material.medical.mention.menu.milestone.milestone-planned.minimize.minimize-alt.minus.money.moon.move.music.music-alt.navigation-check.network.note-alt.note-alt-2.note-lines.notifications.notion.numbered.offline.open-alt.open-source.opera.outdent.page.page-18.page-alt.page-note.panel.password-see.password-unsee.pattern-call-to-action.pattern-card.pattern-feature.pattern-hero.pause.paw.pdf.people.percent.phone.pill.plane.play-alt.postal.prediction.present.priority-high.priority-low.priority-medium.project.quote.reaction.receipt.redo.refresh.refund.relationships.repeat.repeat-small.rewind.rewind-30.rewind-30-alt.rotate.row.safari.safe.scaling.school.school-alt.search-30.see-30.settings.shield.shield-alt.shirt.shop.sign-in.sign-out.slack.slash.sparkle.star-alt.star-alt-2.start.status.status-alt.status-filled.stop.strike.sun.system.table.tabs.tag.templates.text.ticket.title.title-struck.titlestyle.todo.toggle.train.transfer.tv.underline.undo.ungroup.unhead.unicon.untitle.up-right.upload.video.vimeo.wallet.warning.wifi.window.windows.work.wrench.x-brand.youtube".split("."), zd = /* @__PURE__ */ n({ icons: () => Bd }), Bd, Vd = t((() => {
	Bd = {
		"1x": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 9 8\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.20008 2.1176C1.96088 2.3776 1.48248 2.5024 1.09768 2.5024H0.848083V1.4H1.01448C1.68008 1.4 2.21048 1.0464 2.41848 0.307999H3.39608V7.692H2.20008V2.1176Z\" fill=\"currentColor\"/>\n<path d=\"M4.27992 7.692L5.81912 4.9776L4.39432 2.492H5.68392L6.30792 3.7816C6.41192 3.9896 6.48472 4.1456 6.52632 4.312H6.54712C6.57832 4.156 6.65112 3.9792 6.75512 3.7712L7.33752 2.492H8.60632L7.21272 5.0088L8.75192 7.692H7.44152L6.72392 6.2672C6.61992 6.0592 6.53672 5.872 6.50552 5.7368H6.48472C6.45352 5.8512 6.37032 6.0488 6.25592 6.2672L5.53832 7.692H4.27992Z\" fill=\"currentColor\"/>\n</svg></svg>",
		"1xdots": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M1.28996 0.148769V1.16877H0.269958V0.148769H1.28996Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M6.30998 0.148769V1.16877H5.28998V0.148769H6.30998Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.33 0.148769V1.16877H10.31V0.148769H11.33Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M1.28996 5.16877V6.18877H0.269958V5.16877H1.28996Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M6.30998 5.16877V6.18877H5.28998V5.16877H6.30998Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.33 5.16877V6.18877H10.31V5.16877H11.33Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M1.28996 10.1888V11.2088H0.269958V10.1888H1.28996Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M6.30998 10.1888V11.2088H5.28998V10.1888H6.30998Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.33 10.1888V11.2088H10.31V10.1888H11.33Z\" fill=\"currentColor\"/>\n</svg></svg>",
		"1xgrid": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 17 17\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M0.799988 3.34877L16.8 3.34877V4.36877L0.799988 4.36877V3.34877Z\" fill=\"currentColor\"/>\n<path d=\"M0.799988 8.16877L16.8 8.16877V9.18877L0.799988 9.18877V8.16877Z\" fill=\"currentColor\"/>\n<path d=\"M0.799988 12.9888H16.8V14.0088L0.799988 14.0088V12.9888Z\" fill=\"currentColor\"/>\n<path d=\"M4.48999 16.6788L3.46999 16.6788L3.46999 0.678791L4.48999 0.678772L4.48999 16.6788Z\" fill=\"currentColor\"/>\n<path d=\"M9.30999 16.6788L8.28999 16.6788L8.28999 0.678791L9.30999 0.678772L9.30999 16.6788Z\" fill=\"currentColor\"/>\n<path d=\"M14.13 16.6788L13.11 16.6788L13.11 0.678791L14.13 0.678772L14.13 16.6788Z\" fill=\"currentColor\"/>\n</svg></svg>",
		"1xlines": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 17 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M0.799988 0.148769L16.8 0.14877V1.16877L0.799988 1.16877V0.148769Z\" fill=\"currentColor\"/>\n<path d=\"M0.799988 5.16877L16.8 5.16877V6.18877L0.799988 6.18877V5.16877Z\" fill=\"currentColor\"/>\n<path d=\"M0.799988 10.1888H16.8V11.2088L0.799988 11.2088V10.1888Z\" fill=\"currentColor\"/>\n</svg></svg>",
		"2x": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 8\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3.2 2.12C2.96 2.38 2.48 2.5 2.1 2.5H1.85V1.4H2.01C2.68 1.4 3.21 1.05 3.42 0.31H4.4V7.69H3.2V2.12Z\" fill=\"currentColor\"/>\n<path d=\"M5.28 7.69L6.82 4.98L5.39 2.49H6.68L7.31 3.78C7.41 3.99 7.48 4.15 7.53 4.31H7.55C7.58 4.16 7.65 3.98 7.76 3.77L8.34 2.49H9.61L8.21 5.01L9.75 7.69H8.44L7.72 6.27C7.62 6.06 7.54 5.87 7.51 5.74H7.48C7.45 5.85 7.37 6.05 7.26 6.27L6.54 7.69H5.28Z\" fill=\"currentColor\"/>\n</svg></svg>",
		"2xdots": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"1\" cy=\"1\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"4\" cy=\"1\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"7\" cy=\"1\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"10\" cy=\"1\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"1\" cy=\"4\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"4\" cy=\"4\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"7\" cy=\"4\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"10\" cy=\"4\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"1\" cy=\"7\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"4\" cy=\"7\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"7\" cy=\"7\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"10\" cy=\"7\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"1\" cy=\"10\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"4\" cy=\"10\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"7\" cy=\"10\" r=\"0.75\" fill=\"currentColor\"/>\n<circle cx=\"10\" cy=\"10\" r=\"0.75\" fill=\"currentColor\"/>\n</svg></svg>",
		"2xgrid": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"0\" y=\"0\" width=\"5.5\" height=\"5.5\" fill=\"currentColor\"/>\n<rect x=\"6.5\" y=\"0\" width=\"5.5\" height=\"5.5\" fill=\"currentColor\"/>\n<rect x=\"0\" y=\"6.5\" width=\"5.5\" height=\"5.5\" fill=\"currentColor\"/>\n<rect x=\"6.5\" y=\"6.5\" width=\"5.5\" height=\"5.5\" fill=\"currentColor\"/>\n</svg></svg>",
		"2xgrid-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g clip-path=\"url(#clip0_1265_1828)\">\n<path d=\"M0 0.661949L16 0.661949V1.68195L0 1.68195V0.661949Z\" fill=\"currentColor\"/>\n<path d=\"M0 7.48195L16 7.48195V8.50195L0 8.50195V7.48195Z\" fill=\"currentColor\"/>\n<path d=\"M0 14.302H16V15.322L0 15.322V14.302Z\" fill=\"currentColor\"/>\n<path d=\"M1.69 15.992L0.669999 15.9919V0.661948L1.69 0.661929V15.992Z\" fill=\"currentColor\"/>\n<path d=\"M8.51 15.992L7.49 15.9919V0.661948L8.51 0.661929V15.992Z\" fill=\"currentColor\"/>\n<path d=\"M15.33 15.992L14.31 15.9919V0.661948L15.33 0.661929V15.992Z\" fill=\"currentColor\"/>\n</g>\n<defs>\n<clipPath id=\"clip0_1265_1828\">\n<rect width=\"16\" height=\"16\" fill=\"white\"/>\n</clipPath>\n</defs>\n</svg>",
		"2xgrid-alt-2": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M0.670044 3.33625L15.33 3.33625V4.35625H0.670044V3.33625Z\" fill=\"currentColor\"/>\n<path d=\"M0.670044 8.9208L15.33 8.9208V9.9408H0.670044V8.9208Z\" fill=\"currentColor\"/>\n<path d=\"M0.670044 11.6437L15.33 11.6437V12.6637H0.670044V11.6437Z\" fill=\"currentColor\"/>\n<path d=\"M1.69007 12.6637L0.670044 12.6637V3.33625L1.69004 3.33624L1.69007 12.6637Z\" fill=\"currentColor\"/>\n<path d=\"M8.51007 12.6637L7.49007 12.6637L7.49005 3.33626L8.51005 3.33624L8.51007 12.6637Z\" fill=\"currentColor\"/>\n<path d=\"M15.33 12.6637H14.3101L14.31 3.33626L15.33 3.33625V12.6637Z\" fill=\"currentColor\"/>\n<path d=\"M0.670044 6.18583L15.33 6.18583V7.20583H0.670044V6.18583Z\" fill=\"currentColor\"/>\n</svg>",
		"2xgrid-alt-3": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3.66992 12.3335L12.3299 12.3335V13.3535L4.68995 13.3535L3.66992 13.3535V12.3335Z\" fill=\"currentColor\"/>\n<path d=\"M4.68995 13.3535L3.66992 13.3535V7.02601L4.68992 7.026L4.68995 13.3535Z\" fill=\"currentColor\"/>\n<path d=\"M12.3299 13.3535H11.3099L11.3099 7.02602L12.3299 7.02601V13.3535Z\" fill=\"currentColor\"/>\n<path d=\"M11.7074 6.28303H10.6875L10.6875 3.95558L11.7074 3.95557V6.28303Z\" fill=\"currentColor\"/>\n<path d=\"M7.99995 2.40447L13.5956 8.00002L12.8743 8.72127L7.2787 3.12572L7.99995 2.40447Z\" fill=\"currentColor\"/>\n<path d=\"M3.12569 8.72126L2.40443 7.99999L7.99995 2.40447L8.7212 3.12572L3.12569 8.72126Z\" fill=\"currentColor\"/>\n</svg>",
		"2xlines": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<line x1=\"0\" y1=\"1\" x2=\"12\" y2=\"1\" stroke=\"currentColor\" stroke-width=\"1\"/>\n<line x1=\"0\" y1=\"4\" x2=\"12\" y2=\"4\" stroke=\"currentColor\" stroke-width=\"1\"/>\n<line x1=\"0\" y1=\"7\" x2=\"12\" y2=\"7\" stroke=\"currentColor\" stroke-width=\"1\"/>\n<line x1=\"0\" y1=\"10\" x2=\"12\" y2=\"10\" stroke=\"currentColor\" stroke-width=\"1\"/>\n</svg></svg>",
		"4x4": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"0\" y=\"0\" width=\"2.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"3.5\" y=\"0\" width=\"2.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"7\" y=\"0\" width=\"2.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"10.5\" y=\"0\" width=\"1.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"0\" y=\"3.5\" width=\"2.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"3.5\" y=\"3.5\" width=\"2.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"7\" y=\"3.5\" width=\"2.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"10.5\" y=\"3.5\" width=\"1.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"0\" y=\"7\" width=\"2.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"3.5\" y=\"7\" width=\"2.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"7\" y=\"7\" width=\"2.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"10.5\" y=\"7\" width=\"1.5\" height=\"2.5\" fill=\"currentColor\"/>\n<rect x=\"0\" y=\"10.5\" width=\"2.5\" height=\"1.5\" fill=\"currentColor\"/>\n<rect x=\"3.5\" y=\"10.5\" width=\"2.5\" height=\"1.5\" fill=\"currentColor\"/>\n<rect x=\"7\" y=\"10.5\" width=\"2.5\" height=\"1.5\" fill=\"currentColor\"/>\n<rect x=\"10.5\" y=\"10.5\" width=\"1.5\" height=\"1.5\" fill=\"currentColor\"/>\n</svg></svg>",
		airtable: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 10v8l7 -3v-2.6l-7 -2.4\"/>\n<path d=\"M3 6l9 3l9 -3l-9 -3l-9 3\"/>\n<path d=\"M14 12.3v8.7l7 -3v-8l-7 2.3\"/>\n</svg></svg>",
		android: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4 10l0 6\"/>\n<path d=\"M20 10l0 6\"/>\n<path d=\"M7 9h10v8a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-8a5 5 0 0 1 10 0\"/>\n<path d=\"M8 3l1 2\"/>\n<path d=\"M16 3l-1 2\"/>\n<path d=\"M9 18l0 3\"/>\n<path d=\"M15 18l0 3\"/>\n</svg></svg>",
		"archive-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.9956 4.08604V5.00597V13.5081H3.00439V5.00597V4.08604H12.9956ZM3.92432 12.5882H12.0757V5.00597H3.92432V12.5882ZM10.3862 6.58666V7.50659H5.48137V6.58666H10.3862Z\" fill=\"currentColor\"/>\n<path d=\"M13.9155 2.49183H2.08447V4.08604V5.00597H3.00439V4.08604L3.00439 3.41175H12.9956V4.08604V5.00597H13.9155V3.72605V2.49183Z\" fill=\"currentColor\"/>\n</svg>",
		"arrange-archive": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"none\"><path d=\"M15.5507 5.65124V6.67338V16.1202H4.44938V6.67338V5.65124H15.5507ZM5.47152 15.0981H14.5286V6.67338H5.47152V15.0981ZM12.6514 8.42971V9.45184H7.20157V8.42971H12.6514Z\" fill=\"currentColor\"></path><path d=\"M16.5729 3.87989H3.42725V5.65124V6.67338H4.44938V5.65124L4.44938 4.90203H15.5507V5.65124V6.67338H16.5729V5.25125V3.87989Z\" fill=\"currentColor\"></path></svg>",
		"arrange-check": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 9.63652 10.0754\" fill=\"none\"><path d=\"M3.50474 6.4568L9.2613 0.708859L8.55427 0L3.50661 5.0555L1.08225 2.62294L0.375217 3.3181L3.50474 6.4568Z\" fill=\"currentColor\"></path><path d=\"M2.20539 8.9727C2.20539 9.5817 1.7117 10.0754 1.1027 10.0754C0.493694 10.0754 0 9.5817 0 8.9727C0 8.3637 0.493694 7.87 1.1027 7.87C1.7117 7.87 2.20539 8.3637 2.20539 8.9727Z\" fill=\"currentColor\"></path><path d=\"M5.95301 8.9727C5.95301 9.5817 5.45932 10.0754 4.85032 10.0754C4.24131 10.0754 3.74762 9.5817 3.74762 8.9727C3.74762 8.3637 4.24131 7.87 4.85032 7.87C5.45932 7.87 5.95301 8.3637 5.95301 8.9727Z\" fill=\"currentColor\"></path><path d=\"M9.63652 8.9727C9.63652 9.5817 9.14282 10.0754 8.53382 10.0754C7.92482 10.0754 7.43113 9.5817 7.43113 8.9727C7.43113 8.3637 7.92482 7.87 8.53382 7.87C9.14282 7.87 9.63652 8.3637 9.63652 8.9727Z\" fill=\"currentColor\"></path></svg></svg>",
		"arrange-chevron": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"none\"><path d=\"M9.10182 6.53372L5.99744 9.6381L2.89795 6.5386L3.42188 6.00488L5.99255 8.57556L6.37937 8.19852L8.5681 6L9.10182 6.53372Z\" fill=\"currentColor\"/></svg>",
		"arrange-connect": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" fill=\"none\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.7982 7.99674L7.659 12.1359L6.94737 11.4243L9.87875 8.50597L3.88054 8.51223L3.88054 7.49376L9.87875 7.4875L6.9539 4.56265L7.66552 3.86408L11.7982 7.99674Z\" fill=\"currentColor\"></path></svg>",
		"arrange-draft": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"none\"><path d=\"M3.75522 17.8686L3.75522 2.13127L16.2442 2.13127L16.2442 17.8686L3.75522 17.8686ZM15.0943 3.28117L4.90512 3.28117L4.90512 16.7187L15.0943 16.7187L15.0943 3.28117Z\" fill=\"currentColor\"></path><path d=\"M5.94531 11.2399C5.86133 11.1503 5.81934 11.0467 5.81934 10.9292C5.81934 10.8088 5.86273 10.7038 5.94951 10.6142L6.65074 9.91301C7.36738 9.19917 7.98464 8.59591 8.50252 8.10322C9.0232 7.60774 9.4669 7.21583 9.83361 6.9275C10.2031 6.63636 10.5181 6.43481 10.7784 6.32283C11.0387 6.20806 11.2655 6.17307 11.4586 6.21786C11.6518 6.25985 11.8352 6.36762 12.0087 6.54118C12.1823 6.71474 12.2803 6.9065 12.3026 7.11645C12.3278 7.3264 12.2775 7.56855 12.1515 7.84288C12.0255 8.11722 11.8268 8.43635 11.5552 8.80026C11.2837 9.16418 10.938 9.58688 10.5181 10.0684C10.0982 10.5527 9.76643 10.96 9.52289 11.2903C9.27934 11.6178 9.11698 11.8782 9.0358 12.0713C8.95462 12.2617 8.95042 12.3918 9.0232 12.4618C9.08479 12.5234 9.19116 12.5206 9.34233 12.4534C9.49629 12.3834 9.69784 12.2477 9.94699 12.0461C10.1989 11.8446 10.5055 11.573 10.8666 11.2315C11.3173 10.806 11.7106 10.4813 12.0465 10.2573C12.3852 10.0306 12.6764 9.90461 12.9199 9.87942C13.1662 9.85422 13.3762 9.92981 13.5498 10.1062C13.6841 10.2377 13.7569 10.3917 13.7681 10.5681C13.7821 10.7444 13.7401 10.953 13.6421 11.1937C13.547 11.4317 13.4014 11.7144 13.2054 12.0419C13.1019 12.2127 13.0109 12.3624 12.9325 12.4912C12.8541 12.6172 12.7939 12.718 12.7519 12.7935C12.71 12.8663 12.6946 12.9069 12.7058 12.9153C12.7198 12.9265 12.7575 12.9097 12.8191 12.8649C12.8807 12.8173 12.9633 12.7488 13.0669 12.6592C13.1704 12.5668 13.2922 12.4562 13.4322 12.3275C13.5218 12.2407 13.6253 12.1973 13.7429 12.1973C13.8605 12.1973 13.9641 12.2407 14.0536 12.3275C14.1432 12.417 14.1852 12.5234 14.1796 12.6466C14.174 12.7698 14.1208 12.8817 14.0201 12.9825C13.6197 13.3884 13.2572 13.6432 12.9325 13.7467C12.6078 13.8531 12.3418 13.8027 12.1347 13.5956C11.9975 13.4584 11.9191 13.3058 11.8995 13.1379C11.8827 12.9727 11.9023 12.7991 11.9583 12.6172C12.0143 12.4352 12.0913 12.2547 12.1893 12.0755C12.2873 11.8936 12.3838 11.72 12.479 11.5548C12.6274 11.2945 12.7477 11.0999 12.8401 10.9712C12.9325 10.8424 12.9563 10.757 12.9115 10.715C12.8891 10.6926 12.8443 10.6996 12.7771 10.736C12.7128 10.7724 12.6218 10.8382 12.5042 10.9334C12.3894 11.0286 12.2481 11.1545 12.0801 11.3113C11.9149 11.4681 11.719 11.6556 11.4922 11.874C11.2851 12.0699 11.0709 12.2631 10.8498 12.4534C10.6314 12.6438 10.4117 12.8145 10.1905 12.9657C9.96938 13.1141 9.75243 13.226 9.53968 13.3016C9.32693 13.3772 9.12398 13.401 8.93082 13.373C8.73767 13.3478 8.55991 13.2554 8.39754 13.0959C8.21838 12.9139 8.11761 12.7138 8.09521 12.4954C8.07282 12.2771 8.10921 12.0461 8.20439 11.8026C8.30237 11.559 8.43953 11.3085 8.61589 11.0509C8.79225 10.7934 8.98821 10.5331 9.20376 10.2699C9.41931 10.0068 9.63626 9.74785 9.85461 9.49311C10.2185 9.0676 10.5307 8.69669 10.791 8.38036C11.0513 8.06403 11.2361 7.80509 11.3453 7.60354C11.4572 7.39919 11.4698 7.25502 11.3831 7.17104C11.3159 7.09826 11.2137 7.08566 11.0765 7.13325C10.9394 7.18084 10.7616 7.28581 10.5433 7.44818C10.3277 7.61054 10.066 7.83309 9.75803 8.11582C9.4501 8.39856 9.09038 8.74148 8.67888 9.14459C8.27017 9.54769 7.80268 10.0138 7.2764 10.5429L6.57516 11.2399C6.48558 11.3267 6.38061 11.3715 6.26023 11.3743C6.13986 11.3743 6.03489 11.3295 5.94531 11.2399Z\" fill=\"currentColor\"></path></svg>",
		"arrange-dropdown": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 12.5 12.5\" fill=\"none\"><path d=\"M1.2 2.2H11.3V3.2H1.2V2.2ZM1.2 5.2H6.2V6.2H1.2V5.2ZM1.2 8.2H6.2V9.2H1.2V8.2Z\" fill=\"currentColor\"></path><path d=\"M7.4 5.5L9.65 7.75L11.9 5.5\" stroke=\"currentColor\" stroke-width=\"1\" stroke-linecap=\"square\"></path></svg>",
		"arrange-home": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"none\"><path d=\"M3.64886 16.5334L16.3503 16.5334V18.0295L5.14491 18.0295L3.64886 18.0295V16.5334Z\" fill=\"currentColor\"></path><path d=\"M5.14491 18.0295L3.64886 18.0295V8.74904L5.14488 8.74903L5.14491 18.0295Z\" fill=\"currentColor\"></path><path d=\"M16.3503 18.0295H14.8544L14.8543 8.74906L16.3503 8.74905V18.0295Z\" fill=\"currentColor\"></path><path d=\"M15.4376 7.65933H13.9417L13.9416 4.24569L15.4376 4.24567V7.65933Z\" fill=\"currentColor\"></path><path d=\"M9.99984 1.9707L18.2069 10.1776L17.1491 11.2355L8.94199 3.02855L9.99984 1.9707Z\" fill=\"currentColor\"></path><path d=\"M2.85083 11.2355L1.79297 10.1776L9.99984 1.9707L11.0577 3.02854L2.85083 11.2355Z\" fill=\"currentColor\"></path></svg>",
		"arrange-link": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 18\" fill=\"none\"><path d=\"M3.75684 14.2446L13.8838 4.11768\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"square\"></path><path d=\"M8.33301 4.11768H13.8838V9.66846\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"square\"></path></svg>",
		"arrange-menu": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"none\"><path d=\"M16.7505 5.87476V8.87476H13.7505V5.87476L16.7505 5.87476Z\" fill=\"currentColor\"></path><path d=\"M16.7505 11.1248V14.1248H13.7505L13.7505 11.1248H16.7505Z\" fill=\"currentColor\"></path><path d=\"M11.5005 5.87476V8.87476H8.50049L8.50049 5.87476L11.5005 5.87476Z\" fill=\"currentColor\"></path><path d=\"M11.5005 11.1248L11.5005 14.1248H8.50049V11.1248H11.5005Z\" fill=\"currentColor\"></path><path d=\"M6.25049 5.87476L6.25049 8.87476H3.25049L3.25049 5.87476L6.25049 5.87476Z\" fill=\"currentColor\"></path><path d=\"M6.25049 11.1248V14.1248H3.25049L3.25049 11.1248L6.25049 11.1248Z\" fill=\"currentColor\"></path><path d=\"M6.25049 11.1248V14.1248H3.25049L3.25049 11.1248L6.25049 11.1248ZM11.5005 11.1248L11.5005 14.1248H8.50049V11.1248H11.5005ZM16.7505 11.1248V14.1248H13.7505L13.7505 11.1248H16.7505ZM6.25049 5.87476L6.25049 8.87476H3.25049L3.25049 5.87476L6.25049 5.87476ZM11.5005 5.87476V8.87476H8.50049L8.50049 5.87476L11.5005 5.87476ZM16.7505 5.87476V8.87476H13.7505V5.87476L16.7505 5.87476Z\" fill=\"currentColor\"></path></svg>",
		"arrange-more": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><circle cx=\"4\" cy=\"8\" r=\"1.2\" fill=\"currentColor\"/><circle cx=\"8\" cy=\"8\" r=\"1.2\" fill=\"currentColor\"/><circle cx=\"12\" cy=\"8\" r=\"1.2\" fill=\"currentColor\"/></svg>",
		"arrange-page": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 9.99121 12.5898\" fill=\"none\"><path d=\"M9.99121 0V12.5898H0V0H9.99121ZM0.919922 11.6699H9.07129V0.919922H0.919922V11.6699ZM4.87402 6.15234V7.07227H2.125V6.15234H4.87402ZM7.02148 4.2207V5.14062H2.125V4.2207H7.02148ZM7.02148 2.28809V3.20898H2.125V2.28809H7.02148Z\" fill=\"currentColor\"></path></svg></svg>",
		"arrange-plus": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" fill=\"none\"><path d=\"M8.50248 2.6739L8.49972 7.5035L13.3335 7.51044L13.3251 8.50193L8.4934 8.49569L8.49964 13.3274L7.49776 13.3268L7.50051 8.49717L2.66675 8.49024L2.67515 7.49875L7.50684 7.50499L7.50129 2.67261L8.50248 2.6739Z\" fill=\"currentColor\"></path></svg>",
		"arrange-site": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" ><path d=\"M8.75344 15.0705C8.97846 15.1256 9.20921 15.1662 9.44463 15.1911V14.2946C9.16337 13.9174 8.89713 13.5069 8.66685 13.0677C8.3303 13.1516 8.00327 13.262 7.68737 13.3926C7.99903 14.0142 8.37131 14.5767 8.75344 15.0705Z\" fill=\"currentColor\"/><path d=\"M6.88023 10.5554C6.92692 11.2264 7.07336 11.8618 7.28526 12.4552C7.59532 12.3263 7.91717 12.2137 8.24964 12.1225C8.07166 11.6263 7.94829 11.1022 7.90319 10.5554H6.88023Z\" fill=\"currentColor\"/><path d=\"M8.75344 4.92946C8.97846 4.8743 9.20921 4.83372 9.44463 4.80881V5.70533C9.16337 6.08255 8.89713 6.49299 8.66685 6.93216C8.3303 6.8483 8.00327 6.73792 7.68737 6.60731C7.99903 5.98567 8.37131 5.42321 8.75344 4.92946Z\" fill=\"currentColor\"/><path d=\"M6.88023 9.44452C6.92692 8.77352 7.07336 8.13812 7.28526 7.54474C7.59532 7.67357 7.91717 7.78619 8.24964 7.87739C8.07166 8.37364 7.94829 8.89771 7.90319 9.44452H6.88023Z\" fill=\"currentColor\"/><path d=\"M3.66895 9.99995H4.78006C4.78006 9.81233 4.78996 9.62703 4.80927 9.44452C4.91365 8.4579 5.29288 7.55324 5.86895 6.80857C5.54365 6.60524 5.23845 6.39056 4.95546 6.1738C4.14815 7.23664 3.66898 8.56237 3.66895 9.99995Z\" fill=\"currentColor\"/><path d=\"M3.66895 9.99995C3.66898 11.4375 4.14815 12.7633 4.95546 13.8261C5.23845 13.6093 5.54365 13.3947 5.86895 13.1913C5.29288 12.4467 4.91365 11.542 4.80927 10.5554C4.78996 10.3729 4.78006 10.1876 4.78006 9.99995H3.66895Z\" fill=\"currentColor\"/><path d=\"M11.2472 15.0702C11.0222 15.1254 10.7914 15.166 10.556 15.1909V14.2943C10.8373 13.9171 11.1035 13.5067 11.3338 13.0675C11.6704 13.1514 11.9974 13.2617 12.3133 13.3924C12.0016 14.014 11.6293 14.5765 11.2472 15.0702Z\" fill=\"currentColor\"/><path d=\"M13.1204 10.5551C13.0737 11.2261 12.9273 11.8616 12.7154 12.4549C12.4053 12.3261 12.0835 12.2135 11.751 12.1223C11.929 11.626 12.0524 11.102 12.0975 10.5551H13.1204Z\" fill=\"currentColor\"/><path d=\"M11.2472 4.92922C11.0222 4.87406 10.7914 4.83349 10.556 4.80857V5.7051C10.8373 6.08232 11.1035 6.49276 11.3338 6.93193C11.6704 6.84806 11.9974 6.73769 12.3133 6.60708C12.0016 5.98543 11.6293 5.42298 11.2472 4.92922Z\" fill=\"currentColor\"/><path d=\"M13.1204 9.44429C13.0737 8.77329 12.9273 8.13788 12.7154 7.5445C12.4053 7.67334 12.0835 7.78596 11.751 7.87716C11.929 8.37341 12.0524 8.89747 12.0975 9.44429H13.1204Z\" fill=\"currentColor\"/><path d=\"M16.3317 9.99995L15.2206 9.99972C15.2206 9.8121 15.2107 9.62679 15.1914 9.44429C15.087 8.45766 14.7078 7.553 14.1317 6.80833C14.457 6.605 14.7622 6.39033 15.0452 6.17356C15.8525 7.23641 16.3317 8.56237 16.3317 9.99995Z\" fill=\"currentColor\"/><path d=\"M16.3317 9.99995C16.3317 11.4375 15.8525 12.763 15.0452 13.8259C14.7622 13.6091 14.457 13.3944 14.1317 13.1911C14.7078 12.4464 15.087 11.5418 15.1914 10.5551C15.2107 10.3726 15.2206 10.1873 15.2206 9.99972L16.3317 9.99995Z\" fill=\"currentColor\"/><path d=\"M8.74704 16.2074C9.15216 16.2888 9.57126 16.3315 10.0003 16.3315V15.2203C9.81262 15.2203 9.62722 15.2104 9.44463 15.1911C9.20921 15.1662 8.97846 15.1256 8.75344 15.0705C7.93905 14.8708 7.1997 14.4801 6.5856 13.9485C6.25087 14.148 5.93404 14.3646 5.63771 14.5884C6.48516 15.3944 7.55564 15.9681 8.74704 16.2074Z\" fill=\"currentColor\"/><path d=\"M4.95546 13.8261C5.1622 14.0983 5.39046 14.3532 5.63771 14.5884C5.93404 14.3646 6.25087 14.148 6.5856 13.9485C6.32239 13.7207 6.08218 13.467 5.86895 13.1913C5.54365 13.3947 5.23845 13.6093 4.95546 13.8261Z\" fill=\"currentColor\"/><path d=\"M6.5856 13.9485C6.93439 13.7408 7.30263 13.5517 7.68737 13.3926C7.53741 13.0935 7.40149 12.7806 7.28526 12.4552C6.78017 12.665 6.30638 12.9179 5.86895 13.1913C6.08218 13.467 6.32239 13.7207 6.5856 13.9485Z\" fill=\"currentColor\"/><path d=\"M7.68737 13.3926C8.00327 13.262 8.3303 13.1516 8.66685 13.0677C8.5085 12.7658 8.36717 12.4502 8.24964 12.1225C7.91717 12.2137 7.59532 12.3263 7.28526 12.4552C7.40149 12.7806 7.53741 13.0935 7.68737 13.3926Z\" fill=\"currentColor\"/><path d=\"M8.66685 13.0677C8.92092 13.0044 9.18041 12.9562 9.44463 12.9258V11.9C9.03329 11.9401 8.63436 12.017 8.24964 12.1225C8.36717 12.4502 8.5085 12.7658 8.66685 13.0677Z\" fill=\"currentColor\"/><path d=\"M9.44463 15.1911C9.62722 15.2104 9.81262 15.2203 10.0003 15.2203V9.99995H4.78006C4.78006 10.1876 4.78996 10.3729 4.80927 10.5554H6.88023H7.90319H9.44463V11.9V12.9258V14.2946V15.1911Z\" fill=\"currentColor\"/><path d=\"M10.0003 15.2203C10.188 15.2203 10.3734 15.2102 10.556 15.1909V14.2943V12.9256V11.8998V10.5551H12.0975H13.1204H15.1914C15.2107 10.3726 15.2206 10.1873 15.2206 9.99972L10.0003 9.99995V15.2203Z\" fill=\"currentColor\"/><path d=\"M10.556 12.9256C10.8202 12.956 11.0797 13.0042 11.3338 13.0675C11.4921 12.7655 11.6335 12.45 11.751 12.1223C11.3663 12.0167 10.9674 11.9399 10.556 11.8998V12.9256Z\" fill=\"currentColor\"/><path d=\"M11.3338 13.0675C11.6704 13.1514 11.9974 13.2617 12.3133 13.3924C12.4632 13.0932 12.5992 12.7804 12.7154 12.4549C12.4053 12.3261 12.0835 12.2135 11.751 12.1223C11.6335 12.45 11.4921 12.7655 11.3338 13.0675Z\" fill=\"currentColor\"/><path d=\"M12.3133 13.3924C12.698 13.5514 13.0663 13.7405 13.415 13.9483C13.6783 13.7205 13.9185 13.4667 14.1317 13.1911C13.6943 12.9177 13.2205 12.6648 12.7154 12.4549C12.5992 12.7804 12.4632 13.0932 12.3133 13.3924Z\" fill=\"currentColor\"/><path d=\"M14.3629 14.5882C14.6102 14.353 14.8384 14.0981 15.0452 13.8259C14.7622 13.6091 14.457 13.3944 14.1317 13.1911C13.9185 13.4667 13.6783 13.7205 13.415 13.9483C13.7498 14.1477 14.0666 14.3643 14.3629 14.5882Z\" fill=\"currentColor\"/><path d=\"M10.0003 16.3315C10.4294 16.3315 10.8485 16.2885 11.2536 16.2072C12.445 15.9679 13.5155 15.3942 14.3629 14.5882C14.0666 14.3643 13.7498 14.1477 13.415 13.9483C12.801 14.4799 12.0616 14.8706 11.2472 15.0702C11.0222 15.1254 10.7914 15.166 10.556 15.1909C10.3734 15.2102 10.188 15.2203 10.0003 15.2203V16.3315Z\" fill=\"currentColor\"/><path d=\"M11.3338 6.93193C11.0797 6.99524 10.8202 7.04345 10.556 7.07385V8.09963C10.9674 8.05954 11.3663 7.98269 11.751 7.87716C11.6335 7.54947 11.4921 7.2339 11.3338 6.93193Z\" fill=\"currentColor\"/><path d=\"M9.44463 7.07409C9.18041 7.04368 8.92092 6.99548 8.66685 6.93216C8.5085 7.23414 8.36717 7.5497 8.24964 7.87739C8.63436 7.98292 9.03329 8.05977 9.44463 8.09987V7.07409Z\" fill=\"currentColor\"/><path d=\"M8.66685 6.93216C8.3303 6.8483 8.00327 6.73792 7.68737 6.60731C7.53741 6.90644 7.40149 7.21927 7.28526 7.54474C7.59532 7.67357 7.91717 7.78619 8.24964 7.87739C8.36717 7.5497 8.5085 7.23414 8.66685 6.93216Z\" fill=\"currentColor\"/><path d=\"M7.68737 6.60731C7.30263 6.44824 6.93439 6.25914 6.5856 6.05136C6.32239 6.2792 6.08218 6.53292 5.86895 6.80857C6.30638 7.08198 6.78017 7.33487 7.28526 7.54474C7.40149 7.21927 7.53741 6.90644 7.68737 6.60731Z\" fill=\"currentColor\"/><path d=\"M5.63771 5.41152C5.39046 5.64668 5.1622 5.90162 4.95546 6.1738C5.23845 6.39056 5.54365 6.60524 5.86895 6.80857C6.08218 6.53292 6.32239 6.2792 6.5856 6.05136C6.25087 5.85195 5.93404 5.63533 5.63771 5.41152Z\" fill=\"currentColor\"/><path d=\"M10.0003 3.66846C9.57126 3.66846 9.15216 3.71114 8.74704 3.7925C7.55564 4.03176 6.48516 4.60547 5.63771 5.41152C5.93404 5.63533 6.25087 5.85195 6.5856 6.05136C7.1997 5.51979 7.93905 5.12907 8.75344 4.92946C8.97846 4.8743 9.20921 4.83372 9.44463 4.80881C9.62722 4.78948 9.81262 4.77959 10.0003 4.77959V3.66846Z\" fill=\"currentColor\"/><path d=\"M10.0003 4.77959C9.81262 4.77959 9.62722 4.78948 9.44463 4.80881V5.70533V7.07409V8.09987V9.44452H7.90319H6.88023H4.80927C4.78996 9.62703 4.78006 9.81233 4.78006 9.99995H10.0003V4.77959Z\" fill=\"currentColor\"/><path d=\"M10.556 4.80857C10.3734 4.78925 10.188 4.77959 10.0003 4.77959V9.99995L15.2206 9.99972C15.2206 9.8121 15.2107 9.62679 15.1914 9.44429H13.1204H12.0975H10.556V8.09963V7.07385V5.7051V4.80857Z\" fill=\"currentColor\"/><path d=\"M11.2536 3.79227C10.8485 3.71091 10.4294 3.66846 10.0003 3.66846V4.77959C10.188 4.77959 10.3734 4.78925 10.556 4.80857C10.7914 4.83349 11.0222 4.87406 11.2472 4.92922C12.0616 5.12883 12.801 5.51955 13.415 6.05113C13.7498 5.85172 14.0666 5.6351 14.3629 5.41128C13.5155 4.60524 12.445 4.03153 11.2536 3.79227Z\" fill=\"currentColor\"/><path d=\"M12.3133 6.60708C11.9974 6.73769 11.6704 6.84806 11.3338 6.93193C11.4921 7.2339 11.6335 7.54947 11.751 7.87716C12.0835 7.78596 12.4053 7.67334 12.7154 7.5445C12.5992 7.21903 12.4632 6.9062 12.3133 6.60708Z\" fill=\"currentColor\"/><path d=\"M13.415 6.05113C13.0663 6.25891 12.698 6.448 12.3133 6.60708C12.4632 6.9062 12.5992 7.21903 12.7154 7.5445C13.2205 7.33463 13.6943 7.08174 14.1317 6.80833C13.9185 6.53269 13.6783 6.27897 13.415 6.05113Z\" fill=\"currentColor\"/><path d=\"M15.0452 6.17356C14.8384 5.90139 14.6102 5.64645 14.3629 5.41128C14.0666 5.6351 13.7498 5.85172 13.415 6.05113C13.6783 6.27897 13.9185 6.53269 14.1317 6.80833C14.457 6.605 14.7622 6.39033 15.0452 6.17356Z\" fill=\"currentColor\"/></svg>",
		attach: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M11.5 4.5V10.5A3.5 3.5 0 0 1 4.5 10.5V4.5A2.5 2.5 0 0 1 9.5 4.5V10.5A1.5 1.5 0 0 1 6.5 10.5V5.5\" stroke=\"currentColor\"/>\n</svg>",
		audio: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2 6.5V9.5M4 5V11M6 3V13M8 5V11M10 4V12M12 5.5V10.5M14 7V9\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		avatar: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.00001 8.56915C8.71876 8.56915 9.36524 8.67853 9.93946 8.89728C10.5137 9.11212 11.0039 9.39142 11.4102 9.73517C11.8203 10.0789 12.0434 10.4012 12.2583 10.7957C12.3903 11.0383 12.5357 11.3646 12.6249 11.756C12.6779 11.9885 12.7133 12.2215 12.7133 12.7234H3.28666C3.28666 12.2215 3.32208 11.9885 3.37507 11.756C3.46425 11.3646 3.6096 11.0383 3.74169 10.7957C3.95654 10.4012 4.17962 10.0789 4.58978 9.73517C4.99603 9.39142 5.48626 9.11212 6.06048 8.89728C6.6347 8.67853 7.28126 8.56915 8.00001 8.56915Z\" fill=\"currentColor\"/>\n<path d=\"M8.00291 7.71044C7.60056 7.71044 7.22947 7.61191 6.88963 7.41484C6.55369 7.2142 6.28416 6.94369 6.08103 6.60331C5.87791 6.26293 5.77634 5.88314 5.77634 5.46394C5.77634 5.04832 5.87791 4.67569 6.08103 4.34607C6.28416 4.01285 6.55564 3.74951 6.89548 3.55603C7.23533 3.35897 7.60447 3.26044 8.00291 3.26044C8.40134 3.26044 8.76853 3.35718 9.10447 3.55065C9.44041 3.74055 9.70994 4.0021 9.91306 4.33532C10.1201 4.66495 10.2236 5.03757 10.2236 5.45319C10.2236 5.87598 10.1201 6.25935 9.91306 6.60331C9.70994 6.94369 9.44041 7.2142 9.10447 7.41484C8.76853 7.61191 8.40134 7.71044 8.00291 7.71044Z\" fill=\"currentColor\"/>\n</svg>",
		"badge-bands": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"4\" fill=\"#ccccff\"/><rect x=\"0\" y=\"4\" width=\"16\" height=\"4\" fill=\"#979441\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"4\" fill=\"#eaff00\"/><rect x=\"0\" y=\"12\" width=\"16\" height=\"4\" fill=\"#f5aad1\"/></g></svg>",
		"badge-bands-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"4\" fill=\"#ccccff\"/><rect x=\"0\" y=\"4\" width=\"16\" height=\"4\" fill=\"#979441\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"4\" fill=\"#eaff00\"/><rect x=\"0\" y=\"12\" width=\"16\" height=\"4\" fill=\"#f5aad1\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"4\" fill=\"#ccccff\"/><rect x=\"0\" y=\"4\" width=\"16\" height=\"4\" fill=\"#979441\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"4\" fill=\"#eaff00\"/><rect x=\"0\" y=\"12\" width=\"16\" height=\"4\" fill=\"#f5aad1\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"4\" fill=\"#ccccff\"/><rect x=\"0\" y=\"4\" width=\"16\" height=\"4\" fill=\"#979441\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"4\" fill=\"#eaff00\"/><rect x=\"0\" y=\"12\" width=\"16\" height=\"4\" fill=\"#f5aad1\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-blue-fan": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#594dff\"/></g><path d=\"M16 8L16 0L8 0Z\" fill=\"#979441\"/><path d=\"M16 8L8 0L0 0Z\" fill=\"#ffff00\"/><path d=\"M16 16L16 8L8 12Z\" fill=\"#ffff00\"/><path d=\"M0 8L8 16L16 16L8 12Z\" fill=\"#ff5f5f\"/><path d=\"M16 8L0 0L0 4Z\" fill=\"#ff5f5f\"/><path d=\"M0 8L16 8L0 4Z\" fill=\"#979441\"/><path d=\"M0 8L0 16L8 16Z\" fill=\"#979441\"/><path d=\"M16 8L0 8L8 12Z\" fill=\"#979441\"/></svg>",
		"badge-blue-fan-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#594dff\"/></g><path d=\"M16 8L16 0L8 0Z\" fill=\"#979441\"/><path d=\"M16 8L8 0L0 0Z\" fill=\"#ffff00\"/><path d=\"M16 16L16 8L8 12Z\" fill=\"#ffff00\"/><path d=\"M0 8L8 16L16 16L8 12Z\" fill=\"#ff5f5f\"/><path d=\"M16 8L0 0L0 4Z\" fill=\"#ff5f5f\"/><path d=\"M0 8L16 8L0 4Z\" fill=\"#979441\"/><path d=\"M0 8L0 16L8 16Z\" fill=\"#979441\"/><path d=\"M16 8L0 8L8 12Z\" fill=\"#979441\"/></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#594dff\"/></g><path d=\"M16 8L16 0L8 0Z\" fill=\"#979441\"/><path d=\"M16 8L8 0L0 0Z\" fill=\"#ffff00\"/><path d=\"M16 16L16 8L8 12Z\" fill=\"#ffff00\"/><path d=\"M0 8L8 16L16 16L8 12Z\" fill=\"#ff5f5f\"/><path d=\"M16 8L0 0L0 4Z\" fill=\"#ff5f5f\"/><path d=\"M0 8L16 8L0 4Z\" fill=\"#979441\"/><path d=\"M0 8L0 16L8 16Z\" fill=\"#979441\"/><path d=\"M16 8L0 8L8 12Z\" fill=\"#979441\"/></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#594dff\"/></g><path d=\"M16 8L16 0L8 0Z\" fill=\"#979441\"/><path d=\"M16 8L8 0L0 0Z\" fill=\"#ffff00\"/><path d=\"M16 16L16 8L8 12Z\" fill=\"#ffff00\"/><path d=\"M0 8L8 16L16 16L8 12Z\" fill=\"#ff5f5f\"/><path d=\"M16 8L0 0L0 4Z\" fill=\"#ff5f5f\"/><path d=\"M0 8L16 8L0 4Z\" fill=\"#979441\"/><path d=\"M0 8L0 16L8 16Z\" fill=\"#979441\"/><path d=\"M16 8L0 8L8 12Z\" fill=\"#979441\"/></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-bricks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"0\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"4\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"6\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"10\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"12\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"14\" width=\"8\" height=\"2\" fill=\"#979441\"/></g></svg>",
		"badge-bricks-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"0\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"4\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"6\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"10\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"12\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"14\" width=\"8\" height=\"2\" fill=\"#979441\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"0\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"4\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"6\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"10\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"12\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"14\" width=\"8\" height=\"2\" fill=\"#979441\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"0\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"4\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"6\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"10\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#979441\"/><rect x=\"8\" y=\"12\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#99ff73\"/><rect x=\"8\" y=\"14\" width=\"8\" height=\"2\" fill=\"#979441\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-broken-stripes": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"0\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"8\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"12\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"14\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/></g></svg>",
		"badge-broken-stripes-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"0\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"8\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"12\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"14\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"0\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"8\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"12\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"14\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"4\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"4\" fill=\"#ffff00\"/><rect x=\"0\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"8\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/><rect x=\"12\" y=\"4\" width=\"2\" height=\"12\" fill=\"#ffff00\"/><rect x=\"14\" y=\"4\" width=\"2\" height=\"12\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-checker": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"2\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"2\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"2\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"2\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"4\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"6\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"6\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"8\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"10\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"10\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"10\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"10\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"12\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"12\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"12\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"12\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"14\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"14\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"14\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"14\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/></g></svg>",
		"badge-checker-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"2\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"2\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"2\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"2\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"4\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"6\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"6\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"8\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"10\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"10\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"10\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"10\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"12\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"12\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"12\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"12\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"14\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"14\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"14\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"14\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"2\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"2\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"2\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"2\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"4\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"6\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"6\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"8\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"10\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"10\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"10\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"10\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"12\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"12\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"12\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"12\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"14\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"14\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"14\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"14\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"2\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"2\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"2\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"2\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"2\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"4\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"4\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"4\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"4\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"4\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"6\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"6\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"6\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"6\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"8\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"8\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"10\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"10\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"10\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"10\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"10\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"0\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"2\" y=\"12\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"4\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"6\" y=\"12\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"8\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"10\" y=\"12\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"12\" y=\"12\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"14\" y=\"12\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"0\" y=\"14\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"2\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"4\" y=\"14\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"6\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"8\" y=\"14\" width=\"2\" height=\"2\" fill=\"#ffff00\"/><rect x=\"10\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/><rect x=\"12\" y=\"14\" width=\"2\" height=\"2\" fill=\"#eaff00\"/><rect x=\"14\" y=\"14\" width=\"2\" height=\"2\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-diamond": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><defs><clipPath id=\"diamond-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#diamond-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#37ff0033\"/></g><path d=\"M8 0L16 8L8 16L0 8Z\" fill=\"#d9d9d9\"/><path d=\"M8 4L12 8L4 16L0 12Z\" fill=\"#c0b5b5\"/></g></svg>",
		"badge-diamond-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><defs><clipPath id=\"diamond-3d-west-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#diamond-3d-west-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#37ff0033\"/></g><path d=\"M8 0L16 8L8 16L0 8Z\" fill=\"#d9d9d9\"/><path d=\"M8 4L12 8L4 16L0 12Z\" fill=\"#c0b5b5\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><defs><clipPath id=\"diamond-3d-south-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#diamond-3d-south-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#37ff0033\"/></g><path d=\"M8 0L16 8L8 16L0 8Z\" fill=\"#d9d9d9\"/><path d=\"M8 4L12 8L4 16L0 12Z\" fill=\"#c0b5b5\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><defs><clipPath id=\"diamond-3d-top-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#diamond-3d-top-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#37ff0033\"/></g><path d=\"M8 0L16 8L8 16L0 8Z\" fill=\"#d9d9d9\"/><path d=\"M8 4L12 8L4 16L0 12Z\" fill=\"#c0b5b5\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-fan": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"></g><path d=\"M8 0L0 0L0 8Z\" fill=\"#99ff73\"/><path d=\"M8 0L0 8L0 16Z\" fill=\"#56a7a1\"/><path d=\"M16 0L8 0L12 8Z\" fill=\"#56a7a1\"/><path d=\"M8 16L16 8L16 0L12 8Z\" fill=\"#ccccff\"/><path d=\"M8 0L0 16L4 16Z\" fill=\"#ccccff\"/><path d=\"M8 16L8 0L4 16Z\" fill=\"#fec20d40\"/><path d=\"M8 16L16 16L16 8Z\" fill=\"#fec20d40\"/><path d=\"M8 0L8 16L12 8Z\" fill=\"#99ff73\"/></svg>",
		"badge-fan-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"></g><path d=\"M8 0L0 0L0 8Z\" fill=\"#99ff73\"/><path d=\"M8 0L0 8L0 16Z\" fill=\"#56a7a1\"/><path d=\"M16 0L8 0L12 8Z\" fill=\"#56a7a1\"/><path d=\"M8 16L16 8L16 0L12 8Z\" fill=\"#ccccff\"/><path d=\"M8 0L0 16L4 16Z\" fill=\"#ccccff\"/><path d=\"M8 16L8 0L4 16Z\" fill=\"#fec20d40\"/><path d=\"M8 16L16 16L16 8Z\" fill=\"#fec20d40\"/><path d=\"M8 0L8 16L12 8Z\" fill=\"#99ff73\"/></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"></g><path d=\"M8 0L0 0L0 8Z\" fill=\"#99ff73\"/><path d=\"M8 0L0 8L0 16Z\" fill=\"#56a7a1\"/><path d=\"M16 0L8 0L12 8Z\" fill=\"#56a7a1\"/><path d=\"M8 16L16 8L16 0L12 8Z\" fill=\"#ccccff\"/><path d=\"M8 0L0 16L4 16Z\" fill=\"#ccccff\"/><path d=\"M8 16L8 0L4 16Z\" fill=\"#fec20d40\"/><path d=\"M8 16L16 16L16 8Z\" fill=\"#fec20d40\"/><path d=\"M8 0L8 16L12 8Z\" fill=\"#99ff73\"/></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"></g><path d=\"M8 0L0 0L0 8Z\" fill=\"#99ff73\"/><path d=\"M8 0L0 8L0 16Z\" fill=\"#56a7a1\"/><path d=\"M16 0L8 0L12 8Z\" fill=\"#56a7a1\"/><path d=\"M8 16L16 8L16 0L12 8Z\" fill=\"#ccccff\"/><path d=\"M8 0L0 16L4 16Z\" fill=\"#ccccff\"/><path d=\"M8 16L8 0L4 16Z\" fill=\"#fec20d40\"/><path d=\"M8 16L16 16L16 8Z\" fill=\"#fec20d40\"/><path d=\"M8 0L8 16L12 8Z\" fill=\"#99ff73\"/></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-fan-dark": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"></g><path d=\"M8 0L0 0L0 8Z\" fill=\"#65a74f\"/><path d=\"M8 0L0 8L0 16Z\" fill=\"#56a7a1\"/><path d=\"M16 0L8 0L12 8Z\" fill=\"#56a7a1\"/><path d=\"M8 16L16 8L16 0L12 8Z\" fill=\"#263724\"/><path d=\"M8 0L0 16L4 16Z\" fill=\"#263724\"/><path d=\"M8 16L8 0L4 16Z\" fill=\"#391d5a\"/><path d=\"M8 16L16 16L16 8Z\" fill=\"#391d5a\"/><path d=\"M8 0L8 16L12 8Z\" fill=\"#65a74f\"/></svg>",
		"badge-fan-dark-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"></g><path d=\"M8 0L0 0L0 8Z\" fill=\"#65a74f\"/><path d=\"M8 0L0 8L0 16Z\" fill=\"#56a7a1\"/><path d=\"M16 0L8 0L12 8Z\" fill=\"#56a7a1\"/><path d=\"M8 16L16 8L16 0L12 8Z\" fill=\"#263724\"/><path d=\"M8 0L0 16L4 16Z\" fill=\"#263724\"/><path d=\"M8 16L8 0L4 16Z\" fill=\"#391d5a\"/><path d=\"M8 16L16 16L16 8Z\" fill=\"#391d5a\"/><path d=\"M8 0L8 16L12 8Z\" fill=\"#65a74f\"/></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"></g><path d=\"M8 0L0 0L0 8Z\" fill=\"#65a74f\"/><path d=\"M8 0L0 8L0 16Z\" fill=\"#56a7a1\"/><path d=\"M16 0L8 0L12 8Z\" fill=\"#56a7a1\"/><path d=\"M8 16L16 8L16 0L12 8Z\" fill=\"#263724\"/><path d=\"M8 0L0 16L4 16Z\" fill=\"#263724\"/><path d=\"M8 16L8 0L4 16Z\" fill=\"#391d5a\"/><path d=\"M8 16L16 16L16 8Z\" fill=\"#391d5a\"/><path d=\"M8 0L8 16L12 8Z\" fill=\"#65a74f\"/></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"></g><path d=\"M8 0L0 0L0 8Z\" fill=\"#65a74f\"/><path d=\"M8 0L0 8L0 16Z\" fill=\"#56a7a1\"/><path d=\"M16 0L8 0L12 8Z\" fill=\"#56a7a1\"/><path d=\"M8 16L16 8L16 0L12 8Z\" fill=\"#263724\"/><path d=\"M8 0L0 16L4 16Z\" fill=\"#263724\"/><path d=\"M8 16L8 0L4 16Z\" fill=\"#391d5a\"/><path d=\"M8 16L16 16L16 8Z\" fill=\"#391d5a\"/><path d=\"M8 0L8 16L12 8Z\" fill=\"#65a74f\"/></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-halves": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"8\" fill=\"#ccccff\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"8\" fill=\"#f5aad1\"/></g></svg>",
		"badge-halves-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"8\" fill=\"#ccccff\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"8\" fill=\"#f5aad1\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"8\" fill=\"#ccccff\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"8\" fill=\"#f5aad1\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"8\" fill=\"#ccccff\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"8\" fill=\"#f5aad1\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-halves-green": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"8\" fill=\"#99ff73\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"8\" fill=\"#fec20d\"/></g></svg>",
		"badge-halves-green-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"8\" fill=\"#99ff73\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"8\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"8\" fill=\"#99ff73\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"8\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"8\" fill=\"#99ff73\"/><rect x=\"0\" y=\"8\" width=\"16\" height=\"8\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-red": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#ff5f5f\"/></g></svg>",
		"badge-red-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#ff5f5f\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#ff5f5f\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#ff5f5f\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-red-blue-bricks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"0\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"4\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"6\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"10\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"12\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"14\" width=\"8\" height=\"2\" fill=\"#594dff\"/></g></svg>",
		"badge-red-blue-bricks-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"0\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"4\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"6\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"10\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"12\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"14\" width=\"8\" height=\"2\" fill=\"#594dff\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"0\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"4\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"6\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"10\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"12\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"14\" width=\"8\" height=\"2\" fill=\"#594dff\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"0\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"4\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"6\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"10\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#594dff\"/><rect x=\"8\" y=\"12\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#ff5f5f\"/><rect x=\"8\" y=\"14\" width=\"8\" height=\"2\" fill=\"#594dff\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-round-fan": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><defs><clipPath id=\"round-fan-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#round-fan-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#979441\"/></g><path d=\"M16 16L16 8L8 8Z\" fill=\"#ffff00\"/><path d=\"M16 16L8 8L0 8Z\" fill=\"#ff5f5f\"/><path d=\"M16 16L0 8L0 12Z\" fill=\"#594dff\"/><path d=\"M0 16L0 0L8 0Z\" fill=\"#ffff00\"/></g></svg>",
		"badge-round-fan-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><defs><clipPath id=\"round-fan-3d-west-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#round-fan-3d-west-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#979441\"/></g><path d=\"M16 16L16 8L8 8Z\" fill=\"#ffff00\"/><path d=\"M16 16L8 8L0 8Z\" fill=\"#ff5f5f\"/><path d=\"M16 16L0 8L0 12Z\" fill=\"#594dff\"/><path d=\"M0 16L0 0L8 0Z\" fill=\"#ffff00\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><defs><clipPath id=\"round-fan-3d-south-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#round-fan-3d-south-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#979441\"/></g><path d=\"M16 16L16 8L8 8Z\" fill=\"#ffff00\"/><path d=\"M16 16L8 8L0 8Z\" fill=\"#ff5f5f\"/><path d=\"M16 16L0 8L0 12Z\" fill=\"#594dff\"/><path d=\"M0 16L0 0L8 0Z\" fill=\"#ffff00\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><defs><clipPath id=\"round-fan-3d-top-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#round-fan-3d-top-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#979441\"/></g><path d=\"M16 16L16 8L8 8Z\" fill=\"#ffff00\"/><path d=\"M16 16L8 8L0 8Z\" fill=\"#ff5f5f\"/><path d=\"M16 16L0 8L0 12Z\" fill=\"#594dff\"/><path d=\"M0 16L0 0L8 0Z\" fill=\"#ffff00\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-shard": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#979441\"/></g><path d=\"M16 0L0 16L8 16Z\" fill=\"#ccccff\"/></svg>",
		"badge-shard-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#979441\"/></g><path d=\"M16 0L0 16L8 16Z\" fill=\"#ccccff\"/></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#979441\"/></g><path d=\"M16 0L0 16L8 16Z\" fill=\"#ccccff\"/></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#979441\"/></g><path d=\"M16 0L0 16L8 16Z\" fill=\"#ccccff\"/></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-split-circle": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><defs><clipPath id=\"split-circle-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#split-circle-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#e1aeae\"/></g><path d=\"M16 0L16 16L0 16Z\" fill=\"#d73300\"/></g></svg>",
		"badge-split-circle-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><defs><clipPath id=\"split-circle-3d-west-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#split-circle-3d-west-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#e1aeae\"/></g><path d=\"M16 0L16 16L0 16Z\" fill=\"#d73300\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><defs><clipPath id=\"split-circle-3d-south-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#split-circle-3d-south-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#e1aeae\"/></g><path d=\"M16 0L16 16L0 16Z\" fill=\"#d73300\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><defs><clipPath id=\"split-circle-3d-top-mask\"><circle cx=\"8\" cy=\"8\" r=\"8\"/></clipPath></defs><g clip-path=\"url(#split-circle-3d-top-mask)\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#e1aeae\"/></g><path d=\"M16 0L16 16L0 16Z\" fill=\"#d73300\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-tall-bricks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"0\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"4\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"8\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"12\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"14\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/></g></svg>",
		"badge-tall-bricks-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"0\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"4\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"8\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"12\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"14\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"0\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"4\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"8\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"12\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"14\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"2\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"4\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"6\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"8\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"10\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"12\" y=\"0\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"14\" y=\"0\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"0\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"2\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"4\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"6\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"8\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"10\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/><rect x=\"12\" y=\"8\" width=\"2\" height=\"8\" fill=\"#594dff\"/><rect x=\"14\" y=\"8\" width=\"2\" height=\"8\" fill=\"#fec20d\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"badge-weave": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"0\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"0\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"2\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"2\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"4\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"4\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"6\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"6\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"8\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"8\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"10\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"10\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"12\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"12\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"14\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"14\" width=\"4\" height=\"2\" fill=\"#797979\"/></g></svg>",
		"badge-weave-3d": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 18.4752\" width=\"16\" height=\"16\"><g transform=\"translate(1.5 13.2791) scale(9.8995)\"><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 0.4082 0 0.8165 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"0\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"0\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"2\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"2\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"4\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"4\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"6\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"6\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"8\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"8\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"10\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"10\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"12\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"12\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"14\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"14\" width=\"4\" height=\"2\" fill=\"#797979\"/></g></svg></g><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"#1b2430\" fill-opacity=\"0.18\"/><polygon points=\"0,0 0.7071,0.4082 0.7071,-0.4082 0,-0.8165\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0 0.8165 0.7071 -0.4082)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"0\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"0\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"2\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"2\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"4\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"4\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"6\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"6\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"8\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"8\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"10\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"10\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"12\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"12\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"14\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"14\" width=\"4\" height=\"2\" fill=\"#797979\"/></g></svg></g><polygon points=\"0.7071,0.4082 1.4142,0 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\"/><g transform=\"matrix(0.7071 -0.4082 0.7071 0.4082 0 -0.8165)\"><svg viewBox=\"0 0 16 16\" width=\"1\" height=\"1\" overflow=\"visible\"><g shape-rendering=\"crispEdges\"><rect x=\"0\" y=\"0\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"0\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"0\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"2\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"2\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"2\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"4\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"4\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"4\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"6\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"6\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"6\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"8\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"8\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"8\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"10\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"10\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"10\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"0\" y=\"12\" width=\"8\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"8\" y=\"12\" width=\"4\" height=\"2\" fill=\"#797979\"/><rect x=\"12\" y=\"12\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"0\" y=\"14\" width=\"8\" height=\"2\" fill=\"#797979\"/><rect x=\"8\" y=\"14\" width=\"4\" height=\"2\" fill=\"#f5aad1\"/><rect x=\"12\" y=\"14\" width=\"4\" height=\"2\" fill=\"#797979\"/></g></svg></g><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"#ffffff\" fill-opacity=\"0.12\"/><polygon points=\"0,-0.8165 0.7071,-1.2247 1.4142,-0.8165 0.7071,-0.4082\" fill=\"none\" stroke=\"#1e1e1e\" stroke-opacity=\"0.35\" stroke-width=\"1\" stroke-linejoin=\"round\" vector-effect=\"non-scaling-stroke\"/></g></svg></svg>",
		"bag-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.25 5.25H12.75L12.25 12.5C12.2 13.03 11.76 13.45 11.23 13.45H4.77C4.24 13.45 3.8 13.03 3.75 12.5Z\"/><path d=\"M5.75 7V4.5C5.75 3.26 6.76 2.25 8 2.25C9.24 2.25 10.25 3.26 10.25 4.5V7\"/></g>\n</svg>",
		bank: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 6L8 2.75L13.5 6Z\"/><path d=\"M2.5 13.25H13.5\"/><path d=\"M4 7.75V11.5M6.67 7.75V11.5M9.33 7.75V11.5M12 7.75V11.5\"/></g>\n</svg>",
		banknote: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"1.75\" y=\"4.25\" width=\"12.5\" height=\"7.5\" rx=\"1.5\"/><circle cx=\"8\" cy=\"8\" r=\"1.75\"/><path d=\"M4.25 8H4.26M11.74 8H11.75\"/></g>\n</svg>",
		"block-accordion": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#FEC20D\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#545454\" stroke-width=\"0.5\"></rect><g transform=\"translate(1.25 1.25) rotate(90 8 8)\"><path d=\"M12.4343 11.1361L8.27035 6.99689L12.4277 2.86423L13.1436 3.5628L10.2013 6.48765L16 6.49661V7.51508L10.2013 7.50612L13.1502 10.4244L12.4343 11.1361Z\" fill=\"#1E1E1E\"></path><path d=\"M3.6663 4.86392L7.83026 9.00311L3.67287 13.1358L2.95699 12.4372L5.89934 9.51235L0 9.4978V8.47933L5.89934 8.49387L2.95041 5.57555L3.6663 4.86392Z\" fill=\"#1E1E1E\"></path></g></svg>",
		"block-banner": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#F2FFCF\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><path d=\"M0.5 4.25004V7.51654L18 7.53491V4.25L0.5 4.25004Z\" fill=\"#333333\"></path></svg>",
		"block-breadcrumbs": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#FFD9A8\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><path d=\"M6.98315 12.5585L3.652 9.24712L6.97791 5.941L7.55061 6.49986L5.19673 8.83973L4.78934 9.24712L5.19673 9.65451L7.55585 11.9892L6.98315 12.5585Z\" fill=\"#333333\"></path><path d=\"M13.548 12.7925C12.937 12.7925 12.573 12.3765 12.495 11.6615C11.871 12.4025 11.143 12.7925 10.35 12.7925C9.31 12.7925 8.556 12.0775 8.556 11.1025C8.556 10.2705 9.102 9.71153 10.233 9.36053L12.482 8.65853V7.57953C12.482 6.73453 12.144 6.33153 11.494 6.33153C10.779 6.33153 10.311 6.82553 10.207 7.70953H8.608C9.7 6.39653 10.857 5.70753 12.001 5.70753C13.028 5.70753 13.574 6.27953 13.574 7.34553V11.2195C13.574 11.7265 13.769 11.9605 14.198 11.9605C14.419 11.9605 14.64 11.8825 14.848 11.7395V12.1035C14.484 12.5325 13.99 12.7925 13.548 12.7925ZM9.726 10.9075C9.726 11.5575 10.207 11.9865 10.935 11.9865C11.494 11.9865 12.04 11.7915 12.482 11.4405V9.16553L10.922 9.67253C10.064 9.95853 9.726 10.3225 9.726 10.9075Z\" fill=\"#333333\"></path></svg>",
		"block-button": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#9747FF\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#545454\" stroke-width=\"0.5\"></rect><g transform=\"translate(15.41 2.95) scale(-1 1)\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M0 0V6.5854H1.13219L1.1218 1.932L11.6499 12.47L12.46 11.6598L1.932 1.1218H6.5854L6.57502 0H0Z\" fill=\"#232323\"></path></g></svg>",
		"block-divider": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#B7F5EF\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><path d=\"M3 9.25H15.5\" stroke=\"#1E1E1E\" stroke-width=\"1.5\" stroke-linecap=\"square\"></path></svg>",
		"block-forms": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#65A74F\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><g transform=\"translate(2.539, 3.978)\"><path d=\"M13.422 0V10.5447H0V0H13.422ZM1.125 9.41968H12.297V1.125H1.125V9.41968Z\" fill=\"#333333\"></path><path d=\"M3.211 2.45988V5.72637L10.4802 5.74475V2.45984L3.211 2.45988Z\" fill=\"#333333\"></path><path d=\"M4.461 6.95988V7.99479H9.23016V6.95988H4.461Z\" fill=\"#333333\"></path></g></svg>",
		"block-group": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#D9D0FF\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><rect x=\"4.1\" y=\"4.1\" width=\"6.2\" height=\"6.2\" fill=\"#1E1E1E\" fill-opacity=\"0.1\" stroke=\"#1E1E1E\" stroke-width=\"1\"></rect><rect x=\"8.2\" y=\"8.2\" width=\"6.2\" height=\"6.2\" fill=\"#1E1E1E\" fill-opacity=\"0.1\" stroke=\"#1E1E1E\" stroke-width=\"1\"></rect></svg>",
		"block-heading": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#CCCCFF\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><path d=\"M12.7469 4.95447V13.5455H11.1618V9.80657H7.32614V13.5455H5.75314V4.95447H7.32614V8.53607H11.1618V4.95447H12.7469Z\" fill=\"#393939\"></path></svg>",
		"block-image": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#FF5F5F\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><g transform=\"translate(3.85 3.85)\"><path d=\"M1.2 8.75159L1.2 1.20002L8.75156 1.20002L1.2 8.75159ZM3.1418 9.60002L9.6 6.37034V9.60002H3.1418ZM3.63867 8.00979L9.6 2.04846V5.02971L3.63867 8.00979ZM4.72083e-07 2.44379e-05L0 10.8H10.8V2.491e-05L4.72083e-07 2.44379e-05Z\" fill=\"#1E1E1E\"></path><path d=\"M4.8 3.60003C4.8 4.26277 4.26274 4.80003 3.6 4.80003C2.93726 4.80003 2.4 4.26277 2.4 3.60003C2.4 2.93728 2.93726 2.40003 3.6 2.40003C4.26274 2.40003 4.8 2.93728 4.8 3.60003Z\" fill=\"#1E1E1E\"></path></g></svg>",
		"block-logo-marquee": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#69B8C4\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><g transform=\"translate(0.492, 5.641)\"><path d=\"M1.45575 1.93461V5.30041L6.3699 5.31934V1.93456L1.45575 1.93461Z\" fill=\"#333333\"></path><path d=\"M11.3389 2.43267L7.97307 2.43267L7.95413 4.81754H11.3389L11.3389 2.43267Z\" fill=\"#333333\"></path><path d=\"M12.8751 1.89941V5.26521L16.0599 5.28419V1.89941H12.8751Z\" fill=\"#333333\"></path><path d=\"M17.5156 6.21875V7.21875H0V6.21875H17.5156ZM17.5156 0V1H0V0H17.5156Z\" fill=\"#333333\"></path></g></svg>",
		"block-page-progress": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#EE91C5\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><path d=\"M0.250258 0.250262L0.25 3.12819L14.1957 3.24023L14.196 0.25L0.250258 0.250262Z\" fill=\"#3F3F3F\"></path></svg>",
		"block-section": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#FFD9A8\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><rect x=\"2.75\" y=\"4.25\" width=\"13\" height=\"10\" rx=\"1\" fill=\"#1E1E1E\" fill-opacity=\"0.08\" stroke=\"#1E1E1E\" stroke-width=\"1\"></rect><path d=\"M4.5 7.25H14\" stroke=\"#1E1E1E\" stroke-width=\"1\" stroke-linecap=\"square\"></path><path d=\"M4.5 10.25H11.75\" stroke=\"#1E1E1E\" stroke-width=\"1\" stroke-linecap=\"square\"></path></svg>",
		"block-table": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#EAFF00\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#545454\" stroke-width=\"0.5\"></rect><path d=\"M2.58452 3.83502L15.9155 3.83502V4.85502L2.58452 4.85502V3.83502Z\" fill=\"#1E1E1E\"></path><path d=\"M2.58452 7.65502L15.9155 7.65502V8.67502L2.58452 8.67502V7.65502Z\" fill=\"#1E1E1E\"></path><path d=\"M2.58452 11.475H15.9155V12.495L2.58452 12.495V11.475Z\" fill=\"#1E1E1E\"></path><path d=\"M3.60548 14.665L2.58548 14.665L2.58452 3.83502L3.60459 3.83498L3.60548 14.665Z\" fill=\"#1E1E1E\"></path><path d=\"M8.42548 14.665L7.40548 14.665L7.4046 3.835L8.4246 3.83498L8.42548 14.665Z\" fill=\"#1E1E1E\"></path><path d=\"M13.2455 14.665L12.2255 14.665L12.2246 3.835L13.2446 3.83498L13.2455 14.665Z\" fill=\"#1E1E1E\"></path></svg>",
		"block-tabs": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#D9D0FF\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><g transform=\"translate(2.332, 4.25)\"><path d=\"M7.86718 0V3.26649L13.8361 3.28493V0.0000141103L7.86718 0Z\" fill=\"#333333\"></path><path d=\"M0 2.38485V3.26649L5.96889 3.28493L5.96887 2.38486L0 2.38485Z\" fill=\"#333333\"></path></g></svg>",
		"block-text": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#7DE792\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><path d=\"M5.15137 7.171L5.41537 4.597H13.0846L13.3486 7.171H12.8734C12.6094 5.6662 12.2134 5.191 11.1046 5.191H9.86377V12.253C9.86377 13.2958 10.0354 13.4542 11.4742 13.4542V13.903H7.02577V13.4542C8.46457 13.4542 8.63617 13.2958 8.63617 12.253V5.191H7.39537C6.28657 5.191 5.89057 5.6794 5.62657 7.171H5.15137Z\" fill=\"#333333\"></path></svg>",
		bold: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M5 3.5H8.75A2.25 2.25 0 0 1 8.75 8H5M5 8H9.25A2.25 2.25 0 0 1 9.25 12.5H5M5 3.5V12.5\" stroke=\"currentColor\" stroke-width=\"1.5\"/>\n</svg>",
		bolt: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 1.75L3.5 9H8L7 14.25L12.5 7H8Z\"/></g>\n</svg>",
		book: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3.5H6.5L8 4.5L9.5 3.5H13.5V12.5H9.5L8 13.5L6.5 12.5H2.5Z\" stroke=\"currentColor\"/>\n<path d=\"M8 4.5V13.5\" stroke=\"currentColor\"/>\n</svg>",
		"book-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.25 3.25C3.75 2.5 6.25 2.5 8 3.75C9.75 2.5 12.25 2.5 13.75 3.25V12.75C12.25 12 9.75 12 8 13.25C6.25 12 3.75 12 2.25 12.75Z\"/><path d=\"M8 3.75V13.25\"/></g>\n</svg>",
		box: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.25 5L8 2.25L13.75 5V11L8 13.75L2.25 11Z\"/><path d=\"M2.25 5L8 7.75L13.75 5M8 7.75V13.75\"/><path d=\"M5.1 3.6L10.9 6.4\"/></g>\n</svg>",
		briefcase: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"1.75\" y=\"4.75\" width=\"12.5\" height=\"8.5\" rx=\"1.75\"/><path d=\"M5.75 4.75V3.5C5.75 2.95 6.2 2.5 6.75 2.5H9.25C9.8 2.5 10.25 2.95 10.25 3.5V4.75\"/><path d=\"M1.75 8.25H14.25\"/></g>\n</svg>",
		building: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3.5 13.5V2.5H9.5V13.5M9.5 6.5H12.5V13.5M2 13.5H14\" stroke=\"currentColor\"/>\n<path d=\"M5.5 4.5H7.5M5.5 6.5H7.5M5.5 8.5H7.5M5.5 10.5H7.5\" stroke=\"currentColor\"/>\n</svg>",
		bullet: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"4\" cy=\"5.5\" r=\"1.15\" fill=\"currentColor\"/>\n<circle cx=\"4\" cy=\"10.5\" r=\"1.15\" fill=\"currentColor\"/>\n<path d=\"M7 5H13V6H7ZM7 10H13V11H7Z\" fill=\"currentColor\"/>\n</svg>",
		callout: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3.5H13.5V12.5H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<circle cx=\"5.5\" cy=\"8\" r=\"1.2\" fill=\"currentColor\"/>\n<path d=\"M8 6H11.5V7H8ZM8 9H11.5V10H8Z\" fill=\"currentColor\"/>\n</svg>",
		car: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.25 11.25V8.5L3.75 4.75C3.97 4.15 4.54 3.75 5.18 3.75H10.82C11.46 3.75 12.03 4.15 12.25 4.75L13.75 8.5V11.25Z\"/><path d=\"M2.25 8.5H13.75\"/><path d=\"M3.75 11.25V12.75M12.25 11.25V12.75\"/><path d=\"M4.75 10H4.76M11.24 10H11.25\"/></g>\n</svg>",
		card: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"1.75\" y=\"3.75\" width=\"12.5\" height=\"8.5\" rx=\"1.75\"/><path d=\"M1.75 6.5H14.25M4.25 9.75H6.5\"/></g>\n</svg>",
		cart: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1.75 2.75H3.25L4.75 10.25H12.25L13.5 5H4\"/><circle cx=\"5.5\" cy=\"12.75\" r=\"0.75\"/><circle cx=\"11.25\" cy=\"12.75\" r=\"0.75\"/></g>\n</svg>",
		categories: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g filter=\"url(#filter0_f_1265_1849)\">\n<circle cx=\"8\" cy=\"8\" r=\"3.00244\" fill=\"currentColor\"/>\n</g>\n<defs>\n<filter id=\"filter0_f_1265_1849\" x=\"3.99756\" y=\"3.99756\" width=\"8.00488\" height=\"8.00488\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\">\n<feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/>\n<feBlend mode=\"normal\" in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/>\n<feGaussianBlur stdDeviation=\"0.5\" result=\"effect1_foregroundBlur_1265_1849\"/>\n</filter>\n</defs>\n</svg>",
		"check-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.68647 11.884L12.443 6.13601L11.736 5.42715L6.68834 10.4827L4.26398 8.0501L3.55695 8.74525L6.68647 11.884Z\" fill=\"currentColor\"/>\n</svg>",
		"chevron-down": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.25 6.25L8 10L11.75 6.25\" stroke=\"currentColor\"/>\n</svg>",
		"chevron-left": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9.75 4.25L6 8L9.75 11.75\" stroke=\"currentColor\"/>\n</svg>",
		"chevron-right": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.25 4.25L10 8L6.25 11.75\" stroke=\"currentColor\"/>\n</svg>",
		"chevron-up": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.25 9.75L8 6L11.75 9.75\" stroke=\"currentColor\"/>\n</svg>",
		chrome: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0\"/>\n<path d=\"M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\"/>\n<path d=\"M12 9h8.4\"/>\n<path d=\"M14.598 13.5l-4.2 7.275\"/>\n<path d=\"M9.402 13.5l-4.2 -7.275\"/>\n</svg></svg>",
		cloud: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.75 12.25C3.09 12.25 1.75 10.91 1.75 9.25C1.75 7.75 2.85 6.5 4.29 6.29C4.86 4.36 6.65 3 8.75 3C11.35 3 13.25 5.06 13.25 7.5V7.6C13.84 8.1 14.25 8.8 14.25 9.75C14.25 11.13 13.13 12.25 11.75 12.25Z\"/></g>\n</svg>",
		code: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.5 4.5L3 8L6.5 11.5M9.5 4.5L13 8L9.5 11.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		"code-block": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3H13.5V13H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M6.5 6L4.5 8L6.5 10M9.5 6L11.5 8L9.5 10\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		coffee: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.75 6.25H11.25V9.75C11.25 11.68 9.68 13.25 7.75 13.25H6.25C4.32 13.25 2.75 11.68 2.75 9.75Z\"/><path d=\"M11.25 7.25H12C12.97 7.25 13.75 8.03 13.75 9C13.75 9.97 12.97 10.75 12 10.75H11\"/><path d=\"M5.5 2.25V3.75M8.5 2.25V3.75\"/></g>\n</svg>",
		coins: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"6.5\" cy=\"5\" rx=\"4\" ry=\"1.75\"/><path d=\"M2.5 5V8C2.5 8.97 4.29 9.75 6.5 9.75\"/><path d=\"M2.5 8V11C2.5 11.97 4.29 12.75 6.5 12.75\"/><ellipse cx=\"10.5\" cy=\"9\" rx=\"3\" ry=\"1.5\"/><path d=\"M7.5 9V11.5C7.5 12.33 8.84 13 10.5 13C12.16 13 13.5 12.33 13.5 11.5V9\"/></g>\n</svg>",
		color: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"6\" cy=\"6\" r=\"5\" stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"/>\n<circle cx=\"6\" cy=\"6\" r=\"3\" fill=\"currentColor\"/>\n</svg></svg>",
		column: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.67614 12.123L0.536957 7.98382L4.66961 3.85117L5.38124 4.54974L2.45639 7.47459L13.5436 7.50693L10.6122 4.5886L11.3239 3.87698L15.463 8.01616L11.3304 12.1488L10.6188 11.4503L13.5436 8.5254L2.45639 8.49306L5.38777 11.4114L4.67614 12.123Z\" fill=\"currentColor\"/>\n</svg>",
		comment: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5H13V10.5H8L5.5 12.75V10.5H3Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		connect: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.7982 7.99673L7.65899 12.1359L6.94737 11.4243L9.87875 8.50597L3.88054 8.51223L3.88054 7.49375L9.87875 7.48749L6.9539 4.56264L7.66552 3.86407L11.7982 7.99673Z\" fill=\"black\"/>\n<path d=\"M3.37131 7.99987C3.37131 8.81187 2.71305 9.47013 1.90105 9.47013C1.08904 9.47013 0.430786 8.81187 0.430786 7.99987C0.430786 7.18787 1.08904 6.52961 1.90105 6.52961C2.71305 6.52961 3.37131 7.18787 3.37131 7.99987Z\" fill=\"black\"/>\n<path d=\"M15.5692 7.99987C15.5692 8.81187 14.911 9.47013 14.099 9.47013C13.2869 9.47013 12.6287 8.81187 12.6287 7.99987C12.6287 7.18787 13.2869 6.52961 14.099 6.52961C14.911 6.52961 15.5692 7.18787 15.5692 7.99987Z\" fill=\"black\"/>\n</svg>",
		content: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.4653 2.49872H9.98267V3.49872H12.4653V5.99937H13.4653V2.49872Z\" fill=\"currentColor\"/>\n<path d=\"M2.53467 2.50771L2.53467 5.99037H3.53467L3.53467 3.50771L6.03532 3.50771V2.50771L2.53467 2.50771Z\" fill=\"currentColor\"/>\n<path d=\"M2.53467 13.5013H6.01733V12.5013H3.53467L3.53467 10.0007H2.53467L2.53467 13.5013Z\" fill=\"currentColor\"/>\n<path d=\"M13.4653 13.5013V10.0186H12.4653V12.5013H9.96469V13.5013H13.4653Z\" fill=\"currentColor\"/>\n</svg>",
		cursor: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 2.25V12.75L6.75 10.25L8.5 14L10 13.25L8.25 9.75H12L4 2.25Z\"/></g>\n</svg>",
		curve: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2 13C4 2.33 12 2.33 14 13\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M3.5 5H6.5M9.5 5H12.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M6.5 3.5H9.5V6.5H6.5Z\" fill=\"currentColor\"/>\n<circle cx=\"2.5\" cy=\"5\" r=\"1\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<circle cx=\"13.5\" cy=\"5\" r=\"1\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		default: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9.159 15V6.81H6.26V5.77H13.293V6.81H10.394V15H9.159Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M5.1 0V5.10001H0V0H5.1Z\" fill=\"currentColor\"/>\n</svg>",
		dictate: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 14\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"3.5\" y=\"0\" width=\"5\" height=\"8\" rx=\"2.5\" fill=\"currentColor\"/>\n<path d=\"M1 6C1 8.76142 3.23858 11 6 11C8.76142 11 11 8.76142 11 6\" stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"/>\n<line x1=\"6\" y1=\"11\" x2=\"6\" y2=\"14\" stroke=\"currentColor\" stroke-width=\"1.2\"/>\n<line x1=\"3.5\" y1=\"14\" x2=\"8.5\" y2=\"14\" stroke=\"currentColor\" stroke-width=\"1.2\"/>\n</svg></svg>",
		dislike: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 8.5H5.5V2.5H2.5Z\" stroke=\"currentColor\"/>\n<path d=\"M5.5 8.5L8 13.5C9 13.5 9.5 12.8 9.5 12V9.5H13.5L12.5 2.5H5.5\" stroke=\"currentColor\"/>\n</svg>",
		divider: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 4H9V5H3ZM2 7.5H14V8.5H2ZM3 11H9V12H3Z\" fill=\"currentColor\"/>\n</svg>",
		"dot-bank": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"6\" cy=\"4\" r=\"0.91\"/><circle cx=\"10\" cy=\"4\" r=\"0.91\"/><circle cx=\"12\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"4\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"6\" r=\"0.91\"/><circle cx=\"8\" cy=\"6\" r=\"0.91\"/><circle cx=\"10\" cy=\"6\" r=\"0.91\"/><circle cx=\"12\" cy=\"6\" r=\"0.91\"/><circle cx=\"14\" cy=\"6\" r=\"0.91\"/><circle cx=\"4\" cy=\"8\" r=\"0.91\"/><circle cx=\"8\" cy=\"8\" r=\"0.91\"/><circle cx=\"12\" cy=\"8\" r=\"0.91\"/><circle cx=\"4\" cy=\"10\" r=\"0.91\"/><circle cx=\"8\" cy=\"10\" r=\"0.91\"/><circle cx=\"12\" cy=\"10\" r=\"0.91\"/><circle cx=\"4\" cy=\"12\" r=\"0.91\"/><circle cx=\"8\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"2\" cy=\"14\" r=\"0.91\"/><circle cx=\"4\" cy=\"14\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/><circle cx=\"12\" cy=\"14\" r=\"0.91\"/><circle cx=\"14\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-banknote": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"2\" cy=\"4\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"6\" cy=\"4\" r=\"0.91\"/><circle cx=\"8\" cy=\"4\" r=\"0.91\"/><circle cx=\"10\" cy=\"4\" r=\"0.91\"/><circle cx=\"12\" cy=\"4\" r=\"0.91\"/><circle cx=\"14\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"8\" cy=\"6\" r=\"0.91\"/><circle cx=\"14\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"6\" cy=\"8\" r=\"0.91\"/><circle cx=\"10\" cy=\"8\" r=\"0.91\"/><circle cx=\"14\" cy=\"8\" r=\"0.91\"/><circle cx=\"2\" cy=\"10\" r=\"0.91\"/><circle cx=\"8\" cy=\"10\" r=\"0.91\"/><circle cx=\"14\" cy=\"10\" r=\"0.91\"/><circle cx=\"2\" cy=\"12\" r=\"0.91\"/><circle cx=\"4\" cy=\"12\" r=\"0.91\"/><circle cx=\"6\" cy=\"12\" r=\"0.91\"/><circle cx=\"8\" cy=\"12\" r=\"0.91\"/><circle cx=\"10\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"14\" cy=\"12\" r=\"0.91\"/></g>\n</svg>",
		"dot-banknotes": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"4\" cy=\"2\" r=\"0.91\"/><circle cx=\"6\" cy=\"2\" r=\"0.91\"/><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"12\" cy=\"2\" r=\"0.91\"/><circle cx=\"14\" cy=\"2\" r=\"0.91\"/><circle cx=\"14\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"4\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"6\" r=\"0.91\"/><circle cx=\"8\" cy=\"6\" r=\"0.91\"/><circle cx=\"10\" cy=\"6\" r=\"0.91\"/><circle cx=\"12\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"8\" cy=\"8\" r=\"0.91\"/><circle cx=\"12\" cy=\"8\" r=\"0.91\"/><circle cx=\"2\" cy=\"10\" r=\"0.91\"/><circle cx=\"6\" cy=\"10\" r=\"0.91\"/><circle cx=\"10\" cy=\"10\" r=\"0.91\"/><circle cx=\"12\" cy=\"10\" r=\"0.91\"/><circle cx=\"2\" cy=\"12\" r=\"0.91\"/><circle cx=\"8\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"2\" cy=\"14\" r=\"0.91\"/><circle cx=\"4\" cy=\"14\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/><circle cx=\"12\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-card": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"2\" cy=\"4\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"6\" cy=\"4\" r=\"0.91\"/><circle cx=\"8\" cy=\"4\" r=\"0.91\"/><circle cx=\"10\" cy=\"4\" r=\"0.91\"/><circle cx=\"12\" cy=\"4\" r=\"0.91\"/><circle cx=\"14\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"14\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"4\" cy=\"8\" r=\"0.91\"/><circle cx=\"6\" cy=\"8\" r=\"0.91\"/><circle cx=\"8\" cy=\"8\" r=\"0.91\"/><circle cx=\"10\" cy=\"8\" r=\"0.91\"/><circle cx=\"12\" cy=\"8\" r=\"0.91\"/><circle cx=\"14\" cy=\"8\" r=\"0.91\"/><circle cx=\"2\" cy=\"10\" r=\"0.91\"/><circle cx=\"14\" cy=\"10\" r=\"0.91\"/><circle cx=\"2\" cy=\"12\" r=\"0.91\"/><circle cx=\"6\" cy=\"12\" r=\"0.91\"/><circle cx=\"8\" cy=\"12\" r=\"0.91\"/><circle cx=\"14\" cy=\"12\" r=\"0.91\"/><circle cx=\"2\" cy=\"14\" r=\"0.91\"/><circle cx=\"4\" cy=\"14\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/><circle cx=\"12\" cy=\"14\" r=\"0.91\"/><circle cx=\"14\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-coin": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"6\" cy=\"2\" r=\"0.91\"/><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"12\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"6\" r=\"0.91\"/><circle cx=\"8\" cy=\"6\" r=\"0.91\"/><circle cx=\"14\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"8\" cy=\"8\" r=\"0.91\"/><circle cx=\"14\" cy=\"8\" r=\"0.91\"/><circle cx=\"2\" cy=\"10\" r=\"0.91\"/><circle cx=\"8\" cy=\"10\" r=\"0.91\"/><circle cx=\"14\" cy=\"10\" r=\"0.91\"/><circle cx=\"4\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-coins": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"4\" cy=\"2\" r=\"0.91\"/><circle cx=\"6\" cy=\"2\" r=\"0.91\"/><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"12\" cy=\"2\" r=\"0.91\"/><circle cx=\"2\" cy=\"4\" r=\"0.91\"/><circle cx=\"14\" cy=\"4\" r=\"0.91\"/><circle cx=\"4\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"6\" r=\"0.91\"/><circle cx=\"8\" cy=\"6\" r=\"0.91\"/><circle cx=\"10\" cy=\"6\" r=\"0.91\"/><circle cx=\"12\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"14\" cy=\"8\" r=\"0.91\"/><circle cx=\"4\" cy=\"10\" r=\"0.91\"/><circle cx=\"6\" cy=\"10\" r=\"0.91\"/><circle cx=\"8\" cy=\"10\" r=\"0.91\"/><circle cx=\"10\" cy=\"10\" r=\"0.91\"/><circle cx=\"12\" cy=\"10\" r=\"0.91\"/><circle cx=\"2\" cy=\"12\" r=\"0.91\"/><circle cx=\"14\" cy=\"12\" r=\"0.91\"/><circle cx=\"4\" cy=\"14\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/><circle cx=\"12\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-happy": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"6\" cy=\"2\" r=\"0.91\"/><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"12\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"6\" r=\"0.91\"/><circle cx=\"10\" cy=\"6\" r=\"0.91\"/><circle cx=\"14\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"14\" cy=\"8\" r=\"0.91\"/><circle cx=\"2\" cy=\"10\" r=\"0.91\"/><circle cx=\"6\" cy=\"10\" r=\"0.91\"/><circle cx=\"10\" cy=\"10\" r=\"0.91\"/><circle cx=\"14\" cy=\"10\" r=\"0.91\"/><circle cx=\"4\" cy=\"12\" r=\"0.91\"/><circle cx=\"8\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-neutral": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"6\" cy=\"2\" r=\"0.91\"/><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"12\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"6\" r=\"0.91\"/><circle cx=\"10\" cy=\"6\" r=\"0.91\"/><circle cx=\"14\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"14\" cy=\"8\" r=\"0.91\"/><circle cx=\"2\" cy=\"10\" r=\"0.91\"/><circle cx=\"6\" cy=\"10\" r=\"0.91\"/><circle cx=\"8\" cy=\"10\" r=\"0.91\"/><circle cx=\"10\" cy=\"10\" r=\"0.91\"/><circle cx=\"14\" cy=\"10\" r=\"0.91\"/><circle cx=\"4\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-receipt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"4\" cy=\"2\" r=\"0.91\"/><circle cx=\"6\" cy=\"2\" r=\"0.91\"/><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"12\" cy=\"2\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"12\" cy=\"4\" r=\"0.91\"/><circle cx=\"4\" cy=\"6\" r=\"0.91\"/><circle cx=\"8\" cy=\"6\" r=\"0.91\"/><circle cx=\"12\" cy=\"6\" r=\"0.91\"/><circle cx=\"4\" cy=\"8\" r=\"0.91\"/><circle cx=\"12\" cy=\"8\" r=\"0.91\"/><circle cx=\"4\" cy=\"10\" r=\"0.91\"/><circle cx=\"8\" cy=\"10\" r=\"0.91\"/><circle cx=\"12\" cy=\"10\" r=\"0.91\"/><circle cx=\"4\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"4\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"12\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-sad": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"6\" cy=\"2\" r=\"0.91\"/><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"12\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"6\" r=\"0.91\"/><circle cx=\"10\" cy=\"6\" r=\"0.91\"/><circle cx=\"14\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"14\" cy=\"8\" r=\"0.91\"/><circle cx=\"2\" cy=\"10\" r=\"0.91\"/><circle cx=\"8\" cy=\"10\" r=\"0.91\"/><circle cx=\"14\" cy=\"10\" r=\"0.91\"/><circle cx=\"4\" cy=\"12\" r=\"0.91\"/><circle cx=\"6\" cy=\"12\" r=\"0.91\"/><circle cx=\"10\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-safe": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"2\" cy=\"2\" r=\"0.91\"/><circle cx=\"4\" cy=\"2\" r=\"0.91\"/><circle cx=\"6\" cy=\"2\" r=\"0.91\"/><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"12\" cy=\"2\" r=\"0.91\"/><circle cx=\"14\" cy=\"2\" r=\"0.91\"/><circle cx=\"2\" cy=\"4\" r=\"0.91\"/><circle cx=\"14\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"6\" r=\"0.91\"/><circle cx=\"8\" cy=\"6\" r=\"0.91\"/><circle cx=\"10\" cy=\"6\" r=\"0.91\"/><circle cx=\"14\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"6\" cy=\"8\" r=\"0.91\"/><circle cx=\"10\" cy=\"8\" r=\"0.91\"/><circle cx=\"12\" cy=\"8\" r=\"0.91\"/><circle cx=\"14\" cy=\"8\" r=\"0.91\"/><circle cx=\"2\" cy=\"10\" r=\"0.91\"/><circle cx=\"6\" cy=\"10\" r=\"0.91\"/><circle cx=\"8\" cy=\"10\" r=\"0.91\"/><circle cx=\"10\" cy=\"10\" r=\"0.91\"/><circle cx=\"14\" cy=\"10\" r=\"0.91\"/><circle cx=\"2\" cy=\"12\" r=\"0.91\"/><circle cx=\"14\" cy=\"12\" r=\"0.91\"/><circle cx=\"2\" cy=\"14\" r=\"0.91\"/><circle cx=\"4\" cy=\"14\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/><circle cx=\"12\" cy=\"14\" r=\"0.91\"/><circle cx=\"14\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-transfer": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"2\" cy=\"4\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"6\" cy=\"4\" r=\"0.91\"/><circle cx=\"8\" cy=\"4\" r=\"0.91\"/><circle cx=\"10\" cy=\"4\" r=\"0.91\"/><circle cx=\"12\" cy=\"4\" r=\"0.91\"/><circle cx=\"10\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"10\" r=\"0.91\"/><circle cx=\"4\" cy=\"12\" r=\"0.91\"/><circle cx=\"6\" cy=\"12\" r=\"0.91\"/><circle cx=\"8\" cy=\"12\" r=\"0.91\"/><circle cx=\"10\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"14\" cy=\"12\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		"dot-wallet": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g fill=\"currentColor\"><circle cx=\"6\" cy=\"2\" r=\"0.91\"/><circle cx=\"8\" cy=\"2\" r=\"0.91\"/><circle cx=\"10\" cy=\"2\" r=\"0.91\"/><circle cx=\"12\" cy=\"2\" r=\"0.91\"/><circle cx=\"4\" cy=\"4\" r=\"0.91\"/><circle cx=\"14\" cy=\"4\" r=\"0.91\"/><circle cx=\"2\" cy=\"6\" r=\"0.91\"/><circle cx=\"4\" cy=\"6\" r=\"0.91\"/><circle cx=\"6\" cy=\"6\" r=\"0.91\"/><circle cx=\"8\" cy=\"6\" r=\"0.91\"/><circle cx=\"10\" cy=\"6\" r=\"0.91\"/><circle cx=\"12\" cy=\"6\" r=\"0.91\"/><circle cx=\"14\" cy=\"6\" r=\"0.91\"/><circle cx=\"2\" cy=\"8\" r=\"0.91\"/><circle cx=\"12\" cy=\"8\" r=\"0.91\"/><circle cx=\"14\" cy=\"8\" r=\"0.91\"/><circle cx=\"2\" cy=\"10\" r=\"0.91\"/><circle cx=\"10\" cy=\"10\" r=\"0.91\"/><circle cx=\"14\" cy=\"10\" r=\"0.91\"/><circle cx=\"2\" cy=\"12\" r=\"0.91\"/><circle cx=\"12\" cy=\"12\" r=\"0.91\"/><circle cx=\"14\" cy=\"12\" r=\"0.91\"/><circle cx=\"2\" cy=\"14\" r=\"0.91\"/><circle cx=\"4\" cy=\"14\" r=\"0.91\"/><circle cx=\"6\" cy=\"14\" r=\"0.91\"/><circle cx=\"8\" cy=\"14\" r=\"0.91\"/><circle cx=\"10\" cy=\"14\" r=\"0.91\"/><circle cx=\"12\" cy=\"14\" r=\"0.91\"/><circle cx=\"14\" cy=\"14\" r=\"0.91\"/></g>\n</svg>",
		download: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 2.5V10M4.5 6.5L8 10L11.5 6.5\" stroke=\"currentColor\"/>\n<path d=\"M2.5 10.5V13.5H13.5V10.5\" stroke=\"currentColor\"/>\n</svg>",
		drive: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12 10l-6 10l-3 -5l6 -10l3 5\"/>\n<path d=\"M9 15h12l-3 5h-12\"/>\n<path d=\"M15 15l-6 -10h6l6 10l-6 0\"/>\n</svg></svg>",
		drop: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 2C8 2 3.5 6.75 3.5 9.75C3.5 12.24 5.51 14 8 14C10.49 14 12.5 12.24 12.5 9.75C12.5 6.75 8 2 8 2Z\"/></g>\n</svg>",
		dropbox: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.5 10.625l-4.5 -2.813l4.5 -2.812l4.5 2.813m-4.5 2.812l4.5 -2.813m-4.5 2.813l-4.5 2.823l4.5 2.802m0 -5.625l4.5 2.823m0 -5.636l4.5 2.791l4.5 -2.812l-4.5 -2.791l-4.5 2.813m-4.5 8.438l4.5 -2.802m-4.5 2.802v1.123l4.5 2.627l4.5 -2.627v-1.123m-4.5 -2.802l4.5 -2.823l4.5 2.823l-4.5 2.802m-4.5 -2.802l4.5 2.802\"/>\n</svg></svg>",
		dumbbell: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.25 8H10.75\"/><rect x=\"3\" y=\"4.75\" width=\"2.25\" height=\"6.5\" rx=\"0.75\"/><rect x=\"10.75\" y=\"4.75\" width=\"2.25\" height=\"6.5\" rx=\"0.75\"/><path d=\"M1.75 6.75V9.25M14.25 6.75V9.25\"/></g>\n</svg>",
		"edge-brand": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M20.978 11.372a9 9 0 1 0 -1.593 5.773\"/>\n<path d=\"M20.978 11.372c.21 2.993 -5.034 2.413 -6.913 1.486c1.392 -1.6 .402 -4.038 -2.274 -3.851c-1.745 .122 -2.927 1.157 -2.784 3.202c.28 3.99 4.444 6.205 10.36 4.79\"/>\n<path d=\"M3.022 12.628c-.283 -4.043 8.717 -7.228 11.248 -2.688\"/>\n<path d=\"M12.628 20.978c-2.993 .21 -5.162 -4.725 -3.567 -9.748\"/>\n</svg></svg>",
		equation: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 9.5L4.75 12.5L7.5 3.5H13.5M9.25 6.5L12.25 11M12.25 6.5L9.25 11\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		exercise: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9.11131 4.50523C8.89226 4.50523 8.69548 4.45325 8.52098 4.3493C8.34648 4.24163 8.20539 4.10054 8.09772 3.92604C7.99377 3.75154 7.94179 3.55662 7.94179 3.34128C7.94179 3.12594 7.99377 2.93102 8.09772 2.75652C8.20539 2.5783 8.34648 2.43722 8.52098 2.33326C8.69548 2.2293 8.89226 2.17732 9.11131 2.17732C9.32665 2.17732 9.52157 2.2293 9.69607 2.33326C9.87057 2.43722 10.0098 2.5783 10.1138 2.75652C10.2214 2.93102 10.2753 3.12594 10.2753 3.34128C10.2753 3.55662 10.2214 3.75154 10.1138 3.92604C10.0098 4.10054 9.87057 4.24163 9.69607 4.3493C9.52157 4.45325 9.32665 4.50523 9.11131 4.50523ZM7.29019 9.12207C7.13797 9.03668 6.98389 8.94386 6.82795 8.84361C6.67202 8.73965 6.55692 8.60228 6.48267 8.43149C6.40841 8.25699 6.41584 8.01938 6.50494 7.71864L6.9282 6.19269C6.9579 6.09616 6.94305 6.0219 6.88365 5.96992C6.82424 5.91794 6.7537 5.89567 6.67202 5.90309L5.93132 5.95322L5.70855 7.49031C5.66029 7.83559 5.48022 7.99524 5.16834 7.96925C5.01983 7.9544 4.90659 7.89314 4.82862 7.78547C4.75066 7.67409 4.72281 7.53486 4.74509 7.36778L5.00127 5.47984C5.01983 5.3239 5.07738 5.19952 5.17391 5.1067C5.27044 5.01388 5.39482 4.9619 5.54705 4.95077L7.40715 4.82268C7.89723 4.78555 8.30193 4.83753 8.62123 4.97861C8.94052 5.11598 9.22084 5.34989 9.46217 5.68033L10.3755 6.94453L11.701 6.3542C11.8495 6.28737 11.985 6.27251 12.1075 6.30964C12.2338 6.34677 12.3284 6.43402 12.3915 6.57139C12.4584 6.70877 12.4658 6.83871 12.4138 6.96123C12.3618 7.08376 12.2597 7.17843 12.1075 7.24526L10.4256 7.9971C10.3143 8.04908 10.1992 8.05836 10.0803 8.02495C9.96525 7.99153 9.87429 7.92284 9.80746 7.81889L9.21713 6.9668C9.16143 6.88512 9.09089 6.84985 9.0055 6.86099C8.9201 6.87213 8.86441 6.92596 8.83842 7.0225L8.44301 8.38137L10.4312 9.68456C10.5834 9.7848 10.6688 9.9296 10.6874 10.119C10.7059 10.3083 10.6503 10.4568 10.5203 10.5645L8.69362 12.1183C8.54511 12.2445 8.3966 12.3021 8.24809 12.2909C8.10329 12.2835 7.98634 12.2297 7.89723 12.1294C7.81184 12.0292 7.77286 11.9085 7.78028 11.7674C7.78771 11.6226 7.86382 11.4908 8.00862 11.372L9.30066 10.2526L7.29019 9.12207ZM3.73707 13.6999C3.6294 13.6034 3.56814 13.4772 3.55329 13.3212C3.54215 13.1653 3.60712 13.0186 3.74821 12.8813L5.53034 11.1103L6.15409 8.89373C6.25062 9.01997 6.37128 9.13878 6.51608 9.25016C6.66088 9.35783 6.83352 9.46736 7.03401 9.57874L7.2178 9.68456L6.50494 11.5224C6.46039 11.6338 6.42326 11.7117 6.39356 11.7563C6.36386 11.7971 6.31188 11.8547 6.23762 11.9289L4.51675 13.6275C4.38309 13.7575 4.24572 13.8224 4.10463 13.8224C3.96355 13.8262 3.84103 13.7853 3.73707 13.6999Z\" fill=\"currentColor\"/>\n</svg>",
		eye: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1.75 8C3.3 5.2 5.5 3.75 8 3.75C10.5 3.75 12.7 5.2 14.25 8C12.7 10.8 10.5 12.25 8 12.25C5.5 12.25 3.3 10.8 1.75 8Z\"/><circle cx=\"8\" cy=\"8\" r=\"2\"/></g>\n</svg>",
		"eye-off": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1.75 8C2.52 6.61 3.45 5.55 4.5 4.83M6.64 3.95C7.08 3.82 7.53 3.75 8 3.75C10.5 3.75 12.7 5.2 14.25 8C13.6 9.17 12.85 10.1 12.02 10.8M10.28 11.78C9.56 12.09 8.8 12.25 8 12.25C5.5 12.25 3.3 10.8 1.75 8\"/><path d=\"M6.59 6.59C5.81 7.37 5.81 8.63 6.59 9.41C7.37 10.19 8.63 10.19 9.41 9.41\"/><path d=\"M2.25 2.25L13.75 13.75\"/></g>\n</svg>",
		facebook: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3\"/>\n</svg></svg>",
		figma: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\"/>\n<path d=\"M6 6a3 3 0 0 1 3 -3h6a3 3 0 0 1 3 3a3 3 0 0 1 -3 3h-6a3 3 0 0 1 -3 -3\"/>\n<path d=\"M9 9a3 3 0 0 0 0 6h3m-3 0a3 3 0 1 0 3 3v-15\"/>\n</svg></svg>",
		firefox: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.028 7.82a9 9 0 1 0 12.823 -3.4c-1.636 -1.02 -3.064 -1.02 -4.851 -1.02h-1.647\"/>\n<path d=\"M4.914 9.485c-1.756 -1.569 -.805 -5.38 .109 -6.17c.086 .896 .585 1.208 1.111 1.685c.88 -.275 1.313 -.282 1.867 0c.82 -.91 1.694 -2.354 2.628 -2.093c-1.082 1.741 -.07 3.733 1.371 4.173c-.17 .975 -1.484 1.913 -2.76 2.686c-1.296 .938 -.722 1.85 0 2.234c.949 .506 3.611 -1 4.545 .354c-1.698 .102 -1.536 3.107 -3.983 2.727c2.523 .957 4.345 .462 5.458 -.34c1.965 -1.52 2.879 -3.542 2.879 -5.557c-.014 -1.398 .194 -2.695 -1.26 -4.75\"/>\n</svg></svg>",
		flame: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 14C10.49 14 12.5 12.15 12.5 9.75C12.5 6.5 9.5 5.25 8.75 2C7 3.25 6.25 5 6.5 6.75C5.75 6.5 5.25 5.75 5.25 5C4.25 6 3.5 7.75 3.5 9.75C3.5 12.15 5.51 14 8 14Z\"/></g>\n</svg>",
		flip: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 1.5V2.5M8 3.5V4.5M8 5.5V6.5M8 7.5V8.5M8 9.5V10.5M8 11.5V12.5M8 13.5V14.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M6 3.5V12.5H1.5Z\" stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linejoin=\"round\"/>\n<path d=\"M10 3.5V12.5H14.5Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linejoin=\"round\"/>\n</svg>",
		food: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.5 2.25V13.75M3 2.25V5.25C3 6.08 3.67 6.75 4.5 6.75C5.33 6.75 6 6.08 6 5.25V2.25\"/><path d=\"M11.25 13.75V2.25C9.86 2.25 9.25 3.92 9.25 6.25V8.75H11.25\"/></g>\n</svg>",
		form: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.9653 3.31348V12.6865H2.03467V3.31348H13.9653ZM3.03467 11.6865H12.9653V4.31348H3.03467V11.6865Z\" fill=\"currentColor\"/>\n<path d=\"M4 5.50004V8.40359L12.2393 8.41992V5.5L4 5.50004Z\" fill=\"currentColor\"/>\n<path d=\"M6 9.50004V10.42H10.2393V9.50004H6Z\" fill=\"currentColor\"/>\n</svg>",
		fuel: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.75 13.75V3.25C2.75 2.7 3.2 2.25 3.75 2.25H8.25C8.8 2.25 9.25 2.7 9.25 3.25V13.75\"/><path d=\"M1.75 13.75H10.25M2.75 6.75H9.25\"/><path d=\"M9.25 8.25H10.25C10.8 8.25 11.25 8.7 11.25 9.25V11.5C11.25 12.05 11.7 12.5 12.25 12.5C12.8 12.5 13.25 12.05 13.25 11.5V5.75L11.25 3.75\"/></g>\n</svg>",
		gallery: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M0 16V0H16L0 16ZM0.706055 0.769531V1.80957H3.60547V10H4.83984V1.80957H7.73926V0.769531H0.706055Z\" fill=\"currentColor\"/>\n</svg>",
		game: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 4.25H11C12.79 4.25 14.25 5.71 14.25 7.5V10.25C14.25 11.08 13.58 11.75 12.75 11.75C12.24 11.75 11.77 11.5 11.49 11.07L10.75 10H5.25L4.51 11.07C4.23 11.5 3.76 11.75 3.25 11.75C2.42 11.75 1.75 11.08 1.75 10.25V7.5C1.75 5.71 3.21 4.25 5 4.25Z\"/><path d=\"M5 6.5V8.5M4 7.5H6M10.5 7H10.51M11.5 8H11.51\"/></g>\n</svg>",
		gift: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2.25\" y=\"5.25\" width=\"11.5\" height=\"3\" rx=\"0.75\"/><path d=\"M3.25 8.25V12.75C3.25 13.3 3.7 13.75 4.25 13.75H11.75C12.3 13.75 12.75 13.3 12.75 12.75V8.25M8 5.25V13.75\"/><path d=\"M8 5.25C8 5.25 7.5 2.25 5.75 2.25C4.9 2.25 4.5 2.9 4.5 3.5C4.5 4.6 6 5.25 8 5.25C10 5.25 11.5 4.6 11.5 3.5C11.5 2.9 11.1 2.25 10.25 2.25C8.5 2.25 8 5.25 8 5.25Z\"/></g>\n</svg>",
		github: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5\"/>\n</svg></svg>",
		globe: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><path d=\"M2.3017098903656006 7.9920501708984375C2.3017399311065674 6.698239803314209 2.732990026473999 5.505119800567627 3.4595799446105957 4.548570156097412C3.6456398963928223 4.303619861602783 3.8510799407958984 4.074170112609863 4.073599815368652 3.862529993057251C4.836309909820557 3.1371099948883057 5.799739837646484 2.62076997756958 6.872000217437744 2.405440092086792C7.236599922180176 2.3322200775146484 7.613790035247803 2.2938098907470703 7.999949932098389 2.2938098907470703C8.386110305786133 2.2938098907470703 8.763299942016602 2.33201003074646 9.127909660339355 2.4052300453186035C10.200200080871582 2.6205599308013916 11.163599967956543 3.136889934539795 11.926300048828125 3.8623199462890625C12.148799896240234 4.073959827423096 12.354299545288086 4.303400039672852 12.540300369262695 4.5483598709106445C13.266900062561035 5.504899978637695 13.698200225830078 6.698239803314209 13.698200225830078 7.9920501708984375C13.698200225830078 9.285849571228027 13.266900062561035 10.478799819946289 12.540300369262695 11.43529987335205C12.354299545288086 11.680299758911133 12.148799896240234 11.909700393676758 11.926300048828125 12.121399879455566C11.163599967956543 12.846799850463867 10.200200080871582 13.363100051879883 9.127909660339355 13.578399658203125C8.763299942016602 13.651700019836426 8.386110305786133 13.690299987792969 7.999949932098389 13.690299987792969C7.613790035247803 13.690299987792969 7.236599922180176 13.651900291442871 6.872000217437744 13.578700065612793C5.799739837646484 13.363300323486328 4.836309909820557 12.847000122070312 4.073599815368652 12.121600151062012C3.8510799407958984 11.909899711608887 3.6456398963928223 11.680500030517578 3.4595799446105957 11.435500144958496C2.732990026473999 10.479000091552734 2.3017399311065674 9.285849571228027 2.3017098903656006 7.9920501708984375ZM10.443499565124512 5.782179832458496C10.634200096130371 6.316219806671143 10.765999794006348 6.888070106506348 10.807999610900879 7.491960048675537H12.671899795532227C12.57800006866455 6.604010105133057 12.236700057983398 5.789830207824707 11.718199729919434 5.119639873504639C11.32450008392334 5.365699768066406 10.898099899291992 5.593299865722656 10.443499565124512 5.782179832458496ZM10.443499565124512 10.201499938964844C10.898099899291992 10.390399932861328 11.32450008392334 10.618000030517578 11.718199729919434 10.86400032043457C12.236700057983398 10.19379997253418 12.57800006866455 9.379659652709961 12.671899795532227 8.49170970916748H10.807999610900879C10.765999794006348 9.095600128173828 10.634200096130371 9.667449951171875 10.443499565124512 10.201499938964844ZM5.191870212554932 7.4921698570251465C5.233890056610107 6.888279914855957 5.36568021774292 6.31643009185791 5.556389808654785 5.782400131225586C5.10181999206543 5.593520164489746 4.6753997802734375 5.365920066833496 4.281720161437988 5.119850158691406C3.7632501125335693 5.790040016174316 3.421950101852417 6.604219913482666 3.328010082244873 7.4921698570251465ZM3.328010082244873 8.49193000793457C3.421950101852417 9.379870414733887 3.7632501125335693 10.194100379943848 4.281720161437988 10.8641996383667C4.6753997802734375 10.618200302124023 5.10181999206543 10.390600204467773 5.556389808654785 10.201700210571289C5.36568021774292 9.667670249938965 5.233890056610107 9.095809936523438 5.191870212554932 8.49193000793457ZM8.500080108642578 9.70188045501709C8.870280265808105 9.737970352172852 9.22931957244873 9.807129859924316 9.575570106506348 9.90211009979248C9.735750198364258 9.455490112304688 9.846779823303223 8.983839988708496 9.88737964630127 8.49170970916748H8.500080108642578ZM8.500080108642578 6.281789779663086V7.491960048675537H9.88737964630127C9.846779823303223 6.9998297691345215 9.735750198364258 6.528180122375488 9.575570106506348 6.081560134887695C9.22931957244873 6.176539897918701 8.870280265808105 6.2457098960876465 8.500080108642578 6.281789779663086ZM7.4998297691345215 6.2820000648498535C7.129630088806152 6.245920181274414 6.770579814910889 6.176750183105469 6.424339771270752 6.081779956817627C6.26416015625 6.528389930725098 6.153120040893555 7.000040054321289 6.11253023147583 7.4921698570251465H7.4998297691345215ZM6.11253023147583 8.49193000793457C6.153120040893555 8.984049797058105 6.26416015625 9.455699920654297 6.424339771270752 9.90231990814209C6.770579814910889 9.807339668273926 7.129630088806152 9.738180160522461 7.4998297691345215 9.7020902633667V8.49193000793457ZM4.926700115203857 11.545700073242188C5.4793901443481445 12.024100303649902 6.144810199737549 12.375800132751465 6.877749919891357 12.555399894714355C6.533840179443359 12.111000061035156 6.198790073394775 11.6048002243042 5.918300151824951 11.04539966583252C5.572020053863525 11.18850040435791 5.240610122680664 11.358699798583984 4.926700115203857 11.545700073242188ZM11.073200225830078 11.545499801635742C10.759300231933594 11.358499526977539 10.427900314331055 11.188300132751465 10.081600189208984 11.04520034790039C9.801119804382324 11.604599952697754 9.466070175170898 12.110799789428711 9.122150421142578 12.55519962310791C9.85509967803955 12.37559986114502 10.520500183105469 12.023900032043457 11.073200225830078 11.545499801635742ZM4.926700115203857 4.438379764556885C5.240610122680664 4.625380039215088 5.572020053863525 4.795559883117676 5.918300151824951 4.938729763031006C6.198790073394775 4.379260063171387 6.533840179443359 3.8730599880218506 6.877749919891357 3.428679943084717C6.144810199737549 3.608330011367798 5.4793901443481445 3.959969997406006 4.926700115203857 4.438379764556885ZM11.073200225830078 4.438169956207275C10.520500183105469 3.9597599506378174 9.85509967803955 3.6081199645996094 9.122150421142578 3.4284698963165283C9.466070175170898 3.87283992767334 9.801119804382324 4.379049777984619 10.081600189208984 4.9385199546813965C10.427900314331055 4.795350074768066 10.759300231933594 4.6251702308654785 11.073200225830078 4.438169956207275ZM7.4998297691345215 11.857099533081055V10.625300407409668C7.262030124664307 10.652600288391113 7.02849006652832 10.696000099182129 6.7998199462890625 10.753000259399414C7.007080078125 11.148300170898438 7.246699810028076 11.517600059509277 7.4998297691345215 11.857099533081055ZM7.4998297691345215 4.126959800720215C7.246699810028076 4.466450214385986 7.007080078125 4.835840225219727 6.7998199462890625 5.231090068817139C7.02849006652832 5.288070201873779 7.262030124664307 5.33144998550415 7.4998297691345215 5.358819961547852ZM8.500080108642578 4.1267499923706055V5.35860013961792C8.737879753112793 5.331240177154541 8.971420288085938 5.287859916687012 9.200090408325195 5.230879783630371C8.992830276489258 4.835629940032959 8.753210067749023 4.466239929199219 8.500080108642578 4.1267499923706055ZM8.500080108642578 10.625100135803223V11.856900215148926C8.753210067749023 11.517399787902832 8.992830276489258 11.14799976348877 9.200090408325195 10.752799987792969C8.971420288085938 10.695799827575684 8.737879753112793 10.652400016784668 8.500080108642578 10.625100135803223Z\" fill=\"currentColor\"/></svg>",
		group: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.0716 12.8281C7.24826 12.8281 6.52893 12.6201 5.9136 12.2041C5.30693 11.7881 4.83893 11.2161 4.5096 10.4881C4.18893 9.7514 4.02859 8.9194 4.02859 7.99207C4.02859 7.0474 4.19326 6.21107 4.5226 5.48307C4.8606 4.7464 5.34593 4.1744 5.9786 3.76707C6.61993 3.35973 7.38693 3.15607 8.2796 3.15607C9.0596 3.15607 9.70093 3.30773 10.2036 3.61107C10.7149 3.9144 11.0919 4.2784 11.3346 4.70307C11.5859 5.11907 11.7419 5.53507 11.8026 5.95107L10.5806 6.12007C10.4939 5.6174 10.2643 5.17107 9.8916 4.78107C9.5276 4.39107 8.97726 4.19607 8.2406 4.19607C7.62526 4.19607 7.09226 4.3564 6.6416 4.67707C6.1996 4.99773 5.8616 5.44407 5.6276 6.01607C5.40226 6.58807 5.2896 7.25107 5.2896 8.00507C5.2896 9.12307 5.54093 10.0331 6.0436 10.7351C6.55493 11.4371 7.2916 11.7881 8.2536 11.7881C8.94693 11.7881 9.4886 11.6321 9.8786 11.3201C10.2686 10.9994 10.5286 10.6267 10.6586 10.2021C10.7973 9.7774 10.8666 9.37007 10.8666 8.98007V8.82407H8.1626V7.78407H11.9716V12.6071H11.0746L10.9056 11.1251C10.6976 11.6364 10.3423 12.0481 9.8396 12.3601C9.33693 12.6721 8.7476 12.8281 8.0716 12.8281Z\" fill=\"currentColor\"/>\n</svg>",
		"group-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.9653 3.31348V12.6865H2.03467V3.31348H13.9653ZM3.03467 11.6865H12.9653V4.31348H3.03467V11.6865Z\" fill=\"currentColor\"/>\n<path d=\"M12.1196 6.66789V5.74797H3.88037V6.66789H12.1196Z\" fill=\"currentColor\"/>\n<path d=\"M3.88037 7.54004V8.45996L12.1196 8.45996V7.54004L3.88037 7.54004Z\" fill=\"currentColor\"/>\n<path d=\"M12.1196 8.45996V7.54004L3.88037 7.54004V8.45996L12.1196 8.45996Z\" fill=\"currentColor\"/>\n<path d=\"M3.88037 9.33211V10.252L12.1196 10.252V9.33211L3.88037 9.33211Z\" fill=\"currentColor\"/>\n</svg>",
		"group-alt-2": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.1865 14.4653L3.81348 14.4653L3.81348 1.53467L12.1865 1.53467L12.1865 14.4653ZM4.81348 2.53467L4.81348 13.4653L11.1865 13.4653L11.1865 2.53467L4.81348 2.53467Z\" fill=\"currentColor\"/>\n</svg>",
		h1: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5V12.5M7 3.5V12.5M3 8H7M9.75 7L11.75 5.25V12.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		h2: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5V12.5M7 3.5V12.5M3 8H7M9.5 7.1A1.85 1.85 0 1 1 12.75 8.3L9.5 12.5H13.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		h3: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5V12.5M7 3.5V12.5M3 8H7M9.5 5.25H13.25L10.75 8.25H11.25A2.1 2.1 0 1 1 9.5 11.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		handle: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"5.5\" cy=\"4\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"5.5\" cy=\"8\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"5.5\" cy=\"12\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"10.5\" cy=\"4\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"10.5\" cy=\"8\" r=\"1.1\" fill=\"currentColor\"/>\n<circle cx=\"10.5\" cy=\"12\" r=\"1.1\" fill=\"currentColor\"/>\n</svg>",
		head: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.33452 12.7273V3.27274H5.4794V7.48296H10.5206V3.27274H11.6655V12.7273H10.5206V8.49859H5.4794V12.7273H4.33452Z\" fill=\"currentColor\"/>\n</svg>",
		health: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"8\" cy=\"8\" r=\"6.2\" fill=\"currentColor\" opacity=\".16\"/><path d=\"M3.5 8h2l1.4-2.5 2.2 5 1.4-2.5h2\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</svg>",
		heart: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 13.25C8 13.25 2 9.9 2 5.75C2 4.23 3.23 3 4.75 3C6.08 3 7.33 3.83 8 5C8.67 3.83 9.92 3 11.25 3C12.77 3 14 4.23 14 5.75C14 9.9 8 13.25 8 13.25Z\"/></g>\n</svg>",
		help: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"8\" cy=\"8\" r=\"6.5\" stroke=\"#1E1E1E\"/>\n<path d=\"M6.2 6.4C6.3 5.3 7 4.7 8 4.7C9.1 4.7 9.8 5.4 9.8 6.3C9.8 7.6 8 7.7 8 9.2\" stroke=\"#1E1E1E\" stroke-linecap=\"round\"/>\n<circle cx=\"8\" cy=\"11.3\" r=\"0.75\" fill=\"#1E1E1E\"/>\n</svg>",
		"help-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.12254 9.54051C7.12254 9.07251 7.23954 8.53951 7.91554 7.96751L8.56554 7.40851C9.03354 7.01851 9.39754 6.55051 9.39754 5.82251C9.39754 5.04251 8.89054 4.54851 8.00654 4.54851C7.10954 4.54851 6.51154 5.09451 6.51154 6.05651C6.51154 6.25151 6.51154 6.42051 6.58954 6.71951L5.00354 6.56351C4.93854 6.25151 4.92554 6.01751 4.92554 5.83551C4.92554 4.32751 6.04354 3.27451 8.03254 3.27451C9.94354 3.27451 11.0745 4.15851 11.0745 5.71851C11.0745 6.64151 10.5285 7.43451 9.85254 8.01951L9.22854 8.56551C8.82554 8.91651 8.68254 9.20251 8.68254 9.76151V10.1255H7.12254V9.54051ZM7.01854 12.7255V11.0485H8.81254V12.7255H7.01854Z\" fill=\"currentColor\"/>\n</svg>",
		history: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.71 11.79A5 5 0 1 0 4.71 4.71L3.83 5.6M6.83 5.6H3.83V2.6M8.25 5.25V8.25L10.5 9.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		"home-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.25 7L8 2.5L13.75 7\"/><path d=\"M3.75 5.75V12.25C3.75 12.8 4.2 13.25 4.75 13.25H11.25C11.8 13.25 12.25 12.8 12.25 12.25V5.75\"/><path d=\"M6.5 13.25V9.75C6.5 9.2 6.95 8.75 7.5 8.75H8.5C9.05 8.75 9.5 9.2 9.5 9.75V13.25\"/></g>\n</svg>",
		icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"1\" y=\"1\" width=\"10\" height=\"10\" rx=\"2\" stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\"/>\n<circle cx=\"6\" cy=\"6\" r=\"2.5\" fill=\"currentColor\"/>\n</svg></svg>",
		image: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3H13.5V13H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M2.5 11.5L6.5 7.5L9 10L10.5 8.5L13.5 11.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<circle cx=\"10.5\" cy=\"5.75\" r=\"1.1\" fill=\"currentColor\"/>\n</svg>",
		in: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.1361 3.56571L7.99688 7.72965L3.86423 3.57226L4.5628 2.85638L7.48765 5.79873L7.49661 9.59381e-07L8.51508 0L8.50612 5.79873L11.4244 2.84983L12.1361 3.56571Z\" fill=\"currentColor\"/>\n<path d=\"M3.86395 12.3337L8.00314 8.16974L12.1358 12.3271L11.4372 13.043L8.51238 10.1007L8.49783 16H7.47936L7.4939 10.1007L4.57558 13.0496L3.86395 12.3337Z\" fill=\"currentColor\"/>\n</svg>",
		income: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 2.25V8.75M5.25 6L8 8.75L10.75 6\"/><path d=\"M2.25 9.25V11.75C2.25 12.58 2.92 13.25 3.75 13.25H12.25C13.08 13.25 13.75 12.58 13.75 11.75V9.25\"/></g>\n</svg>",
		indent: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5H13V4.5H3ZM8 7.5H13V8.5H8ZM3 11.5H13V12.5H3Z\" fill=\"currentColor\"/>\n<path d=\"M3 6L5.75 8L3 10Z\" fill=\"currentColor\"/>\n</svg>",
		info: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"8\" cy=\"8\" r=\"6.5\" stroke=\"currentColor\"/>\n<path d=\"M8 7V11.5\" stroke=\"currentColor\"/>\n<circle cx=\"8\" cy=\"4.9\" r=\"0.75\" fill=\"currentColor\"/>\n</svg>",
		instagram: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4l0 -8\"/>\n<path d=\"M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0\"/>\n<path d=\"M16.5 7.5v.01\"/>\n</svg></svg>",
		italic: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.5 3.5H11M5 12.5H9.5M8.75 3.5L7.25 12.5\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		item: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M14.2427 5.6553V10.3447H1.75726V5.6553H14.2427ZM2.75726 9.34469H13.2427V6.6553H2.75726V9.34469Z\" fill=\"currentColor\"/>\n</svg>",
		jpbank: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<svg x=\"0.5\" y=\"0.5\" width=\"15\" height=\"15\" viewBox=\"3 -16 111 111\"><g transform=\"translate(0.749999,-0.749999)\"><path transform=\"translate(4.62665,-22.2754)\" d=\"M94.15 39.63 C93.45 44.48 89.6 46.68 82.85 46.68 L73.8 46.68 L76.8 32.18 L86.05 32.18 C92.9 32.18 94.7 35.63 94.15 39.63 Z M89.9 23.78 L65.45 23.78 L58.15 58.93 C55.65 71.08 47.9 74.28 38.55 74.28 C30.05 74.28 22 69.83 24.1 58.93 C24.55 56.58 24.7 55.68 25.1 53.68 L36.1 53.68 C35.9 54.73 35.5 56.48 34.95 58.93 C34.15 62.68 35.8 65.03 39.95 65.03 C44.15 65.03 46.25 62.78 47 58.93 L54.35 23.78 L28.65 23.78 C14.9 23.78 10.75 27.23 8.25 39.28 L0 78.88 L49.7 78.88 C61.9 78.88 68.55 71.83 70.35 63.38 C72 55.23 72 55.23 72 55.23 L84.15 55.23 C96.4 55.23 103.8 50.08 105.5 39.63 C107.15 29.88 100.1 23.78 89.9 23.78 Z\" fill=\"currentColor\"/><path d=\"M5.4 70.53 L6.8 70.53 C8.3 70.53 9.25 69.93 9.25 68.98 C9.2 67.83 8.3 67.68 6.95 67.68 L6 67.68 L5.4 70.53 Z M4.2 76.28 L5.2 76.28 C7.05 76.28 8.3 75.73 8.3 74.38 C8.3 73.18 7.4 72.98 5.75 72.98 L4.85 72.98 L4.2 76.28 Z M2.9 65.08 L9 65.08 C10.45 65.08 12.9 65.63 12.9 68.23 C12.9 70.08 11.45 71.48 9.3 71.73 L9.3 71.78 C10.9 71.98 11.95 72.93 11.95 74.43 C11.95 77.38 9.45 78.73 6.3 78.78 L0 78.88 L2.9 65.08 Z\" fill=\"currentColor\"/><path transform=\"translate(26.0208,1.7053E-013)\" d=\"M10.05 67.93 L10 67.93 L7.1 73.33 L10.65 73.33 L10.05 67.93 Z M8.2 65.08 L12.85 65.08 L15.1 78.88 L11.4 78.88 L11 75.93 L5.65 75.93 L4 78.88 L0 78.88 L8.2 65.08 Z\" fill=\"currentColor\"/><path transform=\"translate(56.6591,1.7053E-013)\" d=\"M2.95 65.08 L7.55 65.08 L10.4 74.63 L12.35 65.08 L15.85 65.08 L12.9 78.88 L8.35 78.88 L5.45 69.28 L5.4 69.28 L3.5 78.88 L0 78.88 L2.95 65.08 Z\" fill=\"currentColor\"/><path transform=\"translate(86.1482,1.7053E-013)\" d=\"M2.9 65.08 L6.6 65.08 L5.4 70.68 L5.45 70.68 L10.45 65.08 L15.2 65.08 L8.65 71.78 L12.75 78.88 L8.5 78.88 L5.05 72.58 L3.7 78.88 L0 78.88 L2.9 65.08 Z\" fill=\"currentColor\"/></g></svg>\n</svg>",
		key: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"5.5\" cy=\"10.5\" r=\"3\" stroke=\"currentColor\"/>\n<path d=\"M7.6 8.4L13.5 2.5M11.5 4.5L13 6M9.5 6.5L11 8\" stroke=\"currentColor\"/>\n</svg>",
		keyboard: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"1.75\" y=\"3.75\" width=\"12.5\" height=\"8.5\" rx=\"1.75\"/><path d=\"M4.25 6.25V6.26M6.75 6.25V6.26M9.25 6.25V6.26M11.75 6.25V6.26M4.25 8.25V8.26M6.75 8.25V8.26M9.25 8.25V8.26M11.75 8.25V8.26M5.5 10.25H10.5\"/></g>\n</svg>",
		life: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3.76595 12.3556L12.2336 12.3556V13.3529L4.76332 13.3529L3.76595 13.3529V12.3556Z\" fill=\"currentColor\"/>\n<path d=\"M4.76332 13.3529L3.76595 13.3529V7.16597L4.76329 7.16597L4.76332 13.3529Z\" fill=\"currentColor\"/>\n<path d=\"M12.2336 13.3529H11.2363L11.2363 7.16599L12.2336 7.16597V13.3529Z\" fill=\"currentColor\"/>\n<path d=\"M11.6251 6.4395H10.6278L10.6278 4.16374L11.6251 4.16372V6.4395Z\" fill=\"currentColor\"/>\n<path d=\"M7.99993 2.64708L13.4713 8.11835L12.7661 8.82358L7.2947 3.35231L7.99993 2.64708Z\" fill=\"currentColor\"/>\n<path d=\"M3.23393 8.82358L2.52869 8.11832L7.99993 2.64708L8.70517 3.3523L3.23393 8.82358Z\" fill=\"currentColor\"/>\n</svg>",
		like: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 7.5H5.5V13.5H2.5Z\" stroke=\"currentColor\"/>\n<path d=\"M5.5 7.5L8 2.5C9 2.5 9.5 3.2 9.5 4V6.5H13.5L12.5 13.5H5.5\" stroke=\"currentColor\"/>\n</svg>",
		link: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.25 4.75L9.5 3.5A2.12 2.12 0 0 1 12.5 6.5L11.25 7.75M7.75 11.25L6.5 12.5A2.12 2.12 0 0 1 3.5 9.5L4.75 8.25M6 10L10 6\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		linkedin: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 11v5\"/>\n<path d=\"M8 8v.01\"/>\n<path d=\"M12 16v-5\"/>\n<path d=\"M16 16v-3a2 2 0 1 0 -4 0\"/>\n<path d=\"M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4l0 -10\"/>\n</svg></svg>",
		linux: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg x=\"1\" y=\"1\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z\" fill=\"currentColor\"/></svg></svg>",
		"list-line": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M1.75726 7.5H14.2427V8.5H1.75726L1.75726 7.5Z\" fill=\"currentColor\"/>\n</svg>",
		"lock-filled": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8 2.60742C9.53669 2.60746 10.7822 3.85296 10.7822 5.38965V7.64746H11.5996V13.3926H4.40039V7.64746H5.21777V5.38965C5.21779 3.85295 6.4633 2.60744 8 2.60742ZM8 3.62695C7.02663 3.62697 6.23733 4.41628 6.2373 5.38965V7.64746H9.7627V5.38965C9.76267 4.41629 8.97336 3.62699 8 3.62695Z\" fill=\"currentColor\"/>\n</svg>",
		"logo-marquee": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M1.55328 6.54008V9.44363L5.79254 9.45996V6.54004L1.55328 6.54008Z\" fill=\"currentColor\"/>\n<path d=\"M11.5267 6.54008V9.44363L14.4467 9.45996V6.54004L11.5267 6.54008Z\" fill=\"currentColor\"/>\n<path d=\"M8.65968 6.54006C7.85564 6.54007 7.19971 7.19187 7.19971 7.9959C7.19971 8.79677 7.85068 9.44727 8.65153 9.45175C9.45875 9.45626 10.1197 8.80316 10.1197 7.99593C10.1197 7.19187 9.46374 6.54005 8.65968 6.54006Z\" fill=\"currentColor\"/>\n</svg>",
		loom: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M17.464 6.518a6 6 0 1 0 -3.023 7.965\"/>\n<path d=\"M17.482 17.464a6 6 0 1 0 -7.965 -3.023\"/>\n<path d=\"M6.54 17.482a6 6 0 1 0 3.024 -7.965\"/>\n<path d=\"M6.518 6.54a6 6 0 1 0 7.965 3.024\"/>\n</svg></svg>",
		map: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 4L6 2.5L10 4L13.5 2.5V12L10 13.5L6 12L2.5 13.5Z\" stroke=\"currentColor\"/>\n<path d=\"M6 2.5V12M10 4V13.5\" stroke=\"currentColor\"/>\n</svg>",
		material: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><g transform=\"translate(.5 .5)\" fill=\"currentColor\"><path d=\"M9.88685 7.12791e-05C12.6702 7.12791e-05 14.9258 2.25565 14.9258 5.03901C14.9224 6.86918 13.9271 8.55375 12.3267 9.43983C11.549 9.8701 10.6879 10.0794 9.82997 10.0698V8.29782C9.83339 8.02028 9.82656 7.74274 9.8095 7.46634C9.78789 7.12624 9.70144 6.7941 9.55243 6.48813C9.30788 6.00812 8.91887 5.61911 8.43886 5.37456C8.13289 5.22555 7.80075 5.1391 7.46065 5.11749C7.21042 5.09702 6.91694 5.09702 6.62803 5.09702H4.84905C4.83426 3.75027 5.35749 2.45471 6.30499 1.49697C7.25136 0.540364 8.5401 7.12791e-05 9.88685 7.12791e-05Z\"/><path d=\"M8.68879 13.0698C8.68879 13.7193 8.68879 14.0434 8.56253 14.2914C8.45106 14.5098 8.27361 14.6861 8.05636 14.7976C7.80839 14.9238 7.48422 14.9238 6.83587 14.9238L5.04999 14.9238L1.85381 14.9238C1.26264 14.9238 0.941191 14.9232 0.701243 14.8278C0.677571 14.8184 0.654693 14.8081 0.632426 14.7968C0.414035 14.6853 0.237729 14.5078 0.126258 14.2906C0.122649 14.2835 0.119142 14.2763 0.115736 14.2691C0.00195479 14.0241 0.00195472 13.7002 0.00195461 13.0709L0.000816365 8.09226C0.000816252 7.44277 0.000815717 7.1186 0.127073 6.87063C0.238544 6.65224 0.415988 6.47593 0.633242 6.36446C0.881208 6.23821 1.20538 6.23821 1.85373 6.23821L6.83587 6.2382C6.91691 6.2382 6.9929 6.2382 7.0643 6.23845C7.56408 6.24016 7.83939 6.25385 8.05636 6.36332C8.27516 6.47318 8.45268 6.65069 8.56253 6.86949C8.68765 7.11746 8.68765 7.44163 8.68765 8.09112L8.68879 13.0698Z\"/></g></svg>",
		medical: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2.25\" y=\"2.25\" width=\"11.5\" height=\"11.5\" rx=\"3\"/><path d=\"M8 5.25V10.75M5.25 8H10.75\"/></g>\n</svg>",
		mention: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"8\" cy=\"8\" r=\"2.4\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M10.4 8V9.4A1.3 1.3 0 0 0 13 9.4V8A5 5 0 1 0 11 12\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		menu: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.1 9.2V10.9998H11.3002V9.2H13.1ZM8.89978 9.2V10.9998H7.09998V9.2H8.89978ZM4.69958 9.2V10.9998H2.89978V9.2H4.69958ZM13.1 4.9998V6.79961H11.3002V4.9998H13.1ZM8.89978 4.9998V6.79961H7.09998V4.9998H8.89978ZM4.69958 4.9998V6.79961H2.89978V4.9998H4.69958Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"0.6\"/>\n</svg>",
		milestone: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 1.7 13.4 4.85v6.3L8 14.3l-5.4-3.15v-6.3Z\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/><path d=\"M8 4.4v7.2l-3.1-1.8V6.2Z\" fill=\"currentColor\"/>\n</svg>",
		"milestone-planned": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 1.7 13.4 4.85v6.3L8 14.3l-5.4-3.15v-6.3Z\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>\n</svg>",
		minimize: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.20203 14.0654V8.21172H14.0465L14.0557 9.20887H9.91936L14.0789 13.3608L13.3587 14.0809L9.19919 9.92904L9.20842 14.0654H8.20203Z\" fill=\"currentColor\"/>\n<path d=\"M7.77478 1.93962V7.79332H1.93032L1.92109 6.79616H6.05745L1.92109 2.63922L2.64126 1.91905L6.77762 6.07599L6.76839 1.93962H7.77478Z\" fill=\"currentColor\"/>\n</svg>",
		"minimize-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.48453 12.3614V6.50768H14.329L14.3382 7.50484H10.2019L14.3614 11.6568L13.6412 12.3769L9.48169 8.22501L9.49092 12.3614H8.48453Z\" fill=\"currentColor\"/>\n<path d=\"M7.49224 5.62024H5.22906H4.57001H1.64778L1.63855 3.62308H5.77491H7.49224V5.62024Z\" fill=\"currentColor\"/>\n</svg>",
		minus: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.3334 7.5V8.5H2.66663V7.5H13.3334Z\" fill=\"currentColor\"/>\n</svg>",
		money: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M1.5 4H14.5V12H1.5V4ZM2.5 5V11H13.5V5H2.5Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8 5.75C6.7574 5.75 5.75 6.7574 5.75 8C5.75 9.2426 6.7574 10.25 8 10.25C9.2426 10.25 10.25 9.2426 10.25 8C10.25 6.7574 9.2426 5.75 8 5.75ZM6.75 8C6.75 7.3096 7.3096 6.75 8 6.75C8.6904 6.75 9.25 7.3096 9.25 8C9.25 8.6904 8.6904 9.25 8 9.25C7.3096 9.25 6.75 8.6904 6.75 8Z\" fill=\"currentColor\"/>\n<path d=\"M3.5 7.5H4.5V8.5H3.5V7.5Z\" fill=\"currentColor\"/>\n<path d=\"M11.5 7.5H12.5V8.5H11.5V7.5Z\" fill=\"currentColor\"/>\n</svg>",
		moon: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7.5 2.25A4.5 4.5 0 0 0 13.75 8.5A5.75 5.75 0 1 1 7.5 2.25Z\"/></g>\n</svg>",
		move: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 1.75V14.25M1.75 8H14.25M5.5 4.25L8 1.75L10.5 4.25M5.5 11.75L8 14.25L10.5 11.75M4.25 5.5L1.75 8L4.25 10.5M11.75 5.5L14.25 8L11.75 10.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		music: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.5 11.5V3.5L12.5 2.5V10.5\" stroke=\"currentColor\"/>\n<circle cx=\"5\" cy=\"11.5\" r=\"1.5\" stroke=\"currentColor\"/>\n<circle cx=\"11\" cy=\"10.5\" r=\"1.5\" stroke=\"currentColor\"/>\n</svg>",
		"music-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 12V3.5L13 2.25V10.75\"/><circle cx=\"4.25\" cy=\"12\" r=\"1.75\"/><circle cx=\"11.25\" cy=\"10.75\" r=\"1.75\"/></g>\n</svg>",
		"navigation-check": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" fill=\"none\"><rect width=\"16\" height=\"16\" fill=\"#9CFF6D\"></rect><path d=\"M6.68633 11.884L12.4429 6.13606L11.7358 5.4272L6.68818 10.4827L4.26382 8.05014L3.55679 8.7453L6.68633 11.884Z\" fill=\"#1E1E1E\"></path></svg>",
		network: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"m5 4 6 3M5 12l6-3M4 5.5v5\" stroke=\"currentColor\" stroke-width=\".92\"/><circle cx=\"4\" cy=\"3.5\" r=\"2\" stroke=\"currentColor\" stroke-width=\".92\"/><circle cx=\"12\" cy=\"8\" r=\"2\" stroke=\"currentColor\" stroke-width=\".92\"/><circle cx=\"4\" cy=\"12.5\" r=\"2\" stroke=\"currentColor\" stroke-width=\".92\"/>\n</svg>",
		"note-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.9653 4L13.9307 12.6865H2L2.03467 4H13.9653ZM3 11.6865H12.9307L12.9653 5H3.03467L3 11.6865Z\" fill=\"currentColor\"/>\n<path d=\"M11.5 6.18652V8.10645H4.26074V6.18652H11.5Z\" fill=\"currentColor\"/>\n</svg>",
		"note-alt-2": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.9653 3.31348V12.6865H2.03467V3.31348H13.9653ZM3.03467 11.6865H12.9653V4.31348H3.03467V11.6865Z\" fill=\"currentColor\"/>\n<path d=\"M9.57953 9.50004V10.42H7.28656V9.50004H9.57953ZM11.5258 7.50004V8.41996H7.28656V7.50004H11.5258Z\" fill=\"currentColor\"/>\n<path d=\"M6.4527 10.4199V7.5L4 7.50004V10.42L6.4527 10.4199Z\" fill=\"currentColor\"/>\n<path d=\"M12.2393 6.41992V5.5H4V6.41992H12.2393Z\" fill=\"currentColor\"/>\n</svg>",
		"note-lines": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M1.75727 5.5H14.2427V6.5H1.75726L1.75727 5.5Z\" fill=\"currentColor\"/>\n<path d=\"M1.75726 7.5H14.2427V8.5H1.75726L1.75726 7.5Z\" fill=\"currentColor\"/>\n<path d=\"M1.75726 9.5H8.13658V10.5H1.75726L1.75726 9.5Z\" fill=\"currentColor\"/>\n<path d=\"M1.75726 7.5H14.2427V8.5H1.75726L1.75726 7.5Z\" fill=\"currentColor\"/>\n</svg>",
		notifications: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.5 11.5V7.5C4.5 5.567 6.067 4 8 4C9.933 4 11.5 5.567 11.5 7.5V11.5M3 11.5H13M8 2.5V4M6.5 13.5H9.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		notion: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M11 17.5v-6.5h.5l4 6h.5v-6.5\"/>\n<path d=\"M19.077 20.071l-11.53 .887a1 1 0 0 1 -.876 -.397l-2.471 -3.294a1 1 0 0 1 -.2 -.6v-10.741a1 1 0 0 1 .923 -.997l11.389 -.876a2 2 0 0 1 1.262 .33l1.535 1.023a2 2 0 0 1 .891 1.664v12.004a1 1 0 0 1 -.923 .997\"/>\n<path d=\"M4.5 5.5l2.5 2.5\"/>\n<path d=\"M20 7l-13 1v12.5\"/>\n</svg></svg>",
		numbered: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 4.5L3.9 3.25V7M2.6 9.75A1.3 1.3 0 1 1 4.9 10.6L2.6 12.9H5.3\" stroke=\"currentColor\" stroke-width=\"1\"/>\n<path d=\"M7 4.5H13V5.5H7ZM7 10.5H13V11.5H7Z\" fill=\"currentColor\"/>\n</svg>",
		offline: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1.75 6.25C2.15 5.9 2.58 5.59 3.03 5.33M6.42 4.12C9.17 3.69 12.12 4.4 14.25 6.25M3.75 8.5C4.22 8.12 4.73 7.81 5.27 7.57M9.45 7.15C10.45 7.37 11.42 7.82 12.25 8.5M5.75 10.75C6.32 10.31 7.01 10.06 7.72 10.01\"/><path d=\"M8 12.99V13\"/><path d=\"M2.25 2.25L13.75 13.75\"/></g>\n</svg>",
		"open-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M1.96002 7.81289V1.9592H7.80799L7.81723 2.95636H3.67838L13.0423 12.3235L13.033 8.18711H14.04V14.0408H8.19205L8.18282 13.0436H12.3217L2.95778 3.67653L2.96702 7.81289H1.96002Z\" fill=\"currentColor\"/>\n</svg>",
		"open-source": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M2.75 3.5A1.75 1.75 0 1 0 6.25 3.5A1.75 1.75 0 1 0 2.75 3.5ZM3.75 3.5A0.75 0.75 0 1 1 5.25 3.5A0.75 0.75 0 1 1 3.75 3.5ZM9.75 3.5A1.75 1.75 0 1 0 13.25 3.5A1.75 1.75 0 1 0 9.75 3.5ZM10.75 3.5A0.75 0.75 0 1 1 12.25 3.5A0.75 0.75 0 1 1 10.75 3.5ZM6.25 12.5A1.75 1.75 0 1 0 9.75 12.5A1.75 1.75 0 1 0 6.25 12.5ZM7.25 12.5A0.75 0.75 0 1 1 8.75 12.5A0.75 0.75 0 1 1 7.25 12.5ZM4 5.25H5V8.5H4ZM11 5.25H12V8.5H11ZM4 7.5H12V8.5H4ZM7.5 8.5H8.5V10.75H7.5Z\" fill=\"#1E1E1E\"/>\n</svg>",
		opera: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0\"/>\n<path d=\"M9 12a3 5 0 1 0 6 0a3 5 0 1 0 -6 0\"/>\n</svg></svg>",
		outdent: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5H13V4.5H3ZM8 7.5H13V8.5H8ZM3 11.5H13V12.5H3Z\" fill=\"currentColor\"/>\n<path d=\"M5.75 6L3 8L5.75 10Z\" fill=\"currentColor\"/>\n</svg>",
		page: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.9956 1.70508V14.2949H3.00439V1.70508H12.9956ZM3.92432 13.375H12.0757V2.625H3.92432V13.375ZM7.87842 7.85742V8.77734H5.12939V7.85742H7.87842ZM10.0259 5.92578V6.8457H5.12939V5.92578H10.0259ZM10.0259 3.99316V4.91406H5.12939V3.99316H10.0259Z\" fill=\"currentColor\"/>\n</svg>",
		"page-18": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3.00415 14.2949L3.00415 1.70502L12.9954 1.70502L12.9954 14.2949L3.00415 14.2949ZM12.0754 2.62494L3.92407 2.62494L3.92407 13.3749L12.0754 13.3749L12.0754 7.99994L12.0754 2.62494Z\" fill=\"currentColor\"/>\n</svg>",
		"page-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.9956 1.70508V14.2949H3.00439V1.70508H12.9956ZM3.92432 13.375H12.0757V2.625H3.92432V8V13.375ZM7.87842 7.85742V8.77734H5.12939V7.85742H7.87842ZM10.0259 5.92578V6.8457H5.12939V5.92578H10.0259ZM10.0259 3.99316V4.91406H5.12939V3.99316H10.0259Z\" fill=\"currentColor\"/>\n</svg>",
		"page-note": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\" fill=\"none\"><path d=\"M55.8613 13.2539V50.7461H8.13867V13.2539H55.8613ZM12.1387 46.7461H51.8613V17.2539H12.1387V46.7461Z\" fill=\"#554455\"></path><path d=\"M38.3181 38.0002V41.6798H29.1462V38.0002H38.3181ZM46.1033 30.0002V33.6798H29.1462V30.0002H46.1033Z\" fill=\"#554455\"></path><path d=\"M25.8108 41.6797V30L16 30.0002V41.6798L25.8108 41.6797Z\" fill=\"#554455\"></path><path d=\"M48.957 25.6797V22H16V25.6797H48.957Z\" fill=\"#554455\"></path></svg>",
		panel: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\">\n  <path d=\"M13.9653 3.31348V12.6865H2.03467V3.31348H13.9653ZM3.03467 11.6865H12.9653V4.31348H3.03467V11.6865Z\" fill=\"currentColor\"/>\n  <path d=\"M12.9653 9.94276V8.94276H3.03467V9.94276H12.9653Z\" fill=\"currentColor\"/>\n</svg>",
		"password-see": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"16\" height=\"16\" viewBox=\"0 0 14.0059 8.5918\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Group 90\">\n<path id=\"Vector (Stroke)\" d=\"M7.08496 1.43051e-06C9.10892 1.43051e-06 10.8032 1.03732 11.9648 2.02832C12.5501 2.52762 13.0133 3.02575 13.3301 3.39942C13.4887 3.58653 13.6115 3.74347 13.6953 3.85449C13.7372 3.90995 13.7698 3.95445 13.792 3.98535C13.8029 4.00061 13.8114 4.01295 13.8174 4.02149C13.8202 4.02555 13.8225 4.02881 13.8242 4.03125C13.8249 4.03228 13.8257 4.03346 13.8262 4.03418L13.8271 4.03516C13.8273 4.03531 13.8278 4.03638 13.4492 4.2959L13.8271 4.55567L13.8262 4.55664C13.8256 4.55744 13.8251 4.55929 13.8242 4.56055C13.8225 4.563 13.8202 4.56626 13.8174 4.57031C13.8114 4.57887 13.803 4.59115 13.792 4.60645C13.7698 4.63736 13.7372 4.68181 13.6953 4.73731C13.6115 4.84834 13.4887 5.00525 13.3301 5.19238C13.0133 5.56604 12.5501 6.06419 11.9648 6.56348C10.8032 7.55446 9.10889 8.5918 7.08496 8.5918C5.06326 8.5918 3.33153 7.55649 2.13379 6.56836C1.53011 6.07032 1.04876 5.57301 0.717773 5.2002C0.55201 5.01348 0.422971 4.85678 0.334961 4.7461C0.291015 4.69082 0.2567 4.64695 0.233398 4.61621C0.221828 4.60095 0.213338 4.58859 0.207031 4.58008C0.203926 4.57589 0.201023 4.57277 0.199219 4.57031C0.198435 4.56924 0.197795 4.56811 0.197266 4.56738L0.196289 4.56641V4.56543L0 4.2959L0.196289 4.02637V4.02539L0.197266 4.02442C0.197805 4.02368 0.198405 4.0226 0.199219 4.02149C0.201027 4.01902 0.203896 4.01595 0.207031 4.01172C0.21333 4.00322 0.221826 3.99086 0.233398 3.97559C0.256689 3.94486 0.291044 3.90094 0.334961 3.8457C0.422971 3.73501 0.55201 3.57832 0.717773 3.3916C1.04875 3.0188 1.5301 2.52149 2.13379 2.02344C3.33153 1.03531 5.06326 3.87222e-06 7.08496 1.43051e-06ZM7.08496 0.91797C5.37308 0.917973 3.84542 1.80115 2.71777 2.73145C2.15914 3.19234 1.71191 3.65449 1.4043 4.00098C1.30562 4.11212 1.22362 4.21306 1.15527 4.2959C1.22361 4.37872 1.30565 4.47971 1.4043 4.59082C1.71192 4.93731 2.15914 5.39947 2.71777 5.86035C3.84542 6.79065 5.37308 7.67383 7.08496 7.67383C8.79447 7.67383 10.2821 6.7926 11.3691 5.86524C11.9082 5.40533 12.3368 4.94438 12.6299 4.59863C12.7272 4.48383 12.807 4.38024 12.873 4.2959C12.807 4.21156 12.7272 4.10798 12.6299 3.99317C12.3368 3.64742 11.9082 3.18647 11.3691 2.72656C10.2821 1.79918 8.79451 0.91797 7.08496 0.91797ZM14.0059 4.2959L13.8281 4.55567L13.4492 4.2959L13.8281 4.03613L14.0059 4.2959Z\" fill=\"currentColor\"/>\n<path id=\"Ellipse 40\" d=\"M7.16119 1.9635C8.44936 1.9635 9.49404 3.00741 9.4942 4.29554C9.4942 5.5838 8.44946 6.62854 7.16119 6.62854C5.87307 6.62838 4.82916 5.5837 4.82916 4.29554C4.82933 3.00751 5.87317 1.96367 7.16119 1.9635Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"0.81\"/>\n</g>\n</svg></svg>",
		"password-unsee": "<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Unsee\">\n<g id=\"Vector\">\n<path d=\"M12.4541 12.789L13.1743 12.0688L12.6027 11.4967L12.6 11.4994L12.0137 10.9144C11.7332 11.103 11.4336 11.283 11.1164 11.4457L11.4068 11.7363L11.4046 11.7385L12.4541 12.789Z\" fill=\"currentColor\"/>\n<path d=\"M5.96371 6.28858L9.79315 10.1213C10.0642 9.91923 10.2966 9.66817 10.4772 9.38122L6.69735 5.60959C6.41317 5.78931 6.16435 6.01991 5.96371 6.28858Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M3.68238 4.00893L3.09583 3.42184L3.79957 2.7181L3.816 2.70167L5.35651 4.24363L6.05746 4.94524L6.712 5.6004L10.4818 9.3738L11.3559 10.2487L12.0181 10.9115L12.6027 11.4967L12.6 11.4994L12.0137 10.9144C11.7332 11.103 11.4336 11.283 11.1164 11.4457L11.4068 11.7363L11.4046 11.7385L11.1136 11.4472L10.4275 10.7604L9.79075 10.1231L5.96207 6.29078L5.08276 5.41064L4.4124 4.73965L3.68238 4.00893ZM12.6382 10.4584C12.7502 10.37 12.8582 10.2812 12.9619 10.1927C13.5472 9.69339 14.0104 9.19525 14.3271 8.82159C14.4858 8.63445 14.6085 8.47754 14.6924 8.36651C14.7343 8.31101 14.7669 8.26656 14.7891 8.23565L14.7965 8.22527L14.8089 8.20741L14.8145 8.19952L14.8213 8.18975C14.8218 8.18905 14.8222 8.18816 14.8225 8.18737L14.8232 8.18584L14.8242 8.18487L15.0029 7.9251L14.8252 7.66534L14.4463 7.9251C14.8248 7.66558 14.8243 7.66451 14.8242 7.66436L14.8232 7.66338L14.8213 7.66045L14.8145 7.65069C14.8085 7.64215 14.8 7.62981 14.7891 7.61456C14.7669 7.58365 14.7343 7.53915 14.6924 7.4837C14.6085 7.37267 14.4858 7.21573 14.3271 7.02862C14.0104 6.65495 13.5472 6.15683 12.9619 5.65752C11.8003 4.66653 10.106 3.6292 8.08203 3.6292C7.38933 3.6292 6.73067 3.75075 6.11587 3.95029L6.86093 4.69373C7.25481 4.60012 7.6629 4.54717 8.08203 4.54717C9.79158 4.54717 11.2792 5.42838 12.3662 6.35577C12.9053 6.81568 13.3338 7.27662 13.627 7.62237C13.7119 7.72259 13.7835 7.81426 13.8443 7.89203L13.8701 7.9251L13.8442 7.95828C13.7834 8.03604 13.7119 8.12766 13.627 8.22784C13.3338 8.57358 12.9053 9.03453 12.3662 9.49444C12.2436 9.599 12.116 9.70298 11.9835 9.80517L12.6382 10.4584ZM5.58478 6.99004L9.09135 10.4996C8.80023 10.6051 8.48611 10.6626 8.15857 10.6626C6.64663 10.6626 5.42096 9.43698 5.42096 7.92504C5.42096 7.59666 5.47878 7.28179 5.58478 6.99004ZM10.371 11.7804L9.65051 11.0593C9.15436 11.2126 8.62958 11.303 8.08203 11.303C6.37015 11.303 4.84249 10.4199 3.71484 9.48956C3.15622 9.02867 2.70899 8.56651 2.40137 8.22002C2.31556 8.12337 2.24231 8.03438 2.17972 7.95834L2.15234 7.9251L2.17972 7.89186C2.24231 7.81582 2.31553 7.72686 2.40137 7.63018C2.70898 7.2837 3.15621 6.82154 3.71484 6.36065C3.93564 6.17849 4.17177 5.99815 4.42162 5.82588L3.76309 5.16679C3.53867 5.32681 3.32756 5.49036 3.13086 5.65264C2.52717 6.15069 2.04582 6.648 1.71484 7.02081C1.54908 7.20752 1.42004 7.36422 1.33203 7.47491C1.28811 7.53015 1.25376 7.57406 1.23047 7.60479C1.22314 7.61446 1.21704 7.62297 1.21196 7.63006L1.2041 7.64092C1.20236 7.64328 1.20069 7.64527 1.19925 7.647L1.19629 7.65069L1.19434 7.65362L1.19336 7.65557L0.99707 7.9251L1.19336 8.19561L1.19434 8.19659L1.19629 8.19952L1.19926 8.20322C1.20071 8.20496 1.20238 8.20695 1.2041 8.20928L1.21195 8.22013C1.21704 8.22723 1.22314 8.23575 1.23047 8.24541C1.25377 8.27615 1.28809 8.32002 1.33203 8.3753C1.42004 8.48599 1.54908 8.64268 1.71484 8.8294C2.04583 9.20221 2.52718 9.69952 3.13086 10.1976C4.3286 11.1857 6.06033 12.221 8.08203 12.221C8.90391 12.221 9.67144 12.0499 10.371 11.7804ZM10.8048 8.62904C10.8644 8.40441 10.8962 8.16843 10.8962 7.92504C10.8962 6.4131 9.6705 5.18743 8.15857 5.18743C7.91309 5.18743 7.67517 5.21974 7.44881 5.28034L10.8048 8.62904ZM9.79315 10.1213L5.96371 6.28858C6.16435 6.01991 6.41317 5.78931 6.69735 5.60959L10.4772 9.38122C10.2966 9.66817 10.0642 9.91923 9.79315 10.1213Z\" fill=\"currentColor\"/>\n</g>\n</g>\n</svg>",
		"pattern-call-to-action": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#3287EE\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><path d=\"M13.0861 5.11395L17.25 9.25312L13.0926 13.3858L12.3767 12.6872L15.3191 9.76235L9.52035 9.75339L9.52035 8.73492L15.3191 8.74388L12.3702 5.82558L13.0861 5.11395Z\" fill=\"#1E1E1E\"></path><path d=\"M4.9163 13.386L9.08026 9.24686L4.92287 5.1142L4.20699 5.81277L7.14934 8.73762L1.25 8.75217L1.25 9.77064L7.14934 9.7561L4.20042 12.6744L4.9163 13.386Z\" fill=\"#1E1E1E\"></path></svg>",
		"pattern-card": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#E6E5B2\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><g transform=\"translate(3.25, 4.25)\"><path d=\"M11.9307 0V9.37305H0V0H11.9307ZM1 8.37305H10.9307V1H1V8.37305Z\" fill=\"#554455\"></path><path d=\"M7.54486 6.18656V7.10648H5.25189V6.18656H7.54486ZM9.49115 4.18656V5.10648H5.25189V4.18656H9.49115Z\" fill=\"#554455\"></path><path d=\"M4.41803 7.10645V4.18652L1.96533 4.18656V7.10648L4.41803 7.10645Z\" fill=\"#554455\"></path><path d=\"M10.2046 3.10645V2.18652H1.96533V3.10645H10.2046Z\" fill=\"#554455\"></path></g></svg>",
		"pattern-feature": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#FFAECB\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><g transform=\"translate(3.25, 4.75)\"><path d=\"M11.9653 0L11.9307 8.68652H0L0.034668 0H11.9653ZM1 7.68652H10.9307L10.9653 1H1.03467L1 7.68652Z\" fill=\"#554455\"></path><path d=\"M9.5 2.18652V4.10645H5.26074V2.18652H9.5Z\" fill=\"#554455\"></path><path d=\"M4.22007 3.13416C4.22007 3.67114 3.78476 4.10645 3.24778 4.10645C2.7108 4.10645 2.27549 3.67114 2.27549 3.13416C2.27549 2.59717 2.7108 2.16187 3.24778 2.16187C3.78476 2.16187 4.22007 2.59717 4.22007 3.13416Z\" fill=\"#554455\"></path></g></svg>",
		"pattern-hero": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18.5 18.5\" fill=\"none\"><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" fill=\"#EAFF00\"></rect><rect x=\"0.25\" y=\"0.25\" width=\"18\" height=\"18\" stroke=\"#9D9D9D\" stroke-width=\"0.5\"></rect><g transform=\"translate(3.25, 4.75)\"><path d=\"M11.9653 0L11.9307 8.68652H0L0.034668 0H11.9653ZM1 7.68652H10.9307L10.9653 1H1.03467L1 7.68652Z\" fill=\"#554455\"></path><path d=\"M9.63159 3.35655V5.27647H2.39233V3.35655H9.63159Z\" fill=\"#554455\"></path></g></svg>",
		pause: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.5 3.0365H6.75V12.9635H4.5V3.0365Z\" fill=\"currentColor\"/>\n<path d=\"M9.25 3.0365H11.5V12.9635H9.25V3.0365Z\" fill=\"currentColor\"/>\n</svg>",
		paw: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 8.75C6.25 8.75 4.5 10.5 4.5 12C4.5 13 5.25 13.5 6 13.5C6.75 13.5 7.25 13 8 13C8.75 13 9.25 13.5 10 13.5C10.75 13.5 11.5 13 11.5 12C11.5 10.5 9.75 8.75 8 8.75Z\"/><ellipse cx=\"6.25\" cy=\"4.5\" rx=\"1.25\" ry=\"1.75\"/><ellipse cx=\"9.75\" cy=\"4.5\" rx=\"1.25\" ry=\"1.75\"/><ellipse cx=\"3.5\" cy=\"7.5\" rx=\"1.1\" ry=\"1.5\"/><ellipse cx=\"12.5\" cy=\"7.5\" rx=\"1.1\" ry=\"1.5\"/></g>\n</svg>",
		pdf: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3.46 8V2.16H12.54V8M5.13 4.45H10.03M5.13 6.39H8M1.96 14.46V10H3.6A1.2 1.2 0 0 1 3.6 12.4H1.96M6.66 10H7.96A2 2 0 0 1 9.96 12A2 2 0 0 1 7.96 14H6.66ZM14.5 10H11.66V14.46M11.66 12.2H13.8\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		people: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"6\" cy=\"5.5\" r=\"2\" stroke=\"currentColor\"/>\n<path d=\"M2.5 13.5V12C2.5 10.3 3.8 9 5.5 9H6.5C8.2 9 9.5 10.3 9.5 12V13.5\" stroke=\"currentColor\"/>\n<path d=\"M10 3.6C10.9 3.8 11.5 4.6 11.5 5.5C11.5 6.4 10.9 7.2 10 7.4M11 9C12.4 9.2 13.5 10.4 13.5 12V13.5\" stroke=\"currentColor\"/>\n</svg>",
		percent: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12.25 3.75L3.75 12.25\"/><circle cx=\"4.75\" cy=\"4.75\" r=\"1.5\"/><circle cx=\"11.25\" cy=\"11.25\" r=\"1.5\"/></g>\n</svg>",
		phone: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4.25\" y=\"1.75\" width=\"7.5\" height=\"12.5\" rx=\"1.75\"/><path d=\"M7 12H9\"/></g>\n</svg>",
		pill: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"1.5\" y=\"5.5\" width=\"13\" height=\"5\" rx=\"2.5\" transform=\"rotate(-45 8 8)\"/><path d=\"M5.7 5.7L10.3 10.3\"/></g>\n</svg>",
		plane: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2C13.25 1.25 12.1 1.6 11.35 2.35L9.25 4.45L3.5 2.75L2.25 4L6.75 6.95L4.75 8.95L2.75 8.5L2 9.25L4.5 11.5L6.75 14L7.5 13.25L7.05 11.25L9.05 9.25L12 13.75L13.25 12.5L11.55 6.75L13.65 4.65C14.4 3.9 14.75 2.75 14 2Z\"/></g>\n</svg>",
		"play-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.5493 11.8382L11.5 7.99969L7.54951 4.16198L6.42402 3.0365H4.5V12.9635H6.42402L7.5493 11.8382Z\" fill=\"currentColor\"/>\n</svg>",
		postal: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2.25\" y=\"2.25\" width=\"11.5\" height=\"11.5\" rx=\"3\"/><path d=\"M5 5H11M5 7.25H11M8 7.25V11.25\"/></g>\n</svg>",
		prediction: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"8\" cy=\"2.5\" r=\"1.6\" fill=\"currentColor\"/><circle cx=\"2.5\" cy=\"8\" r=\"1.6\" fill=\"currentColor\"/><circle cx=\"8\" cy=\"8\" r=\"1.6\" fill=\"currentColor\" opacity=\".5\"/><circle cx=\"13.5\" cy=\"8\" r=\"1.6\" fill=\"currentColor\"/><circle cx=\"8\" cy=\"13.5\" r=\"1.6\" fill=\"currentColor\"/>\n</svg>",
		present: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2 3.5H14M3.5 3.5V10.5H12.5V3.5M8 10.5V12.5M5.5 13.5L8 12.5L10.5 13.5\" stroke=\"currentColor\"/>\n<path d=\"M5.5 8.5L7 7L8.5 8L10.5 6\" stroke=\"currentColor\"/>\n</svg>",
		"priority-high": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"2.0\" y=\"9\" width=\"3\" height=\"5\" rx=\".5\" fill=\"currentColor\"/><rect x=\"6.5\" y=\"6\" width=\"3\" height=\"8\" rx=\".5\" fill=\"currentColor\"/><rect x=\"11.0\" y=\"3\" width=\"3\" height=\"11\" rx=\".5\" fill=\"currentColor\"/>\n</svg>",
		"priority-low": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"2.0\" y=\"9\" width=\"3\" height=\"5\" rx=\".5\" fill=\"currentColor\"/><rect x=\"6.5\" y=\"6\" width=\"3\" height=\"8\" rx=\".5\" fill=\"currentColor\" opacity=\".25\"/><rect x=\"11.0\" y=\"3\" width=\"3\" height=\"11\" rx=\".5\" fill=\"currentColor\" opacity=\".25\"/>\n</svg>",
		"priority-medium": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"2.0\" y=\"9\" width=\"3\" height=\"5\" rx=\".5\" fill=\"currentColor\"/><rect x=\"6.5\" y=\"6\" width=\"3\" height=\"8\" rx=\".5\" fill=\"currentColor\"/><rect x=\"11.0\" y=\"3\" width=\"3\" height=\"11\" rx=\".5\" fill=\"currentColor\" opacity=\".25\"/>\n</svg>",
		project: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.1 12.8a6 6 0 1 1 7.8 0M5.4 13.5 8 7l2.6 6.5\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</svg>",
		quote: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 3.5H4V12.5H3ZM6.5 5H13V6H6.5ZM6.5 7.5H13V8.5H6.5ZM6.5 10H11V11H6.5Z\" fill=\"currentColor\"/>\n</svg>",
		reaction: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"7\" cy=\"9\" r=\"5\" stroke=\"currentColor\"/>\n<path d=\"M5 10.5C5.5 11.3 6.2 11.7 7 11.7C7.8 11.7 8.5 11.3 9 10.5M5.5 7.5V8.5M8.5 7.5V8.5\" stroke=\"currentColor\"/>\n<path d=\"M13 1.5V5.5M11 3.5H15\" stroke=\"currentColor\"/>\n</svg>",
		receipt: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.75 2.25H12.25V13.75L10.83 12.75L9.42 13.75L8 12.75L6.58 13.75L5.17 12.75L3.75 13.75Z\"/><path d=\"M6 5.25H10M6 7.75H10M6 10.25H8.25\"/></g>\n</svg>",
		redo: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 10\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M11 4L8 1M11 4L8 7M11 4H4C2.34315 4 1 5.34315 1 7V9\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>\n</svg></svg>",
		refresh: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M11.29 11.79A5 5 0 1 1 11.29 4.71L12.17 5.6M9.17 5.6H12.17V2.6\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		refund: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.5 3.25L2.75 6L5.5 8.75\"/><path d=\"M2.75 6H9.75C11.82 6 13.5 7.68 13.5 9.75C13.5 11.82 11.82 13.5 9.75 13.5H6.5\"/></g>\n</svg>",
		relationships: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2 6H6V10H2V6ZM10 2H14V6H10V2ZM10 10H14V14H10V10ZM6 7.5H7.5V3.5H10V4.5H8.5V7.5V8.5V11.5H10V12.5H7.5V8.5H6V7.5Z\" fill=\"#1E1E1E\"/>\n</svg>",
		repeat: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11 2.25L13 4.25L11 6.25\"/><path d=\"M3 7.75V6.75C3 5.37 4.12 4.25 5.5 4.25H13\"/><path d=\"M5 13.75L3 11.75L5 9.75\"/><path d=\"M13 8.25V9.25C13 10.63 11.88 11.75 10.5 11.75H3\"/></g>\n</svg>",
		"repeat-small": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10.5 2L13 4.5L10.5 7\"/><path d=\"M3 8V7C3 5.62 4.12 4.5 5.5 4.5H12.5\"/><path d=\"M5.5 14L3 11.5L5.5 9\"/><path d=\"M13 8V9C13 10.38 11.88 11.5 10.5 11.5H3.5\"/></g>\n</svg>",
		rewind: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.0098 8.4352C12.0098 6.22054 10.2147 4.42544 8 4.42544V5.44497C9.65133 5.44497 10.9902 6.78387 10.9902 8.4352C10.9902 10.0865 9.65133 11.4254 8 11.4254C6.34867 11.4254 5.00977 10.0865 5.00977 8.4352H3.99023C3.99023 10.6499 5.78534 12.445 8 12.445C10.2147 12.445 12.0098 10.6499 12.0098 8.4352Z\" fill=\"currentColor\"/>\n<path d=\"M10.8353 5.59987C9.26933 4.03387 6.73067 4.03387 5.16467 5.59987L5.88559 6.32079C7.05325 5.15312 8.94675 5.15312 10.1144 6.32079C11.2821 7.48845 11.2821 9.38195 10.1144 10.5496C8.94675 11.7173 7.05325 11.7173 5.88559 10.5496L5.16467 11.2705C6.73067 12.8365 9.26933 12.8365 10.8353 11.2705C12.4013 9.70453 12.4013 7.16587 10.8353 5.59987Z\" fill=\"currentColor\"/>\n<path d=\"M5.15847 5.59315L5.8743 6.30846H7.93002V7.29888H4.16732V3.53894H5.16306L5.15847 5.59315Z\" fill=\"currentColor\"/>\n</svg>",
		"rewind-30": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12.0098 8.4352C12.0098 6.22054 10.2147 4.42544 8 4.42544V5.44497C9.65133 5.44497 10.9902 6.78387 10.9902 8.4352C10.9902 10.0865 9.65133 11.4254 8 11.4254C6.34867 11.4254 5.00977 10.0865 5.00977 8.4352H3.99023C3.99023 10.6499 5.78534 12.445 8 12.445C10.2147 12.445 12.0098 10.6499 12.0098 8.4352Z\" fill=\"currentColor\"/>\n<path d=\"M10.8353 5.59987C9.26933 4.03387 6.73067 4.03387 5.16467 5.59987L5.88559 6.32079C7.05325 5.15312 8.94675 5.15312 10.1144 6.32079C11.2821 7.48845 11.2821 9.38195 10.1144 10.5496C8.94675 11.7173 7.05325 11.7173 5.88559 10.5496L5.16467 11.2705C6.73067 12.8365 9.26933 12.8365 10.8353 11.2705C12.4013 9.70453 12.4013 7.16587 10.8353 5.59987Z\" fill=\"currentColor\"/>\n<path d=\"M5.15847 5.59315L5.8743 6.30846H7.93002V7.29888H4.16732V3.53894H5.16306L5.15847 5.59315Z\" fill=\"currentColor\"/>\n</svg>",
		"rewind-30-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"8.00001\" cy=\"8\" r=\"4.29333\" stroke=\"currentColor\" stroke-width=\"1.01333\"/>\n<path d=\"M8 5.23447V7.99842L9.61733 8.93218\" stroke=\"currentColor\" stroke-width=\"1.01333\"/>\n</svg>",
		rotate: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"2.25\" y=\"6.75\" width=\"6.5\" height=\"6.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M3.62 4.77A5.75 5.75 0 0 1 12.25 9.75V10.75M10.25 8.75L12.25 10.75L14.25 8.75\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		row: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3.87698 4.67614L8.01617 0.536957L12.1488 4.66961L11.4503 5.38124L8.5254 2.45639L8.49306 13.5436L11.4114 10.6122L12.123 11.3239L7.98382 15.463L3.85117 11.3304L4.54974 10.6188L7.47459 13.5436L7.50693 2.45639L4.58861 5.38777L3.87698 4.67614Z\" fill=\"currentColor\"/>\n</svg>",
		safari: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 16l2 -6l6 -2l-2 6l-6 2\"/>\n<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0\"/>\n</svg></svg>",
		safe: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2.25\" y=\"2.25\" width=\"11.5\" height=\"10.5\" rx=\"2\"/><circle cx=\"8\" cy=\"7.5\" r=\"2.25\"/><path d=\"M8 5.25V6M8 9V9.75M4.5 12.75V13.75M11.5 12.75V13.75\"/></g>\n</svg>",
		scaling: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"1.5\" y=\"2.5\" width=\"13\" height=\"9\" rx=\"1\" stroke=\"currentColor\" stroke-width=\".92\"/><path d=\"M4 9 7 6l2 1 3-3M8 11.5v2M5.5 13.5h5\" stroke=\"currentColor\" stroke-width=\".92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</svg>",
		school: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M5.48751 11.2972L10.4354 11.2964H5.49535L5.48751 11.2972Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M5.49535 13.0423C4.81691 13.0423 4.2588 12.5265 4.19152 11.8658L4.18468 4.00851C4.18468 3.42828 4.65521 2.95775 5.23544 2.95775H10.7646C11.3448 2.95775 11.8153 3.42829 11.8153 4.00851V10.4123C11.8153 10.7646 11.6092 11.0692 11.3109 11.2115V12.1689C11.5526 12.169 11.7527 12.3649 11.7527 12.6066C11.7527 12.8483 11.5526 13.0421 11.3109 13.0423H5.49535ZM5.06017 11.7316C5.06017 11.5214 5.20914 11.3456 5.40729 11.3049L5.48751 11.2972L5.49535 11.2964H10.4354V12.1668H5.49535L5.40729 12.1574C5.20923 12.1167 5.06023 11.9417 5.06017 11.7316ZM10.798 4.09446H5.20187V5.49349H10.798V4.09446Z\" fill=\"currentColor\"/>\n</svg>",
		"school-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 3L1.75 6.25L8 9.5L14.25 6.25Z\"/><path d=\"M4.25 7.75V10.75C4.25 10.75 5.5 12.25 8 12.25C10.5 12.25 11.75 10.75 11.75 10.75V7.75\"/><path d=\"M14.25 6.25V9.75\"/></g>\n</svg>",
		"search-30": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9.08539 6.62647C9.08539 5.25128 7.97034 4.13623 6.59515 4.13623C5.21996 4.13623 4.10492 5.25128 4.10492 6.62647C4.10492 8.00165 5.21996 9.1167 6.59515 9.1167C7.97034 9.1167 9.08539 8.00165 9.08539 6.62647ZM10.1049 6.62647C10.1049 7.39551 9.85641 8.10577 9.43695 8.68408L12.9145 12.1616L12.1928 12.8833L8.72406 9.41455C8.13333 9.86631 7.39626 10.1362 6.59515 10.1362C4.65663 10.1362 3.08539 8.56498 3.08539 6.62647C3.08539 4.68795 4.65663 3.1167 6.59515 3.1167C8.53367 3.1167 10.1049 4.68795 10.1049 6.62647Z\" fill=\"currentColor\"/>\n<line x1=\"5.29565\" y1=\"6.65802\" x2=\"7.87889\" y2=\"6.65802\" stroke=\"currentColor\" stroke-width=\"0.533333\"/>\n</svg>",
		"see-30": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.07672 3.70416C10.1007 3.70416 11.795 4.74149 12.9566 5.73248C13.5419 6.23179 14.0051 6.72991 14.3218 7.10358C14.4805 7.29069 14.6032 7.44763 14.6871 7.55865C14.7289 7.61411 14.7616 7.65861 14.7838 7.68951C14.7947 7.70477 14.8032 7.71711 14.8091 7.72565C14.812 7.72971 14.8143 7.73297 14.816 7.73541C14.8167 7.73644 14.8174 7.73762 14.8179 7.73834L14.8189 7.73932C14.819 7.73947 14.8195 7.74054 14.441 8.00006L14.8189 8.25983L14.8179 8.2608C14.8174 8.2616 14.8168 8.26345 14.816 8.26471C14.8143 8.26716 14.812 8.27042 14.8091 8.27448C14.8031 8.28303 14.7947 8.29531 14.7838 8.31061C14.7616 8.34152 14.729 8.38597 14.6871 8.44147C14.6032 8.5525 14.4805 8.70941 14.3218 8.89655C14.0051 9.27021 13.5418 9.76835 12.9566 10.2676C11.795 11.2586 10.1006 12.296 8.07672 12.296C6.05502 12.296 4.32329 11.2606 3.12555 10.2725C2.52187 9.77448 2.04052 9.27717 1.70953 8.90436C1.54377 8.71764 1.41473 8.56095 1.32672 8.45026C1.28277 8.39498 1.24846 8.35111 1.22516 8.32037C1.21359 8.30511 1.2051 8.29275 1.19879 8.28424C1.19569 8.28005 1.19278 8.27694 1.19098 8.27448C1.1902 8.27341 1.18956 8.27227 1.18903 8.27155L1.18805 8.27057V8.26959L0.99176 8.00006L1.18805 7.73053V7.72955L1.18903 7.72858C1.18957 7.72784 1.19017 7.72676 1.19098 7.72565C1.19279 7.72318 1.19566 7.72011 1.19879 7.71588C1.20509 7.70738 1.21359 7.69502 1.22516 7.67975C1.24845 7.64902 1.2828 7.6051 1.32672 7.54987C1.41473 7.43918 1.54377 7.28248 1.70953 7.09576C2.04051 6.72296 2.52186 6.22565 3.12555 5.7276C4.32329 4.73948 6.05502 3.70417 8.07672 3.70416ZM8.07672 4.62213C6.36484 4.62213 4.83718 5.50531 3.70953 6.43561C3.1509 6.8965 2.70367 7.35865 2.39606 7.70514C2.29738 7.81629 2.21538 7.91722 2.14703 8.00006C2.21537 8.08289 2.29741 8.18387 2.39606 8.29498C2.70368 8.64147 3.1509 9.10363 3.70953 9.56451C4.83718 10.4948 6.36484 11.378 8.07672 11.378C9.78623 11.378 11.2738 10.4968 12.3609 9.5694C12.9 9.10949 13.3285 8.64854 13.6216 8.3028C13.719 8.18799 13.7988 8.0844 13.8648 8.00006C13.7988 7.91573 13.719 7.81214 13.6216 7.69733C13.3285 7.35158 12.9 6.89064 12.3609 6.43073C11.2738 5.50334 9.78627 4.62213 8.07672 4.62213ZM14.9976 8.00006L14.8199 8.25983L14.441 8.00006L14.8199 7.7403L14.9976 8.00006Z\" fill=\"currentColor\"/>\n<path d=\"M8.15295 5.66766C9.44112 5.66766 10.4858 6.71157 10.486 7.99969C10.486 9.28796 9.44122 10.3327 8.15295 10.3327C6.86483 10.3325 5.82092 9.28786 5.82092 7.99969C5.82109 6.71167 6.86493 5.66783 8.15295 5.66766Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"0.81\"/>\n</svg>",
		settings: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2 4.5H4.5M8.5 4.5H14\" stroke=\"#1E1E1E\" stroke-linecap=\"round\"/>\n<circle cx=\"6.5\" cy=\"4.5\" r=\"1.5\" stroke=\"#1E1E1E\"/>\n<path d=\"M2 8H9M13 8H14\" stroke=\"#1E1E1E\" stroke-linecap=\"round\"/>\n<circle cx=\"11\" cy=\"8\" r=\"1.5\" stroke=\"#1E1E1E\"/>\n<path d=\"M2 11.5H3.5M7.5 11.5H14\" stroke=\"#1E1E1E\" stroke-linecap=\"round\"/>\n<circle cx=\"5.5\" cy=\"11.5\" r=\"1.5\" stroke=\"#1E1E1E\"/>\n</svg>",
		shield: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 2L13 3.5V8C13 10.6 10.9 12.7 8 14C5.1 12.7 3 10.6 3 8V3.5Z\" stroke=\"currentColor\"/>\n<path d=\"M5.75 8L7.25 9.5L10.25 6.5\" stroke=\"currentColor\"/>\n</svg>",
		"shield-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 2L13 3.75V7.5C13 10.42 10.89 12.86 8 13.75C5.11 12.86 3 10.42 3 7.5V3.75Z\"/><path d=\"M5.75 7.75L7.25 9.25L10.25 6.25\"/></g>\n</svg>",
		shirt: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.75 2.25L2 4.25L3.25 7.25L4.75 6.75V13.25H11.25V6.75L12.75 7.25L14 4.25L10.25 2.25C10.25 3.49 9.24 4.25 8 4.25C6.76 4.25 5.75 3.49 5.75 2.25Z\"/></g>\n</svg>",
		shop: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.25 6.25L3.25 2.75H12.75L13.75 6.25\"/><path d=\"M2.25 6.25C2.25 7.08 2.92 7.75 3.75 7.75C4.58 7.75 5.25 7.08 5.25 6.25C5.25 7.08 5.92 7.75 6.75 7.75H9.25C10.08 7.75 10.75 7.08 10.75 6.25C10.75 7.08 11.42 7.75 12.25 7.75C13.08 7.75 13.75 7.08 13.75 6.25\"/><path d=\"M3.25 7.75V13.25H12.75V7.75\"/><path d=\"M6.75 13.25V10.25H9.25V13.25\"/></g>\n</svg>",
		"sign-in": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M1.5 8H9.5M6 4.5L9.5 8L6 11.5M9.5 2.5H13.5V13.5H9.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		"sign-out": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.5 8H14.5M11 4.5L14.5 8L11 11.5M6.5 2.5H2.5V13.5H6.5\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n</svg>",
		slack: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12 12v-6a2 2 0 0 1 4 0v6m0 -2a2 2 0 1 1 2 2h-6\"/>\n<path d=\"M12 12h6a2 2 0 0 1 0 4h-6m2 0a2 2 0 1 1 -2 2v-6\"/>\n<path d=\"M12 12v6a2 2 0 0 1 -4 0v-6m0 2a2 2 0 1 1 -2 -2h6\"/>\n<path d=\"M12 12h-6a2 2 0 0 1 0 -4h6m-2 0a2 2 0 1 1 2 -2v6\"/>\n</svg></svg>",
		slash: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M10.25 3L5.75 13\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		sparkle: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7 3.5Q7.6 8.4 12.5 9Q7.6 9.6 7 14.5Q6.4 9.6 1.5 9Q6.4 8.4 7 3.5ZM12.25 1.5Q12.5 3.5 14.5 3.75Q12.5 4 12.25 6Q12 4 10 3.75Q12 3.5 12.25 1.5Z\" fill=\"currentColor\"/>\n</svg>",
		"star-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.38603 13.4L5.77704 9.26603L2.42303 7.01703H6.53103L8.00004 2.58403L9.49504 7.01703H13.577L10.223 9.26603L11.64 13.4L8.00004 10.761L4.38603 13.4Z\" fill=\"currentColor\"/>\n</svg>",
		"star-alt-2": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.38603 13.4L5.77704 9.26599L2.42303 7.01698H6.53103L8.00004 2.58398L9.49504 7.01698H13.577L10.223 9.26599L11.64 13.4L8.00004 10.761L4.38603 13.4Z\" fill=\"currentColor\"/>\n</svg>",
		start: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.5 3.0365H5.5V12.9635H4.5V3.0365Z\" fill=\"currentColor\"/>\n<path d=\"M11.5 3.0365V12.9635L6.25 8L11.5 3.0365Z\" fill=\"currentColor\"/>\n</svg>",
		status: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.51244 5.31893L8.50618 1.97758H7.4877L7.49396 5.31893L8.51244 5.31893Z\" fill=\"currentColor\"/>\n<path d=\"M10.2525 6.46416L12.6108 4.09704L11.8906 3.37687L9.53235 5.74399L10.2525 6.46416Z\" fill=\"currentColor\"/>\n<path d=\"M10.6731 8.50438L14.0145 8.49812V7.47965L10.6731 7.4859L10.6731 8.50438Z\" fill=\"currentColor\"/>\n<path d=\"M9.52792 10.2445L11.895 12.6027L12.6152 11.8826L10.2481 9.52429L9.52792 10.2445Z\" fill=\"currentColor\"/>\n<path d=\"M7.4877 10.6651L7.49396 14.0064H8.51243L8.50618 10.6651L7.4877 10.6651Z\" fill=\"currentColor\"/>\n<path d=\"M5.74762 9.51987L3.38935 11.887L4.10952 12.6072L6.46779 10.24L5.74762 9.51987Z\" fill=\"currentColor\"/>\n<path d=\"M5.32699 7.47965L1.98564 7.48591L1.98564 8.50438L5.32699 8.49812L5.32699 7.47965Z\" fill=\"currentColor\"/>\n<path d=\"M6.47222 5.73956L4.1051 3.3813L3.38493 4.10147L5.75204 6.45973L6.47222 5.73956Z\" fill=\"currentColor\"/>\n</svg>",
		"status-alt": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.51245 5.31892L8.50619 1.97757H7.48772L7.49398 5.31892L8.51245 5.31892Z\" fill=\"currentColor\"/>\n<path d=\"M10.2525 6.46414L12.6108 4.09703L11.8906 3.37686L9.53236 5.74397L10.2525 6.46414Z\" fill=\"currentColor\"/>\n<path d=\"M10.6732 8.50436L14.0145 8.4981V7.47963L10.6732 7.48589L10.6732 8.50436Z\" fill=\"currentColor\"/>\n<path d=\"M9.52794 10.2444L11.8951 12.6027L12.6152 11.8825L10.2481 9.52428L9.52794 10.2444Z\" fill=\"currentColor\"/>\n<path d=\"M7.48772 10.6651L7.49398 14.0064H8.51245L8.50619 10.6651L7.48772 10.6651Z\" fill=\"currentColor\"/>\n<path d=\"M5.74763 9.51985L3.38937 11.887L4.10954 12.6071L6.4678 10.24L5.74763 9.51985Z\" fill=\"currentColor\"/>\n<path d=\"M5.32701 7.47963L1.98566 7.48589L1.98566 8.50436L5.32701 8.49811L5.32701 7.47963Z\" fill=\"currentColor\"/>\n<path d=\"M6.47223 5.73955L4.10511 3.38128L3.38495 4.10145L5.75206 6.45972L6.47223 5.73955Z\" fill=\"currentColor\"/>\n<path d=\"M4.97431 13.4964L11.0258 13.4964L11.0258 14.5164L4.97431 14.5164L4.97431 13.4964Z\" fill=\"currentColor\"/>\n</svg>",
		"status-filled": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M5.32701 7.47963L1.98566 7.48589L1.98566 8.50436L5.32701 8.49811L5.32701 7.47963Z\" fill=\"currentColor\"/>\n<path d=\"M4.1687 9.66267L4.16244 6.32132H3.14397L3.15022 9.66267H4.1687Z\" fill=\"currentColor\"/>\n<path d=\"M2.83728 9.53564L5.19555 7.16852L4.47538 6.44835L2.11711 8.81547L2.83728 9.53564Z\" fill=\"currentColor\"/>\n<path d=\"M2.11269 7.17294L4.4798 9.53121L5.19997 8.81104L2.83286 6.45277L2.11269 7.17294Z\" fill=\"currentColor\"/>\n<path d=\"M5.32701 7.47963L1.98566 7.48589L1.98566 8.50436L5.32701 8.49811L5.32701 7.47963Z\" fill=\"currentColor\"/>\n<path d=\"M4.1687 9.66267L4.16244 6.32132H3.14397L3.15022 9.66267H4.1687Z\" fill=\"currentColor\"/>\n<path d=\"M2.83728 9.53564L5.19555 7.16852L4.47538 6.44835L2.11711 8.81547L2.83728 9.53564Z\" fill=\"currentColor\"/>\n<path d=\"M2.11269 7.17294L4.4798 9.53121L5.19997 8.81104L2.83286 6.45277L2.11269 7.17294Z\" fill=\"currentColor\"/>\n<path d=\"M9.69253 7.47963L6.35119 7.48589V8.50436L9.69253 8.4981L9.69253 7.47963Z\" fill=\"currentColor\"/>\n<path d=\"M8.53423 9.66267L8.52797 6.32132H7.50949L7.51575 9.66267L8.53423 9.66267Z\" fill=\"currentColor\"/>\n<path d=\"M7.20281 9.53563L9.56108 7.16852L8.84091 6.44835L6.48264 8.81547L7.20281 9.53563Z\" fill=\"currentColor\"/>\n<path d=\"M6.47822 7.17294L8.84533 9.53121L9.5655 8.81104L7.19839 6.45277L6.47822 7.17294Z\" fill=\"currentColor\"/>\n<path d=\"M9.69253 7.47963L6.35119 7.48589V8.50436L9.69253 8.4981L9.69253 7.47963Z\" fill=\"currentColor\"/>\n<path d=\"M8.53423 9.66267L8.52797 6.32132H7.50949L7.51575 9.66267L8.53423 9.66267Z\" fill=\"currentColor\"/>\n<path d=\"M7.20281 9.53563L9.56108 7.16852L8.84091 6.44835L6.48264 8.81547L7.20281 9.53563Z\" fill=\"currentColor\"/>\n<path d=\"M6.47822 7.17294L8.84533 9.53121L9.5655 8.81104L7.19839 6.45277L6.47822 7.17294Z\" fill=\"currentColor\"/>\n<path d=\"M13.976 7.47963L10.6346 7.48589L10.6346 8.50436L13.976 8.4981L13.976 7.47963Z\" fill=\"currentColor\"/>\n<path d=\"M12.8177 9.66267L12.8114 6.32132H11.793L11.7992 9.66267L12.8177 9.66267Z\" fill=\"currentColor\"/>\n<path d=\"M11.4863 9.53563L13.8445 7.16852L13.1244 6.44835L10.7661 8.81547L11.4863 9.53563Z\" fill=\"currentColor\"/>\n<path d=\"M10.7617 7.17294L13.1288 9.53121L13.849 8.81104L11.4818 6.45277L10.7617 7.17294Z\" fill=\"currentColor\"/>\n<path d=\"M13.976 7.47963L10.6346 7.48589L10.6346 8.50436L13.976 8.4981L13.976 7.47963Z\" fill=\"currentColor\"/>\n<path d=\"M12.8177 9.66267L12.8114 6.32132H11.793L11.7992 9.66267L12.8177 9.66267Z\" fill=\"currentColor\"/>\n<path d=\"M11.4863 9.53563L13.8445 7.16852L13.1244 6.44835L10.7661 8.81547L11.4863 9.53563Z\" fill=\"currentColor\"/>\n<path d=\"M10.7617 7.17294L13.1288 9.53121L13.849 8.81104L11.4818 6.45277L10.7617 7.17294Z\" fill=\"currentColor\"/>\n</svg>",
		stop: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.25 4.25H11.75V11.75H4.25V4.25Z\" fill=\"currentColor\"/>\n</svg>",
		strike: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M10.6 5.4C10.4 4.2 9.4 3.5 8 3.5C6.5 3.5 5.5 4.3 5.5 5.5C5.5 8.2 10.5 7.4 10.5 10.3C10.5 11.6 9.4 12.5 8 12.5C6.5 12.5 5.5 11.7 5.4 10.6M4 8H12\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		sun: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"8\" cy=\"8\" r=\"2.75\"/><path d=\"M12.75 8L14.25 8M11.36 11.36L12.42 12.42M8 12.75L8 14.25M4.64 11.36L3.58 12.42M3.25 8L1.75 8M4.64 4.64L3.58 3.58M8 3.25L8 1.75M11.36 4.64L12.42 3.58\"/></g>\n</svg>",
		system: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"8\" cy=\"8\" r=\"5.75\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<path d=\"M8 2.25A5.75 5.75 0 0 0 8 13.75Z\" fill=\"currentColor\"/>\n</svg>",
		table: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3H13.5V13H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M6.2 3V13M9.8 3V13M2.5 8H13.5\" stroke=\"currentColor\" stroke-width=\"1\"/>\n</svg>",
		tabs: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 13V3H6.5V6H13.5V13Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M9.5 6V3H13.5V6\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		tag: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.25 3.25V7.34C2.25 7.74 2.41 8.12 2.69 8.4L7.6 13.31C8.19 13.9 9.14 13.9 9.72 13.31L13.31 9.72C13.9 9.14 13.9 8.19 13.31 7.6L8.4 2.69C8.12 2.41 7.74 2.25 7.34 2.25H3.25C2.7 2.25 2.25 2.7 2.25 3.25Z\"/><circle cx=\"5.25\" cy=\"5.25\" r=\"0.75\"/></g>\n</svg>",
		templates: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 8L6 4.5H13.5V11.5H6L2.5 8Z\" stroke=\"currentColor\" stroke-width=\"0.92\"/>\n<rect x=\"7\" y=\"7\" width=\"2\" height=\"2\" fill=\"currentColor\"/>\n</svg>",
		text: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 4H13V5H3ZM3 7.5H13V8.5H3ZM3 11H9V12H3Z\" fill=\"currentColor\"/>\n</svg>",
		ticket: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.25 4.25H13.75V6.5C12.93 6.5 12.25 7.17 12.25 8C12.25 8.83 12.93 9.5 13.75 9.5V11.75H2.25V9.5C3.08 9.5 3.75 8.83 3.75 8C3.75 7.17 3.08 6.5 2.25 6.5Z\"/><path d=\"M9.75 4.25V5.25M9.75 7.5V8.5M9.75 10.75V11.75\"/></g>\n</svg>",
		title: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.38251 12.615V4.42501H4.48351V3.38501H11.5165V4.42501H8.61751V12.615H7.38251Z\" fill=\"currentColor\"/>\n</svg>",
		"title-struck": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.38251 12.615V4.42501H4.48351V3.38501H11.5165V4.42501H8.61751V12.615H7.38251Z\" fill=\"currentColor\"/>\n<path d=\"M2.5 7.48H13.5V8.52H2.5V7.48Z\" fill=\"currentColor\"/>\n</svg>",
		titlestyle: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g clip-path=\"url(#clip0_117_106)\">\n<path d=\"M13.158 12.607V4.41701H10.259V3.37701H16.0011V4.41701H14.393V12.607H13.158Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8.99904 3.49201V12.492H-0.000961304V3.49201H8.99904Z\" fill=\"currentColor\"/>\n</g>\n<defs>\n<clipPath id=\"clip0_117_106\">\n<rect width=\"16\" height=\"16\" fill=\"white\"/>\n</clipPath>\n</defs>\n</svg>",
		todo: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2.5 3H6.5V7H2.5ZM2.5 9H6.5V13H2.5Z\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M3.5 5L4.4 5.9L5.7 4.2\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n<path d=\"M8.5 4.5H13.5V5.5H8.5ZM8.5 10.5H13.5V11.5H8.5Z\" fill=\"currentColor\"/>\n</svg>",
		toggle: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 5L7.5 8L3 11Z\" fill=\"currentColor\"/>\n<path d=\"M9.5 7.5H13.5V8.5H9.5Z\" fill=\"currentColor\"/>\n</svg>",
		train: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.25\" y=\"1.75\" width=\"9.5\" height=\"9.5\" rx=\"2.25\"/><path d=\"M3.25 7H12.75\"/><path d=\"M5.75 9.25H5.76M10.24 9.25H10.25\"/><path d=\"M5.25 11.25L3.75 14M10.75 11.25L12.25 14\"/></g>\n</svg>",
		transfer: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 5.5H12.5M10 3L12.5 5.5L10 8\"/><path d=\"M13 10.5H3.5M6 8L3.5 10.5L6 13\"/></g>\n</svg>",
		tv: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"1.75\" y=\"3.25\" width=\"12.5\" height=\"8.5\" rx=\"1.75\"/><path d=\"M5.5 13.75H10.5\"/><path d=\"M7 6V9L9.5 7.5Z\"/></g>\n</svg>",
		underline: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M5.5 3.25V8A2.5 2.5 0 0 0 10.5 8V3.25M4 12.75H12\" stroke=\"currentColor\" stroke-width=\"1.1\"/>\n</svg>",
		undo: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 12 10\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M1 4L4 1M1 4L4 7M1 4H8C9.65685 4 11 5.34315 11 7V9\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>\n</svg></svg>",
		ungroup: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8.0715 12.8292C7.24817 12.8292 6.52884 12.6212 5.9135 12.2052C5.30684 11.7892 4.83884 11.2172 4.5095 10.4892C4.18884 9.7525 4.0285 8.9205 4.0285 7.99317C4.0285 7.29763 4.11777 6.66082 4.2963 6.08274L5.34525 7.13254C5.30809 7.40874 5.2895 7.69995 5.2895 8.00617C5.2895 9.12417 5.54084 10.0342 6.0435 10.7362C6.55484 11.4382 7.2915 11.7892 8.2535 11.7892C8.8321 11.7892 9.30507 11.6805 9.67242 11.4632L10.2574 12.0487C10.1317 12.1621 9.99244 12.2662 9.8395 12.3612C9.33684 12.6732 8.7475 12.8292 8.0715 12.8292ZM5.72335 3.94748C5.80556 3.88453 5.89061 3.82476 5.9785 3.76817C6.61984 3.36084 7.38684 3.15717 8.2795 3.15717C9.0595 3.15717 9.70084 3.30884 10.2035 3.61217C10.7148 3.9155 11.0918 4.2795 11.3345 4.70417C11.5858 5.12017 11.7418 5.53617 11.8025 5.95217L10.5805 6.12117C10.4938 5.6185 10.2642 5.17217 9.8915 4.78217C9.5275 4.39217 8.97717 4.19717 8.2405 4.19717C7.62517 4.19717 7.09217 4.3575 6.6415 4.67817C6.60526 4.70447 6.56971 4.73161 6.53486 4.7596L5.72335 3.94748ZM11.9715 10.2003L10.8646 9.09263C10.8646 9.12962 10.8659 9.05532 10.8646 9.09263L10.8665 8.82517H10.5974L9.55815 7.78517H11.9715V10.2003Z\" fill=\"currentColor\"/>\n<path d=\"M3.81068 3.07916L3.09052 3.79933L12.4514 13.1638L13.1689 12.4463L3.81068 3.07916Z\" fill=\"currentColor\"/>\n</svg>",
		unhead: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M5.47942 12.7273V8.49858H6.69908L5.68346 7.48296H5.47942V7.28193L4.33453 6.13704V12.7273H5.47942Z\" fill=\"currentColor\"/>\n<path d=\"M5.47942 3.27273H5.08209L5.47942 3.67006V3.27273Z\" fill=\"currentColor\"/>\n<path d=\"M10.5206 3.27273V7.48296H9.28601L10.3016 8.49858H10.5206V8.70465L11.6655 9.84953V3.27273H10.5206Z\" fill=\"currentColor\"/>\n<path d=\"M10.5206 12.3299V12.7273H10.918L10.5206 12.3299Z\" fill=\"currentColor\"/>\n<path d=\"M12.319 13.0436L2.96078 3.67653L3.68095 2.95636L13.0392 12.3235L12.319 13.0436Z\" fill=\"currentColor\"/>\n</svg>",
		unicon: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.52511 10.7843L4.52511 6.28572L3.52511 5.2851L3.52511 12.4913H10.7269L9.72748 11.4913H6.14327L8.53309 10.2962L7.78818 9.5508L6.55733 10.1661L7.4805 9.24293L6.77369 8.53569L4.52511 10.7843Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M7.31174 7.99763L8.01844 8.705L8.50529 9.19232L9.24995 9.93768L10.8021 11.4913L11.8012 12.4913L12.4738 13.1646L12.4767 13.1617L13.1782 12.4603L13.194 12.4444L12.5251 11.7749L11.5251 10.774L10.21 9.45758L9.46543 8.71234L8.73861 7.98483L8.03191 7.27746L5.24837 4.4913L4.24932 3.4913L3.83573 3.07731L3.81838 3.09466L3.11694 3.7961L3.11556 3.79748L3.52511 4.20742L4.52511 5.20837L7.31174 7.99763ZM10.8074 11.4913L9.25314 9.93608L10.1882 9.46846L11.5251 10.8062V11.4913H10.8074Z\" fill=\"currentColor\"/>\n<path d=\"M9.25314 9.93608L10.8074 11.4913H11.5251V10.8062L10.1882 9.46846L9.25314 9.93608Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M12.5251 10.7262V3.4913L5.2947 3.4913L6.29407 4.4913L10.8181 4.4913L8.55537 6.754L9.26218 7.46126L11.5251 5.19833V7.6827L10.1637 8.3633L10.9083 9.10837L11.5251 8.79989V9.72559L12.5251 10.7262ZM12.5251 11.8068L13.1782 12.4603L13.194 12.4444L12.5251 11.7749L11.5251 10.774L10.21 9.45758L9.46543 8.71234L8.73861 7.98483L8.03191 7.27746L5.24837 4.4913L4.24932 3.4913L3.83573 3.07731L3.81838 3.09466L4.21478 3.4913H3.52511V4.20451L3.11694 3.7961L3.11556 3.79748L3.52511 4.20742L4.52511 5.20837L7.31174 7.99763L8.01844 8.705L8.50529 9.19232L9.24995 9.93768L10.8021 11.4913L11.8012 12.4913L12.4738 13.1646L12.4767 13.1617L11.8068 12.4913H12.5251V11.8068ZM10.1882 9.46846L11.5251 10.8062V11.4913H10.8074L9.25314 9.93608L10.1882 9.46846ZM8.72205 8.00138L9.44352 8.7233L8.50832 9.1908L8.02063 8.70281L8.72205 8.00138ZM5.21415 4.4913L8.01524 7.29413L7.31382 7.99556L4.52511 5.20513V4.4913H5.21415Z\" fill=\"currentColor\"/>\n</svg>",
		untitle: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3.76358 3.06275L3.06079 3.76553L4.35081 5.05677L4.35297 5.05461L7.35278 8.05725V6.65465L5.08414 4.38431H4.45378V3.75347L3.76358 3.06275Z\" fill=\"currentColor\"/>\n<path d=\"M12.4191 13.1326L13.1232 12.4403L11.9204 11.2257L8.58778 7.89058V9.29342L11.3717 12.0799L11.3695 12.0821L12.4191 13.1326Z\" fill=\"currentColor\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M6.16399 4.38431L5.12477 3.34431H11.4868V4.38431H8.58778V6.80992L7.35278 5.57399V4.38431H6.16399ZM7.35278 9.13802V12.5743H8.58778V10.3742L7.35278 9.13802Z\" fill=\"currentColor\"/>\n<path d=\"M8.58778 7.89058L7.35278 6.65465V8.05725L8.58778 9.29342V7.89058Z\" fill=\"currentColor\"/>\n<path d=\"M4.45378 3.75347V4.38431H5.08414L4.45378 3.75347Z\" fill=\"currentColor\"/>\n</svg>",
		"up-right": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M11.5728 3.7126L2.7214 12.564L3.436 13.2786L12.2881 4.4284L12.2881 8.5398L13.2786 8.5307L13.2786 2.7214L7.4644 2.7214L7.4644 3.7218L11.5728 3.7126Z\" fill=\"#1E1E1E\"/>\n</svg>",
		upload: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8 10V2.5M4.5 6L8 2.5L11.5 6\" stroke=\"currentColor\"/>\n<path d=\"M2.5 10.5V13.5H13.5V10.5\" stroke=\"currentColor\"/>\n</svg>",
		video: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"2.5\" y=\"4.5\" width=\"8\" height=\"7\" stroke=\"currentColor\"/>\n<path d=\"M10.5 7L13.5 5V11L10.5 9\" stroke=\"currentColor\"/>\n</svg>",
		vimeo: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 8.5l1 1s1.5 -1.102 2 -.5c.509 .609 1.863 7.65 2.5 9c.556 1.184 1.978 2.89 4 1.5c2 -1.5 7.5 -5.5 8.5 -11.5c.444 -2.661 -1 -4 -2.5 -4c-2 0 -4.047 1.202 -4.5 4c2.05 -1.254 2.551 1 1.5 3c-1.052 2 -2 3 -2.5 3c-.49 0 -.924 -1.165 -1.5 -3.5c-.59 -2.42 -.5 -6.5 -3 -6.5s-5.5 4.5 -5.5 4.5\"/>\n</svg></svg>",
		wallet: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12.25 5.25V4.25C12.25 3.7 11.8 3.25 11.25 3.25H3.75C2.92 3.25 2.25 3.92 2.25 4.75\"/><rect x=\"2.25\" y=\"4.75\" width=\"11.5\" height=\"8\" rx=\"1.75\"/><path d=\"M13.75 7.5H11.25C10.42 7.5 9.75 8.17 9.75 9C9.75 9.83 10.42 10.5 11.25 10.5H13.75\"/></g>\n</svg>",
		warning: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.5 3.3H8.5V10.3H7.5V3.3ZM7.5 11.3H8.5V12.3H7.5V11.3Z\" fill=\"currentColor\"/>\n</svg>",
		wifi: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1.75 6.25C5.2 3.25 10.8 3.25 14.25 6.25\"/><path d=\"M3.75 8.5C6.2 6.5 9.8 6.5 12.25 8.5\"/><path d=\"M5.75 10.75C7.05 9.75 8.95 9.75 10.25 10.75\"/><path d=\"M8 12.99V13\"/></g>\n</svg>",
		window: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"2.5\" y=\"3.5\" width=\"11\" height=\"9\" stroke=\"currentColor\"/>\n<path d=\"M2.5 6H13.5\" stroke=\"currentColor\"/>\n</svg>",
		windows: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M17.8 20l-12 -1.5c-1 -.1 -1.8 -.9 -1.8 -1.9v-9.2c0 -1 .8 -1.8 1.8 -1.9l12 -1.5c1.2 -.1 2.2 .8 2.2 1.9v12.1c0 1.2 -1.1 2.1 -2.2 1.9l0 .1\"/>\n<path d=\"M12 5l0 14\"/>\n<path d=\"M4 12l16 0\"/>\n</svg></svg>",
		work: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M13.8153 4.78289C13.8153 4.20267 13.3448 3.73213 12.7646 3.73213H8H3.23544C2.65521 3.73213 2.18468 4.20267 2.18468 4.78289V7.31419H13.8153L13.8153 4.78289ZM2.18468 8V11.2171C2.18468 11.7973 2.65521 12.2679 3.23544 12.2679H12.7646C13.3448 12.2679 13.8153 11.7973 13.8153 11.2171L13.8153 8L9.33239 7.98014V8.63222C9.33239 8.92233 9.09712 9.1576 8.807 9.1576H8H7.19299C6.90287 9.1576 6.66761 8.92233 6.66761 8.63222V7.98014L2.18468 8Z\" fill=\"currentColor\"/>\n</svg>",
		wrench: "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.75 2.5C8.07 2.85 6.98 4.5 7.33 6.18L2.85 10.65C2.27 11.24 2.27 12.19 2.85 12.77L3.23 13.15C3.81 13.73 4.76 13.73 5.35 13.15L9.82 8.67C11.5 9.02 13.15 7.93 13.5 6.25L11.5 6.5L9.5 4.5Z\"/></g>\n</svg>",
		"x-brand": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4 4l11.733 16h4.267l-11.733 -16l-4.267 0\"/>\n<path d=\"M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772\"/>\n</svg></svg>",
		youtube: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8\"/>\n<path d=\"M10 9l5 3l-5 3l0 -6\"/>\n</svg></svg>"
	};
})), Hd = { ...Ld }, Ud = new Set(Rd), Wd = !1, Gd;
function Kd() {
	return Gd ??= Promise.resolve().then(() => (Vd(), zd)).then(({ icons: e }) => {
		Object.assign(Hd, e), Wd = !0;
	}).catch((e) => {
		throw Gd = void 0, e;
	});
}
var qd = /(fill|stroke)=("|')(#1E1E1E|#2A2A2A|#000000|#000|black)\2/gi, Jd = /(?:fill|stroke)=("|')([^"']+)\1/gi, Yd = /^(none|currentColor|white|#fff|#ffffff|url\(.*\))$/i, Xd = /^(#1E1E1E|#2A2A2A|#000000|#000|black)$/i, Zd = /* @__PURE__ */ new Map();
function Qd(e) {
	for (let [, , t] of e.matchAll(Jd)) if (!Yd.test(t) && !Xd.test(t)) return !0;
	return !1;
}
function $d(e) {
	let t = Zd.get(e);
	if (t !== void 0) return t;
	let n = Qd(e) ? e : e.replace(qd, "$1=\"currentColor\"");
	return Zd.set(e, n), n;
}
Bc("ds-icon", class extends Rc {
	static properties = {
		type: {
			type: String,
			reflect: !0
		},
		variant: {
			type: String,
			reflect: !0
		},
		size: {
			type: String,
			reflect: !0
		}
	};
	_type = "";
	_iconsReady;
	_failedType;
	constructor() {
		super(), this.variant = "glyph";
	}
	get type() {
		return this._type;
	}
	set type(e) {
		let t = this._type;
		this._type = e, this.requestUpdate("type", t);
	}
	async getUpdateComplete() {
		return await super.getUpdateComplete(), await this._iconsReady, super.getUpdateComplete();
	}
	static styles = Ps(Id);
	render() {
		if (!this._type) return X`<slot></slot>`;
		let e = Hd[this._type.toLowerCase()];
		if (e) return X`${Fd($d(e))}`;
		if (!Wd && Ud.has(this._type.toLowerCase()) && !this._iconsReady && this._failedType !== this._type) {
			let e = this._type;
			this._iconsReady = Kd().then(() => {
				this._failedType = void 0, this.requestUpdate();
			}).catch(() => {
				this._failedType = e;
			}).finally(() => {
				this._iconsReady = void 0;
			});
		}
		return X`<slot></slot>`;
	}
});
//#endregion
//#region src/vendor/ds1/2-core/button-split.ts
function ef(e) {
	return e.segments ?? e.options.split(",").map((e) => e.trim()).filter(Boolean).map((e) => {
		let t = e.indexOf(":");
		if (t < 0) return {
			value: e.toLowerCase(),
			label: e
		};
		let n = e.slice(0, t).trim(), r = e.slice(t + 1).trim();
		if (!r.startsWith("@")) return {
			value: n,
			label: r
		};
		let i = r.indexOf(":");
		return {
			value: n,
			icon: r.slice(1, i < 0 ? void 0 : i).trim(),
			label: i < 0 ? n : r.slice(i + 1).trim()
		};
	});
}
function tf(e, t) {
	e.splitDisabled || t.disabled || (e.actions ? e.dispatchEvent(new CustomEvent("press", {
		detail: { value: t.value },
		bubbles: !0,
		composed: !0
	})) : t.value !== e.value && e.dispatchEvent(new CustomEvent("change", {
		detail: { value: t.value },
		bubbles: !0,
		composed: !0,
		cancelable: !0
	})) && (e.value = t.value));
}
function nf(e, t) {
	let n = [...e.renderRoot.querySelectorAll("button:not(:disabled)")];
	(n.find((e) => e.getAttribute("aria-pressed") === "true") ?? n[0])?.focus(t);
}
function rf(e) {
	let t = (t) => X`<ds-text .text=${t.label} .literal=${e.literal}></ds-text>`;
	return X`${ef(e).map((n) => X`<button
      type="button" part="segment" value=${n.value}
      aria-pressed=${e.actions ? Z : String(n.value === e.value)}
      aria-label=${n.icon && !e.labelled ? e.literal ? n.label : bd(n.label) : Z}
      ?data-icon=${!!n.icon && !e.labelled}
      ?data-icon-words=${!!n.icon && !!e.labelled}
      ?data-short=${n.label.length === 1}
      ?disabled=${e.splitDisabled || n.disabled}
      @click=${() => tf(e, n)}
    >${n.icon ? e.labelled ? X`<ds-icon type=${n.icon} aria-hidden="true"></ds-icon>${t(n)}` : X`<ds-icon type=${n.icon} aria-hidden="true"></ds-icon>` : t(n)}</button>`)}`;
}
//#endregion
//#region src/vendor/ds1/2-core/styles/ds-button-split.css?inline
var af = ":host([split]){max-width:none;height:var(--ds-control-height);vertical-align:bottom;flex:none;align-items:stretch;gap:1px;display:inline-flex;overflow:visible}:host([split][hidden]){display:none}:host([split]) button{appearance:none;box-sizing:border-box;width:auto;max-width:none;height:var(--ds-control-height);padding:0 calc(5px * var(--ds-sf));corner-shape:var(--ds-corner-shape,round);background:var(--ds-button-background-color-secondary);color:var(--ds-text-color-muted);font-family:var(--ds-typeface-regular);font-feature-settings:var(--ds-font-features);font-size:var(--ds-type-size-default);font-weight:var(--ds-type-weight-default);line-height:var(--ds-control-height);letter-spacing:var(--ds-type-letterspacing-default);white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent;border:0;border-radius:0;flex:none;justify-content:center;align-items:center;margin:0;display:inline-flex}:host([split]) button:first-child{border-start-start-radius:var(--ds-radius);border-end-start-radius:var(--ds-radius)}:host([split]) button:last-child{border-start-end-radius:var(--ds-radius);border-end-end-radius:var(--ds-radius)}:host([split]) button[data-icon]{width:var(--ds-control-height);padding:0}:host([split]) button[data-icon-words]{gap:0;padding-inline-start:0}:host([split]) ds-icon{--ds-icon-size:16px;color:inherit}:host([split]) ds-text{color:inherit}:host([split][compact]) button:not([data-icon],[data-short]){--ds-typeface-regular:var(--ds-typeface-compressed);padding-inline:calc(3px * var(--ds-sf))}:host([split][compact]) button[data-short]{width:var(--ds-control-height);padding:0}:host([split]) button:hover:not(:disabled,[aria-pressed=true]){color:var(--ds-text-color)}:host([split]) button[aria-pressed=true]{background:var(--ds-accent-color);color:var(--ds-button-text-color-on-accent);cursor:default}:host([split]) button:disabled{cursor:default;opacity:.5}:host([split]) button:focus-visible{outline-offset:-2px;outline:1px solid}";
Bc("ds-button", class extends Od {
	static formAssociated = !0;
	static properties = {
		split: {
			type: Boolean,
			reflect: !0
		},
		options: { type: String },
		segments: { attribute: !1 },
		value: {
			type: String,
			reflect: !0
		},
		actions: {
			type: Boolean,
			reflect: !0
		},
		labelled: {
			type: Boolean,
			reflect: !0
		},
		literal: {
			type: Boolean,
			reflect: !0
		},
		compact: {
			type: Boolean,
			reflect: !0
		},
		_fieldsetDisabled: { state: !0 },
		primary: {
			type: Boolean,
			reflect: !0
		},
		secondary: {
			type: Boolean,
			reflect: !0
		},
		control: {
			type: String,
			reflect: !0,
			noAccessor: !0
		},
		active: {
			type: Boolean,
			reflect: !0
		},
		choice: {
			type: Boolean,
			reflect: !0
		},
		icon: {
			type: Boolean,
			reflect: !0
		},
		wide: {
			type: Boolean,
			reflect: !0
		},
		fixed: {
			type: Boolean,
			reflect: !0
		},
		fit: {
			type: Boolean,
			reflect: !0
		},
		danger: {
			type: Boolean,
			reflect: !0
		},
		menuItem: {
			type: Boolean,
			reflect: !0,
			attribute: "menu-item"
		},
		blank: {
			type: Boolean,
			reflect: !0
		},
		language: { type: String },
		text: { type: String },
		label: { type: String },
		href: { type: String },
		target: { type: String },
		rel: { type: String },
		_loading: {
			type: Boolean,
			state: !0
		}
	};
	splitRole = !1;
	get splitDisabled() {
		return this.disabled || this._fieldsetDisabled;
	}
	splitLanguageChanged = () => {
		this.split && this.requestUpdate();
	};
	_control = "native";
	get control() {
		return this._control;
	}
	set control(e) {
		let t = this._control;
		this._control = e, this.syncControl(), this.requestUpdate("control", t);
	}
	get hostControl() {
		return this.control === "host" && !this.split;
	}
	constructor() {
		super(), typeof this.attachInternals == "function" && this.attachInternals(), this.split = !1, this.options = "", this.value = "", this.actions = !1, this.labelled = !1, this.literal = !1, this.compact = !1, this._fieldsetDisabled = !1, this.addEventListener("click", (e) => {
			this._fieldsetDisabled && (e.preventDefault(), e.stopImmediatePropagation());
		}, { capture: !0 }), this.active = !1, this.choice = !1, this.icon = !1, this.wide = !1, this.fixed = !1, this.fit = !1, this.danger = !1, this.menuItem = !1, this.primary = !1, this.secondary = !1, this.disabled = !1, this.blank = !1, this.language = "en-US", this.text = "", this.label = "", this.href = "", this.target = "", this.rel = "", this._loading = !1;
	}
	static styles = [
		Ps(Ad),
		Ps(kd),
		Ps(af)
	];
	_reflectIcon() {
		if (this.control !== "native" || this.split) return;
		let e = this.firstElementChild, t = !this.text && this.childElementCount === 1 && e?.localName === "ds-icon" && !(this.textContent ?? "").trim();
		this.toggleAttribute("icon", !!t);
	}
	syncSlottedControl() {
		if (this.control !== "slotted" || this.split) return;
		let e = this.querySelector(":scope > button");
		e && (e.disabled = this.splitDisabled);
	}
	syncSplitRole() {
		this.split && !this.hasAttribute("role") ? (this.setAttribute("role", "group"), this.splitRole = !0) : !this.split && this.splitRole && (this.removeAttribute("role"), this.splitRole = !1, this.syncControl());
	}
	updated() {
		this.syncSplitRole(), this.syncSlottedControl();
	}
	focus(e) {
		this.split ? nf(this, e) : this.control === "slotted" ? this.querySelector(":scope > :is(button, a)")?.focus(e) : this.hostControl ? super.focus(e) : this.shadowRoot?.querySelector("[part=\"control\"]")?.focus(e);
	}
	connectedCallback() {
		super.connectedCallback(), this.syncSplitRole(), this._reflectIcon(), this.syncSlottedControl(), window.addEventListener("language-changed", this.splitLanguageChanged), window.addEventListener("translations-loaded", this.splitLanguageChanged);
	}
	disconnectedCallback() {
		window.removeEventListener("language-changed", this.splitLanguageChanged), window.removeEventListener("translations-loaded", this.splitLanguageChanged), super.disconnectedCallback();
	}
	formDisabledCallback(e) {
		this._fieldsetDisabled = e, this.syncSlottedControl();
	}
	render() {
		if (this.split) return rf(this);
		let e = this.text;
		if (this.control === "slotted") return X`<slot @slotchange=${this.syncSlottedControl}></slot>`;
		if (this.hostControl) return X`<slot name="icon"></slot><slot></slot><slot name="trailing"></slot>`;
		let t = e ? X`<ds-text .text=${this.text}></ds-text>` : X`<slot @slotchange=${this._reflectIcon}></slot>`;
		if (this.href) {
			let e = this.splitDisabled, n = this.target || (this.blank ? "_blank" : ""), r = this.rel || (n === "_blank" ? "noopener noreferrer" : "");
			return X`<a
        part="control"
        ?primary=${this.primary}
        ?secondary=${this.secondary}
        href=${$(e ? void 0 : this.href)}
        target=${$(e || !n ? void 0 : n)}
        rel=${$(e || !r ? void 0 : r)}
        role=${$(e ? "link" : void 0)}
        aria-disabled=${$(e ? "true" : void 0)}
        aria-label=${$(this.label || void 0)}
        @click=${this._handleClick}
      >${t}</a>`;
		}
		return X`
      <button
        part="control"
        type="button"
        ?primary=${this.primary}
        ?secondary=${this.secondary}
        ?disabled=${this.splitDisabled}
        aria-label=${$(this.label || void 0)}
        @click=${this._handleClick}
      >
        ${t}
      </button>
    `;
	}
	_handleClick(e) {
		this.splitDisabled && (e.preventDefault(), e.stopPropagation());
	}
});
//#endregion
//#region node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/directive-helpers.js
var { I: of } = Pc, sf = (e) => e.strings === void 0, cf = {}, lf = (e, t = cf) => e._$AH = t, uf = Md(class extends Nd {
	constructor(e) {
		if (super(e), e.type !== jd.PROPERTY && e.type !== jd.ATTRIBUTE && e.type !== jd.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
		if (!sf(e)) throw Error("`live` bindings can only contain a single expression");
	}
	render(e) {
		return e;
	}
	update(e, [t]) {
		if (t === bc || t === Z) return t;
		let n = e.element, r = e.name;
		if (e.type === jd.PROPERTY) {
			if (t === n[r]) return bc;
		} else if (e.type === jd.BOOLEAN_ATTRIBUTE) {
			if (!!t === n.hasAttribute(r)) return bc;
		} else if (e.type === jd.ATTRIBUTE && n.getAttribute(r) === t + "") return bc;
		return lf(e), t;
	}
}), df = "important", ff = " !" + df, pf = Md(class extends Nd {
	constructor(e) {
		if (super(e), e.type !== jd.ATTRIBUTE || e.name !== "style" || e.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
	}
	render(e) {
		return Object.keys(e).reduce((t, n) => {
			let r = e[n];
			return r == null ? t : t + `${n = n.includes("-") ? n : n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${r};`;
		}, "");
	}
	update(e, [t]) {
		let { style: n } = e.element;
		if (this.ft === void 0) return this.ft = new Set(Object.keys(t)), this.render(t);
		for (let e of this.ft) t[e] ?? (this.ft.delete(e), e.includes("-") ? n.removeProperty(e) : n[e] = null);
		for (let e in t) {
			let r = t[e];
			if (r != null) {
				this.ft.add(e);
				let t = typeof r == "string" && r.endsWith(ff);
				e.includes("-") || t ? n.setProperty(e, t ? r.slice(0, -11) : r, t ? df : "") : n[e] = r;
			}
		}
		return bc;
	}
}), mf = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%3e%3csvg%20preserveAspectRatio='none'%20overflow='visible'%20style='display:%20block;'%20width='16'%20height='16'%20viewBox='0%200%2014.0059%208.5918'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20id='Group%2090'%3e%3cpath%20id='Vector%20(Stroke)'%20d='M7.08496%201.43051e-06C9.10892%201.43051e-06%2010.8032%201.03732%2011.9648%202.02832C12.5501%202.52762%2013.0133%203.02575%2013.3301%203.39942C13.4887%203.58653%2013.6115%203.74347%2013.6953%203.85449C13.7372%203.90995%2013.7698%203.95445%2013.792%203.98535C13.8029%204.00061%2013.8114%204.01295%2013.8174%204.02149C13.8202%204.02555%2013.8225%204.02881%2013.8242%204.03125C13.8249%204.03228%2013.8257%204.03346%2013.8262%204.03418L13.8271%204.03516C13.8273%204.03531%2013.8278%204.03638%2013.4492%204.2959L13.8271%204.55567L13.8262%204.55664C13.8256%204.55744%2013.8251%204.55929%2013.8242%204.56055C13.8225%204.563%2013.8202%204.56626%2013.8174%204.57031C13.8114%204.57887%2013.803%204.59115%2013.792%204.60645C13.7698%204.63736%2013.7372%204.68181%2013.6953%204.73731C13.6115%204.84834%2013.4887%205.00525%2013.3301%205.19238C13.0133%205.56604%2012.5501%206.06419%2011.9648%206.56348C10.8032%207.55446%209.10889%208.5918%207.08496%208.5918C5.06326%208.5918%203.33153%207.55649%202.13379%206.56836C1.53011%206.07032%201.04876%205.57301%200.717773%205.2002C0.55201%205.01348%200.422971%204.85678%200.334961%204.7461C0.291015%204.69082%200.2567%204.64695%200.233398%204.61621C0.221828%204.60095%200.213338%204.58859%200.207031%204.58008C0.203926%204.57589%200.201023%204.57277%200.199219%204.57031C0.198435%204.56924%200.197795%204.56811%200.197266%204.56738L0.196289%204.56641V4.56543L0%204.2959L0.196289%204.02637V4.02539L0.197266%204.02442C0.197805%204.02368%200.198405%204.0226%200.199219%204.02149C0.201027%204.01902%200.203896%204.01595%200.207031%204.01172C0.21333%204.00322%200.221826%203.99086%200.233398%203.97559C0.256689%203.94486%200.291044%203.90094%200.334961%203.8457C0.422971%203.73501%200.55201%203.57832%200.717773%203.3916C1.04875%203.0188%201.5301%202.52149%202.13379%202.02344C3.33153%201.03531%205.06326%203.87222e-06%207.08496%201.43051e-06ZM7.08496%200.91797C5.37308%200.917973%203.84542%201.80115%202.71777%202.73145C2.15914%203.19234%201.71191%203.65449%201.4043%204.00098C1.30562%204.11212%201.22362%204.21306%201.15527%204.2959C1.22361%204.37872%201.30565%204.47971%201.4043%204.59082C1.71192%204.93731%202.15914%205.39947%202.71777%205.86035C3.84542%206.79065%205.37308%207.67383%207.08496%207.67383C8.79447%207.67383%2010.2821%206.7926%2011.3691%205.86524C11.9082%205.40533%2012.3368%204.94438%2012.6299%204.59863C12.7272%204.48383%2012.807%204.38024%2012.873%204.2959C12.807%204.21156%2012.7272%204.10798%2012.6299%203.99317C12.3368%203.64742%2011.9082%203.18647%2011.3691%202.72656C10.2821%201.79918%208.79451%200.91797%207.08496%200.91797ZM14.0059%204.2959L13.8281%204.55567L13.4492%204.2959L13.8281%204.03613L14.0059%204.2959Z'%20fill='currentColor'/%3e%3cpath%20id='Ellipse%2040'%20d='M7.16119%201.9635C8.44936%201.9635%209.49404%203.00741%209.4942%204.29554C9.4942%205.5838%208.44946%206.62854%207.16119%206.62854C5.87307%206.62838%204.82916%205.5837%204.82916%204.29554C4.82933%203.00751%205.87317%201.96367%207.16119%201.9635Z'%20fill='currentColor'%20stroke='currentColor'%20stroke-width='0.81'/%3e%3c/g%3e%3c/svg%3e%3c/svg%3e", hf = "data:image/svg+xml,%3csvg%20preserveAspectRatio='none'%20overflow='visible'%20style='display:%20block;'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20id='Unsee'%3e%3cg%20id='Vector'%3e%3cpath%20d='M12.4541%2012.789L13.1743%2012.0688L12.6027%2011.4967L12.6%2011.4994L12.0137%2010.9144C11.7332%2011.103%2011.4336%2011.283%2011.1164%2011.4457L11.4068%2011.7363L11.4046%2011.7385L12.4541%2012.789Z'%20fill='currentColor'/%3e%3cpath%20d='M5.96371%206.28858L9.79315%2010.1213C10.0642%209.91923%2010.2966%209.66817%2010.4772%209.38122L6.69735%205.60959C6.41317%205.78931%206.16435%206.01991%205.96371%206.28858Z'%20fill='currentColor'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M3.68238%204.00893L3.09583%203.42184L3.79957%202.7181L3.816%202.70167L5.35651%204.24363L6.05746%204.94524L6.712%205.6004L10.4818%209.3738L11.3559%2010.2487L12.0181%2010.9115L12.6027%2011.4967L12.6%2011.4994L12.0137%2010.9144C11.7332%2011.103%2011.4336%2011.283%2011.1164%2011.4457L11.4068%2011.7363L11.4046%2011.7385L11.1136%2011.4472L10.4275%2010.7604L9.79075%2010.1231L5.96207%206.29078L5.08276%205.41064L4.4124%204.73965L3.68238%204.00893ZM12.6382%2010.4584C12.7502%2010.37%2012.8582%2010.2812%2012.9619%2010.1927C13.5472%209.69339%2014.0104%209.19525%2014.3271%208.82159C14.4858%208.63445%2014.6085%208.47754%2014.6924%208.36651C14.7343%208.31101%2014.7669%208.26656%2014.7891%208.23565L14.7965%208.22527L14.8089%208.20741L14.8145%208.19952L14.8213%208.18975C14.8218%208.18905%2014.8222%208.18816%2014.8225%208.18737L14.8232%208.18584L14.8242%208.18487L15.0029%207.9251L14.8252%207.66534L14.4463%207.9251C14.8248%207.66558%2014.8243%207.66451%2014.8242%207.66436L14.8232%207.66338L14.8213%207.66045L14.8145%207.65069C14.8085%207.64215%2014.8%207.62981%2014.7891%207.61456C14.7669%207.58365%2014.7343%207.53915%2014.6924%207.4837C14.6085%207.37267%2014.4858%207.21573%2014.3271%207.02862C14.0104%206.65495%2013.5472%206.15683%2012.9619%205.65752C11.8003%204.66653%2010.106%203.6292%208.08203%203.6292C7.38933%203.6292%206.73067%203.75075%206.11587%203.95029L6.86093%204.69373C7.25481%204.60012%207.6629%204.54717%208.08203%204.54717C9.79158%204.54717%2011.2792%205.42838%2012.3662%206.35577C12.9053%206.81568%2013.3338%207.27662%2013.627%207.62237C13.7119%207.72259%2013.7835%207.81426%2013.8443%207.89203L13.8701%207.9251L13.8442%207.95828C13.7834%208.03604%2013.7119%208.12766%2013.627%208.22784C13.3338%208.57358%2012.9053%209.03453%2012.3662%209.49444C12.2436%209.599%2012.116%209.70298%2011.9835%209.80517L12.6382%2010.4584ZM5.58478%206.99004L9.09135%2010.4996C8.80023%2010.6051%208.48611%2010.6626%208.15857%2010.6626C6.64663%2010.6626%205.42096%209.43698%205.42096%207.92504C5.42096%207.59666%205.47878%207.28179%205.58478%206.99004ZM10.371%2011.7804L9.65051%2011.0593C9.15436%2011.2126%208.62958%2011.303%208.08203%2011.303C6.37015%2011.303%204.84249%2010.4199%203.71484%209.48956C3.15622%209.02867%202.70899%208.56651%202.40137%208.22002C2.31556%208.12337%202.24231%208.03438%202.17972%207.95834L2.15234%207.9251L2.17972%207.89186C2.24231%207.81582%202.31553%207.72686%202.40137%207.63018C2.70898%207.2837%203.15621%206.82154%203.71484%206.36065C3.93564%206.17849%204.17177%205.99815%204.42162%205.82588L3.76309%205.16679C3.53867%205.32681%203.32756%205.49036%203.13086%205.65264C2.52717%206.15069%202.04582%206.648%201.71484%207.02081C1.54908%207.20752%201.42004%207.36422%201.33203%207.47491C1.28811%207.53015%201.25376%207.57406%201.23047%207.60479C1.22314%207.61446%201.21704%207.62297%201.21196%207.63006L1.2041%207.64092C1.20236%207.64328%201.20069%207.64527%201.19925%207.647L1.19629%207.65069L1.19434%207.65362L1.19336%207.65557L0.99707%207.9251L1.19336%208.19561L1.19434%208.19659L1.19629%208.19952L1.19926%208.20322C1.20071%208.20496%201.20238%208.20695%201.2041%208.20928L1.21195%208.22013C1.21704%208.22723%201.22314%208.23575%201.23047%208.24541C1.25377%208.27615%201.28809%208.32002%201.33203%208.3753C1.42004%208.48599%201.54908%208.64268%201.71484%208.8294C2.04583%209.20221%202.52718%209.69952%203.13086%2010.1976C4.3286%2011.1857%206.06033%2012.221%208.08203%2012.221C8.90391%2012.221%209.67144%2012.0499%2010.371%2011.7804ZM10.8048%208.62904C10.8644%208.40441%2010.8962%208.16843%2010.8962%207.92504C10.8962%206.4131%209.6705%205.18743%208.15857%205.18743C7.91309%205.18743%207.67517%205.21974%207.44881%205.28034L10.8048%208.62904ZM9.79315%2010.1213L5.96371%206.28858C6.16435%206.01991%206.41317%205.78931%206.69735%205.60959L10.4772%209.38122C10.2966%209.66817%2010.0642%209.91923%209.79315%2010.1213Z'%20fill='currentColor'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e", gf = "[data-ds-shape=square],:host([data-ds-shape=square]){--ds-corner-size:0px;--ds-corner-shape:round;--ds-button-inset:.5px}[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:4px;--ds-corner-shape:round;--ds-button-inset:2.5px}[data-ds-shape=circular],:host([data-ds-shape=circular]){--ds-corner-size:999px;--ds-corner-shape:round;--ds-button-inset:5px}@supports (corner-shape:squircle){[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:8px;--ds-corner-shape:squircle}}:root,:host,:where([data-ds-surface]){--ds-unit:calc(var(--ds-1,20px) * var(--ds-sf,1));--ds-control-height:calc(var(--ds-control-size,var(--ds-08,16px)) * var(--ds-sf,1));--ds-row-height:calc(var(--ds-row-size,var(--ds-1,20px)) * var(--ds-sf,1));--ds-type-size-default:calc(var(--ds-text-size,14px) * var(--ds-sf,1));--ds-type-size-small:calc(var(--ds-small-text-size,10px) * var(--ds-sf,1));--ds-type-size-heading:calc(var(--ds-heading-text-size,13px) * var(--ds-sf,1));--ds-type-size-display:calc(var(--ds-display-text-size,20px) * var(--ds-sf,1));--ds-type-lineheight-default:calc(var(--ds-text-leading,16px) * var(--ds-sf,1));--ds-type-letterspacing-default:calc(var(--ds-text-tracking,-.3px) * var(--ds-sf,1));--ds-radius:calc(var(--ds-corner-size,4px) * var(--ds-sf,1));--ds-radius-card:calc(var(--ds-card-corner-size,4px) * var(--ds-sf,1))}:host{width:100%;display:block}.input-wrapper{flex-direction:column;gap:0;width:100%;display:flex}label{font-family:var(--ds-typeface-regular);font-size:var(--ds-type-size-default);line-height:var(--ds-row-height);color:var(--ds-text-color)}.input-container{align-items:center;width:100%;display:flex;position:relative}:is(input,textarea){background:var(--base-light-grey,#e8e8e8);padding:0 calc(2px * var(--ds-sf,1));font-size:var(--ds-type-size-default);font-family:var(--ds-typeface-regular);color:var(--base-darker-grey,#797979);line-height:calc(16px * var(--ds-sf,1));letter-spacing:calc(-.4px * var(--ds-sf,1));opacity:.5;height:var(--ds-input-height,calc(16px * var(--ds-sf,1)));box-sizing:border-box;border:none;outline:none;width:100%}:is(input,textarea):focus{opacity:1;color:var(--base-slate,#1e1e1e);outline:none}input{border-radius:var(--ds-input-radius,var(--ds-radius));corner-shape:var(--ds-corner-shape,round)}:is(input,textarea)::placeholder{color:var(--base-darker-grey,#797979);opacity:.5}:is(input,textarea):disabled{cursor:not-allowed;opacity:.5}:is(input,textarea):read-only{background-color:var(--input-readonly-background,#fafafa)}:host([variant=filled]) :is(input,textarea){background-color:var(--input-filled-background,var(--surface-color-secondary,#f5f5f5));border:none;border-bottom:2px solid var(--border-color,#ccc);border-radius:calc(var(--025) * var(--ds-sf,1)) calc(var(--025) * var(--ds-sf,1)) 0 0}:host([variant=filled]) :is(input,textarea):focus{border-bottom-color:var(--accent-color,#007aff);box-shadow:none}:host([variant=outlined]) :is(input,textarea){border:2px solid var(--border-color,#ccc);background-color:#0000}:host([variant=outlined]) :is(input,textarea):focus{border-color:var(--accent-color,#007aff)}.input-wrapper.has-error{grid-template-columns:minmax(0,1fr);grid-auto-rows:minmax(var(--ds-input-control-row,var(--ds-row-height)), auto);align-items:start;display:grid}.error-message{min-width:0;color:var(--ds-danger-color);font-family:var(--ds-typeface-regular);font-feature-settings:var(--ds-font-features);font-size:var(--ds-type-size-default);font-weight:var(--ds-type-weight-default);line-height:var(--ds-unit);letter-spacing:var(--ds-type-letterspacing-default);margin:0}.error-message>ds-text{display:block}:host([required]) label:after{content:\" *\";color:var(--ds-danger-color)}:is(input,textarea).has-error{border-color:var(--ds-danger-color)}:is(input,textarea).has-error:focus{box-shadow:0 0 0 2px color-mix(in srgb, var(--ds-danger-color) 20%, transparent)}:host([variant=row]){box-sizing:border-box;padding-top:calc(2px * var(--ds-sf,1));--ds-input-control-row:calc(18px * var(--ds-sf,1))}:host([variant=row]) .input-container,:host([variant=row]) :is(input,textarea){box-sizing:border-box;height:calc(18px * var(--ds-sf,1));min-height:calc(18px * var(--ds-sf,1));max-height:calc(18px * var(--ds-sf,1))}:host([variant=row]) :is(input,textarea){line-height:calc(16px * var(--ds-sf,1));background:var(--ds-input-background);color:var(--ds-input-color);opacity:1;border-radius:0;margin:0;padding-block:0}:host([variant=row]) :is(input,textarea)::placeholder{color:var(--ds-input-placeholder-color);opacity:1}:host([variant=row]) :is(input,textarea):focus{background:var(--ds-input-background);color:var(--ds-input-color);box-shadow:inset 0 0 0 1px var(--ds-accent-color);opacity:1}:host([variant=row]) :is(input,textarea):disabled{opacity:1;background:var(--ds-input-background);color:var(--ds-input-disabled-color);-webkit-text-fill-color:var(--ds-input-disabled-color)}:host([quiet-focus]) :is(input,textarea):focus,:host([quiet-focus]) :is(input,textarea):focus-visible,:host([quiet-focus]) .input-container:focus-within{box-shadow:none!important;outline:none!important}:is(input,textarea).has-reveal{padding-inline-end:calc(24px * var(--ds-sf,1))}.password-visibility{inset-inline-end:0;height:100%;width:calc(24px * var(--ds-sf,1));color:var(--ds-input-reveal-color);cursor:pointer;background:0 0;border:0;place-items:center;padding:0;display:grid;position:absolute;top:0}.password-visibility:focus-visible{outline-offset:-1px;outline:1px solid}.password-visibility:disabled{cursor:default;opacity:.5}.password-visibility span{width:calc(16px * var(--ds-sf,1));height:calc(16px * var(--ds-sf,1));-webkit-mask:var(--eye-icon) center / 100% 100% no-repeat;mask:var(--eye-icon) center / 100% 100% no-repeat;background:currentColor;display:block}@supports (corner-shape:squircle){:is(input,textarea){corner-shape:var(--ds-corner-shape,squircle)}}:host([variant=field]) :is(input,textarea),:host([variant=plain]) :is(input,textarea){height:var(--ds-input-height,var(--ds-row-height));padding:var(--ds-input-padding,0 calc(4px * var(--ds-sf)));border:var(--ds-input-border,1px solid var(--ds-border-color));border-radius:var(--ds-input-radius,var(--ds-radius));background:var(--ds-input-field-background,var(--ds-fill));color:var(--ds-text-color);opacity:1;font-size:var(--ds-type-size-default);line-height:var(--ds-type-lineheight-default);letter-spacing:var(--ds-type-letterspacing-default)}:host([variant=plain]) :is(input,textarea){padding:var(--ds-input-padding,0);background:0 0;border:0;border-radius:0}:host([variant=field]) :is(input,textarea)::placeholder,:host([variant=plain]) :is(input,textarea)::placeholder{color:var(--ds-text-color-muted);opacity:1}:host([variant=field]) :is(input,textarea):focus{outline:1px solid var(--ds-focus-ring);outline-offset:-1px}:host([variant=field]) :is(input,textarea):disabled,:host([variant=plain]) :is(input,textarea):disabled{opacity:.5}:host([variant=field]) :is(input,textarea).has-reveal,:host([variant=plain]) :is(input,textarea).has-reveal{padding-inline-end:calc(24px * var(--ds-sf))}.row-metric{width:0;height:var(--ds-row-height);visibility:hidden;pointer-events:none;position:absolute;overflow:hidden}:host([variant=field]) textarea{border-radius:var(--ds-textarea-radius,calc(4px * var(--ds-sf)));corner-shape:var(--ds-textarea-corner-shape,squircle)}:host([variant]) textarea{height:var(--ds-textarea-height,calc(var(--ds-textarea-rows,3) * var(--ds-row-height)));min-height:var(--ds-row-height);padding:var(--ds-textarea-padding,calc(4px * var(--ds-sf)));resize:vertical}:host([variant=plain]) textarea{padding:0}:host([auto-grow]) textarea{resize:none}", _f = {
	email: "email",
	tel: "tel",
	url: "url",
	password: "current-password"
};
Bc("ds-input", class e extends Rc {
	static formAssociated = !0;
	focusFromLabel = (e) => {
		e.composedPath()[0] === this && !this.disabled && !this._formDisabled && this.focus();
	};
	internals = typeof this.attachInternals == "function" ? this.attachInternals() : null;
	initialValue;
	static properties = {
		type: {
			type: String,
			reflect: !0
		},
		multiline: {
			type: Boolean,
			reflect: !0
		},
		rows: { type: Number },
		maxRows: {
			type: Number,
			attribute: "max-rows"
		},
		autoGrow: {
			type: Boolean,
			attribute: "auto-grow",
			reflect: !0
		},
		wrap: { type: String },
		inputMode: {
			type: String,
			attribute: "inputmode"
		},
		enterKeyHint: {
			type: String,
			attribute: "enterkeyhint"
		},
		list: { type: String },
		suggestions: { attribute: !1 },
		ariaLabel: {
			type: String,
			attribute: "aria-label"
		},
		ariaLabelledBy: {
			type: String,
			attribute: "aria-labelledby"
		},
		ariaDescribedBy: {
			type: String,
			attribute: "aria-describedby"
		},
		spellcheckHint: {
			type: String,
			attribute: "spellcheck"
		},
		ariaInvalid: {
			type: String,
			attribute: "aria-invalid"
		},
		revealable: {
			type: Boolean,
			reflect: !0
		},
		quietFocus: {
			type: Boolean,
			attribute: "quiet-focus",
			reflect: !0
		},
		_passwordVisible: {
			type: Boolean,
			state: !0
		},
		_formDisabled: {
			type: Boolean,
			state: !0
		},
		name: {
			type: String,
			reflect: !0
		},
		value: { type: String },
		placeholder: { type: String },
		placeholderKey: {
			type: String,
			attribute: "placeholder-key"
		},
		label: { type: String },
		labelText: {
			type: String,
			attribute: "label-text"
		},
		disabled: {
			type: Boolean,
			reflect: !0
		},
		readonly: {
			type: Boolean,
			reflect: !0
		},
		required: {
			type: Boolean,
			reflect: !0
		},
		autofocus: { type: Boolean },
		autocomplete: { type: String },
		pattern: { type: String },
		minlength: { type: Number },
		maxlength: { type: Number },
		min: { type: String },
		max: { type: String },
		step: { type: String },
		variant: {
			type: String,
			reflect: !0
		},
		error: { type: String },
		errorText: {
			type: String,
			attribute: "error-text"
		},
		_focused: {
			type: Boolean,
			state: !0
		},
		_placeholder: {
			type: String,
			state: !0
		},
		_currentLanguage: {
			type: String,
			state: !0
		}
	};
	resizeFrame = 0;
	measuredWidth = 0;
	resizeObserver;
	fontsChanged = () => this.resizeToContent();
	listObserver;
	boundHandlers;
	constructor() {
		super(), this.type = "text", this.multiline = !1, this.rows = 3, this.maxRows = 10, this.autoGrow = !1, this.wrap = "soft", this.inputMode = "", this.enterKeyHint = "", this.list = "", this.suggestions = [], this.ariaLabel = "", this.ariaLabelledBy = "", this.ariaDescribedBy = "", this.spellcheckHint = "", this.ariaInvalid = "", this.revealable = !1, this.quietFocus = !1, this._passwordVisible = !1, this._formDisabled = !1, this.name = "", this.value = "", this.placeholder = "", this.placeholderKey = "", this.label = "", this.labelText = "", this.disabled = !1, this.readonly = !1, this.required = !1, this.autofocus = !1, this.autocomplete = "", this.pattern = "", this.minlength = 0, this.maxlength = -1, this.min = "", this.max = "", this.step = "", this.variant = "default", this.error = "", this.errorText = "", this._focused = !1, this._placeholder = "", this._currentLanguage = ed.value, this.boundHandlers = { languageChanged: (() => {
			this._currentLanguage = ed.value, this._loadPlaceholder(), this.requestUpdate();
		}) };
	}
	static styles = Ps(gf);
	connectedCallback() {
		if (super.connectedCallback(), this._currentLanguage = ed.value, this._loadPlaceholder(), this.addEventListener("click", this.focusFromLabel), window.addEventListener("language-changed", this.boundHandlers.languageChanged), window.addEventListener("translations-loaded", this.boundHandlers.languageChanged), typeof ResizeObserver < "u") {
			this.resizeObserver = new ResizeObserver((e) => {
				(this.clientWidth !== this.measuredWidth || e.some((e) => e.target !== this)) && (this.measuredWidth = this.clientWidth, this.resizeToContent());
			}), this.resizeObserver.observe(this);
			let e = this.shadowRoot?.querySelector(".row-metric");
			e && this.resizeObserver.observe(e);
		}
		document.fonts?.addEventListener("loadingdone", this.fontsChanged);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.removeEventListener("click", this.focusFromLabel), window.removeEventListener("language-changed", this.boundHandlers.languageChanged), window.removeEventListener("translations-loaded", this.boundHandlers.languageChanged), this.listObserver?.disconnect(), this.listObserver = void 0, this.resizeObserver?.disconnect(), document.fonts?.removeEventListener("loadingdone", this.fontsChanged), cancelAnimationFrame(this.resizeFrame);
	}
	firstUpdated() {
		this.autofocus && this.focus();
		let e = this.shadowRoot?.querySelector(".row-metric");
		e && this.resizeObserver?.observe(e);
	}
	willUpdate(e) {
		e.has("multiline") && this.multiline && this.variant === "default" && !this.hasAttribute("variant") && (this.variant = "field");
	}
	updated(e) {
		super.updated(e), (e.has("placeholder") || e.has("placeholderKey")) && this._loadPlaceholder(), this.initialValue === void 0 && (this.initialValue = this.value), e.has("type") && this.type !== "password" && (this._passwordVisible = !1), this.multiline && this.resizeToContent(), e.has("list") && this.observeList(), this.syncForm();
	}
	listSource() {
		if (!this.list) return null;
		let e = this.getRootNode().getElementById?.(this.list);
		return e instanceof HTMLDataListElement ? e : null;
	}
	observeList() {
		this.listObserver?.disconnect(), this.listObserver = void 0;
		let e = this.listSource();
		e && typeof MutationObserver < "u" && (this.listObserver = new MutationObserver(() => this.requestUpdate()), this.listObserver.observe(e, {
			childList: !0,
			subtree: !0,
			attributes: !0,
			characterData: !0
		}));
	}
	suggestionOptions() {
		if (this.suggestions?.length) return this.suggestions.map((e) => typeof e == "string" ? { value: e } : e);
		let e = this.listSource();
		return e ? [...e.options].map((e) => ({
			value: e.value,
			label: e.label === e.value ? void 0 : e.label
		})) : [];
	}
	renderSuggestions(e) {
		return e.length ? X`<datalist id="suggestions">${e.map((e) => X`<option value=${e.value} label=${$(e.label)}></option>`)}</datalist>` : null;
	}
	get input() {
		return this.shadowRoot?.querySelector("input, textarea") ?? null;
	}
	get isMultiline() {
		return this.multiline;
	}
	get selectionStart() {
		return this.input?.selectionStart ?? null;
	}
	get selectionEnd() {
		return this.input?.selectionEnd ?? null;
	}
	setSelectionRange(e, t, n) {
		this.input?.setSelectionRange(e, t, n);
	}
	get valueAsNumber() {
		let e = this.input;
		return e instanceof HTMLInputElement ? e.valueAsNumber : NaN;
	}
	get labels() {
		return this.internals?.labels;
	}
	get form() {
		return this.internals?.form ?? null;
	}
	get validity() {
		return this.input?.validity;
	}
	get validationMessage() {
		return this.input?.validationMessage ?? "";
	}
	get willValidate() {
		return this.input?.willValidate ?? !1;
	}
	syncForm() {
		let e = this.input;
		if (!e) return;
		this.internals?.setFormValue(this.disabled || this._formDisabled ? null : this.value);
		let t = this.errorText ? bd(this.errorText) : this.error;
		e.setCustomValidity(t || ""), this.internals?.setValidity(e.validity, e.validationMessage, e);
	}
	checkValidity() {
		return this.syncForm(), this.input?.checkValidity() ?? !0;
	}
	reportValidity() {
		return this.syncForm(), this.input?.reportValidity() ?? !0;
	}
	formDisabledCallback(e) {
		this._formDisabled = e, queueMicrotask(() => {
			this.isConnected && this.requestUpdate();
		});
	}
	formResetCallback() {
		this.value = this.getAttribute("value") ?? this.initialValue ?? "", this._passwordVisible = !1, this.internals?.setFormValue(this.value), this.dispatchEvent(new Event("input-reset", {
			bubbles: !0,
			composed: !0
		}));
	}
	formStateRestoreCallback(e) {
		typeof e == "string" && (this.value = e, this.internals?.setFormValue(e));
	}
	resolvedAutocomplete() {
		if (this.autocomplete) return this.autocomplete;
		if (!this.multiline) return _f[this.type];
	}
	accessibleLabel() {
		if (this.ariaLabel) return this.ariaLabel;
		let e = this.getRootNode();
		return (this.ariaLabelledBy ?? "").split(/\s+/).filter(Boolean).map((t) => {
			let n = e.getElementById?.(t), r = n?.getAttribute("text");
			return r ? bd(r) : n?.textContent?.trim() ?? "";
		}).join(" ").trim() || Array.from(this.internals?.labels ?? []).map((e) => e.textContent?.trim() ?? "").join(" ").trim() || void 0;
	}
	togglePassword() {
		let e = this.input;
		if (!(e instanceof HTMLInputElement) || this.disabled || this._formDisabled) return;
		let t = e.selectionStart, n = e.selectionEnd;
		this._passwordVisible = !this._passwordVisible, e.type = this._passwordVisible ? "text" : "password", t !== null && n !== null && e.setSelectionRange(t, n);
	}
	handleKeyDown(t) {
		t.key !== "Enter" || t.isComposing || t.keyCode === 229 || t.altKey || t.ctrlKey || t.metaKey || t.shiftKey || setTimeout(() => {
			let n = this.form;
			if (t.defaultPrevented || !n || this.disabled || this._formDisabled) return;
			let r = Array.from(n.elements), i = r.find((e) => e instanceof HTMLButtonElement && e.type === "submit" || e instanceof HTMLInputElement && e.type === "submit");
			if (i) {
				i.disabled || i.click();
				return;
			}
			let a = /* @__PURE__ */ new Set([
				"text",
				"search",
				"url",
				"tel",
				"email",
				"password",
				"date",
				"month",
				"week",
				"time",
				"datetime-local",
				"number"
			]);
			r.filter((t) => (t instanceof HTMLInputElement || t instanceof e) && a.has(t.type)).length === 1 && n.requestSubmit();
		}, 0);
	}
	handleChange(e) {
		e.stopPropagation(), this.value = e.target.value, this.syncForm(), this.dispatchEvent(new Event("change", {
			bubbles: !0,
			composed: !0
		}));
	}
	_loadPlaceholder() {
		let e = this.placeholderKey || this.placeholder;
		if (!e) this._placeholder = "", this.requestUpdate();
		else {
			try {
				let t = bd(e);
				this._placeholder = t || e;
			} catch {
				this._placeholder = e;
			}
			this.requestUpdate();
		}
	}
	_handleInput(e) {
		let t = e.target;
		this.value = t.value, this.syncForm(), this.dispatchEvent(new CustomEvent("input-change", {
			detail: {
				value: this.value,
				name: this.name
			},
			bubbles: !0,
			composed: !0
		}));
	}
	_handleFocus() {
		this._focused = !0, this.dispatchEvent(new CustomEvent("input-focus", { bubbles: !0 }));
	}
	_handleBlur() {
		this._focused = !1, this.dispatchEvent(new CustomEvent("input-blur", { bubbles: !0 }));
	}
	renderNow() {
		this.performUpdate();
	}
	focus(e) {
		this.input?.focus(e);
	}
	blur() {
		this.input?.blur();
	}
	select() {
		this.input?.select();
	}
	resizeToContent() {
		cancelAnimationFrame(this.resizeFrame);
		let e = this.input;
		e && this.multiline && (this.autoGrow ? this.resizeFrame = requestAnimationFrame(() => {
			if (!this.isConnected) return;
			let t = getComputedStyle(e), n = parseFloat(t.getPropertyValue("--ds-row-height")) || 20 * (parseFloat(t.getPropertyValue("--ds-sf")) || 1), r = Math.max(1, Math.floor(this.rows || 1)) * n, i = Math.max(r, Math.floor(this.maxRows || this.rows || 1) * n);
			e.style.height = "0px";
			let a = parseFloat(t.borderTopWidth) + parseFloat(t.borderBottomWidth), o = Math.ceil((e.scrollHeight + a) / n) * n;
			e.style.height = `${Math.max(r, Math.min(i, o))}px`, e.style.overflowY = o > i ? "auto" : "hidden";
		}) : (e.style.height = "", e.style.overflowY = ""));
	}
	renderMultiline(e, t) {
		let n = Math.max(1, Math.floor(this.rows || 1));
		return X`<span class="row-metric" aria-hidden="true"></span><textarea
      id="input"
      part="input"
      aria-label=${$(this.accessibleLabel())}
      aria-invalid=${$(this.ariaInvalid || (e ? "true" : void 0))}
      aria-describedby=${$([t ? "description" : "", e ? "error" : ""].filter(Boolean).join(" ") || void 0)}
      inputmode=${$(this.inputMode || void 0)}
      enterkeyhint=${$(this.enterKeyHint || void 0)}
      spellcheck=${$(this.spellcheckHint || void 0)}
      .name=${this.name}
      .value=${uf(this.value)}
      .placeholder=${this._placeholder || this.placeholder}
      ?disabled=${this.disabled || this._formDisabled}
      ?readonly=${this.readonly}
      ?required=${this.required}
      ?autofocus=${this.autofocus}
      autocomplete=${$(this.resolvedAutocomplete())}
      minlength=${$(this.minlength || void 0)}
      maxlength=${$(this.maxlength >= 0 ? this.maxlength : void 0)}
      rows=${n}
      wrap=${this.wrap || "soft"}
      style=${pf({ "--ds-textarea-rows": String(n) })}
      class=${e ? "has-error" : ""}
      @input=${this._handleInput}
      @change=${this.handleChange}
      @focus=${this._handleFocus}
      @blur=${this._handleBlur}
    ></textarea>`;
	}
	renderControl(e, t) {
		if (this.multiline) return this.renderMultiline(e, t);
		let n = this.suggestionOptions();
		return X`<input
      id="input"
      part="input"
      .type=${this.type === "password" && this._passwordVisible ? "text" : this.type}
      aria-label=${$(this.accessibleLabel())}
      aria-invalid=${$(this.ariaInvalid || (e ? "true" : void 0))}
      aria-describedby=${$([t ? "description" : "", e ? "error" : ""].filter(Boolean).join(" ") || void 0)}
      inputmode=${$(this.inputMode || void 0)}
      enterkeyhint=${$(this.enterKeyHint || void 0)}
      list=${$(n.length ? "suggestions" : void 0)}
      spellcheck=${$(this.spellcheckHint || void 0)}
      .name=${this.name}
      .value=${uf(this.value)}
      .placeholder=${this._placeholder || this.placeholder}
      ?disabled=${this.disabled || this._formDisabled}
      ?readonly=${this.readonly}
      ?required=${this.required}
      ?autofocus=${this.autofocus}
      autocomplete=${$(this.resolvedAutocomplete())}
      pattern=${$(this.pattern || void 0)}
      minlength=${$(this.minlength || void 0)}
      maxlength=${$(this.maxlength >= 0 ? this.maxlength : void 0)}
      min=${$(this.min || void 0)}
      max=${$(this.max || void 0)}
      step=${$(this.step || void 0)}
      class=${[e ? "has-error" : "", this.revealable && this.type === "password" ? "has-reveal" : ""].join(" ")}
      @input=${this._handleInput}
      @change=${this.handleChange}
      @keydown=${this.handleKeyDown}
      @focus=${this._handleFocus}
      @blur=${this._handleBlur}
    />${this.renderSuggestions(n)}`;
	}
	render() {
		let e = !!(this.error || this.errorText), t = this.getRootNode(), n = (this.ariaDescribedBy ?? "").split(/\s+/).filter(Boolean).map((e) => t.getElementById?.(e)?.textContent?.trim() ?? "").filter(Boolean).join(" ");
		return X`
      <div class=${e ? "input-wrapper has-error" : "input-wrapper"}>
        ${this.label || this.labelText ? X`
                <label for="input">
                  ${this.labelText ? X`<ds-text .text=${this.labelText}></ds-text>` : this.label}
                </label>
              ` : null}

        <div class="input-container">
          ${this.renderControl(e, n)}
          ${!this.isMultiline && this.revealable && this.type === "password" ? X`
                  <button
                    class="password-visibility"
                    part="reveal"
                    type="button"
                    aria-label=${bd(this._passwordVisible ? "Hide password" : "Show password")}
                    aria-pressed=${String(this._passwordVisible)}
                    ?disabled=${this.disabled || this._formDisabled}
                    @pointerdown=${(e) => e.preventDefault()}
                    @keydown=${(e) => {
			(e.key === "Enter" || e.key === " ") && e.stopPropagation();
		}}
                    @click=${this.togglePassword}
                  >
                    <span
                      aria-hidden="true"
                      style=${`--eye-icon: url("${this._passwordVisible ? hf : mf}")`}
                    ></span>
                  </button>
                ` : null}
        </div>

        ${n ? X`<span id="description" hidden>${n}</span>` : null}
        ${e ? X`
                <div id="error" class="error-message" role="status">
                  ${this.errorText ? X`<ds-text wrap .text=${this.errorText}></ds-text>` : this.error}
                </div>
              ` : null}
      </div>
    `;
	}
});
//#endregion
//#region src/vendor/ds1/0-face/keys.ts
var vf = {
	"key.ctrl": "Ctrl",
	"key.shift": "Shift",
	"key.alt": "Alt",
	"key.enter": "Enter",
	"key.escape": "Esc",
	"key.tab": "Tab",
	"key.space": "Space",
	"key.backspace": "Backspace",
	"key.delete": "Del",
	"key.home": "Home",
	"key.end": "End",
	"key.pageup": "PgUp",
	"key.pagedown": "PgDn"
}, yf = Symbol.for("design-system-1.translate"), bf = null;
function xf(e) {
	if (typeof bf == "function") return bf(e);
	let t = bf?.[e];
	if (t !== void 0) return t;
	let n = globalThis[yf];
	if (typeof n == "function") {
		let t = String(n(e));
		if (t && t !== e) return t;
	}
	return vf[e];
}
function Sf() {
	if (typeof navigator > "u") return !1;
	let e = navigator.userAgentData?.platform || navigator.platform || "";
	return /mac|iphone|ipad|ipod|ios/i.test(e);
}
var Cf = (e) => e?.platform ?? (Sf() ? "apple" : "other"), wf = {
	esc: "escape",
	return: "enter",
	del: "delete",
	up: "arrowup",
	down: "arrowdown",
	left: "arrowleft",
	right: "arrowright",
	spacebar: "space",
	" ": "space",
	pgup: "pageup",
	pgdn: "pagedown",
	cmd: "meta",
	command: "meta",
	control: "ctrl",
	option: "alt",
	opt: "alt"
};
function Tf(e, t) {
	let n = Cf(t) === "apple", r = e.trim().toLowerCase().split("+").map((e) => e.trim()), i = r[r.length - 1] === "" ? "plus" : r.pop(), a = {
		ctrl: !1,
		meta: !1,
		alt: !1,
		shift: !1,
		key: wf[i] ?? i
	};
	for (let t of r) {
		let r = wf[t] ?? t;
		if (r === "mod") a[n ? "meta" : "ctrl"] = !0;
		else if (r === "ctrl" || r === "meta" || r === "alt" || r === "shift") a[r] = !0;
		else if (r !== "") throw Error(`Unknown modifier in shortcut "${e}": ${t}`);
	}
	if (!a.key) throw Error(`A shortcut names a key: "${e}"`);
	return a;
}
var Ef = {
	enter: "↩",
	escape: "⎋",
	tab: "⇥",
	backspace: "⌫",
	delete: "⌦",
	home: "↖",
	end: "↘",
	pageup: "⇞",
	pagedown: "⇟"
}, Df = {
	arrowup: "↑",
	arrowdown: "↓",
	arrowleft: "←",
	arrowright: "→"
}, Of = {
	enter: "key.enter",
	escape: "key.escape",
	tab: "key.tab",
	space: "key.space",
	backspace: "key.backspace",
	delete: "key.delete",
	home: "key.home",
	end: "key.end",
	pageup: "key.pageup",
	pagedown: "key.pagedown"
};
function kf(e, t) {
	return Df[e] ? Df[e] : e === "plus" ? "+" : t && Ef[e] ? Ef[e] : Of[e] ? xf(Of[e]) : /^f\d{1,2}$/.test(e) ? e.toUpperCase() : e === "insert" ? "Ins" : e.length === 1 ? e.toUpperCase() : e[0].toUpperCase() + e.slice(1);
}
function Af(e, t) {
	let n = Cf(t) === "apple", r = Tf(e, t), i = kf(r.key, n);
	return n ? `${r.ctrl ? "⌃" : ""}${r.alt ? "⌥" : ""}${r.shift ? "⇧" : ""}${r.meta ? "⌘" : ""}${i}` : [
		r.meta ? "Meta" : "",
		r.ctrl ? xf("key.ctrl") : "",
		r.alt ? xf("key.alt") : "",
		r.shift ? xf("key.shift") : "",
		i
	].filter(Boolean).join("+");
}
//#endregion
//#region src/vendor/ds1/x-icon/chevron-down.svg?raw
var jf = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.25 6.25L8 10L11.75 6.25\" stroke=\"currentColor\"/>\n</svg>\n", Mf = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.68649 11.884L12.443 6.13601L11.736 5.42715L6.68835 10.4827L4.26399 8.0501L3.55696 8.74525L6.68649 11.884Z\" fill=\"currentColor\"/>\n</svg>\n", Nf = "[data-ds-shape=square],:host([data-ds-shape=square]){--ds-corner-size:0px;--ds-corner-shape:round;--ds-button-inset:.5px}[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:4px;--ds-corner-shape:round;--ds-button-inset:2.5px}[data-ds-shape=circular],:host([data-ds-shape=circular]){--ds-corner-size:999px;--ds-corner-shape:round;--ds-button-inset:5px}@supports (corner-shape:squircle){[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:8px;--ds-corner-shape:squircle}}:root,:host,:where([data-ds-surface]){--ds-unit:calc(var(--ds-1,20px) * var(--ds-sf,1));--ds-control-height:calc(var(--ds-control-size,var(--ds-08,16px)) * var(--ds-sf,1));--ds-row-height:calc(var(--ds-row-size,var(--ds-1,20px)) * var(--ds-sf,1));--ds-type-size-default:calc(var(--ds-text-size,14px) * var(--ds-sf,1));--ds-type-size-small:calc(var(--ds-small-text-size,10px) * var(--ds-sf,1));--ds-type-size-heading:calc(var(--ds-heading-text-size,13px) * var(--ds-sf,1));--ds-type-size-display:calc(var(--ds-display-text-size,20px) * var(--ds-sf,1));--ds-type-lineheight-default:calc(var(--ds-text-leading,16px) * var(--ds-sf,1));--ds-type-letterspacing-default:calc(var(--ds-text-tracking,-.3px) * var(--ds-sf,1));--ds-radius:calc(var(--ds-corner-size,4px) * var(--ds-sf,1));--ds-radius-card:calc(var(--ds-card-corner-size,4px) * var(--ds-sf,1))}:host{--ds-menu-row:var(--ds-row-height);box-sizing:border-box;min-width:calc(8 * var(--ds-unit));max-height:var(--ds-menu-max-height,calc(16 * var(--ds-unit)));background:0 0;border:0;padding:0;display:block}:host([hidden]){display:none!important}.frame{box-sizing:border-box;width:100%;max-height:min(var(--ds-menu-max-height,calc(16 * var(--ds-unit))), var(--ds-menu-available-height,100vh));padding:calc(var(--ds-unit) / 2 - 1px);border:1px solid var(--ds-border-color);border-radius:var(--ds-radius-card);background:var(--ds-paper);color:var(--ds-text-color);box-shadow:none;font-family:var(--ds-typeface-regular);font-feature-settings:var(--ds-font-features);font-size:var(--ds-type-size-default);line-height:var(--ds-type-lineheight-default);letter-spacing:var(--ds-type-letterspacing-default);flex-direction:column;gap:0;display:flex;overflow-y:auto}slot{display:contents}::slotted(:is(ds-button,ds-file-picker)){--ds-button-height:var(--ds-menu-row);flex:none;width:100%}::slotted(:is(button,a,[role=option],[role^=menuitem]):not(ds-button,ds-file-picker)){box-sizing:border-box!important;height:var(--ds-menu-row)!important;min-height:var(--ds-menu-row)!important;max-height:var(--ds-menu-row)!important;line-height:var(--ds-type-lineheight-default)!important;flex:none!important;margin-block:0!important;padding-block:0!important}:host([floating]:not([open])){display:none}:host([floating]){min-width:0;width:var(--ds-menu-width,var(--ds-menu-anchor-width));z-index:1;scroll-padding:calc(var(--ds-unit) / 2);margin:0;position:fixed;inset:auto}:host([floating]) ::slotted(:is(ds-button,ds-file-picker)){--ds-button-height:var(--ds-menu-row);--ds-button-align:flex-start;--ds-button-padding:0 calc(4px * var(--ds-sf));flex:none;width:100%}:host([data-grid]){width:max-content;min-width:0}:host([data-grid]) .frame{grid-template-columns:repeat(var(--ds-menu-columns), var(--ds-row-height));width:max-content;max-width:100%;display:grid}:host([data-grid]) ::slotted(:is(ds-button,ds-file-picker)){--ds-button-height:var(--ds-menu-row);--ds-button-min-width:0px;--ds-button-padding:0;--ds-button-align:center}:host([compact]){--ds-menu-row:calc(var(--ds-row-height) - 1px);width:var(--ds-menu-width,calc(8 * var(--ds-unit)));min-width:calc(4 * var(--ds-unit));max-width:100%;max-height:none}:host([compact]) .frame{background:0 0;border:0;border-radius:0;gap:1px;padding:0;overflow:visible}:host([compact]) ::slotted(:is(ds-button,ds-file-picker)){--ds-button-height:var(--ds-menu-row);--ds-button-padding:0 calc(4px * var(--ds-sf));--ds-button-background:var(--ds-fill);--ds-button-color:var(--ds-text-color);--ds-radius:0px;width:100%}:host([floating]) ::slotted(:is(ds-button,ds-file-picker):is(:hover,:focus-within):not([disabled],[data-disabled])){--ds-button-background:var(--ds-fill)}:host([trigger-mode=context]),:host([trigger-mode=submenu]),:host([trigger-mode=manual]){width:var(--ds-menu-width,calc(8 * var(--ds-unit)))}:host([data-grid]){width:calc((var(--ds-menu-columns) + 1) * var(--ds-row-height))}:host([data-grid]) .frame{width:100%;padding-inline:calc(var(--ds-unit) / 2 - 1px)}:host([data-grid]) ::slotted([data-ds-menu-start]){grid-column-start:1}:host([data-grid]) ::slotted(:is([data-ds-menu-row],[data-ds-menu-separator],[data-ds-menu-label])){grid-column:1/-1}:host([data-grid]) ::slotted([data-ds-menu-row]){--ds-button-align:flex-start;--ds-button-padding:0 calc(4px * var(--ds-sf))}::slotted([data-ds-menu-label]){box-sizing:border-box;height:var(--ds-menu-row);padding:0 calc(4px * var(--ds-sf));color:var(--ds-text-color-muted);display:block}::slotted([data-ds-menu-separator]){box-sizing:border-box;border:0;border-top:1px solid var(--ds-border-color);width:100%;margin:calc(var(--ds-unit) / 2 - 1px) 0 calc(var(--ds-unit) / 2)}", Pf = "[data-ds-shape=square],:host([data-ds-shape=square]){--ds-corner-size:0px;--ds-corner-shape:round;--ds-button-inset:.5px}[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:4px;--ds-corner-shape:round;--ds-button-inset:2.5px}[data-ds-shape=circular],:host([data-ds-shape=circular]){--ds-corner-size:999px;--ds-corner-shape:round;--ds-button-inset:5px}@supports (corner-shape:squircle){[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:8px;--ds-corner-shape:squircle}}:root,:host,:where([data-ds-surface]){--ds-unit:calc(var(--ds-1,20px) * var(--ds-sf,1));--ds-control-height:calc(var(--ds-control-size,var(--ds-08,16px)) * var(--ds-sf,1));--ds-row-height:calc(var(--ds-row-size,var(--ds-1,20px)) * var(--ds-sf,1));--ds-type-size-default:calc(var(--ds-text-size,14px) * var(--ds-sf,1));--ds-type-size-small:calc(var(--ds-small-text-size,10px) * var(--ds-sf,1));--ds-type-size-heading:calc(var(--ds-heading-text-size,13px) * var(--ds-sf,1));--ds-type-size-display:calc(var(--ds-display-text-size,20px) * var(--ds-sf,1));--ds-type-lineheight-default:calc(var(--ds-text-leading,16px) * var(--ds-sf,1));--ds-type-letterspacing-default:calc(var(--ds-text-tracking,-.3px) * var(--ds-sf,1));--ds-radius:calc(var(--ds-corner-size,4px) * var(--ds-sf,1));--ds-radius-card:calc(var(--ds-card-corner-size,4px) * var(--ds-sf,1))}:host([data-field]){--ds-select-unit:calc(var(--ds-1) * var(--ds-sf));vertical-align:bottom;width:max-content;min-width:0;max-width:100%;max-height:none;height:var(--ds-control-height);display:inline-flex;position:relative}:host([data-field]:not([data-listbox])){flex:none!important;justify-self:start!important;width:max-content!important}:host([hidden]){display:none!important}::slotted(select){field-sizing:content;appearance:none!important;box-sizing:border-box!important;width:auto!important;min-width:0!important;max-width:100%!important;height:100%!important;min-height:0!important;padding:0 var(--ds-select-unit) 0 calc(4px * var(--ds-sf))!important;border:1px solid var(--ds-border-color)!important;border-radius:var(--ds-radius)!important;corner-shape:var(--ds-corner-shape,round)!important;background:var(--ds-input-background)!important;color:var(--ds-input-color)!important;font-family:var(--ds-typeface-regular)!important;font-size:var(--ds-type-size-default)!important;font-weight:var(--ds-type-weight-default)!important;letter-spacing:var(--ds-type-letterspacing-default)!important;line-height:calc(var(--ds-control-height) - 2px)!important;box-shadow:none!important;cursor:pointer!important;margin:0!important;display:block!important}.arrow{pointer-events:none;inset-inline-end:calc(2px * var(--ds-sf));width:var(--ds-control-height);height:var(--ds-control-height);background:var(--ds-input-color);-webkit-mask:var(--ds-select-arrow) center / contain no-repeat;mask:var(--ds-select-arrow) center / contain no-repeat;position:absolute;top:50%;transform:translateY(-50%)}::slotted(select:focus-visible){outline:2px solid var(--ds-focus-ring)!important;outline-offset:1px!important}::slotted(select:disabled){cursor:default!important;opacity:.5!important}.arrow.disabled{opacity:.5}.arrow[hidden]{display:none}::slotted(select[multiple]),::slotted(select[size]:not([size=\"0\"]):not([size=\"1\"])){padding:0 calc(4px * var(--ds-sf))!important;line-height:calc(var(--ds-select-unit) - 2px)!important}:host([data-listbox]){width:calc(8 * var(--ds-select-unit));height:calc(var(--ds-select-rows,1) * var(--ds-select-unit))}:host([data-listbox]) ::slotted(select){width:100%!important}:host([fit]:not([data-listbox])){width:max-content}:host([fit]:not([data-listbox])) ::slotted(select){width:auto!important;max-width:100%!important}:host([chip]:not([data-listbox])) ::slotted(select){background:var(--ds-button-background-color-secondary)!important;color:var(--ds-button-text-color)!important;line-height:var(--ds-control-height)!important;border:0!important}:host([chip][primary]:not([data-listbox])) ::slotted(select){background:var(--ds-button-background-color-primary)!important;color:var(--ds-button-text-color-on-accent)!important}:host([chip]) .arrow{background:var(--ds-button-text-color)}:host([chip][primary]) .arrow{background:var(--ds-button-text-color-on-accent)}:host([swatch]:not([swatch=\"\"]):not([data-listbox])){width:var(--ds-select-unit);height:var(--ds-select-unit);border-radius:var(--ds-radius);background:var(--ds-input-background)}:host([swatch]:not([swatch=\"\"]):not([data-listbox])) ::slotted(select){z-index:1;opacity:0!important;width:100%!important;position:relative!important}:host([swatch]:not([swatch=\"\"]):not([data-listbox]):focus-within){outline:2px solid var(--ds-focus-ring);outline-offset:1px}ds-swatch{pointer-events:none;margin:auto;position:absolute;inset:0}ds-swatch.disabled{opacity:.5}:host([data-listed]){cursor:pointer}:host([data-listed]) ::slotted(select){pointer-events:none!important}.list{--ds-menu-width:var(--ds-select-list-width)}.choice,.group-label{box-sizing:border-box;align-items:flex-end;gap:calc(4px * var(--ds-sf));width:100%;height:var(--ds-row-height);min-width:0;padding:0 calc(4px * var(--ds-sf));color:var(--ds-text-color);font:inherit;line-height:var(--ds-type-lineheight-default);text-align:start;white-space:nowrap;background:0 0;border:0;border-radius:0;flex:none;margin:0;display:flex}.choice{cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none}.choice:hover:not(:disabled),.choice:focus-visible{background:var(--ds-row-fill-hover,var(--ds-fill))}.choice:active:not(:disabled){background:var(--ds-row-fill-press,var(--ds-fill-hover))}.choice:focus-visible{box-shadow:inset 0 0 0 2px var(--ds-focus-ring)}.choice:disabled{cursor:default;opacity:.5}.group{flex-direction:column;display:flex}.group-label{color:var(--ds-text-color-muted)}.name{flex:0 auto;min-width:0;overflow:hidden}.details{min-width:0;color:var(--ds-text-color-muted);flex:0 auto;overflow:hidden}.shortcut{color:var(--ds-text-color-muted);flex:none;margin-inline-start:auto}.mark{width:calc(16px * var(--ds-sf));height:calc(16px * var(--ds-sf));flex:none}.check{width:calc(16px * var(--ds-sf));height:calc(16px * var(--ds-sf));-webkit-mask:var(--ds-select-check) center / contain no-repeat;mask:var(--ds-select-check) center / contain no-repeat;visibility:hidden;background:currentColor;flex:none;margin-inline-start:auto}.shortcut+.check{margin-inline-start:0}.choice[aria-selected=true] .check{visibility:visible}.choice[aria-selected=true] .name{font-weight:var(--ds-row-current-weight,var(--ds-type-weight-bold))}";
Bc("ds-swatch", class extends Rc {
	static properties = {
		value: { type: String },
		selected: {
			type: Boolean,
			reflect: !0
		}
	};
	constructor() {
		super(), this.value = "transparent", this.selected = !1;
	}
	static styles = Fs`
    :host { display: inline-block; flex: 0 0 auto; width: calc(var(--ds-08) * var(--ds-sf)); height: calc(var(--ds-08) * var(--ds-sf)); vertical-align: middle; }
    :host([hidden]) { display: none !important; }
    span { display: block; box-sizing: border-box; width: 100%; height: 100%; border: 1px solid var(--ds-border-color); }
    :host([selected]) span { outline: 2px solid var(--ds-text-color); outline-offset: 0; }
  `;
	render() {
		return X`<span style=${pf({ backgroundColor: this.value })}></span>`;
	}
});
//#endregion
//#region src/vendor/ds1/2-core/styles/ds-file-picker.css?inline
var Ff = "[data-ds-shape=square],:host([data-ds-shape=square]){--ds-corner-size:0px;--ds-corner-shape:round;--ds-button-inset:.5px}[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:4px;--ds-corner-shape:round;--ds-button-inset:2.5px}[data-ds-shape=circular],:host([data-ds-shape=circular]){--ds-corner-size:999px;--ds-corner-shape:round;--ds-button-inset:5px}@supports (corner-shape:squircle){[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:8px;--ds-corner-shape:squircle}}:root,:host,:where([data-ds-surface]){--ds-unit:calc(var(--ds-1,20px) * var(--ds-sf,1));--ds-control-height:calc(var(--ds-control-size,var(--ds-08,16px)) * var(--ds-sf,1));--ds-row-height:calc(var(--ds-row-size,var(--ds-1,20px)) * var(--ds-sf,1));--ds-type-size-default:calc(var(--ds-text-size,14px) * var(--ds-sf,1));--ds-type-size-small:calc(var(--ds-small-text-size,10px) * var(--ds-sf,1));--ds-type-size-heading:calc(var(--ds-heading-text-size,13px) * var(--ds-sf,1));--ds-type-size-display:calc(var(--ds-display-text-size,20px) * var(--ds-sf,1));--ds-type-lineheight-default:calc(var(--ds-text-leading,16px) * var(--ds-sf,1));--ds-type-letterspacing-default:calc(var(--ds-text-tracking,-.3px) * var(--ds-sf,1));--ds-radius:calc(var(--ds-corner-size,4px) * var(--ds-sf,1));--ds-radius-card:calc(var(--ds-card-corner-size,4px) * var(--ds-sf,1))}:host{vertical-align:middle;width:max-content;min-width:0;max-width:100%;height:var(--ds-row-height);border-radius:var(--ds-radius);corner-shape:var(--ds-corner-shape,round);display:inline-flex;position:relative}:host([hidden]){display:none!important}ds-button{--ds-button-height:var(--ds-row-height);pointer-events:none;max-width:100%;overflow:hidden}:host([icon]){width:var(--ds-row-height)}:host([preview]){width:calc(4 * var(--ds-unit));height:calc(4 * var(--ds-unit))}:host([preview]) ds-button{--ds-button-height:calc(4 * var(--ds-unit))}:host([preview][compact]){width:calc(2 * var(--ds-unit));height:calc(2 * var(--ds-unit))}:host([preview][compact]) ds-button{--ds-button-height:calc(2 * var(--ds-unit))}::slotted([slot=content]){justify-content:center;align-items:center;gap:calc(var(--ds-unit) / 2);pointer-events:none;display:inline-flex}:host([preview]) ::slotted([slot=content]){width:100%;height:100%}:host([area]){width:100%;height:calc(8 * var(--ds-unit))}:host([area]) ds-button{--ds-button-height:calc(8 * var(--ds-unit));width:100%}:host([area][compact]){height:calc(4 * var(--ds-unit))}:host([area][compact]) ds-button{--ds-button-height:calc(4 * var(--ds-unit))}:host([area]) slot[name=content]{text-align:center;white-space:normal;width:100%;display:block}:host([area]) ::slotted([slot=content]){box-sizing:border-box;width:100%;padding:var(--ds-unit);white-space:normal}::slotted(input[type=file]){box-sizing:border-box!important;opacity:0!important;clip:auto!important;clip-path:none!important;cursor:pointer!important;border:0!important;width:100%!important;min-width:0!important;max-width:none!important;height:100%!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;display:block!important;position:absolute!important;inset:0!important;overflow:hidden!important}::slotted(input[type=file]:disabled){cursor:default!important}::slotted(input[hidden]){display:none!important}:host(:focus-within){outline:2px solid var(--ds-focus-ring);outline-offset:1px}:host(:is([secondary],[area]):hover:not([data-disabled])) ds-button{--ds-button-background:var(--ds-fill-hover)}:host(:is([data-dragging],[dragging]):not([data-disabled])){outline:2px solid var(--ds-focus-ring);outline-offset:1px}:host(:is([data-dragging],[dragging]):not([data-disabled])) ds-button{--ds-button-background:var(--ds-fill-hover)}:host([data-menu-item]){width:100%}:host([data-menu-item]) ds-button{--ds-button-padding:0 calc(4px * var(--ds-sf));width:100%}:host([data-menu-item]:is(:hover,:focus-within):not([data-disabled])) ds-button{--ds-button-background:var(--ds-fill)}";
Bc("ds-file-picker", class extends Rc {
	static properties = {
		label: { type: String },
		icon: {
			type: Boolean,
			reflect: !0
		},
		preview: {
			type: Boolean,
			reflect: !0
		},
		area: {
			type: Boolean,
			reflect: !0
		},
		dragging: {
			type: Boolean,
			reflect: !0
		},
		compact: {
			type: Boolean,
			reflect: !0
		},
		primary: {
			type: Boolean,
			reflect: !0
		},
		secondary: {
			type: Boolean,
			reflect: !0
		}
	};
	static styles = Ps(Ff);
	controlDisabled = !1;
	observer = new MutationObserver(() => this.syncDisabled());
	constructor() {
		super(), this.label = "", this.icon = this.preview = this.area = this.dragging = this.compact = this.primary = this.secondary = !1;
	}
	control() {
		return this.querySelector(":scope > input[type=file]");
	}
	syncDisabled() {
		if (!this.isConnected) return;
		let e = this.control();
		this.toggleAttribute("data-menu-item", e?.getAttribute("role") === "menuitem"), this.controlDisabled = !e || e.matches(":disabled"), this.toggleAttribute("data-disabled", this.controlDisabled), this.controlDisabled && this.clearDrag(), this.requestUpdate();
	}
	showDrag = (e) => {
		let t = this.control();
		t && !t.matches(":disabled") && e.dataTransfer?.types.includes("Files") && this.setAttribute("data-dragging", "");
	};
	clearDrag = () => {
		this.removeAttribute("data-dragging");
	};
	observeControl() {
		if (this.observer.disconnect(), !this.isConnected) return;
		let e = this.control();
		e && this.observer.observe(e, {
			attributes: !0,
			attributeFilter: ["disabled", "role"]
		});
		for (let e = this.parentElement; e; e = e.parentElement) e.localName === "fieldset" && this.observer.observe(e, {
			attributes: !0,
			attributeFilter: ["disabled"]
		});
		this.syncDisabled();
	}
	connectedCallback() {
		super.connectedCallback(), this.observeControl(), this.addEventListener("dragenter", this.showDrag), this.addEventListener("dragleave", this.clearDrag), this.addEventListener("drop", this.clearDrag);
	}
	disconnectedCallback() {
		this.observer.disconnect(), this.clearDrag(), this.removeEventListener("dragenter", this.showDrag), this.removeEventListener("dragleave", this.clearDrag), this.removeEventListener("drop", this.clearDrag), super.disconnectedCallback();
	}
	focus(e) {
		this.control()?.focus(e);
	}
	render() {
		return X`<ds-button control="host" inert aria-hidden="true" tabindex="-1"
      .icon=${!this.area && (this.icon || this.preview)} .primary=${this.primary} .secondary=${this.secondary || this.area}
      .disabled=${this.controlDisabled}><slot name="content">${this.label}</slot></ds-button>
      <slot @slotchange=${this.observeControl}></slot>`;
	}
});
function If(e, t, { resolve: n = () => e, touch: r = !0, selection: i = !1, aria: a = !0 } = {}) {
	let o = e.ownerDocument, s = e.getAttribute("aria-haspopup"), c = e.classList.contains("ds-context-trigger"), l, u, d = null, f, p = !1;
	a && e.setAttribute("aria-haspopup", "menu"), i && e.classList.add("ds-context-trigger");
	let m = (e) => e.isConnected && !e.matches(":disabled, [disabled], [aria-disabled=\"true\"], [data-disabled]") && !e.closest("[hidden], [inert]"), h = () => {
		clearTimeout(f), d = null, o.removeEventListener("click", g, !0);
	}, g = (e) => {
		let t = d && e.composedPath().includes(d);
		h(), t && (e.preventDefault(), e.stopImmediatePropagation());
	}, _ = (e) => {
		h(), d = e, o.addEventListener("click", g, !0), f = setTimeout(h, 1e3);
	}, v = () => {
		clearTimeout(l), l = void 0, u = void 0, o.removeEventListener("pointermove", x), o.removeEventListener("pointerup", v), o.removeEventListener("pointercancel", v), d && (clearTimeout(f), f = setTimeout(h, 1e3));
	}, y = (e) => {
		if (e.defaultPrevented) return;
		let r = n(e);
		r && m(r) && (v(), d === r ? e.preventDefault() : t({
			x: e.clientX,
			y: e.clientY
		}, r, e) !== !1 && (e.preventDefault(), i && e.button === 0 && _(r)));
	}, b = (e) => {
		if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.key !== "ContextMenu" && !(e.key === "F10" && e.shiftKey)) return;
		let r = n(e);
		if (!r || !m(r)) return;
		let i = r.getBoundingClientRect();
		t({
			x: i.left,
			y: i.bottom
		}, r, e) !== !1 && (e.preventDefault(), e.stopPropagation());
	}, x = (e) => {
		u && Math.hypot(e.clientX - u.x, e.clientY - u.y) > 10 && v();
	}, S = (i) => {
		if (!r || i.defaultPrevented || i.pointerType !== "touch" || i.button !== 0) return;
		let a = n(i);
		if (!a || !m(a)) return;
		v(), h();
		let s = {
			x: i.clientX,
			y: i.clientY
		};
		u = s, o.addEventListener("pointermove", x), o.addEventListener("pointerup", v), o.addEventListener("pointercancel", v), l = setTimeout(() => {
			l = void 0, u = void 0, p || !m(a) || !e.contains(a) ? v() : t(s, a, i) !== !1 && _(a);
		}, 500);
	};
	return e.addEventListener("contextmenu", y), e.addEventListener("keydown", b), e.addEventListener("pointerdown", S), {
		cancel: v,
		dispose() {
			p = !0, v(), h(), e.removeEventListener("contextmenu", y), e.removeEventListener("keydown", b), e.removeEventListener("pointerdown", S), a && (s === null ? e.removeAttribute("aria-haspopup") : e.setAttribute("aria-haspopup", s)), i && !c && e.classList.remove("ds-context-trigger");
		}
	};
}
//#endregion
//#region src/vendor/ds1/3-unit/ds-menu.ts
var Lf = "[role=\"option\"], [role=\"menuitem\"], [role=\"menuitemradio\"], [role=\"menuitemcheckbox\"]", Rf = "button, a[href], input, select, textarea, [tabindex]", zf = "ds-menu, ds-select, ds-context", Bf = /* @__PURE__ */ new WeakMap(), Vf = class e extends Rc {
	static styles = Ps(Nf);
	static properties = {
		compact: {
			type: Boolean,
			reflect: !0
		},
		floating: {
			type: Boolean,
			reflect: !0
		},
		open: {
			type: Boolean,
			reflect: !0
		},
		disabled: {
			type: Boolean,
			reflect: !0
		},
		columns: {
			type: Number,
			reflect: !0
		},
		anchor: { attribute: !1 },
		placement: { type: String },
		trigger: { attribute: !1 },
		for: { type: String },
		triggerMode: {
			type: String,
			attribute: "trigger-mode",
			reflect: !0
		},
		contextSelector: {
			type: String,
			attribute: "context-selector"
		},
		hover: {
			type: Boolean,
			reflect: !0
		},
		controller: { attribute: !1 },
		activeId: {
			type: String,
			attribute: "active-id"
		}
	};
	listeningTo = null;
	listeningTrigger = null;
	listeningSelector = "";
	listeningMode = null;
	contextBinding;
	triggerAttributes = /* @__PURE__ */ new Map();
	openingEdge = "first";
	search = "";
	searchAt = 0;
	gridColumn = 0;
	focusOnOpen = !0;
	hoverTimer;
	shown = !1;
	observer;
	choicesObserver;
	opener = null;
	observedAnchor = null;
	restoreFocus = !0;
	heldFocus = !1;
	focusVersion = 0;
	contextPoint = null;
	invokingControl = null;
	closesOnChoice = !1;
	get parentMenu() {
		return this.parentElement?.closest(zf) ?? null;
	}
	get rootMenu() {
		return this.parentMenu?.rootMenu ?? this;
	}
	constructor() {
		super(), this.compact = !1, this.floating = !1, this.open = !1, this.disabled = !1, this.placement = "bottom", this.triggerMode = "click", this.contextSelector = "", this.columns = 1, this.anchor = null, this.trigger = null, this.for = "", this.hover = !1, this.controller = null, this.activeId = "", this.addEventListener("keydown", this.onKeyDown), this.addEventListener("click", this.onChoice), this.addEventListener("pointerdown", this.retainController), this.addEventListener("pointerover", this.onPointerChoice), this.addEventListener("pointerenter", this.onHoverEnter), this.addEventListener("pointerleave", this.onHoverLeave), this.addEventListener("focusin", () => {
			this.heldFocus = !0, this.syncTabStops();
		}), this.addEventListener("focusout", (e) => {
			e.relatedTarget instanceof Node && !this.contains(e.relatedTarget) && (this.heldFocus = !1);
		});
	}
	connectedCallback() {
		super.connectedCallback(), this.hasAttribute("role") || this.setAttribute("role", "listbox"), this.requestUpdate();
	}
	disconnectedCallback() {
		this.listeningTo?.removeEventListener("keydown", this.onControllerKey), this.listeningTo = null, this.bindTrigger(null), clearTimeout(this.hoverTimer), this.hide(!0), super.disconnectedCallback();
	}
	get anchorElement() {
		return this.anchor instanceof HTMLElement ? this.anchor : !this.anchor && this.triggerMode !== "context" && this.triggerMode !== "manual" ? this.trigger : null;
	}
	get forTarget() {
		return this.trigger ? this.trigger : this.for ? this.getRootNode().getElementById?.(this.for) ?? null : null;
	}
	updated() {
		this.disabled && this.contextBinding?.cancel(), !this.trigger && this.for && (this.trigger = this.forTarget), this.bindTrigger(this.trigger), this.trigger && !this.contextSelector && (this.trigger.setAttribute("aria-haspopup", this.getAttribute("role") === "menu" ? "menu" : "listbox"), this.trigger.setAttribute("aria-expanded", String(this.open)), this.id && this.trigger.setAttribute("aria-controls", this.id)), this.style.setProperty("--ds-menu-columns", String(Math.max(1, Math.floor(this.columns || 1)))), this.toggleAttribute("data-grid", this.columns > 1), this.listeningTo !== this.controller && (this.listeningTo?.removeEventListener("keydown", this.onControllerKey), this.listeningTo = this.controller, this.listeningTo?.addEventListener("keydown", this.onControllerKey)), this.floating && this.open ? this.show() : this.hide(!0), this.syncTabStops();
		let e = this.anchorElement;
		this.observer && this.observedAnchor !== e && (this.observedAnchor && this.observer.unobserve(this.observedAnchor), e && this.observer.observe(e), this.observedAnchor = e), this.place(), this.scrollActive();
	}
	renderNow() {
		this.performUpdate();
	}
	bindTrigger(e) {
		if (this.listeningTrigger !== e || this.listeningSelector !== this.contextSelector || this.listeningMode !== this.triggerMode) {
			this.contextBinding?.dispose(), this.contextBinding = void 0;
			for (let [e, t] of this.triggerAttributes) t === null ? this.listeningTrigger?.removeAttribute(e) : this.listeningTrigger?.setAttribute(e, t);
			if (this.triggerAttributes.clear(), this.listeningTrigger?.removeEventListener("click", this.onTriggerClick), this.listeningTrigger?.removeEventListener("keydown", this.onTriggerKey), this.listeningTrigger?.removeEventListener("pointerenter", this.onHoverEnter), this.listeningTrigger?.removeEventListener("pointerleave", this.onHoverLeave), this.listeningTrigger = e, this.listeningSelector = this.contextSelector, this.listeningMode = this.triggerMode, e && this.triggerMode === "context" && (this.contextBinding = If(e, (e, t) => {
				if (this.disabled) return !1;
				this.openAt(e, t);
			}, {
				resolve: (e) => this.contextControl(e),
				aria: !1
			})), e && !this.contextSelector) for (let t of [
				"aria-haspopup",
				"aria-expanded",
				"aria-controls"
			]) this.triggerAttributes.set(t, e.getAttribute(t));
			e?.addEventListener("click", this.onTriggerClick), e?.addEventListener("keydown", this.onTriggerKey), e?.addEventListener("pointerenter", this.onHoverEnter), e?.addEventListener("pointerleave", this.onHoverLeave);
		}
	}
	toggleFromTrigger(e, t = { trigger: this.trigger }) {
		if (this.disabled || !this.trigger && this.triggerMode !== "manual" || this.trigger && !this.enabled(this.trigger)) return;
		let n = new CustomEvent("ds-menu-toggle", {
			detail: {
				open: e,
				...t
			},
			bubbles: !0,
			composed: !0,
			cancelable: !0
		});
		this.dispatchEvent(n) && (this.open = e);
	}
	openAt(e, t = this.trigger, { focus: n = !0 } = {}) {
		if (this.disabled || this.trigger && !this.enabled(this.trigger) || t && (!t.isConnected || !this.enabled(t))) return;
		this.contextPoint = {
			left: e.x,
			right: e.x,
			top: e.y,
			bottom: e.y,
			width: 0,
			height: 0
		};
		let r = this.ownerDocument.activeElement;
		this.invokingControl = t?.matches(Rf) ? t : t?.contains(r) && r instanceof HTMLElement ? r : t?.querySelector(Rf) ?? t, this.shown && (this.opener = this.invokingControl), this.focusOnOpen = n, this.openingEdge = "first", this.toggleFromTrigger(!0, {
			trigger: t,
			point: e
		}), this.open && this.place();
	}
	onChoice = (e) => {
		if (!this.closesOnChoice) return;
		let t = e.composedPath().find((e) => e instanceof HTMLElement && e.matches(Lf));
		t && t.closest(zf) === this && !t.hasAttribute("data-keep-open") && this.enabled(t) && (t.getAttribute("aria-haspopup") || t.matches("ds-file-picker, input[type=\"file\"]") || t.querySelector("input[type=\"file\"]") || queueMicrotask(() => {
			!e.defaultPrevented && this.open && this.select();
		}));
	};
	select() {
		this.rootMenu.requestClose("select");
	}
	contextControl(t) {
		if (this.disabled || !this.trigger) return null;
		if (!this.contextSelector) return this.enabled(this.trigger) ? this.trigger : null;
		for (let n of t.composedPath()) {
			if (n === this.trigger) break;
			if (n instanceof e) return null;
			if (n instanceof HTMLElement && n.matches(this.contextSelector)) return this.enabled(n) && !n.closest("[hidden], [inert]") ? n : null;
		}
		return null;
	}
	onTriggerClick = (e) => {
		this.triggerMode === "context" || this.triggerMode === "manual" || e.defaultPrevented || this.hover && this.trigger?.matches("a[href]") || (this.focusOnOpen = !0, this.openingEdge = "first", this.toggleFromTrigger(this.triggerMode === "submenu" || !this.open));
	};
	onTriggerKey = (e) => {
		if (!(e.defaultPrevented || e.isComposing || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey && (this.triggerMode !== "context" || e.key !== "F10") || !this.trigger || !this.enabled(this.trigger)) && this.triggerMode !== "context" && this.triggerMode !== "manual") {
			if (this.triggerMode === "submenu") {
				let t = this.ownerDocument.defaultView?.getComputedStyle(this).direction === "rtl" ? "ArrowLeft" : "ArrowRight";
				if (e.key !== t && e.key !== "Enter" && e.key !== " ") return;
				e.preventDefault(), e.stopPropagation(), this.focusOnOpen = !0, this.open ? this.initialChoice()?.focus() : this.toggleFromTrigger(!0);
			} else (e.key === "ArrowDown" || e.key === "ArrowUp") && (e.preventDefault(), this.focusOnOpen = !0, this.openingEdge = e.key === "ArrowUp" ? "last" : "first", this.open ? this.initialChoice()?.focus() : this.toggleFromTrigger(!0));
		}
	};
	onHoverEnter = (e) => {
		!this.hover && this.triggerMode !== "submenu" || e.pointerType === "touch" || (clearTimeout(this.hoverTimer), this.open || (this.focusOnOpen = !1, this.toggleFromTrigger(!0)));
	};
	onHoverLeave = (e) => {
		!this.hover && this.triggerMode !== "submenu" || e.pointerType === "touch" || e.relatedTarget instanceof Node && (this.contains(e.relatedTarget) || this.trigger?.contains(e.relatedTarget)) || (clearTimeout(this.hoverTimer), this.hoverTimer = setTimeout(() => {
			this.open && !this.contains(this.ownerDocument.activeElement) && this.requestClose("outside");
		}, 180));
	};
	initialChoice() {
		let e = this.items();
		return e.find((e) => e.getAttribute("aria-selected") === "true" || e.getAttribute("aria-checked") === "true") ?? (this.openingEdge === "last" ? e.at(-1) : e[0]);
	}
	items(e = !1) {
		return Array.from(this.querySelectorAll(Lf)).filter((t) => (e || this.enabled(t)) && !t.closest("[hidden], [inert]") && t.closest(zf) === this);
	}
	enabled(e) {
		return !e.matches(":disabled") && !e.hasAttribute("disabled") && e.getAttribute("aria-disabled") !== "true";
	}
	syncTabStops() {
		if (!this.floating) return;
		let e = this.items(!0), t = this.controller ? null : e.find((e) => e === this.ownerDocument.activeElement) ?? e.find((e) => this.enabled(e));
		for (let n of e) n.tabIndex = n === t ? 0 : -1;
	}
	onChoicesChanged = () => {
		this.syncTabStops(), this.place(), this.scrollActive(), this.shown && this.heldFocus && this.ownerDocument.activeElement === this.ownerDocument.body && this.focusInitial(this.ownerDocument.body);
	};
	focusInitial(e) {
		let t = ++this.focusVersion;
		Promise.all(Array.from(this.querySelectorAll("ds-button, ds-file-picker"), (e) => e.updateComplete)).then(() => {
			let n = this.ownerDocument.activeElement;
			if (this.shown && this.isConnected && t === this.focusVersion && !this.controller && (n === e || n === this.opener || n === this.ownerDocument.body || n === this)) {
				let e = this.initialChoice();
				e?.focus({ preventScroll: !0 }), e && this.scrollChoice(e);
			}
		});
	}
	isTop() {
		return [...Bf.get(this.ownerDocument) ?? []].at(-1) === this;
	}
	show() {
		if (this.shown || !this.isConnected) return;
		this.shown = !0;
		let e = this.ownerDocument.activeElement;
		this.opener = this.invokingControl ?? this.controller ?? this.trigger ?? (this.anchor instanceof HTMLElement ? this.anchor : null) ?? (e instanceof HTMLElement ? e : null), this.search = "", this.restoreFocus = !0, this.heldFocus = !1;
		let t = Bf.get(this.ownerDocument);
		t || Bf.set(this.ownerDocument, t = /* @__PURE__ */ new Set()), t.add(this), this.popover = "manual", this.showPopover?.(), this.choicesObserver = new MutationObserver(this.onChoicesChanged), this.choicesObserver.observe(this, {
			childList: !0,
			subtree: !0,
			attributes: !0,
			attributeFilter: [
				"disabled",
				"hidden",
				"aria-disabled"
			]
		}), typeof ResizeObserver < "u" && (this.observer = new ResizeObserver(this.place), this.observer.observe(this), this.observedAnchor = this.anchorElement, this.observedAnchor && this.observer.observe(this.observedAnchor)), this.ownerDocument.addEventListener("pointerdown", this.onOutside, !0), this.ownerDocument.addEventListener("focusin", this.onOutside), this.ownerDocument.addEventListener("keydown", this.onEscape, !0), this.ownerDocument.addEventListener("scroll", this.place, !0), this.ownerDocument.defaultView?.addEventListener("resize", this.place), this.ownerDocument.defaultView?.visualViewport?.addEventListener("resize", this.place), this.ownerDocument.defaultView?.visualViewport?.addEventListener("scroll", this.place), !this.controller && this.focusOnOpen && this.focusInitial(e);
	}
	hide(e) {
		if (!this.shown) return;
		this.shown = !1;
		for (let e of this.querySelectorAll(zf)) e.open && e.requestClose("parent");
		clearTimeout(this.hoverTimer), this.focusVersion++;
		let t = this.ownerDocument.activeElement, n = t instanceof Node && this.contains(t);
		this.isConnected && this.matches(":popover-open") && this.hidePopover?.(), Bf.get(this.ownerDocument)?.delete(this), this.observer?.disconnect(), this.observer = void 0, this.observedAnchor = null, this.choicesObserver?.disconnect(), this.choicesObserver = void 0, this.ownerDocument.removeEventListener("pointerdown", this.onOutside, !0), this.ownerDocument.removeEventListener("focusin", this.onOutside), this.ownerDocument.removeEventListener("keydown", this.onEscape, !0), this.ownerDocument.removeEventListener("scroll", this.place, !0), this.ownerDocument.defaultView?.removeEventListener("resize", this.place), this.ownerDocument.defaultView?.visualViewport?.removeEventListener("resize", this.place), this.ownerDocument.defaultView?.visualViewport?.removeEventListener("scroll", this.place);
		let r = new CustomEvent("ds-menu-close-focus", {
			bubbles: !0,
			composed: !0,
			cancelable: !0
		});
		this.dispatchEvent(r) && e && this.restoreFocus && (n || this.heldFocus && t === this.ownerDocument.body) && this.opener?.isConnected && this.opener.focus({ preventScroll: !0 }), this.opener = null, this.invokingControl = null, this.heldFocus = !1;
	}
	requestClose(e) {
		this.restoreFocus = e !== "outside" && e !== "parent";
		for (let e of this.querySelectorAll(zf)) e.restoreFocus = !1;
		let t = new CustomEvent("ds-menu-close", {
			detail: { reason: e },
			bubbles: !0,
			composed: !0,
			cancelable: !0
		});
		this.dispatchEvent(t) && (this.open = !1);
	}
	onEscape = (e) => {
		this.isTop() && e.key === "Escape" && !e.defaultPrevented && !e.isComposing && (e.preventDefault(), e.stopPropagation(), this.requestClose("escape"));
	};
	onOutside = (e) => {
		let t = [...Bf.get(this.ownerDocument) ?? []].at(-1);
		if (t !== this && (!t || !this.contains(t))) return;
		let n = e.composedPath(), r = this.contextSelector || this.triggerMode === "manual" ? this.invokingControl : this.trigger;
		!n.includes(this) && !(this.anchor instanceof HTMLElement && !this.controller && n.includes(this.anchor)) && !(r && n.includes(r)) && !(this.controller && n.includes(this.controller)) && this.requestClose("outside");
	};
	onPointerChoice = (e) => {
		if (this.controller || this.getAttribute("role") !== "menu" || e.pointerType === "touch") return;
		let t = e.composedPath().find((e) => e instanceof HTMLElement && e.matches(Lf));
		t && t.closest(zf) === this && this.enabled(t) && t.focus({ preventScroll: !0 });
	};
	retainController = (e) => {
		this.controller && e.button === 0 && e.composedPath().some((e) => e instanceof HTMLElement && e.matches(Lf)) && e.preventDefault();
	};
	place = () => {
		let e = this.triggerMode === "context" || this.triggerMode === "manual" ? this.contextPoint ?? this.anchor : this.anchor ?? this.trigger;
		if (!this.shown || !e) return;
		let t = e instanceof HTMLElement ? e.getBoundingClientRect() : e, n = this.ownerDocument.defaultView, r = n.visualViewport, i = r?.offsetLeft ?? 0, a = r?.offsetTop ?? 0, o = r?.width ?? n.innerWidth, s = r?.height ?? n.innerHeight, c = parseFloat(n.getComputedStyle(this).scrollPaddingTop) || 10, l = c * 2, u = (e, t) => t(Math.max(0, e) / l + (t === Math.floor ? .001 : -.001)) * l, d = u(o - 2 * c, Math.floor);
		this.style.maxWidth = `${d}px`;
		let f = Math.min(d, Math.max(4 * l, u(t.width, Math.ceil)));
		if (this.style.setProperty("--ds-menu-anchor-width", `${f}px`), this.hasAttribute("data-ds-hug") && !n.getComputedStyle(this).getPropertyValue("--ds-menu-width").trim()) {
			this.style.width = "max-content";
			let e = this.getBoundingClientRect().width, t = (this.triggerMode === "context" || this.triggerMode === "manual") && this.contextPoint ? 4 * l : f;
			this.style.width = `${Math.min(d, Math.max(t, u(e, Math.ceil)))}px`;
		}
		if (this.placement === "right" || this.placement === "left" || this.triggerMode === "submenu") {
			this.style.setProperty("--ds-menu-available-height", `${u(s - 2 * c, Math.floor)}px`);
			let e = this.getBoundingClientRect(), r = this.placement === "left" || n.getComputedStyle(this).direction === "rtl", l = i + o - t.right, d = t.left - i, f = r ? d >= e.width || d > l : l < e.width && d > l;
			this.style.left = `${Math.max(i + c, Math.min(f ? t.left - e.width : t.right, i + o - c - e.width))}px`, this.style.top = `${Math.max(a + c, Math.min(t.top, a + s - c - e.height))}px`;
			return;
		}
		let p = a + s - t.bottom - 2 * c, m = t.top - a - 2 * c, h = this.shadowRoot?.querySelector(".frame"), g = Math.min(h?.scrollHeight ?? this.scrollHeight, 8 * l), _ = this.placement === "top" ? m >= g || m >= p : p < g && m > p;
		this.style.setProperty("--ds-menu-available-height", `${u(Math.min(s - 2 * c, _ ? m : p), Math.floor)}px`);
		let v = this.getBoundingClientRect();
		this.style.left = `${Math.max(i + c, Math.min(t.left, i + o - c - v.width))}px`, this.style.top = `${Math.max(a + c, _ ? t.top - c - v.height : t.bottom + c)}px`;
	};
	activate(e) {
		let t = new CustomEvent("ds-menu-active", {
			detail: { id: e.id },
			bubbles: !0,
			composed: !0,
			cancelable: !0
		});
		this.dispatchEvent(t) && (this.activeId = e.id);
	}
	scrollActive() {
		if (!this.controller || !this.shown) return;
		let e = this.items().find((e) => e.id === this.activeId);
		e && this.scrollChoice(e);
	}
	scrollChoice(e) {
		let t = this.shadowRoot?.querySelector(".frame");
		if (!t) return;
		let n = e.getBoundingClientRect(), r = t.getBoundingClientRect();
		n.top < r.top ? t.scrollTop -= r.top - n.top : n.bottom > r.bottom && (t.scrollTop += n.bottom - r.bottom);
	}
	navigate(e, t) {
		if (e.defaultPrevented || e.isComposing || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey || t && (!this.open || !this.floating || !this.isTop())) return;
		let n = this.items(!0);
		if (!n.some((e) => this.enabled(e))) return;
		let r = t ? n.findIndex((e) => e.id === this.activeId) : n.findIndex((t) => e.composedPath().includes(t)), i = Math.max(1, Math.floor(this.columns || 1)), a = this.getAttribute("aria-orientation") === "horizontal", o = this.ownerDocument.defaultView?.getComputedStyle(this).direction === "rtl" ? -1 : 1, s;
		switch (e.key) {
			case "ArrowDown":
				if (a) return;
				s = i > 1 ? this.gridStep(n, r, i, 1) : this.step(n, r, 1, 1);
				break;
			case "ArrowUp":
				if (a) return;
				s = i > 1 ? this.gridStep(n, r, i, -1) : this.step(n, r, 1, -1);
				break;
			case "ArrowRight":
				if (a) {
					s = this.step(n, r, 1, o);
					break;
				}
				if (i === 1 || t) return;
				s = this.step(n, r, 1, 1);
				break;
			case "ArrowLeft":
				if (a) {
					s = this.step(n, r, 1, -o);
					break;
				}
				if (i === 1 || t) return;
				s = this.step(n, r, 1, -1);
				break;
			case "Home":
				if (t) return;
				s = n.findIndex((e) => this.enabled(e));
				break;
			case "End":
				if (t) return;
				s = this.lastEnabled(n);
				break;
			case "Enter":
				t && r >= 0 && this.enabled(n[r]) && (e.preventDefault(), n[r].click());
				return;
			default:
				if (t || e.key.length !== 1 || e.key === " ") return;
				let c = Date.now();
				this.search = (c - this.searchAt < 700 ? this.search : "") + e.key.toLocaleLowerCase(), this.searchAt = c;
				let l = [...this.search].every((e) => e === this.search[0]), u = l ? this.search[0] : this.search, d = l ? r + 1 : Math.max(0, r);
				s = -1;
				for (let e = 0; e < n.length; e++) {
					let t = (d + e + n.length) % n.length, r = n[t];
					if (this.enabled(r) && (r.getAttribute("data-text-value") ?? r.getAttribute("aria-label") ?? r.textContent ?? "").trim().toLocaleLowerCase().startsWith(u)) {
						s = t;
						break;
					}
				}
		}
		if (s < 0) return;
		e.preventDefault();
		let c = n[s];
		t ? this.activate(c) : (c.focus({ preventScroll: !0 }), this.scrollChoice(c));
	}
	lastEnabled(e) {
		return e.reduce((e, t, n) => this.enabled(t) ? n : e, -1);
	}
	gridStep(e, t, n, r) {
		if (t < 0) return r > 0 ? e.findIndex((e) => this.enabled(e)) : this.lastEnabled(e);
		let i = [], a = [], o = () => {
			a.length && i.push({
				indices: a,
				wide: !1
			}), a = [];
		};
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			r.closest("[data-ds-menu-row], [data-ds-menu-start]") && o(), r.closest("[data-ds-menu-row]") ? i.push({
				indices: [t],
				wide: !0
			}) : (a.push(t), a.length === n && o());
		}
		o();
		let s = i.findIndex((e) => e.indices.includes(t));
		if (s < 0) return t;
		i[s].wide || (this.gridColumn = i[s].indices.indexOf(t));
		for (let t = 1; t <= i.length; t++) {
			let n = i[(s + r * t + i.length * t) % i.length], a = n.indices[Math.min(this.gridColumn, n.indices.length - 1)];
			if (this.enabled(e[a])) return a;
		}
		return t;
	}
	step(e, t, n, r) {
		if (t < 0) return r > 0 ? e.findIndex((e) => this.enabled(e)) : this.lastEnabled(e);
		let i = Math.ceil(e.length / n), a = t % n;
		for (let o = 1; o <= i; o++) {
			let s = (Math.floor(t / n) + r * o + i * o) % i, c = Math.min(s * n + a, e.length - 1);
			if (this.enabled(e[c])) return c;
		}
		return t;
	}
	onControllerKey = (e) => this.navigate(e, !0);
	onKeyDown = (t) => {
		if (t.key === "Tab" && this.floating && !this.controller && !t.defaultPrevented) {
			this.rootMenu.requestClose("outside");
			return;
		}
		if (t.composedPath().some((e) => e instanceof HTMLElement && (e.isContentEditable || e.matches("input:not([type=\"file\"][role=\"menuitem\"]), textarea, select, [role=\"textbox\"], [role=\"combobox\"]"))) || t.composedPath().find((t) => t instanceof e) !== this) return;
		let n = this.ownerDocument.defaultView?.getComputedStyle(this).direction === "rtl" ? "ArrowRight" : "ArrowLeft";
		this.parentMenu && t.key === n && !t.defaultPrevented && !t.isComposing ? (t.preventDefault(), t.stopPropagation(), this.requestClose("back")) : this.navigate(t, !1);
	};
	render() {
		return X`<div class="frame"><slot @slotchange=${this.onChoicesChanged}></slot></div>`;
	}
};
Bc("ds-menu", Vf);
//#endregion
//#region src/vendor/ds1/3-unit/ds-select.ts
var Hf = /* @__PURE__ */ new Set([
	"ArrowDown",
	"ArrowUp",
	"Enter",
	" ",
	"F4"
]), Uf = 0;
Bc("ds-select", class extends Vf {
	static properties = {
		...Vf.properties,
		swatch: {
			type: String,
			reflect: !0
		},
		native: {
			type: Boolean,
			reflect: !0
		}
	};
	static styles = [
		Ps(Nf),
		Ps(Pf),
		Ps(`:host { --ds-select-arrow: url("data:image/svg+xml,${encodeURIComponent(jf)}"); --ds-select-check: url("data:image/svg+xml,${encodeURIComponent(Mf)}"); }`)
	];
	listbox = !1;
	fieldDisabled = !1;
	listOpen = !1;
	listId = `ds-select-list-${++Uf}`;
	fieldObserver = new MutationObserver(() => this.syncRows());
	childObserver = new MutationObserver(() => {
		this.control() !== this.bound && this.observeControl();
	});
	constructor() {
		super(), this.swatch = void 0, this.native = !1;
	}
	control() {
		let e = this.querySelector(":scope > select");
		return e instanceof HTMLSelectElement ? e : null;
	}
	get field() {
		return !!this.control();
	}
	get listed() {
		return this.field && !this.native && !this.listbox;
	}
	connectedCallback() {
		!this.field && !this.hasAttribute("role") && this.setAttribute("role", "menu"), super.connectedCallback(), this.childObserver.observe(this, { childList: !0 }), this.observeControl();
	}
	disconnectedCallback() {
		this.childObserver.disconnect(), this.fieldObserver.disconnect(), this.unbindControl(), super.disconnectedCallback();
	}
	willUpdate(e) {
		!this.field && !this.hasAttribute("floating") && (this.trigger || this.for) && (this.floating = !0), this.closesOnChoice = !this.field && !this.controller, this.toggleAttribute("data-ds-hug", !this.field && this.triggerMode !== "submenu" && !this.controller), super.willUpdate(e);
	}
	focus(e) {
		let t = this.control();
		t ? t.focus(e) : super.focus(e);
	}
	bound = null;
	unbindControl() {
		this.bound?.removeEventListener("keydown", this.onFieldKey), this.bound = null, this.removeEventListener("click", this.onFieldClick);
	}
	syncRows() {
		let e = this.control();
		if (this.style.setProperty("--ds-select-rows", String(e ? e.size || (e.multiple ? 4 : 1) : 1)), this.listbox = !!(e && (e.multiple || e.size > 1)), this.toggleAttribute("data-listbox", this.listbox), this.toggleAttribute("data-field", !!e), this.toggleAttribute("data-listed", this.listed), this.fieldDisabled = !!e?.matches(":disabled"), e && this.listed) e.setAttribute("aria-haspopup", "listbox"), e.setAttribute("aria-expanded", String(this.listOpen)), e.setAttribute("aria-controls", this.listId);
		else if (e) for (let t of [
			"aria-haspopup",
			"aria-expanded",
			"aria-controls"
		]) e.removeAttribute(t);
		this.requestUpdate();
	}
	observeControl = () => {
		this.fieldObserver.disconnect(), this.unbindControl();
		let e = this.control();
		e && (this.fieldObserver.observe(e, {
			attributes: !0,
			attributeFilter: [
				"size",
				"multiple",
				"disabled"
			],
			childList: !0,
			subtree: !0,
			characterData: !0
		}), this.bound = e, e.addEventListener("keydown", this.onFieldKey), this.addEventListener("click", this.onFieldClick), (this.getAttribute("role") === "menu" || this.getAttribute("role") === "listbox") && this.removeAttribute("role"));
		for (let e = this.parentElement; e; e = e.parentElement) e.localName === "fieldset" && this.fieldObserver.observe(e, {
			attributes: !0,
			attributeFilter: ["disabled"]
		});
		this.syncRows();
	};
	onFieldClick = (e) => {
		!this.listed || this.fieldDisabled || e.defaultPrevented || e.composedPath().some((e) => e instanceof HTMLElement && e.classList.contains("list")) || (e.preventDefault(), this.control()?.focus({ preventScroll: !0 }), this.setList(!this.listOpen));
	};
	onFieldKey = (e) => {
		!this.listed || this.fieldDisabled || e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || (Hf.has(e.key) || e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) && (e.preventDefault(), this.setList(!0));
	};
	setList(e) {
		this.listOpen !== e && (this.listOpen = e, this.control()?.setAttribute("aria-expanded", String(e)), this.requestUpdate());
	}
	onListClose = (e) => {
		e.target === this.shadowRoot?.querySelector(".list") && this.setList(!1);
	};
	choose(e) {
		let t = this.control();
		t && !e.disabled && (e.selected || (e.selected = !0, t.dispatchEvent(new Event("input", {
			bubbles: !0,
			composed: !0
		})), t.dispatchEvent(new Event("change", { bubbles: !0 }))), this.setList(!1));
	}
	renderOption(e, t) {
		if (e.hidden) return Z;
		let n = e.label || e.text, { details: r, shortcut: i, icon: a } = e.dataset;
		return X`<button type="button" role="option" class="choice" id=${`${this.listId}-${t}`} aria-selected=${e.selected ? "true" : "false"}
      ?disabled=${e.disabled || this.fieldDisabled} data-text-value=${n} @click=${(t) => {
			t.stopPropagation(), this.choose(e);
		}}>${a ? X`<ds-icon class="mark" type=${a} aria-hidden="true"></ds-icon>` : Z}<span class="name">${n}</span>${r ? X`<span class="details">${r}</span>` : Z}${i ? X`<span class="shortcut" aria-hidden="true">${i.includes("+") || i.startsWith("mod") ? Af(i) : i}</span>` : Z}<span class="check" aria-hidden="true"></span></button>`;
	}
	renderChoices() {
		let e = this.control();
		if (!e) return Z;
		let t = 0;
		return [...e.children].map((e, n) => {
			if (e instanceof HTMLOptionElement) return this.renderOption(e, t++);
			if (!(e instanceof HTMLOptGroupElement) || e.hidden) return Z;
			let r = `${this.listId}-group-${n}`;
			return X`<div role="group" class="group" aria-labelledby=${r}><div class="group-label" id=${r}>${e.label}</div>${[...e.children].map((e) => e instanceof HTMLOptionElement ? this.renderOption(e, t++) : Z)}</div>`;
		});
	}
	fieldName(e) {
		if (!e) return "";
		let t = e.getAttribute("aria-label");
		if (t) return t;
		let n = e.labels?.[0];
		return n ? [...n.childNodes].filter((e) => !e.contains(this)).map((e) => e.textContent ?? "").join("").trim() : "";
	}
	render() {
		if (!this.field) return super.render();
		let e = this.control(), t = this.fieldName(e), n = this.fieldDisabled ? "disabled" : "";
		return X`<slot @slotchange=${this.observeControl}></slot><span aria-hidden="true" ?hidden=${this.listbox || !!this.swatch} class="arrow ${n}"></span>${this.swatch && !this.listbox ? X`<ds-swatch aria-hidden="true" .value=${this.swatch} class=${n}></ds-swatch>` : null}${this.listed ? X`<ds-menu class="list" id=${this.listId} floating data-ds-hug role="listbox" trigger-mode="manual" aria-label=${t || Z} .anchor=${this} ?open=${this.listOpen} @ds-menu-close=${this.onListClose}>${this.listOpen ? this.renderChoices() : Z}</ds-menu>` : Z}`;
	}
});
//#endregion
//#region src/vendor/ds1/0-face/overlay-swipe.ts
var Wf = 10, Gf = .998, Kf = (e) => e / 1e3 * Gf / .0020000000000000018, qf = (e, t, n = .55) => e * t * n / (t + n * Math.abs(e)), Jf = /* @__PURE__ */ new Set([
	"none",
	"bottom",
	"end",
	"start"
]);
function Yf(e) {
	let t = e.getAttribute("data-ds-edge");
	return t && Jf.has(t) ? t : e.classList.contains("ds-overlay--sheet") ? "bottom" : e.classList.contains("ds-overlay--drawer") ? e.classList.contains("ds-overlay--start") ? "start" : "end" : "none";
}
function Xf(e, t) {
	if (t === "bottom" || t === "none") return {
		axis: "y",
		sign: 1
	};
	let n = e.ownerDocument.defaultView?.getComputedStyle(e).direction === "rtl";
	return {
		axis: "x",
		sign: t === "end" === n ? -1 : 1
	};
}
function Zf(e, t, n, r) {
	let i = t.ownerDocument.defaultView;
	for (let a of e) {
		if (!(a instanceof Element)) continue;
		let e = i?.getComputedStyle(a);
		if (n === "y") {
			if (/auto|scroll/.test(e?.overflowY ?? "") && a.scrollHeight > a.clientHeight && (r > 0 ? a.scrollTop > 0 : a.scrollTop + a.clientHeight < a.scrollHeight - 1)) return !0;
		} else if (/auto|scroll/.test(e?.overflowX ?? "") && a.scrollWidth > a.clientWidth) return !0;
		if (a === t) break;
	}
	return !1;
}
function Qf(e, t, n) {
	let r = e.ownerDocument.defaultView?.getComputedStyle(e).transform;
	if (!r || r === "none" || typeof DOMMatrixReadOnly > "u") return 0;
	try {
		let e = new DOMMatrixReadOnly(r);
		return n * (t === "y" ? e.m42 : e.m41);
	} catch {
		return 0;
	}
}
function $f(e, t = {}) {
	let n = () => (typeof t.edge == "function" ? t.edge() : t.edge) ?? Yf(e), r = null, i = 0, a = e.ownerDocument.defaultView, o = (e) => a?.requestAnimationFrame ? a.requestAnimationFrame(e) : a?.setTimeout(e, 16) ?? 0, s = (t, n, r) => {
		e.style.setProperty("--ds-overlay-drag", `${r * t}px`), e.style.setProperty("--ds-overlay-progress", String(n > 0 ? Math.min(1, Math.max(0, t / n)) : 0));
	}, c = () => {
		e.style.removeProperty("--ds-overlay-drag"), e.style.removeProperty("--ds-overlay-progress"), e.removeAttribute("data-ds-overlay-dragging");
	}, l = () => {
		e.removeAttribute("data-ds-overlay-dragging"), e.style.setProperty("--ds-overlay-drag", "0px"), e.style.setProperty("--ds-overlay-progress", "0");
	}, u = () => {
		if (e.removeAttribute("data-ds-overlay-dragging"), t.onDismiss) t.onDismiss(e);
		else {
			let t = new CustomEvent("ds-close-request", {
				detail: { reason: "swipe" },
				bubbles: !0,
				composed: !0,
				cancelable: !0
			});
			e.dispatchEvent(t) && e.close();
		}
		let n = ++i;
		o(() => o(() => {
			n === i && e.open && l();
		}));
	}, d = (t) => {
		let i = n();
		if (!e.open || i === "none") return;
		if (t.touches.length !== 1) {
			r?.mode === "drag" && l(), r = null;
			return;
		}
		let a = t.composedPath();
		if (a.some((e) => e instanceof Element && e.matches("[data-ds-overlay-no-swipe], input[type=\"range\"], [role=\"slider\"]"))) return;
		let o = t.touches[0], { axis: s, sign: c } = Xf(e, i);
		r = {
			id: o.identifier,
			x: o.clientX,
			y: o.clientY,
			base: Math.max(0, Qf(e, s, c)),
			start: 0,
			mode: "pending",
			offset: 0,
			samples: [],
			target: t.target,
			path: a
		};
	}, f = (t) => {
		if (!r || r.mode === "ignore") return;
		let o = [...t.touches].find((e) => e.identifier === r.id);
		if (!o) return;
		let c = n();
		if (c === "none") {
			r = null;
			return;
		}
		let { axis: l, sign: u } = Xf(e, c), d = o.clientX - r.x, f = o.clientY - r.y, p = l === "y" ? f * u : d * u, m = l === "y" ? d : f;
		if (r.mode === "pending") {
			if (Math.hypot(d, f) < Wf) return;
			if (Math.abs(p) <= Math.abs(m) || Zf(r.path, e, l, p)) {
				r.mode = "ignore";
				return;
			}
			r.mode = "drag", r.start = p, i++, e.setAttribute("data-ds-overlay-dragging", "");
		}
		t.preventDefault();
		let h = e.getBoundingClientRect(), g = l === "y" ? h.height : h.width, _ = r.base + p - r.start;
		r.offset = _ < 0 ? qf(_, g || 1) : _, s(r.offset, g, u);
		let v = t.timeStamp || (a?.performance?.now() ?? Date.now());
		for (r.samples.push({
			time: v,
			offset: r.offset
		}); r.samples.length > 2 && v - r.samples[0].time > 150;) r.samples.shift();
	}, p = (t) => {
		if (!r || [...t.touches].some((e) => e.identifier === r.id)) return;
		let i = r;
		if (r = null, i.mode !== "drag") return;
		let o = n(), { axis: s } = Xf(e, o), c = e.getBoundingClientRect(), d = s === "y" ? c.height : c.width, f = t.timeStamp || (a?.performance?.now() ?? Date.now()), p = i.samples.filter((e) => f - e.time <= 100), m = p[0], h = p[p.length - 1], g = m && h ? h.time - m.time : 0, _ = m && h && g > 0 ? (h.offset - m.offset) / g * 1e3 : 0, v = i.offset + Kf(_);
		t.type !== "touchcancel" && o !== "none" && i.offset > 0 && v > d / 2 && _ > -100 ? u() : l();
	}, m = new MutationObserver(() => {
		e.open && (i++, r = null, c());
	});
	return m.observe(e, {
		attributes: !0,
		attributeFilter: ["open"]
	}), e.addEventListener("touchstart", d, { passive: !0 }), e.addEventListener("touchmove", f, { passive: !1 }), e.addEventListener("touchend", p, { passive: !0 }), e.addEventListener("touchcancel", p, { passive: !0 }), () => {
		m.disconnect(), e.removeEventListener("touchstart", d), e.removeEventListener("touchmove", f), e.removeEventListener("touchend", p), e.removeEventListener("touchcancel", p), i++, r = null, c();
	};
}
//#endregion
//#region src/vendor/ds1/4-page/styles/ds-overlay.css?inline
var ep = "ds-overlay>dialog{box-sizing:border-box;position:var(--ds-overlay-position,fixed);inset:var(--ds-overlay-inset,0);width:var(--ds-overlay-width,calc(20 * var(--ds-unit)));max-width:var(--ds-overlay-max-width,calc(100vw - 2 * var(--ds-unit)));max-height:var(--ds-overlay-max-height,calc(100dvh - 2 * var(--ds-unit)));height:var(--ds-overlay-height,fit-content);margin:var(--ds-overlay-margin,auto);padding:var(--ds-overlay-padding,var(--ds-unit));border:var(--ds-overlay-border,1px solid var(--ds-border-color));background:var(--ds-overlay-paper,var(--ds-paper));color:var(--ds-text-color);z-index:var(--ds-overlay-layer,auto);box-shadow:none;overflow:var(--ds-overlay-overflow,auto);overscroll-behavior:contain;font-family:var(--ds-typeface-regular);font-feature-settings:var(--ds-font-features);font-size:var(--ds-type-size-default);font-weight:var(--ds-type-weight-default);line-height:var(--ds-type-lineheight-default);letter-spacing:var(--ds-type-letterspacing-default);border-radius:0}ds-overlay>dialog[open]{gap:var(--ds-unit);flex-direction:column;display:flex}ds-overlay>dialog:not([open]){display:none}ds-overlay>dialog[data-ds-type=popover]{inset:auto;left:var(--ds-overlay-anchor-left,0px);top:var(--ds-overlay-anchor-top,0px);margin:calc(var(--ds-unit) / 2);width:var(--ds-overlay-width,max-content);max-width:var(--ds-overlay-available-width,calc(100vw - var(--ds-unit)));max-height:var(--ds-overlay-available-height,calc(100dvh - var(--ds-unit)))}ds-overlay>dialog[data-ds-type=popover]:has(>ds-calendar[compact]){border:0;gap:0;margin:0;padding:0}ds-overlay>dialog[data-ds-overlay-flush]{gap:0;padding:0}ds-overlay>dialog[data-ds-overlay-rotated]{width:calc(100dvh - 2 * var(--ds-unit));height:calc(100vw - 2 * var(--ds-unit));max-width:none;max-height:none;margin:0;inset:50% auto auto 50%;transform:translate(-50%,-50%)rotate(90deg)}ds-overlay>dialog[data-ds-type=screen][data-ds-overlay-rotated]{width:100dvh;height:100vw}ds-overlay>dialog::backdrop{background:color-mix(in srgb, var(--ds-black) 40%, transparent)}ds-overlay [data-ds-overlay=header]{flex-direction:column;display:flex}ds-overlay>dialog:has(>[data-ds-overlay=close]) [data-ds-overlay=header]{padding-inline-end:var(--ds-unit)}ds-overlay [data-ds-overlay=title]{min-height:var(--ds-row-height);color:var(--ds-text-color);font:inherit;font-weight:var(--ds-type-weight-bold);line-height:var(--ds-type-lineheight-default);align-items:flex-end;margin:0;display:flex}ds-overlay [data-ds-overlay=description]{color:var(--ds-text-color-muted);font:inherit;margin:0}ds-overlay [data-ds-overlay=footer]{justify-content:flex-end;align-items:center;gap:calc(var(--ds-unit) / 2);min-height:var(--ds-row-height);flex-wrap:wrap;display:flex}ds-overlay [data-ds-overlay=close]{top:var(--ds-unit);right:var(--ds-unit);position:absolute}ds-overlay>dialog[data-ds-overlay-inline]{background:0 0;border:0;gap:0;width:100%;max-width:none;max-height:none;margin:0;padding:0;position:relative;inset:auto}", tp = ":is(ds-overlay>dialog[data-ds-edge=bottom],dialog.ds-overlay.ds-overlay--sheet),:is(ds-overlay>dialog[data-ds-edge=end],dialog.ds-overlay.ds-overlay--drawer:not(.ds-overlay--start)),:is(ds-overlay>dialog[data-ds-edge=start],dialog.ds-overlay.ds-overlay--drawer.ds-overlay--start){--ds-overlay-gap:var(--ds-unit);--ds-overlay-inner:var(--ds-overlay-padding,var(--ds-unit));--ds-overlay-within:max(0px, var(--ds-overlay-inner) - var(--ds-overlay-line,1px));--ds-overlay-motion:var(--ds-overlay-enter,.38s);--ds-overlay-curve:var(--ds-overlay-easing,cubic-bezier(.32, .72, 0, 1));gap:var(--ds-overlay-gap);transform:var(--ds-overlay-held);transition:transform var(--ds-overlay-motion) var(--ds-overlay-curve), opacity var(--ds-overlay-motion) var(--ds-overlay-curve), overlay var(--ds-overlay-motion) allow-discrete, display var(--ds-overlay-motion) allow-discrete;margin:0}:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer))[data-ds-overlay-flush]{--ds-overlay-inner:0px;--ds-overlay-gap:0px}:is(ds-overlay>dialog[data-ds-edge=bottom],dialog.ds-overlay.ds-overlay--sheet){--ds-overlay-held:translateY(var(--ds-overlay-drag,0px));--ds-overlay-away:translateY(100%);width:var(--ds-overlay-width,100%);max-width:min(100%, var(--ds-overlay-sheet-width,calc(32 * var(--ds-unit))));height:var(--ds-overlay-height,fit-content);max-height:calc(100dvh - var(--ds-overlay-sheet-gap,calc(2 * var(--ds-unit))) - env(safe-area-inset-top,0px));padding:var(--ds-overlay-within) calc(var(--ds-overlay-inner) + env(safe-area-inset-right,0px)) calc(var(--ds-overlay-inner) + env(safe-area-inset-bottom,0px)) calc(var(--ds-overlay-inner) + env(safe-area-inset-left,0px));border-bottom:0;margin:0 auto;inset:auto 0 0}:is(ds-overlay>dialog[data-ds-edge=bottom],dialog.ds-overlay.ds-overlay--sheet):before{--ds-overlay-handle-height:calc(4px * var(--ds-sf,1));content:\"\";display:var(--ds-overlay-handle,block);z-index:1;top:calc((var(--ds-unit) - var(--ds-overlay-handle-height)) / 2 - var(--ds-overlay-line,1px) - var(--ds-overlay-within));width:calc(2 * var(--ds-unit));height:var(--ds-overlay-handle-height);margin-top:calc(var(--ds-overlay-inner) * -1 + (var(--ds-unit) - var(--ds-overlay-handle-height)) / 2);margin-bottom:calc(var(--ds-overlay-inner) - var(--ds-overlay-gap) - var(--ds-overlay-handle-height) - (var(--ds-unit) - var(--ds-overlay-handle-height)) / 2);border-radius:calc(var(--ds-overlay-handle-height) / 2);background:var(--ds-overlay-handle-color,var(--ds-border-color));pointer-events:none;flex:none;align-self:center;position:sticky}:is(ds-overlay>dialog[data-ds-edge=end],dialog.ds-overlay.ds-overlay--drawer:not(.ds-overlay--start)),:is(ds-overlay>dialog[data-ds-edge=start],dialog.ds-overlay.ds-overlay--drawer.ds-overlay--start){--ds-overlay-held:translateX(var(--ds-overlay-drag,0px));width:calc(var(--ds-overlay-width,calc(16 * var(--ds-unit))) + var(--ds-overlay-safe-side,0px));max-width:calc(100vw - 2 * var(--ds-unit));border-top:0;border-bottom:0;height:100dvh;max-height:none}:is(:is(ds-overlay>dialog[data-ds-edge=end],dialog.ds-overlay.ds-overlay--drawer:not(.ds-overlay--start)):not(:is(:lang(ae),:lang(ar),:lang(arc),:lang(bcc),:lang(bqi),:lang(ckb),:lang(dv),:lang(fa),:lang(glk),:lang(he),:lang(ku),:lang(mzn),:lang(nqo),:lang(pnb),:lang(ps),:lang(sd),:lang(ug),:lang(ur),:lang(yi))),:is(ds-overlay>dialog[data-ds-edge=start],dialog.ds-overlay.ds-overlay--drawer.ds-overlay--start):is(:lang(ae),:lang(ar),:lang(arc),:lang(bcc),:lang(bqi),:lang(ckb),:lang(dv),:lang(fa),:lang(glk),:lang(he),:lang(ku),:lang(mzn),:lang(nqo),:lang(pnb),:lang(ps),:lang(sd),:lang(ug),:lang(ur),:lang(yi))){--ds-overlay-away:translateX(100%);--ds-overlay-safe-side:env(safe-area-inset-right,0px);padding:calc(var(--ds-overlay-inner) + env(safe-area-inset-top,0px)) calc(var(--ds-overlay-inner) + env(safe-area-inset-right,0px)) calc(var(--ds-overlay-inner) + env(safe-area-inset-bottom,0px)) var(--ds-overlay-within);border-right:0;inset:0 0 0 auto}:is(:is(ds-overlay>dialog[data-ds-edge=start],dialog.ds-overlay.ds-overlay--drawer.ds-overlay--start):not(:is(:lang(ae),:lang(ar),:lang(arc),:lang(bcc),:lang(bqi),:lang(ckb),:lang(dv),:lang(fa),:lang(glk),:lang(he),:lang(ku),:lang(mzn),:lang(nqo),:lang(pnb),:lang(ps),:lang(sd),:lang(ug),:lang(ur),:lang(yi))),:is(ds-overlay>dialog[data-ds-edge=end],dialog.ds-overlay.ds-overlay--drawer:not(.ds-overlay--start)):is(:lang(ae),:lang(ar),:lang(arc),:lang(bcc),:lang(bqi),:lang(ckb),:lang(dv),:lang(fa),:lang(glk),:lang(he),:lang(ku),:lang(mzn),:lang(nqo),:lang(pnb),:lang(ps),:lang(sd),:lang(ug),:lang(ur),:lang(yi))){--ds-overlay-away:translateX(-100%);--ds-overlay-safe-side:env(safe-area-inset-left,0px);padding:calc(var(--ds-overlay-inner) + env(safe-area-inset-top,0px)) var(--ds-overlay-within) calc(var(--ds-overlay-inner) + env(safe-area-inset-bottom,0px)) calc(var(--ds-overlay-inner) + env(safe-area-inset-left,0px));border-left:0;inset:0 auto 0 0}:root:has(dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer):modal){overscroll-behavior:none;overflow:hidden}:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer)):not([open]){--ds-overlay-motion:var(--ds-overlay-exit,.26s);transform:var(--ds-overlay-away)}@starting-style{:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer))[open]{transform:var(--ds-overlay-away)}}:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer))::backdrop{opacity:calc(1 - var(--ds-overlay-progress,0));transition:opacity var(--ds-overlay-motion,.38s) ease, overlay var(--ds-overlay-motion,.38s) allow-discrete, display var(--ds-overlay-motion,.38s) allow-discrete}:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer)):not([open])::backdrop{opacity:0}@starting-style{:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer))[open]::backdrop{opacity:0}}:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer))[data-ds-overlay-dragging]{transition:none}:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer))[data-ds-overlay-dragging]::backdrop{transition:none}@media (prefers-reduced-motion:reduce){:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer)){--ds-overlay-motion:.15s;transition:opacity var(--ds-overlay-motion) ease, overlay var(--ds-overlay-motion) allow-discrete, display var(--ds-overlay-motion) allow-discrete}:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer)):not([open]){--ds-overlay-motion:.15s;transform:var(--ds-overlay-held);opacity:0}@starting-style{:is(ds-overlay>dialog[data-ds-edge],dialog.ds-overlay:is(.ds-overlay--sheet,.ds-overlay--drawer))[open]{transform:var(--ds-overlay-held);opacity:0}}}:is(ds-overlay>dialog[data-ds-type=screen],dialog.ds-overlay.ds-overlay--screen){--ds-overlay-width:100vw;width:100vw;max-width:none;height:100dvh;max-height:none;padding:var(--ds-unit);background:var(--ds-overlay-paper,var(--background,Canvas));border:0;gap:0;margin:0;overflow-y:auto}:is(ds-overlay>dialog[data-ds-type=screen],dialog.ds-overlay.ds-overlay--screen)[open]{align-items:stretch;gap:var(--ds-unit);flex-direction:column;display:flex}:is(ds-overlay>dialog[data-ds-type=screen],dialog.ds-overlay.ds-overlay--screen)[data-ds-overlay-flush]{gap:0;padding:0}:is(ds-overlay>dialog[data-ds-type=screen],dialog.ds-overlay.ds-overlay--screen)::backdrop{background:0 0}@media (prefers-reduced-motion:no-preference){:is(ds-overlay>dialog[data-ds-type=screen],dialog.ds-overlay.ds-overlay--screen)[open]{transition:opacity .16s ease-out,transform .16s ease-out}@starting-style{:is(ds-overlay>dialog[data-ds-type=screen],dialog.ds-overlay.ds-overlay--screen)[open]{opacity:0;transform:translateY(calc(var(--ds-unit) / -2))}}}.ds-overlay__bar{min-height:var(--ds-row-height);justify-content:flex-end;align-items:center;display:flex}.ds-overlay__bar>.ds-overlay__close{margin-inline-end:calc((var(--ds-unit) - var(--ds-control-height)) / 2)}.ds-overlay__toggle:not([aria-expanded=true])>:nth-child(2),.ds-overlay__toggle[aria-expanded=true]>:first-child:not(:only-child),.ds-overlay__close>:first-child:not(:only-child){display:none}", np = "[data-ds-shape=square],:host([data-ds-shape=square]){--ds-corner-size:0px;--ds-corner-shape:round;--ds-button-inset:.5px}[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:4px;--ds-corner-shape:round;--ds-button-inset:2.5px}[data-ds-shape=circular],:host([data-ds-shape=circular]){--ds-corner-size:999px;--ds-corner-shape:round;--ds-button-inset:5px}@supports (corner-shape:squircle){[data-ds-shape=rounded],:host([data-ds-shape=rounded]){--ds-corner-size:8px;--ds-corner-shape:squircle}}:root,:host,:where([data-ds-surface]){--ds-unit:calc(var(--ds-1,20px) * var(--ds-sf,1));--ds-control-height:calc(var(--ds-control-size,var(--ds-08,16px)) * var(--ds-sf,1));--ds-row-height:calc(var(--ds-row-size,var(--ds-1,20px)) * var(--ds-sf,1));--ds-type-size-default:calc(var(--ds-text-size,14px) * var(--ds-sf,1));--ds-type-size-small:calc(var(--ds-small-text-size,10px) * var(--ds-sf,1));--ds-type-size-heading:calc(var(--ds-heading-text-size,13px) * var(--ds-sf,1));--ds-type-size-display:calc(var(--ds-display-text-size,20px) * var(--ds-sf,1));--ds-type-lineheight-default:calc(var(--ds-text-leading,16px) * var(--ds-sf,1));--ds-type-letterspacing-default:calc(var(--ds-text-tracking,-.3px) * var(--ds-sf,1));--ds-radius:calc(var(--ds-corner-size,4px) * var(--ds-sf,1));--ds-radius-card:calc(var(--ds-card-corner-size,4px) * var(--ds-sf,1))}", rp = `${ep}\n${tp}`, ip = /* @__PURE__ */ new Set([
	"modal",
	"sheet",
	"drawer",
	"popover",
	"screen"
]), ap = () => typeof matchMedia == "function" && matchMedia("(max-width: 768px)").matches, op = /* @__PURE__ */ new WeakMap(), sp = /* @__PURE__ */ new WeakMap();
function cp(e) {
	let t = [...op.get(e) ?? []], n = t.some((e) => !e.modeless || e.holdScroll), r = t.some((e) => !e.modeless), i = sp.get(e);
	if (!n && !i) return;
	i || (i = {
		declarations: [],
		x: e.defaultView?.scrollX ?? 0,
		y: e.defaultView?.scrollY ?? 0
	}, sp.set(e, i));
	let a = e.documentElement.style, o = e.body.style, s = n ? [
		[
			a,
			"overflow",
			"hidden"
		],
		[
			a,
			"overscroll-behavior",
			"none"
		],
		[
			o,
			"overscroll-behavior",
			"none"
		],
		[
			o,
			"touch-action",
			"none"
		]
	] : [];
	r && s.push([
		o,
		"position",
		"fixed"
	], [
		o,
		"top",
		`${-i.y}px`
	], [
		o,
		"left",
		`${-i.x}px`
	], [
		o,
		"width",
		"100%"
	]);
	let c = i.declarations.some((e) => e.name === "position");
	for (let e of [...i.declarations]) s.some(([t, n]) => t === e.style && n === e.name) || (e.style.getPropertyValue(e.name) === e.locked && e.style.getPropertyPriority(e.name) === "important" && (e.value ? e.style.setProperty(e.name, e.value, e.priority) : e.style.removeProperty(e.name)), i.declarations.splice(i.declarations.indexOf(e), 1));
	for (let [e, t, n] of s) i.declarations.some((n) => n.style === e && n.name === t) || (i.declarations.push({
		style: e,
		name: t,
		locked: n,
		value: e.getPropertyValue(t),
		priority: e.getPropertyPriority(t)
	}), e.setProperty(t, n, "important"));
	(!n || c && !r) && e.defaultView && (e.defaultView.scrollX !== i.x || e.defaultView.scrollY !== i.y) && e.defaultView.scrollTo(i.x, i.y), n || sp.delete(e);
}
var lp = /* @__PURE__ */ new WeakSet();
function up(e) {
	if (!(e instanceof ShadowRoot) || lp.has(e)) return;
	let t = new CSSStyleSheet();
	t.replaceSync(rp), e.adoptedStyleSheets = [...e.adoptedStyleSheets, t], lp.add(e);
}
Bc("ds-overlay", class extends Rc {
	static properties = {
		open: {
			type: Boolean,
			reflect: !0
		},
		nonModal: {
			type: Boolean,
			attribute: "non-modal",
			reflect: !0
		},
		closeOnOutside: {
			type: Boolean,
			attribute: "close-on-outside"
		},
		blockOutside: {
			type: Boolean,
			attribute: "block-outside"
		},
		holdScroll: {
			type: Boolean,
			attribute: "hold-scroll"
		},
		closeOnEscape: {
			type: Boolean,
			attribute: "close-on-escape"
		},
		closeOnBackdrop: {
			type: Boolean,
			attribute: "close-on-backdrop"
		},
		type: {
			type: String,
			reflect: !0
		},
		side: {
			type: String,
			reflect: !0
		},
		anchor: { attribute: !1 },
		returnFocus: { attribute: !1 }
	};
	static styles = [Ps(np), Fs`:host { display: contents; } :host([hidden]) { display: none !important; }`];
	dialog = null;
	opener = null;
	pointerStartedOutside = !1;
	pendingOpen = null;
	outsidePress = null;
	observer = new MutationObserver(() => this.bindDialog());
	sizeObserver = null;
	unbindSwipe = null;
	constructor() {
		super(), this.open = !1, this.nonModal = !1, this.closeOnOutside = !1, this.blockOutside = !1, this.holdScroll = !1, this.closeOnEscape = !0, this.closeOnBackdrop = !0, this.type = "modal", this.side = "end", this.anchor = null, this.returnFocus = null;
	}
	connectedCallback() {
		super.connectedCallback(), up(this.getRootNode()), this.observer.observe(this, { childList: !0 }), this.bindDialog();
	}
	disconnectedCallback() {
		this.observer.disconnect(), this.detachDialog(), super.disconnectedCallback();
	}
	updated() {
		this.syncType(), this.syncOpen(), this.place();
	}
	get kind() {
		let e = ip.has(this.type) ? this.type : "modal";
		return e === "modal" && ap() ? "sheet" : e;
	}
	get modeless() {
		return this.nonModal || this.kind === "popover";
	}
	get edge() {
		return this.kind === "sheet" ? "bottom" : this.kind === "drawer" ? this.side === "start" ? "start" : "end" : "none";
	}
	syncType() {
		let e = this.dialog;
		if (!e) return;
		e.setAttribute("data-ds-type", this.kind);
		let t = this.edge;
		t === "none" ? e.removeAttribute("data-ds-edge") : e.setAttribute("data-ds-edge", t), t !== "none" && !this.unbindSwipe ? this.unbindSwipe = $f(e, {
			edge: () => this.edge,
			onDismiss: () => this.requestClose("swipe")
		}) : t === "none" && this.unbindSwipe && (this.unbindSwipe(), this.unbindSwipe = null);
	}
	place = () => {
		let e = this.dialog, t = this.ownerDocument.defaultView;
		if (!e || !t || this.kind !== "popover" || !this.anchor || !e.open) return;
		let n = t.visualViewport, r = n?.offsetLeft ?? 0, i = n?.offsetTop ?? 0, a = n?.width ?? t.innerWidth, o = n?.height ?? t.innerHeight, s = parseFloat(t.getComputedStyle(e).marginLeft) || 0;
		e.style.setProperty("--ds-overlay-available-width", `${Math.max(0, a - 2 * s)}px`), e.style.setProperty("--ds-overlay-available-height", `${Math.max(0, o - 2 * s)}px`);
		let c = e.getBoundingClientRect();
		e.style.setProperty("--ds-overlay-anchor-left", `${Math.max(r, Math.min(this.anchor.x - s, r + a - c.width - 2 * s))}px`), e.style.setProperty("--ds-overlay-anchor-top", `${Math.max(i, Math.min(this.anchor.y - s, i + o - c.height - 2 * s))}px`);
	};
	bindDialog = () => {
		let e = this.querySelector(":scope > dialog");
		e === this.dialog || (this.detachDialog(), this.dialog = e, e?.addEventListener("cancel", this.onCancel), e?.addEventListener("close", this.onNativeClose), e?.addEventListener("pointerdown", this.onPointerDown), e?.addEventListener("click", this.onClick), this.syncType()), this.syncOpen();
	};
	detachDialog() {
		let e = this.dialog;
		e?.removeEventListener("cancel", this.onCancel), e?.removeEventListener("close", this.onNativeClose), e?.removeEventListener("pointerdown", this.onPointerDown), e?.removeEventListener("click", this.onClick), this.unbindSwipe?.(), this.unbindSwipe = null, e?.removeAttribute("data-ds-type"), e?.removeAttribute("data-ds-edge"), e?.open && e.close(), this.release(), this.dialog = null;
	}
	syncOpen() {
		let e = this.dialog;
		if (e && this.isConnected) {
			if (this.open && !e.open) {
				if (this.pendingOpen) return;
				let t = [...e.querySelectorAll("*")].map((e) => e.updateComplete);
				this.pendingOpen = Promise.all(t).then(() => {
					this.pendingOpen = null, this.dialog !== e || !this.open || !this.isConnected ? this.syncOpen() : this.showDialog(e);
				});
			} else this.open || (e.open && e.close(), this.release());
		}
	}
	async show({ immediate: e = !1 } = {}) {
		if (this.open = !0, e) {
			this.performUpdate();
			for (let e of this.querySelectorAll("*")) e.renderNow?.();
			this.bindDialog(), this.dialog && this.isConnected && this.showDialog(this.dialog);
		}
		await this.updateComplete, await this.pendingOpen;
	}
	close() {
		this.open = !1, this.syncOpen();
	}
	showDialog(e) {
		if (e.open) return;
		let t = this.ownerDocument.activeElement;
		for (; t?.shadowRoot?.activeElement;) t = t.shadowRoot.activeElement;
		this.opener ??= t instanceof HTMLElement ? t : null;
		let n = this.ownerDocument, r = op.get(n);
		r || op.set(n, r = /* @__PURE__ */ new Set()), r.add(this), cp(n);
		try {
			this.modeless ? e.show() : e.showModal();
		} catch (e) {
			throw r.delete(this), cp(n), e;
		}
		this.place(), typeof ResizeObserver < "u" && (this.sizeObserver = new ResizeObserver(this.place), this.sizeObserver.observe(e)), n.defaultView?.addEventListener("resize", this.place), n.defaultView?.visualViewport?.addEventListener("resize", this.place), n.defaultView?.visualViewport?.addEventListener("scroll", this.place), n.addEventListener("keydown", this.onDocumentKey), n.addEventListener("pointerdown", this.onOutsidePress, !0), n.addEventListener("click", this.onOutsideClick, !0), n.addEventListener("wheel", this.onScrollGesture, { passive: !1 }), n.addEventListener("touchmove", this.onScrollGesture, { passive: !1 });
	}
	release() {
		let e = this.ownerDocument;
		this.sizeObserver?.disconnect(), this.sizeObserver = null, e.defaultView?.removeEventListener("resize", this.place), e.defaultView?.visualViewport?.removeEventListener("resize", this.place), e.defaultView?.visualViewport?.removeEventListener("scroll", this.place);
		let t = op.get(e), n = t ? [...t] : [], r = n[n.length - 1] === this;
		if (!t?.delete(this)) return;
		cp(e), e.removeEventListener("keydown", this.onDocumentKey), e.removeEventListener("pointerdown", this.onOutsidePress, !0), e.removeEventListener("click", this.onOutsideClick, !0), e.removeEventListener("wheel", this.onScrollGesture), e.removeEventListener("touchmove", this.onScrollGesture), this.outsidePress = null;
		let i = e.activeElement;
		for (; i?.shadowRoot?.activeElement;) i = i.shadowRoot.activeElement;
		let a = i;
		for (; a && !this.dialog?.contains(a);) {
			let e = a.getRootNode();
			a = e instanceof ShadowRoot ? e.host : null;
		}
		if (r && (!this.modeless || i === e.body || i === this.dialog || a)) {
			let e = this.returnFocus;
			e ? queueMicrotask(() => {
				let t = e();
				t?.isConnected && t.focus({ preventScroll: !0 });
			}) : this.opener?.isConnected && this.opener.focus({ preventScroll: !0 });
		}
		this.opener = null;
	}
	requestClose(e = "button") {
		if (!this.open) return;
		let t = new CustomEvent("ds-close-request", {
			detail: { reason: e },
			bubbles: !0,
			composed: !0,
			cancelable: !0
		});
		this.dispatchEvent(t) && this.close();
	}
	isTop() {
		let e = [...op.get(this.ownerDocument) ?? []];
		return e[e.length - 1] === this;
	}
	onDocumentKey = (e) => {
		this.modeless && this.isTop() && !e.defaultPrevented && (e.key === "Escape" && this.closeOnEscape ? (e.preventDefault(), e.stopImmediatePropagation(), this.requestClose("escape")) : this.holdScroll && !e.composedPath().includes(this) && !e.composedPath().some((e) => e instanceof HTMLElement && (e.isContentEditable || e.matches("input, textarea, select"))) && [
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"PageUp",
			"PageDown",
			"Home",
			"End",
			" "
		].includes(e.key) && e.preventDefault());
	};
	onScrollGesture = (e) => {
		this.modeless && this.holdScroll && this.isTop() && !e.composedPath().includes(this) && e.preventDefault();
	};
	onOutsidePress = (e) => {
		this.modeless && this.isTop() && (this.outsidePress = !e.composedPath().includes(this), this.outsidePress && this.blockOutside && (e.preventDefault(), e.stopImmediatePropagation()));
	};
	onOutsideClick = (e) => {
		this.modeless && this.isTop() && !e.composedPath().includes(this) && (this.blockOutside && (e.preventDefault(), e.stopImmediatePropagation()), this.closeOnOutside && this.outsidePress !== !1 && this.requestClose("outside"), this.outsidePress = null);
	};
	onCancel = (e) => {
		e.preventDefault(), this.closeOnEscape && this.requestClose("escape");
	};
	onNativeClose = () => {
		!this.open || this.dialog?.open || this.pendingOpen || (this.requestClose("native"), this.syncOpen());
	};
	outside(e) {
		let t = this.dialog;
		if (!t || e.target !== t) return !1;
		let n = t.getBoundingClientRect();
		return e.clientX < n.left || e.clientX > n.right || e.clientY < n.top || e.clientY > n.bottom;
	}
	onPointerDown = (e) => {
		this.pointerStartedOutside = e.button === 0 && this.outside(e);
	};
	onClick = (e) => {
		e.defaultPrevented || (e.composedPath().find((e) => e instanceof HTMLElement && e.hasAttribute("data-ds-overlay-dismiss"))?.closest("dialog") === this.dialog ? this.requestClose("button") : this.closeOnBackdrop && this.pointerStartedOutside && this.outside(e) && this.requestClose("backdrop")), this.pointerStartedOutside = !1;
	};
	render() {
		return X`<slot @slotchange=${this.bindDialog}></slot>`;
	}
});
//#endregion
//#region src/button-partial.ts
var dp = [
	"default",
	"primary",
	"secondary",
	"active",
	"disabled",
	"danger"
], fp = /@Button\(("(?:[^"\\\n]|\\.)*"),\s*"(default|primary|secondary|active|disabled|danger)"\)/;
function pp(e) {
	let t = fp.exec(e);
	if (!t || t[0] !== e) return null;
	try {
		let e = JSON.parse(t[1]);
		return typeof e == "string" && !/[\r\n]/.test(e) ? {
			label: e,
			state: t[2]
		} : null;
	} catch {
		return null;
	}
}
function mp({ label: e, state: t }) {
	return `@Button(${JSON.stringify(e.replace(/[\r\n]/g, " "))}, "${t}")`;
}
var hp = Ii("button-partial", fp, (e) => !!pp(e[0]));
function gp(e, t) {
	e.textContent = t.label;
	for (let n of dp) n !== "default" && (e[n] = t.state === n);
	e.literal = !0;
}
//#endregion
//#region src/partials.ts
function _p(e) {
	return {
		...hp,
		draw(t, n) {
			let r = pp(n);
			t.classList.add("aa-partial"), t.setAttribute("data-aa-interactive", "");
			let i = document.createElement("ds-button");
			i.inert = !0, i.setAttribute("aria-hidden", "true"), gp(i, r), t.append(i);
			let a, o = () => {
				t.tabIndex = e() ? 0 : -1, t.setAttribute("role", e() ? "button" : "img"), t.setAttribute("aria-label", `${e() ? "Edit button" : "Button"}: ${r.label}, ${r.state}`);
			};
			o();
			let s = new MutationObserver(o);
			queueMicrotask(() => {
				t.isConnected && s.observe(t.closest(".aa-block"), {
					attributes: !0,
					attributeFilter: ["data-readonly"]
				});
			});
			let c = () => {
				if (!e() || a) return;
				let s = t.ownerDocument;
				if (!s.querySelector("style[data-aa-partial-overlay]")) {
					let e = s.createElement("style");
					e.dataset.aaPartialOverlay = "", e.textContent = ep, s.head.append(e);
				}
				let c = s.createElement("ds-overlay");
				c.type = "popover", c.closeOnOutside = !0, c.returnFocus = () => t, c.setAttribute("data-aa-interactive", "");
				let l = t.getBoundingClientRect();
				c.anchor = {
					x: l.left,
					y: l.bottom
				};
				let u = s.createElement("dialog");
				u.className = "aa-partial-properties", u.setAttribute("aria-label", "Edit button");
				let d = s.createElement("ds-input");
				d.labelText = "Label", d.value = r.label, d.setAttribute("aria-label", "Button label");
				let f = s.createElement("label");
				f.textContent = "State";
				let p = s.createElement("ds-select"), m = s.createElement("select");
				m.setAttribute("aria-label", "Button state");
				for (let e of dp) {
					let t = s.createElement("option");
					t.value = e, t.textContent = e[0].toUpperCase() + e.slice(1), m.append(t);
				}
				m.value = r.state, p.append(m), f.append(p);
				let h = s.createElement("div");
				h.className = "aa-partial-actions";
				let g = s.createElement("ds-button");
				g.textContent = "Cancel";
				let _ = s.createElement("ds-button");
				_.textContent = "Apply", _.primary = !0;
				let v = s.createElement("ds-button");
				v.inert = !0, v.setAttribute("aria-hidden", "true"), gp(v, r);
				let y = () => ({
					label: d.value,
					state: m.value
				}), b = () => gp(v, y());
				d.addEventListener("input", b), m.addEventListener("change", b);
				let x = () => {
					c.close(), c.remove(), a = void 0;
				};
				a = x, g.addEventListener("click", x), _.addEventListener("click", () => {
					if (!e()) {
						x();
						return;
					}
					let a = mp(y());
					x(), a !== n && (r = y(), n = a, gp(i, r), o(), t.dispatchEvent(new CustomEvent("aa-atom-source", {
						bubbles: !0,
						detail: { source: a }
					})));
				}), c.addEventListener("ds-close-request", (e) => {
					e.preventDefault(), x();
				}), h.append(g, _), u.append(d, f, v, h), c.append(u), (t.closest("dialog") ?? s.body).append(c), c.show({ immediate: !0 }).then(() => {
					c.isConnected && d.focus();
				});
			};
			return t.addEventListener("click", (e) => {
				e.preventDefault(), e.stopPropagation(), c();
			}), t.addEventListener("keydown", (n) => {
				(n.key === "Backspace" || n.key === "Delete") && e() && (n.preventDefault(), n.stopPropagation(), t.dispatchEvent(new CustomEvent("aa-atom-source", {
					bubbles: !0,
					detail: { source: "" }
				}))), (n.key === "Enter" || n.key === " ") && (n.preventDefault(), n.stopPropagation(), c());
			}), () => {
				s.disconnect(), a?.();
			};
		}
	};
}
function vp(e) {
	let t = e.element, n = t.ownerDocument, r = n.createElement("ds-menu");
	r.floating = !0, r.focusOnOpen = !1, r.setAttribute("aria-label", "Button state"), r.id = `aa-partials-${crypto.randomUUID()}`;
	let i = null, a = !1, o = "", s = () => {
		r.open = !1, i = null;
	}, c = dp.map((t, a) => {
		let o = n.createElement("ds-button");
		return o.menuItem = !0, o.setAttribute("role", "option"), o.id = `${r.id}-${a}`, o.textContent = t[0].toUpperCase() + t.slice(1), o.addEventListener("click", () => {
			let n = i;
			if (!n || e.readOnly || !/^@button$/i.test(e.value.slice(n.start, n.end))) return;
			let r = mp({
				label: "Button",
				state: t
			});
			s(), e.replace(n.start, n.end, r), e.selectRange(n.start + r.length);
		}), o;
	});
	r.append(...c), (t.closest("dialog") ?? n.body).append(r);
	let l = () => {
		if (a) return;
		let n = e.selection(), l = e.activeBlock();
		if (e.readOnly || !n || n.start !== n.end || !l || ["code", "table"].includes(l.block.kind)) {
			s();
			return;
		}
		let u = e.value.slice(l.start, n.end), d = /(?:^|\s)(@button)$/i.exec(u), f = `${n.end}:${e.value}`;
		if (!d || o === f) {
			s();
			return;
		}
		let p = e.rangeOf(n.end - 7, n.end);
		(p?.startContainer.parentElement)?.closest(".aa-c, code, a") ? s() : (i = {
			start: n.end - d[1].length,
			end: n.end
		}, r.controller = t.children[l.index], r.anchor = p?.getBoundingClientRect?.() ?? r.controller.getBoundingClientRect(), r.open || (r.activeId = c[0].id), r.open = !0, r.renderNow());
	};
	r.addEventListener("ds-menu-close", () => {
		o = `${e.selection()?.end}:${e.value}`, i = null;
	});
	let u = () => {
		a = !0, s();
	}, d = () => {
		a = !1, l();
	};
	return t.addEventListener("aa-change", l), t.addEventListener("aa-selectionchange", l), t.addEventListener("compositionstart", u), t.addEventListener("compositionend", d), () => {
		r.remove(), t.removeEventListener("aa-change", l), t.removeEventListener("aa-selectionchange", l), t.removeEventListener("compositionstart", u), t.removeEventListener("compositionend", d);
	};
}
//#endregion
//#region src/marks.ts
function yp(e, t) {
	let n = (e) => e.match(/\s+|[^\s]+/g) ?? [], r = n(e), i = n(t);
	if (r.length * i.length > 6e4) return t.trim() ? [[0, t.length]] : [];
	let a = Array.from({ length: r.length + 1 }, () => new Uint16Array(i.length + 1));
	for (let e = r.length - 1; e >= 0; e--) for (let t = i.length - 1; t >= 0; t--) a[e][t] = r[e] === i[t] ? a[e + 1][t + 1] + 1 : Math.max(a[e + 1][t], a[e][t + 1]);
	let o = Array(i.length).fill(!1), s = 0, c = 0;
	for (; c < i.length;) s < r.length && r[s] === i[c] ? (s++, c++) : s < r.length && a[s + 1][c] >= a[s][c + 1] ? s++ : (o[c] = !0, c++);
	let l = [], u = 0;
	return i.forEach((e, t) => {
		let n = u;
		u += e.length, o[t] && e.trim() && (l.length && (o[t - 1] || t > 1 && !i[t - 1].trim() && o[t - 2]) ? l[l.length - 1][1] = u : l.push([n, u]));
	}), l;
}
function bp(e, t) {
	let n = /^(\s*[-*+][ \t]+)\[([ xX])\]/, r = n.exec(e), i = n.exec(t);
	return !!r && !!i && r[2].toLowerCase() !== i[2].toLowerCase() && e.slice(r[0].length) === t.slice(i[0].length);
}
function xp(e, t) {
	let n = e.ownerDocument, r = n.defaultView, i = [], a = null, o = 0, s = () => i.filter((e) => e.blocks.every((e) => t.blocks().includes(e))), c = () => {
		o = 0, i = s(), t.shown?.(i);
		let r = t.elements(), c = t.blocks();
		for (let e of r) e.toggleAttribute("data-ai-box", i.some((t) => t.box && t.blocks.some((t) => r[c.indexOf(t)] === e)));
		if (!i.length) {
			a?.remove(), a = null;
			return;
		}
		if (!a) {
			let r = n.createElement("div");
			r.className = "aa-ai-marks", (t.root ?? e.closest("dialog") ?? n.body).append(r), a = r;
		}
		let u = i.map((e) => {
			let a = e.blocks.map((e) => r[c.indexOf(e)]?.getBoundingClientRect()).filter((e) => !!e);
			if (!a.length) return null;
			let o = e.blocks.length > 1 || e.before.length > 1 || /^(`{3,}|~{3,})/.test(e.blocks[0]?.source ?? ""), s = n.createElement("div");
			s.className = "aa-ai-mark", s.dataset.kind = o ? "section" : "dot";
			let u = Math.min(...a.map((e) => e.top)), d = Math.max(...a.map((e) => e.bottom)), f = Math.min(...a.map((e) => e.left)), p = Math.max(...a.map((e) => e.right));
			if (o) {
				let e = n.createElement("div");
				e.className = "aa-ai-hold", Object.assign(e.style, {
					left: `${f - 4}px`,
					top: `${u - 4}px`,
					width: `${p - f + 8}px`,
					height: `${d - u + 8}px`
				}), s.append(e);
			}
			let m = o ? {
				x: p,
				y: u + 10
			} : Sp(r[c.indexOf(e.blocks[0])]) ?? {
				x: p,
				y: u + 10
			}, h = n.createElement("button");
			return h.type = "button", h.className = "aa-ai-revert", h.setAttribute("aria-label", o ? "Revert what AI wrote here" : "Revert what AI changed here"), h.title = "Revert", h.style.left = `${m.x}px`, h.style.top = `${m.y}px`, h.append(Object.assign(n.createElement("span"), { className: "aa-ai-dot" }), Object.assign(n.createElement("span"), {
				className: "aa-ai-label",
				textContent: "Revert"
			})), h.addEventListener("pointerdown", (e) => {
				e.preventDefault(), e.stopPropagation();
			}), h.addEventListener("click", (n) => {
				n.preventDefault(), n.stopPropagation(), t.revert(e), i = i.filter((t) => t !== e), l();
			}), s.append(h), s;
		}).filter((e) => !!e);
		a.replaceChildren(...u);
	}, l = () => {
		o ||= r.requestAnimationFrame(c);
	}, u = () => {
		if (!i.length) return;
		e.setAttribute("data-ai-fading", ""), a?.setAttribute("data-fading", "");
		let t = r.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
		setTimeout(() => {
			e.removeAttribute("data-ai-fading"), i = [], c();
		}, t ? 0 : 400);
	}, d = typeof ResizeObserver > "u" ? null : new ResizeObserver(l);
	return d?.observe(e), r.addEventListener("scroll", l, !0), r.addEventListener("resize", l), r.visualViewport?.addEventListener("resize", l), {
		set(e) {
			i = e.filter((e) => e.blocks.length), c();
		},
		clear: u,
		get size() {
			return s().length;
		},
		draw: l,
		destroy() {
			o && r.cancelAnimationFrame(o), d?.disconnect(), r.removeEventListener("scroll", l, !0), r.removeEventListener("resize", l), r.visualViewport?.removeEventListener("resize", l), a?.remove();
		}
	};
}
function Sp(e) {
	if (!e) return null;
	let t = e.ownerDocument.createTreeWalker(e, NodeFilter.SHOW_TEXT), n = null;
	for (let e = t.nextNode(); e; e = t.nextNode()) {
		let t = e.parentElement;
		(e.textContent ?? "").trim() && !t?.closest("[data-hidden], .aa-atom") && (n = e);
	}
	if (!n) return null;
	let r = (n.textContent ?? "").trimEnd().length;
	if (!r) return null;
	let i = e.ownerDocument.createRange();
	i.setStart(n, r - 1), i.setEnd(n, r);
	let a = Array.from(i.getClientRects()).pop();
	return a ? {
		x: a.right,
		y: a.top + a.height / 2
	} : null;
}
//#endregion
//#region src/prompt.ts
var Cp = "⟦here⟧", wp = typeof navigator < "u" && /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
function Tp(e) {
	return e === "not-allowed" ? wp ? "The microphone is blocked: allow it for this site in Safari › Settings › Websites › Microphone" : "The microphone is blocked: allow it for this site in the browser’s settings" : e === "service-not-allowed" ? wp ? "Turn on Dictation in System Settings › Keyboard to speak here" : "Speaking is turned off in this browser" : e === "audio-capture" ? "No microphone was found" : e === "network" ? "Speaking needs a connection" : e === "no-speech" ? "Nothing was heard: press Space twice to try again" : null;
}
function Ep() {
	let e = globalThis, t = e.SpeechRecognition ?? e.webkitSpeechRecognition;
	return t ? new t() : null;
}
function Dp(e, t, n) {
	return e ? .85 : Math.min(1, .55 + .3 * t + .3 * n);
}
function Op(e, t) {
	if (t.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return {
		followVoice: null,
		stop: () => {}
	};
	let n = 0, r = !1, i = 0, a = Dp(!1, 0, 0), o = null, s, c, l = /* @__PURE__ */ new Float32Array(512), u = performance.now(), d = -Infinity, f = !1, p = null, m = (t) => {
		if (r) return;
		o && (o.getFloatTimeDomainData(l), i += (Math.min(1, Math.sqrt(l.reduce((e, t) => e + t * t, 0) / l.length) * 8) - i) * .15);
		let s = e.getBoundingClientRect();
		p && (Math.abs(s.left - p.x) > .5 || Math.abs(s.top - p.y) > .5) && (d = t), p = {
			x: s.left,
			y: s.top
		};
		let c = t - d < 500;
		f && !c && (u = t), f = c;
		let h = .5 - .5 * Math.cos((t - u) / 2400 * 2 * Math.PI);
		a += (Dp(c, h, i) - a) * .12, e.style.opacity = a.toFixed(3), n = requestAnimationFrame(m);
	};
	return n = requestAnimationFrame(m), {
		followVoice: async () => {
			if (!wp && navigator.mediaDevices?.getUserMedia && typeof AudioContext < "u") try {
				let e = await navigator.mediaDevices.getUserMedia({ audio: !0 });
				if (r) {
					e.getTracks().forEach((e) => e.stop());
					return;
				}
				s = e, c = new AudioContext(), o = c.createAnalyser(), o.fftSize = l.length, c.createMediaStreamSource(e).connect(o);
			} catch {}
		},
		stop: () => {
			r = !0, cancelAnimationFrame(n), s?.getTracks().forEach((e) => e.stop()), c?.close();
		}
	};
}
var kp = () => {
	let e = globalThis;
	return !!(e.SpeechRecognition ?? e.webkitSpeechRecognition);
};
function Ap(e) {
	let t = Ep();
	if (!t) return null;
	let n = null, r = !1;
	t.lang = e.lang, t.continuous = !0, t.interimResults = !0, t.onresult = (t) => {
		let n = "";
		for (let e = 0; e < t.results.length; e++) n += t.results[e][0]?.transcript ?? "";
		e.heard(n.replace(/\s+/g, " ").trim());
	};
	let i = () => {
		r || (r = !0, e.end(n));
	};
	t.onend = i, t.onerror = (e) => {
		n = Tp(e.error) ?? n, i();
	}, e.audio && (t.onaudiostart = e.audio);
	try {
		t.start();
	} catch {
		return n = "Speaking could not start here", i(), null;
	}
	return {
		stop: () => t.stop(),
		abort: () => {
			t.abort(), i();
		}
	};
}
function jp(e) {
	let t = e.type.ownerDocument, n = t.defaultView, r = t.createElement("div");
	r.className = "aa-prompt", r.setAttribute("role", "textbox"), r.setAttribute("aria-label", "Ask AI"), r.dataset.placeholder = e.placeholder ?? "Ask AI or press space to speak", r.spellcheck = !1;
	try {
		r.contentEditable = "plaintext-only";
	} catch {
		r.contentEditable = "true";
	}
	r.contentEditable !== "plaintext-only" && (r.contentEditable = "true");
	let i = n.getComputedStyle(e.type);
	for (let e of [
		"font-family",
		"font-size",
		"font-weight",
		"letter-spacing",
		"line-height"
	]) r.style.setProperty(e, i.getPropertyValue(e));
	let a = Ds(i.color);
	a !== null && a > .5 && (r.dataset.dark = "");
	let o = e.root ?? t.body;
	o.append(r);
	let s = typeof ResizeObserver > "u" ? null : new ResizeObserver(() => e.grow?.(r.offsetHeight));
	s?.observe(r);
	let c = o === t.body;
	c && (r.dataset.placed = "page");
	let l = () => {
		if (!c) return {
			x: 0,
			y: 0
		};
		if (n.getComputedStyle(o).position !== "static") {
			let e = o.getBoundingClientRect();
			return {
				x: -e.left - o.clientLeft,
				y: -e.top - o.clientTop
			};
		}
		return {
			x: n.scrollX,
			y: n.scrollY
		};
	}, u = () => {
		let t = e.place(), n = l();
		Object.assign(r.style, {
			left: `${t.left + n.x}px`,
			top: `${t.top + n.y}px`,
			width: `${Math.max(t.width, 80)}px`,
			minHeight: `${t.height}px`,
			textIndent: e.indent ? `${e.indent}px` : ""
		});
	};
	u(), r.focus({ preventScroll: !0 });
	let d = !1, f = null, p = () => {}, m = null, h = null, g = null, _ = null, v = () => {
		if (!g) return;
		let e = t.createRange();
		e.setStartBefore(g), e.collapse(!0);
		let r = n.getSelection();
		r?.removeAllRanges(), r?.addRange(e);
	}, y = () => {
		g && g.toggleAttribute("data-after", !!S());
	}, b = () => {
		g?.remove(), g = null, _ &&= (_.stop(), null);
	}, x = () => {
		if (!g) return null;
		let e = Op(g, n);
		return _ = {
			frame: 0,
			stop: e.stop
		}, e.followVoice;
	}, S = () => (r.textContent ?? "").replace(/\s+/g, " ").trim(), C = (t = !1) => {
		d || (d = !0, f?.abort(), m?.abort(), b(), p(), s?.disconnect(), r.remove(), e.grow?.(0), n.removeEventListener("scroll", u, !0), n.removeEventListener("resize", u), e.close(t));
	}, w = () => {
		let i = Ep();
		if (!i) {
			r.dataset.placeholder = "Speaking is not available in this browser";
			return;
		}
		m = i, r.dataset.listening = "", g = Object.assign(t.createElement("span"), {
			className: "aa-prompt-caret",
			contentEditable: "false"
		}), g.setAttribute("aria-hidden", "true"), r.append(g), y(), v(), r.dataset.placeholder = "Listening…", i.lang = t.documentElement.lang || navigator.language, i.continuous = !0, i.interimResults = !0;
		let a = null;
		i.onresult = (e) => {
			for (let n = e.resultIndex; n < e.results.length; n++) {
				let i = e.results[n], a = i[0]?.transcript ?? "";
				h ??= Object.assign(t.createElement("i"), {
					className: "aa-prompt-heard",
					contentEditable: "false"
				}), h.isConnected || (g ? g.before(h) : r.append(h)), h.textContent = `${h.previousSibling && !/\s$/.test(h.previousSibling.textContent ?? "") ? " " : ""}${a.trim()}`, i.isFinal && (h.removeAttribute("class"), h.removeAttribute("contenteditable"), h.textContent = `${S() && !/\s$/.test(r.textContent ?? "") && h.previousSibling ? " " : ""}${a.trim()}`, h = null);
			}
			y();
			let i = n.getSelection();
			i?.rangeCount && r.contains(i.anchorNode) && !(i.isCollapsed && g && i.anchorNode === r && r.childNodes[i.anchorOffset] === g) || v();
		}, i.onend = () => {
			m = null, b(), delete r.dataset.listening, r.dataset.placeholder = a ?? e.placeholder ?? "Ask AI to write";
		}, i.onerror = (e) => {
			a = Tp(e.error) ?? a, i.onend?.();
		};
		try {
			i.start();
		} catch {
			a = "Speaking could not start here", i.onend?.();
			return;
		}
		let o = x();
		o && (i.onaudiostart = () => {
			o();
		});
	}, T = async () => {
		let t = S();
		if (t && !f) {
			m?.stop(), f = new AbortController(), r.contentEditable = "false", r.dataset.loading = "", r.setAttribute("aria-busy", "true"), p = Mp([r, ...e.about()]);
			try {
				await e.send(t, f.signal), C(!0);
			} catch {
				if (d) return;
				p(), f = null, delete r.dataset.loading, r.removeAttribute("aria-busy"), r.dataset.failed = "", r.contentEditable = "plaintext-only", r.contentEditable !== "plaintext-only" && (r.contentEditable = "true"), r.focus({ preventScroll: !0 });
			}
		}
	};
	r.addEventListener("keydown", (e) => {
		e.stopPropagation(), !e.isComposing && (delete r.dataset.failed, e.key === "Escape" ? (e.preventDefault(), C()) : e.key === "Enter" && !e.shiftKey ? (e.preventDefault(), T()) : e.key === "Backspace" && !r.textContent ? (e.preventDefault(), C()) : e.key === " " && !r.textContent && !m && (e.preventDefault(), w()));
	}), r.addEventListener("beforeinput", (e) => {
		e.stopPropagation(), !(e.isComposing || m || r.textContent) && e.inputType === "insertText" && (e.data === " " || e.data === "\xA0") && (e.preventDefault(), w());
	});
	for (let e of [
		"keyup",
		"keypress",
		"input",
		"paste",
		"cut",
		"copy",
		"pointerdown",
		"click"
	]) r.addEventListener(e, (e) => e.stopPropagation());
	return r.addEventListener("blur", () => {
		!f && !m && !S() && C();
	}), n.addEventListener("scroll", u, !0), n.addEventListener("resize", u), e.listen && w(), {
		element: r,
		close: () => C()
	};
}
function Mp(e, t) {
	let n = [];
	for (let t of e) {
		if (!(t instanceof HTMLElement) || !t.isConnected) continue;
		let e = t.ownerDocument.defaultView;
		e && !e.matchMedia?.("(forced-colors: active)").matches && (t.setAttribute("data-aa-glisten", ""), t.style.setProperty("--aa-glisten-delay", `${n.length % 6 * 120}ms`), n.push(t));
	}
	return () => {
		for (let e of n) e.removeAttribute("data-aa-glisten"), e.style.removeProperty("--aa-glisten-delay");
	};
}
//#endregion
//#region src/comments-view.ts
var Np = 800, Pp = (e) => {
	let t = document.createElement("span");
	t.className = "aa-icon";
	let n = La[`./icons/${e}.svg`];
	return n && (t.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(n.replace(/currentColor/g, "black"))}")`), t;
}, Fp = (e, t, n) => {
	let r = document.createElement("button");
	return r.type = "button", r.className = "aa-comments-button", r.dataset.tooltip = e, r.setAttribute("aria-label", e), r.append(Pp(t)), r.addEventListener("click", (e) => {
		e.preventDefault(), n();
	}), r;
}, Ip = (e, t, n = "") => {
	let r = document.createElement("button");
	return r.type = "button", r.className = `aa-comments-word ${n}`.trim(), r.textContent = e, r.addEventListener("click", (e) => {
		e.preventDefault(), t();
	}), r;
}, Lp = (e) => {
	let t = document.createElement("span");
	return t.className = "aa-avatar ds-avatar ds-avatar--outlined", t.textContent = zr(e.name), t.style.setProperty("--aa-person", Vr(e)), t.setAttribute("aria-hidden", "true"), t;
};
function Rp(e, t) {
	let { store: n } = t, r = e.ownerDocument, i = r.defaultView, a = t.root ?? e.closest("dialog") ?? r.body, o = n.panel ?? null, s = [], c = [], l = t.value(), u = null, d = null, f = null, p = null, m = !1, h = 0, g, _ = /* @__PURE__ */ new Map(), v = null, y = null, b = /* @__PURE__ */ new Map(), x = /* @__PURE__ */ new Set(), S = /* @__PURE__ */ new Map(), C = null, w = null, T = "open", E = (e) => o && T === "resolved" ? !!e.resolvedAt : !e.resolvedAt, D = () => !!n.me && !t.readOnly(), ee = () => c.find((e) => e.id === u) ?? null, O = () => {
		let e = [];
		for (let t of c) {
			if (t.orphaned || !E(t)) continue;
			let n = [
				"aa-comment",
				t.id === u ? "aa-comment--open" : "",
				t.unread ? "aa-comment--unread" : "",
				t.resolvedAt ? "aa-comment--resolved" : ""
			].filter(Boolean).join(" ");
			e.push({
				from: t.from,
				to: t.to,
				className: n,
				attributes: { "data-comment": t.id }
			});
		}
		f && e.push({
			from: f.from,
			to: f.to,
			className: "aa-comment aa-comment--open aa-comment--draft",
			attributes: { "data-comment": "draft" }
		}), t.decorate(e);
	}, k = (t) => Array.from(e.querySelectorAll("[data-comment]")).filter((e) => (e.getAttribute("data-comment") ?? "").split(" ").includes(t)).flatMap((e) => Array.from(e.getClientRects())), te = (e) => {
		if (n.move && e.length) {
			for (let t of e) _.set(t.id, t);
			clearTimeout(g), g = setTimeout(() => {
				let e = [..._.values()];
				_ = /* @__PURE__ */ new Map(), s = s.map((t) => {
					let n = e.find((e) => e.id === t.id);
					return n ? {
						...t,
						...n
					} : t;
				}), Promise.resolve(n.move(e)).catch(() => {});
			}, Np);
		}
	}, A = (e) => {
		if (!m) {
			if (s = e, l = t.value(), c = kr(e, t.value()), u && !c.some((e) => e.id === u) && (u = null), p) {
				let e = c.find((e) => e.from === p.from && e.to === p.to && !e.resolvedAt);
				e && (p = null, f = null, u = e.id, n.seen?.(e.id));
			}
			te(Ar(s, c)), O(), q();
		}
	}, j = () => {
		if (m) return;
		let e = t.value();
		if (e === l) return;
		let n = Tr(l, e);
		if (l = e, c = Dr(c, n, e).map((t) => {
			if (!t.orphaned) return t;
			let n = s.find((e) => e.id === t.id), r = n && !n.orphaned && Or(n, e);
			return r ? {
				...t,
				...r,
				quote: n.quote,
				orphaned: !1
			} : t;
		}), f) {
			let t = Er(f, n);
			f = t ? {
				...t,
				quote: e.slice(t.from, t.to)
			} : null, f || P();
		}
		te(Ar(s, c)), O(), q();
	}, ne = () => {
		if (m) return;
		let e = t.selection();
		if (!e || e.start !== e.end) return;
		let n = Mr(c, e.start);
		n.length ? u && n.some((e) => e.id === u) || n[0].id !== d && N(n[0].id) : (d = null, u && !o && !f && (u = null, O(), q()));
	}, M = () => ne(), re = (t) => {
		let n = t.target?.closest?.("[data-comment]");
		if (!n || !e.contains(n)) return;
		let r = (n.getAttribute("data-comment") ?? "").split(" ").find((e) => e !== "draft");
		r && N(r);
	};
	e.addEventListener("aa-selectionchange", M), e.addEventListener("aa-change", j), e.addEventListener("click", re);
	let N = (e) => {
		let t = c.find((t) => t.id === e);
		t && (o && (T = t.resolvedAt ? "resolved" : "open"), f && (f = null, S.delete("draft")), u = e, d = null, C = null, w = null, t.unread && Promise.resolve(n.seen?.(e)).catch(() => {}), O(), q(), o && v?.querySelector(`[data-thread="${e}"]`)?.scrollIntoView({ block: "nearest" }));
	}, P = () => {
		f = null, S.delete("draft"), p = null;
	}, F = () => {
		let n = !!u || !!f;
		u && (d = u);
		let i = ee()?.to ?? f?.to;
		return u = null, P(), C = null, w = null, oe(), K(), O(), q(), n && i !== void 0 && !e.contains(r.activeElement) && t.selectRange(i), n;
	}, I = () => {
		if (!D()) return !1;
		let e = t.selection();
		if (!e || e.start === e.end) return !1;
		let n = t.value(), r = Math.min(e.start, e.end), i = Math.max(e.start, e.end), a = n.slice(r, i);
		return a.trim() ? (u = null, f = {
			from: r,
			to: i,
			quote: a
		}, C = null, w = null, O(), q(), v?.querySelector("textarea")?.focus(), !0) : !1;
	}, ie = (e, t) => {
		b.set(e, t instanceof Error && t.message ? t.message : "Not saved"), q(), setTimeout(() => {
			b.get(e) && (b.delete(e), q());
		}, 4e3);
	}, L = async (e, t, n) => {
		if (!x.has(e)) {
			x.add(e), q();
			try {
				await t(), n?.();
			} catch (t) {
				ie(e, t);
			} finally {
				x.delete(e), q();
			}
		}
	}, ae = /* @__PURE__ */ new Map(), R = (e, t) => {
		let r = t.trim();
		if (!r || !D()) return;
		let i = Fr(r, [...ae.values()]);
		if (e === "draft") {
			if (!f) return;
			let t = f;
			p = t, L(e, () => n.add(t, r, i), () => {
				S.delete("draft"), f = null, O(), q();
			}).then(() => {
				b.has("draft") && (p = null);
			});
		} else L(e, () => n.reply(e, r, i), () => {
			S.delete(e), q();
		});
	}, oe = () => {
		y?.remove(), y = null;
	}, se = [], z = 0, B = null, V = null, H = 0, ce = (e) => {
		if (!B || !V) return;
		ae.set(e.id, e);
		let t = B, { start: n } = V, r = t.selectionStart ?? t.value.length;
		t.value = `${t.value.slice(0, n)}@${e.name} ${t.value.slice(r)}`;
		let i = n + e.name.length + 2;
		t.setSelectionRange(i, i), t.dispatchEvent(new Event("input", { bubbles: !0 })), oe(), t.focus();
	}, le = () => {
		if (y && (y.replaceChildren(...se.map((e, t) => {
			let n = r.createElement("button");
			n.type = "button", n.setAttribute("role", "option"), n.className = "note-menu-row", n.setAttribute("aria-selected", String(t === z)), n.toggleAttribute("data-current", t === z);
			let i = r.createElement("span");
			return i.textContent = e.name, n.append(Lp(e), i), n.addEventListener("pointerdown", (e) => e.preventDefault()), n.addEventListener("click", () => ce(e)), n;
		})), !se.length)) {
			let e = r.createElement("span");
			e.className = "aa-menu-empty", e.textContent = "Nobody to mention", y.append(e);
		}
	}, ue = () => {
		if (!y || !B) return;
		let t = B.getBoundingClientRect(), n = 20 * (parseFloat(getComputedStyle(e).getPropertyValue("--aa-sf")) || 1), r = Math.max(1, Math.min(se.length, 8)) * n, a = t.bottom + n / 2;
		y.style.left = `${Math.max(0, Math.min(t.left, i.innerWidth - 4 * n))}px`, y.style.top = `${a + r <= i.innerHeight ? a : Math.max(0, t.top - n / 2 - r)}px`;
	}, de = (e) => {
		if (!n.people) return;
		let t = Ir(e.value, e.selectionStart ?? e.value.length);
		if (!t) {
			oe();
			return;
		}
		B = e, V = t;
		let i = ++H;
		Promise.resolve(n.people(t.query)).then((t) => {
			if (!m && i === H && B && B === e) {
				se = t.slice(0, 8);
				for (let e of se) ae.set(e.id, e);
				y || (y = r.createElement("div"), y.className = "aa-controls aa-menu aa-comments-people", y.setAttribute("role", "listbox"), y.setAttribute("aria-label", "People to mention"), a.append(y)), z = Math.min(z, Math.max(0, se.length - 1)), le(), ue();
			}
		}).catch(() => oe());
	}, fe = (e) => y ? e.key === "ArrowDown" || e.key === "ArrowUp" ? (e.preventDefault(), z = (z + (e.key === "ArrowDown" ? 1 : se.length - 1)) % Math.max(1, se.length), le(), !0) : (e.key === "Enter" || e.key === "Tab") && se.length ? (e.preventDefault(), ce(se[z]), !0) : e.key === "Escape" && (e.preventDefault(), oe(), !0) : !1, U = (e, t) => {
		let n = t.filter((e) => e.name.trim()).sort((e, t) => t.name.length - e.name.length), i = n.length ? new RegExp(n.map((e) => `@${e.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).join("|"), "g") : null;
		if (!i) return [e];
		let a = [], o = 0;
		for (let t of e.matchAll(i)) {
			a.push(e.slice(o, t.index));
			let i = r.createElement("span");
			i.className = "aa-comment-mention", i.textContent = t[0];
			let s = n.find((e) => `@${e.name.trim()}` === t[0]);
			s && i.style.setProperty("--aa-person", Vr(s)), a.push(i), o = t.index + t[0].length;
		}
		return a.push(e.slice(o)), a;
	}, W = (e) => {
		e.style.height = "0px";
		let t = e.scrollHeight;
		e.style.height = t ? `${t}px` : "";
	}, pe = (e, a) => {
		let o = r.createElement("form");
		o.className = "aa-composer", o.setAttribute("aria-label", a), n.me && o.append(Lp(n.me));
		let s = r.createElement("textarea"), l = kp(), u = `${a.charAt(0).toLowerCase()}${a.slice(1)}`, d = l ? `Press space to speak, or ${u}` : t.prompt ? `Press space for AI, or ${u}` : a;
		s.rows = 1, s.placeholder = d, s.setAttribute("aria-label", a), s.value = S.get(e) ?? "";
		let p = r.createElement("span");
		p.className = "aa-composer-field";
		let m = r.createElement("span");
		m.className = "aa-composer-backdrop", m.setAttribute("aria-hidden", "true"), p.append(m, s);
		let h = null, g = () => {
			let e = s.value.includes("@") ? Fr(s.value, [...ae.values()]) : [];
			if (s.toggleAttribute("data-mentions", e.length > 0), h) {
				h.toggleAttribute("data-after", !!s.value);
				let t = s.value ? [] : [Object.assign(r.createElement("span"), {
					className: "aa-composer-listening",
					textContent: "Listening…"
				})];
				m.replaceChildren(...U(s.value, e), h, ...t);
			} else e.length ? m.replaceChildren(...U(s.value, e), "​") : m.replaceChildren();
		};
		g(), s.disabled = x.has(e);
		let _ = null, v = () => {
			_?.abort(), _ = null, delete s.dataset.asking, s.removeAttribute("data-aa-glisten"), s.placeholder = d;
		}, b = async () => {
			let n = s.value.trim();
			if (!n || !t.prompt || !_) return;
			let i = e === "draft" ? null : c.find((t) => t.id === e), a = e === "draft" ? f?.quote ?? "" : i?.quote ?? "", o = i ? i.comments.map((e) => `${e.author.name}: ${e.body}`).join("\n\n") : "", { signal: l } = _, u = Object.assign(r.createElement("span"), {
				className: "aa-composer-thinking",
				textContent: "Thinking…"
			});
			u.setAttribute("data-aa-glisten", ""), u.setAttribute("role", "status"), p.before(u), p.hidden = !0, s.readOnly = !0;
			try {
				let r = await t.prompt(n, {
					kind: "writing",
					signal: l,
					text: a,
					before: o,
					after: ""
				});
				if (l.aborted) return;
				let i = typeof r == "string" ? r : r.insert ?? r.document ?? "";
				s.value = i.trim(), S.set(e, s.value);
			} catch (t) {
				l.aborted || ie(e, t);
			} finally {
				u.remove(), p.hidden = !1, s.readOnly = !1, v(), g(), W(s), s.focus();
			}
		}, C = null, w = () => {
			let t = s.value, n = null;
			C = Ap({
				lang: r.documentElement.lang || navigator.language,
				heard: (n) => {
					s.isConnected ? (s.value = `${t}${t && n ? " " : ""}${n}`, S.set(e, s.value), g(), W(s)) : C?.abort();
				},
				audio: () => {
					n?.followVoice?.();
				},
				end: (e) => {
					C = null, n?.stop(), h = null, delete s.dataset.listening, s.placeholder = e ?? d, g();
				}
			}), C && (s.dataset.listening = "", s.placeholder = "", h = Object.assign(r.createElement("span"), { className: "aa-prompt-caret" }), n = Op(h, i), g());
		};
		s.addEventListener("blur", () => C?.stop()), s.addEventListener("input", () => {
			S.set(e, s.value), g(), W(s), _ || de(s);
		}), s.addEventListener("keydown", (n) => {
			if (!fe(n)) {
				if (C && !n.isComposing) {
					if (n.key === "Escape") {
						n.preventDefault(), n.stopPropagation(), C.abort();
						return;
					}
					if (n.key === "Enter" && !n.shiftKey) {
						n.preventDefault(), C.abort(), R(e, s.value);
						return;
					}
					C.stop();
				}
				if (n.key === "Backspace" && !n.isComposing && s.selectionStart === s.selectionEnd) {
					let e = s.selectionStart ?? 0, t = s.value.slice(0, e), r = Fr(s.value, [...ae.values()]).find((e) => t.endsWith(`@${e.name.trim()}`));
					if (r) {
						n.preventDefault();
						let t = e - r.name.trim().length - 1;
						s.setRangeText("", t, e, "end"), s.dispatchEvent(new Event("input", { bubbles: !0 }));
						return;
					}
				}
				n.key === " " && !s.value && l && !n.isComposing ? (n.preventDefault(), w()) : n.key === " " && !s.value && t.prompt && !_ && !n.isComposing ? (n.preventDefault(), _ = new AbortController(), s.dataset.asking = "", s.placeholder = "Ask AI about these words") : _ ? (n.key === "Enter" && !n.shiftKey && !n.isComposing && (n.preventDefault(), b()), (n.key === "Escape" || n.key === "Backspace" && !s.value) && (n.preventDefault(), v(), s.value = "", S.delete(e))) : (n.key === "Enter" && !n.shiftKey && !n.isComposing && (n.preventDefault(), R(e, s.value)), n.key === "Escape" && (n.preventDefault(), F()));
			}
		}), s.addEventListener("blur", () => setTimeout(() => {
			B === s && !y?.contains(r.activeElement) && oe();
		}, 120));
		let T = Fp(e === "draft" ? "Comment" : "Reply", "send", () => R(e, s.value));
		return T.classList.add("aa-composer-send"), T.disabled = x.has(e), o.append(p, T), o.addEventListener("submit", (t) => {
			t.preventDefault(), R(e, s.value);
		}), i.requestAnimationFrame(() => W(s)), o;
	}, me = (e, t) => {
		let a = r.createElement("div");
		a.className = "aa-comment-entry";
		let o = r.createElement("div");
		o.className = "aa-comment-meta";
		let s = r.createElement("span");
		s.className = "aa-comment-author", s.textContent = t.author.name;
		let c = r.createElement("time");
		if (c.className = "aa-comment-time", c.dateTime = new Date(t.createdAt).toISOString(), c.textContent = `${Lr(t.createdAt)}${C === t.id ? " · Editing" : t.editedAt ? " · Edited" : ""}`, c.title = new Date(t.createdAt).toLocaleString(), o.append(Lp(t.author), s, c), n.me && t.author.id === n.me.id && n.edit && D() && !e.resolvedAt && C !== t.id && o.append(Ip("Edit", () => {
			C = t.id, S.set(`edit:${t.id}`, t.body), q(), v?.querySelector(`[data-edit="${t.id}"]`)?.focus();
		}, "aa-comment-edit")), a.append(o), C === t.id) {
			let e = r.createElement("textarea");
			e.className = "aa-comment-body aa-comment-editing", e.setAttribute("aria-label", "Edit comment"), e.dataset.edit = t.id, e.value = S.get(`edit:${t.id}`) ?? t.body, e.rows = Math.max(1, e.value.split("\n").length);
			let o = () => {
				let r = e.value.trim();
				r && L(`edit:${t.id}`, () => n.edit(t.id, r), () => {
					C = null, S.delete(`edit:${t.id}`);
				});
			};
			e.addEventListener("input", () => {
				S.set(`edit:${t.id}`, e.value), W(e);
			}), e.addEventListener("keydown", (e) => {
				e.key === "Enter" && !e.shiftKey && !e.isComposing && (e.preventDefault(), o()), e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), C = null, S.delete(`edit:${t.id}`), q());
			}), a.append(e), i.requestAnimationFrame(() => W(e));
		} else {
			let e = r.createElement("p");
			e.className = "aa-comment-body", e.append(...U(t.body, t.mentions ?? [])), a.append(e);
		}
		let l = !!n.react && D() && !e.resolvedAt;
		if (t.reactions?.length || l) {
			let e = r.createElement("div");
			e.className = "aa-comment-reactions";
			for (let i of t.reactions ?? []) {
				let a = r.createElement("button");
				a.type = "button", a.className = "aa-reaction", a.setAttribute("aria-pressed", String(i.reacted)), a.setAttribute("aria-label", `${i.emoji} ${i.count}${i.names.length ? `, from ${i.names.join(", ")}` : ""}${i.reacted ? ", you too" : ""}`), a.title = [...i.names, ...i.reacted ? ["You"] : []].join(", "), a.append(Object.assign(r.createElement("span"), {
					className: "aa-reaction-emoji",
					textContent: i.emoji
				}), Object.assign(r.createElement("span"), {
					className: "aa-reaction-count",
					textContent: String(i.count)
				})), a.disabled = !l, a.addEventListener("click", (e) => {
					e.preventDefault(), L(`react:${t.id}`, () => n.react(t.id, i.emoji));
				}), e.append(a);
			}
			if (l) {
				let n = Fp("Add reaction", "plus", () => he(n, t.id));
				n.classList.add("aa-reaction-add"), e.append(n);
			}
			a.append(e);
		}
		let u = b.get(`edit:${t.id}`) ?? b.get(`react:${t.id}`);
		if (u) {
			let e = r.createElement("p");
			e.className = "aa-comments-error", e.setAttribute("role", "alert"), e.textContent = u, a.append(e);
		}
		return a;
	}, G = null, K = () => {
		G?.remove(), G = null;
	}, he = (t, o) => {
		K(), G = r.createElement("div"), G.className = "aa-controls aa-menu aa-reaction-picker", G.setAttribute("role", "menu"), G.setAttribute("aria-label", "Reactions");
		for (let e of wr) {
			let t = r.createElement("button");
			t.type = "button", t.setAttribute("role", "menuitem"), t.textContent = e, t.setAttribute("aria-label", `React with ${e}`), t.addEventListener("pointerdown", (e) => e.preventDefault()), t.addEventListener("click", (t) => {
				t.preventDefault(), K(), L(`react:${o}`, () => n.react(o, e));
			}), G.append(t);
		}
		G.addEventListener("keydown", (e) => {
			e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), K(), t.focus());
		}), a.append(G);
		let s = t.getBoundingClientRect(), c = 20 * (parseFloat(getComputedStyle(e).getPropertyValue("--aa-sf")) || 1), l = 8 * c, u = 2 * c, d = 4 * c / 20, f = t.closest(".aa-comments")?.getBoundingClientRect(), p = Math.max(0, f?.left ?? 0), m = Math.min(i.innerWidth, f?.right ?? i.innerWidth), h = s.right + d + l <= m ? s.right + d : s.left - d - l >= p ? s.left - d - l : null;
		G.style.left = `${h ?? Math.max(p, Math.min(s.left, m - l))}px`, G.style.top = `${h === null ? s.bottom + d + u <= i.innerHeight ? s.bottom + d : Math.max(0, s.top - d - u) : Math.max(0, Math.min(s.top, i.innerHeight - u))}px`, G.querySelector("button")?.focus();
	}, ge = (e) => e.comments.length >= 3 && e.comments.reduce((e, t) => e + 1 + Math.ceil(t.body.length / 40), 0) >= 10, _e = (e, i) => {
		let a = r.createElement("article");
		a.className = "aa-thread", a.dataset.thread = e.id, a.toggleAttribute("data-open", i), a.toggleAttribute("data-resolved", !!e.resolvedAt), a.toggleAttribute("data-orphaned", e.orphaned), a.toggleAttribute("data-unread", !!e.unread);
		let s = r.createElement(o ? "button" : "div");
		s.className = "aa-thread-head", s instanceof HTMLButtonElement && (s.type = "button", s.setAttribute("aria-expanded", String(i)), s.addEventListener("click", () => {
			i ? (u = null, O(), q()) : (N(e.id), t.selectRange(e.from, e.to));
		}));
		let l = !!o || e.orphaned;
		if (l) {
			let t = r.createElement("span");
			t.className = "aa-thread-quote", t.textContent = e.orphaned ? `“${e.quote}” is no longer in the text` : e.quote.replace(/\s+/g, " "), t.title = e.quote, s.append(t);
		}
		if (!i) {
			let t = r.createElement("span");
			t.className = "aa-thread-count", t.textContent = String(e.comments.length), s.append(t);
		}
		if (a.append(s), !i) return a;
		let d = r.createElement("div");
		d.className = "aa-thread-actions";
		let f = jr(c).filter((e) => !e.orphaned && !e.resolvedAt), p = f.findIndex((t) => t.id === e.id);
		if (!o && f.length > 1 && p >= 0) {
			let e = (e) => {
				let n = f[(p + e + f.length) % f.length];
				t.selectRange(n.from), N(n.id);
			};
			d.append(Fp("Previous comment", "chevron-up", () => e(-1)), Fp("Next comment", "chevron-down", () => e(1)));
		}
		if (D() && (e.resolvedAt ? d.append(Ip("Reopen", () => void L(`resolve:${e.id}`, () => n.resolve(e.id, !1)), "aa-thread-reopen")) : d.append(Fp("Resolve", "check", () => void L(`resolve:${e.id}`, () => n.resolve(e.id, !0), () => {
			o || F();
		}))), n.remove && e.canDelete)) {
			let t = w === e.id ? Ip("Delete?", () => void L(`remove:${e.id}`, () => n.remove(e.id), () => {
				w = null, u === e.id && (u = null);
			}), "aa-thread-delete") : Fp("Delete thread", "delete", () => {
				w = e.id, q();
			});
			d.append(t);
		}
		!l && ge(e) && (s.append(Object.assign(r.createElement("span"), {
			className: "aa-thread-title",
			textContent: `${e.comments.length} comments`
		})), a.toggleAttribute("data-titled", !0)), s.append(d);
		for (let t of e.comments) a.append(me(e, t));
		let m = b.get(`resolve:${e.id}`) ?? b.get(`remove:${e.id}`) ?? b.get(e.id);
		if (m) {
			let e = r.createElement("p");
			e.className = "aa-comments-error", e.setAttribute("role", "alert"), e.textContent = m, a.append(e);
		}
		if (e.resolvedAt) {
			let t = r.createElement("p");
			t.className = "aa-thread-resolved", t.textContent = `Resolved${e.resolvedBy ? ` by ${e.resolvedBy.name}` : ""}.`, a.append(t);
		} else D() && a.append(pe(e.id, "Reply"));
		return a;
	}, ve = () => {
		let e = r.createElement("article");
		e.className = "aa-thread", e.dataset.thread = "draft", e.setAttribute("data-open", "");
		let t = pe("draft", "Add a comment");
		if (o) {
			let n = r.createElement("div");
			n.className = "aa-thread-head";
			let i = r.createElement("span");
			i.className = "aa-thread-quote", i.textContent = f.quote.replace(/\s+/g, " "), n.append(i), e.append(n, t);
		} else e.append(t);
		let n = b.get("draft");
		if (n) {
			let t = r.createElement("p");
			t.className = "aa-comments-error", t.setAttribute("role", "alert"), t.textContent = n, e.append(t);
		}
		return e;
	}, ye = () => v || (v = o ?? r.createElement("div"), v.classList.add("aa-comments"), v.dataset.mode = o ? "panel" : "popover", v.setAttribute("role", o ? "region" : "dialog"), v.setAttribute("aria-label", "Comments"), v.addEventListener("keydown", (e) => {
		e.key === "Escape" && !y && !G && !C && (e.preventDefault(), F());
	}), o || a.append(v), v), q = () => {
		if (m) return;
		let e = v?.contains(r.activeElement) ? r.activeElement : null, t = e?.closest("[data-thread]")?.dataset.thread, n = e instanceof HTMLTextAreaElement ? {
			start: e.selectionStart,
			end: e.selectionEnd,
			edit: e.dataset.edit
		} : null;
		if (o) {
			let e = ye(), t = Nr(c), n = r.createElement("div");
			n.className = "aa-comments-tabs", n.setAttribute("role", "tablist"), n.setAttribute("aria-label", "Comments");
			for (let [e, i, a] of [[
				"open",
				"Open",
				t.open
			], [
				"resolved",
				"Resolved",
				t.resolved
			]]) {
				let t = r.createElement("button");
				t.type = "button", t.setAttribute("role", "tab"), t.dataset.tab = e, t.setAttribute("aria-selected", String(T === e)), t.tabIndex = T === e ? 0 : -1, t.append(i, Object.assign(r.createElement("span"), {
					className: "aa-comments-tab-count",
					textContent: ` ${a}`
				})), t.addEventListener("click", () => {
					T !== e && (T = e, u && !E(ee()) && (u = null), O(), q());
				}), t.addEventListener("keydown", (t) => {
					(t.key === "ArrowLeft" || t.key === "ArrowRight") && (t.preventDefault(), n.querySelector(`[data-tab="${e === "open" ? "resolved" : "open"}"]`)?.click(), q(), v?.querySelector(`[data-tab="${e === "open" ? "resolved" : "open"}"]`)?.focus());
				}), n.append(t);
			}
			let i = jr(c).filter(E), a = [n];
			f && T === "open" && a.push(ve());
			for (let e of i) a.push(_e(e, e.id === u));
			if (!i.length && !(f && T === "open")) {
				let e = r.createElement("p");
				e.className = "aa-comments-empty", e.textContent = T === "resolved" ? "Nothing resolved yet." : D() ? "Select words and press Comment to start a thread." : "No comments yet.", a.push(e);
			}
			e.replaceChildren(...a);
		} else {
			let e = ee();
			if (!e && !f) {
				v?.remove(), v = null, oe();
				return;
			}
			ye().replaceChildren(f ? ve() : _e(e, !0)), be();
		}
		if (t) {
			let e = v?.querySelector(n?.edit ? `[data-edit="${n.edit}"]` : `[data-thread="${t}"] .aa-composer textarea`);
			if (e && n) {
				e.focus({ preventScroll: !0 });
				try {
					e.setSelectionRange(n.start, n.end);
				} catch {}
			}
		}
	}, be = () => {
		if (h = 0, !v || o) return;
		let t = f ? "draft" : u, n = t ? k(t) : [], r = 20 * (parseFloat(getComputedStyle(e).getPropertyValue("--aa-sf")) || 1), a = Math.min(16 * r, i.innerWidth - 2 * r);
		v.style.width = `${a}px`;
		let s = n.length ? {
			left: Math.min(...n.map((e) => e.left)),
			top: Math.min(...n.map((e) => e.top)),
			bottom: Math.max(...n.map((e) => e.bottom))
		} : (() => {
			let t = e.getBoundingClientRect();
			return {
				left: t.left,
				top: t.top,
				bottom: t.top
			};
		})(), c = v.offsetHeight, l = Math.max(r, Math.min(s.left, i.innerWidth - a - r)), d = s.bottom + r / 2, p = d + c <= i.innerHeight - r / 2 || s.top - r / 2 - c < r / 2 ? d : s.top - r / 2 - c;
		v.style.left = `${l}px`, v.style.top = `${Math.max(r / 2, Math.min(p, i.innerHeight - c - r / 2))}px`;
	}, xe = () => {
		!h && v && !o && (h = i.requestAnimationFrame(be));
	}, Se = typeof ResizeObserver > "u" ? null : new ResizeObserver(xe);
	Se?.observe(e), i.addEventListener("scroll", xe, !0), i.addEventListener("resize", xe);
	let Ce = (t) => {
		v && !o && t.target instanceof Node && (G && !G.contains(t.target) && K(), !(v.contains(t.target) || y?.contains(t.target) || G?.contains(t.target)) && (e.contains(t.target) || F()));
	};
	r.addEventListener("pointerdown", Ce, !0);
	let we = n.subscribe(A);
	return {
		open: N,
		start: I,
		close: F,
		changed: j,
		get threads() {
			return c;
		},
		destroy() {
			m = !0, we(), clearTimeout(g), h && i.cancelAnimationFrame(h), Se?.disconnect(), i.removeEventListener("scroll", xe, !0), i.removeEventListener("resize", xe), r.removeEventListener("pointerdown", Ce, !0), e.removeEventListener("aa-selectionchange", M), e.removeEventListener("aa-change", j), e.removeEventListener("click", re), oe(), K(), o ? (o.replaceChildren(), o.classList.remove("aa-comments")) : v?.remove(), v = null, t.decorate([]);
		}
	};
}
//#endregion
//#region src/editor.ts
var zp = 4;
function Bp(e) {
	let t = document.createElement("span");
	t.style.cssText = "position:absolute;visibility:hidden;width:var(--aa-unit, 20px)", e.append(t);
	let n = t.getBoundingClientRect().width;
	return t.remove(), n || 20;
}
function Vp(e, t, n, r) {
	let i = document.createElement("span");
	i.className = "aa-picture-grip", i.setAttribute("data-aa-interactive", ""), i.setAttribute("role", "separator"), i.setAttribute("aria-orientation", "vertical"), i.setAttribute("aria-label", "Picture width"), i.contentEditable = "false";
	let a = (r) => e.dispatchEvent(new CustomEvent("aa-atom-source", {
		bubbles: !0,
		detail: { source: zi(t, n, r) }
	}));
	i.addEventListener("pointerdown", (t) => {
		if (t.button !== 0 || e.closest(".aa-block")?.getAttribute("data-readonly") === "true") return;
		t.preventDefault(), t.stopPropagation();
		let n = Bp(e), o = t.clientX, s = e.getBoundingClientRect().width, c = e.closest(".aa-block")?.clientWidth ?? s, l = Math.max(zp, Math.floor(c / n)), u = Math.round(s / n);
		i.setPointerCapture(t.pointerId), e.setAttribute("data-sizing", "");
		let d = (t) => {
			u = Math.min(l, Math.max(zp, Math.round((s + t.clientX - o) / n))), e.style.setProperty("--aa-picture-width", String(u)), e.setAttribute("data-width", String(u));
		}, f = () => {
			i.removeEventListener("pointermove", d), i.removeEventListener("pointerup", f), i.removeEventListener("pointercancel", f), e.removeAttribute("data-sizing"), u !== r && a(u);
		};
		i.addEventListener("pointermove", d), i.addEventListener("pointerup", f), i.addEventListener("pointercancel", f);
	}), i.addEventListener("dblclick", (e) => {
		e.preventDefault(), e.stopPropagation(), r !== null && a(null);
	}), e.append(i);
}
function Hp(e, t) {
	let { alt: n, src: r, width: i } = Ri(t);
	i && (e.dataset.width = String(i), e.style.setProperty("--aa-picture-width", String(i))), Vp(e, n, r, i);
}
var Up = {
	...Li,
	draw(e, t) {
		let { alt: n, src: r } = Ri(t), i = r.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
		if (/^data:(audio|video)\//.test(r) || i && /^(mp4|webm|mov|mp3|wav|ogg|m4a)$/.test(i)) {
			let t = document.createElement(/^data:video\//.test(r) || /^(mp4|webm|mov)$/.test(i ?? "") ? "video" : "audio");
			t.src = r, t.controls = !0, t.preload = "metadata", t.setAttribute("aria-label", n), e.append(t);
		} else {
			let i = document.createElement("img");
			i.src = r, i.alt = n, i.loading = "lazy", i.draggable = !1, e.append(i), Hp(e, t);
		}
		let a = document.createElement("span");
		a.className = "aa-caption", a.textContent = n, a.contentEditable = "true", a.dataset.placeholder = "Add a caption", e.append(a);
	}
}, Wp = typeof navigator < "u" && /Mac|iPhone|iPad/.test(navigator.platform);
function Gp(e, t = {}) {
	return t.sourceComments || Yr(t.value ?? "") ? ri(e, t, Kp) : Kp(e, t);
}
function Kp(e, t = {}) {
	let n = na(t.value ?? ""), r = !!t.readOnly, i = t.reordering !== !1, a = t.placing !== !1, o = t.placeholder ?? "", s = t.menus === !1 ? "" : t.blockPlaceholder ?? (t.prompt ? "Press space for AI or / for commands" : "Type / for commands"), c = !1, l = !1, u = null, d = !1, f = [], p = /* @__PURE__ */ new Map(), m = () => {}, h = () => {}, g = 0, _ = null, v = /* @__PURE__ */ new Map(), y = [
		...t.atoms ?? [Up],
		...t.partials ? [_p(() => !r)] : [],
		{
			...Bi,
			draw: (e, n) => t.drawEquation ? t.drawEquation(e, n.slice(1, -1), !1) : void (e.textContent = n.slice(1, -1))
		},
		{
			name: "equation-block",
			match: () => 0,
			draw: (e, n) => t.drawEquation ? t.drawEquation(e, n.replace(/^\$\$\n?|\n?\$\$$/g, ""), !0) : void (e.textContent = n.replace(/^\$\$\n?|\n?\$\$$/g, ""))
		},
		{
			name: "columns",
			match: () => 0,
			draw: (e, t) => C(e, t),
			insert: {
				label: "Columns",
				icon: "column",
				keywords: "side by side layout pictures images",
				source: yi(["", ""])
			}
		},
		{
			name: "toc",
			match: () => 0,
			draw: (e) => b(e),
			insert: {
				label: "Table of contents",
				icon: "bullet",
				keywords: "toc outline headings navigation",
				source: "<table_of_contents/>"
			}
		},
		{
			name: "tabs",
			match: () => 0,
			draw: (e, t) => w(e, t),
			insert: {
				label: "Tabs",
				icon: "tabs",
				keywords: "tab pages sections panels",
				source: Oi([{
					name: "Tab 1",
					content: ""
				}, {
					name: "Tab 2",
					content: ""
				}])
			}
		}
	];
	function b(t) {
		let i = Dd(t, () => n, e, (e) => {
			let t = A()[e];
			if (t && (t.scrollIntoView({
				block: "start",
				behavior: "instant"
			}), r && (t.tabIndex = -1), t.focus({ preventScroll: !0 }), !r)) {
				let t = {
					block: e,
					offset: n[e].prefix
				};
				L(t), R({
					anchor: t,
					focus: t
				});
			}
		});
		return v.set(t, i), () => {
			v.delete(t);
		};
	}
	let x = () => {
		for (let e of v.values()) e();
	}, S = /* @__PURE__ */ new Set();
	function C(e, n) {
		e.classList.add("aa-columns"), e.setAttribute("data-aa-interactive", "");
		let o = vi(n), s = [], c = () => {
			let t = yi(o);
			e.dataset.source = t, e.dispatchEvent(new CustomEvent("aa-atom-change", {
				bubbles: !0,
				detail: { source: t }
			}));
		}, l = () => {
			s.forEach((e) => {
				S.delete(e), e.destroy();
			}), e.querySelectorAll(":scope > .aa-column").forEach((e) => e.remove()), e.style.setProperty("--aa-columns", String(o.length)), s = o.map((n, s) => {
				let l = document.createElement("div");
				l.className = "aa-column", e.append(l);
				let u = Gp(l, {
					value: n,
					readOnly: r,
					reordering: i,
					placing: a,
					atoms: t.atoms,
					partials: t.partials,
					drawEquation: t.drawEquation,
					blockPlaceholder: "",
					onChange(e) {
						o[s] = e, c();
					}
				});
				return S.add(u), u;
			});
		}, u = (t) => {
			let { from: n, slot: i, swap: s } = t.detail, u = Array.from(e.querySelectorAll(":scope > .aa-column")).indexOf(t.target.closest(".aa-column"));
			if (u < 0 || !a || r) return;
			if (t.stopPropagation(), s !== void 0) {
				if (s === u || o[s] === void 0 || Mi(o[u]).length !== 1) return;
				let e = [...o];
				[e[u], e[s]] = [e[s], e[u]], o = e, l(), c();
				return;
			}
			let d = Mi(o[u]), f = d[n];
			if (!f || i === void 0) return;
			let p = Ni(d.filter((e, t) => t !== n)), m = p.trim() ? o.map((e, t) => t === u ? p : e) : o.filter((e, t) => t !== u);
			m.splice(Math.max(0, Math.min(i, m.length)), 0, f.source), o = m, l(), c();
		};
		return e.addEventListener("aa-column-carry", u), l(), () => {
			e.removeEventListener("aa-column-carry", u), s.forEach((e) => {
				S.delete(e), e.destroy();
			});
		};
	}
	function w(e, n) {
		e.classList.add("aa-tabs"), e.setAttribute("data-aa-interactive", "");
		let o = Di(n), s = 0, c = null, l = document.createElement("div");
		l.className = "aa-tabs-row", l.setAttribute("role", "tablist");
		let u = document.createElement("div");
		u.className = "aa-tab-panel", u.setAttribute("role", "tabpanel"), e.append(l, u);
		let d = () => {
			let t = Oi(o);
			e.dataset.source = t, e.dispatchEvent(new CustomEvent("aa-atom-change", {
				bubbles: !0,
				detail: { source: t }
			}));
		}, f = () => {
			if (l.replaceChildren(...o.map((e, t) => {
				let n = document.createElement("button");
				if (n.type = "button", n.className = "aa-tab", n.setAttribute("role", "tab"), n.setAttribute("aria-selected", String(t === s)), n.tabIndex = t === s ? 0 : -1, n.dataset.tab = String(t), e.icon) {
					let t = document.createElement("span");
					t.className = "aa-tab-icon", t.textContent = e.icon, n.append(t);
				}
				let i = document.createElement("span");
				return i.className = "aa-tab-name", i.textContent = e.name || `Tab ${t + 1}`, n.append(i), n.addEventListener("pointerdown", (e) => {
					t === s && !r && e.preventDefault();
				}), n.addEventListener("click", (e) => {
					e.preventDefault(), e.stopPropagation(), t === s && !r ? p(t, n) : m(t, !0);
				}), n;
			})), !r) {
				let e = document.createElement("button");
				e.type = "button", e.className = "aa-tab aa-tab-add", e.setAttribute("aria-label", "Add tab"), e.dataset.tooltip = "Add tab";
				let t = document.createElement("span");
				t.className = "aa-icon";
				let n = La["./icons/plus.svg"];
				n && (t.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(n.replace(/currentColor/g, "black"))}")`), e.append(t), e.addEventListener("pointerdown", (e) => e.preventDefault()), e.addEventListener("click", (e) => {
					e.preventDefault(), e.stopPropagation(), o = [...o, {
						name: `Tab ${o.length + 1}`,
						content: ""
					}], s = o.length - 1, d(), h();
					let t = l.querySelector(`[data-tab="${s}"]`);
					t && p(s, t);
				}), l.append(e);
			}
		}, p = (e, t) => {
			let n = t.querySelector(".aa-tab-name");
			if (!n) return;
			let r = document.createElement("input");
			r.type = "text", r.className = "aa-tab-field", r.value = o[e].name, r.setAttribute("aria-label", "Tab name"), r.size = Math.max(1, o[e].name.length || 5);
			let i = !1, a = (t) => {
				if (i) return;
				i = !0;
				let a = r.value.trim();
				r.replaceWith(n), t && a !== o[e].name && (o = o.map((t, n) => n === e ? {
					...t,
					name: a
				} : t), d(), f()), l.querySelector(`[data-tab="${e}"]`)?.focus({ preventScroll: !0 });
			};
			r.addEventListener("input", () => {
				r.size = Math.max(1, r.value.length || 1);
			}), r.addEventListener("keydown", (e) => {
				e.stopPropagation(), e.key === "Enter" && (e.preventDefault(), a(!0)), e.key === "Escape" && (e.preventDefault(), a(!1));
			}), r.addEventListener("blur", () => a(!0)), r.addEventListener("pointerdown", (e) => e.stopPropagation()), r.addEventListener("click", (e) => e.stopPropagation()), n.replaceWith(r), r.focus(), r.select();
		}, m = (e, n = !1) => {
			s = Math.max(0, Math.min(o.length - 1, e)), c &&= (S.delete(c), c.destroy(), null), u.replaceChildren(), f(), c = Gp(u, {
				value: o[s]?.content ?? "",
				readOnly: r,
				reordering: i,
				placing: a,
				atoms: t.atoms,
				partials: t.partials,
				drawEquation: t.drawEquation,
				blockPlaceholder: "",
				onChange(e) {
					o = o.map((t, n) => n === s ? {
						...t,
						content: e
					} : t), d();
				}
			}), S.add(c), n && l.querySelector(`[data-tab="${s}"]`)?.focus({ preventScroll: !0 });
		}, h = () => m(s);
		return l.addEventListener("keydown", (e) => {
			let t = e.target.closest(".aa-tab[data-tab]");
			if (!t || !l.contains(t)) return;
			let n = Number(t.dataset.tab);
			e.key === "ArrowRight" || e.key === "ArrowLeft" ? (e.preventDefault(), e.stopPropagation(), m((n + (e.key === "ArrowRight" ? 1 : o.length - 1)) % o.length, !0)) : (e.key === "Enter" || e.key === "F2") && !r ? (e.preventDefault(), e.stopPropagation(), p(n, t)) : (e.key === "Delete" || e.key === "Backspace") && !r && o.length > 1 && (e.preventDefault(), e.stopPropagation(), o = o.filter((e, t) => t !== n), s = Math.min(n, o.length - 1), d(), m(s, !0));
		}), h(), () => {
			c &&= (S.delete(c), c.destroy(), null);
		};
	}
	let T = /* @__PURE__ */ new Map(), E = (e, t) => {
		let n = za(e, t), i = y.find((t) => t.name === e);
		return i?.draw ? T.set(n, i.draw(n, t)) : n.textContent = t, n.querySelectorAll(".aa-caption").forEach((e) => e.contentEditable = r ? "false" : "true"), n;
	}, D = (t = !1) => {
		for (let [n, r] of T) (t || !e.contains(n)) && (T.delete(n), r?.());
	}, ee = (e, t, n) => {
		e.dataset.readonly = String(r), Ha(e, t, n, y, E, O(t));
	}, O = (e) => {
		if (!f.length) return [];
		let t = n.indexOf(e), r = t < 0 ? 0 : z({
			block: t,
			offset: 0
		});
		return f.map((e) => ({
			...e,
			from: e.from - r,
			to: e.to - r
		}));
	}, k = new Da({
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
	let te = () => {
		e.setAttribute("aria-readonly", String(r)), o ? e.setAttribute("aria-placeholder", o) : e.removeAttribute("aria-placeholder");
	};
	te();
	let A = () => Array.from(e.children), j = (e, t) => {
		let n = document.createElement("div");
		return n.contentEditable = r ? "false" : "true", t && n.append(...Array.from(t.querySelectorAll(":scope > .aa-atom[data-aa-interactive]"))), ee(n, e, null), n;
	}, ne = (e) => {
		if (!e || !t.prompt || r || u || c || aa(e.anchor, e.focus) !== 0) return !1;
		let i = n[e.focus.block];
		return !i || e.focus.offset !== i.source.length ? !1 : i.kind === "bullet" && i.source.length === i.prefix || (i.kind === "paragraph" || i.kind === "bullet") && /[^\s][.!?]["”’)]? $/.test(i.source);
	}, M = (e) => {
		e === void 0 && (e = I());
		let t = ne(e) ? e.focus.block : -1, i = e && !u && !r && aa(e.anchor, e.focus) === 0 ? e.focus.block : -1;
		A().forEach((e, r) => {
			let a = n[r], c = n.length === 1 && !a.source && o ? o : r === i && !a.source && a.kind === "paragraph" ? s : "";
			c ? e.dataset.placeholder = c : e.dataset.placeholder !== void 0 && delete e.dataset.placeholder, r === t ? e.dataset.hint = "Press space for AI" : e.dataset.hint !== void 0 && delete e.dataset.hint;
		});
	}, re = () => {
		e.replaceChildren(...n.map((e) => j(e))), x(), M(), D();
	}, N = (t) => {
		let r = n, i = A(), a = 0;
		for (; a < r.length && a < t.length && r[a] === t[a];) a++;
		let o = r.length, s = t.length;
		for (; o > a && s > a && r[o - 1] === t[s - 1];) o--, s--;
		n = t;
		let c = o - a === s - a, l = document.getSelection(), u = document.activeElement, d = c && u && e.contains(u) && u.closest(".aa-atom") ? {
			focused: u,
			...l?.rangeCount ? {
				anchorNode: l.anchorNode,
				anchorOffset: l.anchorOffset,
				focusNode: l.focusNode,
				focusOffset: l.focusOffset
			} : {}
		} : null, f = t.slice(a, s).map((e, t) => j(e, c ? i[a + t] : void 0)), p = i[o] ?? null;
		for (let e = a; e < o; e++) i[e].remove();
		for (let t of f) e.insertBefore(t, p);
		if (d && e.contains(d.focused) && document.activeElement !== d.focused && (d.focused.focus({ preventScroll: !0 }), d.anchorNode && d.focusNode && d.focused.contains(d.focusNode))) try {
			l.setBaseAndExtent(d.anchorNode, d.anchorOffset, d.focusNode, d.focusOffset);
		} catch {}
		x(), M(), D(), He?.draw();
	}, P = (t) => {
		let n = (t instanceof HTMLElement ? t : t?.parentElement ?? null)?.closest(".aa-block");
		return !n || n.parentElement !== e ? -1 : A().indexOf(n);
	}, F = () => !!document.activeElement?.closest?.(".aa-caption, [data-aa-interactive]"), I = () => {
		if (F()) return null;
		if (u) {
			let e = Math.min(u.anchor, u.focus), t = Math.max(u.anchor, u.focus);
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
		let t = P(e.anchorNode), r = P(e.focusNode);
		if (t < 0 || r < 0) return null;
		let i = A();
		return {
			anchor: {
				block: t,
				offset: Ja(i[t], e.anchorNode, e.anchorOffset)
			},
			focus: {
				block: r,
				offset: Ja(i[r], e.focusNode, e.focusOffset)
			}
		};
	}, ie = !1, L = (e, t = e) => {
		let r = A(), i = Ya(r[e.block], Math.min(e.offset, n[e.block].source.length)), a = Ya(r[t.block], Math.min(t.offset, n[t.block].source.length)), o = window.getSelection();
		if (o) {
			ie = !0;
			try {
				o.setBaseAndExtent(i.node, i.offset, a.node, a.offset);
			} finally {
				ie = !1;
			}
		}
	}, ae = (e, t) => {
		if (!t) return null;
		let [r, i] = oa(t.anchor, t.focus);
		return e < r.block || e > i.block ? null : {
			from: e === r.block ? r.offset : 0,
			to: e === i.block ? i.offset : n[e].source.length
		};
	}, R = (e) => {
		if (e === void 0 && (e = I()), c) return;
		let t = A(), r = !1;
		n.forEach((n, i) => {
			let a = ae(i, e);
			t[i].dataset.reveal !== Va(n, a, y) && (ee(t[i], n, a), r = !0);
		}), r && (D(), e && L(e.anchor, e.focus)), oe(e);
	}, oe = (e) => {
		if (!e || r || u || aa(e.anchor, e.focus) !== 0) return;
		let t = e.focus.block;
		Fi(n[t], y) && A()[t]?.querySelector("[data-aa-interactive]")?.focus({ preventScroll: !0 });
	}, se = (e) => n[e].kind === "bullet" && n[e + 1]?.kind === "bullet" ? 1 : 2, z = (e) => {
		let t = 0;
		for (let r = 0; r < e.block; r++) t += n[r].source.length + se(r);
		return t + e.offset;
	}, B = (e) => {
		let t = 0;
		for (let r = 0; r < n.length; r++) {
			let i = t + n[r].source.length;
			if (e <= i || r === n.length - 1) return {
				block: r,
				offset: Math.max(0, Math.min(e - t, n[r].source.length))
			};
			if (e < i + se(r)) return {
				block: r,
				offset: n[r].source.length
			};
			t = i + se(r);
		}
		return {
			block: 0,
			offset: 0
		};
	}, V = (e, t) => ({
		blocks: n,
		anchor: e,
		focus: t
	}), H = (r, i, a, o) => {
		let s = n, c = e.contains(document.activeElement);
		Te();
		let l = Ca(r), u = (e) => ({
			...e,
			offset: Math.max(0, e.offset + l[e.block].prefix - r[e.block].prefix)
		});
		i = u(i), a = u(a), N(l), L(i, a), R({
			anchor: i,
			focus: a
		}), M({
			anchor: i,
			focus: a
		}), Se(c), g || (k.record(V(i, a), o), t.onChange?.(J(n)), e.dispatchEvent(new Event("aa-change")), K?.written(s, o !== "edit"));
	}, ce = (r) => {
		let i = e.contains(document.activeElement), a = !!document.activeElement?.closest?.("[data-aa-interactive]");
		Te(), N(r.blocks), a ? R(null) : (L(r.anchor, r.focus), R({
			anchor: r.anchor,
			focus: r.focus
		}), Se(i)), t.onChange?.(J(n)), e.dispatchEvent(new Event("aa-change"));
	}, le = () => {
		if (r) return !1;
		if (K?.undoing(), _) return _.undo();
		let e = k.undo();
		return e && ce(e), !!e;
	}, ue = () => {
		if (r) return !1;
		if (K?.stop(), _) return _.redo();
		let e = k.redo();
		return e && ce(e), !!e;
	}, de = (e) => {
		let t = A().indexOf(e);
		if (t < 0) return;
		let r = Ka(e), i = r.replace(/^\[\] /, "- [ ] ");
		if (i === n[t].source) return;
		let a = i.length < n[t].source.length ? "delete" : "type", o = I(), { blocks: s, caret: c } = Y(n, {
			block: t,
			offset: 0
		}, {
			block: t,
			offset: n[t].source.length
		}, i), l = (e) => e.block === t ? fe(s, t, c, i, e.offset) : {
			...e,
			block: e.block + (s.length - n.length) * +(e.block > t)
		}, u = (e) => i !== r && e.block === t ? {
			...e,
			offset: e.offset + i.length - r.length
		} : e, d = o ? l(u(o.anchor)) : c, f = o ? l(u(o.focus)) : c;
		H(s, d, f, a);
	}, fe = (e, t, n, r, i) => {
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
	}, U = (e, t, r = "edit") => {
		let { blocks: i, caret: a } = Y(n, e.anchor, e.focus, t);
		H(i, a, a, r);
	}, W = /* @__PURE__ */ new Set(), pe = (r, i, a, o) => {
		let s = I(), c = e.contains(document.activeElement), { blocks: l } = Y(n, {
			block: r,
			offset: 0
		}, {
			block: r,
			offset: n[r].source.length
		}, i);
		if (l.length !== n.length) return;
		let u = (e) => e.block === r ? {
			block: r,
			offset: a(e.offset)
		} : e, d = {
			block: r,
			offset: l[r].source.length
		}, f = s ? u(s.anchor) : d, p = s ? u(s.focus) : d;
		n = l, ee(A()[r], n[r], ae(r, s && {
			anchor: f,
			focus: p
		})), x(), D(), s && Math.min(s.anchor.block, s.focus.block) <= r && Math.max(s.anchor.block, s.focus.block) >= r && c && L(f, p);
		let m = Os(A()[r], o);
		W.add(m), setTimeout(() => W.delete(m), 2e3), k.record(V(f, p), "edit"), t.onChange?.(J(n)), e.dispatchEvent(new CustomEvent("aa-change", { detail: { correction: !0 } }));
	}, me = e.getAttribute("spellcheck"), G = (t) => {
		t ? e.setAttribute("spellcheck", "false") : me === null ? e.removeAttribute("spellcheck") : e.setAttribute("spellcheck", me);
	}, K = t.correct ? ws({
		blocks: () => n,
		atoms: y,
		selection: I,
		busy: () => r || c || l || g > 0,
		apply: pe,
		value: () => J(n)
	}, t.correct, t.correcting !== !1) : null;
	K?.enabled && G(!0);
	let he = (e, t) => {
		let [r, i] = oa(e.anchor, e.focus);
		if (r.block !== i.block || r.offset !== i.offset) return !1;
		let a = n[r.block];
		if (a.kind === "table") {
			let e = ja(a.source).flat().find((e) => r.offset >= e.from && r.offset <= e.to);
			return !!e && (t === "backward" ? r.offset === e.from : r.offset === e.to);
		}
		if (t === "backward") {
			if (r.offset <= a.prefix) {
				let e = ua(n, r.block);
				if (e) return H(e.blocks, e.caret, e.caret, "edit"), !0;
			}
			if (r.offset !== 0) return !1;
			let e = da(n, r.block);
			return e && H(e.blocks, e.caret, e.caret, "edit"), !0;
		}
		if (r.offset !== a.source.length) return !1;
		let o = fa(n, r.block);
		return o && H(o.blocks, o.caret, o.caret, "edit"), !0;
	}, ge = (e) => {
		if (l) return;
		if (r) {
			e.preventDefault();
			return;
		}
		if (e.target.closest?.(".aa-caption")) return;
		let i = e.inputType;
		if (i === "historyUndo") {
			e.preventDefault(), le();
			return;
		}
		if (i === "historyRedo") {
			e.preventDefault(), ue();
			return;
		}
		if (c || e.isComposing) return;
		let a = I();
		if (!a) return;
		if (u && i.startsWith("insert")) {
			e.preventDefault(), U(a, e.data ?? "", "edit");
			return;
		}
		let [o, s] = oa(a.anchor, a.focus), d = o.block !== s.block, f = !d && o.offset === s.offset, p = n[o.block];
		if (i === "insertText" && (e.data === " " || e.data === "\xA0") && t.prompt && f) {
			if (p.kind === "paragraph" && !p.source) {
				e.preventDefault(), Ke(o.block);
				return;
			}
			if (ne(a)) {
				e.preventDefault(), Ke(o.block, !0);
				return;
			}
		}
		if (p.kind === "table") {
			let t = ja(p.source).flat().find((e) => o.offset >= e.from && o.offset <= e.to);
			if (t && f && (i === "deleteContentBackward" && o.offset === t.from || i === "deleteContentForward" && o.offset === t.to)) {
				e.preventDefault();
				return;
			}
		}
		switch (i) {
			case "insertParagraph":
			case "insertLineBreak":
				e.preventDefault(), ve(a);
				return;
			case "insertFromPaste": {
				e.preventDefault();
				let t = e.dataTransfer?.getData("text/plain") ?? "";
				t && U(a, t.replace(/\r\n?/g, "\n"));
				return;
			}
			case "insertFromDrop":
				e.preventDefault();
				return;
			case "deleteContentBackward":
				if (!f) {
					e.preventDefault(), U(a, "");
					return;
				}
				he(a, "backward") && e.preventDefault();
				return;
			case "deleteContentForward":
				if (!f) {
					e.preventDefault(), U(a, "");
					return;
				}
				he(a, "forward") && e.preventDefault();
				return;
			case "deleteByCut":
				e.preventDefault();
				return;
			case "formatBold":
				e.preventDefault(), ye(a, "**");
				return;
			case "formatItalic":
				e.preventDefault(), ye(a, "*");
				return;
			case "formatStrikeThrough":
				e.preventDefault(), ye(a, "~~");
				return;
			default:
				if (!d) return;
				e.preventDefault(), i.startsWith("insert") ? U(a, e.data ?? "", "type") : i.startsWith("delete") && U(a, "");
		}
	}, _e = (i) => {
		if (l || r || c || i instanceof InputEvent && i.isComposing) return;
		let a = i.target.closest?.(".aa-caption");
		if (a) {
			let r = a.closest(".aa-atom"), i = r.closest(".aa-block"), o = A().indexOf(i), s = (r.dataset.source ?? "").replace(/^!\[[^\]]*\]/, `![${(a.textContent ?? "").replace(/\]/g, "").replace(/\n/g, " ")}]`);
			r.dataset.source = s;
			let c = [...n];
			c[o] = {
				...n[o],
				source: Ka(i)
			}, n = c, x();
			let l = {
				block: o,
				offset: Ja(i, r, 1)
			};
			k.record(V(l, l), "type"), t.onChange?.(J(n)), e.dispatchEvent(new Event("aa-change"));
			return;
		}
		let o = i.target?.closest?.(".aa-block");
		o && o.parentElement === e && de(o);
	}, ve = (e, t = !1) => {
		if (n[e.focus.block].kind === "table") {
			let r = e.focus.block, i = n[r], a = ja(i.source), o = a.at(-1)?.at(-1);
			if (!t && aa(e.anchor, e.focus) === 0 && o && e.focus.offset >= o.from && e.focus.offset <= o.to) {
				let e = Ia(i, "add-row", a.length - 1, 0), t = Y(n, {
					block: r,
					offset: 0
				}, {
					block: r,
					offset: i.source.length
				}, e), o = {
					block: r,
					offset: ja(e).at(-1)[0].from
				};
				H(t.blocks, o, o, "edit");
				return;
			}
			let s = [
				...n.slice(0, r + 1),
				{
					kind: "paragraph",
					source: "",
					prefix: 0
				},
				...n.slice(r + 1)
			], c = {
				block: r + 1,
				offset: 0
			};
			H(s, c, c, "edit");
			return;
		}
		if (n[e.focus.block].kind === "callout" && !t) {
			U(e, "\n> ");
			return;
		}
		if (t) {
			U(e, "\n");
			return;
		}
		let [r, i] = oa(e.anchor, e.focus), a = n, o = r;
		aa(r, i) !== 0 && ({blocks: a, caret: o} = Y(n, r, i, ""));
		let s = la(a, o);
		H(s.blocks, s.caret, s.caret, "edit");
	}, ye = (e, t, r = t) => {
		let i = pa(n, e.anchor, e.focus, t, r);
		i && H(i.blocks, i.anchor, i.focus, "edit");
	}, q = (t) => {
		let [r, i] = oa(t.anchor, t.focus);
		if (r.block !== i.block) return;
		let a = r.offset, o = i.offset, s = n[r.block].source.slice(a, o), c = "";
		for (let e of n[r.block].source.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g)) if (r.offset >= e.index && i.offset <= e.index + e[0].length) {
			a = e.index, o = a + e[0].length, s = e[1], c = e[2];
			break;
		}
		e.dispatchEvent(new CustomEvent("aa-link-request", { detail: {
			start: z({
				block: r.block,
				offset: a
			}),
			end: z({
				block: r.block,
				offset: o
			}),
			text: s,
			url: c
		} }));
	}, be = () => {
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
	}, xe = (e, t, n, r) => e < n ? e - n : t > r ? Math.min(t - r, e - n) : 0, Se = (t = e.contains(document.activeElement)) => {
		if (!t) return;
		let n = be(), r = window.getSelection()?.focusNode;
		if (!n || !r || !e.contains(r) || !n.width && !n.height && !n.top && !n.left) return;
		let { top: i, bottom: a, left: o, right: s } = n;
		for (let e = r instanceof HTMLElement ? r : r.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
			let t = getComputedStyle(e), n = /auto|scroll|overlay/.test(t.overflowY) && e.scrollHeight > e.clientHeight, r = /auto|scroll|overlay/.test(t.overflowX) && e.scrollWidth > e.clientWidth;
			if (!n && !r) continue;
			let c = e.getBoundingClientRect(), l = c.top + e.clientTop, u = c.left + e.clientLeft, d = n ? xe(i, a, l, l + e.clientHeight) : 0, f = r ? xe(o, s, u, u + e.clientWidth) : 0;
			if (!f && !d) continue;
			let p = e.scrollTop, m = e.scrollLeft;
			e.scrollBy({
				top: d,
				left: f,
				behavior: "instant"
			}), i -= e.scrollTop - p, a -= e.scrollTop - p, o -= e.scrollLeft - m, s -= e.scrollLeft - m;
		}
		let c = window.visualViewport, l = c?.offsetTop ?? 0, u = c?.offsetLeft ?? 0, d = xe(i, a, l, l + (c?.height ?? window.innerHeight)), f = xe(o, s, u, u + (c?.width ?? window.innerWidth));
		(f || d) && window.scrollBy({
			top: d,
			left: f,
			behavior: "instant"
		});
	}, Ce = (e, t, r) => {
		let i = A()[e], a = i.getBoundingClientRect(), o = r === "top" ? a.top + 2 : a.bottom - 2, s = null, c = 0, l = document.caretPositionFromPoint;
		if (l) {
			let e = l.call(document, t, o);
			e && (s = e.offsetNode, c = e.offset);
		} else if (document.caretRangeFromPoint) {
			let e = document.caretRangeFromPoint(t, o);
			e && (s = e.startContainer, c = e.startOffset);
		}
		let u = s && i.contains(s) ? {
			block: e,
			offset: Ja(i, s, c)
		} : {
			block: e,
			offset: r === "top" ? we(e) : n[e].source.length
		};
		L(u), R({
			anchor: u,
			focus: u
		}), Se();
	}, we = (e) => {
		let t = n[e];
		return t.kind === "code" || t.kind === "divider" ? 0 : t.prefix;
	}, Te = () => {
		u = null;
		for (let e of A()) e.removeAttribute("data-selected");
	}, Ee = (e, t = e) => {
		u = va(n, e, t);
		let r = Math.min(u.anchor, u.focus), i = Math.max(u.anchor, u.focus);
		L({
			block: r,
			offset: 0
		}, {
			block: i,
			offset: n[i].source.length
		}), R(), A().forEach((e, t) => e.toggleAttribute("data-selected", t >= r && t <= i));
	}, De = (e, t) => {
		if (!i && (e === "up" || e === "down")) return;
		let r = Math.min(t.anchor, t.focus), a = Math.max(t.anchor, t.focus), o = e === "delete" ? ba(n, t) : e === "duplicate" ? xa(n, t) : Sa(n, t, e === "up" ? -1 : 1);
		o && (H(o.blocks, o.caret, o.caret, "edit"), e !== "delete" && Ee(o.caret.block, o.caret.block + a - r));
	}, Oe = () => {
		Ue?.close(), He?.clear(), Te();
		let t = e.ownerDocument.getSelection();
		t && (e.contains(t.anchorNode) || e.contains(t.focusNode)) && t.removeAllRanges();
		let n = e.ownerDocument.activeElement;
		n instanceof HTMLElement && e.contains(n) && n.blur(), R(), e.dispatchEvent(new Event("aa-dismiss"));
	}, ke = (e) => {
		if (l || r || c || e.isComposing || e.defaultPrevented) return;
		let i = e.target.closest?.(".aa-caption");
		if (i) {
			if ((Wp ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "a") {
				e.preventDefault();
				let t = document.createRange();
				t.selectNodeContents(i);
				let n = window.getSelection();
				n?.removeAllRanges(), n?.addRange(t);
				return;
			}
			e.key === "Escape" ? (e.preventDefault(), e.stopPropagation(), Oe()) : e.key === "Enter" && (e.preventDefault(), e.target.blur());
			return;
		}
		let a = Wp ? e.metaKey : e.ctrlKey;
		if (a && !e.altKey && e.key.toLowerCase() === "z") {
			e.preventDefault(), e.shiftKey ? ue() : le();
			return;
		}
		if (a && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "y") {
			e.preventDefault(), ue();
			return;
		}
		if (e.key === "Escape") {
			e.preventDefault(), e.stopPropagation(), Oe();
			return;
		}
		let o = I();
		if (!o) return;
		let s = e.key.toLowerCase();
		if (d = !1, a && e.shiftKey && s === "v") {
			d = !0;
			return;
		}
		if (a && e.shiftKey && !e.altKey && s === "m" && Ue) {
			e.preventDefault(), Ue.start();
			return;
		}
		if (e.key === " " && t.prompt && !a && !e.altKey && !e.shiftKey && !u && aa(o.anchor, o.focus) === 0) {
			let t = n[o.focus.block];
			if (t.kind === "paragraph" && !t.source) {
				e.preventDefault(), Ke(o.focus.block);
				return;
			}
			if (ne(o)) {
				e.preventDefault(), Ke(o.focus.block, !0);
				return;
			}
		}
		if ((e.key === "Backspace" || e.key === "Delete") && !u && !a && !e.altKey && !e.shiftKey && he(o, e.key === "Backspace" ? "backward" : "forward")) {
			e.preventDefault();
			return;
		}
		if (a && s === "a" && !e.altKey) {
			e.preventDefault();
			let t = o.focus.block, r = n[t], i = r.kind === "table" && !u ? ja(r.source).flat().find((e) => o.focus.offset >= e.from && o.focus.offset <= e.to) : null, a = i ? i.from : we(t), s = i ? i.to : r.source.length, [c, l] = oa(o.anchor, o.focus), d = c.block === t && l.block === t && c.offset <= a && l.offset >= s, f = n.length - 1, p = !!u || d;
			if (Te(), !p) {
				L({
					block: t,
					offset: a
				}, {
					block: t,
					offset: s
				}), R();
				return;
			}
			let m = {
				block: f,
				offset: n[f].source.length
			};
			L({
				block: 0,
				offset: we(0)
			}, m);
			let h = I(), [g, _] = h ? oa(h.anchor, h.focus) : [];
			!g || !_ || g.block !== 0 || g.offset > we(0) || aa(_, m) !== 0 ? Ee(0, f) : R();
			return;
		}
		let f = u ?? va(n, o.anchor.block, o.focus.block), p = n[o.focus.block];
		if (p.kind === "table" && !a && !e.shiftKey && o.anchor.offset === o.focus.offset && /^Arrow/.test(e.key)) {
			let t = ja(p.source), n = t.flat(), r = n.findIndex((e) => o.focus.offset >= e.from && o.focus.offset <= e.to), i = n[r], a;
			if (i && e.key === "ArrowLeft" && o.focus.offset === i.from && (a = n[r - 1]), i && e.key === "ArrowRight" && o.focus.offset === i.to && (a = n[r + 1]), i && (e.key === "ArrowUp" || e.key === "ArrowDown") && (a = n[r + (e.key === "ArrowUp" ? -t[0].length : t[0].length)]), a) {
				e.preventDefault();
				let t = {
					block: o.focus.block,
					offset: e.key === "ArrowLeft" ? a.to : a.from
				};
				A()[t.block].querySelectorAll("[data-cell]")[n.indexOf(a)]?.focus(), L(t);
				return;
			}
		}
		if (e.key === "Tab" && !a && !e.altKey) {
			let t = n[o.focus.block];
			if (t.kind === "table") {
				e.preventDefault();
				let n = ja(t.source).flat(), r = n[n.findIndex((e) => o.focus.offset >= e.from && o.focus.offset <= e.to) + (e.shiftKey ? -1 : 1)];
				if (r) {
					let e = {
						block: o.focus.block,
						offset: r.from
					};
					L(e), A()[e.block].querySelectorAll("[data-cell]")[n.indexOf(r)]?.focus(), L(e);
				} else e.shiftKey || ve(o);
				return;
			}
			if (t.kind === "bullet") {
				e.preventDefault();
				let t = wa(n, f, e.shiftKey ? -1 : 1);
				t && H(t.blocks, t.caret, t.caret, "edit");
				return;
			}
		}
		if (a && e.altKey && s === "t") {
			e.preventDefault();
			let t = n;
			for (let e = 0; e < t.length; e++) t = Ta(t, e, !0)?.blocks ?? t;
			H(t, o.anchor, o.focus, "edit");
			return;
		}
		if (a && s === "d" && !e.altKey) {
			e.preventDefault(), De("duplicate", f);
			return;
		}
		if (a && e.shiftKey && (s === "arrowup" || s === "arrowdown")) {
			e.preventDefault(), De(s === "arrowup" ? "up" : "down", f);
			return;
		}
		let m = /^Digit[0-9]$/.test(e.code) ? Number(e.code.slice(-1)) : /^\d$/.test(s) ? Number(s) : -1;
		if (a && e.altKey && m >= 0) {
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
			][m];
			if (t) {
				e.preventDefault();
				let r = ya(n, f, t);
				H(r.blocks, r.caret, r.caret, "edit");
			}
			return;
		}
		if (a && e.key === "Enter") {
			e.preventDefault();
			let t = _a(n, o.focus.block) ?? Ta(n, o.focus.block);
			t && H(t.blocks, t.caret, t.caret, "edit");
			return;
		}
		if (u) {
			if (s === "backspace" || s === "delete") {
				e.preventDefault(), De("delete", u);
				return;
			}
			if (s === "arrowup" || s === "arrowdown") {
				e.preventDefault();
				let t = u.focus + (s === "arrowup" ? -1 : 1);
				Ee(e.shiftKey ? u.anchor : t, t);
				return;
			}
			if (s === "arrowleft" || s === "arrowright" || s === "enter") {
				e.preventDefault();
				let t = u.focus;
				Te();
				let r = {
					block: t,
					offset: s === "arrowright" ? n[t].source.length : we(t)
				};
				A()[t].focus(), L(r), R();
				return;
			}
		}
		if (!a && !e.altKey && e.shiftKey && (s === "arrowup" || s === "arrowdown")) {
			e.preventDefault(), Ee(o.anchor.block, o.focus.block + (s === "arrowup" ? -1 : 1));
			return;
		}
		if (e.key === "Enter" && !a && !e.altKey) {
			e.preventDefault(), ve(o, e.shiftKey);
			return;
		}
		if (a && !e.altKey) {
			let t = e.key.toLowerCase();
			if (t === "b" && !e.shiftKey) {
				e.preventDefault(), ye(o, "**");
				return;
			}
			if (t === "i" && !e.shiftKey) {
				e.preventDefault(), ye(o, "*");
				return;
			}
			if (t === "e" && !e.shiftKey) {
				e.preventDefault(), ye(o, "`");
				return;
			}
			if (t === "u" && !e.shiftKey) {
				e.preventDefault(), ye(o, "<u>", "</u>");
				return;
			}
			if ((t === "x" || t === "s") && e.shiftKey) {
				e.preventDefault(), ye(o, "~~");
				return;
			}
			if (t === "k" && !e.shiftKey) {
				e.preventDefault(), q(o);
				return;
			}
			return;
		}
		if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey || aa(o.anchor, o.focus) !== 0) return;
		let { block: h, offset: g } = o.focus, _ = A()[h];
		if (e.key === "ArrowLeft" && g === 0 && h > 0) {
			e.preventDefault();
			let t = {
				block: h - 1,
				offset: n[h - 1].source.length
			};
			L(t), R({
				anchor: t,
				focus: t
			}), Se();
		} else if (e.key === "ArrowRight" && g === n[h].source.length && h + 1 < n.length) {
			e.preventDefault();
			let t = {
				block: h + 1,
				offset: we(h + 1)
			};
			L(t), R({
				anchor: t,
				focus: t
			}), Se();
		} else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
			let t = e.key === "ArrowUp";
			if (t ? h === 0 : h + 1 >= n.length) return;
			let r = be(), i = _.getBoundingClientRect();
			if (!r) return;
			let a = r.height || parseFloat(getComputedStyle(_).lineHeight) || 16;
			if (!(t ? r.top - i.top < a * .75 : i.bottom - r.bottom < a * .75)) return;
			e.preventDefault(), Ce(t ? h - 1 : h + 1, r.left, t ? "bottom" : "top");
		}
	}, Ae = (e) => {
		if (e.target.closest?.(".aa-caption")) return;
		let t = I();
		t && e.clipboardData && aa(t.anchor, t.focus) !== 0 && (e.preventDefault(), e.clipboardData.setData("text/plain", sa(n, t.anchor, t.focus)), e.type === "cut" && !r && (u ? De("delete", u) : U(t, "")));
	}, je = (t) => {
		Te();
		let i = t.target, a = i?.closest?.("a.aa-link");
		if (a && e.contains(a)) {
			t.metaKey || t.ctrlKey || r ? (t.preventDefault(), window.open(a.href, "_blank", "noopener,noreferrer")) : t.preventDefault();
			return;
		}
		let o = i?.closest?.(".aa-block");
		if (!o || o.parentElement !== e || r) return;
		let s = A().indexOf(o), c = n[s];
		if (c.kind === "callout") {
			let r = o.getBoundingClientRect(), i = getComputedStyle(o), a = t.clientX - r.left, l = t.clientY - r.top, u = parseFloat(i.paddingLeft);
			if (c.box) {
				let n = parseFloat(i.paddingTop) || u;
				a >= u - n && a < u && l >= n && l < 2 * n && (t.preventDefault(), e.dispatchEvent(new CustomEvent("aa-callout-icon", {
					bubbles: !0,
					detail: {
						index: s,
						rect: new DOMRect(r.left + u - n, r.top + n, n, n)
					}
				})));
				return;
			}
			if (a < u) {
				t.preventDefault();
				let e = Ta(n, s);
				e && H(e.blocks, e.caret, e.caret, "edit");
			}
			return;
		}
		if (c.kind !== "bullet" || c.checked === void 0) return;
		let l = o.getBoundingClientRect(), u = parseFloat(getComputedStyle(o).paddingLeft);
		if (t.clientX - l.left > u) return;
		t.preventDefault();
		let d = _a(n, s);
		d && H(d.blocks, d.caret, d.caret, "edit");
	}, Me = () => {
		let e = 0;
		return n.map((t, n) => {
			let r = e, i = e + t.source.length;
			return e = i + se(n), JSON.stringify(f.filter((e) => e.from <= i && e.to >= r).map((e) => ({
				...e,
				from: e.from - r,
				to: e.to - r
			})));
		});
	}, Ne = null, Pe = (e) => {
		Ne = null;
		let t = I(), r = A(), i = Me(), a = !1;
		n.forEach((n, o) => {
			e[o] !== i[o] && (ee(r[o], n, ae(o, t)), a = !0);
		}), a && (t && L(t.anchor, t.focus), D());
	}, Fe = (e) => {
		c = !0;
		let t = e.target?.closest?.(".aa-block");
		t && delete t.dataset.placeholder;
	}, Ie = (t) => {
		if (c = !1, t.target.closest?.(".aa-caption")) {
			_e(t);
			return;
		}
		let n = t.target?.closest?.(".aa-block");
		n && n.parentElement === e && de(n), Ne && Pe(Ne);
	}, Le = () => {
		!l && !c && !ie && !F() && !window.getSelection()?.anchorNode?.parentElement?.closest(".aa-caption") && (R(), M(), e.dispatchEvent(new Event("aa-selectionchange")), K?.moved());
	}, Re = (i) => {
		let a = i.detail?.source, o = i.target?.closest?.(".aa-block");
		if (l || r || typeof a != "string" || !o || o.parentElement !== e) return;
		i.stopPropagation();
		let s = A().indexOf(o);
		if (s < 0 || n[s].source === a) return;
		let c = I(), { blocks: u } = Y(n, {
			block: s,
			offset: 0
		}, {
			block: s,
			offset: n[s].source.length
		}, a);
		Te(), N(Ca(u));
		let d = (e) => ({
			block: Math.min(e.block, n.length - 1),
			offset: Math.min(e.offset, n[Math.min(e.block, n.length - 1)].source.length)
		});
		c && (L(d(c.anchor), d(c.focus)), R({
			anchor: d(c.anchor),
			focus: d(c.focus)
		}));
		let f = c ? d(c.focus) : {
			block: Math.min(s, n.length - 1),
			offset: 0
		};
		k.record(V(f, f), "edit"), t.onChange?.(J(n)), e.dispatchEvent(new Event("aa-change"));
	}, ze = (i) => {
		let a = i.detail?.source, o = i.target?.closest?.(".aa-atom"), s = o?.closest(".aa-block");
		if (l || r || typeof a != "string" || !o || !s || s.parentElement !== e) return;
		i.stopPropagation();
		let c = A().indexOf(s);
		if (c < 0) return;
		o.dataset.source = a;
		let u = [...n];
		u[c] = {
			...n[c],
			source: Ka(s)
		};
		let { blocks: d } = Y(n, {
			block: c,
			offset: 0
		}, {
			block: c,
			offset: n[c].source.length
		}, u[c].source);
		Te(), N(Ca(d));
		let f = {
			block: c,
			offset: 0
		};
		k.record(V(f, f), "edit"), t.onChange?.(J(n)), e.dispatchEvent(new Event("aa-change"));
	}, Be = (t) => {
		let r = t.detail?.forward !== !1, i = t.target?.closest?.(".aa-block");
		if (l || !i || i.parentElement !== e) return;
		t.stopPropagation();
		let a = A().indexOf(i) + (r ? 1 : -1);
		if (a < 0 || a >= n.length) return;
		let o = {
			block: a,
			offset: r ? we(a) : n[a].source.length
		};
		A()[a].focus({ preventScroll: !0 }), L(o), R({
			anchor: o,
			focus: o
		}), Se();
	}, Ve = null, He = null, Ue = null, We = (e) => {
		let t = e, r = e;
		for (; t > 0 && n[t].kind !== "heading";) t--;
		for (; r + 1 < n.length && n[r + 1].kind !== "heading";) r++;
		return Array.from({ length: r - t + 1 }, (e, n) => t + n).filter((t) => t !== e && n[t].source.trim());
	}, Ge = () => {
		let e = window.getSelection();
		if (!e?.rangeCount) return;
		let t = e.getRangeAt(0), n = t.getClientRects()[0];
		if (n && n.height) return n;
		let r = t.startContainer, i = t.startOffset;
		if (r.nodeType !== Node.TEXT_NODE || !i) return;
		let a = document.createRange();
		a.setStart(r, i - 1), a.setEnd(r, i);
		let o = a.getClientRects()[0];
		return o ? new DOMRect(o.right, o.top, 0, o.height) : void 0;
	}, Ke = (e, i = !1) => {
		let a = A()[e], o = n[e], s = o.source, c = i ? Ge() : void 0, u = a.getBoundingClientRect(), d = getComputedStyle(a), f = a.clientLeft + (parseFloat(d.paddingLeft) || 0), p = (parseFloat(d.paddingRight) || 0) + (parseFloat(d.borderRightWidth) || 0), m = a.clientTop + (parseFloat(d.paddingTop) || 0), h = parseFloat(d.lineHeight) || c?.height || 0, g = c ? c.left - u.left - f : 0, _ = c ? m + (h ? Math.max(0, Math.floor((c.top + c.height / 2 - u.top - m) / h)) * h : c.top - u.top - m) : 0;
		Ve?.close(), Ve = jp({
			place: () => {
				let e = a.getBoundingClientRect();
				return c ? new DOMRect(e.left + f, e.top + _, Math.max(e.width - f - p, 80), h || c.height) : e;
			},
			indent: g,
			type: a,
			placeholder: i ? "Ask AI or press space to speak" : void 0,
			grow: (e) => {
				a.style.minHeight = e ? `${_ + e}px` : "";
			},
			about: () => We(n.indexOf(o)).map((e) => A()[e]),
			send: async (e, c) => {
				let u = n.indexOf(o), d = await t.prompt(e, {
					kind: "writing",
					signal: c,
					text: J(We(u).map((e) => n[e])),
					before: J(n.slice(0, u)),
					after: J(n.slice(u + 1)),
					document: J(n.map((e) => e === o ? {
						...e,
						source: i ? `${e.source}${Cp}` : Cp
					} : e))
				}), f = n.indexOf(o);
				if (l || r || f < 0 || o.source !== (i ? s : "")) throw Error("Not answered");
				a.style.minHeight = "";
				let p = $e(f, d, i);
				if (!p) throw Error("Not answered");
				A()[Math.min(p.caret, n.length - 1)]?.focus({ preventScroll: !0 });
			},
			close: (e) => {
				Ve = null, a.style.minHeight = "";
				let t = n.indexOf(o);
				e || t < 0 || l || (A()[t].focus({ preventScroll: !0 }), L({
					block: t,
					offset: i ? n[t].source.length : 0
				}));
			}
		});
	}, qe = (e, t, r = !1) => {
		let i = t.replace(/\r\n?/g, "\n"), a = i.indexOf(Cp), o = a < 0 ? null : i.slice(0, a).trimEnd(), s = (a < 0 ? i : r ? i.slice(0, a) + i.slice(a + Cp.length) : `${i.slice(0, a).trimEnd()}\n\n${i.slice(a + Cp.length).trimStart()}`).trim();
		if (s === J(r ? n : n.filter((t, n) => n !== e)).trim()) return null;
		if (r) return Je(s, Math.max(0, o ? na(i.slice(0, a)).length - 1 : e));
		let c = o === null ? e : o ? na(o).length : 0;
		return Je(s, Math.max(0, c - 1));
	}, Je = (e, t) => {
		let r = n, i = Ca(na(e)), a = /* @__PURE__ */ new Set(), o = i.map((e) => {
			let t = r.find((t) => !a.has(t) && t.source === e.source && t.kind === e.kind && (t.depth ?? 0) === (e.depth ?? 0) && t.number === e.number);
			return t ? (a.add(t), t) : e;
		}), s = Math.min(t, o.length - 1), c = {
			block: s,
			offset: o[s].source.length
		};
		H(o, c, c, "edit"), n.forEach((e, t) => {
			if (r.includes(e)) return;
			let n = Os(A()[t], [[0, e.source.length]]);
			W.add(n), setTimeout(() => W.delete(n), 2e3);
		});
		let l = Ze(r, n);
		return He?.set(l), { caret: s };
	}, Ye = "", Xe = (e) => {
		let t = [];
		for (let r of e) r.blocks.forEach((e, i) => {
			let a = n.indexOf(e);
			if (a < 0) return;
			let o = z({
				block: a,
				offset: 0
			});
			for (let [e, n] of r.words[i] ?? []) t.push({
				from: o + e,
				to: o + n,
				className: "aa-ai-changed"
			});
		});
		let r = JSON.stringify(t);
		if (r === Ye) return;
		Ye = r;
		let i = Ne ?? Me();
		t.length ? p.set("ai", t) : p.delete("ai"), f = [...p.values()].flat(), c ? Ne = i : Pe(i);
	}, Ze = (e, t) => {
		let n = [], r = 0, i = [], a = (t) => {
			let a = e.slice(r, t).filter((e) => e.source);
			i.length && i.length === a.length ? i.forEach((e, t) => {
				let r = bp(a[t].source, e.source);
				n.push({
					blocks: [e],
					before: [a[t]],
					words: [r ? [] : yp(a[t].source.slice(a[t].prefix), e.source.slice(e.prefix)).map(([t, n]) => [t + e.prefix, n + e.prefix])],
					box: r
				});
			}) : i.length && n.push({
				blocks: i,
				before: a,
				words: i.map((e) => e.source.trim() ? [[e.prefix, e.source.length]] : [])
			}), i = [];
		};
		for (let n of t) {
			let t = e.indexOf(n);
			t < r ? i.push(n) : (a(t), r = t + 1);
		}
		return a(e.length), n;
	}, Qe = (e) => {
		let t = n.indexOf(e.blocks[0]), i = e.blocks.length;
		if (r || l || t < 0 || e.blocks.some((e, r) => n[t + r] !== e)) return !1;
		let a = t + i - 1, o = e.before.length - i, s = I(), c = Ca([
			...n.slice(0, t),
			...e.before,
			...n.slice(a + 1)
		]), u = (n) => n.block > a ? {
			...n,
			block: n.block + o
		} : n.block >= t ? {
			block: Math.max(0, Math.min(t + e.before.length - 1, c.length - 1)),
			offset: 0
		} : n, d = s ? u(s.anchor) : {
			block: Math.min(t, c.length - 1),
			offset: 0
		}, f = s ? u(s.focus) : d, p = (e) => ({
			block: Math.min(e.block, c.length - 1),
			offset: Math.min(e.offset, c[Math.min(e.block, c.length - 1)].source.length)
		});
		return H(c, p(d), p(f), "edit"), !0;
	}, $e = (e, t, r = !1) => {
		let { edits: i = [], insert: a = "", document: o } = typeof t == "string" ? { insert: t } : t;
		if (typeof o == "string" && o.trim()) return qe(e, o, r);
		if (r) return null;
		let s = (e, t) => {
			let n = e.indexOf(t);
			return n >= 0 && e.indexOf(t, n + 1) < 0 ? n : -1;
		}, c = J(n.slice(0, e)), l = J(n.slice(e + 1)), u = 0;
		for (let { find: e, replace: t } of i) {
			if (!e) continue;
			let n = s(c, e), r = s(l, e);
			n >= 0 && l.indexOf(e) < 0 ? (c = c.slice(0, n) + t + c.slice(n + e.length), u++) : r >= 0 && c.indexOf(e) < 0 && (l = l.slice(0, r) + t + l.slice(r + e.length), u++);
		}
		let d = a.trim();
		if (!u && !d) return null;
		let f = c.trim() ? na(c.trimEnd()).length : 0;
		return Je([
			c.trimEnd(),
			d,
			l.trimStart()
		].filter(Boolean).join("\n\n"), d ? f + na(d).length - 1 : Math.max(0, f - 1));
	}, et = (e) => {
		let n = e.detail;
		!n || l || r || (e.stopPropagation(), n.available = !!t.prompt, t.prompt && n.prompt && n.signal && (n.answer = t.prompt(n.prompt, {
			kind: "diagram",
			text: n.text ?? "",
			signal: n.signal
		}).then((e) => typeof e == "string" ? e : e.insert ?? "")));
	}, tt = () => Te(), nt = (e) => Array.from(e?.files ?? []), rt = (e) => {
		if (e.target.closest?.(".aa-caption")) return;
		let i = d;
		if (d = !1, r || l) return;
		let a = nt(e.clipboardData);
		if (a.length && t.onFiles) {
			e.preventDefault(), t.onFiles(a);
			return;
		}
		let o = I(), s = e.clipboardData?.getData("text/plain");
		if (!o || s === void 0) return;
		e.preventDefault();
		let [c, f] = oa(o.anchor, o.focus), p = n[c.block];
		if (!i && !u && c.block === f.block && p.kind === "table" && s.includes("	")) {
			let e = ja(p.source), t = e.findIndex((e) => e.some((e) => c.offset >= e.from && c.offset <= e.to)), r = t < 0 ? -1 : e[t].findIndex((e) => c.offset >= e.from && c.offset <= e.to);
			if (t >= 0 && r >= 0) {
				let i = e.map((e) => e.map((e) => e.text));
				s.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n").map((e) => e.split("	")).forEach((e, n) => {
					let a = i[t + n] ?? (i[t + n] = []);
					e.forEach((e, t) => {
						a[r + t] = e;
					});
				});
				let a = Pa(i, Ma(p.source)), o = ja(a)[t][r], l = Y(n, {
					block: c.block,
					offset: 0
				}, {
					block: c.block,
					offset: p.source.length
				}, a), u = {
					block: c.block,
					offset: o.to
				};
				H(l.blocks, u, u, "edit");
				return;
			}
		}
		!i && c.block === f.block && c.offset !== f.offset && /^https?:\/\/[^\s<>]+$/i.test(s.trim()) ? ye(o, "[", `](${s.trim().replace(/\(/g, "%28").replace(/\)/g, "%29")})`) : U(o, (i ? null : Fa(s)) ?? s.replace(/\r\n?/g, "\n"));
	}, it = (e) => {
		e.preventDefault();
		let n = nt(e.dataTransfer);
		if (!n.length || !t.onFiles || r || l || !a) return;
		let i = document.caretRangeFromPoint?.(e.clientX, e.clientY), o = i ? P(i.startContainer) : -1;
		if (i && o >= 0) {
			let e = {
				block: o,
				offset: Ja(A()[o], i.startContainer, i.startOffset)
			};
			A()[o].focus({ preventScroll: !0 }), L(e);
		}
		t.onFiles(n);
	};
	e.addEventListener("beforeinput", ge), e.addEventListener("input", _e), e.addEventListener("keydown", ke), e.addEventListener("copy", Ae), e.addEventListener("cut", Ae), e.addEventListener("click", je), e.addEventListener("pointerdown", tt), e.addEventListener("drop", it), e.addEventListener("paste", rt), e.addEventListener("aa-atom-change", Re), e.addEventListener("aa-atom-source", ze), e.addEventListener("aa-atom-leave", Be), e.addEventListener("aa-atom-prompt", et), e.addEventListener("compositionstart", Fe), e.addEventListener("compositionend", Ie), document.addEventListener("selectionchange", Le), He = xp(e, {
		blocks: () => n,
		elements: A,
		revert: Qe,
		shown: Xe
	}), re();
	let at = ns(e), ot = as(e, () => r || l), st = (t) => {
		for (let e of S) e.readOnly = t;
		if (t !== r) {
			r = t, te(), Te(), M(), K?.stop();
			for (let e of A()) e.contentEditable = t || e.dataset.kind === "table" ? "false" : "true", e.dataset.readonly = String(t), e.querySelectorAll("[data-cell], .aa-caption").forEach((e) => e.contentEditable = t ? "false" : "true");
			e.dispatchEvent(new Event("aa-change"));
		}
	}, ct = {
		element: e,
		exportMarkdown() {
			return ei(J(n));
		},
		get value() {
			return J(n);
		},
		set value(t) {
			if (J(n) === t) return;
			let r = e.contains(document.activeElement) ? I() : null, i = n, a = na(t), o = (e, t) => JSON.stringify(e) === JSON.stringify(t), s = 0;
			for (; s < i.length && s < a.length && o(i[s], a[s]);) s++;
			let c = 0;
			for (; c < i.length - s && c < a.length - s && o(i[i.length - 1 - c], a[a.length - 1 - c]);) c++;
			let l = [
				...i.slice(0, s),
				...a.slice(s, a.length - c),
				...i.slice(i.length - c)
			];
			Te(), N(l);
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
			r && (L(d, f), R({
				anchor: d,
				focus: f
			})), k.reset({
				blocks: n,
				anchor: d,
				focus: f
			}), Ue?.changed();
		},
		get readOnly() {
			return r;
		},
		set readOnly(e) {
			st(e);
		},
		get reordering() {
			return i;
		},
		set reordering(t) {
			if (i !== t) {
				i = t;
				for (let e of S) e.reordering = t;
				e.dispatchEvent(new Event("aa-movement-change"));
			}
		},
		get placing() {
			return a;
		},
		set placing(t) {
			if (a !== t) {
				a = t;
				for (let e of S) e.placing = t;
				e.dispatchEvent(new Event("aa-movement-change"));
			}
		},
		get placeholder() {
			return o;
		},
		set placeholder(e) {
			o = e, M(), te();
		},
		focus() {
			let e = n.length - 1;
			A()[e]?.focus({ preventScroll: !0 });
			let t = {
				block: e,
				offset: n[e].source.length
			};
			L(t), R({
				anchor: t,
				focus: t
			});
		},
		blur() {
			document.activeElement?.blur();
		},
		dismiss: Oe,
		selection() {
			let e = I();
			if (!e) return null;
			let [t, n] = oa(e.anchor, e.focus);
			return {
				start: z(t),
				end: z(n)
			};
		},
		replace(t, r, i) {
			if (l) return;
			let { blocks: a, caret: o } = Y(n, B(Math.min(t, r)), B(Math.max(t, r)), i);
			H(a, o, o, "edit"), e.contains(document.activeElement) || (A()[o.block]?.focus({ preventScroll: !0 }), L(o));
		},
		undo: le,
		redo: ue,
		activeBlock() {
			let e = I();
			if (!e) return null;
			let t = e.focus.block;
			return {
				index: t,
				block: n[t],
				start: z({
					block: t,
					offset: 0
				}),
				end: z({
					block: t,
					offset: n[t].source.length
				})
			};
		},
		selectBlocks: Ee,
		format(e) {
			if (r) return;
			let t = I();
			t && (e === "link" ? q(t) : e === "underline" ? ye(t, "<u>", "</u>") : ye(t, {
				bold: "**",
				italic: "*",
				strike: "~~",
				code: "`",
				link: "[",
				equation: "$",
				highlight: "=="
			}[e]));
		},
		color(e) {
			if (r) return;
			let t = I();
			if (!t) return;
			let i = ga(n, t.anchor, t.focus, e);
			i && H(i.blocks, i.anchor, i.focus, "edit");
		},
		turnInto(e) {
			if (r) return;
			let t = I();
			if (!t) return;
			let i = ya(n, u ?? va(n, t.anchor.block, t.focus.block), e);
			H(i.blocks, i.caret, i.caret, "edit");
		},
		blockAction(e) {
			if (r) return;
			let t = I();
			t && De(e, u ?? va(n, t.anchor.block, t.focus.block));
		},
		moveBlock(e, t, a = 1) {
			if (r || !i || a < 1 || e < 0 || t < 0 || e + a > n.length || t + a > n.length || e === t) return;
			let o = [...n], s = o.splice(e, a);
			o.splice(t, 0, ...s);
			let c = {
				block: t,
				offset: s[0].prefix
			};
			H(o, c, c, "edit"), A()[t].focus({ preventScroll: !0 }), Ee(t, t + a - 1);
		},
		indent(e) {
			if (r) return;
			let t = I();
			if (!t) return;
			let i = wa(n, u ?? va(n, t.anchor.block, t.focus.block), e);
			i && H(i.blocks, i.caret, i.caret, "edit");
		},
		toggle(e) {
			if (r) return;
			let t = I();
			if (!t) return;
			let i = Ta(n, t.focus.block, e) ?? _a(n, t.focus.block);
			i && H(i.blocks, i.caret, i.caret, "edit");
		},
		callout(e, t) {
			if (r) return;
			let i = t ?? I()?.focus.block ?? -1;
			if (i < 0 || i >= n.length) return;
			let a = Ea(n, i, e);
			if (!a) return;
			let o = I(), s = o && o.focus.block === i && o.focus.offset >= n[i].prefix, c = a.blocks[i].prefix - n[i].prefix, l = s ? {
				block: i,
				offset: o.focus.offset + c
			} : a.caret;
			H(a.blocks, l, l, "edit");
		},
		table(e) {
			if (r) return;
			let t = I();
			if (!t) return;
			let i = t.focus.block, a = n[i];
			if (a.kind !== "table") return;
			let o = ja(a.source), s = 0, c = 0;
			o.forEach((e, n) => e.forEach((e, r) => {
				t.focus.offset >= e.from && t.focus.offset <= e.to && (s = n, c = r);
			}));
			let l = Ia(a, e, s, c), u = Y(n, {
				block: i,
				offset: 0
			}, {
				block: i,
				offset: a.source.length
			}, l), d = {
				block: i,
				offset: ja(l)[Math.min(s, ja(l).length - 1)][Math.min(c, ja(l)[0].length - 1)].from
			};
			H(u.blocks, d, d, "edit");
		},
		insertFile(e) {
			!r && !l && t.onFiles?.([e]);
		},
		decorate(e, t = "external") {
			let n = Ne ?? Me();
			p.set(t, e.map((e) => ({ ...e }))), f = [...p.values()].flat(), c ? Ne = n : Pe(n);
		},
		stats() {
			let e = n.flatMap((e) => e.kind === "code" ? [] : [e.source.slice(e.prefix)]).join(" ").replace(/[*_~`#>|=$\[\]()]/g, " ");
			return {
				words: typeof Intl.Segmenter == "function" ? [...new Intl.Segmenter(void 0, { granularity: "word" }).segment(e)].filter((e) => e.isWordLike).length : e.match(/\S+/g)?.length ?? 0,
				characters: [...J(n)].length,
				blocks: n.length
			};
		},
		find(e, t = !1) {
			if (!e) return [];
			let r = t ? J(n) : J(n).toLocaleLowerCase(), i = t ? e : e.toLocaleLowerCase(), a = [];
			for (let t = r.indexOf(i); t >= 0; t = r.indexOf(i, t + i.length)) a.push({
				start: t,
				end: t + e.length
			});
			return a;
		},
		rangeOf(e, t) {
			let r = B(e), i = B(t), a = A();
			if (!a[r.block] || !a[i.block]) return null;
			let o = Ya(a[r.block], Math.min(r.offset, n[r.block].source.length)), s = Ya(a[i.block], Math.min(i.offset, n[i.block].source.length)), c = document.createRange();
			return c.setStart(o.node, o.offset), c.setEnd(s.node, s.offset), c;
		},
		selectRange(e, t = e) {
			let n = B(e), r = B(t);
			Te(), A()[n.block].focus(), L(n, r), R({
				anchor: n,
				focus: r
			});
		},
		transaction(r) {
			let i = J(n);
			g++;
			try {
				r();
			} finally {
				if (g--, !g && J(n) !== i) {
					let r = I() ?? {
						anchor: {
							block: 0,
							offset: 0
						},
						focus: {
							block: 0,
							offset: 0
						}
					};
					k.record(V(r.anchor, r.focus), "edit"), t.onChange?.(J(n)), e.dispatchEvent(new Event("aa-change"));
				}
			}
		},
		setHistoryProvider(e) {
			_ = e;
		},
		async askAbout(e) {
			let i = e.trim(), a = I();
			if (!i || !t.prompt || r || l || !a || aa(a.anchor, a.focus) === 0) return !1;
			let [o, s] = oa(a.anchor, a.focus), c = z(o), u = z(s), d = J(n), f = Mp(A().slice(o.block, s.block + 1));
			try {
				let e = await t.prompt(i, {
					kind: "writing",
					signal: new AbortController().signal,
					text: d.slice(c, u),
					before: d.slice(0, c),
					after: d.slice(u)
				});
				if (l || r || J(n) !== d) return !1;
				let a = (typeof e == "string" ? e : e.insert ?? "").trim();
				return a ? (ct.replace(c, u, a), ct.selectRange(c, c + a.length), !0) : !1;
			} finally {
				f();
			}
		},
		get comments() {
			return Ue ?? void 0;
		},
		get correcting() {
			return !!K?.enabled;
		},
		set correcting(e) {
			K && K.enabled !== e && (K.enabled = e, G(e));
		},
		destroy() {
			l = !0, K?.stop();
			for (let e of W) e();
			W.clear(), at(), ot(), m(), h(), e.removeEventListener("beforeinput", ge), e.removeEventListener("input", _e), e.removeEventListener("keydown", ke), e.removeEventListener("copy", Ae), e.removeEventListener("cut", Ae), e.removeEventListener("click", je), e.removeEventListener("pointerdown", tt), e.removeEventListener("drop", it), e.removeEventListener("paste", rt), e.removeEventListener("aa-atom-change", Re), e.removeEventListener("aa-atom-source", ze), e.removeEventListener("aa-atom-leave", Be), e.removeEventListener("aa-atom-prompt", et), Ve?.close(), He?.destroy(), Ue?.destroy(), e.removeEventListener("compositionstart", Fe), e.removeEventListener("compositionend", Ie), document.removeEventListener("selectionchange", Le), D(!0);
		}
	};
	return t.comments && (Ue = Rp(e, {
		store: t.comments,
		value: () => J(n),
		selection: () => ct.selection(),
		decorate: (e) => ct.decorate(e, "comments"),
		selectRange: (e, t) => ct.selectRange(e, t),
		readOnly: () => r,
		prompt: t.prompt
	})), m = $o(ct, {
		...t,
		atoms: y
	}), t.partials && t.menus !== !1 && (h = vp(ct)), ct;
}
//#endregion
//#region src/element.ts
var qp = class extends (typeof HTMLElement > "u" ? class {} : HTMLElement) {
	static observedAttributes = [
		"readonly",
		"placeholder",
		"correct"
	];
	#e = null;
	#t = null;
	#n = {};
	get options() {
		return this.#n;
	}
	set options(e) {
		this.#n = e;
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
		this.#e ||= Gp(this, {
			...this.options,
			value: this.#t ?? this.getAttribute("value") ?? "",
			readOnly: this.hasAttribute("readonly"),
			placeholder: this.getAttribute("placeholder") ?? "",
			toolbar: this.options.toolbar ?? this.hasAttribute("toolbar"),
			correcting: this.options.correcting !== !1 && this.getAttribute("correct") !== "off",
			onChange: (e) => {
				this.options.onChange?.(e), this.dispatchEvent(new Event("input", { bubbles: !0 }));
			}
		});
	}
	disconnectedCallback() {
		this.#t = this.#e?.value ?? this.#t, this.#e?.destroy(), this.#e = null;
	}
	attributeChangedCallback(e, t, n) {
		this.#e && (e === "readonly" && (this.#e.readOnly = n !== null), e === "placeholder" && (this.#e.placeholder = n ?? ""), e === "correct" && (this.#e.correcting = n !== "off"));
	}
	get value() {
		return this.#e ? this.#e.value : this.#t ?? this.getAttribute("value") ?? "";
	}
	set value(e) {
		this.#e ? this.#e.value = e : this.#t = e;
	}
	get readOnly() {
		return this.hasAttribute("readonly");
	}
	set readOnly(e) {
		this.toggleAttribute("readonly", e);
	}
	focus() {
		this.#e?.focus();
	}
	undo() {
		return this.#e?.undo() ?? !1;
	}
	redo() {
		return this.#e?.redo() ?? !1;
	}
	get editor() {
		return this.#e;
	}
};
function Jp(e = "aa-editor") {
	customElements.get(e) || customElements.define(e, qp);
}
//#endregion
//#region src/plain.ts
function Yp(e, t = {}) {
	let n = e.ownerDocument, r = n.createElement("div");
	r.className = "aa-block", r.contentEditable = t.readOnly ? "false" : "plaintext-only", r.spellcheck = !1, r.textContent = t.value ?? e.textContent ?? "", e.classList.add("aa", "aa-plain"), e.setAttribute("role", "textbox"), e.setAttribute("aria-multiline", "true"), e.replaceChildren(r);
	let i = !!t.speak && kp(), a = t.placeholder ? `${t.placeholder.charAt(0).toLowerCase()}${t.placeholder.slice(1)}` : "write", o = i ? `Press space to speak, or ${a}` : t.placeholder ?? "";
	t.placeholder && e.setAttribute("aria-label", t.placeholder);
	let s = () => r.innerText, c = () => e.toggleAttribute("data-empty", !s().trim()), l = (e) => {
		e ? r.dataset.placeholder = e : delete r.dataset.placeholder;
	};
	l(o), c();
	let u = null, d = () => {
		let i = s().trim(), a = Object.assign(n.createElement("span"), {
			className: "aa-prompt-caret",
			contentEditable: "false"
		});
		a.setAttribute("aria-hidden", "true");
		let d = null;
		u = Ap({
			lang: n.documentElement.lang || navigator.language,
			heard: (e) => {
				let n = `${i}${i && e ? " " : ""}${e}`;
				a.toggleAttribute("data-after", !!n), r.replaceChildren(n, a), c(), t.onChange?.(n);
			},
			audio: () => {
				d?.followVoice?.();
			},
			end: (t) => {
				u = null, d?.stop(), a.remove(), delete e.dataset.listening, l(t ?? o), c();
				let i = n.getSelection();
				n.activeElement === r && i && (i.selectAllChildren(r), i.collapseToEnd());
			}
		}), u && (e.dataset.listening = "", l("Listening…"), r.append(a), d = Op(a, n.defaultView));
	}, f = (e) => {
		if (!e.isComposing) {
			if (u) {
				if (e.key === "Escape") {
					e.preventDefault(), e.stopPropagation(), u.abort();
					return;
				}
				u.stop();
			} else e.key === " " && i && !s().trim() && !e.metaKey && !e.ctrlKey && !e.altKey && r.isContentEditable && (e.preventDefault(), d());
		}
	}, p = () => {
		c(), t.onChange?.(s());
	}, m = () => u?.stop(), h = () => r.focus({ preventScroll: !0 }), g = (t) => {
		t.target === e && h();
	};
	r.addEventListener("input", p), r.addEventListener("keydown", f), r.addEventListener("blur", m), e.addEventListener("click", g);
	let _ = ns(e);
	return {
		element: e,
		get value() {
			return s();
		},
		set value(e) {
			s() !== e && (r.textContent = e, c());
		},
		get readOnly() {
			return r.contentEditable === "false";
		},
		set readOnly(e) {
			let t = e ? "false" : "plaintext-only";
			r.contentEditable !== t && (r.contentEditable = t);
		},
		get listening() {
			return !!u;
		},
		focus: h,
		destroy() {
			u?.abort(), _(), r.removeEventListener("input", p), r.removeEventListener("keydown", f), r.removeEventListener("blur", m), e.removeEventListener("click", g);
		}
	};
}
//#endregion
//#region src/comments-memory.ts
function Xp(e = {}) {
	let t = e.now ?? (() => Date.now()), n = [...e.threads ?? []], r = /* @__PURE__ */ new Set(), i = 0, a = (e) => `${e}${(++i).toString(36)}${t().toString(36).slice(-3)}`, o = e.me, s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = (e) => {
		let t = c.get(e.id) ?? [];
		if (!t.length && !e.reactions?.length) return e;
		let n = /* @__PURE__ */ new Map();
		for (let t of e.reactions ?? []) n.set(t.emoji, {
			...t,
			names: [...t.names]
		});
		for (let { emoji: e, person: r } of t) {
			let t = n.get(e) ?? {
				emoji: e,
				count: 0,
				reacted: !1,
				names: []
			};
			t.count++, o && r.id === o.id ? t.reacted = !0 : t.names.push(r.name), n.set(e, t);
		}
		return {
			...e,
			reactions: [...n.values()]
		};
	}, u = () => n.map((e) => ({
		...e,
		comments: e.comments.map(l),
		canDelete: !!o && e.comments[0]?.author.id === o.id,
		unread: !!o && e.comments.some((t) => t.author.id !== o.id && t.createdAt > (s.get(e.id) ?? 0))
	})), d = () => {
		let e = u();
		for (let t of r) t(e);
	}, f = () => new Promise((t) => setTimeout(t, e.delay ?? 0)), p = () => {
		if (!o) throw Error("Sign in to comment");
		return o;
	}, m = (e) => {
		let t = n.find((t) => t.id === e);
		if (!t) throw Error("This thread is gone");
		return t;
	}, h = (e) => {
		n = n.map((t) => t.id === e.id ? e : t);
	};
	return {
		me: o,
		panel: e.panel,
		get threads() {
			return n;
		},
		put(e) {
			n.some((t) => t.id === e.id) ? h(e) : n = [...n, e], d();
		},
		subscribe(e) {
			return r.add(e), e(u()), () => {
				r.delete(e);
			};
		},
		async add(e, r, i) {
			let o = p();
			if (await f(), !r.trim()) throw Error("Write a comment first");
			let c = t(), l = {
				id: a("c"),
				author: o,
				body: r,
				createdAt: c,
				mentions: [...i]
			}, u = {
				id: a("t"),
				...e,
				comments: [l],
				createdAt: c,
				updatedAt: c
			};
			return n = [...n, u], s.set(u.id, c), d(), u.id;
		},
		async reply(e, n, r) {
			let i = p();
			if (await f(), !n.trim()) throw Error("Write a comment first");
			let o = m(e);
			if (o.resolvedAt) throw Error("Reopen this thread before replying");
			let c = t();
			h({
				...o,
				comments: [...o.comments, {
					id: a("c"),
					author: i,
					body: n,
					createdAt: c,
					mentions: [...r]
				}],
				updatedAt: c
			}), s.set(e, c), d();
		},
		async edit(e, r) {
			let i = p();
			await f();
			let a = n.find((t) => t.comments.some((t) => t.id === e));
			if (!a) throw Error("This comment is gone");
			if (!a.comments.find((t) => t.id === e && t.author.id === i.id)) throw Error("Only your own comments can be edited");
			h({
				...a,
				comments: a.comments.map((n) => n.id === e ? {
					...n,
					body: r,
					editedAt: t()
				} : n),
				updatedAt: t()
			}), d();
		},
		async resolve(e, n) {
			let r = p();
			await f();
			let i = m(e);
			h(n ? {
				...i,
				resolvedAt: t(),
				resolvedBy: r,
				updatedAt: t()
			} : {
				...i,
				resolvedAt: void 0,
				resolvedBy: void 0,
				updatedAt: t()
			}), d();
		},
		async remove(e) {
			let t = p();
			if (await f(), m(e).comments[0]?.author.id !== t.id) throw Error("Only the person who started a thread can delete it");
			n = n.filter((t) => t.id !== e), d();
		},
		async move(e) {
			await f();
			for (let t of e) {
				let e = n.find((e) => e.id === t.id);
				e && h({
					...e,
					from: t.from,
					to: t.to,
					quote: t.quote
				});
			}
			d();
		},
		async seen(e) {
			s.set(e, t()), d();
		},
		async react(e, t) {
			let r = p();
			if (await f(), !wr.includes(t)) throw Error("Not one of the reactions");
			if (!n.some((t) => t.comments.some((t) => t.id === e))) throw Error("This comment is gone");
			let i = c.get(e) ?? [], a = i.findIndex((e) => e.emoji === t && e.person.id === r.id);
			c.set(e, a >= 0 ? i.filter((e, t) => t !== a) : [...i, {
				emoji: t,
				person: r
			}]), d();
		},
		people(t) {
			let n = t.trim().toLocaleLowerCase();
			return (e.people ?? []).filter((e) => !n || e.name.toLocaleLowerCase().includes(n));
		}
	};
}
//#endregion
export { qp as AaEditorElement, Go as AaToolbarElement, hp as BUTTON_PARTIAL, dp as BUTTON_STATES, li as CALLOUT_COLORS, Vi as DEFAULT_ATOMS, Bi as EQUATION, Da as History, Li as IMAGE, Cp as PROMPT_HERE, wr as REACTION_EMOJIS, Hi as TEXT_COLORS, kr as anchorThreads, Dr as applyEdit, za as atomElement, Ii as atomPattern, ta as blockRuns, pi as calloutIsBox, ni as changeCommentSource, Pr as commentsLabel, Nr as countThreads, Rp as createCommentsView, Gp as createEditor, Yp as createPlainEditor, Jp as defineAaEditor, Ko as defineAaToolbar, ba as deleteBlocks, xa as duplicateBlocks, Ia as editTable, ei as exportMarkdown, na as fromMarkdown, Fa as fromTSV, Mp as glisten, Up as imageAtom, wa as indentBlocks, zr as initialOf, fa as joinWithNext, da as joinWithPrevious, ua as liftPrefix, Er as mapRange, Xp as memoryCommentStore, Ir as mentionQuery, Fr as mentionsIn, Sa as moveBlocks, Ar as movedThreads, Mi as parseBlocks, Vr as personColour, pp as readButtonPartial, di as readCallout, vi as readColumns, Xr as readCommentSource, Ri as readPicture, Di as readTabs, Lr as relativeTime, Or as relocate, Ca as renumber, Y as replaceRange, va as select, Ni as serialize, Ea as setCallout, Hp as sizePicture, sa as sliceMarkdown, jr as sortThreads, la as splitAt, Ma as tableAlignments, ja as tableRows, Tr as textChange, Mr as threadsAt, J as toMarkdown, _a as toggleBox, Ta as toggleCallout, ya as turnInto, pa as wrapSelection, mp as writeButtonPartial, fi as writeCallout, yi as writeColumns, $r as writeCommentSource, zi as writePicture, Pa as writeTable, Oi as writeTabs };

