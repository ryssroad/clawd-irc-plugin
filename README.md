# clawd-irc-plugin

IRC channel plugin for [OpenClaw](https://openclaw.ai). Connects your OpenClaw agent to IRC servers, enabling it to receive and respond to messages in channels and direct messages.

## Installation

### Option 1: git clone

```bash
git clone https://github.com/ryssroad/clawd-irc-plugin.git ~/.openclaw/extensions/irc
cd ~/.openclaw/extensions/irc && npm install
```

### Option 2: openclaw CLI

```bash
openclaw plugins install https://github.com/ryssroad/clawd-irc-plugin.git
```

## Configuration

Add the following to your `openclaw.json`:

```json
{
  "channels": {
    "irc": {
      "accounts": {
        "default": {
          "server": "irc.libera.chat",
          "port": 6667,
          "nickname": "MyBot",
          "channels": ["#my-channel"]
        }
      }
    }
  },
  "plugins": {
    "entries": {
      "irc": { "enabled": true }
    }
  }
}
```

### Account fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `server` | string | yes | — | IRC server hostname |
| `port` | number | no | 6667 | Server port |
| `nickname` | string | yes | — | Bot nickname |
| `channels` | string[] | no | [] | Channels to auto-join |

## How it works

- **`index.ts`** — entry point, registers the channel plugin with OpenClaw
- **`channel.ts`** — channel plugin definition (meta, config, outbound, gateway)
- **`monitor.ts`** — IRC client lifecycle, connection handling, message dispatch
- **`runtime.ts`** — singleton holder for `api.runtime`
- **`openclaw.plugin.json`** — plugin manifest with config schema

The plugin uses [irc-framework](https://github.com/kiwiirc/irc-framework) to connect to IRC servers. Incoming messages are dispatched through OpenClaw's reply pipeline; outbound replies are sent back to the originating channel or user.

## License

ISC
