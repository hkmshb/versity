// tslint:disable:no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import { itParam } from 'mocha-param';
import { Connection, models } from '../src/data';
import { School } from '../src/data/models';
import { SchoolService } from '../src/data/services';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;


describe('# model validation tests', async () => {
  let conn: Connection;

  before(async () => {
    conn = await getTestDbConnection('test-models-val#1');

    // create school entity expected to exists for some tests
    await conn.findEntityServiceFor(School).createAndSave({
      name: 'Baobab University', code: 'baobab-university', nickname: 'BU'
    });
  });

  const schoolWithInvalidNameOrNickname = [
    {name: 'school.name', nickname: 'sc'},                        // missing code
    {code: 'school-code', nickname: 'sc'},                        // missing name
    {name: 'school.name', code: 'school-code'},                   // missing nickname
    {name: 'abc', code: 'school-code', nickname: 'sc'},           // insufficient name length
    {name: 'school.name', code: 'school-code', nickname: 'a'},    // insufficient nickname length
  ];

  itParam('should fail validation for missing or invalid field',
          schoolWithInvalidNameOrNickname, entry => {
    return conn
      .findEntityServiceFor(models.School)
      .createAndSave(entry)
      .then(value => { throw new Error(`expected createAndSave to fail: ${value}`); })
      .catch(err => expect(err.errors).to.not.be.empty);
  });

  const schoolFieldsViolatingUniqueConstraint = [
    {name: 'name', value: 'Baobab University'},
    {name: 'code', value: 'baobab-university'},
    {name: 'nickname', value: 'BU'}
  ];

  itParam('should report unique (${value.name}) constraint voilations when creating schools',
          schoolFieldsViolatingUniqueConstraint, entry => {
    // alternative form for: conn.findEntityServiceFor(School)
    const service = conn.getCustomRepository(SchoolService);
    const repository = service.getRepository();
    expect(repository).to.not.be.undefined;
    expect(repository).to.not.be.null;

    const condition = {[entry.name]: entry.value};
    const school = repository.findOne(condition);
    expect(school).to.exist;

    const values = {
      name: 'Ryn University of Creative Arts',
      code: 'ryn-university-of-creative-arts',
      nickname: 'ruca',
      ...condition
    };

    return service
      .createAndSave(values)
      .then(_ => { throw new Error('Execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('ValidationError');
        expect(err.message).to.equal(`${entry.name} already in use`);
      });
  });

  it('should report unique constraint voilations when updating schools', async () => {
    const service = conn.findEntityServiceFor(School);
    const school = await service.createAndSave({
      name: 'school.90210+', code: 'school-90210+', nickname: '90210+',
    });

    const school2 = await service.createAndSave({
      name: 'Bevery Hills 90210+', code: 'bevery-hills-90210+', nickname: 'BH90210+'
    });

    expect(school.id).to.be.greaterThan(0);
    expect(school2.id).to.be.greaterThan(0);

    const schoolUpdate = {...school2, name: 'school.90210+'};
    return service.updateAndSave(schoolUpdate)
      .then(_ => { throw new Error('Execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('ValidationError');
        expect(err.message).to.equal('name already in use');
      });
  });

  it('should enforce one-level deep school hierarchy when creating schools', () => {
    const service = conn.findEntityServiceFor(School);
    return service.createAndSave({
      name: 'school.name#paent', code: 'school-name#parent', nickname: 'sn#p'
    })
    .then(parent => {
      expect(parent.id).to.be.greaterThan(0);
      expect(parent.uuid).to.not.be.undefined;
      expect(parent.uuid).to.not.be.null;

      return service.createAndSave({
        parent: parent.id,
        name: 'school.name#child', code: 'school-name#child', nickname: 'sn#c',
      });
    })
    .then(child => {
      expect(child.id).to.be.greaterThan(0);
      expect(child.parent).to.not.be.undefined;
      expect(child.parent).to.not.be.null;

      return service.createAndSave({
        parentId: child.id,
        name: 'school.name#level2', code: 'school-name#level2', nickname: 'sn#l2'
      });
    })
    .then(child2 => { throw new Error('Execution should not get here'); })
    .catch(err => {
      expect(err.name).to.equal('ValidationError');
      expect(err.message).to.equal('School hierarchical relationships cannot exceed 1 level');
    });
  });

  it('should enforce one-level deep school hierarchy when updating schools', async () => {
    const service = conn.findEntityServiceFor(School);
    const school = await service.createAndSave({
      name: 'school.90210', code: 'school-90210', nickname: '90210',
      parent: await service.createAndSave({
        name: 'Bevery Hills 90210', code: 'bevery-hills-90210', nickname: 'BH90210'
      })
    });
    const institution = await service.createAndSave({
      name: 'Friends', code: 'friends', nickname: 'friends'
    });

    return service.updateAndSave({
      id: institution.id, parentId: school.id,
      name: 'Friends', code: 'friends', nickname: 'friends'
    })
    .then(_ => { throw new Error('Execution should not get here'); })
    .catch(err => {
      expect(err.name).to.equal('ValidationError');
      expect(err.message).to.equal('School hierarchical relationships cannot exceed 1 level');
    });
  });

});
