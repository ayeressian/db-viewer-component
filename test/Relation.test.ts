import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import Orientation from '../src/types/Orientation';
import Vertices from '../src/types/Vertices';

const expect = chai.expect;

chai.use(sinonChai);

describe('Relation', () => {
  const subject = (): Function => {
    delete require.cache[require.resolve('../src/realtion/Relation.ts')];
    import('../src/realtion/Relation');
    return require('../src/realtion/Relation.ts').default;
  };

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
