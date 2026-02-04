/**
 * Script de collecte de données depuis /data pendant 10 secondes
 * 
 * Stratégie:
 * - Pool de workers concurrents pour maximiser les requêtes
 * - Retry automatique sur erreurs 429 (Too Many Requests)
 * - Timer strict de 10 secondes
 * - Affichage en temps réel des résultats
 */

import http from 'node:http';

const SERVER_URL = 'http://localhost:4321';
const DURATION_MS = 10000; // 10 secondes
const NUM_WORKERS = 3; // Nombre de workers concurrents (match avec MAX_CONCURRENCY du serveur)

interface DataResponse {
  message: string;
  queryIndex: number;
}

interface Stats {
  successful: number;
  failed: number;
  retries: number;
  data: DataResponse[];
}

/**
 * Effectue une requête GET vers /data avec gestion des erreurs
 */
async function fetchData(): Promise<DataResponse> {
  return new Promise((resolve, reject) => {
    const req = http.get(`${SERVER_URL}/data`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            reject(new Error(`Invalid JSON: ${error}`));
          }
        } else if (res.statusCode === 429) {
          reject(new Error('RATE_LIMIT'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Worker qui effectue des requêtes en boucle jusqu'à l'arrêt
 */
async function worker(
  workerId: number,
  shouldStop: () => boolean,
  stats: Stats
): Promise<void> {
  while (!shouldStop()) {
    try {
      const result = await fetchData();
      stats.successful++;
      stats.data.push(result);
      console.log(`✓ Worker ${workerId}: Reçu queryIndex=${result.queryIndex} (Total: ${stats.successful})`);
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMIT') {
        stats.retries++;
        // Retry immédiat sur 429 pour maximiser les tentatives
        continue;
      } else {
        stats.failed++;
        console.error(`✗ Worker ${workerId}: ${error}`);
      }
    }
  }
}

/**
 * Lance la collecte de données pendant 10 secondes
 */
async function main(): Promise<void> {
  console.log('🚀 Démarrage de la collecte de données...');
  console.log(`📊 Configuration: ${NUM_WORKERS} workers, durée ${DURATION_MS / 1000}s\n`);

  const stats: Stats = {
    successful: 0,
    failed: 0,
    retries: 0,
    data: [],
  };

  const startTime = Date.now();
  let stopped = false;

  const shouldStop = () => stopped;

  // Démarrer le timer
  const timer = setTimeout(() => {
    stopped = true;
  }, DURATION_MS);

  // Lancer les workers
  const workers = Array.from({ length: NUM_WORKERS }, (_, i) =>
    worker(i + 1, shouldStop, stats)
  );

  // Attendre que tous les workers terminent
  await Promise.all(workers);

  clearTimeout(timer);

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

  // Afficher les résultats
  console.log('\n' + '='.repeat(60));
  console.log('📈 RÉSULTATS FINAUX');
  console.log('='.repeat(60));
  console.log(`⏱️  Durée: ${elapsedTime}s`);
  console.log(`✓ Requêtes réussies: ${stats.successful}`);
  console.log(`✗ Requêtes échouées: ${stats.failed}`);
  console.log(`🔄 Retries (429): ${stats.retries}`);
  console.log(`📊 Performance: ${(stats.successful / (DURATION_MS / 1000)).toFixed(2)} requêtes/s`);
  
  console.log('\n📦 DONNÉES COLLECTÉES:');
  stats.data.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.message} (queryIndex: ${item.queryIndex})`);
  });
  console.log('='.repeat(60));
}

// Exécution du script
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`|| 
    process.argv[1].endsWith('query-data.ts')) {
  main().catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

export { fetchData, worker, main, Stats, DataResponse };
