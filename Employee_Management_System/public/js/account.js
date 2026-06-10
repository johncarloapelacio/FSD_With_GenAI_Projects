// Handles the "My Account" section on both dashboards. It only sends the fields
// that actually exist on the page, so the same code works for admins (who can
// edit designation and department) and employees (who cannot).
(function () {
  var E = window.EMS;

  document.addEventListener('DOMContentLoaded', function () {
    var profileForm = E.qs('#profile-form');
    var passwordForm = E.qs('#password-form');

    // Tidy a typed phone number (e.g. 10 digits) into ###-###-#### on blur.
    E.attachPhoneInput(E.qs('#acct-contact'));

    if (profileForm) {
      profileForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var msg = E.qs('#profile-msg');
        var payload = {};
        ['designation', 'department', 'contact', 'location'].forEach(function (field) {
          var el = E.qs('#acct-' + field);
          if (!el) return;
          payload[field] = field === 'contact' ? E.formatPhone(el.value) : el.value;
          if (field === 'contact') el.value = payload[field];
        });
        try {
          await E.fetchJSON('/api/account/profile', { method: 'PUT', body: payload });
          E.setMsg(msg, 'Profile updated successfully.', 'success');
          E.toast('Profile saved', 'success');
        } catch (err) {
          E.setMsg(msg, err.message, 'error');
        }
      });
    }

    if (passwordForm) {
      passwordForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var msg = E.qs('#password-msg');
        var cur = E.qs('#cur-pass').value;
        var nw = E.qs('#new-pass').value;
        var cf = E.qs('#confirm-pass').value;
        if (nw !== cf) {
          E.setMsg(msg, 'New passwords do not match.', 'error');
          return;
        }
        try {
          await E.fetchJSON('/api/account/password', { method: 'PUT', body: { currentPassword: cur, newPassword: nw } });
          E.setMsg(msg, 'Password updated successfully.', 'success');
          passwordForm.reset();
          E.toast('Password changed', 'success');
        } catch (err) {
          E.setMsg(msg, err.message, 'error');
        }
      });
    }
  });
})();
