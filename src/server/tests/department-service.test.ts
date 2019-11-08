// tslint:disable:no-unused-expression
import chai from 'chai';
import * as mocha from 'mocha';
import path from 'path';
import { Connection } from '../src/data';
import { AcademicSection, Department } from '../src/data/models';
import { AcademicSectionService, DepartmentService } from '../src/data/services';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;


describe('# department service tests', () => {
  let connection: Connection;
  let school: AcademicSection;
  let facultyArts: AcademicSection;
  let facultyEngineering: AcademicSection;
  let departmentService: DepartmentService;

  before('create db conn & add school', async () => {
    connection = await getTestDbConnection('test-dept-service');
    const asService = await connection.findEntityServiceFor(AcademicSection); // academic section service
    school = await asService.createAndSave({ // create and save school
      name: 'University of Ilorin', code: 'unilorin', nickname: 'UI'
    });
    facultyArts = await asService.createAndSave({ // create and save faculty of arts
      name: 'Faculty of Arts', code: 'farts', nickname: 'FA', parentId: school.id
    });
    facultyEngineering = await asService.createAndSave({ // create and save faculty of engineering
      name: 'Faculty of Engineering', code: 'fengine', nickname: 'FE', parentId: school.id
    });
    departmentService = connection.findEntityServiceFor(Department) as DepartmentService;

  });

  it('should fail validation for missing academic section', () => {
    departmentService
    .createAndSave({name: 'Food Engineering'})
    .then(dept => { expect.fail(`expect create and save to fail ${dept}`); })
    .catch(err => expect(err.errors).to.not.be.empty);
 });

  it('should fail validation for non existing academic section', () => {
     departmentService
     .createAndSave({name: 'Electrical Engineering', academicSectionId: 500})
     .then(dept => { expect.fail(`expect create and save to fail ${dept}`); })
     .catch(err => expect(err.errors).to.not.be.empty);
  });

  it('should fail validation for school instead of faculty', () => {
    departmentService
    .createAndSave({name: 'Biomedical Engineering', academicSectionId: school.id})
    .then(dept => { expect.fail(`expect create and save to fail ${dept}`); })
    .catch(err => expect(err.errors).to.not.be.empty);
 });

  it('should successfully add departments with same name to different faculties under the same school', () => {
   const name = 'Software Engineering';
   departmentService
   .createAndSave({name, academicSectionId: facultyArts.id})
   .then(dept => expect(dept.id).to.not.be.null);

   departmentService
   .createAndSave({name, academicSectionId: facultyEngineering.id})
   .then(dept => expect(dept.id).to.not.be.null);
 });

  it('should fail to add departments with same name to the same faculty', () => {
   const name = 'Mechanical Engineering';
   departmentService
   .createAndSave({name, academicSectionId: facultyArts.id})
   .then(deptME => {
     expect(deptME.id).to.not.be.null;
     departmentService
     .createAndSave({name, academicSectionId: facultyArts.id})
     .then(dept => { expect.fail(`expect create and save to fail ${dept}`); })
     .catch(err => {  expect(err.errors).to.not.be.empty; });
    });
 });

  it('should fail update when changing name to an existing department name', () => {
   const name = 'Water Engineering';
   departmentService
   .createAndSave({name, academicSectionId: facultyEngineering.id})
   .then(deptWE => {
     expect(deptWE.id).to.not.be.null ;
     departmentService
     .createAndSave({name: 'Material Engineering', academicSectionId: facultyEngineering.id})
     .then(deptME => {
       expect(deptME.id).to.not.be.null;
       departmentService
       .updateAndSave({id: deptME.id, name})
       .then(dept => { expect.fail(`expect update to fail ${dept}`); })
       .catch(err => { expect(err.errors).to.not.be.empty; });
      });
    });
 });
});


describe('# department service & data import', async () => {
  let conn: Connection;
  let service: DepartmentService;

  before(async () => {
    conn = await getTestDbConnection('test-department+import');
    service = conn.getCustomRepository(DepartmentService);

    // import academic section data
    const filepath = path.join(__dirname, 'fixtures/imports/academic-session-records.csv');
    const sectionService = conn.getCustomRepository(AcademicSectionService);
    await sectionService.importData(filepath);
  });

  it('can import all valid department data from file', async () => {
    const filepath = path.join(__dirname, 'fixtures/imports/department-records.csv');
    const importCount = await service.importData(filepath);
    expect(importCount).to.equal(6);

    const count = await service.getRepository().count();
    expect(count).to.equal(6);
  });
});
