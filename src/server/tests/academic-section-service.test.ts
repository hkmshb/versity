// tslint:disable:no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import { itParam } from 'mocha-param';
import path from 'path';
import { Connection, models } from '../src/data';
import { AcademicSection } from '../src/data/models';
import { AcademicSectionService } from '../src/data/services';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;


describe('# academic-section service & data validation tests', async () => {
  let conn: Connection;

  before(async () => {
    conn = await getTestDbConnection('test-school-service+val#1');

    // create school entity expected to exists for some tests
    await conn.findEntityServiceFor(AcademicSection).createAndSave({
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
      .findEntityServiceFor(models.AcademicSection)
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
    // alternative form for: conn.findEntityServiceFor(AcademicSection)
    const service = conn.getCustomRepository(AcademicSectionService);
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
        expect(err.message.startsWith(`${entry.name} already in use`)).to.be.true;
      });
  });

  it('should report unique constraint voilations when updating schools', async () => {
    const service = conn.findEntityServiceFor(AcademicSection);
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
        expect(err.message.startsWith('name already in use')).to.be.true;
      });
  });

  it('should enforce one-level deep school hierarchy when creating schools', () => {
    const service = conn.findEntityServiceFor(AcademicSection);
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
      expect(err.message).to.equal('Academic section hierarchical relationships cannot exceed 1 level');
    });
  });

  it('should enforce one-level deep school hierarchy when updating schools', async () => {
    const service = conn.findEntityServiceFor(AcademicSection);
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
      expect(err.message).to.equal('Academic section hierarchical relationships cannot exceed 1 level');
    });
  });

});

describe('# academic-section service & data import', async () => {
  let conn: Connection;
  let service: AcademicSectionService;

  before(async () => {
    conn = await getTestDbConnection('test-section+import');
    service = conn.getCustomRepository(AcademicSectionService);
  });

  it('import fails when file for processing is not found', () => {
    const filepath = path.join(__dirname, 'fixtures/fake-path/non-existing-file.csv');
    return service
      .importData(filepath)
      .then(_ => expect.fail('execution should not get here'))
      .catch(err => {
        expect(err.name).to.equal('DataImportError');
        expect(err.errors.startsWith('File not found')).to.be.true;
      });
  });

  it('import fails when file has rows violating unique constraint', () => {
    const filepath = path.join(__dirname, 'fixtures/imports/academic-session-records-violating-uniq-constraint.csv');
    return service
      .importData(filepath)
      .then(_ => expect.fail('execution should not get here'))
      .catch(err => {
        expect(err.name).to.equal('DataImportError');
        expect(Object.keys(err.errors)).to.contain('nickname');
      });
  });

  it('can import all valid section data from file', async () => {
    const filepath = path.join(__dirname, 'fixtures/imports/academic-session-records.csv');
    const importCount = await service.importData(filepath);
    expect(importCount).to.equal(7);

    const count = await service.getRepository().count();
    expect(count).to.equal(7);
  });

  it('can import valid section data with intended relationships', async () => {
    const sectionConn = await getTestDbConnection('test-section+import#2');
    const sectionService = sectionConn.getCustomRepository(AcademicSectionService);

    const filepath = path.join(__dirname, 'fixtures/imports/academic-session-records.csv');
    const importCount = await sectionService.importData(filepath);
    expect(importCount).to.equal(7);

    const kigelia = await sectionService.getRepository().find({
      where: { nickname: 'KUT' },
      relations: ['parent', 'children']
    });

    expect(kigelia).to.not.be.empty;
    expect(kigelia[0].parent).to.be.null;
    expect(kigelia[0].children).to.not.be.empty;
    expect(kigelia[0].children.length).to.equal(2);
  });

  it('import fails with any invalid record within file', async () => {
    const filepath = path.join(__dirname, 'fixtures/imports/records-with-invalid-academic-session.csv');
    return service
      .importData(filepath)
      .then(_ => expect.fail('execution should not get here'))
      .catch(err => {
        expect(err.name).to.equal('DataImportError');
        expect(err).to.have.property('lineno');
        expect(err.errors).to.not.be.empty;
      });
  });

  it('reports zero import when reading invalid file (binary file)', () => {
    const filepath = path.join(__dirname, 'fixtures/imports/binary-file.xyz');
    return service
      .importData(filepath)
      .then(count => expect(count).to.equal(0))
      .catch(err => expect.fail(`execution should not get here: ${err}`));
  });

});
