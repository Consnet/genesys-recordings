import platformClient from 'purecloud-platform-client-v2';

interface Agent {
  name: string;
  managerId: string;
  managerName: string;
}

export const AgentCache: Record<string, Agent> = {};

export async function getAgentDetail(
  userId: string,
  usersApi: platformClient.UsersApi
): Promise<Agent> {
  const agent = AgentCache[userId];

  if (!agent) {
    const user = await usersApi.getUser(userId, { expand: ['manager'] });
    if (user?.name) {
      const managerId = user.manager?.id ?? 'No Manager';
      let managerName = '';
      if (user.manager?.id) {
        const manager = await getAgentDetail(managerId, usersApi);
        managerName = manager?.name ?? 'No Manager';
      }

      const newAgent = { name: user.name, managerId: managerId, managerName: managerName };
      AgentCache[userId] = newAgent;
      return newAgent;
    } else {
      const unknown = { name: 'Unknown Agent', managerId: '', managerName: '' };
      AgentCache[userId] = unknown;
      return unknown;
    }
  }
  return agent;
}
