// tslint:disable:no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import * as conf from '../src/config';
import { Connection, getDbConnection, models } from '../src/data';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;


describe('# connection tests', async () => {
  let conn: Connection;

  before(async () => {
    conn = await getTestDbConnection('test-data1');
  });

  it('should find the findEntityServiceFor extension method on Connection', () => (
    expect(conn).to.have.property('findEntityServiceFor')
  ));

  it('should retrieve entity service using findEntityService on connection', () => {
    const service = conn.findEntityServiceFor(models.AcademicSection);
    expect(service).to.not.be.undefined;
    expect(service).to.not.be.null;
  });

  it('can alter target connection for getConnection using NODE_ENV', async () => {
    // needed for testing purposes in order to use a named in memory sqlite database
    process.env.NODE_ENV = 'production';
    const conn1 = await getDbConnection('_default_');
    expect(conn1.name).to.equal('_default_');

    const conn2 = await getDbConnection('_default_');
    expect(conn2.name).to.equal('_default_');
    expect(conn2.options.synchronize).to.equal(conf.IS_TEST_ENV);

    const timestamp = (new Date()).toISOString()
      .replace(/-/g, '')
      .replace(/:/g, '');

    process.env.NODE_ENV = 'test';
    const tconn = await getDbConnection(`test-${timestamp}`);
    expect(tconn.name).to.equal(`test-${timestamp}`);
    expect(tconn.options.synchronize).to.equal(conf.IS_TEST_ENV);
  });

});
