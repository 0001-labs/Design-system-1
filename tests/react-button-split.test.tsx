// @vitest-environment happy-dom
import { expect, test } from "vite-plus/test";
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import "../DS1/2-core/ds-button";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

test("the Button split API accepts and rejects controlled choices with the same adapter", async () => {
  const { Button } = await import('../DS1/react/button');
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host); const requests: string[]=[];
  function Example({accept}:{accept:boolean}) {
    const [value,setValue]=useState<'one'|'two'>('one');
    return <Button split label="Mode" value={value} onPress={next=>{requests.push(next);if(accept)setValue(next);}} segments={[{value:'one',label:'One'},{value:'two',label:'Two'}]} />;
  }
  try {
    await act(async()=>root.render(h(Example,{accept:false})));
    const element=host.querySelector('ds-button')!;await element.updateComplete;
    await act(async()=>element.shadowRoot!.querySelectorAll('button')[1].click());await element.updateComplete;
    expect(element.value).toBe('one');expect(requests).toEqual(['two']);
    await act(async()=>root.render(h(Example,{accept:true})));
    await act(async()=>element.shadowRoot!.querySelectorAll('button')[1].click());await element.updateComplete;
    expect(element.value).toBe('two');expect(element.getAttribute('role')).toBe('group');
  } finally {await act(async()=>root.unmount());host.remove();}
});
