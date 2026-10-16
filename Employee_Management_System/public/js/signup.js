// Employee enrollment requires a valid invitation and matching employee details.
// Administrator enrollment requires an existing administrator session.
(function () {
  var E = window.EMS;
  function id(x) { return document.getElementById(x); }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  document.addEventListener('DOMContentLoaded', function () {
    var errorBox = id('signup-error');
    var employeeFlow = id('employee-flow');
    var adminForm = id('admin-form');
    var verifyForm = id('emp-verify-form');
    var completeForm = id('emp-complete-form');
    var successPanel = id('signup-success');
    var links = id('signup-links');
    var inviteToken = new URLSearchParams(window.location.search).get('invite') || '';

    // Let people type dates and phone numbers naturally; tidy them up on blur.
    E.attachDateInput(id('emp-dob'));
    E.attachDateInput(id('adm-dob'));
    E.attachPhoneInput(id('emp-contact'));

    function setError(msg) {
      if (!msg) { hide(errorBox); errorBox.textContent = ''; return; }
      errorBox.textContent = msg;
      show(errorBox);
    }

    function currentRole() {
      var adminRadio = document.querySelector('input[name=role][value=admin]');
      return adminRadio && adminRadio.checked ? 'admin' : 'employee';
    }

    function applyRole() {
      setError('');
      if (currentRole() === 'admin') {
        hide(employeeFlow);
        show(adminForm);
      } else {
        show(employeeFlow);
        show(verifyForm);
        hide(completeForm);
        hide(adminForm);
      }
    }

    document.querySelectorAll('input[name=role]').forEach(function (r) {
      r.addEventListener('change', applyRole);
    });
    applyRole();

    function showSuccess() {
      hide(employeeFlow);
      hide(adminForm);
      hide(links);
      setError('');
      show(successPanel);
    }

    // Verify the invitation before displaying the account form.
    verifyForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      setError('');
      var dob = E.parseFlexibleDate(id('emp-dob').value);
      if (!dob) { setError('Please enter a valid date of birth.'); return; }
      id('emp-dob').value = dob.display;
      try {
        await E.fetchJSON('/api/signup/verify', {
          method: 'POST',
          body: { name: id('emp-name').value, email: id('emp-email').value, dob: dob.iso, inviteToken: inviteToken },
        });
        hide(verifyForm);
        show(completeForm);
      } catch (err) {
        setError(err.message);
      }
    });

    // Employee step 2: finish the account.
    completeForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      setError('');
      var dob = E.parseFlexibleDate(id('emp-dob').value);
      if (!dob) { setError('Please enter a valid date of birth.'); return; }
      var contact = E.formatPhone(id('emp-contact').value);
      id('emp-contact').value = contact;
      try {
        await E.fetchJSON('/api/signup/employee', {
          method: 'POST',
          body: {
            name: id('emp-name').value,
            email: id('emp-email').value,
            dob: dob.iso,
            password: id('emp-password').value,
            contact: contact,
            location: id('emp-location').value,
            inviteToken: inviteToken,
          },
        });
        showSuccess();
      } catch (err) {
        setError(err.message);
      }
    });

    // Admin signup.
    adminForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      setError('');
      var dob = E.parseFlexibleDate(id('adm-dob').value);
      if (!dob) { setError('Please enter a valid date of birth.'); return; }
      id('adm-dob').value = dob.display;
      try {
        await E.fetchJSON('/api/signup/admin', {
          method: 'POST',
          body: {
            name: id('adm-name').value,
            email: id('adm-email').value,
            dob: dob.iso,
            password: id('adm-password').value,
          },
        });
        showSuccess();
      } catch (err) {
        setError(err.message);
      }
    });
  });
})();
