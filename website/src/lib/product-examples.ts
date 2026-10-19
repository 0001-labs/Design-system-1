import type { LayoutExample } from './layout-examples';

// Composition only: all visual controls, type, colours and image frames come from DS1.
const composition = `<style>
.example-stack { display:grid; gap:var(--ds-unit); min-width:0; }
.example-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,calc(12 * var(--ds-unit))),1fr)); gap:calc(var(--ds-unit) / 2); }
.example-two { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--ds-unit); align-items:center; }
.example-actions { display:flex; flex-wrap:wrap; align-items:flex-end; gap:calc(var(--ds-unit) / 2); }
.example-grow { flex:1; min-width:0; }
.example-space { padding-block:calc(2 * var(--ds-unit)); }
.example-center { text-align:center; justify-items:center; }
.example-overflow { overflow-x:auto; }
.example-hero { --ds-sf:2; }
.example-stack > [hidden], .example-grid > [hidden] { display:none; }
@media (max-width:600px) { .example-two { grid-template-columns:1fr; } .example-hero { --ds-sf:1.5; } }
</style>`;
const photo = (name: string, alt: string, ratio = '4 / 3', extra = '') => `<ds-image src="/examples/images/${name}" alt="${alt}" ratio="${ratio}" ${extra}></ds-image>`;
const text = (words: string, attrs = '') => `<ds-text literal ${attrs}>${words}</ds-text>`;
const footer = `<ds-row slot="footer"><ds-text literal tone="muted">Interactive example · Changes stay on this page</ds-text></ds-row>`;

export const PRODUCT_EXAMPLES: Record<string, LayoutExample> = {
  shop: {
    name: 'Shop', use: 'A small collection of considered objects, with category filters and a local shopping bag.', height: 820,
    html: `${composition}<ds-page layout="column" measure="56">
      <ds-row slot="header">${text('Room', 'strong')}<span class="example-grow"></span><div class="example-actions"><ds-button href="#collection">Collection</ds-button><ds-button href="#story">Our approach</ds-button><ds-button id="bag">Bag · 0</ds-button></div></ds-row>
      <div class="example-stack">
        <section class="example-two example-space" id="story">
          <div class="example-stack">${text('Objects for everyday living.', 'size="display" strong wrap class="example-hero"')}${text('A good chair. A favourite cup. Fewer things, chosen well.', 'wrap')}<div><ds-button primary href="#collection">Explore the collection</ds-button></div></div>
          ${photo('room.jpg', 'A wooden chair beside soft white curtains', '4 / 3', 'loading="eager"')}
        </section>
        <ds-row id="collection">${text('The collection', 'strong')}<span class="example-grow"></span><ds-tag>Three essentials</ds-tag></ds-row>
        <div class="example-actions" role="group" aria-label="Filter collection"><ds-button data-category="all" active>All</ds-button><ds-button data-category="furniture">Furniture</ds-button><ds-button data-category="objects">Objects</ds-button></div>
        <div class="example-grid">
          <section class="example-stack" data-product="furniture">${photo('chair.jpg', 'A simple brown wooden chair', '1')}<ds-row>${text('Everyday chair', 'strong')}<span class="example-grow"></span>${text('€180')}</ds-row>${text('Solid wood. Made for the long table.', 'tone="muted" wrap')}<div><ds-button secondary data-add="Everyday chair" data-price="180">Add to bag</ds-button></div></section>
          <section class="example-stack" data-product="objects">${photo('cup.jpg', 'A speckled ceramic cup on a quiet grey surface', '1')}<ds-row>${text('Morning cup', 'strong')}<span class="example-grow"></span>${text('€28')}</ds-row>${text('A little room for a slower start.', 'tone="muted" wrap')}<div><ds-button secondary data-add="Morning cup" data-price="28">Add to bag</ds-button></div></section>
          <section class="example-stack" data-product="objects">${photo('forest.webp', 'Sunlight reaching a winding forest path', '1')}<ds-row>${text('Forest print', 'strong')}<span class="example-grow"></span>${text('€45')}</ds-row>${text('A view worth keeping nearby.', 'tone="muted" wrap')}<div><ds-button secondary data-add="Forest print" data-price="45">Add to bag</ds-button></div></section>
        </div>
        <ds-card id="bag-summary" hidden><span slot="title">Your bag</span><ds-text id="bag-content" literal wrap></ds-text><ds-gap unit></ds-gap><ds-button id="clear-bag">Empty bag</ds-button></ds-card>
        <ds-text id="shop-status" literal role="status" wrap></ds-text>
      </div>${footer}</ds-page>`,
    script: `let count = 0, total = 0;
const bag = document.querySelector('#bag');
const summary = document.querySelector('#bag-summary');
function renderBag() { bag.textContent = 'Bag · ' + count; document.querySelector('#bag-content').textContent = count ? count + ' items · €' + total + '. This example does not take payments.' : 'Your bag is empty.'; }
document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => { count++; total += Number(button.dataset.price); renderBag(); document.querySelector('#shop-status').textContent = button.dataset.add + ' added to your bag.'; }));
bag.addEventListener('click', () => { renderBag(); summary.hidden = !summary.hidden; if (!summary.hidden) summary.scrollIntoView({block:'nearest'}); });
document.querySelector('#clear-bag').addEventListener('click', () => { count = total = 0; renderBag(); document.querySelector('#shop-status').textContent = 'Bag emptied.'; });
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
 document.querySelectorAll('[data-category]').forEach(item => { item.toggleAttribute('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
 document.querySelectorAll('[data-product]').forEach(item => { item.hidden = button.dataset.category !== 'all' && item.dataset.product !== button.dataset.category; });
}));`,
  },
  planner: {
    name: 'Planning app', use: 'Projects, a focused daily list and a photo brief, with editable local items.', height: 760,
    html: `${composition}<ds-page layout="sidebar" drawer divided fill>
      <ds-sidebar slot="nav" label="Studio navigation" id="planner-nav"><ds-row slot="header"><ds-avatar initial="S"></ds-avatar>${text('Studio', 'strong')}</ds-row></ds-sidebar>
      <ds-row slot="header">${text('Today', 'strong id="planner-heading"')}<span class="example-grow"></span><ds-avatar initial="A"></ds-avatar></ds-row>
      <div class="example-stack">
        <ds-card tone="apple-green"><span slot="label">Monday, 19 October</span><span slot="title">Room for the important things.</span>${text('A small collection launch. Four things to move forward.', 'wrap')}</ds-card>
        <div class="example-actions"><ds-input id="item-search" type="search" placeholder="Find an item" label="Find an item"></ds-input><ds-tag id="item-count">4 items</ds-tag></div>
        <ds-list id="work-items"></ds-list>
        <div class="example-actions"><ds-input id="new-item" label="New item" placeholder="What needs doing?"></ds-input><ds-button id="add-item" secondary>Add item</ds-button></div>
        <ds-text id="planner-status" literal role="status" wrap></ds-text>
        <section class="example-stack"><ds-row>${text('Collection brief', 'strong')}<span class="example-grow"></span><ds-tag>Reference</ds-tag></ds-row>${photo('room.jpg', 'A quiet room with a single wooden chair', '16 / 7')}${text('Natural light, useful objects and space to breathe. Photograph the chair beside the window.', 'wrap tone="muted"')}</section>
      </div>${footer}</ds-page>`,
    script: `const navigation = document.querySelector('#planner-nav');
let view = 'today';
const items = [{name:'Choose the final photographs',done:false},{name:'Review the collection page',done:false},{name:'Send the print files',done:true},{name:'Write the launch note',done:false}];
function render() {
 navigation.items = [{id:'today',label:'Today',current:view==='today'},{id:'all',label:'All items',current:view==='all'},{id:'completed',label:'Completed',current:view==='completed'}];
 document.querySelector('#planner-heading').textContent = view === 'completed' ? 'Completed' : view === 'all' ? 'All items' : 'Today';
 const query = document.querySelector('#item-search').value.toLowerCase();
 const list = document.querySelector('#work-items'); list.replaceChildren();
 items.forEach((item,index) => {
  if ((view==='completed' && !item.done) || (view==='today' && item.done) || !item.name.toLowerCase().includes(query)) return;
  const row = document.createElement('ds-row'); const label = document.createElement('label'); label.className = 'example-actions'; const face = document.createElement('ds-checkbox'); const check = document.createElement('input'); check.type='checkbox'; check.checked=item.done; face.append(check); const words=document.createElement('ds-text'); words.setAttribute('literal',''); words.textContent=item.name; label.append(face,words);
  check.addEventListener('change', () => { item.done = check.checked; document.querySelector('#planner-status').textContent = item.name + (item.done ? ' completed.' : ' reopened.'); render(); });
  row.append(label); list.append(row);
 });
 document.querySelector('#item-count').textContent = list.children.length + ' items';
}
navigation.addEventListener('sidebar-activate', event => { view = event.detail.id; render(); });
document.querySelector('#item-search').addEventListener('input',render);
function add() { const input=document.querySelector('#new-item'); const name=input.value.trim(); if (!name) { input.focus(); return; } items.push({name,done:false}); input.value=''; view='all'; render(); document.querySelector('#planner-status').textContent='Item added.'; }
document.querySelector('#add-item').addEventListener('click',add);
document.querySelector('#new-item').addEventListener('keydown',event => { if(event.key==='Enter') add(); });
render();`,
  },
  finance: {
    name: 'Finance app', use: 'Balances, monthly cash flow and searchable transactions in one workspace.', height: 800,
    html: `${composition}<ds-page layout="sidebar" drawer divided fill>
      <ds-sidebar slot="nav" label="Accounts" id="finance-nav"><ds-row slot="header"><ds-avatar initial="L"></ds-avatar>${text('Ledger', 'strong')}</ds-row></ds-sidebar>
      <ds-row slot="header">${text('Overview', 'strong')}<span class="example-grow"></span><ds-button id="month" secondary>October</ds-button><ds-tag>Demo data</ds-tag></ds-row>
      <div class="example-stack">
        <div class="example-grid"><ds-card><ds-stat label="Balance" value="18420" format="money" currency="EUR" whole></ds-stat></ds-card><ds-card tone="apple-green"><ds-stat id="income-stat" label="Income" value="6200" format="money" currency="EUR" whole></ds-stat></ds-card><ds-card><ds-stat id="spent-stat" label="Spent" value="2480" format="money" currency="EUR" whole></ds-stat></ds-card></div>
        <ds-card><span slot="title">This month, at a glance</span><ds-chart id="cash-chart" kind="area" rows="9" aria-label="Illustrative daily balance"></ds-chart></ds-card>
        <section class="example-stack">${text('Transactions', 'strong')}<ds-input id="transaction-search" type="search" label="Find a transaction" placeholder="Search transactions"></ds-input></section>
        <div class="example-actions" role="group" aria-label="Transaction type"><ds-button active data-filter="all">All</ds-button><ds-button data-filter="income">Income</ds-button><ds-button data-filter="expense">Expenses</ds-button></div>
        <div class="example-overflow"><ds-table id="transactions" label="Transactions" sticky></ds-table></div>
        <ds-text id="transaction-count" literal role="status"></ds-text>
        <section class="example-two"><ds-card><span slot="label">Savings goal</span><span slot="title">A week in the mountains</span><ds-stat value="2400" format="money" currency="EUR" whole label="Saved of €3,000"></ds-stat><ds-gap unit></ds-gap><ds-ratio value="0.8" label="80% saved"></ds-ratio></ds-card>${photo('lake.jpg', 'Mountains reflected in a calm lake', '16 / 9')}</section>
      </div>${footer}</ds-page>`,
    script: `const nav = document.querySelector('#finance-nav'); let account='all', filter='all', september=false;
const entries=[{date:'19 Oct',name:'North studio',category:'Client payment',amount:3200,account:'business'},{date:'18 Oct',name:'Corner market',category:'Groceries',amount:-42.80,account:'personal'},{date:'17 Oct',name:'Rail ticket',category:'Travel',amount:-86,account:'personal'},{date:'16 Oct',name:'Print workshop',category:'Production',amount:-280,account:'business'},{date:'15 Oct',name:'Oak house',category:'Client payment',amount:3000,account:'business'}];
const table=document.querySelector('#transactions'); table.columns=[{key:'date',label:'Date'},{key:'name',label:'Name'},{key:'category',label:'Category'},{key:'amount',label:'Amount',numeric:true}];
function render() {
 nav.items=[{id:'all',label:'All accounts',current:account==='all'},{id:'personal',label:'Personal',current:account==='personal'},{id:'business',label:'Business',current:account==='business'}];
 const query=document.querySelector('#transaction-search').value.toLowerCase();
 table.data=entries.filter(row => (account==='all'||row.account===account)&&(filter==='all'||(filter==='income'?row.amount>0:row.amount<0))&&(row.name+' '+row.category).toLowerCase().includes(query)).map(row=>({...row,date:row.date.replace('Oct',september?'Sep':'Oct'),amount:new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(row.amount*(september?0.8:1))}));
 document.querySelector('#transaction-count').textContent=table.data.length+' transactions';
 document.querySelector('#month').textContent=september?'September':'October';
 document.querySelector('#income-stat').value=september?4960:6200; document.querySelector('#spent-stat').value=september?1984:2480;
 document.querySelector('#cash-chart').timeRange=[0,8*86400];
 document.querySelector('#cash-chart').data=[12,13,12.5,14,13.5,16,15,17,18.4].map((value,index)=>({time:index*86400,value:value*1000*(september?0.8:1)}));
}
nav.addEventListener('sidebar-activate', event=>{account=event.detail.id;render();});
document.querySelector('#month').addEventListener('click',()=>{september=!september;render();});
document.querySelector('#transaction-search').addEventListener('input',render);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>{item.toggleAttribute('active',item===button);item.setAttribute('aria-pressed',String(item===button));});render();}));
render();`,
  },
  product: {
    name: 'Product showcase', use: 'A spacious product story with photography, specifications and a local configuration.', height: 860,
    html: `${composition}<ds-page layout="column" measure="56">
      <ds-row slot="header">${text('Sound / 01', 'strong')}<span class="example-grow"></span><div class="example-actions"><ds-button href="#details">Details</ds-button><ds-button href="#configure" primary>Choose yours</ds-button></div></ds-row>
      <div class="example-stack">
        <section class="example-stack example-center example-space">${text('A little closer to the music.', 'size="display" strong wrap class="example-hero"')}${text('Over-ear listening. A quieter world. Space for every detail.', 'wrap tone="muted"')}<div class="example-actions"><ds-button href="#configure" primary>Choose yours · €249</ds-button><ds-button href="#details">Explore the details</ds-button></div></section>
        ${photo('headphones.jpg', 'Blue headphones on a pale pink and mint background', '16 / 8', 'loading="eager" position="50% 45%"')}
        <section id="details" class="example-grid example-space"><ds-card><span slot="label">Listening</span><span slot="title">Stay in your own space.</span>${text('Soft cushions and a close fit for the album you keep coming back to.', 'wrap')}</ds-card><ds-card><span slot="label">Everyday</span><span slot="title">One charge. More days.</span><ds-stat value="30" label="Illustrative battery life, hours"></ds-stat></ds-card><ds-card><span slot="label">Connection</span><span slot="title">Keep it simple.</span>${text('Wireless when you want it. A cable when you need it.', 'wrap')}</ds-card></section>
        <section class="example-two"><div class="example-stack">${text('Make room for a longer listen.', 'size="display" strong wrap')}${text('From the first train to the last track, a familiar pair for wherever the day takes you.', 'wrap tone="muted"')}</div>${photo('forest.webp', 'A sunlit path through a quiet forest', '4 / 3')}</section>
        <ds-card id="configure"><span slot="label">Make it yours</span><span slot="title">Sound / 01</span><div class="example-stack"><div class="example-actions"><ds-stat value="249" format="money" currency="EUR" whole label="Illustrative price"></ds-stat><span class="example-grow"></span><ds-tag>Ice blue</ds-tag></div><div class="example-actions" role="group" aria-label="Choose package"><ds-button active data-package="Headphones">Headphones</ds-button><ds-button data-package="Headphones + travel case">With travel case</ds-button></div><div><ds-button primary id="configure-add">Add to bag</ds-button></div><ds-text literal id="product-status" role="status" wrap></ds-text></div></ds-card>
        ${text('Fictional product and specifications. Photography demonstrates the layout; no purchase is made.', 'tone="muted" wrap')}
      </div>${footer}</ds-page>`,
    script: `let selection='Headphones';
document.querySelectorAll('[data-package]').forEach(button=>button.addEventListener('click',()=>{selection=button.dataset.package;document.querySelectorAll('[data-package]').forEach(item=>{item.toggleAttribute('active',item===button);item.setAttribute('aria-pressed',String(item===button));});document.querySelector('#configure ds-stat').value=selection==='Headphones'?249:279;}));
document.querySelector('#configure-add').addEventListener('click',()=>{document.querySelector('#product-status').textContent=selection+' added to this example bag. No payment is taken.';});`,
  },
};
