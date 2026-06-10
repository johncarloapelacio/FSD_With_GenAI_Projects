// Drives the signup page. Employees go through two steps: a gatekeeper form
// (name, email, date of birth) and then, only if they match a record an admin
// added, a second form for password, phone and location. Admins fill one form
// with the passcode. Nobody is logged in automatically after signing up.
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

    // Employee step 1: confirm they were added by an admin.
    verifyForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      setError('');
      var dob = E.parseFlexibleDate(id('emp-dob').value);
      if (!dob) { setError('Please enter a valid date of birth.'); return; }
      id('emp-dob').value = dob.display;
      try {
        await E.fetchJSON('/api/signup/verify', {
          method: 'POST',
          body: { name: id('emp-name').value, email: id('emp-email').value, dob: dob.iso },
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
            passcode: id('adm-passcode').value,
          },
        });
        showSuccess();
      } catch (err) {
        setError(err.message);
      }
    });
  });
})();
