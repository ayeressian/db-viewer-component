import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

const expect = chai.expect;

chai.use(sinonChai);

describe('Relation', () => {
  const subject = () => {
    delete require.cache[require.resolve('../src/Relation.ts')];
    return require('../src/Relation.ts').default;
  };
  describe('Path calculation', () => {
    const Relation = subject();
    const start = {x: 100, y: 100};
    const end = {x: 500, y: 500};
    beforeEach(() => {
      Relation.prototype._createPath = sinon.fake();
      Relation.prototype._createHighlightTrigger = sinon.fake();
    });
    describe('Relation.prototype._get2LinePathFlatTop', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype._get2LinePathFlatTop(start, end);
        const argument = 'M 100 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 110 100 H 500 V 500 M 500 500 l 4 -9 M 500 500 l -4 -9';
        expect(Relation.prototype._createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype._get2LinePathFlatBottom', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype._get2LinePathFlatBottom(start, end);
        const argument = 'M 95 105 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 110 V 500 H 500 M 500 500 l -9 4 M 500 500 l -9 -4';
        expect(Relation.prototype._createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype._get3LinePathHoriz', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype._get3LinePathHoriz(start, end);
        const argument = 'M 100 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 100 m 10 0 H 300V 500 H 500 M 500 500 l -9 4 M 500 500 l -9 -4';
        expect(Relation.prototype._createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype._get3LinePathVert', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype._get3LinePathVert(start, end);
        const argument = 'M 95 105 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 110 V 300 H 500 V 500 M 500 500 l 4 -9 M 500 500 l -4 -9';
        expect(Relation.prototype._createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype._getSelfRelationLeft', () => {
      const end = {x: 100, y: 500};
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype._getSelfRelationLeft(start, end);
        const argument = 'M 90 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 90 100 h -30 V 500 h 40 M 100 500 l -9 4 M 100 500 l -9 -4';
        expect(Relation.prototype._createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype._getSelfRelationRight', () => {
      const end = {x: 100, y: 500};
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype._getSelfRelationRight(start, end);
        const argument = 'M 100 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 110 100 h 30 V 500 h -40 M 100 500 l 9 4 M 100 500 l 9 -4';
        expect(Relation.prototype._createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype._getSelfRelationTop', () => {
      const end = {x: 500, y: 100};
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype._getSelfRelationTop(start, end);
        const argument = 'M 95 95 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 90 v -30 H 500 v 40 M 500 100 l 4 -9 M 500 100 l -4 -9';
        expect(Relation.prototype._createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype._getSelfRelationBottom', () => {
      const end = {x: 500, y: 100};
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype._getSelfRelationBottom(start, end);
        const argument = 'M 95 105 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 110 v 30 H 500 v -40 M 500 100 l 4 9 M 500 100 l -4 9';
        expect(Relation.prototype._createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype._createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
  });

  describe('Relation.prototype.calcPathTableSides', () => {
    const Relation = subject();
    it('Returns correct result', () => {
      const fakeRlationObj = Object.create(Relation.prototype);
      fakeRlationObj.fromTable = {
        getCenter: sinon.fake.returns({x: 100, y: 100}),
        getSides: sinon.fake.returns({
          right: {
            p1: {x: 150, y: 50},
            p2: {x: 150, y: 150}
          },
          left: {
            p1: {x: 50, y: 50},
            p2: {x: 50, y: 150}
          },
          top: {
            p1: {x: 50, y: 50},
            p2: {x: 150, y: 50}
          },
          bottom: {
            p1: {x: 50, y: 150},
            p2: {x: 150, y: 150}
          }
        })
      };
      fakeRlationObj.toTable = {
        getCenter: sinon.fake.returns({x: 500, y: 500}),
        getSides: sinon.fake.returns({
          right: {
            p1: {x: 550, y: 450},
            p2: {x: 550, y: 550}
          },
          left: {
            p1: {x: 450, y: 450},
            p2: {x: 450, y: 550}
          },
          top: {
            p1: {x: 450, y: 450},
            p2: {x: 550, y: 450}
          },
          bottom: {
            p1: {x: 450, y: 550},
            p2: {x: 550, y: 550}
          }
        })
      };

      fakeRlationObj.calcPathTableSides();

      expect(fakeRlationObj.fromIntersectPoint).to.deep.eq({x: 150, y: 150});
      expect(fakeRlationObj.fromTablePathSide).eq('bottom');
      expect(fakeRlationObj.toIntersectPoint).to.deep.eq({x: 450, y: 450});
      expect(fakeRlationObj.toTablePathSide).eq('top');
    });
  });
});
