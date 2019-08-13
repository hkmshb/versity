// tslint:disable:no-unused-expression
import * as chai from 'chai';
import * as mocha from 'mocha';
import { Connection, models } from '../src/data';
import { getTestDbConnection } from './test-utils';


const expect = chai.expect;


describe('# model validation tests', async () => {
  let conn: Connection;

  before(async () => {
    conn = await getTestDbConnection('test-data1');
  });

  it('should find the findEntityServiceFor extension method on Connection', () => (
    expect(conn).to.have.property('findEntityServiceFor')
  ));

  it('should retrieve entity service using findEntityService on connection', () => {
    const service = conn.findEntityServiceFor(models.School);
    expect(service).to.not.be.undefined;
    expect(service).to.not.be.null;
  });
});
