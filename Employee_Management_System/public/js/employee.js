// Employee dashboard. Shows the company directory as read-only cards. There is
// no date of birth or age here (those stay private), and no edit or delete.
(function () {
  var E = window.EMS;

  function detail(label, value) {
    var shown = value && String(value).trim() !== '' ? value : 'Not set';
    return '<p class="emp-detail"><span class="lbl">' + label + ':</span> ' + E.escapeHtml(shown) + '</p>';
  }

  async function load() {
    var grid = E.qs('#emp-grid');
    try {
      var data = await E.fetchJSON('/api/employees');
      var employees = data.employees || [];
      E.qs('#emp-count').textContent = employees.length;
      if (!employees.length) {
        grid.innerHTML = '<div class="empty-state">No employees found.</div>';
        return;
      }
      grid.innerHTML = employees.map(function (e) {
        return '' +
          '<article class="emp-card" data-cy="directory-card">' +
            '<h3>' + E.escapeHtml(e.name) + '</h3>' +
            '<span class="emp-role">' + E.escapeHtml(e.designation) + '</span>' +
            detail('Email', e.email) +
            detail('Contact', e.contact) +
            detail('Department', e.department) +
            detail('Joining Date', E.formatDate(e.joiningDate)) +
            detail('Location', e.location) +
          '</article>';
      }).join('');
    } catch (err) {
      grid.innerHTML = '<div class="empty-state">' + E.escapeHtml(err.message) + '</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', load);

  // Reload the directory each time the Directory tab is opened so changes made
  // in "My Account" during this session show up right away.
  document.addEventListener('ems:section', function (e) {
    if (e.detail && e.detail.section === 'directory') load();
  });
})();
