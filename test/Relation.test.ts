import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import Orientation from '../src/types/Orientation';
import Point from '../src/types/Point';
import Vertices from '../src/types/Vertices';

const expect = chai.expect;

chai.use(sinonChai);

describe('Relation', () => {
  const subject = (): Function => {
    delete require.cache[require.resolve('../src/Relation.ts')];
    return require('../src/Relation.ts').default;
  };
  describe('Path calculation', () => {
    const Relation = subject();
    const start: Point = {x: 100, y: 100};
    const end: Point = {x: 500, y: 500};
    beforeEach(() => {
      Relation.prototype.createPath = sinon.fake();
      Relation.prototype.createHighlightTrigger = sinon.fake();
    });
    describe('Relation.prototype.get2LinePathFlatTop', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype.get2LinePathFlatTop(start, end);
        const argument = 'M 100 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 110 100 H 500 V 500 M 500 500 l 4 -9 M 500 500 l -4 -9';
        expect(Relation.prototype.createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype.createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype.get2LinePathFlatBottom', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype.get2LinePathFlatBottom(start, end);
        const argument = 'M 95 105 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 110 V 500 H 500 M 500 500 l -9 4 M 500 500 l -9 -4';
        expect(Relation.prototype.createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype.createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype.get3LinePathHoriz', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype.get3LinePathHoriz(start, end);
        const argument = 'M 100 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 100 m 10 0 H 300V 500 H 500 M 500 500 l -9 4 M 500 500 l -9 -4';
        expect(Relation.prototype.createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype.createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype.get3LinePathVert', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype.get3LinePathVert(start, end);
        const argument = 'M 95 105 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 110 V 300 H 500 V 500 M 500 500 l 4 -9 M 500 500 l -4 -9';
        expect(Relation.prototype.createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype.createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype.getSelfRelationLeft', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype.getSelfRelationLeft(start, {x: 100, y: 500});
        const argument = 'M 90 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 90 100 h -30 V 500 h 40 M 100 500 l -9 4 M 100 500 l -9 -4';
        expect(Relation.prototype.createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype.createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype.getSelfRelationRight', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype.getSelfRelationRight(start, {x: 100, y: 500});
        const argument = 'M 100 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 110 100 h 30 V 500 h -40 M 100 500 l 9 4 M 100 500 l 9 -4';
        expect(Relation.prototype.createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype.createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype.getSelfRelationTop', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype.getSelfRelationTop(start, {x: 500, y: 100});
        const argument = 'M 95 95 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 90 v -30 H 500 v 40 M 500 100 l 4 -9 M 500 100 l -4 -9';
        expect(Relation.prototype.createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype.createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
    describe('Relation.prototype.getSelfRelationBottom', () => {
      it('Calls correct methods with correct arguments', () => {
        Relation.prototype.getSelfRelationBottom(start, {x: 500, y: 100});
        const argument = 'M 95 105 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 110 v 30 H 500 v -40 M 500 100 l 4 9 M 500 100 l -4 9';
        expect(Relation.prototype.createPath).to.have.been.calledWith(argument);
        expect(Relation.prototype.createHighlightTrigger).to.have.been.calledWith(argument);
      });
    });
  });

  describe('Relation.prototype.calcPathTableSides', () => {
    const Relation = subject();
    it('Returns correct result', () => {
      const fakeRlationObj = Object.create(Relation.prototype);
      fakeRlationObj.fromTable = {
        getCenter: sinon.fake.returns({x: 100, y: 100}),
        getVertices: sinon.fake.returns({
          bottomLeft: {x: 50, y: 150},
          bottomRight: {x: 150, y: 150},
          topLeft: {x: 50, y: 50},
          topRight: {x: 150, y: 150},
        } as Vertices),
      };
      fakeRlationObj.toTable = {
        getCenter: sinon.fake.returns({x: 500, y: 500}),
        getVertices: sinon.fake.returns({
          bottomLeft: {x: 450, y: 550},
          bottomRight: {x: 550, y: 550},
          topLeft: {x: 450, y: 450},
          topRight: {x: 550, y: 450},
        } as Vertices),
      };

      fakeRlationObj.calcPathTableSides();

      expect(fakeRlationObj.fromIntersectPoint).to.deep.eq({x: 150, y: 150});
      expect(fakeRlationObj.fromTablePathSide).eq(Orientation.Bottom);
      expect(fakeRlationObj.toIntersectPoint).to.deep.eq({x: 450, y: 450});
      expect(fakeRlationObj.toTablePathSide).eq(Orientation.Top);
    });
  });
});
