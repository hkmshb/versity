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
    loadValidEntityFixtures(loader)
      .then(result => expect(result).to.be.true);
  });
});


describe('# entity tests', async () => {
  let loader: FixtureLoader;

  before(async () => {
    loader = new FixtureLoader(await getTestDbConnection('test-models#2'));
    return await loadValidEntityFixtures(loader);
  });

  // ======================================================================
  // School Entity Tests
  // ======================================================================
  it('should verify school count matches loaded fixture entries', async () => {
    return (
      loader.conn
        .getRepository('School')
        .count()
        .then(value => expect(value).to.equal(7))
    );
  });

  it('should verify school parent relationship', async () => {
    return (
      loader.conn
        .getRepository(models.School)
        .findOne({nickname: 'KUT-SOENG'}, {relations: ['parent']})
        .then(school => {
          expect(school).to.not.be.undefined;
          expect(school.parent.nickname).to.equal('KUT');
        })
    );
  });

  it('should verify school children relationship', async () => {
    return (
      loader.conn
        .getRepository(models.School)
        .findOne({nickname: 'KUT'}, {relations: ['parent', 'children']})
        .then(school => {
          expect(school).to.not.be.undefined;
          expect(school.parent).to.be.null;
          expect(school.children.length).to.equal(2);
        })
    );
  });

  it('should verify school to academic period relationship', async () => {
    return(
      loader.conn
        .getRepository(models.School)
        .findOne({nickname: 'BSM'}, {relations: ['academicPeriods']})
        .then(school => {
          expect(school).to.not.be.undefined;
          expect(school.academicPeriods.length).to.equal(1);
        })
    );
  });

  it('should not have orphaned academic periods for schools', async () => {
    return (
      loader.conn
        .getRepository(models.AcademicPeriod)
        .find({relations: ['school']})
        .then(periods => {
          expect(periods.length).to.equal(5);
          periods.filter(p => p.parent ===  null).forEach(p => {
            expect(p.school).to.not.be.null;
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


// import * as chai from 'chai';
// import 'mocha';
// import {Connection, getConnection, Repository} from 'typeorm';
// import {
//   AcademicPeriod,
//   Course,
//   createDbConnection,
//   Department,
//   Document,
//   Lecturer,
//   Programme,
//   School
// } from '../src/data/models';


// describe('Models', () => {
//   let connection: Connection;
//   let schoolRepository: Repository<School>;
//   let departmentRepository: Repository<Department>;
//   let programmeRepository: Repository<Programme>;
//   let courseRepository: Repository<Course>;
//   let lecturerRepository: Repository<Lecturer>;
//   let periodRepository: Repository<AcademicPeriod>;
//   let documentRepository: Repository<Document>;


//   before(async () => {
//     try {
//       connection = await createDbConnection('.test.sqlite');
//       schoolRepository = connection.getRepository(School);
//       departmentRepository = connection.getRepository(Department);
//       programmeRepository = connection.getRepository(Programme);
//       courseRepository = connection.getRepository(Course);
//       lecturerRepository = connection.getRepository(Lecturer);
//       periodRepository = connection.getRepository(AcademicPeriod);
//       documentRepository = connection.getRepository(Document);
//     } catch (e) {
//       console.error(`Initialize versity db failed with `, e);
//       throw e;
//     }
//   });

//   describe('#CreateSchool', () => {
//     it('should add a school to the database', async () => {
//       const school = new School('School Name', 'Generated School', 'School street',
//                                 'School state', 'School town');

//       const savedSchool = await schoolRepository.save(school);
//       const fetchedSchool = await schoolRepository.findOne(savedSchool.id);
//       chai.assert.exists(fetchedSchool);
//       chai.assert.equal(fetchedSchool.id, savedSchool.id);
//       chai.assert.exists(savedSchool.dateCreated);
//       chai.assert.exists(savedSchool.dateUpdated);
//     });

//     it('should add school with two children', async () => {
//       let parent = new School('sname', 'title', 'str', 'sstate', 'stwon');
//       let childOne = new School('cname', 'ctitle', 'cstr', 'cstate', 'ctown');
//       childOne.parent = parent;

//       let childTwo = new School('ctname', 'ctitle', 'ctstr', 'ctstate', 'cttown');
//       childTwo.parent = parent;

//       await schoolRepository.save(parent);
//       await schoolRepository.save(childOne);
//       await schoolRepository.save(childTwo);

//       parent = await schoolRepository.findOne(parent.id, {relations: ['children']});
//       childOne = await schoolRepository.findOne(childOne.id, {relations: ['parent']});
//       childTwo = await schoolRepository.findOne(childTwo.id, {relations: ['parent']});

//       chai.assert(parent.children.length === 2);
//       chai.assert(parent.id === childOne.parent.id);
//       chai.assert(childOne.parent.id === childTwo.parent.id);
//     });
//   });

//   describe('#CreateDepartment', () => {
//     it('should add a department with a parent faculty in the db', async () => {
//       let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
//       let department = new Department('Department', 'dept', faculty);

//       await schoolRepository.save(faculty);
//       await departmentRepository.save(department);

//       faculty = await schoolRepository.findOne(faculty.id, {relations: ['departments']});
//       department = await departmentRepository.findOne(department.id, {relations: ['faculty']});

//       chai.assert.isNumber(faculty.id);
//       chai.assert.isNumber(department.id);
//       chai.assert(faculty.departments.length === 1);
//       chai.assert(department.faculty.id === faculty.id);
//     });
//   });

//   describe('#CreateProgramme', () => {
//     it('should add a programme with a parent department in db', async () => {
//       let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
//       let department = new Department('Department', 'dept', faculty);
//       let programme = new Programme('programme', 'prg', 5, department);

//       await schoolRepository.save(faculty);
//       await departmentRepository.save(department);
//       await programmeRepository.save(programme);

//       faculty = await schoolRepository.findOne(faculty.id, {relations: ['departments']});
//       department = await departmentRepository.findOne(department.id, {relations: ['faculty', 'programmes']});
//       programme = await programmeRepository.findOne(programme.id, {relations: ['department']});

//       chai.assert.isNumber(faculty.id);
//       chai.assert.isNumber(department.id);
//       chai.assert.isNumber(programme.id);
//       chai.assert(faculty.departments.length === 1);
//       chai.assert(department.faculty.id === faculty.id);
//       chai.assert(department.programmes.length === 1);
//       chai.assert(programme.department.id === department.id);
//     });
//   });

//   describe('#CreateLecturer', () => {
//     it('should add a lecturer with a parent department in db', async () => {
//       let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
//       let department = new Department('Department', 'dept', faculty);
//       let lecturer = new Lecturer('Mr. Adamu', 'adm', department);

//       await schoolRepository.save(faculty);
//       await departmentRepository.save(department);
//       await lecturerRepository.save(lecturer);

//       faculty = await schoolRepository.findOne(faculty.id, {relations: ['departments']});
//       department = await departmentRepository.findOne(department.id, {relations: ['faculty', 'lecturers']});
//       lecturer = await lecturerRepository.findOne(lecturer.id, {relations: ['department']});

//       chai.assert.isNumber(faculty.id);
//       chai.assert.isNumber(department.id);
//       chai.assert.isNumber(lecturer.id);
//       chai.assert(faculty.departments.length === 1);
//       chai.assert(department.faculty.id === faculty.id);
//       chai.assert(department.lecturers.length === 1);
//       chai.assert(lecturer.department.id === department.id);
//     });
//   });

//   describe('#CreateCourse', () => {
//     it('should add a course with a parent programme in db', async () => {
//       let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
//       let department = new Department('Department', 'dept', faculty);
//       let programme = new Programme('programme', 'prg', 5, department);
//       let course = new Course('course name', 'crs', 'mee203', 3, 300, programme);

//       await schoolRepository.save(faculty);
//       await departmentRepository.save(department);
//       await programmeRepository.save(programme);
//       await courseRepository.save(course);

//       faculty = await schoolRepository.findOne(faculty.id, {relations: ['departments']});
//       department = await departmentRepository.findOne(department.id, {relations: ['faculty', 'programmes']});
//       programme = await programmeRepository.findOne(programme.id, {relations: ['department', 'courses']});
//       course = await courseRepository.findOne(course.id, {relations: ['programme']});

//       chai.assert.isNumber(faculty.id);
//       chai.assert.isNumber(department.id);
//       chai.assert.isNumber(programme.id);
//       chai.assert.isNumber(course.id);
//       chai.assert(faculty.departments.length === 1);
//       chai.assert(department.faculty.id === faculty.id);
//       chai.assert(department.programmes.length === 1);
//       chai.assert(programme.department.id === department.id);
//       chai.assert(programme.courses.length === 1);
//       chai.assert(course.programme.id === programme.id);
//     });
//   });

//   describe('#CreateAcademicPeriod', () => {
//     it('should add an academic period with two other academic periods as children', async () => {
//       let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
//       let session = new AcademicPeriod('session', 'ssn', new Date(), new Date(), faculty);
//       let semesterOne = new AcademicPeriod('first semester', 'smst1', new Date(), new Date(), faculty);
//       let semesterTwo = new AcademicPeriod('second semester', 'smst2', new Date(), new Date(), faculty);
//       semesterOne.parent = session;
//       semesterTwo.parent = session;

//       await schoolRepository.save(faculty);
//       await periodRepository.save(session);
//       await periodRepository.save(semesterOne);
//       await periodRepository.save(semesterTwo);

//       faculty = await schoolRepository.findOne(faculty.id, {relations: ['academicPeriods']});
//       session = await periodRepository.findOne(session.id, {relations: ['school', 'parent', 'children']});
//       semesterOne = await periodRepository.findOne(semesterOne.id, {relations: ['school', 'parent', 'children']});
//       semesterTwo = await periodRepository.findOne(semesterTwo.id, {relations: ['school', 'parent', 'children']});

//       chai.assert.isNumber(faculty.id);
//       chai.assert.isNumber(session.id);
//       chai.assert.isNumber(semesterOne.id);
//       chai.assert.isNumber(semesterTwo.id);
//       chai.assert(faculty.academicPeriods.length === 3);
//       chai.assert(session.school.id === faculty.id);
//       chai.assert(semesterOne.school.id === faculty.id);
//       chai.assert(semesterTwo.school.id === faculty.id);
//       chai.assert(session.children.length === 2);
//       chai.assert(semesterOne.parent.id === session.id);
//       chai.assert(semesterTwo.parent.id === session.id);
//     });
//   });

//   describe('#CreateDocument', () => {
//     it('should add a document to the database', async () => {
//       const faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
//       const session = new AcademicPeriod('session', 'ssn', new Date(), new Date(), faculty);
//       const department = new Department('Department', 'dept', faculty);
//       const lecturer = new Lecturer('Mr. Adamu', 'adm', department);
//       const programme = new Programme('programme', 'prg', 5, department);
//       const course = new Course('course name', 'crs', 'mee203', 3, 300, programme);
//       let document = new Document('document', 'doc', 'pdf', 4, course, lecturer, session);

//       await schoolRepository.save(faculty);
//       await periodRepository.save(session);
//       await departmentRepository.save(department);
//       await lecturerRepository.save(lecturer);
//       await programmeRepository.save(programme);
//       await courseRepository.save(course);
//       await documentRepository.save(document);

//       document = await documentRepository.findOne(document.id);
//       chai.assert(document.id !== undefined);
//     });
//   });
// });
