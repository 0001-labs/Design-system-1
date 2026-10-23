import type { LayoutExample } from './layout-examples';
import { icon, library, text } from './library-example-parts';

const issues = [
  ['Fleet connectivity resilience', 'Reduce rider impact during intermittent vehicle network connectivity.', 'Infrastructure', 1, 'Done', 'High', 'globe'],
  ['Unprotected turn strategy', 'Improve planning for unprotected turns at busy intersections.', 'Vehicle intelligence', 1, 'In progress', 'High', 'car'],
  ['Incident response playbooks', 'Standardise procedures for handling production incidents.', 'Infrastructure', 1, 'Done', 'Medium', 'page'],
  ['Disaster recovery drills', 'Test regional recovery scenarios on a recurring basis.', 'Infrastructure', 1, 'Planned', 'Medium', 'refresh'],
  ['Map tile streaming', 'Reduce map loading delays under poor network conditions.', 'Mobile apps', 2, 'In progress', 'High', 'map'],
  ['Local payment methods', 'Support local payment methods and billing requirements in Japan.', 'Japan expansion', 2, 'At risk', 'High', 'bag'],
  ['Backend latency reduction', 'Improve response times for core ride and dispatch services.', 'Infrastructure', 2, 'In progress', 'High', 'building'],
  ['Multi-agent prediction', 'Improve prediction accuracy in dense traffic situations.', 'Vehicle intelligence', 2, 'Planned', 'Medium', '2xgrid'],
  ['Build pipeline hardening', 'Reduce flaky tests and keep release builds reliable.', 'Infrastructure', 2, 'Planned', 'Low', 'code'],
  ['Offline mode', 'Keep essential trip information available when connectivity is lost.', 'Mobile apps', 3, 'Planned', 'High', 'phone'],
  ['Autoscaling improvements', 'Tune capacity for peak demand periods.', 'Infrastructure', 3, 'Planned', 'Medium', 'building'],
  ['Android interface parity', 'Align Android behaviour with the updated iOS designs.', 'Mobile apps', 3, 'Planned', 'Medium', 'phone'],
  ['Tokyo launch', 'Prepare the initial autonomous service rollout in Tokyo.', 'Japan expansion', 4, 'In progress', 'High', 'globe'],
  ['Geofencing boundaries', 'Define and validate initial service area boundaries.', 'Japan expansion', 4, 'Planned', 'Medium', 'map'],
  ['Kyoto launch', 'Prepare a limited service rollout in Kyoto.', 'Japan expansion', 4, 'Planned', 'Low', 'globe'],
  ['Ride arrival accuracy', 'Reduce arrival-time jitter during live trips.', 'Mobile apps', 4, 'Planned', 'Low', 'refresh'],
].map(([title, description, team, quarter, status, priority, glyph], index) => ({ id: `RD-${101 + index}`, title, description, team, quarter, status, priority, glyph }));
const statuses = ['Planned', 'In progress', 'At risk', 'Done'];
const teams = ['Infrastructure', 'Mobile apps', 'Vehicle intelligence', 'Japan expansion'];
const select = (id: string, label: string, values: string[]) => `<ds-select><select id="${id}" aria-label="${label}">${values.map(value => `<option>${value}</option>`).join('')}</select></ds-select>`;

export const ISSUE_TRACKER_EXAMPLE: LayoutExample = {
  name: 'Issue tracker',
  use: 'A quarterly roadmap and working issue list, drawn with Slate: a dark library on a finer 10px unit.',
  height: 850,
  library: library('slate'),
  html: `<style>
.issue-app { --ds-page-measure:100%; --ds-page-flow:calc(2 * var(--ds-unit)); min-height:100vh; }
.issue-app::part(page) { padding:calc(2 * var(--ds-unit)); }
.issue-app *, .issue-dialog * { box-sizing:border-box; }
.issue-app [hidden], .issue-dialog [hidden] { display:none !important; }
.issue-top, .issue-heading, .issue-toolbar, .issue-actions, .issue-quarter-head, .issue-card-top, .issue-card-foot { display:flex; align-items:center; gap:var(--ds-unit); min-width:0; }
.issue-top { min-height:calc(5 * var(--ds-unit)); border-bottom:1px solid var(--ds-border-color); flex-wrap:wrap; padding-bottom:var(--ds-unit); }
.issue-brand { display:flex; align-items:center; gap:var(--ds-unit); margin-right:calc(2 * var(--ds-unit)); }
.issue-brand ds-icon { color:var(--ds-accent-color); }
.issue-top > ds-text { margin-left:auto; }
.issue-heading { justify-content:space-between; padding-top:calc(2 * var(--ds-unit)); flex-wrap:wrap; }
.issue-heading h1 { font:500 calc(20px * var(--ds-sf))/calc(30px * var(--ds-sf)) var(--ds-typeface-medium); margin:0; }
.issue-subtitle { margin-top:var(--ds-unit); }
.issue-toolbar { justify-content:space-between; flex-wrap:wrap; border-bottom:1px solid var(--ds-border-color); padding-block:calc(2 * var(--ds-unit)); }
.issue-actions { flex-wrap:wrap; }
.issue-search { width:calc(22 * var(--ds-unit)); max-width:100%; }
.issue-count { color:var(--ds-text-color-muted); font-variant-numeric:tabular-nums; }
.issue-board { display:grid; grid-template-columns:repeat(4,minmax(calc(26 * var(--ds-unit)),1fr)); gap:calc(2 * var(--ds-unit)); overflow-x:auto; padding:var(--ds-unit) 2px calc(2 * var(--ds-unit)); align-items:start; }
.issue-column { display:grid; gap:var(--ds-unit); min-width:0; }
.issue-quarter-head { min-height:calc(4 * var(--ds-unit)); padding-inline:var(--ds-unit); }
.issue-quarter-head ds-button { margin-left:auto; }
.issue-card { min-height:calc(16 * var(--ds-unit)); }
.issue-card::part(card) { border:1px solid var(--ds-border-color); }
.issue-card-body { display:flex; flex-direction:column; gap:var(--ds-unit); min-height:calc(12 * var(--ds-unit)); }
.issue-card-top { align-items:flex-start; }
.issue-card-top > ds-text { flex:1; }
.issue-card-top > ds-icon { flex:none; color:var(--ds-text-color-muted); }
.issue-description { flex:1; }
.issue-card-foot { justify-content:space-between; color:var(--ds-text-color-muted); }
.issue-status { width:calc(10px * var(--ds-sf)); height:calc(10px * var(--ds-sf)); border:1px dashed var(--ds-text-color-muted); border-radius:50%; display:inline-block; flex:none; margin-top:calc(5px * var(--ds-sf)); }
.issue-status[data-status="In progress"] { border:2px solid var(--ds-warning-color); background:linear-gradient(90deg,var(--ds-warning-color) 50%,transparent 50%); }
.issue-status[data-status="Done"] { border:0; background:var(--ds-success-color); }
.issue-status[data-status="At risk"] { border:0; background:var(--ds-danger-color); }
.issue-board[data-view="list"] { grid-template-columns:minmax(0,1fr); }
.issue-board[data-view="list"] .issue-card { min-height:0; }
.issue-board[data-view="list"] .issue-card-body { min-height:0; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
.issue-board[data-view="list"] .issue-description { display:none; }
.issue-board[data-view="list"] .issue-card-foot { justify-content:flex-end; }
.issue-library { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,calc(32 * var(--ds-unit))),1fr)); gap:calc(4 * var(--ds-unit)); padding-block:calc(2 * var(--ds-unit)); }
.issue-library section { display:grid; align-content:start; gap:calc(2 * var(--ds-unit)); }
.issue-library h2 { margin:0; font:500 calc(14px * var(--ds-sf))/calc(20px * var(--ds-sf)) var(--ds-typeface-medium); }
.issue-swatches { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--ds-unit); }
.issue-swatch { height:calc(6 * var(--ds-unit)); border:1px solid var(--ds-border-color); border-radius:var(--ds-radius); margin-bottom:var(--ds-unit); }
.issue-token { display:flex; justify-content:space-between; gap:var(--ds-unit); padding-block:var(--ds-unit); border-bottom:1px solid var(--ds-border-color); }
.issue-ruler { height:calc(4 * var(--ds-unit)); background:repeating-linear-gradient(90deg,var(--ds-accent-color) 0 1px,transparent 1px var(--ds-unit)); border-block-end:1px solid var(--ds-accent-color); }
.issue-dialog { --ds-overlay-width:calc(50 * var(--ds-unit)); }
.issue-form { display:grid; gap:calc(2 * var(--ds-unit)); }
.issue-form label { display:grid; gap:var(--ds-unit); min-width:0; }
.issue-form ds-input { width:100%; }
.issue-form .issue-properties { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:calc(2 * var(--ds-unit)); }
.issue-footer { display:flex; justify-content:space-between; gap:var(--ds-unit); flex-wrap:wrap; padding-top:var(--ds-unit); color:var(--ds-text-color-muted); }
@media(max-width:600px) {
  .issue-top > ds-text { display:none; }
  .issue-board { grid-template-columns:repeat(4,minmax(calc(25 * var(--ds-unit)),85%)); scroll-snap-type:x proximity; }
  .issue-column { scroll-snap-align:start; }
  .issue-board[data-view="list"] .issue-card-body { grid-template-columns:1fr; }
  .issue-board[data-view="list"] .issue-card-foot { justify-content:space-between; }
  .issue-search { width:100%; }
  .issue-toolbar > .issue-actions { width:100%; }
}
</style>
<ds-page layout="column" class="issue-app" data-ds-surface>
  <div slot="header" class="issue-top">
    <div class="issue-brand">${icon('2xgrid')}${text('Roadway', 'strong')}</div>
    <ds-tabs aria-label="Workspace views">
      <ds-button control="host" data-page="roadmap" active aria-pressed="true">Roadmap</ds-button>
      <ds-button control="host" data-page="library" aria-pressed="false">Library</ds-button>
    </ds-tabs>
    ${text('Workspace / Engineering', 'tone="muted"')}
    <ds-avatar initial="AK" label="Alex Kim" color="var(--ds-accent-color)"></ds-avatar>
  </div>
  <section id="issue-roadmap">
    <div class="issue-heading"><div><h1>Product roadmap</h1><div class="issue-subtitle">${text('From the next release to the next city.', 'tone="muted" wrap')}</div></div>
      <ds-button primary id="issue-new">${icon('plus')}<span>New issue</span></ds-button>
    </div>
    <div class="issue-toolbar">
      <div class="issue-actions"><ds-tabs aria-label="Issue layout"><ds-button control="host" data-view="board" active aria-pressed="true">${icon('2xgrid')}<span>Board</span></ds-button><ds-button control="host" data-view="list" aria-pressed="false">${icon('lists')}<span>List</span></ds-button></ds-tabs>
      ${select('issue-team', 'Filter by team', ['All teams', ...teams])}</div>
      <div class="issue-actions"><ds-input variant="field" class="issue-search" id="issue-search" type="search" aria-label="Search issues" placeholder="Search issues…"></ds-input>${text('2026', 'tone="muted"')}</div>
    </div>
    <div class="issue-board" id="issue-board" data-view="board" role="region" aria-label="Quarterly issue board" tabindex="0"></div>
    <ds-empty id="issue-empty" heading="No matching issues" text="Try another search or choose All teams." hidden></ds-empty>
    <div class="issue-footer">${text('', 'id="issue-count" role="status" aria-live="polite"')}${text('Example workspace · Changes last until you reload', 'size="small" wrap')}</div>
  </section>
  <section id="issue-library" hidden>
    <div class="issue-heading"><div><h1>Slate library</h1><div class="issue-subtitle">${text('The same components. A finer grid.', 'tone="muted" wrap')}</div></div><ds-button secondary control="slotted"><a href="/examples/libraries/slate.css" download="slate.css">${icon('download')}<span>Download CSS</span></a></ds-button></div>
    <div class="issue-library">
      <section><h2>Colour</h2><div class="issue-swatches">${[['Paper','--ds-paper'],['Surface','--ds-fill'],['Border','--ds-border-color'],['Text','--ds-text-color'],['Muted','--ds-text-color-muted'],['Accent','--ds-accent-color']].map(([label,token]) => `<div><div class="issue-swatch" style="background:var(${token})"></div>${text(label,'size="small"')}</div>`).join('')}</div>${text('Dark paper, quiet surfaces and a lavender accent. Status colours always carry a label.', 'tone="muted" wrap')}</section>
      <section><h2>Space & type</h2><div class="issue-ruler" aria-label="10 pixel spacing grid"></div>${[['Base unit','10px'],['Control row','30px'],['Control face','26px'],['Body text','14px / 20px'],['Card inset','20px'],['Corner','4px']].map(([name,value])=>`<div class="issue-token">${text(name)}${text(value,'tone="muted"')}</div>`).join('')}</section>
      <section><h2>Components</h2><div class="issue-actions"><ds-button primary id="issue-specimen-new">New issue</ds-button><ds-button secondary id="issue-specimen-board">Back to roadmap</ds-button></div><ds-input variant="field" placeholder="A shared input" aria-label="Library input specimen"></ds-input>${select('issue-specimen-status','Library status specimen',statuses)}<div class="issue-actions">${statuses.map(status=>`<span class="issue-status" data-status="${status}" aria-hidden="true"></span>${text(status)}`).join('')}</div>${text('Buttons, cards, fields, menus and overlays use the shared DS1 elements. Slate changes their public tokens.', 'tone="muted" wrap')}</section>
    </div>
  </section>
</ds-page>
<ds-overlay id="issue-editor" class="issue-dialog">
  <dialog aria-labelledby="issue-editor-heading"><header class="issue-heading"><ds-text literal strong id="issue-editor-heading">New issue</ds-text><ds-button icon data-close label="Close">${icon('close')}</ds-button></header>
    <form class="issue-form" id="issue-form">
      <label>${text('Title')}<ds-input variant="field" id="issue-title" aria-label="Issue title" placeholder="What needs to happen?"></ds-input></label>
      <label>${text('Description')}<ds-input variant="field" id="issue-description" multiline rows="3" aria-label="Issue description" placeholder="Add a little context"></ds-input></label>
      <div class="issue-properties"><label>${text('Team')}${select('issue-edit-team','Issue team',teams)}</label><label>${text('Quarter')}${select('issue-quarter','Issue quarter',['Q1','Q2','Q3','Q4'])}</label><label>${text('Status')}${select('issue-status','Issue status',statuses)}</label><label>${text('Priority')}${select('issue-priority','Issue priority',['Low','Medium','High'])}</label></div>
      <ds-text literal tone="danger" id="issue-error" role="alert" hidden>Give this issue a title.</ds-text>
      <div class="issue-actions"><ds-button primary id="issue-save">Create issue</ds-button><ds-button secondary data-close>Cancel</ds-button></div>
    </form>
  </dialog>
</ds-overlay>`,
  script: `
const issues = ${JSON.stringify(issues)};
const root = document.querySelector('.issue-app');
const board = document.querySelector('#issue-board');
const editor = document.querySelector('#issue-editor');
const field = name => document.querySelector('#issue-' + name);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let selected = null;
let nextId = 117;
function render() {
  const query = field('search').value.trim().toLowerCase();
  const team = field('team').value;
  const matches = issues.filter(issue => (team === 'All teams' || issue.team === team) && (issue.id + ' ' + issue.title + ' ' + issue.description).toLowerCase().includes(query));
  board.innerHTML = [1,2,3,4].map(quarter => {
    const group = matches.filter(issue => issue.quarter === quarter);
    return '<section class="issue-column" aria-label="Quarter ' + quarter + '"><div class="issue-quarter-head"><ds-text literal strong>Q' + quarter + '</ds-text><ds-text literal tone="muted">2026</ds-text><span class="issue-count">' + group.length + '</span><ds-button icon data-quarter="' + quarter + '" label="Add issue to Q' + quarter + '"><ds-icon type="plus"></ds-icon></ds-button></div>' + group.map(issue => '<ds-card interactive class="issue-card" padding="large" data-id="' + issue.id + '" aria-label="' + escape(issue.id + ': ' + issue.title + ', ' + issue.status) + '"><div class="issue-card-body"><div class="issue-card-top"><ds-icon type="' + issue.glyph + '" aria-hidden="true"></ds-icon><ds-text literal wrap strong>' + escape(issue.title) + '</ds-text><span class="issue-status" data-status="' + issue.status + '" role="img" aria-label="' + issue.status + '" data-tooltip="' + issue.status + ' · ' + issue.priority + ' priority"></span></div><ds-text literal wrap tone="muted" class="issue-description">' + escape(issue.description) + '</ds-text><div class="issue-card-foot"><ds-text literal size="small">' + escape(issue.team) + '</ds-text><ds-text literal size="small" tone="muted">' + issue.id + '</ds-text></div></div></ds-card>').join('') + '</section>';
  }).join('');
  field('empty').hidden = matches.length > 0;
  field('count').textContent = matches.length + ' of ' + issues.length + ' issues';
}
function showPage(name) {
  field('roadmap').hidden = name !== 'roadmap'; field('library').hidden = name !== 'library';
  root.querySelectorAll('[data-page]').forEach(button => { const active = button.dataset.page === name; button.toggleAttribute('active', active); button.setAttribute('aria-pressed', String(active)); });
}
function edit(issue, quarter = 2) {
  selected = issue;
  field('editor-heading').textContent = issue ? issue.id : 'New issue';
  field('title').value = issue?.title ?? '';
  field('description').value = issue?.description ?? '';
  field('edit-team').value = issue?.team ?? 'Infrastructure';
  field('quarter').value = 'Q' + (issue?.quarter ?? quarter);
  field('status').value = issue?.status ?? 'Planned';
  field('priority').value = issue?.priority ?? 'Medium';
  field('save').textContent = issue ? 'Save changes' : 'Create issue';
  field('error').hidden = true;
  editor.open = true;
}
function save() {
  const title = field('title').value.trim();
  if (!title) { field('error').hidden = false; field('title').focus(); return; }
  const values = { title, description: field('description').value.trim(), team: field('edit-team').value, quarter: Number(field('quarter').value.slice(1)), status: field('status').value, priority: field('priority').value };
  if (selected) Object.assign(selected, values);
  else issues.push({ id: 'RD-' + nextId++, glyph: 'page', ...values });
  editor.open = false;
  showPage('roadmap'); render();
}
root.addEventListener('click', event => {
  const button = event.target.closest('ds-button');
  if (!button) return;
  if (button.dataset.page) showPage(button.dataset.page);
  if (button.dataset.view) { board.dataset.view = button.dataset.view; root.querySelectorAll('[data-view]').forEach(item => { if (item.tagName !== 'DS-BUTTON') return; const active = item === button; item.toggleAttribute('active', active); item.setAttribute('aria-pressed', String(active)); }); }
  if (button.dataset.quarter) edit(null, Number(button.dataset.quarter));
});
board.addEventListener('ds-card-press', event => { const id = event.target.dataset.id; edit(issues.find(issue => issue.id === id)); });
field('new').addEventListener('click', () => edit(null));
field('specimen-new').addEventListener('click', () => edit(null));
field('specimen-board').addEventListener('click', () => showPage('roadmap'));
field('search').addEventListener('input', render);
field('team').addEventListener('change', render);
field('save').addEventListener('click', save);
field('form').addEventListener('submit', event => { event.preventDefault(); save(); });
editor.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => { editor.open = false; }));
render();
`,
};
