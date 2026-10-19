// @vitest-environment happy-dom
import { expect, test, vi } from 'vite-plus/test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { getFunctionName } from 'convex/server';
const mocks = vi.hoisted(() => ({ session: {isAuthenticated:true,isLoading:false}, create:vi.fn() }));
vi.mock('convex/react', () => ({
  useConvexAuth: () => mocks.session,
  useMutation: () => mocks.create,
  useQuery: (query: any, args: unknown) => args === 'skip' ? undefined : getFunctionName(query) === 'users:profile' ? {companyName:'Example'} : [{_id:'one',name:'Library one',publishedVersion:2}],
}));
import { NavigationAuth } from './NavigationAuth';
test('workspace creation accepts only the parent and ignores duplicate or signed-out requests', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const root = createRoot(document.createElement('div'));
  const sent = vi.spyOn(window.parent,'postMessage').mockImplementation(() => {});
  let finish!: (result: any) => void;
  mocks.create.mockImplementation(() => new Promise(resolve => {finish=resolve;}));
  const request = (origin=location.origin, source: MessageEventSource|null=window.parent) => window.dispatchEvent(new MessageEvent('message', {origin,source,data:{type:'ds1:create-library'}}));
  try {
    await act(async () => root.render(createElement(NavigationAuth)));
    expect(sent.mock.calls.at(-1)?.[0]).toMatchObject({companyName:'Example',libraries:[{id:'one',name:'Library one',publishedVersion:2}]});
    await act(async () => { request('https://elsewhere.example'); request(location.origin,null); });
    expect(mocks.create).not.toHaveBeenCalled();
    await act(async () => { request(); request(); });
    expect(mocks.create).toHaveBeenCalledOnce();
    await act(async () => finish({_id:'new-library'}));
    expect(sent).toHaveBeenCalledWith({type:'ds1:library-created',id:'new-library'},location.origin);
    mocks.session.isAuthenticated=false;
    await act(async () => root.render(createElement(NavigationAuth)));
    expect(sent.mock.calls.at(-1)?.[0]).toMatchObject({authenticated:false,companyName:'',libraries:[]});
    await act(async () => request());
    expect(mocks.create).toHaveBeenCalledOnce();
  } finally { await act(async () => root.unmount()); sent.mockRestore(); mocks.session.isAuthenticated=true; vi.unstubAllGlobals(); }
});
