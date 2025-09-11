import platformClient from 'purecloud-platform-client-v2';
import type { Env } from '../config/env';

export interface GenesysApis {
  analytics: platformClient.AnalyticsApi;
  recording: platformClient.RecordingApi;
  users: platformClient.UsersApi;
  routing: platformClient.RoutingApi;
}

export async function initGenesysApis(env: Env): Promise<GenesysApis> {
  const client = platformClient.ApiClient.instance;
  client.setEnvironment(env.GENESYS_REGION);
  await client.loginClientCredentialsGrant(env.GENESYS_CLIENT_ID, env.GENESYS_CLIENT_SECRET);

  return {
    analytics: new platformClient.AnalyticsApi(),
    recording: new platformClient.RecordingApi(),
    users: new platformClient.UsersApi(),
    routing: new platformClient.RoutingApi(),
  };
}
