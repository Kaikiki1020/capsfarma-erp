export function getHeaderElements(root = document) {
  return {
    pageTitle: root.querySelector("#page-title"),
    subtitle: root.querySelector("#topbar-subtitle"),
    userName: root.querySelector("#user-name-label"),
    userRole: root.querySelector("#user-role-label"),
    userAvatar: root.querySelector("#user-avatar-label"),
  };
}
