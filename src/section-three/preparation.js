// Yield between short construction/upload batches, rather than freezing a swipe.
export function createPreparationQueue({budget = 8, now = () => performance.now(),
  pause = () => new Promise(resolve => setTimeout(resolve, 0))} = {}) {
  let sliceStart = now(), steps = 0, yields = 0, maxStepMs = 0;
  async function yieldNow() {await pause(); sliceStart = now(); yields++;}
  return {
    async run(work) {
      const start = now(), result = work();
      maxStepMs = Math.max(maxStepMs, now() - start); steps++;
      if (now() - sliceStart >= budget) await yieldNow();
      return result;
    },
    yield: yieldNow,
    getState: () => ({steps, yields, maxStepMs}),
  };
}
