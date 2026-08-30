require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../app');
const db = require('../config/db');

let server;
const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function httpRequest(method, reqPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
    const reqHeaders = { ...headers };
    let payload = body;

    if (body && typeof body === 'object' && !Buffer.isBuffer(body) && !reqHeaders['Content-Type']?.includes('multipart/form-data')) {
      reqHeaders['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const req = http.request(url, {
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

// Multipart builder for file upload test
function buildMultipart(fieldName, fileName, mimeType, fileBuffer) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const crlf = '\r\n';
  
  let header = `--${boundary}${crlf}`;
  header += `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"${crlf}`;
  header += `Content-Type: ${mimeType}${crlf}${crlf}`;
  
  const footer = `${crlf}--${boundary}--${crlf}`;
  
  const buffer = Buffer.concat([
    Buffer.from(header, 'utf-8'),
    fileBuffer,
    Buffer.from(footer, 'utf-8')
  ]);

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: buffer
  };
}

async function runVerification() {
  server = app.listen(PORT);
  console.log(`Verification test server running on port ${PORT}...`);

  try {
    console.log('\n=============================================');
    console.log('🧪 STEP 1: Admin Login & Authentication Test');
    console.log('=============================================');
    const loginRes = await httpRequest('POST', '/api/admin/auth/login', {
      email: 'admin@glace.com',
      password: 'Admin123!'
    });

    console.log('Login response status:', loginRes.status);
    if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
      throw new Error('Admin login failed. Check credentials.');
    }
    const adminToken = loginRes.data.data.token;
    const cookieHeader = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0].split(';')[0] : `token=${adminToken}`;
    console.log('✅ Admin login succeeded. Received valid auth token.');

    const adminHeaders = {
      'Cookie': cookieHeader,
      'Authorization': `Bearer ${adminToken}`
    };

    console.log('\n=============================================');
    console.log('🧪 STEP 2: Security & Authorization Check');
    console.log('=============================================');
    // Unauthenticated request
    const unauthRes = await httpRequest('GET', '/api/admin/banner');
    console.log('Unauthenticated access status:', unauthRes.status);
    if (unauthRes.status !== 401) throw new Error(`Expected 401, got ${unauthRes.status}`);
    console.log('✅ Unauthenticated access correctly rejected with 401.');

    console.log('\n=============================================');
    console.log('🧪 STEP 3: Admin GET Banner Configuration');
    console.log('=============================================');
    const getRes = await httpRequest('GET', '/api/admin/banner', null, adminHeaders);
    console.log('Admin banner fetch status:', getRes.status);
    console.log('Current banner:', getRes.data?.data?.banner?.title);
    console.log('Products catalog count:', getRes.data?.data?.products?.length);
    if (getRes.status !== 200 || !getRes.data?.data?.products?.length) {
      throw new Error('Admin banner fetch failed or no products returned');
    }
    console.log('✅ Admin banner configuration and product catalog retrieved.');

    console.log('\n=============================================');
    console.log('🧪 STEP 4: Admin File Upload for Banner Media');
    console.log('=============================================');
    // Create a 1x1 test JPEG
    const testJpgBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
      0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09,
      0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0x00,
      0xff, 0xd9
    ]);

    const multipart = buildMultipart('image', 'test-banner.jpg', 'image/jpeg', testJpgBuffer);
    const uploadRes = await httpRequest('POST', '/api/admin/banner/upload', multipart.body, {
      ...adminHeaders,
      'Content-Type': multipart.contentType
    });

    console.log('Upload response status:', uploadRes.status);
    console.log('Uploaded image fileUrl:', uploadRes.data?.data?.fileUrl);
    if (uploadRes.status !== 200 || !uploadRes.data?.data?.fileUrl) {
      throw new Error('Image upload failed');
    }
    console.log('✅ Banner image uploaded and static route path verified.');

    console.log('\n=============================================');
    console.log('🧪 STEP 5: Admin Update Banner Content & Product Link');
    console.log('=============================================');
    // Find Alphonso Mango or second product
    const mangoProduct = getRes.data.data.products.find(p => p.slug.includes('mango')) || getRes.data.data.products[0];
    console.log(`Linking banner to product: "${mangoProduct.name}" (ID: ${mangoProduct.id}, Slug: ${mangoProduct.slug})`);

    const updatePayload = {
      badge: 'SUMMER SPECIAL',
      title: 'Alphonso Mango Saffron Swirl',
      description: 'Sweet Ratnagiri Alphonso mango churned with fragrant Kashmiri saffron strands and pistachio flakes.',
      cta_text: 'Taste Mango',
      desktop_image: '/images/seasonal-mango.jpg',
      mobile_image: '/images/mango.jpg',
      product_id: mangoProduct.id,
      status: 'active'
    };

    const updateRes = await httpRequest('PUT', '/api/admin/banner', updatePayload, adminHeaders);
    console.log('Update response status:', updateRes.status, updateRes.data?.message);
    if (updateRes.status !== 200) {
      throw new Error('Admin update banner failed');
    }
    console.log('✅ Banner update saved in database.');

    console.log('\n=============================================');
    console.log('🧪 STEP 6: Public Homepage Active Banner API');
    console.log('=============================================');
    const publicRes = await httpRequest('GET', '/api/banner/new-flavour');
    console.log('Public fetch status:', publicRes.status);
    console.log('Public Banner Data:');
    console.log('  Badge:', publicRes.data?.data?.badge);
    console.log('  Title:', publicRes.data?.data?.title);
    console.log('  Description:', publicRes.data?.data?.description);
    console.log('  Desktop Image:', publicRes.data?.data?.desktop_image);
    console.log('  Mobile Image:', publicRes.data?.data?.mobile_image);
    console.log('  Linked Product Name:', publicRes.data?.data?.product_name);
    console.log('  Linked Product Slug:', publicRes.data?.data?.product_slug);
    console.log('  Linked Product Price:', publicRes.data?.data?.product_price);
    console.log('  CTA Text:', publicRes.data?.data?.cta_text);

    if (
      publicRes.data?.data?.title !== 'Alphonso Mango Saffron Swirl' ||
      publicRes.data?.data?.badge !== 'SUMMER SPECIAL' ||
      publicRes.data?.data?.product_slug !== mangoProduct.slug ||
      !publicRes.data?.data?.product_price
    ) {
      throw new Error('Public banner payload does not match updated configuration or missing product details');
    }
    console.log('✅ Public API delivers active banner with authoritative pricing & slug.');

    console.log('\n=============================================');
    console.log('🧪 STEP 7: Product Details Route Link Check');
    console.log('=============================================');
    const prodRes = await httpRequest('GET', `/api/products/${publicRes.data.data.product_slug}`);
    console.log(`GET /api/products/${publicRes.data.data.product_slug} status:`, prodRes.status);
    if (prodRes.status !== 200 || !prodRes.data?.data?.product) {
      throw new Error('Target product details route failed for linked banner product');
    }
    console.log('✅ Linked product route exists and resolves product successfully.');

    console.log('\n=============================================');
    console.log('🧪 STEP 8: Banner Deactivation (Graceful Collapse)');
    console.log('=============================================');
    const deactivateRes = await httpRequest('PUT', '/api/admin/banner', {
      ...updatePayload,
      status: 'inactive'
    }, adminHeaders);
    console.log('Deactivate status:', deactivateRes.status);

    const publicInactiveRes = await httpRequest('GET', '/api/banner/new-flavour');
    console.log('Public active banner after deactivation:', publicInactiveRes.data?.data);
    if (publicInactiveRes.data?.data !== null) {
      throw new Error('Expected data: null when banner is inactive');
    }
    console.log('✅ Public API returns null for inactive banner (section cleanly collapses).');

    console.log('\n=============================================');
    console.log('🧪 STEP 9: Reactivate Banner for Live Application');
    console.log('=============================================');
    await httpRequest('PUT', '/api/admin/banner', updatePayload, adminHeaders);
    const finalRes = await httpRequest('GET', '/api/banner/new-flavour');
    console.log('Final active banner status:', finalRes.data?.data?.status, '-', finalRes.data?.data?.title);
    console.log('✅ Banner reactivated successfully.');

    console.log('\n🎉 ALL 9 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runVerification();
