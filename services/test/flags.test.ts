import { describe, expect, it, vi } from 'vite-plus/test';
import { FEATURE_FLAGS } from '../../shared/feature-flags';
import { featureFlags, manageFeatureFlags, setFeatureFlag } from '../src/flags';
import type { ReportsEnv } from '../src/reports';
const setup = () => ({
  env: { LIBRARIES: {get:vi.fn(),put:vi.fn()},REPORTS_AUTH_URL:'https://example.convex.cloud',REPORTS_OWNER_ID:'owner'} as unknown as ReportsEnv,
  send: vi.fn().mockImplementation(async () => Response.json({status:'success',value:{_id:'owner',email:'jaa90@icloud.com',emailVerified:true}})),
});
const request=(method='GET',body?:object)=>new Request('https://designsystem1.com/api/flags',{method,headers:{Authorization:'Bearer token',Origin:'https://designsystem1.com','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
describe('owner flag management',()=>{
  it('denies anonymous and unrelated accounts before touching storage',async()=>{
    const {env,send}=setup();
    expect((await featureFlags(new Request('https://designsystem1.com/api/flags'),env,send)).status).toBe(401);
    send.mockResolvedValue(Response.json({status:'success',value:{_id:'another',email:'jaa90@icloud.com',emailVerified:true}}));
    expect((await featureFlags(request(),env,send)).status).toBe(403);
    expect(env.LIBRARIES.get).not.toHaveBeenCalled();
  });
  it('reports no declared release switches without inventing a feature',async()=>{
    const {env,send}=setup();
    const response=await featureFlags(request(),env,send);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it('rejects undeclared flags without writing a rule',async()=>{
    const {env,send}=setup();
    expect((await featureFlags(request('PUT',{key:'unknown',enabled:true,audience:'everyone',accountIds:[]}),env,send)).status).toBe(400);
    expect(env.LIBRARIES.put).not.toHaveBeenCalled();
  });
});

describe('shared HTTP and service-binding flag store', () => {
  it('persists and reads identical rules, and rejects malformed writes', async () => {
    const {env,send}=setup();
    Object.defineProperty(FEATURE_FLAGS,'test-release',{value:{label:'Test release'},enumerable:true,configurable:true});
    try {
      const stored=new Map<string,string>();
      vi.mocked(env.LIBRARIES.put).mockImplementation(async (key,body) => { stored.set(key,body as string); return {} as R2Object; });
      vi.mocked(env.LIBRARIES.get).mockImplementation(async (key) => {
        const body=stored.get(key);
        return body ? {json:async()=>JSON.parse(body)} as R2ObjectBody : null;
      });
      const rule={key:'test-release',enabled:true,audience:'owner',accountIds:[]};
      expect(await setFeatureFlag(env,rule)).toEqual({saved:true});
      expect(stored.has('feature-flags/test-release.json')).toBe(true);
      expect(await (await featureFlags(request(),env,send)).json()).toEqual(await manageFeatureFlags(env));
      expect((await featureFlags(request('PUT',{...rule,enabled:false}),env,send)).status).toBe(200);
      expect((await manageFeatureFlags(env))[0]?.enabled).toBe(false);
      await expect(setFeatureFlag(env,{...rule,audience:'invalid'})).rejects.toThrow('Invalid feature flag');
      await expect(setFeatureFlag(env,{...rule,accountIds:Array(101).fill('account')})).rejects.toThrow('Invalid feature flag');
      expect((await manageFeatureFlags(env))[0]?.enabled).toBe(false);
    } finally { Reflect.deleteProperty(FEATURE_FLAGS,'test-release'); }
  });
});
