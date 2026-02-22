/**
 * Monkey-patch for HTMLCanvasElement.prototype.getContext to improve performance
 * when using getImageData frequently (Readback operations).
 * This resolves the browser warning: "Canvas2D: Multiple readback operations using
 * getImageData are faster with the willReadFrequently attribute set to true."
 */

if (typeof window !== "undefined") {
  const originalGetContext = HTMLCanvasElement.prototype.getContext

  // @ts-ignore
  HTMLCanvasElement.prototype.getContext = function (
    contextId: string,
    options?: any,
  ) {
    if (contextId === "2d") {
      const newOptions = {
        ...options,
        willReadFrequently: true,
      }
      return originalGetContext.call(this, contextId, newOptions)
    }
    return originalGetContext.call(this, contextId, options)
  }
}

export {}
