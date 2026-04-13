export function setButtonBusyState(button, isBusy, busyLabel = "Processando...") {
  if (!button) return;
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent || "";
  }
  button.disabled = Boolean(isBusy);
  button.textContent = isBusy ? busyLabel : button.dataset.defaultLabel;
}
