const capsfarmaHost = window.location.hostname || "127.0.0.1";
const capsfarmaProtocol = window.location.protocol === "https:" ? "https:" : "http:";

window.CAPSFARMA_SUPABASE_CONFIG = {
  url: `${capsfarmaProtocol}//${capsfarmaHost}:54321`,
  anonKey: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
};
