// tslint:disable:no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import { models } from '../src/data';
import { FixtureLoader, getTestDbConnection, loadValidEntityFixtures } from './test-utils';


const expect = chai.expect;

describe('# misc data tests', async () => {
  let loader: FixtureLoader;

  before(async () => {
    loader = new FixtureLoader(await getTestDbConnection('test-models#1'));
  });

  it('should load entity fixtures to verify definitions and relationships', async () => {
    return (
      loadValidEntityFixtures(loader)
        .then(result => expect(result).to.be.true)
    );
  });
});


describe('# entity tests', async () => {
  let loader: FixtureLoader;

  before(async () => {
    loader = new FixtureLoader(await getTestDbConnection('test-models#2'));
    return await loadValidEntityFixtures(loader);
  });

  // ======================================================================
  // AcademicSection Entity Tests
  // ======================================================================
  it('should verify academic section count matches loaded fixture entries', async () => {
    return (
      loader.conn
        .getRepository('AcademicSection')
        .count()
        .then(value => expect(value).to.equal(7))
    );
  });

  it('should verify academic section parent relationship', async () => {
    return (
      loader.conn
        .getRepository(models.AcademicSection)
        .findOne({nickname: 'KUT-SOENG'}, {relations: ['parent']})
        .then(section => {
          expect(section).to.not.be.undefined;
          expect(section.parent.nickname).to.equal('KUT');
        })
    );
  });

  it('should verify academic section children relationship', async () => {
    return (
      loader.conn
        .getRepository(models.AcademicSection)
        .findOne({nickname: 'KUT'}, {relations: ['parent', 'children']})
        .then(section => {
          expect(section).to.not.be.undefined;
          expect(section.parent).to.be.null;
          expect(section.children.length).to.equal(2);
        })
    );
  });

  it('should verify academic section to academic period relationship', async () => {
    return(
      loader.conn
        .getRepository(models.AcademicSection)
        .findOne({nickname: 'BSM'}, {relations: ['academicPeriods']})
        .then(section => {
          expect(section).to.not.be.undefined;
          expect(section.academicPeriods.length).to.equal(1);
        })
    );
  });

  it('should not have orphaned academic periods for schools', async () => {
    return (
      loader.conn
        .getRepository(models.AcademicPeriod)
        .find({relations: ['academicSection']})
        .then(periods => {
          expect(periods.length).to.equal(5);
          periods.filter(p => p.parent ===  null).forEach(p => {
            expect(p.academicSection).to.not.be.null;
          });
        })
    );
  });

  // ======================================================================
  // Academic Period Entity Tests
  // ======================================================================
  it('should verify academic period count matches loaded fixture entries', async () => {
    return (
      loader.conn
        .getRepository('AcademicPeriod')
        .count()
        .then(value => expect(value).to.equal(5))
    );
  });

  // ======================================================================
  // Department Entity Tests
  // ======================================================================
  it('should verify department count matches loaded fixture entries', async () => {
    return (
      loader.conn
        .getRepository('Department')
        .count()
        .then(value => expect(value).to.equal(3))
    );
  });

  // ======================================================================
  // Programme Entity Tests
  // ======================================================================
  it('should verify programme count matches loaded fixture entries', async () => {
    return (
      loader.conn
        .getRepository('Programme')
        .count()
        .then(value => expect(value).to.equal(3))
    );
  });

});
