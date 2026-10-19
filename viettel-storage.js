/**
 * viettel-storage.js
 * Thay thế Supabase Storage bằng Viettel Cloud Object Storage (S3-compatible).
 *
 * API tương thích với cách dùng cũ:
 *   ViettelStorage.from('bucket').upload(path, file, opts)
 *   ViettelStorage.from('bucket').getPublicUrl(path)  → { data: { publicUrl } }
 *   ViettelStorage.from('bucket').remove([path1, path2])
 *
 * Lưu ý: Viettel S3 không hỗ trợ CORS từ browser cho PUT trực tiếp với AWS Signature V4
 * nên upload dùng XMLHttpRequest với presigned URL approach qua một proxy nhỏ,
 * HOẶC dùng chế độ public bucket + form POST.
 * 
 * → Giải pháp đơn giản nhất cho frontend-only: upload qua fetch với AWS Signature V4
 *   tự ký trong browser (không cần backend).
 */

(function (global) {
  'use strict';

  /* ── CẤU HÌNH VIETTEL CLOUD STORAGE ── */
  var VS_CONFIG = {
    endpoint:  'https://s3-north1.viettelidc.com.vn',
    accessKey: '037300543b09f3537bf2',
    secretKey: 'XBv+EmidaKHqbO6x9OR72tmHHBUBZVGJ3FIcVsAm',
    bucket:    'dhdt',
    region:    'north1'   // region của Viettel IDC Hà Nội
  };

  /* ── Helpers SHA-256 / HMAC-SHA256 dùng Web Crypto ── */
  async function _sha256(message) {
    const msgBuffer = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function _hmacSha256(key, message) {
    const keyMaterial = typeof key === 'string'
      ? new TextEncoder().encode(key)
      : key;
    const msgBuffer = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyMaterial, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgBuffer);
    return new Uint8Array(sig);
  }

  async function _hmacSha256Hex(key, message) {
    const buf = await _hmacSha256(key, message);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── Tạo AWS Signature V4 cho PUT object ── */
  async function _signRequest(method, objectKey, file, contentType) {
    const cfg = VS_CONFIG;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);

    const host = cfg.endpoint.replace('https://', '');
    const url = `${cfg.endpoint}/${cfg.bucket}/${objectKey}`;

    // Hash payload
    let payloadHash;
    if (method === 'DELETE') {
      payloadHash = await _sha256('');
    } else {
      payloadHash = await _sha256(await file.arrayBuffer());
    }

    // Canonical request
    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      method,
      `/${cfg.bucket}/${objectKey}`,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    // String to sign
    const credentialScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      await _sha256(canonicalRequest)
    ].join('\n');

    // Signing key
    const kDate    = await _hmacSha256('AWS4' + cfg.secretKey, dateStamp);
    const kRegion  = await _hmacSha256(kDate, cfg.region);
    const kService = await _hmacSha256(kRegion, 's3');
    const kSigning = await _hmacSha256(kService, 'aws4_request');
    const signature = await _hmacSha256Hex(kSigning, stringToSign);

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${cfg.accessKey}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      url,
      headers: {
        'Authorization':        authorization,
        'Content-Type':         contentType,
        'x-amz-date':           amzDate,
        'x-amz-content-sha256': payloadHash
      }
    };
  }

  /* ── Tạo AWS Signature V4 cho DELETE object ── */
  async function _signDelete(objectKey) {
    const cfg = VS_CONFIG;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);
    const host = cfg.endpoint.replace('https://', '');
    const url = `${cfg.endpoint}/${cfg.bucket}/${objectKey}`;
    const payloadHash = await _sha256('');

    const canonicalHeaders =
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [
      'DELETE',
      `/${cfg.bucket}/${objectKey}`,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    const credentialScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      await _sha256(canonicalRequest)
    ].join('\n');

    const kDate    = await _hmacSha256('AWS4' + cfg.secretKey, dateStamp);
    const kRegion  = await _hmacSha256(kDate, cfg.region);
    const kService = await _hmacSha256(kRegion, 's3');
    const kSigning = await _hmacSha256(kService, 'aws4_request');
    const signature = await _hmacSha256Hex(kSigning, stringToSign);

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${cfg.accessKey}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      url,
      headers: {
        'Authorization':        authorization,
        'x-amz-date':           amzDate,
        'x-amz-content-sha256': payloadHash
      }
    };
  }

  /* ── BucketRef: đối tượng trả về từ ViettelStorage.from() ── */
  function BucketRef(bucketName) {
    this.bucketName = bucketName;
  }

  /**
   * Upload file lên Viettel S3
   * @param {string} path - Đường dẫn object key (vd: 'videos/123/video.mp4')
   * @param {File|Blob} file
   * @param {object} [opts] - { cacheControl, upsert, contentType }
   * @returns {Promise<{ data: { path }, error: null | Error }>}
   */
  BucketRef.prototype.upload = async function (path, file, opts) {
    try {
      const contentType = (opts && opts.contentType) || file.type || 'application/octet-stream';
      const { url, headers } = await _signRequest('PUT', path, file, contentType);

      const resp = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: file
      });

      if (!resp.ok) {
        const txt = await resp.text();
        return { data: null, error: new Error(`Upload thất bại (${resp.status}): ${txt}`) };
      }
      return { data: { path }, error: null };
    } catch (e) {
      return { data: null, error: e };
    }
  };

  /**
   * Lấy public URL của object
   * @param {string} path - Object key
   * @returns {{ data: { publicUrl: string } }}
   */
  BucketRef.prototype.getPublicUrl = function (path) {
    const cfg = VS_CONFIG;
    const publicUrl = `${cfg.endpoint}/${cfg.bucket}/${path}`;
    return { data: { publicUrl } };
  };

  /**
   * Xóa một hoặc nhiều object
   * @param {string[]} paths - Mảng object keys cần xóa
   * @returns {Promise<{ error: null | Error }>}
   */
  BucketRef.prototype.remove = async function (paths) {
    try {
      for (const path of paths) {
        const { url, headers } = await _signDelete(path);
        const resp = await fetch(url, { method: 'DELETE', headers });
        if (!resp.ok && resp.status !== 404) {
          console.warn(`[ViettelStorage] Xóa ${path} thất bại: ${resp.status}`);
        }
      }
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  };

  /* ── ViettelStorage: interface chính ── */
  var ViettelStorage = {
    /**
     * Chọn bucket để thao tác
     * @param {string} _bucketName - Tên bucket (bỏ qua, luôn dùng bucket 'chdt')
     * @returns {BucketRef}
     */
    from: function (_bucketName) {
      return new BucketRef(VS_CONFIG.bucket);
    },

    /** Lấy config hiện tại */
    getConfig: function () {
      return Object.assign({}, VS_CONFIG);
    }
  };

  global.ViettelStorage = ViettelStorage;

})(typeof window !== 'undefined' ? window : globalThis);
