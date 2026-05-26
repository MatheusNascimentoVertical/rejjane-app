const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

const SA_PATH   = path.join(__dirname, 'serviceAccount.json');
const URLS_PATH = path.join(__dirname, 'urls_cloudinary.json');

const serviceAccount = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const urlsRaw = JSON.parse(fs.readFileSync(URLS_PATH, 'utf8'));

// Map: arquivo PNG name → cloudinary URL
const arquivoToUrl = {};
for (const item of urlsRaw) {
  arquivoToUrl[item.arquivo] = item.url;
}

// All 111 products keyed by JPEG filename stem (without "WhatsApp Image 2026-05-22 at " prefix)
const PRODUTOS = [
  { jpeg: '08.15.08.jpeg',       nome: 'Protetor Solar Facial Antioleosidade FPS 70',                                              preco: 79.90,  marca: 'boticario', cat: 'Protetor'   },
  { jpeg: '08.15.09 (1).jpeg',   nome: 'Coffee Woman Duo Oriental Amadeirado',                                                     preco: 219.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.09 (2).jpeg',   nome: 'Coffee Woman Duo Desodorante Colônia',                                                     preco: 219.90, marca: 'boticario', cat: 'Desodorante' },
  { jpeg: '08.15.09 (3).jpeg',   nome: 'Floratta Flores Secretas Desodorante Colônia',                                             preco: 164.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.09.jpeg',       nome: 'Coffee Woman Seduction Floriental',                                                        preco: 219.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.11 (1).jpeg',   nome: 'Lenço Umedecido Natura Mamãe e Bebê',                                                      preco: 36.90,  marca: 'natura',    cat: 'Cuidados'  },
  { jpeg: '08.15.11.jpeg',       nome: 'Kit Boti Baby Shampoo + Condicionador',                                                    preco: 119.90, marca: 'boticario', cat: 'Kit'       },
  { jpeg: '08.15.12 (1).jpeg',   nome: 'Botica 214 Fiji Paradise',                                                                 preco: 239.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.12 (2).jpeg',   nome: 'Botica 214 Golden Gardênia',                                                               preco: 239.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.12.jpeg',       nome: 'Sophie Colônia Hello',                                                                     preco: 119.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.13 (1).jpeg',   nome: 'Natura Ilía Florescer',                                                                    preco: 129.90, marca: 'natura',    cat: 'Perfume'    },
  { jpeg: '08.15.13.jpeg',       nome: 'Thaty Desodorante Colônia',                                                                preco: 147.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.14.jpeg',       nome: 'O.U.i Scapin 245',                                                                         preco: 379.00, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.15 (1).jpeg',   nome: 'Egeo Red',                                                                                 preco: 124.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.15 (2).jpeg',   nome: 'Eudora Rosé Eau de Parfum',                                                                preco: 239.90, marca: 'eudora',    cat: 'Perfume'    },
  { jpeg: '08.15.15 (3).jpeg',   nome: 'Eudora Golden Eau de Parfum',                                                              preco: 239.90, marca: 'eudora',    cat: 'Perfume'    },
  { jpeg: '08.15.15 (4).jpeg',   nome: 'Floratta Red',                                                                             preco: 129.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.15.jpeg',       nome: 'Egeo Dolce Colors',                                                                        preco: 159.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.16.jpeg',       nome: 'Floratta Rose Bouquet',                                                                    preco: 129.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.19 (1).jpeg',   nome: 'Eudora Niina Secrets Desodorante Colônia',                                                 preco: 145.00, marca: 'eudora',    cat: 'Desodorante' },
  { jpeg: '08.15.19.jpeg',       nome: 'Eudora Imensi Alive Desodorante Colônia',                                                  preco: 124.00, marca: 'eudora',    cat: 'Desodorante' },
  { jpeg: '08.15.20 (1).jpeg',   nome: 'Elysée Blanc Eau de Parfum',                                                               preco: 319.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.20 (2).jpeg',   nome: 'Lençol Malha King com Elástico',                                                           preco: 110.00, marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.20 (3).jpeg',   nome: 'Lençol Solteiro com Elástico Stitch',                                                      preco: 60.00,  marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.20 (4).jpeg',   nome: 'Colcha Queen com Babado e Elástico',                                                       preco: 140.00, marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.20.jpeg',       nome: 'Lily Eau de Parfum',                                                                       preco: 319.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.21 (1).jpeg',   nome: 'Tapete Porta',                                                                             preco: 20.00,  marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.21.jpeg',       nome: 'Natura Biografias',                                                                        preco: 209.90, marca: 'natura',    cat: 'Perfume'    },
  { jpeg: '08.15.22 (1).jpeg',   nome: 'Jogo de Cozinha 3 peças',                                                                  preco: 130.00, marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.22.jpeg',       nome: 'Kit 2 Tapetes e Passadeira de Cozinha',                                                    preco: 130.00, marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.23 (1).jpeg',   nome: 'Natura Humor da Minha Vida',                                                               preco: 89.90,  marca: 'natura',    cat: 'Perfume'    },
  { jpeg: '08.15.23 (2).jpeg',   nome: 'Capa de Sofá Estampada',                                                                   preco: 210.00, marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.23.jpeg',       nome: 'Natura Una',                                                                               preco: 319.90, marca: 'natura',    cat: 'Perfume'    },
  { jpeg: '08.15.24 (1).jpeg',   nome: 'Pano de Prato',                                                                            preco: 15.00,  marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.24 (2).jpeg',   nome: 'Cortina Blackout Vermelha 2,95x2,70',                                                      preco: 180.00, marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.24.jpeg',       nome: 'Floratta Red Passion Eau de Parfum',                                                       preco: 219.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.25 (1).jpeg',   nome: 'Linda Eau de Parfum',                                                                      preco: 177.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.25 (2).jpeg',   nome: 'Celebre Agora Desodorante Colônia',                                                        preco: 119.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.25 (3).jpeg',   nome: 'Her Code Climax Eau de Parfum',                                                            preco: 244.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.25.jpeg',       nome: 'Floratta Rose Sucrée Eau de Parfum',                                                       preco: 219.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.26 (1).jpeg',   nome: 'Her Code Touch Eau de Parfum',                                                             preco: 244.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.26 (2).jpeg',   nome: 'Natura Ilía Secreto Miniatura',                                                            preco: 70.00,  marca: 'natura',    cat: 'Perfume'    },
  { jpeg: '08.15.26.jpeg',       nome: 'Her Code Eau de Parfum',                                                                   preco: 244.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.28 (1).jpeg',   nome: 'Nativa SPA Lilac Body Splash',                                                             preco: 99.90,  marca: 'boticario', cat: 'Desodorante' },
  { jpeg: '08.15.28.jpeg',       nome: 'Natura Tododia Body Splash',                                                               preco: 69.90,  marca: 'natura',    cat: 'Hidratante', precoDe: 93.90 },
  { jpeg: '08.15.29 (1).jpeg',   nome: 'Cuide-se Bem Cereja Livre Body Splash',                                                    preco: 92.90,  marca: 'boticario', cat: 'Desodorante' },
  { jpeg: '08.15.29 (2).jpeg',   nome: 'Lily Antitranspirante Aerossol Jato Seco',                                                 preco: 39.90,  marca: 'boticario', cat: 'Desodorante' },
  { jpeg: '08.15.29 (3).jpeg',   nome: 'Malbec Black Legend',                                                                      preco: 259.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.29 (4).jpeg',   nome: 'Arbo Eau de Toilette',                                                                     preco: 131.90, marca: 'boticario', cat: 'Perfume',   precoDe: 179.90 },
  { jpeg: '08.15.29 (5).jpeg',   nome: 'Zaad Eau de Parfum',                                                                       preco: 329.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.29 (6).jpeg',   nome: 'Clash Eau de Toilette',                                                                    preco: 169.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.29.jpeg',       nome: 'Nativa SPA Ameixa + Orquídea Lumière Body Splash',                                         preco: 99.90,  marca: 'boticario', cat: 'Desodorante' },
  { jpeg: '08.15.30 (1).jpeg',   nome: 'Cuide-se Bem Rosa e Algodão Antitranspirante',                                             preco: 39.90,  marca: 'boticario', cat: 'Desodorante' },
  { jpeg: '08.15.30 (2).jpeg',   nome: 'Eudora Pulse Intense',                                                                     preco: 94.90,  marca: 'eudora',    cat: 'Perfume'    },
  { jpeg: '08.15.30 (3).jpeg',   nome: 'Natura Homem Evolut.io',                                                                   preco: 223.90, marca: 'natura',    cat: 'Perfume',   precoDe: 329.90 },
  { jpeg: '08.15.30 (4).jpeg',   nome: 'Boticollection Portinari Memórias',                                                        preco: 189.90, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.30.jpeg',       nome: 'Natura Essencial Oud',                                                                     preco: 249.90, marca: 'natura',    cat: 'Perfume',   precoDe: 289.90 },
  { jpeg: '08.15.31 (1).jpeg',   nome: 'Eudora Instance Frutas Vermelhas Body Splash',                                             preco: 74.99,  marca: 'eudora',    cat: 'Desodorante' },
  { jpeg: '08.15.31 (2).jpeg',   nome: 'Eudora Intention Body Spray Desodorante',                                                  preco: 39.90,  marca: 'eudora',    cat: 'Desodorante' },
  { jpeg: '08.15.31 (3).jpeg',   nome: 'Cuide-se Bem Cereja de Fases Spray Íntimo',                                                preco: 44.90,  marca: 'boticario', cat: 'Cuidados'  },
  { jpeg: '08.15.31.jpeg',       nome: 'Malbec Tradicional',                                                                       preco: 209.99, marca: 'boticario', cat: 'Perfume'    },
  { jpeg: '08.15.32.jpeg',       nome: 'Cuide-se Bem Deleite Chocolatudo Loção Hidratante',                                        preco: 49.90,  marca: 'boticario', cat: 'Hidratante', precoDe: 54.90 },
  { jpeg: '08.15.33 (1).jpeg',   nome: 'Celebre Loção Hidratante Desodorante Corporal',                                            preco: 42.90,  marca: 'boticario', cat: 'Hidratante' },
  { jpeg: '08.15.33 (2).jpeg',   nome: 'Her Code Loção Hidratante Desodorante Corporal',                                           preco: 67.90,  marca: 'boticario', cat: 'Hidratante' },
  { jpeg: '08.15.33 (3).jpeg',   nome: 'Cuide-se Bem Banana + Framboesa Loção Hidratante',                                         preco: 69.90,  marca: 'boticario', cat: 'Hidratante', precoDe: 74.90 },
  { jpeg: '08.15.33.jpeg',       nome: 'Cuide-se Bem Doçura na Pessegura Creme Hidratante',                                        preco: 49.90,  marca: 'boticario', cat: 'Hidratante', precoDe: 54.90 },
  { jpeg: '08.15.34.jpeg',       nome: 'Eudora Niina Secrets Niina Bloom Loção Hidratante',                                        preco: 41.90,  marca: 'eudora',    cat: 'Hidratante', precoDe: 54.99 },
  { jpeg: '08.15.35 (1).jpeg',   nome: 'Natura Tododia Creme Corporal Nutrição Prebiótica',                                        preco: 69.90,  marca: 'natura',    cat: 'Hidratante', precoDe: 78.90 },
  { jpeg: '08.15.35 (2).jpeg',   nome: 'Natura Tododia Cereja e Avelã + Macadâmia Creme Corporal',                                 preco: 69.90,  marca: 'natura',    cat: 'Hidratante' },
  { jpeg: '08.15.35 (3).jpeg',   nome: 'Natura Sève Óleo Corporal Amêndoas e Canela',                                              preco: 64.90,  marca: 'natura',    cat: 'Hidratante', precoDe: 117.90 },
  { jpeg: '08.15.35 (4).jpeg',   nome: 'Nativa SPA Ameixa Negra Loção Nutritiva Refil',                                            preco: 50.90,  marca: 'boticario', cat: 'Hidratante', precoDe: 67.90 },
  { jpeg: '08.15.35.jpeg',       nome: 'Eudora Lyra Loção Hidratante Desodorante Corporal',                                        preco: 52.99,  marca: 'eudora',    cat: 'Hidratante' },
  { jpeg: '08.15.36 (1).jpeg',   nome: 'Eudora Instance Frutas Vermelhas Creme Hidratante',                                        preco: 39.90,  marca: 'eudora',    cat: 'Hidratante' },
  { jpeg: '08.15.36 (2).jpeg',   nome: 'Natura Ekos Cacau Polpa Corporal Refil',                                                   preco: 59.90,  marca: 'natura',    cat: 'Hidratante', precoDe: 69.90 },
  { jpeg: '08.15.36 (3).jpeg',   nome: 'Eudora Imensi Alive Loção Hidratante',                                                     preco: 54.99,  marca: 'eudora',    cat: 'Hidratante' },
  { jpeg: '08.15.36.jpeg',       nome: 'Natura Tododia Capim Limão + Todanoite Creme Refil',                                       preco: 39.90,  marca: 'natura',    cat: 'Hidratante' },
  { jpeg: '08.15.37 (1).jpeg',   nome: 'Love Lily Creme Acetinado Hidratante',                                                     preco: 144.90, marca: 'boticario', cat: 'Hidratante' },
  { jpeg: '08.15.37 (2).jpeg',   nome: 'Lily Creme Acetinado Hidratante Refil',                                                    preco: 99.90,  marca: 'boticario', cat: 'Hidratante' },
  { jpeg: '08.15.37 (3).jpeg',   nome: 'Nativa SPA Uva Merlot Loção Nutritiva Refil',                                              preco: 67.90,  marca: 'boticario', cat: 'Hidratante' },
  { jpeg: '08.15.37.jpeg',       nome: 'Lily Creme Acetinado Hidratante Desodorante Corporal',                                     preco: 144.90, marca: 'boticario', cat: 'Hidratante' },
  { jpeg: '08.15.38 (1).jpeg',   nome: 'O.U.i Madeleine 862 Loção Hidratante',                                                     preco: 134.00, marca: 'boticario', cat: 'Hidratante' },
  { jpeg: '08.15.38 (2).jpeg',   nome: 'Natura Kaiak Acqua Gel Pós Sol Perfumado',                                                 preco: 49.90,  marca: 'natura',    cat: 'Hidratante' },
  { jpeg: '08.15.38 (3).jpeg',   nome: 'Quase Ar Next Shower Gel 2 em 1 Cabelo e Corpo',                                           preco: 49.90,  marca: 'boticario', cat: 'Cabelo'    },
  { jpeg: '08.15.38.jpeg',       nome: 'Natura UGUI Creme para o Corpo',                                                           preco: 49.90,  marca: 'natura',    cat: 'Hidratante', precoDe: 69.90 },
  { jpeg: '08.15.39 (1).jpeg',   nome: 'Natura Homem Sagaz Desodorante Antitranspirante Roll-on',                                  preco: 24.90,  marca: 'natura',    cat: 'Desodorante', precoDe: 29.90 },
  { jpeg: '08.15.39 (2).jpeg',   nome: 'Natura Tododia Cereja e Avelã Desodorante Roll-on',                                        preco: 24.90,  marca: 'natura',    cat: 'Desodorante', precoDe: 29.90 },
  { jpeg: '08.15.39 (3).jpeg',   nome: 'Natura Tododia Desodorante Antitranspirante em Creme Invisible',                           preco: 29.90,  marca: 'natura',    cat: 'Desodorante' },
  { jpeg: '08.15.39 (4).jpeg',   nome: 'Natura Lumina Antiqueda e Crescimento Kit Shampoo + Condicionador',                        preco: 89.90,  marca: 'natura',    cat: 'Cabelo',    precoDe: 116.80 },
  { jpeg: '08.15.39.jpeg',       nome: 'Avon Advance Techniques Nutrição Completa Óleo de Tratamento',                             preco: 49.90,  marca: 'avon',      cat: 'Cabelo'    },
  { jpeg: '08.15.40 (1).jpeg',   nome: 'Natura Lumina Anticaspa Shampoo Reequilibrante',                                           preco: 49.90,  marca: 'natura',    cat: 'Cabelo',    precoDe: 56.90 },
  { jpeg: '08.15.40 (2).jpeg',   nome: 'Natura Lumina Detox Capilar Shampoo',                                                      preco: 49.90,  marca: 'natura',    cat: 'Cabelo',    precoDe: 56.90 },
  { jpeg: '08.15.40.jpeg',       nome: 'Natura Lumina Hidratação e Antipoluição Kit Shampoo + Condicionador',                      preco: 89.90,  marca: 'natura',    cat: 'Cabelo'    },
  { jpeg: '08.15.41 (1).jpeg',   nome: 'Eudora Siàge Cica Therapy Kit Shampoo + Condicionador',                                    preco: 120.00, marca: 'eudora',    cat: 'Cabelo'    },
  { jpeg: '08.15.41 (2).jpeg',   nome: 'Eudora Siàge Hidratação Micelar Kit Shampoo + Condicionador',                              preco: 84.90,  marca: 'eudora',    cat: 'Cabelo',    precoDe: 97.98 },
  { jpeg: '08.15.41 (3).jpeg',   nome: 'Eudora Siàge Regeneração Pós Química Kit Shampoo + Condicionador',                         preco: 84.90,  marca: 'eudora',    cat: 'Cabelo'    },
  { jpeg: '08.15.41 (4).jpeg',   nome: 'Malbec Club Antiqueda Kit Shampoo + Condicionador',                                        preco: 99.90,  marca: 'boticario', cat: 'Cabelo'    },
  { jpeg: '08.15.41.jpeg',       nome: 'Natura Plant Hidratação Reparadora Condicionador',                                         preco: 39.00,  marca: 'natura',    cat: 'Cabelo'    },
  { jpeg: '08.15.42 (1).jpeg',   nome: 'Eudora Soul Máscara de Cílios + Blush Líquido Kit',                                        preco: 64.90,  marca: 'eudora',    cat: 'Maquiagem' },
  { jpeg: '08.15.42 (2).jpeg',   nome: 'Eudora Siàge Hair-Plastia Kit Shampoo + Condicionador',                                    preco: 84.90,  marca: 'eudora',    cat: 'Cabelo'    },
  { jpeg: '08.15.42 (3).jpeg',   nome: 'Natura Ekos Sabonete em Barra Kit 4 unidades',                                             preco: 45.90,  marca: 'natura',    cat: 'Cuidados'  },
  { jpeg: '08.15.42 (4).jpeg',   nome: 'Travesseiro Confort Bom Sono 50x70cm',                                                     preco: 35.00,  marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.42 (5).jpeg',   nome: 'Toalha de Rosto',                                                                          preco: 15.00,  marca: 'outro',     cat: 'Casa'       },
  { jpeg: '08.15.42 (6).jpeg',   nome: 'Eudora Siàge Cauterização dos Lisos Kit Shampoo + Condicionador + Máscara',                preco: 149.90, marca: 'eudora',    cat: 'Cabelo'    },
  { jpeg: '08.15.42.jpeg',       nome: 'Eudora Siàge Cica-Therapy Máscara Capilar Refil',                                          preco: 58.99,  marca: 'eudora',    cat: 'Cabelo'    },
  { jpeg: '08.15.43 (1).jpeg',   nome: 'Eudora Siàge Nutri Rosé Kit Shampoo + Condicionador + Máscara',                            preco: 149.90, marca: 'eudora',    cat: 'Cabelo'    },
  { jpeg: '08.15.43 (2).jpeg',   nome: 'Eudora Siàge Pro Cronology Curvas Kit Shampoo + Condicionador',                            preco: 80.00,  marca: 'eudora',    cat: 'Cabelo'    },
  { jpeg: '08.15.43 (3).jpeg',   nome: 'Elysée Creme Acetinado Hidratante',                                                        preco: 122.90, marca: 'boticario', cat: 'Hidratante', precoDe: 144.90 },
  { jpeg: '08.15.43.jpeg',       nome: 'Eudora Pulse Intense Shower Gel 3 em 1',                                                   preco: 24.90,  marca: 'eudora',    cat: 'Cuidados'  },
  { jpeg: '08.15.44 (1).jpeg',   nome: 'Linda Irresistível Eau de Parfum',                                                         preco: 177.90, marca: 'boticario', cat: 'Perfume',   precoDe: 209.90 },
  { jpeg: '08.15.44 (2).jpeg',   nome: 'Glamour Secrets Black',                                                                    preco: 154.90, marca: 'boticario', cat: 'Perfume',   precoDe: 189.90 },
  { jpeg: '08.15.44.jpeg',       nome: 'Eudora Little Niina Secrets Água de Colônia Baby',                                         preco: 99.90,  marca: 'eudora',    cat: 'Perfume',   precoDe: 125.90 },
];

// Build map: cloudinary URL → product data
const urlToProd = {};
const PREFIX = 'WhatsApp Image 2026-05-22 at ';

for (const prod of PRODUTOS) {
  const pngName = PREFIX + prod.jpeg.replace('.jpeg', '.png');
  const url = arquivoToUrl[pngName];
  if (!url) {
    console.warn(`AVISO: URL não encontrada para ${pngName}`);
    continue;
  }
  urlToProd[url] = prod;
}

console.log(`Mapeados ${Object.keys(urlToProd).length} de ${PRODUTOS.length} produtos para URLs Cloudinary\n`);

async function main() {
  const snap = await db.collection('produtos').get();
  console.log(`Encontrados ${snap.size} documentos no Firestore\n`);

  let atualizados = 0;
  let naoEncontrados = 0;
  const DELETE = admin.firestore.FieldValue.delete();

  const BATCH_SIZE = 400;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const slice = docs.slice(i, i + BATCH_SIZE);

    for (const docSnap of slice) {
      const data = docSnap.data();
      const fotoUrl = data.foto || data.fotoUrl || '';

      const prod = urlToProd[fotoUrl];
      if (!prod) {
        naoEncontrados++;
        process.stdout.write(`\r  Sem match: ${docSnap.id.slice(0, 8)} | fotoUrl: ${fotoUrl.slice(-30)}`);
        continue;
      }

      const update = {
        nome:    prod.nome,
        preco:   prod.preco,
        marca:   prod.marca,
        cat:     prod.cat,
        fotoUrl: fotoUrl,
        ativo:   true,
        foto:    DELETE,
      };
      if (prod.precoDe !== undefined) update.precoDe = prod.precoDe;

      batch.update(docSnap.ref, update);
      atualizados++;
      process.stdout.write(`\r  ${atualizados} atualizados...`);
    }

    await batch.commit();
  }

  console.log(`\n\nConcluído!`);
  console.log(`  Atualizados: ${atualizados}`);
  console.log(`  Sem match:   ${naoEncontrados}`);
  process.exit(0);
}

main().catch(err => {
  console.error('\nErro:', err.message);
  process.exit(1);
});
