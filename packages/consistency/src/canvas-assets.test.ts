import { expect, it } from 'vitest';
import { canvasAssetAddress } from './canvas-assets';
it('maps site-owned component folders through the file gateway without changing foreign or already mapped addresses', () => {
  const files='/api/consistency/sites/60BVFI/files',page='https://example.com/about/';
  expect(canvasAssetAddress('/assets/device/',files,page)).toBe(files+'/assets/device/');
  expect(canvasAssetAddress('../assets/device/',files,page)).toBe(files+'/assets/device/');
  expect(canvasAssetAddress('https://example.com/assets/device/',files,page)).toBe(files+'/assets/device/');
  expect(canvasAssetAddress(files+'/assets/device/',files,page)).toBe(files+'/assets/device/');
  expect(canvasAssetAddress('https://cdn.example.com/device/',files,page)).toBe('https://cdn.example.com/device/');
  expect(canvasAssetAddress('/assets/device/','',page)).toBe('/assets/device/');
});
