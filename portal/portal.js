'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const callback = new URL('index.html', location.href);
  callback.search = ''; callback.hash = '';
  const query = new URLSearchParams(location.search);
  const invitation = new URLSearchParams(location.hash.slice(1));
  // Remove transient authorization values before any further navigation.
  history.replaceState(null, '', callback.pathname);
  const fail = message => { $('title').textContent = 'Connection needs attention.'; $('message').textContent = message; };
  if (query.has('code') || query.has('error')) {
    const state = query.get('state');
    let expected;
    try { expected = sessionStorage.getItem('qb_state'); sessionStorage.removeItem('qb_state'); }
    catch { fail('Browser storage is unavailable. Reopen your invitation with browser storage enabled.'); return; }
    if (!expected || state !== expected) { fail('This response does not match an invitation opened in this tab. Ask for a new invitation and try again.'); return; }
    if (query.has('error')) { fail('Access was not approved. Ask your integration administrator for a new invitation when you are ready.'); return; }
    if (!query.get('code') || !query.get('realmId')) { fail('Intuit returned an incomplete response. Please try a new invitation.'); return; }
    const result = new URL(callback);
    for (const key of ['code', 'state', 'realmId']) result.searchParams.set(key, query.get(key));
    $('title').textContent = 'Approval received.';
    $('message').textContent = 'One step remains: return this response so your integration administrator can finish connecting QuickBooks.';
    $('response').value = result.href; $('result').hidden = false;
    $('copy').onclick = async () => {
      try { await navigator.clipboard.writeText(result.href); $('notice').textContent = 'Copied. Return the response to your integration administrator.'; }
      catch { $('response').select(); $('notice').textContent = 'Select and copy the response above.'; }
    };
    return;
  }
  const client = invitation.get('client_id'), state = invitation.get('state');
  if (!client || !state) return;
  try { sessionStorage.setItem('qb_state', state); }
  catch { fail('Enable browser storage and reopen your invitation to connect.'); return; }
  const auth = new URL('https://appcenter.intuit.com/connect/oauth2');
  const params = { client_id: client, state, redirect_uri: callback.href, response_type: 'code', scope: 'com.intuit.quickbooks.accounting' };
  for (const [key, value] of Object.entries(params)) auth.searchParams.set(key, value);
  $('message').textContent = 'Authorize DAF Grant Sync to record Founders Pledge grants in your company’s books.';
  $('authorize').href = auth.href; $('connect').hidden = false;
})();
