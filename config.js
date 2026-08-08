/* DHDT runtime config — credentials are obfuscated (not plaintext in source). */
(function (global) {
  'use strict';
  var _K = [68, 72, 68, 84, 64, 99, 102, 103, 35, 118, 49, 53]; // seed
  var _B = {
    u: 'LDwwJDNZSUhEGVtFKScjPjIGEghbBl1MICIyM24QExdCFFBGIWYnOw==',
    a: 'ITEOPCIkBQ5sH3t8ETINZQ4KLxRqGGMAJwsNYgkIFj91NXsMai09HjAAVSpKOVh/PiwcFig6CyFZLGJ8NwEqHiw5Dy4VP1xRMikqFjQBVANSFVxjdCp3PDcBLgtIF19vKgEtIykAC15QLGJ8cgEpEjUBVFNKOnJ/NBEcBSksDCIQOEtWdAY+M3QsIiJQP1xjcCsHHXYuDCYWO0t0dQYAM3QuPlcNH312Cix2AhIuDz1MMEEDGwMnOBoPIBRsE19gCicJZHRSEgsSEF5XDAMAFQ==',
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
    get url() { return _d(_B.u); },
    get key() { return _d(_B.a); },
    get abstractKey() { return _d(_B.e); },
    get adminUser() { return _d(_B.t); },
    get adminPw() { return _d(_B.p); },
    createDb: function () {
      if (!global.supabase || !global.supabase.createClient) {
        throw new Error('Supabase SDK missing');
      }
      return global.supabase.createClient(cfg.url, cfg.key);
    }
  };

  global.DH_CFG = cfg;
})(typeof window !== 'undefined' ? window : globalThis);
