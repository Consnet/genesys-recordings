import type platformClient from 'purecloud-platform-client-v2';

export const WrapupCache: Record<string, string> = {};

export async function getWrapupName(
  wrapupCode: string,
  routingApi: platformClient.RoutingApi
): Promise<string> {
  if (!wrapupCode.trim) {
    return '';
  }

  const wrap = WrapupCache['wrapupCode'];
  if (!wrap) {
    const wrapup = await routingApi.getRoutingWrapupcode(wrapupCode);
    if (wrapup) {
      const name = wrapup.name ?? wrapupCode;
      WrapupCache[wrapupCode] = name;
      return name;
    } else {
      WrapupCache[wrapupCode] = 'Unknown Wrapup';
      return 'Unknown Wrapup';
    }
  }
  return wrap;
}
