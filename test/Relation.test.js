import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

const expect = chai.expect;

chai.use(sinonChai);

describe('Relation', () => {
  const subject = () => {
    delete require.cache[require.resolve('../src/Relation.js')];
    return require('../src/Relation.js').default;
  };
  const Relation = subject();
  const start = {x: 100, y: 100};
  const end = {x: 500, y: 500};
  beforeEach(() => {
    Relation.prototype._createPath = sinon.fake();
    Relation.prototype._createHighlightTrigger = sinon.fake();
  });
  describe('Relation.prototype._get2LinePathFlatTop', () => {
    it('Returns correct result', () => {
      Relation.prototype._get2LinePathFlatTop(start, end);
      expect(Relation.prototype._createPath).to.have.been.calledWith('M 107 95 v 10 M 100 100 H 500 V 500 M 500 500 l 4 -9 M 500 500 l -4 -9');
      expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith('M 100 100 H 500 V 500');
    });
  });
  describe('Relation.prototype._get2LinePathFlatBottom', () => {
    it('Returns correct result', () => {
      Relation.prototype._get2LinePathFlatBottom(start, end);
      expect(Relation.prototype._createPath).to.have.been.calledWith('M 95 107 h 10 M 100 100 V 500 H 500 M 500 500 l -9 4 M 500 500 l -9 -4');
      expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith('M 100 100 V 500 H 500');
    });
  });
  describe('Relation.prototype._get3LinePathHoriz', () => {
    it('Returns correct result', () => {
      Relation.prototype._get3LinePathHoriz(start, end);
      expect(Relation.prototype._createPath).to.have.been.calledWith('M 107 95 v 10 M 100 100 H 300 V 500 H 500 M 500 500 l -9 4 M 500 500 l -9 -4');
      expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith('M 100 100 H 300 V 500 H 500');
    });
  });
  describe('Relation.prototype._get3LinePathVert', () => {
    it('Returns correct result', () => {
      Relation.prototype._get3LinePathVert(start, end);
      expect(Relation.prototype._createPath).to.have.been.calledWith('M 95 107 h 10 M 100 100 V 300 H 500 V 500 M 500 500 l 4 -9 M 500 500 l -4 -9');
      expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith('M 100 100 V 300 H 500 V 500');
    });
  });
  describe('Relation.prototype._getSelfRelationLeft', () => {
    it('Returns correct result', () => {
      Relation.prototype._getSelfRelationLeft(start, end);
      expect(Relation.prototype._createPath).to.have.been.calledWith('M 93 95 v 10M 100 100 h -40 V 500 h 40M 500 500 l -9 -4M 500 500 l -9 4');
      expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith('M 100 100 h -40 V 500 h 40');
    });
  });
  describe('Relation.prototype._getSelfRelationRight', () => {
    it('Returns correct result', () => {
      Relation.prototype._getSelfRelationRight(start, end);
      expect(Relation.prototype._createPath).to.have.been.calledWith('M 107 95 v 10M 100 100 h 40 V 500 h -40M 500 500 l 9 -4M 500 500 l 9 4');
      expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith('M 100 100 h 40 V 500 h -40');
    });
  });
  describe('Relation.prototype._getSelfRelationTop', () => {
    it('Returns correct result', () => {
      Relation.prototype._getSelfRelationTop(start, end);
      expect(Relation.prototype._createPath).to.have.been.calledWith('M 95 93 h 10M 100 100 v -40 H 500 v 40M 500 500 l -4 -9M 500 500 l 4 -9');
      expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith('M 100 100 v -40 H 500 v 40');
    });
  });
  describe('Relation.prototype._getSelfRelationBottom', () => {
    it('Returns correct result', () => {
      Relation.prototype._getSelfRelationBottom(start, end);
      expect(Relation.prototype._createPath).to.have.been.calledWith('M 95 107 h 10M 100 100 v 40 H 500 v -40M 500 500 l -4 9M 500 500 l 4 9');
      expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith('M 100 100 v 40 H 500 v -40');
    });
  });
});
