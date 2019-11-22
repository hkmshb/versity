import {Command, flags} from '@oclif/command';
import { getDbConnection } from '../../data';
import { AcademicSection, Department } from '../../data/models';


async function importRecord(modelType: string, filepath: string): Promise<number> {
  const connection = await getDbConnection('cli-import');
  let service = null;
  switch (modelType.toLowerCase()) {
    case 'academic-section':
      service = connection.findEntityServiceFor(AcademicSection);
      break;
    case 'department':
      service = connection.findEntityServiceFor(Department);
      break;
  }
  if (service) {
    return await service.importData(filepath);
  }
  return 0;
}


class Import extends Command {
  static description = 'import data records from .csv files into database';

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'p', description: 'filepath'}),
    // flag with a value (-t, --type=VALUE)
    type: flags.string({char: 't', description: 'type of data to import'})
  };

  static args = [{name: 'file'}];

  static usage = 'import -t departments|academicSections|academicPeriods -n [filename]';

  async run() {
    // tslint:disable:no-shadowed-variable
    const {args, flags} = this.parse(Import);
    if (!flags.name) {
      this.log('filepath must be specified with flag "-p"');
      return;
    }
    if (!flags.type) {
      this.log('model type must be specified with flag "-t"');
      return;
    }
    this.log(`importing data of type ${flags.type.toLowerCase()} from ${flags.name}`);
    const count = await importRecord(flags.type, flags.name);
    if (count > 0) { this.log(`import successful: ${count} entities`); } else { this.log('import failed'); }
  }
}

export = Import;
