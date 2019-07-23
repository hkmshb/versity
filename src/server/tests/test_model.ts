import {School, Department, createDbConnection} from '../src/data/models';
import {getConnection, Connection, Repository} from 'typeorm';
import * as chai from 'chai';
import 'mocha';


describe('Models', ()=>{
  let connection: Connection;
  let schoolRepository: Repository<School>;
  let departmentRepository: Repository<Department>;


  before(async ()=>{
    try{
      connection = await createDbConnection("versity_test.sqlite");
      schoolRepository = connection.getRepository(School);
      departmentRepository = connection.getRepository(Department);
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
  })
})


