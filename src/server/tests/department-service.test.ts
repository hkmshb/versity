// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp from 'chai-http';
import * as mocha from 'mocha';
import { itParam } from 'mocha-param';
import { relativeTimeRounding } from 'moment';
import VersityServer from '../src/app';
import { Connection, getDbConnection, models } from '../src/data';
import { AcademicSection, Department } from '../src/data/models';
import { DepartmentService } from '../src/data/services';
import { FixtureLoader, loadValidEntityFixtures } from './test-utils';


chai.use(chaiHttp);
const expect = chai.expect;


/**
 * check if school exists otherwise create school in db for departments to be imported
 */
async function addSchool() {
  const conn = await getDbConnection();
  const schoolService = await conn.findEntityServiceFor(AcademicSection);
  const schoolData = {
    name: 'Kigelia University of Technology',
    code: 'kigelia-university-of-technology',
    nickname: 'KUT',
    addrStreet: 'No 7 Kigelia Avenue',
    addrState: 'Kigelia, Kig-Country',
    addrTown: 'Kig'
  };
  if (await schoolService.findByIdent(schoolData.code) != null) {
    return;
  }
  await schoolService.createAndSave(schoolData);
}

describe('# department service tests', () => {
  let connection: Connection;
  let departmentService: DepartmentService;

  before('create db conn & add school', async () => {
    connection = await getDbConnection();
    departmentService = connection.findEntityServiceFor(Department) as DepartmentService;
    await addSchool();
  });

  it('should import departments from csv file', async done => {
    const count = await departmentService.importRecords('tests/fixtures/import-docs/departments.csv');
    expect(count).to.equal(8);
    done();
  });
});
