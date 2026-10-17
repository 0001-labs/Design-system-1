/** Root connections count authored imports, not every element inheriting a token. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import type { ComponentCell } from '../shared/component-adoption';

const sha = (body: Buffer) => createHash('sha256').update(body).digest('hex');
const columns: Record<string, string> = { 'one.css': 'root-styling', 'grid.css': 'root-styling', 'palette.css': 'root-colours', 'fonts.css': 'root-fonts' };
const imports = /(?:\bimport\s*(?:[^;'"\n]*?\bfrom\s*)?|@import\s*(?:url\(\s*)?|\bhref\s*=\s*)["']([^"']+\.css(?:\?[^"']*)?)["']/g;
const cssImports = /@import\s*(?:url\(\s*)?["']([^"']+)["']/g;
const uncomment = (body: string) => body.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, ' '));
type RecordSource = { commit?: string; dirty?: boolean; files?: Record<string, string> };

/** Supports both retained pre-monorepo revisions and current studio commits. */
export function historicalSource(dsRoot: string, commit: string, path: string): Buffer | undefined {
  let prefix = '';
  try { prefix = execFileSync('git', ['rev-parse', '--show-prefix'], { cwd: dsRoot, encoding: 'utf8' }).trim(); } catch { return; }
  for (const candidate of [...new Set([prefix + path, path])]) {
    try { return execFileSync('git', ['show', `${commit}:${candidate}`], { cwd: dsRoot, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { /* Try the older repository layout. */ }
  }
}

export function rootConnections(root: string, dsRoot: string, manifestPath?: string, direct = false) {
  const read = (path: string): RecordSource => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  const lock = existsSync(join(root, 'sync.lock.json')) ? JSON.parse(readFileSync(join(root, 'sync.lock.json'), 'utf8'))['Design system 1'] as RecordSource | undefined : undefined;
  const manifest = manifestPath ? read(join(root, manifestPath)) : undefined;
  const cache = new Map<string, { column: string; verified: boolean; issues: string[] }[]>();
  const directClean = direct && !execFileSync('git', ['status', '--porcelain', '--', 'DS1'], { cwd: dsRoot, encoding: 'utf8' }).trim();
  const localPath = (from: string, address: string) => {
    if (/^(?:https?:|data:|\/\/)/.test(address)) return undefined;
    const path = address.split('?')[0]!;
    const full = path.startsWith('/') ? resolve(root, 'public', '.' + path) : resolve(dirname(from), path);
    return full.startsWith(resolve(root) + '/') && existsSync(full) && statSync(full).isFile() ? full : undefined;
  };
  const visit = (full: string, active = new Set<string>()): { column: string; verified: boolean; issues: string[] }[] => {
    if (active.has(full)) return [];
    if (cache.has(full)) return cache.get(full)!;
    active.add(full);
    const body = readFileSync(full), path = relative(root, full), name = basename(full);
    const manifestFile = manifestPath ? relative(dirname(join(root, manifestPath)), full) : '';
    const source = lock?.files?.[path] ? lock : manifest?.files?.[manifestFile] ? manifest : undefined;
    const key = source === lock ? path : manifestFile;
    const own = direct && full.startsWith(resolve(dsRoot, 'DS1') + '/');
    const recognizable = own || Boolean(source) || /(?:^|\/)(?:ds1|design|design-system-1|1-root)(?:\/|$)/i.test(path);
    const result: { column: string; verified: boolean; issues: string[] }[] = [];
    if (columns[name] && recognizable) {
      const original = source?.commit && historicalSource(dsRoot, source.commit, `DS1/1-root/${name}`);
      const verified = own ? Boolean(directClean) : Boolean(!source?.dirty && original && sha(original) === source?.files?.[key] && sha(body) === source.files[key]);
      result.push({ column: columns[name]!, verified, issues: verified ? [] : [`Root stylesheet not verified: ${path}`] });
    }
    for (const match of uncomment(body.toString()).matchAll(cssImports)) {
      const next = localPath(full, match[1]!);
      if (next) result.push(...visit(next, active));
    }
    active.delete(full);
    cache.set(full, result);
    return result;
  };
  return (file: string, source: string, cells: Record<string, ComponentCell>) => {
    // Copied foundation internals are dependencies, not authored product connections.
    const manifestFile = manifestPath ? relative(dirname(join(root, manifestPath)), join(root, file)) : '';
    if (lock?.files?.[file] || manifest?.files?.[manifestFile]) return;
    const connections: { address: string; at: number }[] = [];
    if (/\.[cm]?[jt]sx?$/.test(file)) {
      const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && /\.css(?:\?|$)/.test(node.moduleSpecifier.text)) connections.push({ address: node.moduleSpecifier.text, at: node.getStart(syntax) });
        ts.forEachChild(node, visit);
      };
      visit(syntax);
    } else {
      for (const match of uncomment(source).matchAll(file.endsWith('.css') ? cssImports : imports)) connections.push({ address: match[1]!, at: match.index });
    }
    for (const { address, at } of connections) {
      const full = localPath(resolve(root, file), address);
      if (!full) continue;
      const found = visit(full);
      for (const column of new Set(found.map(item => item.column))) {
        const evidence = found.filter(item => item.column === column), cell = cells[column]!;
        const verified = evidence.every(item => item.verified), kind = verified ? 'styled' : 'unverified';
        cell[kind]++;
        cell.sites.push({ file, line: source.slice(0, at).split('\n').length, tag: address, kind });
        cell.issues = [...new Set([...cell.issues, ...evidence.flatMap(item => item.issues)])];
        cell.snapshot = cell.unverified ? 'unverified' : 'verified';
      }
    }
  };
}
