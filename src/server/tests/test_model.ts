import {
  School,
  Department,
  createDbConnection,
  Programme,
  Course,
  Lecturer,
  AcademicPeriod
} from '../src/data/models';
import {getConnection, Connection, Repository} from 'typeorm';
import * as chai from 'chai';
import 'mocha';


describe('Models', ()=>{
  let connection: Connection;
  let schoolRepository: Repository<School>;
  let departmentRepository: Repository<Department>;
  let programmeRepository: Repository<Programme>;
  let courseRepository: Repository<Course>;
  let lecturerRepository: Repository<Lecturer>;
  let periodRepository: Repository<AcademicPeriod>;


  before(async ()=>{
    try{
      connection = await createDbConnection("versity_test.sqlite");
      schoolRepository = connection.getRepository(School);
      departmentRepository = connection.getRepository(Department);
      programmeRepository = connection.getRepository(Programme);
      courseRepository = connection.getRepository(Course);
      lecturerRepository = connection.getRepository(Lecturer);
      periodRepository = connection.getRepository(AcademicPeriod);
    }
    catch(e){
      console.error(`Initialize versity db failed with `, e);
      throw e;
    }
  })

  describe('#CreateSchool', ()=>{

    it('should add a school to the database', async function(){
      let school = new School("School Name", "Generated School","School street",
      "School state", "School town");
      let savedSchool = await schoolRepository.save(school);
      let fetchedSchool = await schoolRepository.findOne(savedSchool.id);
      chai.assert.exists(fetchedSchool);
      chai.assert.equal(fetchedSchool.id, savedSchool.id);
      chai.assert.exists(savedSchool.date_created);
      chai.assert.exists(savedSchool.date_updated);
    });

    it('should add school with two children', async function(){
      let parent = new School('sname','title', 'str', 'sstate', 'stwon');
      let child_one = new School('cname', 'ctitle', 'cstr', 'cstate', 'ctown');
      child_one.parent = parent;
      let child_two = new School('ctname', 'ctitle', 'ctstr', 'ctstate', 'cttown');
      child_two.parent = parent;
      await schoolRepository.save(parent);
      await schoolRepository.save(child_one);
      await schoolRepository.save(child_two);
      parent = await schoolRepository.findOne(parent.id, {relations: ['children']})
      child_one = await schoolRepository.findOne(child_one.id, {relations: ['parent']})
      child_two = await schoolRepository.findOne(child_two.id, {relations: ['parent']})
      chai.assert(parent.children.length === 2);
      chai.assert(parent.id === child_one.parent.id);
      chai.assert(child_one.parent.id === child_two.parent.id);
    });
  });

  describe('#CreateDepartment', ()=>{
    it('should add a department with a parent faculty in the db', async ()=>{
      let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
      let department = new Department('Department', 'dept', faculty);
      await schoolRepository.save(faculty);
      await departmentRepository.save(department);
      faculty = await schoolRepository.findOne(faculty.id, {relations: ['departments']});
      department = await departmentRepository.findOne(department.id, {relations: ['faculty']});
      chai.assert.isNumber(faculty.id);
      chai.assert.isNumber(department.id);
      chai.assert(faculty.departments.length === 1);
      chai.assert(department.faculty.id === faculty.id);
    })
  });

  describe('#CreateProgramme', ()=>{
    it('should add a programme with a parent department in db', async ()=>{
      let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
      let department = new Department('Department', 'dept', faculty);
      let programme = new Programme('programme', 'prg', 5, department);
      await schoolRepository.save(faculty);
      await departmentRepository.save(department);
      await programmeRepository.save(programme);
      faculty = await schoolRepository.findOne(faculty.id, {relations: ['departments']});
      department = await departmentRepository.findOne(department.id, {relations: ['faculty', 'programmes']});
      programme = await programmeRepository.findOne(programme.id, {relations: ['department']})
      chai.assert.isNumber(faculty.id);
      chai.assert.isNumber(department.id);
      chai.assert.isNumber(programme.id);
      chai.assert(faculty.departments.length === 1);
      chai.assert(department.faculty.id === faculty.id);
      chai.assert(department.programmes.length === 1);
      chai.assert(programme.department.id === department.id);
    })
  });

  describe('#CreateLecturer', ()=>{
    it('should add a lecturer with a parent department in db', async ()=>{
      let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
      let department = new Department('Department', 'dept', faculty);
      let lecturer = new Lecturer('Mr. Adamu', 'adm', department);
      await schoolRepository.save(faculty);
      await departmentRepository.save(department);
      await lecturerRepository.save(lecturer);
      faculty = await schoolRepository.findOne(faculty.id, {relations: ['departments']});
      department = await departmentRepository.findOne(department.id, {relations: ['faculty', 'lecturers']});
      lecturer = await lecturerRepository.findOne(lecturer.id, {relations: ['department']})
      chai.assert.isNumber(faculty.id);
      chai.assert.isNumber(department.id);
      chai.assert.isNumber(lecturer.id);
      chai.assert(faculty.departments.length === 1);
      chai.assert(department.faculty.id === faculty.id);
      chai.assert(department.lecturers.length === 1);
      chai.assert(lecturer.department.id === department.id);
    })
  });

  describe('#CreateCourse', ()=>{
    it('should add a course with a parent programme in db', async ()=>{
      let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
      let department = new Department('Department', 'dept', faculty);
      let programme = new Programme('programme', 'prg', 5, department);
      let course = new Course('course name', 'crs', 'mee203', 3, 300, programme);
      await schoolRepository.save(faculty);
      await departmentRepository.save(department);
      await programmeRepository.save(programme);
      await courseRepository.save(course);
      faculty = await schoolRepository.findOne(faculty.id, {relations: ['departments']});
      department = await departmentRepository.findOne(department.id, {relations: ['faculty', 'programmes']});
      programme = await programmeRepository.findOne(programme.id, {relations: ['department', 'courses']})
      course = await courseRepository.findOne(course.id, {relations: ['programme']});
      chai.assert.isNumber(faculty.id);
      chai.assert.isNumber(department.id);
      chai.assert.isNumber(programme.id);
      chai.assert.isNumber(course.id);
      chai.assert(faculty.departments.length === 1);
      chai.assert(department.faculty.id === faculty.id);
      chai.assert(department.programmes.length === 1);
      chai.assert(programme.department.id === department.id);
      chai.assert(programme.courses.length === 1);
      chai.assert(course.programme.id === programme.id);
    })
  });

  describe('#CreateAcademicPeriod', ()=>{
    it('should add an academic period with two other academic periods as children', async ()=>{
      let faculty = new School('Faculty', 'fac', 'fstr', 'fstt', 'ftown');
      let session = new AcademicPeriod('session', 'ssn', new Date(), new Date(),faculty);
      let semester_one = new AcademicPeriod('first semester', 'smst1', new Date(), new Date(),faculty);
      semester_one.parent = session;
      let semester_two = new AcademicPeriod('second semester', 'smst2', new Date(), new Date(),faculty);
      semester_two.parent = session;
      await schoolRepository.save(faculty);
      await periodRepository.save(session);
      await periodRepository.save(semester_one);
      await periodRepository.save(semester_two);
      faculty = await schoolRepository.findOne(faculty.id, {relations: ['academicPeriods']});
      session = await periodRepository.findOne(session.id, {relations: ['school', 'parent', 'children']});
      semester_one = await periodRepository.findOne(semester_one.id, {relations: ['school', 'parent', 'children']});
      semester_two = await periodRepository.findOne(semester_two.id, {relations: ['school', 'parent', 'children']});
      chai.assert.isNumber(faculty.id);
      chai.assert.isNumber(session.id);
      chai.assert.isNumber(semester_one.id);
      chai.assert.isNumber(semester_two.id);
      chai.assert(faculty.academicPeriods.length === 3);
      chai.assert(session.school.id == faculty.id);
      chai.assert(semester_one.school.id == faculty.id);
      chai.assert(semester_two.school.id == faculty.id);
      chai.assert(session.children.length === 2);
      chai.assert(semester_one.parent.id === session.id);
      chai.assert(semester_two.parent.id === session.id);
    })
  });
})


