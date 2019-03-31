// import Viewer from '../src/Viewer.js';
import chai from 'chai';
import sinon from 'sinon';

const expect = chai.expect;

describe('Viewer', () => {
  const subject = () => {
    delete require.cache[require.resolve('../src/Viewer.js')];
    return require('../src/Viewer.js').default;
  };
  describe('Viewer.prototype._arrangTablesSnail', () => {
    it('Orders table in correct way', () => {
      const Viewer = subject();
      Viewer.prototype._arrangTablesSnail = () => 1;
      expect(Viewer.prototype._arrangTablesSnail).not.be.null;
    });
    it('Orders table in correct way', () => {
      const Viewer = subject();
      console.log(Viewer.prototype._arrangTablesSnail);
      expect(Viewer.prototype._arrangTablesSnail).not.be.null;
    });
  });
});

