import '../../DS1/3-unit/ds-select';
import '../../DS1/2-core/ds-input';
import '../../DS1/2-core/ds-window';
import '../../DS1/2-core/ds-device-bezel';
import { BEZELS } from '../../DS1/5-visual-kit/bezels';
const desktop=document.querySelector('ds-window')!;
const phone=document.querySelector('ds-device-bezel')!;
const sample=()=>{const el=document.createElement('section');el.className='sample';el.innerHTML='<h2>Orders</h2><table><thead><tr><th>Customer</th><th class="amount">Total</th></tr></thead><tbody><tr><td>Mia Chen</td><td class="amount">$149</td></tr><tr><td>Tom Berg</td><td class="amount">$298</td></tr><tr><td>Ada Park</td><td class="amount">$149</td></tr></tbody></table>';return el;};
desktop.append(sample());phone.append(sample());
const select=document.querySelector<HTMLSelectElement>('#device')!;
for(const b of BEZELS){select.add(new Option(b.label,b.id));const f=document.createElement('figure');const d=document.createElement('ds-device-bezel');d.device=b.id;d.assetBase='/private-app/';d.chromeAssets='/private-app/';d.append(sample());const caption=document.createElement('figcaption');caption.textContent=b.label;f.append(d,caption);document.querySelector('#catalogue')!.append(f);}
select.value=phone.device;
select.onchange=()=>phone.device=select.value;
document.querySelector<HTMLSelectElement>('#window-kind')!.onchange=e=>desktop.kind=(e.target as HTMLSelectElement).value;
document.querySelector<HTMLSelectElement>('#appearance')!.onchange=e=>{desktop.appearance=phone.appearance=(e.target as HTMLSelectElement).value;};
document.querySelector('#time')!.addEventListener('input-change',e=>phone.time=(e as CustomEvent).detail.value);
document.querySelector('#address')!.addEventListener('input-change',e=>{desktop.address=phone.address=(e as CustomEvent).detail.value;});
document.addEventListener('chrome-action',(e:Event)=>{document.querySelector('#event')!.textContent=`Chrome action: ${(e as CustomEvent).detail.action}`;});
document.querySelector('#count')!.textContent=`${BEZELS.length} original variants, each with a measured app viewport.`;

for (const kind of ['safari', 'chrome', 'edge'] as const) for (const appearance of ['light', 'dark']) {
  const specimen = document.createElement('section');
  const caption = document.createElement('p'); caption.textContent = `${kind === 'chrome' ? 'Google Chrome 155' : kind === 'edge' ? 'Microsoft Edge 156' : 'Safari 27 compact'} · ${appearance}`;
  const chrome = document.createElement('ds-app-chrome');
  chrome.kind = kind; chrome.appearance = appearance; chrome.label = 'Example Domain'; chrome.address = kind === 'edge' ? 'https://example.com' : 'example.com'; chrome.interactive = true;
  chrome.style.cssText = 'width:100%;min-width:600px;max-width:1000px;border-radius:12px 12px 0 0;overflow:hidden';
  specimen.append(caption, chrome); document.querySelector('#browsers')!.append(specimen);
}
