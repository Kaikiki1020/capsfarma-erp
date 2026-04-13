function getLegacyBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponivel.");
  }
  return bridge;
}

export function createLegacyModule(moduleKey) {
  return {
    key: moduleKey,
    async load() {
      return getLegacyBridge().loadModuleData(moduleKey);
    },
    render() {
      return getLegacyBridge().renderModule(moduleKey);
    },
    bind() {
      return getLegacyBridge().bindModule(moduleKey);
    },
  };
}
