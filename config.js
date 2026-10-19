/* DHDT runtime config — credentials are obfuscated (not plaintext in source). */
(function (global) {
  'use strict';

  // Supabase project: xqazucpiuvxkuafpqjgb
  // URL + anon key stored as plaintext (obfuscation removed for new project)
  var _URL = 'https://xqazucpiuvxkuafpqjgb.supabase.co';
  var _KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXp1Y3BpdXZ4a3VhZnBxamdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzODgxMDksImV4cCI6MjEwNzk2NDEwOX0.PtYDGxQZEuifMrfDUBNqg-3VW8zUgpKQeYK_ou1wpDE';

  // Legacy obfuscation seed (giữ lại cho các getter khác: abstractKey, adminUser, adminPw)
  var _K = [68, 72, 68, 84, 64, 99, 102, 103, 35, 118, 49, 53];
  var _B = {
    e: 'dXkhNXRVVgUUFwMGcHgnMXhRBVITEAUEJXAiYSMBV14=',
    t: 'JSwpPS5SVFMWRQNxLA==',
    p: 'JSwpPS4HLl8aRgcA'
  };

  function _d(b64) {
    var raw = atob(b64);
    var out = '';
    for (var i = 0; i < raw.length; i++) {
      out += String.fromCharCode(raw.charCodeAt(i) ^ _K[i % _K.length]);
    }
    try { return decodeURIComponent(escape(out)); } catch (e) { return out; }
  }

  var cfg = {
    get url()         { return _URL; },
    get key()         { return _KEY; },
    get abstractKey() { return _d(_B.e); },
    get adminUser()   { return _d(_B.t); },
    get adminPw()     { return _d(_B.p); },
    createDb: function () {
      if (!global.supabase || !global.supabase.createClient) {
        throw new Error('Supabase SDK missing');
      }
      return global.supabase.createClient(_URL, _KEY);
    }
  };

  global.DH_CFG = cfg;
})(typeof window !== 'undefined' ? window : globalThis);
