function getRequiredGlobal(name) {
  const value = window[name];
  if (typeof value !== "function") {
    throw new Error(`Módulo O.S indisponível: função global ${name} não encontrada.`);
  }
  return value;
}

export default {
  render() {
    return getRequiredGlobal("renderServiceOrdersModule")();
  },

  bind() {
    return getRequiredGlobal("bindServiceOrdersModuleEvents")();
  },
};
