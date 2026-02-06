// channel.ts
import { getRuntime } from "./runtime.js";
import { monitorIrc } from "./monitor.js";

export const ircPlugin = {
  id: "irc",
  meta: {
    id: "irc",
    label: "IRC",
    selectionLabel: "IRC (Internet Relay Chat)",
    docsPath: "/channels/irc",
    blurb: "Connect to IRC servers.",
    aliases: ["irc"],
  },
  capabilities: { chatTypes: ["direct", "channel"] },
  
  config: {
    listAccountIds: (cfg: any) => Object.keys(cfg.channels?.irc?.accounts ?? {}),
    resolveAccount: (cfg: any, accountId: string) => {
      const account = cfg.channels?.irc?.accounts?.[accountId ?? "default"] ?? {};
      return {
        accountId,
        ...account,
        // Map fields expected by core if needed, but we use our own in gateway
      };
    },
  },

  gateway: {
    startAccount: async (ctx: any) => {
      const account = ctx.account;
      // account contains the config for this accountId
      
      ctx.log?.info(`[${account.accountId}] Starting IRC connection to ${account.server}`);

      return monitorIrc({
        account,
        config: ctx.cfg,
        runtime: ctx.runtime,
        log: ctx.log,
        abortSignal: ctx.abortSignal,
      });
    }
  },

  outbound: {
    deliveryMode: "direct",
    sendText: async (params: any) => {
      // We need to find the active client.
      // In a real plugin, we'd have a ClientManager.
      // For now, let's assume we can access the client via a global map or similar.
      // Or we can rely on the 'deps' injection if we registered it? 
      // No, outbound usually requires looking up the client.
      
      const { to, text, accountId } = params;
      const client = getClient(accountId); // We need to implement this
      
      if (!client) {
        return { ok: false, error: "Client not connected" };
      }
      
      client.say(to, text);
      return { ok: true };
    }
  }
};

// Simple global client store for outbound
import { Client } from "irc-framework";
const clients = new Map<string, Client>();

export function registerClient(accountId: string, client: Client) {
  clients.set(accountId, client);
}

export function unregisterClient(accountId: string) {
  clients.delete(accountId);
}

function getClient(accountId?: string): Client | undefined {
  if (accountId) return clients.get(accountId);
  // If no accountId, return the first one (default)
  return clients.values().next().value;
}
