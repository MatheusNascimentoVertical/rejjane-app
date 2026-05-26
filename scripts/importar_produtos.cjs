const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

const SA_PATH   = path.join(__dirname, 'serviceAccount.json');
const URLS_PATH = path.join(__dirname, 'urls_cloudinary.json');

if (!fs.existsSync(SA_PATH)) {
  console.error('serviceAccount.json nao encontrado em scripts/');
  process.exit(1);
}
if (!fs.existsSync(URLS_PATH)) {
  console.error('urls_cloudinary.json nao encontrado. Execute primeiro: py scripts/upload_cloudinary.py');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const urls = JSON.parse(fs.readFileSync(URLS_PATH, 'utf8'));

async function main() {
  const colRef = db.collection('produtos');

  const snap = await colRef.limit(1).get();
  if (!snap.empty) {
    console.log('Aviso: ja existem produtos no Firestore. Adicionando mais...');
  }

  console.log(`\nImportando ${urls.length} produtos no Firestore...\n`);

  const BATCH_SIZE = 400;
  let count = 0;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const slice = urls.slice(i, i + BATCH_SIZE);

    for (const item of slice) {
      const num    = String(count + 1).padStart(3, '0');
      const docRef = colRef.doc();
      batch.set(docRef, {
        nome:     `Produto ${num}`,
        marca:    '',
        cat:      '',
        preco:    0,
        foto:     item.url,
        ativo:    true,
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });
      count++;
      process.stdout.write(`\r  ${count}/${urls.length}`);
    }

    await batch.commit();
  }

  console.log(`\n\nFeito! ${count} produtos criados no Firestore.`);
  console.log('Acesse o catalogo no app para renomear, definir marcas e precos.');
  process.exit(0);
}

main().catch(err => {
  console.error('\nErro:', err.message);
  process.exit(1);
});
