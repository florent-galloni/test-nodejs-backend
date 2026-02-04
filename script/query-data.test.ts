/**
 * Tests simples pour query-data.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Stats } from './query-data.js';

describe('Query Data Script - Tests basiques', () => {
  it('devrait exporter les types nécessaires', () => {
    const stats: Stats = {
      successful: 0,
      failed: 0,
      retries: 0,
      data: []
    };
    
    assert.ok(stats);
    assert.strictEqual(stats.successful, 0);
  });

  it('devrait gérer les statistiques correctement', () => {
    const stats: Stats = {
      successful: 0,
      failed: 0,
      retries: 0,
      data: []
    };
    
    stats.successful = 5;
    stats.failed = 2;
    stats.retries = 3;
    
    assert.strictEqual(stats.successful, 5);
    assert.strictEqual(stats.failed, 2);
    assert.strictEqual(stats.retries, 3);
  });

  it('devrait pouvoir stocker des données', () => {
    const stats: Stats = {
      successful: 0,
      failed: 0,
      retries: 0,
      data: []
    };
    
    stats.data.push({ message: 'test 1', queryIndex: 1 });
    stats.data.push({ message: 'test 2', queryIndex: 2 });
    
    assert.strictEqual(stats.data.length, 2);
    assert.strictEqual(stats.data[0].queryIndex, 1);
    assert.strictEqual(stats.data[1].queryIndex, 2);
  });
});
