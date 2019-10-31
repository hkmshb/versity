// tslint:disable no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import { itParam } from 'mocha-param';
import moment from 'moment';
import path from 'path';
import { Connection } from '../src/data';
import { AcademicPeriod, AcademicSection } from '../src/data/models';
import { AcademicPeriodService, AcademicSectionService } from '../src/data/services';
import { EntityService } from '../src/data/types';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;
const DATE_FMT = 'YYYY-MM-DD';


describe('# academic-period service & data validation tests', async () => {
  let conn: Connection;
  let school: AcademicSection = null;
  let institution: AcademicSection = null;
  let periodService: EntityService<AcademicPeriod, any> = null;

  before(async () => {
    conn = await getTestDbConnection('test-period-service+val#1');
    periodService = conn.findEntityServiceFor(AcademicPeriod);

    // create school entity expected to exits for some tests
    const schoolService = conn.findEntityServiceFor(AcademicSection);
    return schoolService
      .createAndSave({name: 'Baobab University', code: 'baobab-university', nickname: 'BU'})
      .then(inst => {
        institution = inst;
        return schoolService.createAndSave({
          name: 'School of Engineering', code: 'school-of-engineering', nickname: 'BU-SENGR',
          parentId: institution.id
        })
        .then(sch => {
          school = sch;
          return school;
        });
      });
  });

  it('should fail creation if not associated with an institution', async () => {
    const data = {
      name: '2018/2019', code: '2018-2019',
      dateBegin: moment().format(DATE_FMT),
      dateEnd: moment().add(2, 'd').format(DATE_FMT)
    };

    return periodService
      .createAndSave(data)
      .then(_ => { throw new Error('execution should not get here!'); })
      .catch(err => {
        expect(err.name).to.equal('VersityValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.errors).has.property('academicSectionId');
      });
  });

  it('should fail creation if associated with a school (which has parent)', async () => {
    // create academic period with invalid school; this is the case because academic
    // periods are defined for an institution not a school within an instititution
    const data = {
      name: '2018/2019-II',
      code: '2018-2019-II',
      academicSectionId: school.id,
      dateBegin: moment().format(DATE_FMT),
      dateEnd: moment().add(1, 'd').format(DATE_FMT)
    };

    return periodService
      .createAndSave(data)
      .then(_ => { throw new Error('execution should not get here!'); })
      .catch(err => {
        expect(err.name).to.equal('VersityValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.errors).has.property('academicSectionId');
      });
  });

  const academicPeriodWithIncompleteDateRange = [
    {name: 'dateBegin', value: moment().format(DATE_FMT), missing: 'dateEnd' },
    {name: 'dateEnd', value: moment().format(DATE_FMT), missing: 'dateBegin' },
  ];
  itParam('should fail creation for incomplete date range (only: ${value.name})',
          academicPeriodWithIncompleteDateRange, async entry => {
    // create academic period with an associated institution but incomplete date range
    const data = {
      name: '2018/2019-III',
      code: '2018-2019-III',
      academicSectionId: institution.id,
      [entry.name]: entry.value
    };
    return periodService
      .createAndSave(data)
      .then(_ => { throw new Error('execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('VersityValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.errors).has.property(entry.missing);
      });
  });

  it('should fail creation for invalid date range', async () => {
    const data = {
      name: '2018/2019-IV',
      code: '2018-2019-IV',
      academicSectionId: institution.id,
      dateBegin: moment().add(7, 'd').format(DATE_FMT),
      dateEnd: moment().format(DATE_FMT)
    };
    return periodService
      .createAndSave(data)
      .then(_ => { throw new Error('execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('VersityValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.errors).has.property('dateBegin');
      });
  });

  it('should fail creation for child semester with date outside session', async () => {
    const sessionData = {
      name: '2018/2019-V',
      code: '2018-2019-V',
      academicSectionId: institution.id,
      dateBegin: moment().format(DATE_FMT),
      dateEnd: moment().add(30, 'd').format(DATE_FMT)
    };

    const session = await periodService.createAndSave(sessionData);
    expect(session.id).to.be.greaterThan(0);

    const semesterData = {
      name: '1st Semester',
      code: '1st-semester',
      parentId: session.id,
      dateBegin: moment().subtract(1, 'd').format(DATE_FMT),
      dateEnd: moment().add(10, 'd').format(DATE_FMT)
    };

    return periodService
      .createAndSave(semesterData)
      .then(_ => { throw new Error('execution should not get here.'); })
      .catch(err => {
        expect(err.name).to.equal('VersityValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.errors).has.property('dateBegin');
      });
  });

  it('should fail creation for child semesters with overlapping date range', async () => {
    // create academic period
    const sessiondata = {
      name: '2018/2019-VI',
      code: '2018-2019-VI',
      academicSectionId: institution.id
    };
    const session = await periodService.createAndSave(sessiondata);
    expect(session.id).to.be.greaterThan(0);

    // create first valid semester
    const semesterdata1 = {
      name: '1st Semester',
      code: '1st-semester',
      parentId: session.id,
      dateBegin: moment().format(DATE_FMT),
      dateEnd: moment().add(10, 'd').format(DATE_FMT)
    };
    const semester1 = await periodService.createAndSave(semesterdata1);
    expect(semester1.id).to.be.greaterThan(0);

    const semesterdata2  = {
      name: '2nd Semester',
      code: '2nd-semester',
      parentId: session.id,
      dateBegin: moment().add(8, 'd').format(DATE_FMT),
      dateEnd: moment().add(20, 'd').format(DATE_FMT)
    };

    return periodService
      .createAndSave(semesterdata2)
      .then(_ => { throw new Error('execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('VersityValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.errors).has.property('dateBegin');
      });
  });

  it('should ensure parent exist for provided parentId', async () => {
    const data = {
      name: '2018/2019-#X1',
      code: '2018-2019-#X1',
      academicSectionId: institution.id,
      parentId: 'unknown-id'
    };

    return periodService
      .createAndSave(data)
      .then(_ => { throw new Error('execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('VersityValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.errors).has.property('parentId');
      });
  });

  it('can create session w/o date range', async () => {
    const sessiondata = {
      name: '2018/2019-#V1',
      code: '2018-2019-#V1',
      academicSectionId: institution.id
    };
    return periodService
      .createAndSave(sessiondata)
      .then(period => expect(period.id).to.be.greaterThan(0))
      .catch(err => expect(err).to.be.null);
  });

  it('can create session and child semester all w/o date range', async () => {
    const sessiondata = {
      name: '2018/2019-#V2',
      code: '2018-2019-#V2',
      academicSectionId: institution.id
    };
    return periodService
      .createAndSave(sessiondata)
      .then(session => {
        expect(session.id).to.be.greaterThan(0);
        const semesteradta = {
          name: '1st Semester',
          code: '1st-semester',
          parentId: session.id
        };
        return periodService.createAndSave(semesteradta);
      })
      .then(semester => expect(semester.id).to.be.greaterThan(0));
  });

  it('can create session w/o date range but child semester with date range', async () => {
    const sessiondata = {
      name: '2018/2019-#V3',
      code: '2018-2019-#V3',
      academicSectionId: institution.id
    };
    return periodService
      .createAndSave(sessiondata)
      .then(session => {
        expect(session.id).to.be.greaterThan(0);
        const semesterdata = {
          name: '1st Semeter',
          code: '1st-semester',
          parentId: session.id,
          dateBegin: moment().format(DATE_FMT),
          dateEnd: moment().add(7, 'd').format(DATE_FMT)
        };
        return periodService.createAndSave(semesterdata);
      })
      .then(semester => {
        expect(semester.id).to.be.greaterThan(0);
      });
  });

});

describe('# academic-period service & data import', async () => {
  let conn: Connection;
  let service: AcademicPeriodService;

  before(async () => {
    conn = await getTestDbConnection('test-period+import');
    service = conn.getCustomRepository(AcademicPeriodService);

    // import academic section data
    const filepath = path.join(__dirname, 'fixtures/imports/academic-session-records.csv');
    const sectionService = conn.getCustomRepository(AcademicSectionService);
    await sectionService.importData(filepath);
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

  it('import fails when file has rows violating unique constraints', () => {
    const filepath = path.join(__dirname, 'fixtures/imports/academic-period-records-violating-uniq-constraint.csv');
    return service
      .importData(filepath)
      .then(_ => expect.fail('execution should not get here'))
      .catch(err => {
        expect(err.name).to.equal('DataImportError');
        expect(err.lineno).to.equal(6);
      });
  });

  it('can import all valid period data from file', async () => {
    const filepath = path.join(__dirname, 'fixtures/imports/academic-period-records.csv');
    const importCount = await service.importData(filepath);
    expect(importCount).to.equal(6);

    const count = await service.getRepository().count();
    expect(count).to.equal(6);
  });

  it('can import valid period data with intended inter relationships', async () => {
    const periodConn = await getTestDbConnection('test-period+import#2');
    const sectionService = periodConn.getCustomRepository(AcademicSectionService);
    const periodService = periodConn.getCustomRepository(AcademicPeriodService);

    let filepath = path.join(__dirname, 'fixtures/imports/academic-session-records.csv');
    let importCount = await sectionService.importData(filepath);
    expect(importCount).to.equal(7);

    filepath = path.join(__dirname, 'fixtures/imports/academic-period-records.csv');
    importCount = await periodService.importData(filepath);
    expect(importCount).to.equal(6);

    const period = await periodService.getRepository().find({
      where: { code: '2018-2019-session'},
      relations: ['parent', 'children']
    });

    expect(period).to.not.be.empty;
    expect(period[0].parent).to.be.null;
    expect(period[0].children).to.not.be.empty;
    expect(period[0].children.length).to.equal(2);
  });

});
