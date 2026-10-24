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
