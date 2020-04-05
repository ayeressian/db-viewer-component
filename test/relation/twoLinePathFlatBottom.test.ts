import twoLinePathFlatBottom from '../../src/realtion/twoLinePathFlatBottom';
import { expect } from 'chai';
import { start, end } from './commonTestData';

describe('twoLinePathFlatBottom', () => {
  it('returns correct data', () => {
    const result = twoLinePathFlatBottom(start, end);
    const expectedResult = 'M 95 105 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 110 V 500 H 500 M 500 500 l -9 4 M 500 500 l -9 -4';
    expect(result).to.equal(expectedResult);
  });
});
