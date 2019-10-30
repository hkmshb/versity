// tslint:disable no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import { Connection } from '../src/data';
import { AcademicSectionData } from '../src/data/schemas';
import { AcademicSectionService } from '../src/data/services';
import { EntityError } from '../src/data/types';
import { ParentAcademicSectionValidator } from '../src/data/validators/academic-section';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;

describe('# academic-section validator :: parent academic section', () => {
  let conn: Connection;
  let sectionService: AcademicSectionService;

  before(async () => {
    conn = await getTestDbConnection('test-section-validators#1');

    // create sample section
    sectionService = conn.getCustomRepository(AcademicSectionService);
    const institution = await sectionService.createAndSave({
      name: 'Kigelia University of Technology',
      code: 'kigelia-university-of-technology',
      nickname: 'KUT'
    });
    expect(institution.id).to.not.equal(0);
  });

  it('can resolve parent Id provided as a reference string', async () => {
    const validator = new ParentAcademicSectionValidator(conn.manager);
    const values = {
      name: 'School of Engineering',
      code: 'school-of-engineering',
      nickname: 'KUTSOENG',
      parentId: '$ref:nickname=KUT'
    };

    const errors: EntityError<AcademicSectionData> = {};
    return validator
      .check(values, errors)
      .then(data => {
        expect(data.parent).to.not.be.null;
        expect(data.parent).to.not.be.undefined;
        expect(data.parentId).to.equal(data.parent.id);
        expect(data.parent.name).to.equal('Kigelia University of Technology');
      });
  });
});
