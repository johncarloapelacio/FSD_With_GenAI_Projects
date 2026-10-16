import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, parseTime } from './bookingInput.js';
test('date parsing preserves calendar validity and relative dates in local time', () => {
  const today = new Date(2028, 1, 28, 10);
  assert.equal(parseDate('tomorrow', today), '2028-02-29');
  assert.equal(parseDate('2028-02-29', today), '2028-02-29');
  for (const value of ['2027-02-29','02/31/2028','2028-13-01','04/31/2028','nonsense']) assert.equal(parseDate(value, today), '', value);
  assert.equal(parseDate('1/5/2030', today), '2030-01-05');
  assert.equal(parseDate('tuesday', today), '2028-02-29');
});
test('time parser rejects impossible AM/PM values and accepts supported formats', () => {
  for (const value of ['13pm','0am','24:00','12:60','1:99pm','25.45']) assert.equal(parseTime(value), '', value);
  for (const [input, expected] of [['2:30 PM','14:30'],['12am','00:00'],['12pm','12:00'],['noon','12:00'],['15.45','15:45'],['0930','09:30']]) assert.equal(parseTime(input), expected);
});
