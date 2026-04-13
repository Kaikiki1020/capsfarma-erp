function getRequiredGlobal(name) {
  const value = window[name];
  if (typeof value !== "function") {
    throw new Error(`Modulo O.S indisponivel: funcao global ${name} nao encontrada.`);
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
