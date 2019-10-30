// tslint:disable no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import { Connection } from '../src/data';
import { AcademicPeriodData } from '../src/data/schemas';
import { AcademicPeriodService, AcademicSectionService } from '../src/data/services';
import { EntityError } from '../src/data/types';
import {
  ParentAcademicPeriodValidator,
  ReferencedAcademicSectionValidator
} from '../src/data/validators/academic-period';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;

describe('# academic-period validator :: parent academic period', () => {
  let conn: Connection;
  let sectionService: AcademicSectionService;
  let periodService: AcademicPeriodService;

  before(async () => {
    conn = await getTestDbConnection('test-period-validator#1');

    // create sample section
    sectionService = conn.getCustomRepository(AcademicSectionService);
    const institution = await sectionService.createAndSave({
      name: 'Kigelia University of Technology',
      code: 'kigelia-university-of-technology',
      nickname: 'KUT'
    });
    expect(institution.id).to.not.equal(0);

    // create sample period
    periodService = conn.getCustomRepository(AcademicPeriodService);
    const period = await periodService.createAndSave({
      name: '2018/2019 Session',
      code: '2018-2019-session',
      academicSectionId: institution.id
    });
    expect(period.id).to.not.equal(0);
  });

  it('can resolve academic section Id provided as a reference string', async () => {
    const validator = new ReferencedAcademicSectionValidator(conn.manager);
    const values = {
      name: '2019/2020 Session',
      code: '2019-2020-session',
      academicSectionId: '$ref:nickname=KUT'
    };

    const errors: EntityError<AcademicPeriodData> = {};
    return validator
      .check(values, errors)
      .then(data => {
        expect(data.academicSection).to.not.be.null;
        expect(data.academicSection).to.not.be.undefined;
        expect(data.academicSectionId).to.equal(data.academicSection.id);
        expect(data.academicSection.nickname).to.equal('KUT');
      });
  });

  it('can resolve parent Id provided as a reference string', async () => {
    const validator = new ParentAcademicPeriodValidator(conn.manager);
    const values = {
      name: '1st Semester',
      code: '1st-semester',
      parentId: '$ref:code=2018-2019-session'
    };

    const errors: EntityError<AcademicPeriodData> = {};
    return validator
      .check(values, errors)
      .then(data => {
        expect(data.parent).to.not.be.null;
        expect(data.parent).to.not.be.undefined;
        expect(data.parentId).to.equal(data.parent.id);
        expect(data.parent.name).to.equal('2018/2019 Session');
      })
      .catch(_ => expect.fail(`execution should not get here. err: ${_}.`));
  });

});
