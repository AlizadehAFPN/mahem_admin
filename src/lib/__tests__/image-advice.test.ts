/**
 * The splash image is drawn full-screen with resizeMode «cover», so a photo
 * that isn't shaped like a phone screen is cropped on the device — something
 * the admin panel can't show and the person uploading can't see. These
 * warnings are the only feedback there is, which is why they have to fire on
 * exactly the right cases: nagging about a correct image trains people to
 * ignore them, and staying quiet about a wrong one defeats the point.
 *
 * Advisory only — nothing here blocks an upload.
 *
 * Run with:  node --experimental-strip-types --test src/lib/__tests__/image-advice.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { imageWarnings, formatSize } from '../image-advice.ts';

const ADVICE = {
  aspectRatio: { min: 1.6, max: 2.4 },
  minWidth: 1080,
  preferredMaxBytes: 100 * 1024,
  preferredMimeType: 'image/jpeg',
  preferredFormatLabel: 'JPG',
};

const IDEAL = {width: 1240, height: 2680, byteSize: 80 * 1024, mimeType: 'image/jpeg'};

test('a well-shaped, small JPG draws no warnings at all', () => {
  assert.deepEqual(imageWarnings(IDEAL, ADVICE), []);
});

test('a landscape photo is called out as horizontal', () => {
  const w = imageWarnings({...IDEAL, width: 1920, height: 1080}, ADVICE);
  assert.equal(w.length, 1);
  assert.match(w[0], /افقی یا مربع/);
  assert.match(w[0], /1920×1080/);
});

test('a square photo counts as not-portrait too', () => {
  const w = imageWarnings({...IDEAL, width: 1200, height: 1200}, ADVICE);
  assert.match(w[0], /افقی یا مربع/);
});

test('portrait but the wrong shape gets the ratio warning, not the portrait one', () => {
  // 3:4 tablet-ish — taller than wide, but nothing like a phone.
  const w = imageWarnings({...IDEAL, width: 1200, height: 1600}, ADVICE);
  assert.equal(w.length, 1);
  assert.match(w[0], /نسبت طول به عرض/);
});

test('both 16:9 and 20:9 phones are accepted', () => {
  assert.deepEqual(imageWarnings({...IDEAL, width: 1080, height: 1920}, ADVICE), []);
  assert.deepEqual(imageWarnings({...IDEAL, width: 1080, height: 2400}, ADVICE), []);
});

test('a low-resolution image is flagged as too small', () => {
  const w = imageWarnings({...IDEAL, width: 540, height: 1170}, ADVICE);
  assert.equal(w.length, 1);
  assert.match(w[0], /540 پیکسل/);
});

test('an oversized file is flagged with both sizes in readable units', () => {
  const w = imageWarnings({...IDEAL, byteSize: 2.5 * 1024 * 1024}, ADVICE);
  assert.equal(w.length, 1);
  assert.match(w[0], /۲?2\.5 مگابایت/);
  assert.match(w[0], /100 کیلوبایت/);
});

test('a PNG is flagged as a less mobile-friendly format', () => {
  const w = imageWarnings({...IDEAL, mimeType: 'image/png'}, ADVICE);
  assert.equal(w.length, 1);
  assert.match(w[0], /JPG/);
});

test('every rule can fire at once', () => {
  const w = imageWarnings(
    {width: 800, height: 600, byteSize: 3 * 1024 * 1024, mimeType: 'image/png'},
    ADVICE,
  );
  // horizontal + too narrow + too heavy + wrong format
  assert.equal(w.length, 4);
});

test('an undecodable file still gets the size and format advice', () => {
  // No width/height: the browser could not decode it. The shape rules have
  // nothing to say, but the file itself is still inspectable.
  const w = imageWarnings({byteSize: 3 * 1024 * 1024, mimeType: 'image/png'}, ADVICE);
  assert.equal(w.length, 2);
  assert.ok(w.every(m => !/پیکسل|نسبت|افقی/.test(m)));
});

test('an unknown mime type is not guessed at', () => {
  const w = imageWarnings({...IDEAL, mimeType: ''}, ADVICE);
  assert.deepEqual(w, []);
});

test('sizes read naturally in both units', () => {
  assert.equal(formatSize(100 * 1024), '100 کیلوبایت');
  assert.equal(formatSize(2.5 * 1024 * 1024), '2.5 مگابایت');
});
