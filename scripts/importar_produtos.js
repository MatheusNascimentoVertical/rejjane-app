/**
 * Importa 111 produtos no Firestore a partir das URLs do Cloudinary.
 *
 * Pre-requisito:
 *   - scripts/serviceAccount.json  (baixado do Firebase Console ->
 *       Configuracoes do projeto -> Contas de servico -> Gerar nova chave privada)
 *   - scripts/urls_cloudinary.json (gerado por upload_cloudinary.py)
 *
 * Uso:
 *   node scripts/importar_produtos.js
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

const SA_PATH   = path.join(__dirname, 'serviceAccount.json');
const URLS_PATH = path.join(__dirname, 'urls_cloudinary.json');

// ── validacoes ──────────────────────────────────────────────────────────────
if (!fs.existsSync(SA_PATH)) {
  console.error('serviceAccount.json nao encontrado em scripts/');
  console.error('Baixe em: Firebase Console -> Configuracoes -> Contas de servico -> Gerar chave');
  process.exit(1);
}
if (!fs.existsSync(URLS_PATH)) {
  console.error('urls_cloudinary.json nao encontrado.');
  console.error('Execute primeiro: py scripts/upload_cloudinary.py');
  process.exit(1);
}

// ── inicializa Firebase Admin ────────────────────────────────────────────────
const serviceAccount = require(SA_PATH);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ── dados ───────────────────────────────────────────────────────────────────
const urls = JSON.parse(fs.readFileSync(URLS_PATH, 'utf8'));

// Categorias e marcas possiveis (Rejane ajusta depois no app)
const MARCAS = ['Tupperware', 'Avon', 'Boticario', 'Eudora', 'Natura'];
const CATS   = ['Kit', 'Creme', 'Perfume', 'Maquiagem', 'Cozinha', 'Casa', 'Acessorio'];

async function main() {
  const colRef = db.collection('produtos');

  // checa se ja existem produtos para nao duplicar
  const snap = await colRef.limit(1).get();
  if (!snap.empty) {
    console.log('Atencao: ja existem produtos no Firestore.');
    console.log('Deseja continuar e adicionar mais? (Ctrl+C para cancelar, Enter para continuar)');
    await new Promise(r => process.stdin.once('data', r));
  }

  console.log(`\nImportando ${urls.length} produtos...\n`);

  const batch_size = 400; // Firestore limite de 500 por batch
  let count = 0;

  for (let i = 0; i < urls.length; i += batch_size) {
    const batch = db.batch();
    const slice = urls.slice(i, i + batch_size);

    for (const item of slice) {
      const num   = String(count + 1).padStart(3, '0');
      const docRef = colRef.doc();
      batch.set(docRef, {
        nome:  `Produto ${num}`,
        marca: '',        // Rejane preenche no app
        cat:   '',        // Rejane preenche no app
        preco: 0,         // Rejane define o preco
        foto:  item.url,
        ativo: true,
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
  console.error('Erro:', err.message);
  process.exit(1);
});
