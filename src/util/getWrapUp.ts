import type platformClient from 'purecloud-platform-client-v2';

export const WrapupCache: Record<string, string> = {};

export async function getWrapupName(
  wrapupCode: string,
  routingApi: platformClient.RoutingApi
): Promise<string> {
  if (!wrapupCode.trim) {
    return 'No Wrapup';
  }

  const wrap = WrapupCache[wrapupCode];
  if (wrap) {
    return wrap;
  }

  try {
    const wrapup = await routingApi.getRoutingWrapupcode(wrapupCode);
    if (wrapup) {
      const name = wrapup.name ?? wrapupCode;
      WrapupCache[wrapupCode] = name;
      return name;
    }
  } catch {
    console.log(`Wrapup Exception: ${wrapupCode}`);
  }
  WrapupCache[wrapupCode] = wrapupCode;
  return wrapupCode;
}
