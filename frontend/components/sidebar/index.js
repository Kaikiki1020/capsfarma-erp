export function getSidebarElements(root = document) {
  return {
    sidebar: root.querySelector("#app-sidebar"),
    nav: root.querySelector("#module-nav"),
    collapseButton: root.querySelector("#sidebar-collapse-button"),
    mobileToggle: root.querySelector("#sidebar-mobile-toggle"),
    logoutButton: root.querySelector("#sidebar-logout-button"),
    backdrop: root.querySelector("#sidebar-backdrop"),
  };
}
