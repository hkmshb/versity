// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp from 'chai-http';
import * as mocha from 'mocha';
import { itParam } from 'mocha-param';
import moment from 'moment';
import VersityServer from '../src/app';
import { Connection, getDbConnection } from '../src/data';
import { AcademicPeriod, AcademicSection } from '../src/data/models';
import { EntityService } from '../src/data/types';
import { getTestDbConnection } from './test-utils';


chai.use(chaiHttp);
const expect = chai.expect;
const DATE_FMT = 'YYYY-MM-DD';


describe('# academic-period controller tests', () => {
  let conn: Connection;
  let institution: AcademicSection;
  let server: VersityServer;
  const endpoint = '/academic-periods';
  let periodService: EntityService<AcademicPeriod, any> = null;

  before(async () => {
    server = new VersityServer();
    conn = await getDbConnection();
    periodService = conn.findEntityServiceFor(AcademicPeriod);

    // create school entity expected to exits for some tests
    const schoolService = conn.findEntityServiceFor(AcademicSection);
    return schoolService
      .createAndSave({name: 'Baobab University', code: 'baobab-university', nickname: 'BU'})
      .then(async inst => {
        institution = inst;
        await periodService.createAndSave({name: '2016/2017', code: '2016-2017', academicSectionId: institution.id});
        await periodService.createAndSave({name: '2017/2018', code: '2017-2018', academicSectionId: institution.id});
      });
  });

  it('can retrieve listing via get', done => {
    chai.request(server.app)
        .get(endpoint)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.not.be.empty;
          done();
        });
  });

  it('can retrieve by code via get', done => {
    const code = '2016-2017';
    chai.request(server.app)
        .get(`${endpoint}/${code}`)
        .end((err, res) =>  {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('code');
          expect(res.body.code).to.equal('2016-2017');
          done();
        });
  });

  it('fails with decent message when retrieving by name when no resource is found', done => {
    const name = 'unknown-name';
    chai.request(server.app)
        .get(`${endpoint}/${name}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.nested.property('errors.ident');
          done();
        });
  });

  const validAcademicPeriodArgs = [
    {name: '2018/2019', code: '2018-2019'},
    {
      name: '2019/2020', code: '2019-2020',
      dateBegin: moment().format(DATE_FMT),
      dateEnd: moment().add(14, 'd').format(DATE_FMT)
    }
  ];

  itParam('can create from valid arguments via post: ${value.code}',
          validAcademicPeriodArgs, (done, data) => {
    data.academicSectionId = institution.id;
    chai.request(server.app)
        .post(endpoint)
        .send(data)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('uuid');
          done();
        });
  });

  const violateUniqueConstraints = [
    {ident: '2016-2017', name: '2016/2017'},
    {ident: '2016-2017', code: '2016-2017'},
  ];

  itParam('should fail update via post with args violating unique constraints',
          violateUniqueConstraints, (done, data) => {
    data.schoolId = institution.id;
    chai.request(server.app)
        .put(`${endpoint}/${data.ident}`)
        .send(data)
        .end((err, res) => {
          expect(res).has.status(400);
          expect(res.body).to.have.property('errors');
          done();
        });
  });

});
