/* Shared helpers + SPA-style section navigation (no page reloads). */
(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function fetchJSON(url, options) {
    var opts = Object.assign({ headers: {} }, options || {});
    if (opts.body && typeof opts.body === 'object') {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    var res = await fetch(url, opts);
    var data = {};
    try { data = await res.json(); } catch (e) { /* non-JSON response */ }
    if (!res.ok) {
      var err = new Error((data && data.error) || ('Request failed (' + res.status + ')'));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // Parse 'YYYY-MM-DD' as a local date (no UTC off-by-one).
  function parseDateLocal(value) {
    if (!value) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(value) {
    var d = parseDateLocal(value);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function calcAge(dob) {
    var b = parseDateLocal(dob);
    if (!b) return null;
    var n = new Date();
    var a = n.getFullYear() - b.getFullYear();
    var m = n.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--;
    return a >= 0 ? a : null;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  // Accept a date typed in lots of natural ways (6/3/2000, June 3 2000,
  // June 03, 2000, 2000-06-03) and give back both an ISO value for storage and
  // an MM-DD-YYYY value to show the user. Returns null if it cannot be read.
  function parseFlexibleDate(value) {
    if (!value) return null;
    var s = String(value).trim();
    var y;
    var m;
    var d;
    var iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    var mdy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s);
    if (iso) { y = +iso[1]; m = +iso[2]; d = +iso[3]; }
    else if (mdy) { m = +mdy[1]; d = +mdy[2]; y = +mdy[3]; }
    else {
      var dt = new Date(s);
      if (isNaN(dt.getTime())) return null;
      y = dt.getFullYear(); m = dt.getMonth() + 1; d = dt.getDate();
    }
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return null;
    // Make sure it is a real day (catches things like 02-30-2000).
    var check = new Date(y, m - 1, d);
    if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) return null;
    return { iso: y + '-' + pad2(m) + '-' + pad2(d), display: pad2(m) + '-' + pad2(d) + '-' + y };
  }

  function isoToDisplay(value) {
    var p = parseFlexibleDate(value);
    return p ? p.display : '';
  }

  // Reformat a date field to MM-DD-YYYY when the user leaves it.
  function attachDateInput(el) {
    if (!el) return;
    el.addEventListener('blur', function () {
      var p = parseFlexibleDate(el.value);
      if (p) el.value = p.display;
    });
  }

  // Turn 10 typed digits into ###-###-####. Leaves anything else untouched so
  // validation can still flag it.
  function formatPhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) return digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
    return String(value || '').trim();
  }

  function attachPhoneInput(el) {
    if (!el) return;
    el.addEventListener('blur', function () { el.value = formatPhone(el.value); });
  }

  function setMsg(el, text, type) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-error', 'is-success');
    if (type) el.classList.add('is-' + type);
  }

  var toastTimer;
  function toast(text, type) {
    var el = qs('#toast');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('is-error', 'is-success');
    if (type) el.classList.add('is-' + type);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  // Toggle visible section + active nav button.
  function initNav() {
    var items = qsa('.nav-item');
    var sections = qsa('.section');
    items.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-section');
        items.forEach(function (b) { b.classList.toggle('active', b === btn); });
        sections.forEach(function (s) {
          s.classList.toggle('active', s.getAttribute('data-section') === target);
        });
        // Let a section refresh its data whenever it is opened.
        document.dispatchEvent(new CustomEvent('ems:section', { detail: { section: target } }));
      });
    });
  }

  window.EMS = {
    qs: qs, qsa: qsa, escapeHtml: escapeHtml, fetchJSON: fetchJSON,
    formatDate: formatDate, calcAge: calcAge, setMsg: setMsg, toast: toast,
    parseFlexibleDate: parseFlexibleDate, isoToDisplay: isoToDisplay,
    attachDateInput: attachDateInput, formatPhone: formatPhone, attachPhoneInput: attachPhoneInput,
  };
  document.addEventListener('DOMContentLoaded', initNav);
})();
