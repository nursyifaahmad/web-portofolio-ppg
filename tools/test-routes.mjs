import http from 'node:http';

const routes = [
  '/',
  '/en',
  '/profil',
  '/en/profil',
  '/galeri',
  '/en/galeri',
  '/matkul/matrikulasi',
  '/matkul/pembelajaran-berdiferensiasi',
  '/matkul/pma-1',
  '/matkul/ppl-1',
  '/matkul/projek-kepemimpinan',
  '/matkul/seminar-ppg',
  '/en/matkul/pembelajaran-berdiferensiasi',
  '/img/avatar.jpg',
  '/img/galeri/ppl-dokumentasi-01.jpg'
];

async function checkRoute(r) {
  return new Promise((resolve) => {
    http.get(`http://localhost:4321${r}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const isOk = res.statusCode === 200;
        const hasViewport = data.includes('viewport-fit=cover');
        const hasMobileNav = data.includes('md:hidden fixed bottom-0');
        const hasTerminal = data.includes('terminal-modal');
        resolve({
          route: r,
          status: res.statusCode,
          ok: isOk,
          isHtml: res.headers['content-type']?.includes('text/html'),
          hasViewport,
          hasMobileNav,
          hasTerminal
        });
      });
    }).on('error', (err) => {
      resolve({ route: r, status: 'ERROR', error: err.message });
    });
  });
}

console.log('Testing routes against http://localhost:4321 ...');
const results = await Promise.all(routes.map(checkRoute));

let allPassed = true;
for (const res of results) {
  if (res.status !== 200) {
    console.error(`❌ [${res.status}] ${res.route}`);
    allPassed = false;
  } else {
    if (res.isHtml) {
      const mobileChecks = res.hasViewport && res.hasMobileNav && res.hasTerminal;
      if (mobileChecks) {
        console.log(`✅ [200 OK] ${res.route} (Mobile Viewport: OK | BottomNav: OK | CLI: OK)`);
      } else {
        console.warn(`⚠️ [200 OK] ${res.route} (Mobile checks incomplete)`);
        allPassed = false;
      }
    } else {
      console.log(`✅ [200 OK] ${res.route} (Asset)`);
    }
  }
}

if (allPassed) {
  console.log('\n🎉 ALL 15 VERIFICATION ROUTES PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
}
