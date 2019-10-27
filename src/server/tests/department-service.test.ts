// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp from 'chai-http';
import * as mocha from 'mocha';
import { itParam } from 'mocha-param';
import VersityServer from '../src/app';
import { Connection, getDbConnection, models } from '../src/data';
import { FixtureLoader, loadValidEntityFixtures } from './test-utils';
import { School, Department } from '../src/data/models';
import { DepartmentService } from '../src/data/services'


chai.use(chaiHttp);
const expect = chai.expect;


describe('# department service tests', () => {
  let connection:Connection;
  let departmentService:DepartmentService
  let school: School;

  before('create db conn & add school', async () => {
    connection = await getDbConnection();
    let schoolService = connection.findEntityServiceFor(School);
    school = await schoolService.createAndSave({
      "name": "Kigelia University of Technology",
      "code": "kigelia-university-of-technology",
      "nickname": "KUT",
      "addrStreet": "No 7 Kigelia Avenue",
      "addrState": "Kigelia, Kig-Country",
      "addrTown": "Kig",
    });
    departmentService = <DepartmentService>connection.findEntityServiceFor(Department);
  });

  it('should import departments from csv file', async done => {
    let count = await departmentService.importRecords('tests/fixtures/import-docs/departments.csv');
    expect(count).to.equal(8);
    done();
  })
});
