import { setRuntime } from "./runtime.js";
import { ircPlugin } from "./channel.js";

export default function register(api: any) {
  setRuntime(api.runtime);
  api.registerChannel({ plugin: ircPlugin });
}
