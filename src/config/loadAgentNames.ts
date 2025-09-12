import fs from 'fs';
import path from 'path';
import type platformClient from 'purecloud-platform-client-v2';
import { z } from 'zod';

const AgentNamesSchema = z.array(z.string().min(1));

interface AgentNameMap {
  [name: string]: string[]; // name -> list of userIds (to handle duplicates)
}

export function loadAgentNames(filePath: string): string[] {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const parsed: unknown = JSON.parse(text); // <- unknown, not any
    return AgentNamesSchema.parse(parsed); // <- validated, typed string[]
  } catch {
    //there was likely no file specified, fallback to args
    return [];
  }
}

export async function getAgentIds(usersApi: platformClient.UsersApi): Promise<string[]> {
  const agentNamesPath = path.resolve('agents.json');
  const agentNames = loadAgentNames(agentNamesPath);
  if (agentNames.length === 0) {
    return [];
  }
  const allAgents = await fetchAllUsers(usersApi);
  const nameToIds: AgentNameMap = {};
  for (const u of allAgents) {
    const key = (u.name ?? '').trim().toLowerCase();
    if (!key || !u.id) {
      continue;
    }
    nameToIds[key] ??= [];
    nameToIds[key].push(u.id);
  }

  // Resolve names to IDs
  const resolved: string[] = [];
  for (const name of agentNames) {
    const key = name.trim().toLowerCase();
    const ids = nameToIds[key] ?? [];

    if (ids.length === 0) {
      console.warn(`⚠️ No match found for agent name: ${name}`);
    } else if (ids.length > 1) {
      console.warn(`⚠️ Multiple matches for agent name: ${name}`, ids);
      resolved.push(...ids);
    } else if (ids[0]) {
      resolved.push(ids[0]);
    }
  }

  return resolved;
}

async function fetchAllUsers(
  usersApi: platformClient.UsersApi
): Promise<platformClient.Models.User[]> {
  const pageSize = 200; // pull big pages to minimize calls
  let pageNumber = 1;
  const all: platformClient.Models.User[] = [];

  while (true) {
    const res = await usersApi.getUsers({
      pageSize,
      pageNumber,
      state: 'active',
    });

    const batch = res?.entities ?? [];
    all.push(...batch);

    // stop when there are no more pages
    const total = res?.total ?? all.length;
    const pageCount = res?.pageCount ?? Math.ceil(total / pageSize);
    if (pageNumber >= pageCount || batch.length === 0) {
      break;
    }
    pageNumber += 1;
  }
  return all;
}
