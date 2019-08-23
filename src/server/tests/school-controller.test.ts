// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp from 'chai-http';
import * as mocha from 'mocha';
import { itParam } from 'mocha-param';
import VersityServer from '../src/app';
import { getDbConnection, models } from '../src/data';
import { FixtureLoader, loadValidEntityFixtures } from './test-utils';


chai.use(chaiHttp);
const expect = chai.expect;


describe('# school controller tests', () => {
  let server: VersityServer;
  let loader: FixtureLoader;

  before('create db conn & app server', async () => {
    server = new VersityServer();
    loader = new FixtureLoader(await getDbConnection());
    await loadValidEntityFixtures(loader);
  });

  it('should retrieve school listing via get schools', done => {
    chai.request(server.app)
        .get('/schools/')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.not.be.empty;
          done();
        });
  });

  it('should retrieve school by code and id via get schools', done => {
    const code = 'baobab-school-of-medicine';
    chai.request(server.app)
        .get(`/schools/${code}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('name');
          expect(res.body.name).to.equal('Baobab School of Medicine');
          done();
        });
  });

  it('fails with decent message when retrieving school by code if no school found', done => {
    const code = 'baobao-list-tic-record';
    chai.request(server.app)
        .get(`/schools/${code}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.nested.property('errors.ident');
          done();
        });
  });

  const validSchoolArgs = [
    {name: 'Baobab College', code: 'baobab-college', nickname: 'BC'},
    {
      name: 'Baobab College X', code: 'baobab-college-x', nickname: 'BCX',
      addrStreet: 'Baobab College Street', addrTown: 'Baobab Town',
      addrState: 'Baobab'
    },
  ];

  itParam('can create school from valid arguments via post: ${value.code}',
          validSchoolArgs, (done, data) => {
    chai.request(server.app)
        .post('/schools/')
        .send(data)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('uuid');
          done();
        });
  });

  const schoolViolatingUniqueConstraint = [
    {ident: 'marula-university', name: 'Imberbe University'},
    {ident: 'marula-university', code: 'kigelia-university-of-technology'},
  ];

  itParam('should fail update via post with args violating unique constraint',
          schoolViolatingUniqueConstraint, data => {
    chai.request(server.app)
        .put(`/schools/${data.ident}`)
        .send(data)
        .end((err, res) => {
          expect(res).has.status(400);
          expect(res.body).to.have.property('errors');
        });
  });

  it('can update existing school with valid partial args via patch', async () => {
    const data = {ident: 'marula-university', name: 'Marula University (Updated)'};
    const service = loader.conn.findEntityServiceFor(models.School);
    const school = await service.findByIdent(data.ident);
    expect(school.code).to.equal(data.ident);

    chai
      .request(server.app)
      .patch(`/schools/${data.ident}`)
      .send(data)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.id).to.equal(school.id);
        expect(res.body.name).to.not.equal(school.name);
      });
  });

});
