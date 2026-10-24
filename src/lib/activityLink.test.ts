import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activityLink, activityLinkLabel } from './activityLink.ts';

test('acepta enlaces https y los limpia', () => {
  assert.equal(activityLink('  https://www.strava.com/activities/123  '), 'https://www.strava.com/activities/123');
  assert.equal(activityLink('https://strava.app.link/abc'), 'https://strava.app.link/abc');
});

test('rechaza vacío, http, texto suelto y enlaces muy largos', () => {
  assert.equal(activityLink(''), '');
  assert.equal(activityLink('http://www.strava.com/activities/1'), '');
  assert.equal(activityLink('strava.com/activities/1'), '');
  assert.equal(activityLink('javascript:alert(1)'), '');
  assert.equal(activityLink(`https://x.com/${'a'.repeat(300)}`), '');
});

test('nombra el servicio', () => {
  assert.equal(activityLinkLabel('https://www.strava.com/activities/1'), 'Strava');
  assert.equal(activityLinkLabel('https://strava.app.link/abc'), 'Strava');
  assert.equal(activityLinkLabel('https://connect.garmin.com/modern/activity/1'), 'Garmin');
  assert.equal(activityLinkLabel('https://www.coros.com/a/1'), 'coros.com');
});
