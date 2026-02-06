// runtime.ts
// Singleton to hold the OpenClaw API runtime reference

export let runtime: any = null;

export function setRuntime(rt: any) {
  runtime = rt;
}

export function getRuntime() {
  if (!runtime) throw new Error("IRC runtime not initialized");
  return runtime;
}
