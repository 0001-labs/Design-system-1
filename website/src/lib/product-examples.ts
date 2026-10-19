import type { LayoutExample } from './layout-examples';

// Composition only: all visual controls, type, colours and image frames come from DS1.
const composition = `<style>
.example-stack { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--ds-unit); min-width:0; align-content:start; }
.example-tight { display:grid; grid-template-columns:minmax(0,1fr); gap:calc(var(--ds-unit) / 2); min-width:0; align-content:start; }
.example-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--ds-unit); }
.example-two { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:calc(2 * var(--ds-unit)); align-items:start; }
.example-actions { display:flex; flex-wrap:wrap; align-items:flex-end; gap:calc(var(--ds-unit) / 2); }
.example-between { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); }
.example-grow { flex:1; min-width:0; }
.example-section { padding-block:var(--ds-unit); }
.example-between > ds-input { width:calc(10 * var(--ds-unit)); max-width:100%; }
.example-overflow { overflow-x:auto; }
.example-rule { border-top:1px solid var(--ds-border-color); padding-top:var(--ds-unit); }
.example-caption { display:flex; justify-content:space-between; gap:var(--ds-unit); }
.example-caption > * { min-width:0; }
.example-nav { display:flex; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); }
.example-brand { flex:none; }
.example-footer { padding-top:var(--ds-unit); }
.example-stack [hidden], .example-grid [hidden], .example-two [hidden], .example-tight [hidden] { display:none!important; }
.example-status:empty { display:none; }
.example-title { --ds-sf:calc(2 * var(--sf, 1)); --ds-display-text-size:40px; --ds-typeface-regular:var(--typeface-compressed); }
.example-copy { max-width:calc(24 * var(--ds-unit)); }
.example-shop-hero { display:grid; grid-template-columns:2fr 3fr; gap:var(--ds-unit); align-items:stretch; }
.example-shop-intro { display:flex; flex-direction:column; justify-content:space-between; gap:calc(2 * var(--ds-unit)); padding-block:var(--ds-unit); }
.example-shop-hero ds-image { align-self:start; }
.example-story { display:grid; grid-template-columns:1fr 2fr; gap:calc(2 * var(--ds-unit)); padding-block:calc(2 * var(--ds-unit)); }
.example-product { display:grid; gap:calc(var(--ds-unit) / 2); min-width:0; }
.example-bag { padding-block:var(--ds-unit); border-block:1px solid var(--ds-border-color); }
.example-workspace { --ds-page-nav:calc(8 * var(--ds-unit)); --ds-page-gap:calc(2 * var(--ds-unit)); }
.example-workspace-nav { display:grid; gap:calc(2 * var(--ds-unit)); }
.example-week { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:calc(var(--ds-unit) / 2); }
.example-day { display:grid; gap:calc(var(--ds-unit) / 2); min-height:calc(4 * var(--ds-unit)); padding-block:calc(var(--ds-unit) / 2); border-top:1px solid var(--ds-border-color); }
.example-day[aria-current] { border-top-color:var(--ds-text-color); }
.example-work { display:grid; grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:calc(2 * var(--ds-unit)); }
.example-brief { display:grid; gap:calc(var(--ds-unit) / 2); }
.example-contact-sheet { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:calc(var(--ds-unit) / 2); }
.example-contact-sheet > :first-child { grid-column:1 / -1; }
.example-item { box-sizing:border-box; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:calc(var(--ds-unit) / 2); min-height:var(--ds-unit); align-items:end; border-bottom:1px solid var(--ds-border-color); }
.example-item label { display:flex; align-items:flex-end; gap:calc(var(--ds-unit) / 2); min-width:0; }
.example-item label ds-text { flex:1; }
.example-item-meta { display:flex; align-items:flex-end; gap:calc(var(--ds-unit) / 2); }
#balance-stat { --ds-stat-size:40px; --ds-stat-lines:3; --ds-stat-typeface:var(--typeface-compressed); }
.example-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--ds-unit); }
.example-cash { display:grid; grid-template-columns:minmax(0,3fr) minmax(0,1fr); gap:calc(2 * var(--ds-unit)); }
.example-goal { display:grid; grid-template-columns:calc(6 * var(--ds-unit)) minmax(0,1fr); gap:var(--ds-unit); align-items:center; }
.example-audio-hero { display:grid; grid-template-columns:1fr 1fr; gap:var(--ds-unit); }
.example-audio-copy { display:flex; flex-direction:column; justify-content:space-between; gap:var(--ds-unit); padding:var(--ds-unit); background:var(--one-pink-pastel); }
.example-audio-copy .example-title { --ds-typeface-regular:var(--typeface-regular); }
.example-audio-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--ds-unit); padding-block:var(--ds-unit); }
.example-audio-detail { display:grid; grid-template-columns:1fr 1fr; gap:calc(2 * var(--ds-unit)); align-items:center; }
.example-package { display:grid; grid-template-columns:1fr 1fr; gap:calc(2 * var(--ds-unit)); padding-block:calc(2 * var(--ds-unit)); }
.example-specs { display:grid; gap:0; }
.example-specs > div { display:flex; justify-content:space-between; gap:var(--ds-unit); border-bottom:1px solid var(--ds-border-color); padding-block:calc(var(--ds-unit) / 2); }
@media(max-width:900px) { .example-title { --ds-sf:var(--sf, 1); } .example-work { grid-template-columns:1fr; } .example-brief { grid-template-columns:1fr 1fr; gap:var(--ds-unit); } .example-cash { grid-template-columns:minmax(0,1fr); } }
@media(max-width:600px) {
 .example-title { --ds-sf:var(--sf, 1); --ds-display-text-size:30px; }
 .example-shop-hero,.example-audio-hero,.example-audio-detail,.example-package,.example-two,.example-story,.example-brief { grid-template-columns:1fr; gap:var(--ds-unit); }
 .example-shop-intro { padding-block:0; gap:var(--ds-unit); }
 .example-shop-hero { --hero-ratio:4 / 3; }
 .example-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--ds-unit) calc(var(--ds-unit) / 2); }
 .example-grid > :first-child { grid-column:1 / -1; }
 .example-stats { grid-template-columns:repeat(2,minmax(0,1fr)); }
 .example-stats > :first-child { grid-column:1 / -1; }
 .example-audio-strip { grid-template-columns:1fr; }
 .example-week { gap:calc(var(--ds-unit) / 2); }
 .example-day { min-height:calc(3 * var(--ds-unit)); }
 .example-day ds-text[size=small] { display:none; }
 .example-nav .example-nav-secondary { display:none; }
 .example-goal { grid-template-columns:calc(4 * var(--ds-unit)) minmax(0,1fr); }
 .example-item { grid-template-columns:1fr; }
 .example-item-meta { padding-inline-start:calc(1.5 * var(--ds-unit)); }
 .example-package { padding-block:var(--ds-unit); }
}
</style>`;
const photo = (name: string, alt: string, ratio = '4 / 3', extra = '') => `<ds-image src="/examples/images/${name}" alt="${alt}" ratio="${ratio}" ${extra}></ds-image>`;
const text = (words: string, attrs = '') => `<ds-text literal ${attrs}>${words}</ds-text>`;
const heading = (words: string, level = 2) => text(words, `size="display" strong wrap role="heading" aria-level="${level}"`);
const title = (words: string) => text(words, 'size="display" class="example-title" wrap role="heading" aria-level="1"');
const icon = (type: string) => `<ds-icon type="${type}" aria-hidden="true"></ds-icon>`;
const footer = `<div slot="footer" class="example-footer">${text('Fictional demo. Your changes stay here.', 'size="small" tone="muted" wrap')}</div>`;

export const PRODUCT_EXAMPLES: Record<string, LayoutExample> = {
  shop: {
    name: 'Shop', use: 'An editorial furniture catalogue, with a full collection and an itemised shopping bag.', height: 820,
    html: `${composition}<ds-page layout="column" measure="52" data-ds-surface>
      <div slot="header" class="example-nav">${text('Room', 'strong size="display" class="example-brand"')}<div class="example-actions"><ds-button href="#collection">Collection</ds-button><ds-button href="#story" class="example-nav-secondary">About Room</ds-button><ds-button id="bag" secondary>Bag · 0</ds-button></div></div>
      <div class="example-stack">
        <section class="example-shop-hero">
          <div class="example-shop-intro"><div class="example-tight">${text('Furniture, objects & everyday rituals', 'size="small" tone="muted" wrap')}${title('A room is never really finished.')}</div><div class="example-stack example-copy"><div data-ds-prose><p>A chair pulled up. A cup set down. A few things that make a place your own.</p></div><div><ds-button href="#collection" primary>Find your next favourite ${icon('down')}</ds-button></div>${text('The autumn collection', 'size="small" tone="muted"')}</div></div>
          ${photo('room.jpg', 'A cane chair in a room filled with afternoon light', 'var(--hero-ratio, 6 / 5)', 'loading="eager" position="50% 75%"')}
        </section>
        <div class="example-caption">${text('Good things. Kept for years.', 'size="small" tone="muted"')}${text('Made for living', 'size="small" tone="muted"')}</div>
        <section id="collection" class="example-stack example-section">
          <div class="example-between">${heading('The everyday collection')}<div class="example-actions" role="group" aria-label="Filter collection"><ds-button control="host" data-category="all" active aria-pressed="true">All</ds-button><ds-button control="host" data-category="furniture" aria-pressed="false">Furniture</ds-button><ds-button control="host" data-category="objects" aria-pressed="false">Objects</ds-button></div></div>
          <div class="example-grid">
            <article class="example-product" data-product="furniture">${photo('chair.jpg', 'Everyday chair, a wooden chair with a slatted back', '1')}<div class="example-caption">${text('Everyday chair', 'strong wrap')}${text('€180')}</div>${text('Wood, with a little character.', 'tone="muted" size="small" wrap')}<div><ds-button secondary data-add="Everyday chair" data-price="180">${icon('plus')} Add to bag</ds-button></div></article>
            <article class="example-product" data-product="objects">${photo('cup.jpg', 'A speckled ceramic cup', '1')}<div class="example-caption">${text('Morning cup', 'strong wrap')}${text('€28')}</div>${text('For the first ten quiet minutes.', 'tone="muted" size="small" wrap')}<div><ds-button secondary data-add="Morning cup" data-price="28">${icon('plus')} Add to bag</ds-button></div></article>
            <article class="example-product" data-product="objects">${photo('forest.webp', 'A sunlit trail through a green forest', '1')}<div class="example-caption">${text('Forest print', 'strong wrap')}${text('€45')}</div>${text('A window into somewhere else.', 'tone="muted" size="small" wrap')}<div><ds-button secondary data-add="Forest print" data-price="45">${icon('plus')} Add to bag</ds-button></div></article>
          </div>
          <ds-text id="shop-status" class="example-status" literal role="status" wrap></ds-text>
          <section id="bag-summary" class="example-stack example-bag" hidden aria-label="Your bag"><div class="example-between">${heading('Your bag')}<ds-button id="clear-bag">Empty bag</ds-button></div><ds-list id="bag-items"></ds-list><ds-text id="bag-content" literal wrap></ds-text></section>
        </section>
        <section id="story" class="example-story example-rule"><div>${heading('Less, but more lived in.')}</div><div class="example-stack"><div data-ds-prose><p>We look for pieces with a useful shape and a reason to stay. Nothing too precious to touch. Nothing that needs a special occasion.</p><p>Put your feet up. Leave the book open. Let the room become yours.</p></div><div class="example-actions"><ds-tag>Useful by nature</ds-tag><ds-tag>Better with time</ds-tag></div></div></section>
      </div>${footer}</ds-page>`,
    script: `const items = new Map();
const bag = document.querySelector('#bag');
const summary = document.querySelector('#bag-summary');
function renderBag() {
 let count=0,total=0; const list=document.querySelector('#bag-items'); list.replaceChildren();
 for(const [name,item] of items){
  count+=item.quantity; total+=item.quantity*item.price;
  const row=document.createElement('ds-row'); row.setAttribute('fill','');
  const words=document.createElement('ds-text'); words.setAttribute('literal',''); words.setAttribute('wrap',''); words.textContent=name+' × '+item.quantity;
  const remove=document.createElement('ds-button'); remove.textContent='Remove'; remove.setAttribute('label','Remove '+name);
  remove.addEventListener('click',()=>{if(--item.quantity===0)items.delete(name);renderBag();document.querySelector('#shop-status').textContent=name+' removed.';});
  row.append(words,remove);list.append(row);
 }
 bag.textContent='Bag · '+count;
 document.querySelector('#bag-content').textContent=count?'Subtotal €'+total+'. No payment is taken in this demo.':'Your bag is empty. Find something in the collection.';
}
document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.add;const item=items.get(name)||{quantity:0,price:Number(button.dataset.price)};item.quantity++;items.set(name,item);renderBag();document.querySelector('#shop-status').textContent=name+' added to your bag.';}));
bag.addEventListener('click',()=>{renderBag();summary.hidden=!summary.hidden;if(!summary.hidden)summary.scrollIntoView({block:'nearest'});});
document.querySelector('#clear-bag').addEventListener('click',()=>{items.clear();renderBag();document.querySelector('#shop-status').textContent='Bag emptied.';});
document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-category]').forEach(item=>{item.toggleAttribute('active',item===button);item.setAttribute('aria-pressed',String(item===button));});
 document.querySelectorAll('[data-product]').forEach(item=>{item.hidden=button.dataset.category!=='all'&&item.dataset.product!==button.dataset.category;});
}));`,
  },
  planner: {
    name: 'Planning app', use: 'A studio launch week, with assignments, progress and an expanding visual brief.', height: 760,
    html: `${composition}<ds-page layout="sidebar" drawer divided fill class="example-workspace" data-ds-surface>
      <div slot="nav" class="example-workspace-nav"><ds-row><ds-avatar initial="S" color="var(--one-zenith-blue)"></ds-avatar>${text('Studio', 'strong')}</ds-row><ds-sidebar label="Studio navigation" id="planner-nav"></ds-sidebar><div class="example-tight">${text('The team', 'size="small" tone="muted"')}<ds-avatar-group label="Project team"><ds-avatar initial="A" color="var(--one-pink)"></ds-avatar><ds-avatar initial="M" color="var(--one-zenith-blue)"></ds-avatar><ds-avatar initial="R" color="var(--one-orange-pastel)"></ds-avatar></ds-avatar-group>${text('Alex, Mika & Ren', 'size="small" tone="muted"')}</div></div>
      <div slot="header" class="example-between">${text('Today', 'strong id="planner-heading"')}<ds-tag>Autumn collection</ds-tag></div>
      <div class="example-stack">
        <div class="example-between"><div class="example-tight">${heading('A good week starts here.',1)}${text('Monday, 19 October. Launch in four days.', 'tone="muted" wrap')}</div><ds-stat id="planner-progress" value="1" figure="1 of 4" label="Ready for launch" literal></ds-stat></div>
        <div class="example-week" aria-label="Launch week">${[['Mon','19','Photographs'],['Tue','20','Design review'],['Wed','21','Print files'],['Thu','22','Final checks'],['Fri','23','Launch day']].map(([day,date,label],i)=>`<div class="example-day" ${i===0?'aria-current="date"':''}>${text(day,'size="small" tone="muted"')}${text(date,'size="display"')}${text(label,'size="small" wrap')}</div>`).join('')}</div>
        <div class="example-work">
          <section class="example-stack"><div class="example-between">${heading('Make it happen')}<ds-tag id="item-count">3 items</ds-tag></div><ds-input id="item-search" type="search" placeholder="Find an item" label="Find an item"></ds-input><div id="work-items"></div><ds-text literal id="planner-empty" tone="muted" wrap hidden>No items here. Try another view or search.</ds-text><div class="example-actions"><ds-input id="new-item" class="example-grow" label="New item" placeholder="What needs doing?"></ds-input><ds-button id="add-item" secondary>${icon('plus')} Add item</ds-button></div><ds-text id="planner-status" class="example-status" literal role="status" wrap></ds-text></section>
          <section class="example-brief"><div class="example-contact-sheet">${photo('room.jpg','Chair by the window: location reference','16 / 7','position="50% 75%"')}${photo('chair.jpg','Wooden chair: product reference','1')}${photo('cup.jpg','Ceramic cup: material reference','1')}</div><div class="example-tight">${text('Collection shoot', 'strong')}${text('Natural light. Familiar objects. An ordinary morning, looked at a little longer.', 'wrap tone="muted"')}${text('Mika added 3 references', 'size="small" tone="muted"')}<ds-button control="slotted"><button id="brief-toggle" type="button" aria-expanded="false" aria-controls="brief-details">Read the brief ${icon('down')}</button></ds-button><div id="brief-details" data-ds-prose hidden><p>Set the chair beside the window. Shoot the full room first, then the grain, the handle and the edge of the cup.</p><p>Deliver six landscape crops and three portraits by Tuesday’s review.</p></div></div></section>
        </div>
        <section class="example-tight example-rule">${text('Coming together', 'strong')}<ds-row><ds-avatar initial="R" color="var(--one-orange-pastel)"></ds-avatar>${text('Ren sent the print files', 'wrap')}<span class="example-grow"></span>${text('09:12', 'size="small" tone="muted"')}</ds-row><ds-row><ds-avatar initial="M" color="var(--one-zenith-blue)"></ds-avatar>${text('Mika added the shoot references', 'wrap')}<span class="example-grow"></span>${text('08:45', 'size="small" tone="muted"')}</ds-row></section>
      </div>${footer}</ds-page>`,
    script: `const navigation = document.querySelector('#planner-nav');
let view = 'today';
const items = [{name:'Choose the final photographs',done:false,owner:'M',due:'Today'},{name:'Review the collection page',done:false,owner:'A',due:'Tue'},{name:'Send the print files',done:true,owner:'R',due:'Done'},{name:'Write the launch note',done:false,owner:'A',due:'Thu'}];
function render() {
 navigation.items = [{id:'today',label:'Today',current:view==='today'},{id:'all',label:'All items',current:view==='all'},{id:'completed',label:'Completed',current:view==='completed'}];
 document.querySelector('#planner-heading').textContent = view === 'completed' ? 'Completed' : view === 'all' ? 'All items' : 'Today';
 const query = document.querySelector('#item-search').value.toLowerCase();
 const list = document.querySelector('#work-items'); list.replaceChildren();
 items.forEach((item,index) => {
  if ((view==='completed' && !item.done) || (view==='today' && item.done) || !item.name.toLowerCase().includes(query)) return;
  const row = document.createElement('div'); row.className='example-item'; const label = document.createElement('label'); label.className = 'example-actions'; const face = document.createElement('ds-checkbox'); const check = document.createElement('input'); check.type='checkbox'; check.checked=item.done; face.append(check); const words=document.createElement('ds-text'); words.setAttribute('literal',''); words.textContent=item.name; words.setAttribute('wrap',''); label.append(face,words); const meta=document.createElement('div'); meta.className='example-item-meta'; const due=document.createElement('ds-text');due.setAttribute('literal','');due.setAttribute('size','small');due.setAttribute('tone','muted');due.textContent=item.due||'Unscheduled';const avatar=document.createElement('ds-avatar');avatar.setAttribute('initial',item.owner||'A');meta.append(due,avatar);
  check.addEventListener('change', () => { item.done = check.checked; document.querySelector('#planner-status').textContent = item.name + (item.done ? ' completed.' : ' reopened.'); render(); });
  row.append(label,meta); list.append(row);
 });
 document.querySelector('#item-count').textContent = list.children.length + ' items';
 document.querySelector('#planner-empty').hidden=Boolean(list.children.length);
 document.querySelector('#planner-progress').figure=items.filter(item=>item.done).length+' of '+items.length;
}
document.querySelector('#brief-toggle').addEventListener('click',event=>{const details=document.querySelector('#brief-details');details.hidden=!details.hidden;event.currentTarget.setAttribute('aria-expanded',String(!details.hidden));});
navigation.addEventListener('sidebar-activate', event => { view = event.detail.id; render(); document.querySelector('ds-page').closeDrawer(); });
document.querySelector('#item-search').addEventListener('input',render);
function add() { const input=document.querySelector('#new-item'); const name=input.value.trim(); if (!name) { input.focus(); return; } items.push({name,done:false}); input.value=''; view='all'; render(); document.querySelector('#planner-status').textContent='Item added.'; }
document.querySelector('#add-item').addEventListener('click',add);
document.querySelector('#new-item').addEventListener('keydown',event => { if(event.key==='Enter') add(); });
render();`,
  },
  finance: {
    name: 'Finance app', use: 'An open ledger whose balances, cash flow and spending follow the selected account.', height: 800,
    html: `${composition}<ds-page layout="sidebar" drawer divided fill class="example-workspace" data-ds-surface>
      <div slot="nav" class="example-workspace-nav"><ds-row><ds-avatar initial="L" color="var(--one-comfortable-green)"></ds-avatar>${text('Ledger','strong')}</ds-row><ds-sidebar label="Accounts" id="finance-nav"></ds-sidebar><div class="example-tight">${text('Your next chapter', 'size="small" tone="muted"')}${photo('lake.jpg','A mountain lake, the destination of a savings goal','4 / 3')}${text('A week away', 'strong')}${text('€2,400 of €3,000 saved', 'size="small" wrap')}<ds-progress value="0.8" label="80% of the savings goal"></ds-progress></div></div>
      <div slot="header" class="example-between">${text('Overview', 'strong')}<div class="example-actions"><ds-tag>Demo data</ds-tag><ds-button id="month" secondary>October</ds-button></div></div>
      <div class="example-stack">
        <div class="example-stats"><ds-stat id="balance-stat" label="Available balance" value="18420" format="money" currency="EUR" whole caption="Across two accounts" literal></ds-stat><ds-stat id="income-stat" label="Money in" value="6200" format="money" currency="EUR" whole caption="2 client payments" literal></ds-stat><ds-stat id="spent-stat" label="Money out" value="408.8" format="money" currency="EUR" caption="3 transactions" literal></ds-stat></div>
        <section class="example-cash example-rule"><div class="example-stack"><div class="example-between">${text('Balance through the month','strong')}${text('1–19 October','size="small" tone="muted" id="chart-period"')}</div><ds-chart id="cash-chart" kind="area" rows="10" color="--one-sharp-blue" labels aria-label="Daily available balance"></ds-chart><div class="example-caption">${text('1 Oct','size="small" tone="muted" id="chart-start"')}${text('19 Oct','size="small" tone="muted" id="chart-end"')}</div></div><div class="example-stack">${text('Where it went','strong')}<div class="example-tight"><div class="example-caption">${text('Production','size="small"')}${text('€280','size="small" id="production-spent"')}</div><ds-progress id="production-ratio" value="0.685" label="Production spending"></ds-progress><div class="example-caption">${text('Travel','size="small"')}${text('€86','size="small" id="travel-spent"')}</div><ds-progress id="travel-ratio" value="0.21" label="Travel spending"></ds-progress><div class="example-caption">${text('Groceries','size="small"')}${text('€42.80','size="small" id="groceries-spent"')}</div><ds-progress id="groceries-ratio" value="0.105" label="Grocery spending"></ds-progress></div>${text('Every outgoing payment, in one place.', 'size="small" tone="muted" wrap')}</div></section>
        <section class="example-stack example-rule"><div class="example-between">${heading('Recent activity')}<ds-input id="transaction-search" type="search" label="Find a transaction" placeholder="Find a transaction"></ds-input></div><div class="example-actions" role="group" aria-label="Transaction type"><ds-button control="host" active data-filter="all" aria-pressed="true">All</ds-button><ds-button control="host" data-filter="income" aria-pressed="false">Money in</ds-button><ds-button control="host" data-filter="expense" aria-pressed="false">Money out</ds-button></div><div class="example-overflow"><ds-table id="transactions" label="Transactions" sticky></ds-table></div><ds-text id="transaction-count" literal role="status" tone="muted" size="small"></ds-text></section>
        <section class="example-goal example-rule">${photo('lake.jpg','Mountains reflected in a still lake','4 / 3')}<div class="example-tight">${text('A little closer to the mountains.', 'strong wrap')}${text('Your next €600 completes the travel fund.', 'wrap tone="muted"')}<ds-progress value="0.8" label="Travel fund: €2,400 of €3,000"></ds-progress></div></section>
      </div>${footer}</ds-page>`,
    script: `const nav = document.querySelector('#finance-nav'); let account='all', filter='all', september=false;
const entries=[{date:'19 Oct',name:'North studio',category:'Client payment',amount:3200,account:'business'},{date:'18 Oct',name:'Corner market',category:'Groceries',amount:-42.80,account:'personal'},{date:'17 Oct',name:'Rail ticket',category:'Travel',amount:-86,account:'personal'},{date:'16 Oct',name:'Print workshop',category:'Production',amount:-280,account:'business'},{date:'15 Oct',name:'Oak house',category:'Client payment',amount:3000,account:'business'}];
const chart=document.querySelector('#cash-chart');
new ResizeObserver(()=>{chart.unit=20*(parseFloat(getComputedStyle(chart).getPropertyValue('--ds-sf'))||1);}).observe(chart);
chart.format=value=>'€'+Math.round(value).toLocaleString('en-IE');
const table=document.querySelector('#transactions'); table.columns=[{key:'date',label:'Date'},{key:'name',label:'Name'},{key:'category',label:'Category'},{key:'amount',label:'Amount',numeric:true}];
function render() {
 nav.items=[{id:'all',label:'All accounts',current:account==='all'},{id:'personal',label:'Personal',current:account==='personal'},{id:'business',label:'Business',current:account==='business'}];
 const query=document.querySelector('#transaction-search').value.toLowerCase();
 table.data=entries.filter(row => (account==='all'||row.account===account)&&(filter==='all'||(filter==='income'?row.amount>0:row.amount<0))&&(row.name+' '+row.category).toLowerCase().includes(query)).map(row=>({...row,date:row.date.replace('Oct',september?'Sep':'Oct'),amount:new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(row.amount*(september?0.8:1))}));
 document.querySelector('#transaction-count').textContent=table.data.length+' transactions';
 document.querySelector('#month').textContent=september?'September':'October';
 const selected=entries.filter(row=>account==='all'||row.account===account);const factor=september?0.8:1;const income=selected.reduce((sum,row)=>sum+Math.max(0,row.amount),0)*factor;const spent=selected.reduce((sum,row)=>sum+Math.max(0,-row.amount),0)*factor;const opening=(account==='personal'?4428.8:account==='business'?8200:12628.8)*factor;
 document.querySelector('#income-stat').value=income;document.querySelector('#spent-stat').value=spent;document.querySelector('#balance-stat').value=opening+income-spent;document.querySelector('#balance-stat').caption=account==='all'?'Across two accounts':account==='personal'?'Personal account':'Business account';
 document.querySelector('#income-stat').caption=selected.filter(row=>row.amount>0).length+' payments';document.querySelector('#spent-stat').caption=selected.filter(row=>row.amount<0).length+' transactions';
 for(const [id,category] of [['production','Production'],['travel','Travel'],['groceries','Groceries']]){const amount=Math.max(0,-selected.filter(row=>row.category===category).reduce((sum,row)=>sum+row.amount,0)*factor);document.querySelector('#'+id+'-spent').textContent=new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(amount);document.querySelector('#'+id+'-ratio').value=spent?amount/spent:0;}
 const month=september?'Sep':'Oct';document.querySelector('#chart-period').textContent='1–19 '+(september?'September':'October');document.querySelector('#chart-start').textContent='1 '+month;document.querySelector('#chart-end').textContent='19 '+month;
 document.querySelector('#cash-chart').timeRange=[0,18*86400];
 document.querySelector('#cash-chart').data=Array.from({length:19},(_,index)=>({time:index*86400,value:opening+selected.filter(row=>Number(row.date.split(' ')[0])<=index+1).reduce((sum,row)=>sum+row.amount,0)*factor}));
}
nav.addEventListener('sidebar-activate', event=>{account=event.detail.id;render();document.querySelector('ds-page').closeDrawer();});
document.querySelector('#month').addEventListener('click',()=>{september=!september;render();});
document.querySelector('#transaction-search').addEventListener('input',render);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>{item.toggleAttribute('active',item===button);item.setAttribute('aria-pressed',String(item===button));});render();}));
render();`,
  },
  product: {
    name: 'Product showcase', use: 'A colourful headphone launch, with product details and a working package choice.', height: 860,
    html: `${composition}<ds-page layout="column" measure="52" data-ds-surface>
      <div slot="header" class="example-nav">${text('Sound / 01', 'strong class="example-brand"')}<div class="example-actions"><ds-button href="#details" class="example-nav-secondary">A closer look</ds-button><ds-button href="#configure" secondary>Choose yours</ds-button></div></div>
      <div class="example-stack">
        <section class="example-audio-hero"><div class="example-audio-copy"><div class="example-tight">${text('For the love of listening.','size="small"')}${title('Press play.<br>Stay a while.')}</div><div class="example-stack"><div data-ds-prose><p>One good pair. Your whole record collection. Meet Sound / 01.</p></div><div><ds-button primary href="#configure">Make it yours · €249 ${icon('right')}</ds-button></div></div></div>${photo('headphones.jpg','Mint headphones resting across pink and blue paper','1','loading="eager" position="50% 50%"')}</section>
        <div class="example-audio-strip"><ds-stat figure="Wired" label="Just plug in" caption="No pairing. No battery." literal></ds-stat><ds-stat figure="Over-ear" label="Settle into the sound" caption="Soft, full-size cushions" literal></ds-stat><ds-stat figure="Ice blue" label="A little colour" caption="An everyday favourite" literal></ds-stat></div>
        <section id="details" class="example-audio-detail example-rule">${photo('headphones.jpg','A closer view of the headphone cushions and cable','1','position="50% 60%"')}<div class="example-stack">${heading('Nothing between you and the next track.')}<div data-ds-prose><p>Albums deserve more than background noise. Put the phone down, find the comfortable chair and listen all the way through.</p></div><div class="example-specs"><div>${text('Connection','tone="muted"')}${text('3.5 mm cable')}</div><div>${text('Fit','tone="muted"')}${text('Over-ear')}</div><div>${text('Finish','tone="muted"')}${text('Ice blue')}</div></div></div></section>
        <section id="configure" class="example-package example-rule"><div class="example-stack">${heading('Your next favourite pair.')}<div data-ds-prose><p>Keep it simple, or take a little extra protection for the journey.</p></div>${text('This is a fictional product. No purchase is made.', 'size="small" tone="muted" wrap')}</div><div class="example-stack"><div class="example-between"><ds-stat value="249" format="money" currency="EUR" whole label="Your selection" literal></ds-stat><ds-tag>Ice blue</ds-tag></div><div class="example-actions" role="group" aria-label="Choose package"><ds-button control="host" active data-package="Headphones" aria-pressed="true">Headphones</ds-button><ds-button control="host" data-package="Headphones + travel case" aria-pressed="false">With travel case</ds-button></div><ds-text literal id="package-description" wrap tone="muted">Headphones, cable and the next album on your list.</ds-text><div><ds-button primary id="configure-add">${icon('plus')} Add to bag</ds-button></div><ds-text literal id="product-status" class="example-status" role="status" wrap></ds-text></div></section>
      </div>${footer}</ds-page>`,
    script: `let selection='Headphones';
document.querySelectorAll('[data-package]').forEach(button=>button.addEventListener('click',()=>{selection=button.dataset.package;document.querySelectorAll('[data-package]').forEach(item=>{item.toggleAttribute('active',item===button);item.setAttribute('aria-pressed',String(item===button));});document.querySelector('#configure ds-stat').value=selection==='Headphones'?249:279;document.querySelector('#package-description').textContent=selection==='Headphones'?'Headphones, cable and the next album on your list.':'Headphones, cable and a protective travel case.';document.querySelector('#product-status').textContent='';}));
document.querySelector('#configure-add').addEventListener('click',()=>{document.querySelector('#product-status').textContent=selection+' added to this example bag. No payment is taken.';});`,
  },
};
