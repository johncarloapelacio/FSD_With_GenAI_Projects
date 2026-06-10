// Admin dashboard. Lets an admin add, edit and delete employees right on the
// page, with a popup form and a delete confirmation.
(function () {
  var E = window.EMS;

  var employees = [];
  var editingId = null;
  var pendingDeleteId = null;

  function detail(label, value) {
    var shown = value && String(value).trim() !== '' ? value : 'Not set';
    return '<p class="emp-detail"><span class="lbl">' + label + ':</span> ' + E.escapeHtml(shown) + '</p>';
  }

  function render() {
    var grid = E.qs('#emp-grid');
    E.qs('#emp-count').textContent = employees.length;
    if (!employees.length) {
      grid.innerHTML = '<div class="empty-state">No employees yet. Use Add Employee to create one.</div>';
      return;
    }
    grid.innerHTML = employees.map(function (e) {
      var age = E.calcAge(e.dob);
      var pending = e.active ? '' : '<span class="emp-pending" data-cy="emp-pending">Pending signup</span>';
      return '' +
        '<article class="emp-card" data-id="' + e.id + '" data-cy="emp-card">' +
          '<h3>' + E.escapeHtml(e.name) + pending + '</h3>' +
          '<span class="emp-role">' + E.escapeHtml(e.designation) + '</span>' +
          detail('Email', e.email) +
          detail('Contact', e.contact) +
          detail('Department', e.department) +
          detail('Joining Date', E.formatDate(e.joiningDate)) +
          detail('Location', e.location) +
          detail('Date of Birth', E.formatDate(e.dob)) +
          detail('Age', age != null ? age : '') +
          '<div class="card-actions">' +
            '<button class="btn btn-danger btn-sm" data-action="delete" data-id="' + e.id + '" data-cy="delete-emp">Delete</button>' +
            '<button class="btn btn-dark btn-sm" data-action="edit" data-id="' + e.id + '" data-cy="edit-emp">Edit</button>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  async function load() {
    try {
      var data = await E.fetchJSON('/api/employees');
      employees = data.employees || [];
      render();
    } catch (err) {
      E.qs('#emp-grid').innerHTML = '<div class="empty-state">' + E.escapeHtml(err.message) + '</div>';
    }
  }

  // Add / edit popup. Admins only set name, email, designation, department and
  // date of birth; the employee fills in phone and location at signup.
  var modal;
  function openModal(emp) {
    editingId = emp ? emp.id : null;
    E.qs('#emp-modal-title').textContent = emp ? 'Edit Employee' : 'Add Employee';
    E.qs('#emp-name').value = emp ? emp.name : '';
    E.qs('#emp-email').value = emp ? emp.email : '';
    E.qs('#emp-designation').value = emp ? emp.designation : '';
    E.qs('#emp-department').value = emp ? emp.department : '';
    E.qs('#emp-dob').value = emp ? E.isoToDisplay(emp.dob) : '';
    E.setMsg(E.qs('#emp-msg'), '', null);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  // Delete confirmation popup.
  var confirmModal;
  function openConfirm(emp) {
    pendingDeleteId = emp.id;
    E.qs('#confirm-text').textContent = 'Delete ' + emp.name + '? This cannot be undone.';
    confirmModal.classList.add('open');
    confirmModal.setAttribute('aria-hidden', 'false');
  }
  function closeConfirm() {
    pendingDeleteId = null;
    confirmModal.classList.remove('open');
    confirmModal.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('DOMContentLoaded', function () {
    modal = E.qs('#emp-modal');
    confirmModal = E.qs('#confirm-modal');
    load();

    // Refresh the list whenever the Employees tab is opened, so it always shows
    // the latest data (for example after someone edits their account).
    document.addEventListener('ems:section', function (ev) {
      if (ev.detail && ev.detail.section === 'employees') load();
    });

    E.qs('#add-emp-btn').addEventListener('click', function () { openModal(null); });
    E.qs('#emp-modal-close').addEventListener('click', closeModal);
    E.qs('#emp-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    E.attachDateInput(E.qs('#emp-dob'));

    E.qs('#emp-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var dob = E.parseFlexibleDate(E.qs('#emp-dob').value);
      if (!dob) {
        E.setMsg(E.qs('#emp-msg'), 'Please enter a valid date of birth.', 'error');
        return;
      }
      E.qs('#emp-dob').value = dob.display;
      var payload = {
        name: E.qs('#emp-name').value,
        email: E.qs('#emp-email').value,
        designation: E.qs('#emp-designation').value,
        department: E.qs('#emp-department').value,
        dob: dob.iso,
      };
      var url = editingId ? '/api/employees/' + editingId : '/api/employees';
      var method = editingId ? 'PUT' : 'POST';
      try {
        await E.fetchJSON(url, { method: method, body: payload });
        closeModal();
        E.toast(editingId ? 'Employee updated' : 'Employee added', 'success');
        await load();
      } catch (err) {
        E.setMsg(E.qs('#emp-msg'), err.message, 'error');
      }
    });

    // One click handler for all the edit and delete buttons in the grid.
    E.qs('#emp-grid').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var emp = employees.find(function (x) { return x.id === Number(btn.getAttribute('data-id')); });
      if (!emp) return;
      if (btn.getAttribute('data-action') === 'edit') openModal(emp);
      else openConfirm(emp);
    });

    E.qs('#confirm-cancel').addEventListener('click', closeConfirm);
    confirmModal.addEventListener('click', function (e) { if (e.target === confirmModal) closeConfirm(); });
    E.qs('#confirm-ok').addEventListener('click', async function () {
      if (!pendingDeleteId) return;
      var id = pendingDeleteId;
      try {
        await E.fetchJSON('/api/employees/' + id, { method: 'DELETE' });
        closeConfirm();
        E.toast('Employee deleted', 'success');
        await load();
      } catch (err) {
        closeConfirm();
        E.toast(err.message, 'error');
      }
    });
  });
})();
