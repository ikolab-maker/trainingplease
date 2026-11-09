import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chronicKm, parseInjuries, parseVolumeRange, targetKind, weekKindOf } from './athleteState.ts';

test('tipo de semana: manda el dato guardado; sin él, carrera o caída de km, nunca el nombre', () => {
  assert.equal(weekKindOf({ kind: 'taper' }, 40, false, [40]), 'taper');
  assert.equal(weekKindOf({}, 30, true, [40]), 'carrera');
  assert.equal(weekKindOf({}, 28, false, [36, 40]), 'descarga');
  assert.equal(weekKindOf({ kind: 'Semana de descarga' }, 40, false, [38]), 'carga');
  assert.equal(targetKind({ decision: 'descarga', raceThisWeek: false, taperWeek: false, afterRace: false }), 'descarga');
  assert.equal(targetKind({ decision: 'progresar', raceThisWeek: false, taperWeek: true, afterRace: false }), 'taper');
});

test('base de 4 semanas: promedio de las semanas de carga con km', () => {
  assert.equal(chronicKm([{ kind: 'carga', km: 30 }, { kind: 'carga', km: 34 }, { kind: 'descarga', km: 20 }, { kind: 'carga', km: 0 }]), 32);
  assert.equal(chronicKm([{ kind: 'descarga', km: 20 }]), null);
});

test('lesiones y rango: validación', () => {
  assert.deepEqual(parseInjuries([{ zone: 'Rodilla derecha', status: 'resuelta', since: '2026-09-01' }]).injuries[0].status, 'resuelta');
  assert.ok(parseInjuries([{ zone: 'x', status: 'curada' }]).error);
  assert.deepEqual(parseVolumeRange({ minKm: 30, maxKm: 45 }).range, { minKm: 30, maxKm: 45 });
  assert.ok(parseVolumeRange({ minKm: 50, maxKm: 40 }).error);
  assert.equal(parseVolumeRange({ minKm: null, maxKm: null }).range, null);
});
