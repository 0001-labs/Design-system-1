import { DIAGRAM_BOX_WIDTH as e, DIAGRAM_COLORS as t, DIAGRAM_MAX_WIDTH as n, DIAGRAM_POST_IT_SIZE as r, diagramBoxWidth as i, diagramFenceWrapped as a, diagramWraps as o, layoutDiagram as s } from "./diagram-language.js";
export * from "./diagram-language.js";
//#region src/diagram-edit.ts
var c = /[ \t]+@[ \t]*(\d{1,3})(?:[ \t]*,[ \t]*|[ \t]+)(\d{1,3})(?=[ \t]|$)/, l = /[ \t]+[wh](\d{1,2})(?=[ \t]|$)/gi;
RegExp(`[ \\t]+(${t.join("|")})(?=[ \\t]|$)`, "i");
var u = RegExp(`^(.*\\S)[ \\t]+(${t.join("|")})$`, "i"), d = /[ \t]+(<->|->|<-|--)[ \t]+/, f = /[ \t]+(?:<->|->|<-|--)[ \t]+/, p = /^(\s*(?:[-*+][ \t]+)?)(.*)$/, m = (e) => e.trim().toLowerCase(), h = (e) => e.replace(/\r\n?/g, "\n").split("\n");
function g(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.groups) {
		n.name && t.add(m(n.name));
		for (let e of n.boxes) t.add(m(e.text));
	}
	return t;
}
function _(e, t) {
	let n = g(e);
	if (!n.has(m(t))) return t;
	for (let e = 2;; e++) if (!n.has(m(`${t} ${e}`))) return `${t} ${e}`;
}
function v(e, t) {
	if ("join" in t) return;
	let n = e.groups[t.group];
	if (!n) return;
	if (t.box === void 0 || n.kind === "box") return n.name ?? n.boxes[0]?.text;
	let r = n.boxes[t.box];
	if (r) return e.groups.flatMap((e) => [e.name, ...e.boxes.map((e) => e.text)]).filter((e) => e !== void 0 && m(e) === m(r.text)).length > 1 && n.name ? `${n.name}.${r.text}` : r.text;
}
function y(e) {
	return !/^\s/.test(e) && !/^[-*+][ \t]/.test(e) && !e.trim().startsWith("//") && f.test(e.trim());
}
function b(e) {
	let t = e.trim().split(d), n = [];
	for (let e = 0; e + 2 < t.length; e += 2) n.push({
		from: t[e].trim(),
		op: t[e + 1],
		to: t[e + 2].trim()
	});
	return n;
}
function x(e) {
	let t = [], n = "", r;
	for (let i of e) n && r !== void 0 && m(r) === m(i.from) ? n += ` ${i.op} ${i.to}` : (n && t.push(n), n = `${i.from} ${i.op} ${i.to}`), r = i.to;
	return n && t.push(n), t;
}
function S(e, t) {
	let n = m(e);
	if (t.has(n)) return !0;
	let r = n.indexOf(".");
	return r > 0 && (t.has(n.slice(0, r)) || t.has(n));
}
function C(e, t) {
	return e.flatMap((e) => {
		if (!y(e)) return [e];
		let n = b(e), r = n.filter((e) => !S(e.from, t) && !S(e.to, t));
		return r.length === n.length ? [e] : x(r);
	});
}
function w(t, n, i) {
	if (n.kind === "month" || n.kind === "grid" || n.kind === "chart") {
		if (i.x === void 0 || i.y === void 0) return t;
		let e = ` @ ${i.x} ${i.y}`;
		return c.test(` ${t}`) ? ` ${t}`.replace(c, e).slice(1) : `${t.trimEnd()}${e}`;
	}
	let a = n.kind === "post-it" ? r : e, o = i.w === void 0 ? (t.match(l) ?? []).join("") : i.w === a ? "" : ` w${i.w}`, s = i.name ?? (n.kind === "box" ? n.boxes[0]?.text : n.name) ?? "", u = n.kind === "box" ? `[${s}]` : n.kind === "post-it" ? `{${s}}` : s, d = i.x ?? n.x, f = i.y ?? n.y, p = i.x !== void 0 || n.placed, m = i.color === null ? void 0 : i.color ?? n.color;
	return `${u}${p ? ` @ ${d} ${f}` : ""}${o}${m ? ` ${m}` : ""}`.trim();
}
function T(e, t) {
	let [, n = "", r = ""] = p.exec(e) ?? [], i = u.exec(r.trim()), a = t.name ?? (i ? i[1] : r.trim()), o = t.color === null ? void 0 : t.color ?? (i ? i[2].toLowerCase() : void 0);
	return `${n}${a}${o ? ` ${o}` : ""}`;
}
function E(e, t, n, r, i) {
	let a = t.groups[n];
	if (!a) return e;
	let o = h(e);
	return o[a.line - 1] = w(o[a.line - 1], a, {
		x: Math.max(0, Math.round(r)),
		y: Math.max(0, Math.round(i))
	}), o.join("\n");
}
function D(t, r, a, o) {
	let s = r.groups[a];
	if (!s || s.kind !== "box" && s.kind !== "stack" && s.kind !== "post-it") return t;
	let c = s.kind === "post-it" ? Math.max(e, Math.min(n, Math.round(o / e) * e)) : i(Math.round(o / e) * e);
	if (c === s.w) return t;
	let l = h(t);
	return l[s.line - 1] = w(l[s.line - 1], s, { w: c }), l.join("\n");
}
function O(e, t, n, r, i, a) {
	let o = e.trim() ? h(e) : [], s = n === "post-it" ? `{${r}} @ ${i} ${a} w8` : `[${r}] @ ${i} ${a}`, c = Math.max(0, ...t.groups.map((e) => e.end)) || (o.length && /^#{1,4}[ \t]/.test(o[0].trim()) ? 1 : 0);
	return o.splice(c, 0, s), o.join("\n");
}
function k(e, t, n, r = "->") {
	let i = e.replace(/\s+$/, "");
	return `${i}${i ? "\n" : ""}${t} ${r} ${n}`;
}
function A(e, t, n, r) {
	if (!("join" in n)) return e;
	let i = t.joins[n.join];
	if (!i) return e;
	let a = h(e), o = b(a[i.line - 1]), s = o.findIndex((e) => m(e.from) === m(i.from) && m(e.to) === m(i.to) || m(e.from) === m(i.to) && m(e.to) === m(i.from));
	return s < 0 || r === "--" == (o[s].op === "--") ? e : (o[s] = {
		...o[s],
		op: r
	}, a.splice(i.line - 1, 1, ...x(o)), a.join("\n"));
}
function j(e, t, n, r) {
	if ("join" in n) return e;
	let i = t.groups[n.group], a = r.replace(/[\n\r]+/g, " ").replace(/[[\]{}]/g, "").trim();
	if (!i || !a || i.kind === "month" || i.kind === "grid" || i.kind === "chart") return e;
	let o = h(e), s;
	if (n.box !== void 0 && i.kind === "stack") {
		let t = i.boxes[n.box];
		if (!t) return e;
		s = t.text, o[t.line - 1] = T(o[t.line - 1], { name: a });
	} else s = i.kind === "box" ? i.boxes[0]?.text : i.name, o[i.line - 1] = w(o[i.line - 1], i, { name: a });
	if (s === void 0 || m(s) === m(a)) return o.join("\n");
	let c = m(s), l = (e) => {
		if (m(e) === c) return a;
		let t = e.indexOf(".");
		return t > 0 && m(e.slice(0, t)) === c ? `${a}${e.slice(t)}` : t > 0 && m(e.slice(t + 1)) === c ? `${e.slice(0, t + 1)}${a}` : e;
	};
	return o = o.map((e) => y(e) ? x(b(e).map((e) => ({
		...e,
		from: l(e.from),
		to: l(e.to)
	}))).join("\n") : e), o.join("\n");
}
function M(e, t, n, r) {
	if ("join" in n) return e;
	let i = t.groups[n.group];
	if (!i || i.kind === "month" || i.kind === "grid" || i.kind === "chart") return e;
	let a = h(e);
	if (n.box !== void 0 && i.kind === "stack") {
		let t = i.boxes[n.box];
		if (!t) return e;
		a[t.line - 1] = T(a[t.line - 1], { color: r });
	} else {
		if (i.kind === "stack") for (let e of i.boxes) e.color && (a[e.line - 1] = T(a[e.line - 1], { color: null }));
		a[i.line - 1] = w(a[i.line - 1], i, { color: r });
	}
	return a.join("\n");
}
function N(e, t, n) {
	let r = h(e);
	if ("join" in n) {
		let i = t.joins[n.join];
		if (!i) return e;
		let a = r[i.line - 1], o = b(a), s = o.findIndex((e) => m(e.from) === m(i.from) && m(e.to) === m(i.to) || m(e.from) === m(i.to) && m(e.to) === m(i.from));
		return s < 0 ? e : (r.splice(i.line - 1, 1, ...x(o.filter((e, t) => t !== s))), r.join("\n"));
	}
	let i = t.groups[n.group];
	if (!i) return e;
	let a = /* @__PURE__ */ new Set();
	if (n.box !== void 0 && i.kind === "stack") {
		let t = i.boxes[n.box];
		if (!t) return e;
		a.add(m(t.text)), i.name && a.add(m(`${i.name}.${t.text}`)), r[t.line - 1] = "\0";
	} else {
		i.name && a.add(m(i.name));
		for (let e of i.boxes) a.add(m(e.text));
		for (let e = i.line; e <= i.end; e++) r[e - 1] = "\0";
	}
	for (let [e, r] of t.groups.entries()) if (e !== n.group) {
		r.name && a.delete(m(r.name));
		for (let e of r.boxes) a.delete(m(e.text));
	}
	return r = C(r.filter((e) => e !== "\0"), a), r.join("\n");
}
//#endregion
//#region src/icons/note.svg?raw
var ee = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.9653 3.31348V12.6865H2.03467V3.31348H13.9653ZM3.03467 11.6865H12.9653V4.31348H3.03467V11.6865Z\" fill=\"#1E1E1E\"/>\n<path d=\"M8.00641 7.08004V7.99996H3.71344V7.08004H8.00641ZM9.9527 5.08004V5.99996H3.71344V5.08004H9.9527Z\" fill=\"#1E1E1E\"/>\n</svg>\n", te = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\">\n<g id=\"Icons\">\n<g id=\"Delete\">\n<g id=\"Vector\">\n<path d=\"M7.0972 3.47745L13.9422 3.48149L13.9424 12.7615L7.09744 12.7655L2.31717 8.121L7.0972 3.47745ZM3.75174 8.12003L7.43924 11.7021H12.9422V4.51944H7.45877L3.75174 8.12003Z\" fill=\"currentColor\" />\n<path d=\"M8.16022 10.2823L7.45988 9.58199L8.92933 8.11177L7.45877 6.64608L8.16207 5.94278L9.63109 7.41184L11.1002 5.94278L11.8005 6.64312L10.3309 8.11372L11.8009 9.58047L11.0982 10.2827L9.62915 8.81366L8.16022 10.2823Z\" fill=\"currentColor\" />\n</g>\n</g>\n</g>\n</svg>\n", ne = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.7982 7.99673L7.65899 12.1359L6.94737 11.4243L9.87875 8.50597L3.88054 8.51223L3.88054 7.49375L9.87875 7.48749L6.9539 4.56264L7.66552 3.86407L11.7982 7.99673Z\" fill=\"black\"/>\n<path d=\"M3.37131 7.99987C3.37131 8.81187 2.71305 9.47013 1.90105 9.47013C1.08904 9.47013 0.430786 8.81187 0.430786 7.99987C0.430786 7.18787 1.08904 6.52961 1.90105 6.52961C2.71305 6.52961 3.37131 7.18787 3.37131 7.99987Z\" fill=\"black\"/>\n<path d=\"M15.5692 7.99987C15.5692 8.81187 14.911 9.47013 14.099 9.47013C13.2869 9.47013 12.6287 8.81187 12.6287 7.99987C12.6287 7.18787 13.2869 6.52961 14.099 6.52961C14.911 6.52961 15.5692 7.18787 15.5692 7.99987Z\" fill=\"black\"/>\n</svg>\n", re = { da: {
	"Add a caption": "Tilføj billedtekst",
	"Add a comment": "Tilføj en kommentar",
	"Add headings to show them here.": "Tilføj overskrifter for at vise dem her.",
	"Add reaction": "Tilføj reaktion",
	"Add tab": "Tilføj fane",
	"Added {name}": "Tilføjede {name}",
	Apply: "Anvend",
	"Arrow (A)": "Pil (A)",
	"Ask AI": "Spørg AI",
	"Ask AI about the selected words": "Spørg AI om de markerede ord",
	"Ask AI about these words": "Spørg AI om disse ord",
	"Ask AI or press space to speak": "Spørg AI, eller tryk mellemrum for at tale",
	"Ask AI to write": "Bed AI om at skrive",
	"Asking AI is not set up here": "AI er ikke sat op her",
	"Block commands": "Blokkommandoer",
	Blocks: "Blokke",
	Blue: "Blå",
	"Blue fill": "Blå baggrund",
	Bold: "Fed",
	Brown: "Brun",
	"Brown fill": "Brun baggrund",
	"Bulleted list": "Punktliste",
	Button: "Knap",
	"Button label": "Knaptekst",
	"Button state": "Knaptilstand",
	"Button: {label}, {state}": "Knap: {label}, {state}",
	Callout: "Fremhævet boks",
	"Callout icon": "Ikon til boksen",
	Cancel: "Annullér",
	chart: "diagram",
	Close: "Luk",
	"Close find": "Luk søgning",
	Code: "Kode",
	Colour: "Farve",
	Columns: "Kolonner",
	Comment: "Kommentér",
	Comments: "Kommentarer",
	Default: "Standard",
	Delete: "Slet",
	"Delete thread": "Slet tråd",
	"Delete?": "Slet?",
	"Deleted {name}": "Slettede {name}",
	Diagram: "Diagram",
	Divider: "Skillelinje",
	Drawn: "Tegnet",
	Duplicate: "Duplikér",
	Edit: "Redigér",
	"Edit button": "Redigér knap",
	"Edit button: {label}, {state}": "Redigér knap: {label}, {state}",
	"Edit comment": "Redigér kommentar",
	"Edit link": "Redigér link",
	Edited: "Redigeret",
	Editing: "Redigerer",
	Equation: "Ligning",
	Find: "Find",
	"Fit the width": "Tilpas bredden",
	"Fits the width": "Tilpasser bredden",
	Green: "Grøn",
	"Green fill": "Grøn baggrund",
	Grey: "Grå",
	"Grey fill": "Grå baggrund",
	grid: "gitter",
	group: "gruppe",
	Heading: "Overskrift",
	"Heading 1": "Overskrift 1",
	"Heading 2": "Overskrift 2",
	"Heading 3": "Overskrift 3",
	"Icon {emoji}": "Ikon {emoji}",
	"Image or file": "Billede eller fil",
	Indent: "Ryk ind",
	"Insert block": "Indsæt blok",
	Italic: "Kursiv",
	Item: "Punkt",
	item: "punkt",
	"Item (I)": "Punkt (I)",
	"Joined {name} to {end}": "Forbandt {name} med {end}",
	"Joining {name}. Tab to the one to join it to, then Enter. Escape stops.": "Forbinder {name}. Tab til det, den skal forbindes med, og tryk Enter. Escape stopper.",
	"Keeps its layout": "Beholder sit layout",
	Label: "Tekst",
	"Line (L)": "Linje (L)",
	Link: "Link",
	"Link URL": "Linkadresse",
	"Listening…": "Lytter…",
	"Made a line": "Lavede en linje",
	"Made an arrow": "Lavede en pil",
	month: "måned",
	More: "Mere",
	"Move down": "Flyt ned",
	"Move up": "Flyt op",
	"Moved {name}": "Flyttede {name}",
	Name: "Navn",
	"Named {name}": "Navngav {name}",
	"Next comment": "Næste kommentar",
	"Next match": "Næste resultat",
	"No colour": "Ingen farve",
	"No comments yet.": "Ingen kommentarer endnu.",
	"No icon": "Intet ikon",
	"No matching commands": "Ingen kommandoer passer",
	"No microphone was found": "Der blev ikke fundet en mikrofon",
	"Nobody to mention": "Ingen at nævne",
	"Not answered": "Intet svar",
	"Not joined": "Ikke forbundet",
	"Not saved": "Ikke gemt",
	Note: "Note",
	note: "note",
	"Note (N)": "Note (N)",
	"Nothing here": "Intet her",
	"Nothing resolved yet.": "Intet er løst endnu.",
	"Nothing was heard: press Space twice to try again": "Intet blev hørt: tryk mellemrum to gange for at prøve igen",
	"Numbered list": "Nummereret liste",
	Open: "Åbne",
	Orange: "Orange",
	"Orange fill": "Orange baggrund",
	Outdent: "Ryk ud",
	"People to mention": "Personer at nævne",
	"Picture width": "Billedbredde",
	Pink: "Lyserød",
	"Pink fill": "Lyserød baggrund",
	"Press space for AI": "Tryk mellemrum for AI",
	"Press space for AI or / for commands": "Tryk mellemrum for AI eller / for kommandoer",
	"Press space for AI, or {action}": "Tryk mellemrum for AI, eller {action}",
	"Press space to speak, or {action}": "Tryk mellemrum for at tale, eller {action}",
	"Previous comment": "Forrige kommentar",
	"Previous match": "Forrige resultat",
	Purple: "Lilla",
	"Purple fill": "Lilla baggrund",
	Quote: "Citat",
	"React with {emoji}": "Reagér med {emoji}",
	Red: "Rød",
	"Red fill": "Rød baggrund",
	Reopen: "Genåbn",
	Replace: "Erstat",
	"Replace all": "Erstat alle",
	Reply: "Svar",
	Resolve: "Løs",
	Resolved: "Løste",
	"Resolved by {name}.": "Løst af {name}.",
	"Resolved.": "Løst.",
	Revert: "Fortryd",
	"Revert what AI changed here": "Fortryd det, AI ændrede her",
	"Revert what AI wrote here": "Fortryd det, AI skrev her",
	"Select words and press Comment to start a thread.": "Markér ord, og tryk Kommentér for at starte en tråd.",
	"Sized {name}": "Ændrede størrelsen på {name}",
	"Speaking could not start here": "Tale kunne ikke starte her",
	"Speaking is not available in this browser": "Tale virker ikke i denne browser",
	"Speaking is turned off in this browser": "Tale er slået fra i denne browser",
	"Speaking needs a connection": "Tale kræver forbindelse",
	State: "Tilstand",
	Strikethrough: "Gennemstreget",
	"Tab chooses each item and line. Arrows move what is chosen, Alt and arrows size it, Enter or a click writes in it, L or A joins it to another, I adds an item, N a note, Delete takes it away.": "Tab vælger hvert punkt og hver linje. Pile flytter det valgte, Alt og pile ændrer størrelsen, Enter eller et klik skriver i det, L eller A forbinder det med et andet, I tilføjer et punkt, N en note, Delete fjerner det.",
	"Tab name": "Fanenavn",
	"Tab {number}": "Fane {number}",
	Table: "Tabel",
	"Table of contents": "Indholdsfortegnelse",
	Tabs: "Faner",
	Text: "Tekst",
	"Text colour": "Tekstfarve",
	"Text formatting": "Tekstformatering",
	"The microphone is blocked: allow it for this site in Safari › Settings › Websites › Microphone": "Mikrofonen er blokeret: tillad den for siden i Safari › Indstillinger › Websteder › Mikrofon",
	"The microphone is blocked: allow it for this site in the browser’s settings": "Mikrofonen er blokeret: tillad den for siden i browserens indstillinger",
	"Thinking…": "Tænker…",
	"To-do": "To do",
	Toggle: "Fold ud",
	"Toggle heading 1": "Fold ud-overskrift 1",
	"Toggle heading 2": "Fold ud-overskrift 2",
	"Toggle heading 3": "Fold ud-overskrift 3",
	"Turn into": "Lav om til",
	"Turn on Dictation in System Settings › Keyboard to speak here": "Slå Diktering til i Systemindstillinger › Tastatur for at tale her",
	"Type / for commands": "Skriv / for kommandoer",
	Underline: "Understreget",
	Unnamed: "Unavngivet",
	White: "Hvid",
	"White fill": "Hvid baggrund",
	write: "skriv",
	Yellow: "Gul",
	"Yellow fill": "Gul baggrund",
	"{count} comment": "{count} kommentar",
	"{count} comments": "{count} kommentarer",
	"{count} matches": "{count} resultater",
	"{count} resolved": "{count} løst",
	"{number} of {count}": "{number} af {count}",
	"{words} words, {characters} characters": "{words} ord, {characters} tegn"
} }, ie = Symbol.for("design-system-1.translate"), P = null;
function ae() {
	return (typeof document > "u" ? "" : document.documentElement.lang || "").trim().toLowerCase() || "en";
}
function F(e, t) {
	let n = ae(), r = typeof P == "function" ? P(e, n) : P?.[e];
	if (r === void 0) {
		let t = globalThis[ie];
		if (typeof t == "function") {
			let n = String(t(e));
			n !== e && (r = n);
		}
	}
	r === void 0 && (r = re[n]?.[e] ?? re[n.split("-")[0]]?.[e]);
	let i = r ?? e;
	return t ? i.replace(/\{(\w+)\}/g, (e, n) => n in t ? String(t[n]) : e) : i;
}
//#endregion
//#region src/shimmer.ts
function oe(e) {
	let t = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(e);
	if (t) return (.2126 * t[1] + .7152 * t[2] + .0722 * t[3]) / 255;
	let n = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(e);
	if (n) return .2126 * n[1] + .7152 * n[2] + .0722 * n[3];
	let r = /^ok(?:lch|lab)\(\s*([\d.]+)(%?)/.exec(e);
	if (r) return r[2] ? r[1] / 100 : +r[1];
	let i = /^(?:lch|lab)\(\s*([\d.]+)/.exec(e);
	return i ? i[1] / 100 : null;
}
//#endregion
//#region src/prompt.ts
var I = typeof navigator < "u" && /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
function se(e) {
	return e === "not-allowed" ? F(I ? "The microphone is blocked: allow it for this site in Safari › Settings › Websites › Microphone" : "The microphone is blocked: allow it for this site in the browser’s settings") : e === "service-not-allowed" ? F(I ? "Turn on Dictation in System Settings › Keyboard to speak here" : "Speaking is turned off in this browser") : e === "audio-capture" ? F("No microphone was found") : e === "network" ? F("Speaking needs a connection") : e === "no-speech" ? F("Nothing was heard: press Space twice to try again") : null;
}
function ce() {
	let e = globalThis, t = e.SpeechRecognition ?? e.webkitSpeechRecognition;
	return t ? new t() : null;
}
function le(e, t, n) {
	return e ? .85 : Math.min(1, .55 + .3 * t + .3 * n);
}
function ue(e, t) {
	if (t.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return {
		followVoice: null,
		stop: () => {}
	};
	let n = 0, r = !1, i = 0, a = le(!1, 0, 0), o = null, s, c, l = /* @__PURE__ */ new Float32Array(512), u = performance.now(), d = -Infinity, f = !1, p = null, m = (t) => {
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
		a += (le(c, h, i) - a) * .12, e.style.opacity = a.toFixed(3), n = requestAnimationFrame(m);
	};
	return n = requestAnimationFrame(m), {
		followVoice: async () => {
			if (!I && navigator.mediaDevices?.getUserMedia && typeof AudioContext < "u") try {
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
function de(e) {
	let t = e.type.ownerDocument, n = t.defaultView, r = t.createElement("div");
	r.className = "aa-prompt", r.setAttribute("role", "textbox"), r.setAttribute("aria-label", F("Ask AI")), r.dataset.placeholder = e.placeholder ?? F("Ask AI or press space to speak"), r.spellcheck = !1;
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
	let a = oe(i.color);
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
		let e = ue(g, n);
		return _ = {
			frame: 0,
			stop: e.stop
		}, e.followVoice;
	}, S = () => (r.textContent ?? "").replace(/\s+/g, " ").trim(), C = (t = !1) => {
		d || (d = !0, f?.abort(), m?.abort(), b(), p(), s?.disconnect(), r.remove(), e.grow?.(0), n.removeEventListener("scroll", u, !0), n.removeEventListener("resize", u), e.close(t));
	}, w = () => {
		let i = ce();
		if (!i) {
			r.dataset.placeholder = F("Speaking is not available in this browser");
			return;
		}
		m = i, r.dataset.listening = "", g = Object.assign(t.createElement("span"), {
			className: "aa-prompt-caret",
			contentEditable: "false"
		}), g.setAttribute("aria-hidden", "true"), r.append(g), y(), v(), r.dataset.placeholder = F("Listening…"), i.lang = t.documentElement.lang || navigator.language, i.continuous = !0, i.interimResults = !0;
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
			m = null, b(), delete r.dataset.listening, r.dataset.placeholder = a ?? e.placeholder ?? F("Ask AI to write");
		}, i.onerror = (e) => {
			a = se(e.error) ?? a, i.onend?.();
		};
		try {
			i.start();
		} catch {
			a = F("Speaking could not start here"), i.onend?.();
			return;
		}
		let o = x();
		o && (i.onaudiostart = () => {
			o();
		});
	}, T = async () => {
		let t = S();
		if (t && !f) {
			m?.stop(), f = new AbortController(), r.contentEditable = "false", r.dataset.loading = "", r.setAttribute("aria-busy", "true"), p = fe([r, ...e.about()]);
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
function fe(e, t) {
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
//#region src/vendor/drag/util.ts
function pe(e) {
	let t = !1, n;
	return ((...r) => (t || (t = !0, n = e(...r)), n));
}
//#endregion
//#region src/vendor/drag/grid.ts
var L = {
	dragDistance: 5,
	touchHold: 250,
	autoScrollEdge: 40,
	step: 4
}, me = 20, he = "data-0001-drag-grid-style", ge = ":root[data-drag-grid],:root[data-drag-grid] *{-webkit-user-select:none!important;user-select:none!important}";
function _e(e = {}) {
	let t = {
		dragDistance: e.dragDistance ?? L.dragDistance,
		touchHold: e.touchHold ?? L.touchHold,
		autoScrollEdge: e.autoScrollEdge ?? L.autoScrollEdge,
		step: e.step ?? L.step
	}, n = e.pointerPoint ?? ((e) => ({
		x: e.clientX,
		y: e.clientY
	})), r = /* @__PURE__ */ new Map(), i = null, a = null, o = !1, s = null;
	function c(e) {
		let t = {
			element: e.element,
			unit: e.unit,
			press: e.press
		};
		r.set(e.element, t);
		let n = (e) => {
			t.press && u(e, t, t.press);
		};
		return e.element.addEventListener("pointerdown", n), pe(() => {
			e.element.removeEventListener("pointerdown", n), r.get(e.element) === t && r.delete(e.element), i?.surface === t && S(), a?.surface === t && E("cancel");
		});
	}
	function l(e) {
		let t = (t) => {
			let n = r.get(e.surface);
			n && u(t, n, e.press);
		};
		return e.element.addEventListener("pointerdown", t), pe(() => e.element.removeEventListener("pointerdown", t));
	}
	function u(e, r, s) {
		if (o || a || i || e.pointerType === "mouse" && e.button !== 0) return;
		let c = e.pointerType === "touch" || e.pointerType === "pen" ? e.pointerType : "mouse", l = n(e), u = R(r, l.x, l.y), f = e.composedPath?.()[0], p = f instanceof Element ? f : e.target instanceof Element ? e.target : null, m = s({
			input: c,
			point: u.point,
			square: z(u.point),
			inside: u.inside,
			target: p,
			event: e
		});
		m && (i = {
			surface: r,
			gesture: m,
			input: c,
			pointerId: e.pointerId,
			startX: l.x,
			startY: l.y,
			origin: u.point,
			target: p,
			timer: null
		}, c === "touch" && (i.timer = setTimeout(() => {
			i && d(i);
		}, t.touchHold)), b());
	}
	function d(e) {
		e.timer && clearTimeout(e.timer), i = null, a = {
			surface: e.surface,
			gesture: e.gesture,
			input: e.input,
			pointerId: e.pointerId,
			origin: e.origin,
			clientX: e.startX,
			clientY: e.startY,
			point: e.origin,
			landed: -1,
			scrollFrame: null
		}, be(e.surface.element.ownerDocument), e.surface.element.ownerDocument.documentElement.setAttribute("data-drag-grid", "");
		let t = O(a);
		e.gesture.onStart?.(t), e.gesture.onMove?.(t);
	}
	function f(e) {
		let r = n(e);
		if (i && e.pointerId === i.pointerId) {
			if (Math.hypot(r.x - i.startX, r.y - i.startY) < t.dragDistance) return;
			if (i.input === "touch") {
				let e = i.gesture, t = k(i);
				S(), e.onCancel?.(t);
				return;
			}
			d(i);
		}
		a && a.input !== "keyboard" && e.pointerId === a.pointerId && (a.clientX = r.x, a.clientY = r.y, T(a), A(a));
	}
	function p(e) {
		if (i && e.pointerId === i.pointerId) {
			let e = i.gesture, t = k(i);
			S(), e.onClick?.(t);
		} else a && a.input !== "keyboard" && e.pointerId === a.pointerId && (C(), E("drop"));
	}
	function m(e) {
		if (i && e.pointerId === i.pointerId) {
			let e = i.gesture, t = k(i);
			S(), e.onCancel?.(t);
		}
		a && e.pointerId === a.pointerId && E("cancel");
	}
	function h(e) {
		let n = a;
		if (!n) i && e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), D());
		else {
			if (e.key === "Escape") E("cancel");
			else if (n.input !== "keyboard") return;
			else if (e.key === "Enter" || e.key === " ") E("drop");
			else if (e.key in ve) {
				let r = e.shiftKey ? t.step : 1, i = ve[e.key];
				n.point = {
					x: Math.max(0, n.point.x + i.x * r),
					y: Math.max(0, n.point.y + i.y * r)
				}, T(n, "move");
			} else if (e.key === "Tab") {
				let t = n.gesture.targets?.() ?? [];
				if (!t.length) return;
				let r = t.length;
				n.landed = n.landed < 0 ? e.shiftKey ? r - 1 : 0 : (n.landed + (e.shiftKey ? r - 1 : 1)) % r, n.point = t[n.landed], T(n, "move");
			} else return;
			e.preventDefault(), e.stopPropagation();
		}
	}
	function g(e) {
		a && e.cancelable && e.preventDefault();
	}
	function _(e) {
		(i || a) && e.preventDefault();
	}
	function v() {
		if (i) {
			let e = i.gesture, t = k(i);
			S(), e.onCancel?.(t);
		}
		a && E("cancel");
	}
	function y() {
		a && a.input !== "keyboard" && T(a);
	}
	function b() {
		window.addEventListener("pointermove", f, !0), window.addEventListener("pointerup", p, !0), window.addEventListener("pointercancel", m, !0), window.addEventListener("touchmove", g, {
			capture: !0,
			passive: !1
		}), window.addEventListener("contextmenu", _, !0), window.addEventListener("keydown", h, !0), window.addEventListener("blur", v), window.addEventListener("scroll", y, !0);
	}
	function x() {
		window.removeEventListener("pointermove", f, !0), window.removeEventListener("pointerup", p, !0), window.removeEventListener("pointercancel", m, !0), window.removeEventListener("touchmove", g, !0), window.removeEventListener("contextmenu", _, !0), window.removeEventListener("keydown", h, !0), window.removeEventListener("blur", v), window.removeEventListener("scroll", y, !0);
	}
	function S() {
		i && (i.timer && clearTimeout(i.timer), i = null, a || x());
	}
	function C() {
		let e = (e) => {
			e.preventDefault(), e.stopPropagation();
		};
		window.addEventListener("click", e, {
			capture: !0,
			once: !0
		}), setTimeout(() => window.removeEventListener("click", e, !0), 0);
	}
	function w(e) {
		let t = r.get(e.surface);
		if (o || a || !t) return;
		S(), a = {
			surface: t,
			gesture: e.gesture,
			input: "keyboard",
			pointerId: -1,
			origin: e.from,
			clientX: 0,
			clientY: 0,
			point: e.from,
			landed: -1,
			scrollFrame: null
		}, b();
		let n = O(a);
		e.gesture.onStart?.(n), e.gesture.onMove?.(n), M(e.gesture.announce?.(n, "start"));
	}
	function T(e, t) {
		e.input !== "keyboard" && (e.point = R(e.surface, e.clientX, e.clientY).point);
		let n = O(e);
		e.gesture.onMove?.(n), t && M(e.gesture.announce?.(n, t));
	}
	function E(e) {
		let t = a;
		if (!t) return;
		a = null, t.scrollFrame !== null && cancelAnimationFrame(t.scrollFrame), x(), t.surface.element.ownerDocument.documentElement.removeAttribute("data-drag-grid");
		let n = O(t);
		e === "drop" ? t.gesture.onDrop?.(n) : t.gesture.onCancel?.(n), t.input === "keyboard" && M(t.gesture.announce?.(n, e));
	}
	function D() {
		if (i) {
			let e = i.gesture, t = k(i);
			S(), e.onCancel?.(t);
		}
		E("cancel");
	}
	function O(e) {
		let t = e.input === "keyboard" || R(e.surface, e.clientX, e.clientY).inside;
		return {
			input: e.input,
			origin: e.origin,
			point: e.point,
			square: z(e.point),
			moved: {
				x: Math.round(e.point.x - e.origin.x),
				y: Math.round(e.point.y - e.origin.y)
			},
			inside: t,
			target: e.input === "keyboard" ? null : ye(e.surface.element.ownerDocument, e.clientX, e.clientY)
		};
	}
	function k(e) {
		return {
			input: e.input,
			origin: e.origin,
			point: e.origin,
			square: z(e.origin),
			moved: {
				x: 0,
				y: 0
			},
			inside: !0,
			target: e.target
		};
	}
	function A(e) {
		if (e.scrollFrame !== null || !j(e)) return;
		let t = () => {
			if (e.scrollFrame = null, a !== e) return;
			let n = j(e);
			if (!n) return;
			let r = n.element, i = r ? {
				x: r.scrollLeft,
				y: r.scrollTop
			} : {
				x: window.scrollX,
				y: window.scrollY
			};
			r ? r.scrollBy(n.x, n.y) : window.scrollBy(n.x, n.y);
			let o = r ? {
				x: r.scrollLeft,
				y: r.scrollTop
			} : {
				x: window.scrollX,
				y: window.scrollY
			};
			(o.x !== i.x || o.y !== i.y) && (T(e), e.scrollFrame = requestAnimationFrame(t));
		};
		e.scrollFrame = requestAnimationFrame(t);
	}
	function j(e) {
		let n = t.autoScrollEdge, r = (e, t, r) => {
			let i = e - t, a = t + r - e;
			return i < n ? -20 * ((n - Math.max(i, 0)) / n) ** 2 : a < n ? me * ((n - Math.max(a, 0)) / n) ** 2 : 0;
		}, i = e.surface.element, a = i.getBoundingClientRect();
		if (e.clientX >= a.left && e.clientX < a.right && e.clientY >= a.top && e.clientY < a.bottom) {
			let t = i.scrollWidth > i.clientWidth ? r(e.clientX, a.left, a.width) : 0, n = i.scrollHeight > i.clientHeight ? r(e.clientY, a.top, a.height) : 0;
			if (t < 0 && i.scrollLeft > 0 || t > 0 && i.scrollLeft + i.clientWidth < i.scrollWidth || n < 0 && i.scrollTop > 0 || n > 0 && i.scrollTop + i.clientHeight < i.scrollHeight) return {
				element: i,
				x: t,
				y: n
			};
		}
		let o = r(e.clientY, 0, window.innerHeight);
		return o ? {
			element: null,
			x: 0,
			y: o
		} : null;
	}
	function M(e) {
		e && (s ??= xe(document), s.textContent = e);
	}
	function N() {
		o || (D(), o = !0, r.clear(), x(), s?.remove(), s = null);
	}
	return {
		surface: c,
		source: l,
		keyboard: w,
		isDragging: () => !!a,
		cancel: D,
		destroy: N
	};
}
var ve = {
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
function R(e, t, n) {
	let r = e.element, i = r.getBoundingClientRect(), a = r.offsetWidth > 0 && i.width > 0 && Math.abs(i.width / r.offsetWidth - 1) >= .02 ? i.width / r.offsetWidth : 1, o = e.unit() || 1;
	return {
		point: {
			x: ((t - i.left) / a - r.clientLeft + r.scrollLeft) / o,
			y: ((n - i.top) / a - r.clientTop + r.scrollTop) / o
		},
		inside: t >= i.left && t < i.left + i.width && n >= i.top && n < i.top + i.height
	};
}
function z(e) {
	return {
		x: Math.floor(e.x),
		y: Math.floor(e.y)
	};
}
function ye(e, t, n) {
	let r = e.elementFromPoint?.(t, n) ?? null;
	for (; r?.shadowRoot;) {
		let e = r.shadowRoot.elementFromPoint?.(t, n) ?? null;
		if (!e || e === r) break;
		r = e;
	}
	return r;
}
function be(e) {
	if (e.querySelector(`style[${he}]`)) return;
	let t = e.createElement("style");
	t.setAttribute(he, ""), t.textContent = ge, e.head.appendChild(t);
}
function xe(e) {
	let t = e.createElement("div");
	return t.setAttribute("aria-live", "assertive"), t.setAttribute("aria-atomic", "true"), Object.assign(t.style, {
		position: "absolute",
		width: "1px",
		height: "1px",
		margin: "-1px",
		padding: "0",
		overflow: "hidden",
		clip: "rect(0 0 0 0)",
		whiteSpace: "nowrap",
		border: "0"
	}), e.body.appendChild(t), t;
}
//#endregion
//#region src/diagram-board.css?inline
var Se = ":host{--board-unit:var(--aa-diagram-unit,var(--ds-grid-unit,calc(20px * var(--sf,1))));--board-sf:var(--ds-sf,var(--sf,1));--board-ring:var(--ds-focus-ring,#594dff);--board-rule:var(--lightningcss-light,#1e1e1e1a)var(--lightningcss-dark,#ffffff1a);--board-fill:var(--lightningcss-light,#1e1e1e0f)var(--lightningcss-dark,#ffffff14);--board-ink:var(--ds-text-color,var(--lightningcss-light,#1e1e1e)var(--lightningcss-dark,#fff));--board-hover:var(--lightningcss-light,#1e1e1e1f)var(--lightningcss-dark,#ffffff29);--board-paper:var(--lightningcss-light,var(--ds-white,#fff))var(--lightningcss-dark,var(--ds-slate,#1e1e1e));--board-text:var(--ds-text-color,var(--lightningcss-light,#1e1e1e)var(--lightningcss-dark,#fff));--board-rule-strong:var(--lightningcss-light,#1e1e1e33)var(--lightningcss-dark,#fff3);-webkit-user-select:none;user-select:none;outline:none;display:block;position:relative}.probe{width:var(--board-unit);visibility:hidden;pointer-events:none;height:0;position:absolute}.paper{max-width:100%;position:relative;overflow:auto hidden}::slotted(*){margin-inline-start:0}.paper{background-image:linear-gradient(to right, var(--board-rule) 1px, transparent 1px), linear-gradient(to bottom, var(--board-rule) 1px, transparent 1px);background-size:var(--board-unit) var(--board-unit);background-position:-.5px -.5px;background-attachment:local}:host([data-active]) .paper{height:calc(var(--board-rows) * var(--board-unit));background-image:linear-gradient(to right, var(--board-rule) 1px, transparent 1px), linear-gradient(to bottom, var(--board-rule) 1px, transparent 1px);background-size:var(--board-unit) var(--board-unit);background-position:-.5px -.5px;background-attachment:local}:host([data-active]) .layer{width:max(100%, calc(var(--board-columns) * var(--board-unit)));right:auto}:host([data-editable]) .paper{cursor:default}:host([data-editable][data-over]) .paper{cursor:grab}:host([data-mode=line]) .paper,:host([data-mode=arrow]) .paper,:host([data-joining]) .paper{cursor:crosshair}:host([data-moving]),:host([data-moving]) .paper{cursor:grabbing}:host([data-sizing]),:host([data-sizing]) .paper{cursor:ew-resize}.layer{z-index:2;pointer-events:none;position:absolute;inset:0}.ring,.ghost-box,.grip{width:calc(var(--w) * var(--board-unit));height:calc(var(--h) * var(--board-unit));box-sizing:border-box;transform:translate(calc(var(--x) * var(--board-unit)), calc(var(--y) * var(--board-unit)));position:absolute;top:0;left:0}:host([data-moving]) .ring,.ghost-box{transition:transform .14s cubic-bezier(.2,.7,.3,1)}:host([data-moving]) .grip{display:none}@media (prefers-reduced-motion:reduce){:host([data-moving]) .ring,.ghost-box{transition:none}}.ghost-box{box-shadow:inset 0 0 0 1px var(--board-ring);opacity:.6}.ring[hidden],.ghost-box[hidden],.grip[hidden]{display:none}.grip{transform:translate(calc((var(--x) + var(--w)) * var(--board-unit) - 4px * var(--board-sf)), calc(var(--y) * var(--board-unit) + (var(--h) * var(--board-unit) - 16px * var(--board-sf)) / 2));width:calc(8px * var(--board-sf));height:calc(16px * var(--board-sf));border-radius:calc(2px * var(--board-sf));background:var(--board-ring);cursor:ew-resize;pointer-events:auto;touch-action:none}.grip[data-corner]{transform:translate(calc((var(--x) + var(--w)) * var(--board-unit) - 4px * var(--board-sf)), calc((var(--y) + var(--h)) * var(--board-unit) - 4px * var(--board-sf)));height:calc(8px * var(--board-sf));cursor:nwse-resize}.lines{fill:none;width:100%;height:100%;stroke:var(--board-ring);stroke-width:2px;position:absolute;inset:0;overflow:visible}.rename{left:calc(var(--x) * var(--board-unit));top:calc(var(--y) * var(--board-unit));width:calc(var(--w) * var(--board-unit));height:var(--board-unit);box-sizing:border-box;padding:0 calc(4px * var(--board-sf));color:inherit;font:inherit;line-height:var(--board-unit);letter-spacing:inherit;pointer-events:auto;-webkit-user-select:text;user-select:text;background:var(--lightningcss-light,#fff)var(--lightningcss-dark,#000);border:0;border-radius:0;outline:none;margin:0;position:absolute}.rename[hidden]{display:none}:host([data-editable]:not([data-active])) .paper{padding-bottom:var(--board-unit)}.tools{width:max-content;max-width:100%;height:calc(var(--board-unit) - 1px);margin-top:calc(1px - var(--board-unit));scrollbar-width:none;clip-path:inset(0 round var(--ds-radius,calc(4px * var(--board-sf))));gap:1px;margin-inline:auto;display:flex;position:relative;overflow-x:auto}.tools button{flex:none}:host(:not([data-editable])) .tools{display:none}.tools{opacity:0;visibility:hidden;transition:opacity .14s ease-out,visibility 0s linear .14s}:host([data-active]) .tools,:host(:focus-within) .tools{opacity:1;visibility:visible;transition:opacity .14s ease-out,visibility}@media (hover:hover){:host(:hover) .tools{opacity:1;visibility:visible;transition:opacity .14s ease-out,visibility}}@media (prefers-reduced-motion:reduce){.tools,:host(:hover) .tools,:host([data-active]) .tools,:host(:focus-within) .tools{transition:none}}.tools button{box-sizing:border-box;width:var(--board-unit);height:calc(var(--board-unit) - 1px);background:var(--board-fill);color:var(--board-ink);cursor:pointer;border:0;border-radius:0;justify-content:center;align-items:flex-end;margin:0;padding:0;display:inline-flex}.tools button:hover,.tools button[aria-pressed=true]{background:var(--board-hover)}.tools button:focus-visible{box-shadow:inset 0 0 0 2px var(--board-ring);outline:0}.tools button:disabled{cursor:default}.tools button:disabled>*{opacity:.4}.tools .gap{width:1px}.icon{width:calc(16px * var(--board-sf));height:calc(16px * var(--board-sf));-webkit-mask:var(--icon) center / contain no-repeat;mask:var(--icon) center / contain no-repeat;background:currentColor}.chip{width:calc(12px * var(--board-sf));height:calc(12px * var(--board-sf));margin-bottom:calc(2px * var(--board-sf));border-radius:calc(2px * var(--board-sf));background:var(--chip)}.chip[data-none]{background:0 0;box-shadow:inset 0 0 0 1px}.colors{z-index:4;box-sizing:border-box;width:calc(6 * var(--board-unit));padding:calc(var(--board-unit) / 2 - 1px) 0;border:1px solid var(--board-rule-strong);border-radius:var(--ds-radius,calc(4px * var(--board-sf)));background:var(--board-paper);color:var(--board-text);margin:0;position:fixed;inset:auto}.colors[hidden]{display:none}.colors button{align-items:flex-end;gap:calc(4px * var(--board-sf));box-sizing:border-box;width:100%;height:var(--board-unit);padding:0 calc(var(--board-unit) / 2 - 1px);color:inherit;font:inherit;line-height:calc(16px * var(--board-sf));text-align:start;cursor:pointer;background:0 0;border:0;margin:0;display:flex}.colors .chip{margin:0 calc(2px * var(--board-sf)) calc(2px * var(--board-sf));flex:none}.colors button:hover,.colors button[aria-checked=true]{background:var(--board-rule)}.colors button:focus-visible{box-shadow:inset 0 0 0 2px var(--board-ring);outline:0}@media (hover:hover) and (pointer:fine){.tools .for-touch{display:none}}", Ce = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"currentColor\" stroke-width=\"0.92\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.25 5L8 2.25L13.75 5V11L8 13.75L2.25 11Z\"/><path d=\"M2.25 5L8 7.75L13.75 5M8 7.75V13.75\"/><path d=\"M5.1 3.6L10.9 6.4\"/></g>\n</svg>\n", we = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M13.1566 8.60594H0V9.61651L13.1562 9.61791L10.249 12.5251L10.9558 13.219L15.0636 9.11123L10.9524 5L10.245 5.70734L13.1566 8.60594Z\" fill=\"currentColor\"/>\n</svg>\n", Te = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M4.67614 12.123L0.536957 7.98382L4.66961 3.85117L5.38124 4.54974L2.45639 7.47459L13.5436 7.50693L10.6122 4.5886L11.3239 3.87698L15.463 8.01616L11.3304 12.1488L10.6188 11.4503L13.5436 8.5254L2.45639 8.49306L5.38777 11.4114L4.67614 12.123Z\" fill=\"currentColor\"/>\n</svg>\n", B = {
	"light-green": "Green",
	"light-blue": "Blue",
	pink: "Pink",
	yellow: "Yellow",
	orange: "Orange",
	red: "Red",
	white: "White"
}, Ee = {
	"light-green": "var(--ds-apple-green, var(--apple-green, #99ff73))",
	"light-blue": "var(--ds-zenith-blue, var(--zenith-blue, #ccccff))",
	pink: "var(--ds-pink, var(--pink, #f5aad1))",
	yellow: "var(--ds-yellow, var(--yellow, #eaff00))",
	orange: "var(--ds-orange, var(--orange, #fec20d))",
	red: "var(--ds-tuned-red, var(--tuned-red, #ff5f5f))",
	white: "light-dark(var(--ds-slate-light, #e6e6e6), var(--ds-white, #fff))"
}, De = {
	box: "item",
	stack: "group",
	"post-it": "note",
	month: "month",
	grid: "grid",
	chart: "chart"
}, V = .3, Oe = 330, H = {
	box: {
		w: 4,
		h: 1
	},
	"post-it": {
		w: 8,
		h: 8
	}
}, ke = "Tab chooses each item and line. Arrows move what is chosen, Alt and arrows size it, Enter or a click writes in it, L or A joins it to another, I adds an item, N a note, Delete takes it away.", U = /* @__PURE__ */ new WeakMap(), Ae = typeof navigator < "u" && /Mac|iPhone|iPad/.test(navigator.platform), je = (e) => `url("data:image/svg+xml,${encodeURIComponent(e)}")`, Me = (e, t) => JSON.stringify(e) === JSON.stringify(t), W;
function G(e) {
	e && typeof document < "u" && (W?.isConnected || (W = document.createElement("div"), W.setAttribute("aria-live", "polite"), W.setAttribute("aria-atomic", "true"), Object.assign(W.style, {
		position: "absolute",
		width: "1px",
		height: "1px",
		margin: "-1px",
		padding: "0",
		overflow: "hidden",
		clip: "rect(0 0 0 0)",
		whiteSpace: "nowrap",
		border: "0"
	}), document.body.append(W)), W.textContent = e);
}
var Ne = typeof HTMLElement > "u" ? class {} : HTMLElement, Pe = class extends Ne {
	#e = "```diagram";
	#t = "```";
	#n = "";
	#r = s("");
	#i = null;
	#a;
	#o;
	#s;
	#c;
	#l;
	#u;
	#d;
	#f;
	#p;
	#m;
	#h;
	#g = {
		block: -1,
		mode: "choose",
		target: null,
		renaming: null,
		active: !1,
		keep: !1,
		said: ""
	};
	#_ = null;
	#v = null;
	#y = !1;
	#b = [];
	set block(e) {
		let t = e.source.replace(/\r\n?/g, "\n").split("\n");
		this.#e = t[0] ?? "```diagram", this.#t = t.length > 1 ? t[t.length - 1] : "```", this.#n = t.slice(1, -1).join("\n"), this.#r = s(this.#n), this.shadowRoot || this.#x(e.tag), this.#i.toggleAttribute("wrap", o(this.#e)), this.#i.source = this.#n;
	}
	#x(e) {
		let n = this.attachShadow({ mode: "open" }), r = document.createElement("style");
		r.textContent = Se;
		let i = (e, t, n = !1) => Object.assign(document.createElement(e), {
			className: t,
			hidden: n
		});
		this.#m = i("div", "probe"), this.#f = i("div", "tools"), this.#f.setAttribute("role", "toolbar"), this.#f.setAttribute("aria-label", F("Diagram")), this.#p = i("div", "colors", !0), this.#p.setAttribute("role", "menu"), this.#p.setAttribute("aria-label", F("Colour")), "popover" in HTMLElement.prototype && this.#p.setAttribute("popover", "manual"), this.#a = i("div", "paper"), this.#i = document.createElement(e);
		let a = i("div", "layer");
		this.#o = i("div", "ring", !0), this.#s = i("div", "ring aim", !0), this.#c = i("div", "grip", !0), this.#l = i("div", "ghost-box", !0), this.#u = document.createElementNS("http://www.w3.org/2000/svg", "svg"), this.#u.setAttribute("class", "lines"), this.#u.setAttribute("aria-hidden", "true"), this.#d = Object.assign(i("input", "rename", !0), {
			type: "text",
			spellcheck: !1
		}), this.#d.setAttribute("aria-label", F("Name")), a.append(this.#o, this.#s, this.#l, this.#u, this.#c, this.#d), this.#a.append(document.createElement("slot"), a), n.append(r, this.#m, this.#a, this.#f, this.#p), this.append(this.#i);
		let o = (e, t, n) => {
			let r = F(e), i = document.createElement("button");
			return i.type = "button", i.title = r, i.setAttribute("aria-label", r), i.append(n), i.addEventListener("click", (e) => {
				e.stopPropagation(), t();
			}), i;
		}, s = (e) => {
			let t = i("span", "icon");
			return t.style.setProperty("--icon", je(e)), t;
		}, c = () => i("span", "gap"), l = (e) => {
			let t = i("span", "chip");
			return e ? t.style.setProperty("--chip", Ee[e]) : t.dataset.none = "", t;
		};
		this.#h = {
			box: o("Item (I)", () => this.#re("box"), s(Ce)),
			postIt: o("Note (N)", () => this.#re("post-it"), s(ee)),
			line: o("Line (L)", () => this.#P("line"), s(ne)),
			arrow: o("Arrow (A)", () => this.#P("arrow"), s(we)),
			color: o("Colour", () => this.#A(), l(null)),
			colors: [null, ...t].map((e) => {
				let t = o(e ? B[e] : "No colour", () => {
					this.#j(), this.#de(e);
				}, l(e));
				return t.setAttribute("role", "menuitemradio"), t.append(Object.assign(document.createElement("span"), { textContent: F(e ? B[e] : "No colour") })), t;
			}),
			wrap: o("Fit the width", () => this.#fe(), s(Te)),
			delete: o("Delete", () => this.#me(), s(te))
		};
		let { box: u, postIt: d, line: f, arrow: p, color: m, colors: h } = this.#h;
		m.setAttribute("aria-haspopup", "menu"), m.setAttribute("aria-expanded", "false");
		let g = c();
		g.classList.add("for-touch"), this.#h.delete.classList.add("for-touch"), this.#f.append(u, d, c(), f, p, c(), m, c(), this.#h.wrap, g, this.#h.delete), this.#p.append(...h), this.#N();
	}
	connectedCallback() {
		let e = this.#S(), t = this.#C(), n = !!e && !!t && t.dataset.readonly !== "true";
		if (this.toggleAttribute("data-editable", n), this.toggleAttribute("data-aa-interactive", n), !n || !e || !t) return;
		this.tabIndex = 0, this.setAttribute("role", "application"), this.setAttribute("aria-roledescription", "diagram"), this.setAttribute("aria-label", F("Diagram")), this.setAttribute("aria-description", F(ke));
		let r = Array.from(e.children).indexOf(t), i = U.get(e);
		this.#g = i && i.block === r ? i : {
			block: r,
			mode: "choose",
			target: null,
			renaming: null,
			active: !1,
			keep: !1,
			said: ""
		}, U.set(e, this.#g);
		let a = (e, t, n, r) => {
			e.addEventListener(t, n, r), this.#b.push(() => e.removeEventListener(t, n, r));
		}, o = this.#_ = _e();
		this.#b.push(o.surface({
			element: this.#a,
			unit: () => this.#T(),
			press: (e) => this.#q(e)
		}), o.source({
			element: this.#h.box,
			surface: this.#a,
			press: (e) => this.#ee("box", e)
		}), o.source({
			element: this.#h.postIt,
			surface: this.#a,
			press: (e) => this.#ee("post-it", e)
		}), () => o.destroy()), a(this.#a, "pointermove", (e) => this.#ae(e)), a(this.#a, "pointerleave", () => this.removeAttribute("data-over")), a(this.#a, "dblclick", (e) => this.#oe(e)), a(this.#f, "pointerdown", (e) => {
			e.preventDefault(), e.stopPropagation(), this.#E();
		}), a(this, "keydown", (e) => this.#he(e)), a(this, "focusin", () => {
			!this.#g.active && this.#w() && (this.#g.active = !0, this.#O(!0));
		}), a(this, "focusout", (e) => this.#D(e)), a(this.#d, "blur", () => {
			this.#d.hidden || this.#ue(!0);
		}), a(this.#p, "pointerdown", (e) => {
			e.preventDefault(), e.stopPropagation();
		}), a(this.#p, "keydown", (e) => this.#M(e)), a(window, "scroll", () => this.#j(), {
			capture: !0,
			passive: !0
		}), a(window, "resize", () => this.#j());
		for (let e of [
			"keyup",
			"keypress",
			"beforeinput",
			"input",
			"paste",
			"cut",
			"copy",
			"compositionstart",
			"compositionupdate",
			"compositionend",
			"click",
			"dblclick"
		]) a(this, e, (e) => e.stopPropagation());
		this.#g.active && (this.#g.keep = !1, this.#O(!0), this.#g.said && (G(this.#g.said), this.#g.said = ""), queueMicrotask(() => {
			this.isConnected && (this.#g.renaming ? this.#ce(this.#g.renaming) : this.focus({ preventScroll: !0 }));
		}));
	}
	disconnectedCallback() {
		this.#b.forEach((e) => e()), this.#b = [], this.#_ = null, this.#y = !1, this.#g.keep || this.#v?.close(), this.#j();
	}
	#S() {
		return this.closest(".aa");
	}
	#C() {
		return this.closest(".aa-block");
	}
	#w() {
		return this.hasAttribute("data-editable") && this.#C()?.dataset.readonly !== "true";
	}
	#T() {
		return this.#m.getBoundingClientRect().width || 20;
	}
	#E() {
		if (!this.#w()) return;
		let e = this.#S();
		e && U.set(e, this.#g), this.#g.active || (this.#g.active = !0, this.#O(!0)), this.shadowRoot?.activeElement !== this.#d && this.focus({ preventScroll: !0 });
	}
	#D(e) {
		this.#g.keep || this.contains(e.relatedTarget) || e.relatedTarget === this || queueMicrotask(() => {
			!this.isConnected || this.#g.keep || this.matches(":focus-within") || this.shadowRoot?.activeElement || (this.#_?.cancel(), this.#g.active = !1, this.#g.target = null, this.#g.mode = "choose", this.#O(!1));
		});
	}
	#O(e) {
		this.toggleAttribute("data-active", e), this.#i?.toggleAttribute("data-editing", e), this.dataset.mode = this.#g.mode, this.#k(this.#r), this.#N(), this.#B(), e || this.#j();
	}
	#k(e) {
		this.style.setProperty("--board-columns", String(Math.max(e.columns + 4, this.#r.columns + 4, 12))), this.style.setProperty("--board-rows", String(Math.max(e.rows + 3, this.#r.rows + 3, 6)));
	}
	#A() {
		if (!this.#p.hidden) {
			this.#j();
			return;
		}
		this.#p.hidden = !1, this.#h.color.setAttribute("aria-expanded", "true");
		try {
			this.#p.hasAttribute("popover") && this.#p.showPopover();
		} catch {}
		let e = this.#h.color.getBoundingClientRect(), t = this.#T(), n = this.#p.offsetHeight;
		this.#p.style.left = `${Math.max(0, Math.min(e.left, window.innerWidth - this.#p.offsetWidth))}px`, this.#p.style.top = `${e.bottom + t / 2 + n <= window.innerHeight ? e.bottom + t / 2 : Math.max(0, e.top - t / 2 - n)}px`;
		let r = this.#h.colors.find((e) => e.getAttribute("aria-checked") === "true") ?? this.#h.colors[0];
		(this.matches(":focus-visible") || this.shadowRoot?.activeElement === this.#h.color) && r.focus({ preventScroll: !0 });
	}
	#j() {
		if (this.#p && !this.#p.hidden) {
			this.#p.hidden = !0, this.#h.color.setAttribute("aria-expanded", "false");
			try {
				this.#p.matches(":popover-open") && this.#p.hidePopover();
			} catch {}
			this.shadowRoot?.activeElement && this.#p.contains(this.shadowRoot.activeElement) && this.focus({ preventScroll: !0 });
		}
	}
	#M(e) {
		let t = this.#h.colors, n = t.indexOf(this.shadowRoot?.activeElement);
		if (e.key === "Escape") {
			e.preventDefault(), e.stopPropagation(), this.#j();
			return;
		}
		let r = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
		r && (e.preventDefault(), e.stopPropagation(), t[(n + r + t.length) % t.length].focus({ preventScroll: !0 }));
	}
	#N() {
		let e = this.#g.target, n = e && "group" in e ? this.#r.groups[e.group] : void 0, r = !!n && (n.kind === "box" || n.kind === "stack" || n.kind === "post-it"), i = e && "join" in e ? this.#r.lines[e.join] : void 0, { line: a, arrow: s, color: c, colors: l } = this.#h;
		a.setAttribute("aria-pressed", String(i ? !i.arrow : this.#g.mode === "line")), s.setAttribute("aria-pressed", String(i ? i.arrow : this.#g.mode === "arrow"));
		let u = e && "group" in e && n ? e.box === void 0 ? n.color : n.boxes[e.box]?.color ?? n.color : void 0;
		c.disabled = !r, r || this.#j();
		let d = c.querySelector(".chip");
		u ? (d.style.setProperty("--chip", Ee[u]), delete d.dataset.none) : (d.style.removeProperty("--chip"), d.dataset.none = ""), l.forEach((e, n) => e.setAttribute("aria-checked", String(([null, ...t][n] ?? void 0) === u))), this.#h.delete.disabled = !e, this.#h.wrap.setAttribute("aria-pressed", String(o(this.#e)));
	}
	#P(e) {
		let t = this.#g.target;
		t && "join" in t ? this.#G(A(this.#n, this.#r, t, e === "arrow" ? "->" : "--"), { target: t }, F(e === "arrow" ? "Made an arrow" : "Made a line")) : this.#F(this.#g.mode === e ? "choose" : e);
	}
	#F(e) {
		this.#g.mode = e, this.dataset.mode = e, this.#l.hidden = !0, this.#N(), this.shadowRoot?.activeElement !== this.#d && this.focus({ preventScroll: !0 });
	}
	#I(e, t = this.#r) {
		if ("join" in e) return null;
		let n = t.groups[e.group];
		return n ? e.box === void 0 || n.kind !== "stack" ? {
			x: n.x,
			y: n.y,
			w: n.w,
			h: n.h
		} : {
			x: n.x,
			y: n.y + +!!n.name + e.box,
			w: n.w,
			h: 1
		} : null;
	}
	#L(e) {
		let t = this.#I(e);
		return !t || "join" in e ? t : this.#r.groups[e.group].kind === "post-it" ? {
			x: t.x + 1,
			y: t.y + 1,
			w: Math.max(1, t.w - 2),
			h: 1
		} : {
			...t,
			h: 1
		};
	}
	#R(e, t) {
		let n = (n) => e >= n.x && e < n.x + n.w && t >= n.y && t < n.y + n.h, r = this.#r.groups, i = [...r.keys()].sort((e, t) => Number(r[t].kind !== "post-it") - Number(r[e].kind !== "post-it") || t - e);
		for (let e of i) {
			let i = r[e];
			if (n(i)) {
				if (i.kind === "stack") {
					let n = Math.floor(t - i.y) - +!!i.name;
					return n >= 0 && n < i.boxes.length ? {
						group: e,
						box: n
					} : { group: e };
				}
				return { group: e };
			}
		}
		for (let [n, r] of this.#r.lines.entries()) for (let i of r.segments) if (i.x1 === i.x2 ? Math.abs(e - i.x1) < V && t >= Math.min(i.y1, i.y2) - V && t <= Math.max(i.y1, i.y2) + V : Math.abs(t - i.y1) < V && e >= Math.min(i.x1, i.x2) - V && e <= Math.max(i.x1, i.x2) + V) return { join: n };
		return null;
	}
	#z() {
		let e = [];
		for (let [t, n] of this.#r.groups.entries()) e.push({ group: t }), n.kind === "stack" && n.boxes.forEach((n, r) => e.push({
			group: t,
			box: r
		}));
		return this.#r.lines.forEach((t, n) => e.push({ join: n })), e;
	}
	#B(e = this.#r) {
		let t = this.#g.active ? this.#g.target : null, n = t ? this.#I(t, e) : null;
		this.#V(this.#o, n);
		let r = t && "group" in t && t.box === void 0 ? e.groups[t.group] : void 0, i = !!r && (r.kind === "box" || r.kind === "stack" || r.kind === "post-it");
		if (this.#V(this.#c, i ? n : null), this.#c.toggleAttribute("data-corner", r?.kind === "post-it"), this.#y) return;
		this.#u.replaceChildren();
		let a = t && "join" in t ? e.lines[t.join] : void 0;
		a && this.#u.append(this.#H(a.segments.map((e, t) => `${t ? "" : `M${e.x1},${e.y1} `}L${e.x2},${e.y2}`).join(" ")));
	}
	#V(e, t) {
		if (e.hidden = !t, t) for (let [n, r] of Object.entries(t)) e.style.setProperty(`--${n}`, String(r));
	}
	#H(e) {
		let t = this.#T(), n = document.createElementNS("http://www.w3.org/2000/svg", "path");
		return n.setAttribute("d", e.replace(/-?\d+(\.\d+)?/g, (e) => String(Number(e) * t))), n;
	}
	#U(e) {
		Me(e, this.#g.target) || (this.#g.target = e, this.#N(), this.#B(), e && G(this.#W(e)));
	}
	#W(e) {
		if ("join" in e) {
			let t = this.#r.joins[e.join];
			return t ? `${t.from} to ${t.to}, ${this.#r.lines[e.join]?.arrow ? "arrow" : "line"}` : "";
		}
		let t = this.#r.groups[e.group];
		return t ? `${this.#se(e) ?? F("Unnamed")}, ${F(e.box === void 0 ? De[t.kind] : "item")}` : "";
	}
	#G(e, t = {}, n = "", r = this.#e) {
		if (e === this.#n && r === this.#e) {
			Object.assign(this.#g, t), this.#N(), this.#B();
			return;
		}
		Object.assign(this.#g, t, {
			active: !0,
			keep: !0,
			said: n
		});
		let i = `${r}\n${e}${e ? "\n" : ""}${this.#t}`;
		this.dispatchEvent(new CustomEvent("aa-atom-change", {
			bubbles: !0,
			composed: !0,
			detail: { source: i }
		})), this.isConnected && (this.#g.keep = !1, this.#g.said = "", this.#i.source = this.#n, this.#B());
	}
	#K(e) {
		this.dispatchEvent(new CustomEvent("aa-atom-leave", {
			bubbles: !0,
			composed: !0,
			detail: { forward: e }
		})), this.matches(":focus") && this.dispatchEvent(new CustomEvent("aa-atom-leave", {
			bubbles: !0,
			composed: !0,
			detail: { forward: !e }
		}));
	}
	#q({ point: e, target: t, event: n }) {
		if (!this.#w() || (n.preventDefault(), n.stopPropagation(), this.#E(), !this.#d.hidden && (this.#ue(!0), !this.isConnected))) return null;
		let r = this.#g.target;
		if (t?.closest(".grip") && r && "group" in r) return this.#Z(r.group);
		let i = this.#R(e.x, e.y);
		if (this.#g.mode !== "choose") {
			if (i && !("join" in i) && v(this.#r, i)) return this.#Q(i, this.#g.mode);
			this.#F("choose");
		}
		return this.#U(i), !i || !("group" in i) ? null : {
			...this.#Y(i),
			onClick: () => this.#ce(i)
		};
	}
	#J(e, t, n, r) {
		let i = this.#n, a = () => {
			this.removeAttribute(r), this.#i.source = this.#n, this.#k(this.#r), this.#B();
		};
		return {
			onStart: () => this.setAttribute(r, ""),
			onMove: (t) => {
				let n = e(t);
				if (n === i) return;
				i = n;
				let r = s(n);
				this.#i.source = n, this.#k(r), this.#B(r);
			},
			onDrop: () => {
				let e = i;
				a(), this.#G(e, { target: t }, n);
			},
			onCancel: a
		};
	}
	#Y(e) {
		let t = this.#r.groups[e.group], n = this.#n, r = {
			x: 0,
			y: 0
		}, i = [], a = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, o = (e, t, n) => {
			for (let { element: r, transform: o } of i) r.style.transition = n && !a() ? `transform ${Oe}ms cubic-bezier(.2, 1, .1, 1)` : "none", r.style.transform = `translate(${e}px, ${t}px) ${o}`.trim();
		}, c = (e) => {
			let t = () => {
				this.removeAttribute("data-moving");
				for (let { element: e } of i) e.style.transition = "", e.style.transform = "", e.style.zIndex = "";
				i = [], e();
			};
			a() ? t() : setTimeout(t, Oe);
		};
		return {
			onStart: () => {
				this.setAttribute("data-moving", ""), i = this.#X(t).map((e) => {
					let t = getComputedStyle(e).transform;
					return e.style.zIndex = "3", {
						element: e,
						transform: t === "none" ? "" : t
					};
				});
			},
			onMove: ({ point: i, origin: a, moved: c }) => {
				let l = this.#T();
				o(Math.max(-t.x, i.x - a.x) * l, Math.max(-t.y, i.y - a.y) * l, !1);
				let u = c.x || c.y ? E(this.#n, this.#r, e.group, t.x + c.x, t.y + c.y) : this.#n;
				if (u === n) return;
				n = u;
				let d = s(u), f = d.groups[e.group];
				r = f ? {
					x: f.x - t.x,
					y: f.y - t.y
				} : {
					x: 0,
					y: 0
				}, this.#k(d), this.#B(d);
			},
			onDrop: () => {
				let t = n, i = this.#T();
				o(r.x * i, r.y * i, !0), c(() => {
					t === this.#n ? this.#B() : this.#G(t, { target: e }, F("Moved {name}", { name: this.#se(e) ?? "" }).trim());
				});
			},
			onCancel: () => {
				o(0, 0, !0), c(() => {
					this.#k(this.#r), this.#B();
				});
			}
		};
	}
	#X(e) {
		let t = this.#i?.shadowRoot;
		if (!t) return [];
		let n = (e, t) => parseFloat(e.style.getPropertyValue(`--${t}`));
		return [...t.querySelectorAll(".post-it, .label, .box, .day, .chart-name")].filter((t) => {
			let r = n(t, "x"), i = n(t, "y");
			return e.kind === "post-it" ? t.classList.contains("post-it") ? r === e.x && i === e.y : t.classList.contains("label") && r === e.x + 1 && i === e.y + 1 : !t.classList.contains("post-it") && r >= e.x && r < e.x + e.w && i >= e.y && i < e.y + e.h;
		});
	}
	#Z(e) {
		let t = this.#r.groups[e];
		return this.#J(({ point: n }) => D(this.#n, this.#r, e, t.kind === "post-it" ? Math.max(n.x - t.x, n.y - t.y) : n.x - t.x), { group: e }, F("Sized {name}", { name: this.#se({ group: e }) ?? "" }).trim(), "data-sizing");
	}
	#Q(e, t) {
		let n = this.#I(e), r = {
			x: n.x + n.w / 2,
			y: n.y + Math.min(n.h, 1) / 2
		}, i = v(this.#r, e), a = (e) => {
			let t = this.#R(e.x, e.y), n = t && !("join" in t) ? v(this.#r, t) : void 0;
			return t && n && n.toLowerCase() !== i.toLowerCase() ? t : null;
		}, o = () => {
			this.#y = !1, this.removeAttribute("data-joining"), this.#s.hidden = !0, this.#B();
		};
		return {
			onStart: () => {
				this.#y = !0, this.setAttribute("data-joining", "");
			},
			onMove: ({ point: e }) => {
				this.#u.replaceChildren(this.#H(`M${r.x},${r.y} L${e.x},${e.y}`));
				let t = a(e);
				this.#V(this.#s, t && this.#I(t));
			},
			onDrop: ({ point: n }) => {
				o();
				let r = a(n);
				if (!r) {
					this.#F("choose");
					return;
				}
				let c = v(this.#r, r), l = k(this.#n, i, c, t === "arrow" ? "->" : "--"), u = s(l).joins.length - 1;
				this.#G(l, {
					target: u >= 0 ? { join: u } : e,
					mode: "choose"
				}, F("Joined {name} to {end}", {
					name: i,
					end: c
				}));
			},
			onCancel: o,
			onClick: () => this.#U(e),
			targets: () => this.#z().filter((e) => !("join" in e) && a(this.#$(e))).map((e) => this.#$(e)),
			announce: (e, t) => {
				if (t === "start") return F("Joining {name}. Tab to the one to join it to, then Enter. Escape stops.", { name: i });
				if (t === "move") {
					let t = a(e.point);
					return t ? this.#W(t) : F("Nothing here");
				}
				return t === "cancel" ? F("Not joined") : void 0;
			}
		};
	}
	#$(e) {
		let t = this.#I(e) ?? {
			x: 0,
			y: 0,
			w: 0,
			h: 0
		};
		return {
			x: t.x + t.w / 2,
			y: t.y + Math.min(t.h, 1) / 2
		};
	}
	#ee(e, { event: t }) {
		if (!this.#w()) return null;
		t.preventDefault();
		let n = () => {
			this.#y = !1, this.#l.hidden = !0;
		};
		return {
			onStart: () => {
				this.#E(), this.#y = !0;
			},
			onMove: ({ point: t, inside: n }) => this.#V(this.#l, n ? {
				...this.#te(e, t),
				...H[e]
			} : null),
			onDrop: ({ point: t, inside: r }) => {
				n(), r && this.#re(e, this.#te(e, t));
			},
			onCancel: n
		};
	}
	#te(e, t) {
		let { w: n, h: r } = H[e], i = Math.max(0, Math.round(t.x - n / 2));
		return {
			x: e === "post-it" ? Math.round(i / 4) * 4 : i,
			y: Math.max(0, e === "post-it" ? Math.round(t.y - r / 2) : Math.floor(t.y))
		};
	}
	#ne(e) {
		let { w: t, h: n } = H[e], r = (e, r) => this.#r.groups.every((i) => e + t <= i.x || e >= i.x + i.w || r + n <= i.y || r >= i.y + i.h), i = this.#g.target && "group" in this.#g.target ? this.#r.groups[this.#g.target.group] : void 0;
		if (i) {
			let t = e === "post-it" ? Math.ceil((i.x + i.w + 2) / 4) * 4 : i.x + i.w + 2;
			if (r(t, i.y)) return {
				x: t,
				y: i.y
			};
		}
		let a = this.#r.rows ? this.#r.rows + 1 : 0;
		for (; !r(0, a);) a++;
		return {
			x: 0,
			y: a
		};
	}
	#re(e, t = this.#ne(e)) {
		if (!this.#w()) return;
		this.#E();
		let n = _(this.#r, F(e === "box" ? "Item" : "Note")), r = O(this.#n, this.#r, e, n, t.x, t.y), i = s(r).groups.findIndex((e) => (e.kind === "box" ? e.boxes[0]?.text : e.name) === n), a = i >= 0 ? { group: i } : null;
		this.#G(r, {
			target: a,
			renaming: a,
			mode: "choose"
		}, F("Added {name}", { name: n }));
	}
	#ie(e) {
		let t = this.#a.getBoundingClientRect(), n = this.#T();
		return {
			x: (e.clientX - t.left + this.#a.scrollLeft) / n,
			y: (e.clientY - t.top) / n
		};
	}
	#ae(e) {
		if (this.#_?.isDragging() || !this.#w()) return;
		let t = this.#ie(e), n = this.#R(t.x, t.y);
		this.toggleAttribute("data-over", !!n && "group" in n);
	}
	#oe(e) {
		if (!this.#w() || this.#g.mode !== "choose") return;
		e.preventDefault();
		let t = this.#ie(e), n = this.#R(t.x, t.y);
		n && !("join" in n) ? this.#ce(n) : n || this.#re("box", {
			x: Math.floor(t.x),
			y: Math.floor(t.y)
		});
	}
	#se(e) {
		if ("join" in e) return;
		let t = this.#r.groups[e.group];
		if (t) return e.box !== void 0 && t.kind === "stack" ? t.boxes[e.box]?.text : t.kind === "box" ? t.boxes[0]?.text : t.name;
	}
	#ce(e) {
		let t = this.#L(e), n = this.#se(e), r = "group" in e ? this.#r.groups[e.group] : void 0;
		!t || n === void 0 || !r || r.kind === "month" || r.kind === "grid" || r.kind === "chart" ? this.#g.renaming = null : (this.#g.renaming = e, this.#g.target = e, this.#V(this.#d, t), this.#le(t), this.#d.value = n, this.#N(), this.#B(), this.#d.focus({ preventScroll: !0 }), this.#d.select());
	}
	#le(e) {
		let t = this.#d;
		for (let e of [
			"background-color",
			"color",
			"border-radius"
		]) t.style.removeProperty(e);
		let n = this.#T(), r = this.#a.getBoundingClientRect(), i = r.left + (e.x + .5) * n, a = r.top + (e.y + .5) * n, o = [...this.#i?.shadowRoot?.querySelectorAll(".box, .post-it") ?? []].reverse().find((e) => {
			let t = e.getBoundingClientRect();
			return i >= t.left && i < t.right && a >= t.top && a < t.bottom;
		});
		if (!o) return;
		let s = getComputedStyle(o);
		t.style.backgroundColor = s.backgroundColor, t.style.color = s.color, o.matches(".box") && (t.style.borderRadius = s.borderRadius);
	}
	#ue(e) {
		let t = this.#g.renaming, n = this.#d.value;
		this.#d.hidden = !0, this.#g.renaming = null, t && (e && n.trim() && n.trim() !== this.#se(t) ? this.#G(j(this.#n, this.#r, t, n), {
			target: t,
			renaming: null
		}, F("Named {name}", { name: n.trim() })) : this.focus({ preventScroll: !0 }));
	}
	#de(e) {
		let t = this.#g.target;
		t && this.#G(M(this.#n, this.#r, t, e), { target: t }, F(e ? B[e] : "No colour"));
	}
	#fe() {
		let e = !o(this.#e);
		this.#G(this.#n, {}, F(e ? "Fits the width" : "Keeps its layout"), a(this.#e, e));
	}
	#pe() {
		let e = { available: !1 };
		this.dispatchEvent(new CustomEvent("aa-atom-prompt", {
			bubbles: !0,
			composed: !0,
			detail: e
		})), e.available ? (this.#v?.close(), this.#v = de({
			place: () => {
				let e = this.getBoundingClientRect(), t = this.#f.getBoundingClientRect(), n = this.#T();
				return new DOMRect(e.left, (t.height ? t.bottom : this.#a.getBoundingClientRect().bottom) + 1, e.width, n);
			},
			type: this,
			grow: (e) => {
				this.style.paddingBottom = e ? `${e + 1}px` : "";
			},
			placeholder: F("Ask AI or press space to speak"),
			about: () => this.#i ? [this.#i] : [],
			send: async (e, t) => {
				let n = {
					prompt: e,
					text: this.#n,
					signal: t
				};
				this.dispatchEvent(new CustomEvent("aa-atom-prompt", {
					bubbles: !0,
					composed: !0,
					detail: n
				}));
				let r = (await n.answer)?.replace(/^\s*```[^\n]*\n|\n```\s*$/g, "").trim();
				if (!r || !this.isConnected) throw Error(F("Not answered"));
				this.#G(r, { target: null }, F("Drawn"));
			},
			close: (e) => {
				this.#v = null, !e && this.isConnected && this.focus({ preventScroll: !0 });
			}
		})) : G(F("Asking AI is not set up here"));
	}
	#me() {
		let e = this.#g.target;
		e && this.#G(N(this.#n, this.#r, e), { target: null }, F("Deleted {name}", { name: this.#W(e) }));
	}
	#he(e) {
		let t = e.composedPath()[0];
		if (t === this.#d) {
			e.stopPropagation(), e.key === "Enter" ? (e.preventDefault(), this.#ue(!0)) : e.key === "Escape" && (e.preventDefault(), this.#ue(!1));
			return;
		}
		let n = Ae ? e.metaKey : e.ctrlKey;
		if (n && /^[zy]$/i.test(e.key) || (e.stopPropagation(), t !== this || !this.#w() || e.isComposing)) return;
		let r = this.#g.target, i = r && "group" in r ? this.#r.groups[r.group] : void 0, a = e.key.toLowerCase();
		if (e.key === "Escape") {
			e.preventDefault(), this.#g.mode === "choose" ? r ? this.#U(null) : this.#K(!0) : this.#F("choose");
			return;
		}
		if (e.key === "Tab" && !n && !e.altKey) {
			let t = this.#z(), n = r ? t.findIndex((e) => Me(e, r)) : -1, i = n < 0 ? e.shiftKey ? t.length - 1 : 0 : n + (e.shiftKey ? -1 : 1);
			if (i < 0 || i >= t.length) return;
			e.preventDefault(), this.#U(t[i]);
			return;
		}
		if ((e.key === "Backspace" || e.key === "Delete") && r) {
			e.preventDefault(), this.#me();
			return;
		}
		if ((e.key === "Enter" || e.key === "F2") && r && !("join" in r)) {
			e.preventDefault(), this.#ce(r);
			return;
		}
		let o = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1]
		}[e.key];
		if (o && !n) {
			if (e.preventDefault(), !r) {
				this.#K(o[0] + o[1] > 0);
				return;
			}
			if (!i || !("group" in r)) return;
			if (e.altKey) {
				let e = (i.kind === "post-it" ? o[0] + o[1] : o[0]) * 4;
				e && this.#G(D(this.#n, this.#r, r.group, i.w + e), { target: { group: r.group } }, F("Sized {name}", { name: this.#se(r) ?? "" }).trim());
				return;
			}
			let t = e.shiftKey ? 4 : 1;
			this.#G(E(this.#n, this.#r, r.group, Math.max(0, i.x + o[0] * t), Math.max(0, i.y + o[1] * t)), { target: { group: r.group } }, F("Moved {name}", { name: this.#se(r) ?? "" }).trim());
		} else if (!(n || e.altKey)) {
			if (e.key === " " && !this.#g.renaming) e.preventDefault(), this.#pe();
			else if (a === "i" || a === "n") e.preventDefault(), this.#re(a === "i" ? "box" : "post-it");
			else if (a === "l" || a === "a") {
				e.preventDefault();
				let t = a === "l" ? "line" : "arrow";
				r && !("join" in r) && v(this.#r, r) && this.#_ ? this.#_.keyboard({
					surface: this.#a,
					from: this.#$(r),
					gesture: this.#Q(r, t)
				}) : this.#P(t);
			} else a === "v" && (e.preventDefault(), this.#F("choose"));
		}
	}
};
function Fe() {
	let e = "aa-diagram-board";
	return typeof customElements < "u" && !customElements.get(e) && customElements.define(e, Pe), e;
}
//#endregion
//#region src/diagram.css?inline
var Ie = ":host{--aa-diagram-radius:4px;--diagram-unit:var(--aa-diagram-unit,var(--ds-grid-unit,calc(20px * var(--sf,1))));--diagram-ink:var(--aa-diagram-ink,var(--ds-text-color,var(--text-color,var(--lightningcss-light,#1e1e1e)var(--lightningcss-dark,#fff))));--diagram-stroke:var(--aa-diagram-stroke,1px);box-sizing:border-box;width:calc(var(--diagram-columns,0) * var(--diagram-unit));height:calc(var(--diagram-rows,1) * var(--diagram-unit));color:var(--diagram-ink);caret-color:var(--lightningcss-light,#000)var(--lightningcss-dark,#fff);font-family:var(--ds-typeface-regular,var(--typeface-regular));font-feature-settings:var(--ds-font-features,normal);font-size:var(--ds-type-size-default,var(--type-size-default));font-weight:var(--ds-type-weight-default,var(--type-weight-default));letter-spacing:var(--ds-type-letterspacing-default,calc(var(--type-letterspacing-default) * var(--sf,1)));line-height:var(--diagram-unit);font-synthesis:none;-webkit-font-smoothing:antialiased;margin-inline-start:min(0px, round(calc((100% - var(--diagram-columns,0) * var(--diagram-unit)) / 2), var(--diagram-unit)));display:block;position:relative}:host([hidden]){display:none}:host([data-narrow]){scrollbar-width:none;max-width:100%;margin-inline-start:0;overflow:auto hidden}:host([data-narrow]) .lines,:host([data-narrow]) .chart-ink{width:calc(var(--diagram-columns,0) * var(--diagram-unit));right:auto}.lines{z-index:1;pointer-events:none;fill:none;stroke:currentColor;width:100%;height:100%;stroke-width:var(--diagram-stroke);stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;position:absolute;inset:0;overflow:visible}.label,.box,.day{left:calc(var(--x) * var(--diagram-unit));top:calc(var(--y) * var(--diagram-unit));width:calc(var(--w) * var(--diagram-unit));height:var(--diagram-unit);box-sizing:border-box;white-space:nowrap;position:absolute}.label{width:max-content;min-width:calc(var(--w) * var(--diagram-unit))}.label>span{padding-inline-start:var(--item-text-padding,4px)}.box{--box-fill:var(--aa-diagram-cell,var(--lightningcss-light,#fff)var(--lightningcss-dark,#000));--box-radius:var(--aa-diagram-radius,0px);--box-top-left:var(--box-radius);--box-top-right:var(--box-radius);--box-bottom-right:var(--box-radius);--box-bottom-left:var(--box-radius);background-color:var(--box-fill);border-radius:var(--box-top-left) var(--box-top-right) var(--box-bottom-right) var(--box-bottom-left);transition:border-radius .16s ease-out}.day{--box-radius:var(--aa-diagram-radius,0px);--box-top-left:var(--box-radius);--box-top-right:var(--box-radius);--box-bottom-right:var(--box-radius);--box-bottom-left:var(--box-radius);border-radius:var(--box-top-left) var(--box-top-right) var(--box-bottom-right) var(--box-bottom-left);color:var(--lightningcss-light,#c4c4c4)var(--lightningcss-dark,#5c5c5c);font-variant-numeric:tabular-nums;text-align:center}.day[data-name]{color:inherit}.day[data-color]{background-color:var(--box-fill);color:var(--black,#2a2a2a)}.day[data-head]:after{content:\"\";inset:calc(var(--diagram-stroke) / -2);border:var(--diagram-stroke) solid color-mix(in srgb, var(--diagram-ink) 28%, transparent);pointer-events:none;border-left-width:0;position:absolute}.day[data-head]:not([data-shared-left]):after{border-left-width:var(--diagram-stroke)}.day[data-slant]{text-align:start;transform-origin:0 100%;overflow:visible;translate:50%;rotate:-45deg}.day[data-row]{font-family:var(--ds-typeface-compressed,var(--typeface-compressed,var(--ds-typeface-regular,var(--typeface-regular))))}.day[data-edge]{transform:translateY(-50%)}.chart-ink{pointer-events:none;width:100%;height:100%;position:absolute;inset:0;overflow:visible}.chart-rules{fill:none;stroke:var(--lightningcss-light,#d6d6d6)var(--lightningcss-dark,#3a3a3a);stroke-width:1px}.chart-frame{--marker:var(--lightningcss-light,var(--base-darker-grey,#797979))var(--lightningcss-dark,#9a9a9a)}.chart-line,.marker-fill{--marker:var(--diagram-ink);opacity:.94;mix-blend-mode:multiply}:host([data-dark]) :is(.chart-line,.marker-fill){mix-blend-mode:normal}.marker-pass[data-tone=body]{fill:var(--marker)}.marker-pass[data-tone=pass]{fill:color-mix(in oklab, var(--marker) 72%, #000)}.marker-pass[data-tone=edge]{fill:color-mix(in oklab, var(--marker) 60%, #000)}.marker-pass[data-tone=paper]{fill:var(--aa-diagram-paper,var(--ds-paper,var(--lightningcss-light,#fff)var(--lightningcss-dark,#1e1e1e)))}.marker-fill[data-color=light-green]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--apple-green,#99ff73) 88%, #1e1e1e))var(--lightningcss-dark,var(--ds-apple-green,var(--apple-green,#99ff73)))}.marker-fill[data-color=light-blue]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--zenith-blue,#ccf) 75%, #4a5ae0))var(--lightningcss-dark,color-mix(in oklab, var(--zenith-blue,#ccf) 85%, #4a5ae0))}.marker-fill[data-color=pink]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--pink,#f5aad1) 90%, #1e1e1e))var(--lightningcss-dark,var(--pink,#f5aad1))}.marker-fill[data-color=yellow]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--yellow,#eaff00) 88%, #1e1e1e))var(--lightningcss-dark,var(--yellow,#eaff00))}.marker-fill[data-color=orange]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--orange,#fec20d) 85%, #e0602a))var(--lightningcss-dark,var(--orange,#fec20d))}.marker-fill[data-color=red]{--marker:var(--tuned-red,#ff5f5f)}.marker-fill[data-color=white]{--marker:var(--lightningcss-light,#cfccc4)var(--lightningcss-dark,#55534e)}.day[data-marker]{background-color:#0000}.chart-line[data-color=light-green],.chart-name[data-color=light-green]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--apple-green,#99ff73) 82%, #1e1e1e))var(--lightningcss-dark,var(--apple-green,#99ff73))}.chart-line[data-color=light-blue],.chart-name[data-color=light-blue]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--zenith-blue,#ccf) 55%, #4a5ae0))var(--lightningcss-dark,color-mix(in oklab, var(--zenith-blue,#ccf) 80%, #4a5ae0))}.chart-line[data-color=pink],.chart-name[data-color=pink]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--pink,#f5aad1) 85%, #1e1e1e))var(--lightningcss-dark,var(--pink,#f5aad1))}.chart-line[data-color=yellow],.chart-name[data-color=yellow]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--yellow,#eaff00) 82%, #1e1e1e))var(--lightningcss-dark,var(--yellow,#eaff00))}.chart-line[data-color=orange],.chart-name[data-color=orange]{--marker:var(--lightningcss-light,color-mix(in oklab, var(--orange,#fec20d) 72%, #e0602a))var(--lightningcss-dark,var(--orange,#fec20d))}.chart-line[data-color=red],.chart-name[data-color=red]{--marker:var(--tuned-red,#ff5f5f)}.chart-line[data-color=white],.chart-name[data-color=white]{--marker:var(--lightningcss-light,#8c8c8c)var(--lightningcss-dark,#a8a8a8)}.chart-name{left:calc(var(--x) * var(--diagram-unit));top:calc(var(--y) * var(--diagram-unit));height:var(--diagram-unit);font-family:var(--ds-typeface-compressed,var(--typeface-compressed,var(--ds-typeface-regular,var(--typeface-regular))));font-variant-numeric:tabular-nums;white-space:nowrap;color:color-mix(in srgb, var(--diagram-ink) 55%, transparent);position:absolute}.chart-name[data-side=down]{width:var(--diagram-unit);text-align:end;box-sizing:border-box;padding-inline-end:calc(var(--diagram-unit) / 4);translate:0 -50%}.chart-name[data-side=across][data-align=middle]{translate:-50%}.chart-name[data-side=across][data-align=end]{translate:-100%}.chart-name[data-side=end]{translate:calc(var(--diagram-unit) / 2) -50%;color:var(--lightningcss-light,color-mix(in oklab, var(--marker) 70%, #1e1e1e))var(--lightningcss-dark,var(--marker))}.post-it{--box-fill:var(--aa-diagram-cell,var(--lightningcss-light,#fff)var(--lightningcss-dark,#000));--box-edge:var(--diagram-ink);left:calc(var(--x) * var(--diagram-unit));top:calc(var(--y) * var(--diagram-unit));width:calc(var(--w) * var(--diagram-unit));height:calc(var(--h) * var(--diagram-unit));background-color:var(--box-fill);position:absolute}.post-it:after{content:\"\";inset:calc(-.5 * var(--diagram-stroke));border:var(--diagram-stroke) solid var(--box-edge);pointer-events:none;position:absolute}.post-it[data-color]{--box-edge:var(--post-it-fill);--post-it-fill:var(--lightningcss-light,color-mix(in srgb, var(--box-fill) 45%, #fff))var(--lightningcss-dark,color-mix(in srgb, var(--box-fill) 22%, #000));background-color:var(--post-it-fill)}.box[data-color]{color:var(--black,#2a2a2a)}.box[data-color]:after{border-color:var(--box-fill)}:is(.box,.post-it,.day)[data-color=light-green]{--box-fill:var(--ds-apple-green,var(--apple-green,#99ff73))}:is(.box,.post-it,.day)[data-color=light-blue]{--box-fill:var(--ds-zenith-blue,var(--zenith-blue,#ccf))}:is(.box,.post-it,.day)[data-color=pink]{--box-fill:var(--ds-pink,var(--pink,#f5aad1))}:is(.box,.post-it,.day)[data-color=yellow]{--box-fill:var(--ds-yellow,var(--yellow,#eaff00))}:is(.box,.post-it,.day)[data-color=orange]{--box-fill:var(--ds-orange,var(--orange,#fec20d))}:is(.box,.post-it,.day)[data-color=red]{--box-fill:var(--ds-tuned-red,var(--tuned-red,#ff5f5f))}:is(.box,.post-it,.day)[data-color=white]{--box-fill:var(--lightningcss-light,var(--slate-light,#e6e6e6))var(--lightningcss-dark,var(--white,#fff))}:is(.box,.day)[data-shared-top]{--box-top-left:0px;--box-top-right:0px}:is(.box,.day)[data-shared-right]{--box-top-right:0px;--box-bottom-right:0px}:is(.box,.day)[data-shared-bottom]{--box-bottom-right:0px;--box-bottom-left:0px}:is(.box,.day)[data-shared-left]{--box-top-left:0px;--box-bottom-left:0px}.box>span{height:100%;padding:0 var(--item-text-padding,4px);box-sizing:border-box;text-overflow:clip;-webkit-mask-image:var(--text-fade-mask);-webkit-mask-image:var(--text-fade-mask);mask-image:var(--text-fade-mask);display:block;overflow:hidden}.box:after{content:\"\";inset:calc(-.5 * var(--diagram-stroke));border:var(--outline-stroke,1px solid var(--lightningcss-light,#e5e5e5)var(--lightningcss-dark,#333));border-width:var(--diagram-stroke);border-radius:inherit;box-sizing:border-box;pointer-events:none;position:absolute}.box[data-shared-right]:after{border-right-width:0}.box[data-shared-bottom]:after{border-bottom-width:0}@supports (corner-shape:squircle){.box,.box:after,.day{corner-shape:squircle}}@media (prefers-reduced-motion:reduce){.box{transition:none}}", K, Le, Re = .2, ze = 35 * Math.PI / 180, Be = Re * Math.cos(ze), Ve = Re * Math.sin(ze), q = 20, He = 5, Ue = typeof HTMLElement > "u" ? class {} : HTMLElement, J, Y = class extends Ue {
	static observedAttributes = [
		"source",
		"wrap",
		"data-editing"
	];
	#e;
	#t = !0;
	#n = !1;
	#r = null;
	#i = s("");
	#a = /* @__PURE__ */ new Map();
	#o;
	#s;
	#c = 0;
	updateComplete = Promise.resolve(!0);
	get source() {
		return this.#e;
	}
	set source(e) {
		e !== this.#e && (this.#e = e, this.#t = !0, this.requestUpdate());
	}
	get diagram() {
		return this.#i;
	}
	attributeChangedCallback(e, t, n) {
		e === "source" ? this.source = n ?? void 0 : t !== n && (this.#t = !0, this.requestUpdate());
	}
	connectedCallback() {
		if (!this.shadowRoot) {
			let e = this.attachShadow({ mode: "open" });
			try {
				J ??= new CSSStyleSheet(), J.cssRules.length || J.replaceSync(Ie), e.adoptedStyleSheets = [J];
			} catch {
				this.#r = document.createElement("style"), this.#r.textContent = Ie;
			}
		}
		this.hasAttribute("role") || this.setAttribute("role", "img"), this.#e === void 0 && this.textContent?.trim() && (this.source = Je(this.textContent)), document.fonts?.ready.then(() => {
			this.isConnected && this.requestUpdate();
		}), Q.add(this), Ye(), typeof ResizeObserver < "u" && this.parentElement && (this.#s ??= new ResizeObserver(() => this.requestUpdate()), this.#s.observe(this.parentElement)), this.requestUpdate();
	}
	disconnectedCallback() {
		Q.delete(this), this.#s?.disconnect();
	}
	#l() {
		return this.hasAttribute("wrap") && !this.hasAttribute("data-editing");
	}
	requestUpdate() {
		this.#n || (this.#n = !0, this.updateComplete = new Promise((e) => queueMicrotask(() => {
			this.#n = !1, this.isConnected && this.shadowRoot && this.#d(), e(!this.#n);
		})));
	}
	shapeChanged() {
		this.requestUpdate();
	}
	#u() {
		this.#i = s(this.#e ?? "", (e) => this.#a.get(e), this.#l() && this.#o ? { room: this.#o } : {});
	}
	#d() {
		if (this.#t) {
			this.#t = !1, this.#u(), this.style.setProperty("--diagram-columns", String(this.#i.columns)), this.style.setProperty("--diagram-rows", String(this.#i.rows));
			let e = [...this.#i.labels.map((e) => e.text), ...this.#i.boxes.map((e) => e.text)];
			this.setAttribute("aria-label", e.join(", ") || F("Diagram"));
		}
		this.shadowRoot.replaceChildren(...this.#r ? [this.#r] : [], ...this.#m()), this.#f();
	}
	#f() {
		let e = this.shadowRoot;
		this.toggleAttribute("data-dark", qe(getComputedStyle(this).caretColor));
		let t = [...e.querySelectorAll(".label > span")], n = e.querySelector(".label, .box")?.getBoundingClientRect().height ?? 0;
		if (!n) return;
		let r = this.#i.columns * n, i = this.parentElement?.getBoundingClientRect(), a = !this.hasAttribute("data-editing") && !!i && r > i.width && r - i.width > 2 * Math.min(i.left, window.innerWidth - i.right);
		this.toggleAttribute("data-narrow", a);
		let o = i && i.width ? Math.max(4, Math.floor(i.width / n)) : void 0;
		this.#l() && o !== this.#o ? (this.#o = o, this.#t = !0, this.requestUpdate()) : this.#o = o;
		let s = (parseFloat(getComputedStyle(this).getPropertyValue("--aa-diagram-radius")) || 0) / n;
		Math.abs(s - this.#c) > .01 && (this.#c = s, this.requestUpdate());
		let c = new Map(t.map((e) => [e.textContent ?? "", e.getBoundingClientRect().width / n]));
		[...c].some(([e, t]) => Math.round(t) !== Math.round(this.#a.get(e) ?? NaN)) && (this.#a = c, this.#u(), this.requestUpdate());
	}
	#p(e, t, n, r) {
		return K ? [We(Ge(K, e, t, n, r))] : (Le ??= import("./marker.js").then((e) => K = e), Le.then(() => {
			this.isConnected && this.requestUpdate();
		}), []);
	}
	#m() {
		let { columns: e, rows: t, labels: n, postIts: r, boxes: i, days: a, charts: o, lines: s } = this.#i, c = a.filter((e) => e.marker), l = (e, t, n) => `--x:${e};--y:${t};--w:${n}`, u = (e) => ({
			"data-shared-top": !!e?.top,
			"data-shared-right": !!e?.right,
			"data-shared-bottom": !!e?.bottom,
			"data-shared-left": !!e?.left
		}), d = [];
		for (let e of r) d.push(X("div", "post-it", {
			part: "post-it",
			style: `${l(e.x, e.y, e.w)};--h:${e.h}`,
			"data-color": e.color
		}));
		let f = s.map((e) => {
			let t = e.segments[e.segments.length - 1];
			return t ? `<path d="${Xe(e.segments, this.#c)}" vector-effect="non-scaling-stroke"></path>${e.arrow ? Ze(t) : ""}` : "";
		}).join("");
		d.push(We(`<svg class="lines" viewBox="0 0 ${Math.max(e, 1)} ${Math.max(t, 1)}" preserveAspectRatio="none" aria-hidden="true">${f}</svg>`)), (o.length || c.length) && d.push(...this.#p(o, c, e, t));
		for (let e of o) d.push(...Ke(e));
		for (let e of n) d.push(X("div", "label", {
			part: e.title ? "title" : "label",
			style: l(e.x, e.y, e.w)
		}, X("span", "", {}, e.text)));
		for (let e of i) d.push(X("div", "box", {
			part: "box",
			style: l(e.x, e.y, e.w),
			"data-color": e.color,
			...u(e.shared)
		}, X("span", "", {}, e.text)));
		for (let e of a) d.push(X("div", "day", {
			part: "day",
			style: l(e.x, e.y, 1),
			"data-color": e.color,
			"data-name": !!e.name,
			"data-head": !!e.head,
			"data-row": !!e.row,
			"data-edge": !!e.edge,
			"data-slant": !!e.slant,
			"data-marker": !!e.marker,
			...u(e.shared)
		}, e.text));
		return d;
	}
};
function X(e, t, n, r) {
	let i = document.createElement(e);
	t && (i.className = t);
	for (let [e, t] of Object.entries(n)) t !== void 0 && t !== !1 && i.setAttribute(e, t === !0 ? "" : t);
	return typeof r == "string" ? i.textContent = r : r && i.append(r), i;
}
function We(e) {
	let t = document.createElement("template");
	return t.innerHTML = e, t.content.firstElementChild ?? document.createTextNode("");
}
function Ge({ MARKER_FILTERS: e, markerSquare: t, markerFrame: n, markerLine: r }, i, a, o, s) {
	let c = (e) => e ? ` data-color="${e}"` : "";
	return `<svg class="chart-ink" viewBox="0 0 ${o * q} ${s * q}" aria-hidden="true">
    <defs>${e}</defs>
    ${i.map((e, t) => `<g class="chart-frame" filter="url(#aa-marker-rule)">${n(e.frame.x * q, e.frame.y * q, e.frame.w * q, e.frame.h * q, 501 + t * 97).map(Z).join("")}</g>`).join("")}
    <g class="chart-rules">${i.flatMap((e) => e.down.map((t) => `<line x1="${e.x * q}" x2="${(e.x + e.w) * q}" y1="${t.at * q}" y2="${t.at * q}"></line>`)).join("")}</g>
    ${a.map((e) => `<g class="marker-fill"${c(e.color)} filter="url(#aa-marker-fine)">${t(e.x * q, e.y * q, q, 9001 + e.x * 131 + e.y * 17).map(Z).join("")}</g>`).join("")}
    ${i.map((e, t) => e.series.map((e, n) => `<g class="chart-line"${c(e.color)} filter="url(#aa-marker)">${r(e.points.map((e) => ({
		x: e.x * q,
		y: e.y * q
	})), He, 101 + t * 13 + n * 5).map(Z).join("")}</g>`).join("")).join("")}
  </svg>`;
}
function Z(e) {
	return `<path class="marker-pass" data-tone="${e.tone}" fill-opacity="${e.opacity}" d="${e.d}"></path>`;
}
function Ke(e) {
	let t = e.across.length - 1;
	return [
		...e.down.map((t) => X("div", "chart-name", {
			"data-side": "down",
			style: `--x:${e.x - 1};--y:${t.at}`
		}, t.text)),
		...e.across.map((n, r) => X("div", "chart-name", {
			"data-side": "across",
			"data-align": r === 0 && t > 0 ? "start" : r === t && t > 0 ? "end" : "middle",
			style: `--x:${n.at};--y:${e.y + e.h}`
		}, n.text)),
		...e.series.map((e) => {
			let t = e.points[e.points.length - 1];
			return X("div", "chart-name", {
				"data-side": "end",
				"data-color": e.color,
				style: `--x:${t.x};--y:${e.endAt}`
			}, e.end);
		})
	];
}
function qe(e) {
	let [t = 0, n = 0, r = 0] = (e.match(/[\d.]+/g) ?? []).map(Number);
	return .2126 * t + .7152 * n + .0722 * r > 140;
}
function Je(e) {
	let t = e.replace(/\t/g, "  ").split("\n");
	for (; t.length && !t[0].trim();) t.shift();
	for (; t.length && !t[t.length - 1].trim();) t.pop();
	let n = Math.min(...t.filter((e) => e.trim()).map((e) => /^ */.exec(e)[0].length));
	return t.map((e) => e.slice(n)).join("\n");
}
var Q = /* @__PURE__ */ new Set(), $;
function Ye() {
	$ || typeof MutationObserver > "u" || ($ = new MutationObserver(() => Q.forEach((e) => e.shapeChanged())), $.observe(document.documentElement, { attributes: !0 }), globalThis.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => Q.forEach((e) => e.shapeChanged())));
}
function Xe(e, t) {
	if (!e.length) return "";
	let n = [`M${e[0].x1},${e[0].y1}`];
	return e.forEach((r, i) => {
		let a = e[i + 1], o = Math.hypot(r.x2 - r.x1, r.y2 - r.y1), s = a ? Math.hypot(a.x2 - a.x1, a.y2 - a.y1) : 0, c = Math.sign(r.x2 - r.x1), l = Math.sign(r.y2 - r.y1), u = a ? Math.sign(a.x2 - a.x1) : 0, d = a ? Math.sign(a.y2 - a.y1) : 0, f = c * d - l * u, p = a && f ? Math.min(t, o / 2, s / 2) : 0;
		p <= 0 ? n.push(`L${r.x2},${r.y2}`) : (n.push(`L${r.x2 - c * p},${r.y2 - l * p}`), n.push(`A${p},${p} 0 0 ${+(f > 0)} ${r.x2 + u * p},${r.y2 + d * p}`));
	}), n.join(" ");
}
function Ze(e) {
	let t = Math.sign(e.x2 - e.x1), n = Math.sign(e.y2 - e.y1), r = e.x2 - t * Be, i = e.y2 - n * Be, a = n * Ve, o = t * Ve;
	return `<polyline class="arrow" points="${r + a},${i + o} ${e.x2},${e.y2} ${r - a},${i - o}" vector-effect="non-scaling-stroke"></polyline>`;
}
var Qe = "";
function $e(e = "aa-diagram") {
	return Qe = e, typeof customElements > "u" || customElements.get(e) || customElements.define(e, e === "aa-diagram" ? Y : class extends Y {}), e;
}
var et = "```diagram\n[Idea]\n[Plan] @ 6 0\nIdea -> Plan\n```", tt = {
	name: "diagram",
	fence: "diagram",
	match: () => 0,
	insert: {
		label: "Diagram",
		icon: "connect",
		keywords: "chart boxes lines flow draw",
		source: et
	},
	draw(e, t) {
		let n = document.createElement(Fe());
		n.block = {
			source: t,
			tag: Qe || $e()
		}, e.append(n);
	}
};
//#endregion
export { Pe as AaDiagramBoardElement, Y as AaDiagramElement, et as DIAGRAM_START, O as addGroup, k as addJoin, M as colorTarget, $e as defineAaDiagram, Fe as defineAaDiagramBoard, N as deleteTarget, tt as diagramAtom, _ as freeName, A as joinKind, Xe as linePath, E as moveGroup, v as referenceOf, j as renameTarget, D as resizeGroup };

