export function bindDeferredInput(input, onChange, wait = 120) {
  if (!input || typeof onChange !== "function") return () => {};
  let timerId = 0;

  const handleInput = (event) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => {
      onChange(event.currentTarget.value, event);
    }, wait);
  };

  input.addEventListener("input", handleInput);
  return () => input.removeEventListener("input", handleInput);
}
