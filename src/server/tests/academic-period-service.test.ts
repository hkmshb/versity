// tslint:disable no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import { itParam } from 'mocha-param';
import moment from 'moment';
import { Connection } from '../src/data';
import { AcademicPeriod, AcademicSection } from '../src/data/models';
import { EntityService } from '../src/data/types';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;
const DATE_FMT = 'YYYY-MM-DD';


describe('# academic period service & data validation tests', async () => {
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
        expect(err.name).to.equal('ValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.path).to.equal('schoolId');
      });
  });

  it('should fail creation if associated with a school (which has parent)', async () => {
    // create academic period with invalid school; this is the case because academic
    // periods are defined for an institution not a school within an instititution
    const data = {
      name: '2018/2019-II',
      code: '2018-2019-II',
      schoolId: school.id,
      dateBegin: moment().format(DATE_FMT),
      dateEnd: moment().add(1, 'd').format(DATE_FMT)
    };

    return periodService
      .createAndSave(data)
      .then(_ => { throw new Error('execution should not get here!'); })
      .catch(err => {
        expect(err.name).to.equal('ValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.path).to.equal('schoolId');
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
      schoolId: institution.id,
      [entry.name]: entry.value
    };
    return periodService
      .createAndSave(data)
      .then(_ => { throw new Error('execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('ValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.path).to.equal(entry.missing);
      });
  });

  it('should fail creation for invalid date range', async () => {
    const data = {
      name: '2018/2019-IV',
      code: '2018-2019-IV',
      schoolId: institution.id,
      dateBegin: moment().add(7, 'd').format(DATE_FMT),
      dateEnd: moment().format(DATE_FMT)
    };
    return periodService
      .createAndSave(data)
      .then(_ => { throw new Error('execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('ValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.path).to.equal('dateBegin');
      });
  });

  it('should fail creation for child semester with date outside session', async () => {
    const sessionData = {
      name: '2018/2019-V',
      code: '2018-2019-V',
      schoolId: institution.id,
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
      .then(_ => { throw new Error('execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('ValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.path).to.equal('dateBegin');
      });
  });

  it('should fail creation for child semesters with overlapping date range', async () => {
    // create academic period
    const sessiondata = {
      name: '2018/2019-VI',
      code: '2018-2019-VI',
      schoolId: institution.id
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
        expect(err.name).to.equal('ValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.path).to.equal('dateBegin');
      });
  });

  it('should ensure parent exist for provided parentId', async () => {
    const data = {
      name: '2018/2019-#X1',
      code: '2018-2019-#X1',
      schoolId: institution.id,
      parentId: 'unknown-id'
    };

    return periodService
      .createAndSave(data)
      .then(_ => { throw new Error('execution should not get here'); })
      .catch(err => {
        expect(err.name).to.equal('ValidationError');
        expect(err.errors).to.not.be.empty;
        expect(err.path).to.equal('parentId');
      });
  });

  it('can create session w/o date range', async () => {
    const sessiondata = {
      name: '2018/2019-#V1',
      code: '2018-2019-#V1',
      schoolId: institution.id
    };
    return periodService
      .createAndSave(sessiondata)
      .then(period => expect(period.id).to.be.greaterThan(0));
  });

  it('can create session and child semester all w/o date range', async () => {
    const sessiondata = {
      name: '2018/2019-#V2',
      code: '2018-2019-#V2',
      schoolId: institution.id
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
      schoolId: institution.id
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
