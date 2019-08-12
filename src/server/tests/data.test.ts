// tslint:disable:no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import { Connection, models } from '../src/data';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;


describe('# model validation tests', async () => {
  let conn: Connection;

  before(async () => {
    conn = await getTestDbConnection('test-db3');
  });

  it('should find the findRepository extension method on Connection', async () => {
    expect(conn).to.have.property('findRepository');
  });

  it('should retrieve custom repository using findRepository on connection', async () => {
    const repository = conn.findRepository(models.School);
    expect(repository).to.not.be.undefined;
    expect(repository).to.not.be.null;
  });
});
