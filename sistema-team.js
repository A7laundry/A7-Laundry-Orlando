'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  let users = [];

  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials:'same-origin', ...options,
      headers:{ Accept:'application/json', ...(options.body ? { 'Content-Type':'application/json' } : {}), ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir a operação.');
    return payload;
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function roleLabel(role) {
    return ({ owner:'Owner', manager:'Gestora', operator:'Operadora' })[role] || role;
  }

  function dateTime(value) {
    if (!value) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', { timeZone:'America/New_York', dateStyle:'short', timeStyle:'short' }).format(new Date(value));
  }

  function clearTemporaryPassword() {
    $('temporaryPasswordValue').textContent = '';
    $('temporaryPasswordCard').hidden = true;
  }

  function showTemporaryPassword(value) {
    $('temporaryPasswordValue').textContent = value;
    $('temporaryPasswordCard').hidden = false;
    $('temporaryPasswordCard').scrollIntoView({ behavior:'smooth', block:'center' });
  }

  function showTeam() {
    for (const view of document.querySelectorAll('.content > div[id$="View"]')) view.hidden = view.id !== 'teamView';
    for (const button of document.querySelectorAll('.workspace nav button')) button.classList.remove('active');
    $('teamNav').classList.add('active');
    window.scrollTo({ top:0, behavior:'instant' });
  }

  function editUser(user = null) {
    clearTemporaryPassword();
    const form = $('teamUserForm'); form.reset();
    form.elements.user_id.value = user?.id || '';
    form.elements.full_name.value = user?.full_name || '';
    form.elements.job_title.value = user?.job_title || '';
    form.elements.email.value = user?.email || '';
    form.elements.phone.value = user?.phone || '';
    form.elements.role.value = user?.role || 'operator';
    form.elements.status.value = user?.status || 'active';
    $('teamStatusField').hidden = !user;
    $('teamEditorTitle').textContent = user ? `Editar ${user.full_name}` : 'Novo usuário';
    $('teamEditor').hidden = false;
    $('teamEditor').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  async function showHistory(user, target) {
    const payload = await request('/api/system/users', { method:'POST', body:JSON.stringify({ action:'history', user_id:user.id }) });
    const list = node('ol', 'team-history-list');
    for (const event of payload.events || []) {
      const item = node('li');
      item.append(node('strong', '', String(event.action || '').replaceAll('_', ' ')),
        node('small', '', `${dateTime(event.created_at)} · ${event.actor_role || 'system'}`));
      list.append(item);
    }
    if (!list.children.length) list.append(node('li', '', 'Nenhum evento registrado.'));
    target.replaceChildren(list);
  }

  function renderUsers() {
    const target = $('teamUsers'); target.replaceChildren();
    for (const user of users) {
      const card = node('article', `panel team-user${user.status === 'inactive' ? ' inactive' : ''}`);
      const identity = node('div', 'team-user-identity');
      const title = node('div'); title.append(node('h2', '', user.full_name), node('p', '', user.job_title || roleLabel(user.role)));
      identity.append(title, node('span', `team-role role-${user.role}`, roleLabel(user.role)));
      const facts = node('dl', 'team-user-facts');
      for (const [label, value] of [
        ['E-mail', user.email], ['Telefone', user.phone || 'Não informado'],
        ['Status', user.status === 'active' ? 'Ativo' : 'Inativo'], ['Último acesso', dateTime(user.last_login_at)],
        ['Criado em', dateTime(user.created_at)], ['Última alteração', dateTime(user.updated_at)]
      ]) { const row = node('div'); row.append(node('dt', '', label), node('dd', '', value)); facts.append(row); }
      const actions = node('div', 'team-user-actions');
      const edit = node('button', 'secondary', 'Editar perfil'); edit.type = 'button'; edit.addEventListener('click', () => editUser(user));
      const reset = node('button', 'quiet bordered', 'Gerar nova senha'); reset.type = 'button';
      reset.addEventListener('click', async () => {
        if (!window.confirm(`Gerar uma nova senha temporária para ${user.full_name}? O acesso atual será encerrado.`)) return;
        try {
          const payload = await request('/api/system/users', { method:'POST', body:JSON.stringify({ action:'reset_password', user_id:user.id }) });
          showTemporaryPassword(payload.temporary_password); await loadUsers();
        } catch (error) { $('teamError').textContent = error.message; }
      });
      const historyButton = node('button', 'quiet', 'Ver histórico'); historyButton.type = 'button';
      const history = node('div', 'team-history'); history.hidden = true;
      historyButton.addEventListener('click', async () => {
        history.hidden = !history.hidden;
        if (!history.hidden && !history.children.length) {
          history.textContent = 'Carregando histórico…';
          try { await showHistory(user, history); } catch (error) { history.textContent = error.message; }
        }
      });
      actions.append(edit, reset, historyButton);
      card.append(identity, facts, actions, history); target.append(card);
    }
    if (!users.length) target.append(node('p', 'customer-empty', 'Nenhum usuário cadastrado.'));
  }

  async function loadUsers() {
    $('teamError').textContent = '';
    $('teamUsers').replaceChildren(node('p', 'customer-empty', 'Carregando equipe…'));
    const payload = await request('/api/system/users', { method:'POST', body:JSON.stringify({ action:'list' }) });
    users = payload.users || []; renderUsers();
  }

  async function openTeam() {
    if (window.A7SystemSession?.role !== 'owner') throw new Error('Somente o Owner pode administrar a equipe.');
    showTeam(); await loadUsers();
  }

  $('teamNav').addEventListener('click', () => openTeam().catch((error) => { $('teamError').textContent = error.message; }));
  for (const button of document.querySelectorAll('.workspace nav button')) {
    if (button.id !== 'teamNav') button.addEventListener('click', clearTemporaryPassword);
  }
  $('newTeamUserButton').addEventListener('click', () => editUser());
  $('cancelTeamUserButton').addEventListener('click', () => { $('teamEditor').hidden = true; });
  $('dismissTemporaryPasswordButton').addEventListener('click', clearTemporaryPassword);
  $('copyTemporaryPasswordButton').addEventListener('click', async () => {
    const password = $('temporaryPasswordValue').textContent;
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      $('copyTemporaryPasswordButton').textContent = 'Copiada';
      setTimeout(() => { $('copyTemporaryPasswordButton').textContent = 'Copiar senha'; }, 1800);
    } catch (_) { $('teamError').textContent = 'Não foi possível copiar. Selecione a senha exibida e copie manualmente.'; }
  });
  $('teamUserForm').addEventListener('submit', async (event) => {
    event.preventDefault(); const button = event.submitter; button.disabled = true;
    $('teamError').textContent = ''; clearTemporaryPassword();
    const data = new FormData(event.currentTarget); const payload = Object.fromEntries(data);
    payload.action = payload.user_id ? 'update' : 'create';
    if (!payload.user_id) { delete payload.user_id; delete payload.status; }
    try {
      const result = await request('/api/system/users', { method:'POST', body:JSON.stringify(payload) });
      $('teamEditor').hidden = true;
      if (result.temporary_password) showTemporaryPassword(result.temporary_password);
      await loadUsers();
    } catch (error) { $('teamError').textContent = error.message; }
    finally { button.disabled = false; }
  });
})();
