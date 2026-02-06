// monitor.ts
import { Client } from "irc-framework";
import { registerClient, unregisterClient } from "./channel.js";
import { getRuntime } from "./runtime.js";

export async function monitorIrc(params: any) {
  const { account, config, abortSignal, log } = params;

  const logger = log ?? console;
  const client = new Client();
  const accountId = account.accountId;

  registerClient(accountId, client);

  client.connect({
    host: account.server,
    port: account.port || 6667,
    nick: account.nickname,
    username: account.nickname,
    gecos: "OpenClaw Agent",
  });

  client.on("registered", () => {
    logger.info?.(`[${accountId}] Connected as ${account.nickname}`);
    if (account.channels) {
      for (const channel of account.channels) {
        client.join(channel);
      }
    }
  });

  client.on("error", (err: any) => {
    logger.error?.(`[${accountId}] Client Error: ${err.message || err}`);
  });

  client.on("socket close", () => {
    logger.warn?.(`[${accountId}] Socket closed`);
  });

  client.on("message", async (event: any) => {
    // event: { nick, ident, hostname, target, group, message, tags, time }
    if (event.nick === client.user.nick) return; // Ignore self

    const isGroup = event.target.startsWith("#");
    const senderId = event.nick;
    const target = event.target; // Channel or our Nick
    const text = event.message;

    try {
      const rt = getRuntime();

      const ctxPayload = rt.channel.reply.finalizeInboundContext({
        Body: text,
        RawBody: text,
        From: isGroup ? `irc:${target}` : `irc:${senderId}`,
        To: `irc:${client.user.nick}`,
        SessionKey: `irc:${accountId}:${isGroup ? target : senderId}`,
        AccountId: accountId,
        ChatType: isGroup ? "group" : "direct",
        ConversationLabel: isGroup ? target : senderId,
        SenderName: senderId,
        SenderId: senderId,
        GroupSubject: isGroup ? target : undefined,
        Provider: "irc",
        Surface: "irc",
        OriginatingChannel: "irc",
        OriginatingTo: target,
      });

      await rt.channel.reply.dispatchReplyWithBufferedBlockDispatcher({
        ctx: ctxPayload,
        cfg: config,
        dispatcherOptions: {
          deliver: async (payload: any) => {
            const replyText = payload.text || "";
            if (replyText) {
              if (isGroup) {
                client.say(target, `${senderId}: ${replyText}`);
              } else {
                client.say(senderId, replyText);
              }
            }
          },
          onError: (err: any) => {
            logger.error?.(`Reply error: ${err}`);
          }
        }
      });
    } catch (err: any) {
      logger.error?.(`[${accountId}] Message handler error: ${err.message || err}`);
    }
  });

  const stop = () => {
    client.quit();
    unregisterClient(accountId);
  };

  if (abortSignal) {
    abortSignal.addEventListener("abort", stop);
  }

  return { stop };
}
