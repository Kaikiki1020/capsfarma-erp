function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

function renderPermissionRolePermissionGrid(roleDraft, helpers) {
  const normalizedPermissions = helpers.normalizeRolePermissions(roleDraft.permissions, roleDraft.name);
  return normalizedPermissions.map((permission) => {
    const module = helpers.getModules().find((item) => item.key === permission.module_key);
    const normalizedRoleName = helpers.normalizePermissionRoleName(roleDraft.name);
    const lockedPermissions = permission.module_key === "permissions"
      && !["TI", "ADMINISTRADOR"].includes(normalizedRoleName);
    const lockedVpsModule = permission.module_key === "vps"
      && normalizedRoleName !== "TI";
    const lockedDashboardEdit = permission.module_key === "dashboard"
      && !["TI", "ADMINISTRADOR"].includes(normalizedRoleName);
    return `
      <article class="permission-toggle-card ${(lockedPermissions || lockedVpsModule) ? "is-locked" : ""}">
        <div>
          <strong>${module?.label || permission.module_key}</strong>
          <p class="muted">${
            permission.module_key === "permissions"
              ? "Restrito a TI e ADMINISTRADOR"
              : permission.module_key === "vps"
                ? "Restrito exclusivamente ao perfil TI"
                : permission.module_key === "dashboard" && lockedDashboardEdit
                  ? "Perfis operacionais podem visualizar, mas não editar o dashboard"
                  : "Controle de leitura e alteração"
          }</p>
        </div>
        <label class="permission-switch">
          <span>Ver</span>
          <input type="checkbox" data-role-module="${permission.module_key}" data-role-permission-type="view" ${permission.can_view ? "checked" : ""} ${(lockedPermissions || lockedVpsModule) ? "disabled" : ""} />
        </label>
        <label class="permission-switch">
          <span>Editar</span>
          <input type="checkbox" data-role-module="${permission.module_key}" data-role-permission-type="edit" ${permission.can_edit ? "checked" : ""} ${(lockedPermissions || lockedVpsModule || lockedDashboardEdit) ? "disabled" : ""} />
        </label>
      </article>
    `;
  }).join("");
}

function renderPermissionRoleCard(role, helpers) {
  const activeTags = helpers.normalizeRolePermissions(role.permissions, role.name)
    .filter((permission) => permission.can_view || permission.can_edit)
    .map((permission) => {
      const module = helpers.getModules().find((item) => item.key === permission.module_key);
      return `<span class="permission-tag">${module?.label || permission.module_key} (${permission.can_edit ? "editar" : "ver"})</span>`;
    })
    .join("");

  return `
    <article class="permission-role-card">
      <div class="permission-role-card-head">
        <div>
          <h4>${helpers.escapeHtml(role.name)}</h4>
          <p class="muted">${helpers.escapeHtml(role.description || "Sem descrição cadastrada.")}</p>
        </div>
        ${role.is_system ? `<span class="status-chip chip-blue">Sistema</span>` : ""}
      </div>
      <div class="permission-tag-list">
        ${activeTags || `<span class="muted">Nenhuma permissão marcada.</span>`}
      </div>
      <div class="form-actions-row">
        <button class="inline-button" type="button" data-edit-permission-role="${role.id}">Editar</button>
        <button class="inline-button danger-button" type="button" data-delete-permission-role="${role.id}">Excluir</button>
      </div>
    </article>
  `;
}

function renderPermissionUserRow(user, helpers) {
  return `
    <tr>
      <td>
        <strong>${helpers.escapeHtml(user.full_name)}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(user.permission_role_name || "Sem papel de permissão")}</div>
      </td>
      <td>${helpers.escapeHtml(user.login_code || "-")}</td>
      <td>${helpers.escapeHtml(user.email || "-")}</td>
      <td>${helpers.escapeHtml(helpers.formatStaffRole(user.department || "-"))}</td>
      <td>${user.is_active ? `<span class="status-chip chip-green">Ativo</span>` : `<span class="status-chip chip-red">Inativo</span>`}</td>
      <td>
        <div class="action-button-group">
          <button class="inline-button" type="button" data-edit-staff-user="${user.id}">Editar</button>
          ${
            user.is_active
              ? `<button class="inline-button danger-button" type="button" data-deactivate-staff-user="${user.id}">Desativar</button>`
              : `<button class="inline-button danger-button" type="button" data-delete-staff-user="${user.id}">Excluir</button>`
          }
        </div>
      </td>
    </tr>
  `;
}

function renderPermissionAssignmentRow(user, helpers) {
  return `
    <tr>
      <td>${helpers.escapeHtml(user.full_name)}</td>
      <td>${helpers.escapeHtml(user.email || "-")}</td>
      <td>${helpers.escapeHtml(helpers.formatStaffRole(user.department || "-"))}</td>
      <td>${helpers.escapeHtml(user.permission_role_name || "-")}</td>
      <td><button class="inline-button" type="button" data-edit-staff-user="${user.id}">Alterar</button></td>
    </tr>
  `;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!helpers.isPermissionsAdmin()) {
      return helpers.noPermissionTemplate("Você não tem permissão para acessar esta área.");
    }

    const users = state.moduleData.users || [];
    const roles = state.permissionRoles || [];
    const isRoleFormOpen = state.openAccordionKey === "permission-role-form";
    const activeUsers = users.filter((user) => user.is_active).length;
    const inactiveUsers = users.filter((user) => !user.is_active).length;
    const criticalUsers = users.filter((user) => helpers.isPermissionsAdminRole(user.role)).length;

    return `
      <section class="module-panel permissions-module">
        <div class="module-head permissions-hero-head">
          <div>
            <p class="eyebrow muted">Segurança e governanca</p>
            <h3>Gerenciamento de Permissões</h3>
            <p class="muted">Configure papeis, permissões e funcionários</p>
          </div>
          <div class="module-head-actions">
            <button class="secondary-button" type="button" data-open-employee-modal>Cadastrar Funcionário</button>
            <button class="primary-button" type="button" data-new-permission-role>+ Novo Papel</button>
          </div>
        </div>

        <div class="summary-grid permissions-summary-grid">
          ${helpers.renderKpiCard({ label: "Papeis de Permissão", value: roles.length, note: "Perfis ativos no ERP", icon: "◩", tone: "blue" })}
          ${helpers.renderKpiCard({ label: "Funcionários Ativos", value: activeUsers, note: "Usuários habilitados para operar", icon: "◎", tone: "green" })}
          ${helpers.renderKpiCard({ label: "Acessos Críticos", value: criticalUsers, note: "TI e ADMINISTRADOR", icon: "◪", tone: "amber" })}
          ${helpers.renderKpiCard({ label: "Funcionários Inativos", value: inactiveUsers, note: inactiveUsers ? "Usuários desativados no cadastro" : "Nenhum registro inativo", icon: "◫", tone: "red" })}
        </div>

        <div class="permissions-layout">
          ${
            isRoleFormOpen
              ? `
                <section class="module-subpanel permission-role-form-panel">
                  <div class="module-head compact-head">
                    <div>
                      <p class="eyebrow muted">Cadastro de papel</p>
                      <h3>${state.permissionRoleDraft.id ? "Editar Papel de Permissão" : "Novo Papel de Permissão"}</h3>
                    </div>
                  </div>
                  <form id="permission-role-form" class="permissions-role-form">
                    <input type="hidden" name="role_id" value="${helpers.escapeHtml(state.permissionRoleDraft.id)}" />
                    <label>
                      Nome do Papel *
                      <input type="text" name="name" value="${helpers.escapeHtml(state.permissionRoleDraft.name)}" placeholder="Ex.: VENDEDOR" required />
                    </label>
                    <label>
                      Descrição
                      <textarea name="description" placeholder="Resumo do papel e do escopo operacional.">${helpers.escapeHtml(state.permissionRoleDraft.description || "")}</textarea>
                    </label>
                    <div class="permission-module-grid">
                      ${renderPermissionRolePermissionGrid(state.permissionRoleDraft, helpers)}
                    </div>
                    <div class="form-actions-row">
                      <button class="ghost-button" type="button" data-cancel-permission-role>Cancelar</button>
                      <button class="primary-button" type="submit">Salvar</button>
                    </div>
                  </form>
                </section>
              `
              : ""
          }

          <section class="module-subpanel">
            <div class="module-head compact-head">
              <div>
                <p class="eyebrow muted">Papeis existentes</p>
                <h3>Lista de Papeis</h3>
              </div>
            </div>
            <div class="permission-role-card-list">
              ${roles.length ? roles.map((role) => renderPermissionRoleCard(role, helpers)).join("") : `<div class="empty-state compact-empty">Nenhum papel cadastrado.</div>`}
            </div>
          </section>
        </div>

        <section class="module-subpanel">
          <div class="module-head compact-head">
            <div>
              <p class="eyebrow muted">Equipe</p>
              <h3>Funcionários Cadastrados</h3>
            </div>
          </div>
          ${
            users.length
              ? `
                <div class="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>Funcionário</th>
                        <th>Código</th>
                        <th>Email</th>
                        <th>Departamento</th>
                        <th>Status</th>
                        <th>Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${users.map((user) => renderPermissionUserRow(user, helpers)).join("")}
                    </tbody>
                  </table>
                </div>
              `
              : `<div class="empty-state">Nenhum funcionário cadastrado. Clique em "Cadastrar Funcionário" para começar.</div>`
          }
        </section>

        <section class="module-subpanel">
          <div class="module-head compact-head">
            <div>
              <p class="eyebrow muted">Vinculos de acesso</p>
              <h3>Atribuir Permissões a Usuários</h3>
            </div>
          </div>
          <div class="table-card">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Departamento</th>
                  <th>Papel de Permissão</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                ${
                  users.length
                    ? users.map((user) => renderPermissionAssignmentRow(user, helpers)).join("")
                    : `<tr><td colspan="5"><div class="empty-state">Nenhum usuário disponível.</div></td></tr>`
                }
              </tbody>
            </table>
          </div>
        </section>

        ${state.employeeModalOpen ? helpers.renderEmployeeModal() : ""}
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    const roleForm = document.querySelector("#permission-role-form");
    if (roleForm) {
      roleForm.addEventListener("submit", helpers.handlePermissionRoleSubmit);
    }

    const syncPermissionRoleNameDraft = (value) => {
      state.permissionRoleDraft.name = helpers.normalizePermissionRoleName(value);
      state.permissionRoleDraft.permissions = helpers.normalizeRolePermissions(
        state.permissionRoleDraft.permissions,
        helpers.getPermissionRoleNormalizationName(state.permissionRoleDraft.name)
      );
    };

    const roleNameInput = document.querySelector('#permission-role-form input[name="name"]');
    if (roleNameInput) {
      roleNameInput.addEventListener("input", (event) => {
        const previousRoleName = state.permissionRoleDraft.name;
        syncPermissionRoleNameDraft(event.currentTarget.value);
        if (event.currentTarget.value !== state.permissionRoleDraft.name) {
          event.currentTarget.value = state.permissionRoleDraft.name;
        }
        const previousPermissionsAdmin = ["TI", "ADMINISTRADOR"].includes(helpers.normalizePermissionRoleName(previousRoleName));
        const nextPermissionsAdmin = ["TI", "ADMINISTRADOR"].includes(state.permissionRoleDraft.name);
        const previousVpsAccess = helpers.normalizePermissionRoleName(previousRoleName) === "TI";
        const nextVpsAccess = state.permissionRoleDraft.name === "TI";
        if (previousPermissionsAdmin !== nextPermissionsAdmin || previousVpsAccess !== nextVpsAccess) {
          helpers.renderActiveModule();
        }
      });
      roleNameInput.addEventListener("change", (event) => {
        syncPermissionRoleNameDraft(event.currentTarget.value);
        helpers.renderActiveModule();
      });
    }

    document.querySelector('#permission-role-form textarea[name="description"]')?.addEventListener("input", (event) => {
      state.permissionRoleDraft.description = event.currentTarget.value;
    });

    document.querySelectorAll("[data-role-permission-type]").forEach((input) => {
      input.addEventListener("change", () => {
        const moduleKey = input.dataset.roleModule;
        const type = input.dataset.rolePermissionType;
        state.permissionRoleDraft.permissions = helpers.normalizeRolePermissions(
          state.permissionRoleDraft.permissions,
          helpers.getPermissionRoleNormalizationName(state.permissionRoleDraft.name)
        ).map((permission) => {
          if (permission.module_key !== moduleKey) return permission;
          const next = {
            ...permission,
            can_view: type === "view" ? input.checked : permission.can_view,
            can_edit: type === "edit" ? input.checked : permission.can_edit,
          };
          if (next.can_edit) next.can_view = true;
          return next;
        });
        state.permissionRoleDraft.permissions = helpers.normalizeRolePermissions(
          state.permissionRoleDraft.permissions,
          helpers.getPermissionRoleNormalizationName(state.permissionRoleDraft.name)
        );
        helpers.renderActiveModule();
      });
    });

    document.querySelector("[data-new-permission-role]")?.addEventListener("click", () => {
      const shouldOpen = state.openAccordionKey !== "permission-role-form" || Boolean(state.permissionRoleDraft.id);
      state.permissionRoleDraft = helpers.createEmptyPermissionRoleDraft();
      state.openAccordionKey = shouldOpen ? "permission-role-form" : null;
      helpers.renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#permission-role-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    document.querySelector("[data-cancel-permission-role]")?.addEventListener("click", () => {
      state.permissionRoleDraft = helpers.createEmptyPermissionRoleDraft();
      state.openAccordionKey = null;
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-edit-permission-role]").forEach((button) => {
      button.addEventListener("click", async () => {
        const role = state.permissionRoles.find((item) => item.id === button.dataset.editPermissionRole);
        if (!role) return;
        state.permissionRoleDraft = {
          id: role.id,
          name: role.name,
          originalName: role.name,
          description: role.description || "",
          permissions: helpers.normalizeRolePermissions(role.permissions, role.name),
        };
        state.openAccordionKey = "permission-role-form";
        await helpers.renderActiveModule();
        document.querySelector("#permission-role-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-delete-permission-role]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const { error } = await state.supabase.rpc("delete_permission_role", {
            p_access_token: state.accessToken,
            p_role_id: button.dataset.deletePermissionRole,
          });
          if (error) throw error;
          state.permissionRoleDraft = helpers.createEmptyPermissionRoleDraft();
          await helpers.loadPermissionsAdminData();
          helpers.renderActiveModule();
          void helpers.queueSystemLog({
            moduleKey: "permissions",
            action: "exclusao",
            level: "Critico",
            itemAffected: button.dataset.deletePermissionRole,
            description: "Papel de permissão excluido.",
            entityType: "permission_role",
            entityId: button.dataset.deletePermissionRole,
          });
          helpers.showToast("Papel excluido com sucesso.", "success");
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-open-employee-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        state.employeeModalOpen = true;
        state.employeeFormMode = "create";
        state.employeeEditId = "";
        state.employeeDraft = helpers.createEmptyEmployeeDraft();
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-edit-staff-user]").forEach((button) => {
      button.addEventListener("click", () => {
        const user = state.moduleData.users.find((item) => item.id === button.dataset.editStaffUser);
        if (!user) return;
        state.employeeModalOpen = true;
        state.employeeFormMode = "edit";
        state.employeeEditId = user.id;
        state.employeeDraft = {
          id: user.id,
          login_code: user.login_code || "",
          full_name: user.full_name || "",
          email: user.email || "",
          password: "",
          department: user.department || user.role || "USINAGEM",
          permission_role_id: user.permission_role_id || "",
          status: user.is_active ? "active" : "inactive",
        };
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-deactivate-staff-user]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const { error } = await state.supabase.rpc("deactivate_staff_user", {
            p_access_token: state.accessToken,
            p_user_id: button.dataset.deactivateStaffUser,
          });
          if (error) throw error;
          await helpers.loadPermissionsAdminData();
          helpers.renderActiveModule();
          void helpers.queueSystemLog({
            moduleKey: "permissions",
            action: "mudanca_status",
            level: "Critico",
            itemAffected: button.dataset.deactivateStaffUser,
            description: "Funcionário desativado.",
            entityType: "staff_user",
            entityId: button.dataset.deactivateStaffUser,
          });
          helpers.showToast("Funcionário desativado.", "success");
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-delete-staff-user]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const { error } = await state.supabase.rpc("delete_inactive_staff_user", {
            p_access_token: state.accessToken,
            p_user_id: button.dataset.deleteStaffUser,
          });
          if (error) throw error;
          await helpers.loadPermissionsAdminData();
          helpers.renderActiveModule();
          void helpers.queueSystemLog({
            moduleKey: "permissions",
            action: "exclusao",
            level: "Critico",
            itemAffected: button.dataset.deleteStaffUser,
            description: "Funcionário inativo excluido.",
            entityType: "staff_user",
            entityId: button.dataset.deleteStaffUser,
          });
          helpers.showToast("Funcionário inativo excluido com sucesso.", "success");
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelector("[data-close-employee-modal-button]")?.addEventListener("click", helpers.closeEmployeeModal);
    document.querySelector("[data-close-employee-modal]")?.addEventListener("click", (event) => {
      if (event.target.hasAttribute("data-close-employee-modal")) {
        helpers.closeEmployeeModal();
      }
    });

    document.querySelector("#employee-form")?.addEventListener("submit", helpers.handleEmployeeSubmit);
  },
};
