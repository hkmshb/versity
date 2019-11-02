import {Command, flags} from '@oclif/command';

class Import extends Command {
  static description = 'import data records from .csv files into database';

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'filename'}),
    // flag with a value (-t, --type=VALUE)
    type: flags.string({char: 't', description: 'type of data to import'})
  };

  static args = [{name: 'file'}];

  static usage = 'import -t departments|academicSections|academicPeriods -n [filename]';

  async run() {
    // tslint:disable:no-shadowed-variable
    const {args, flags} = this.parse(Import);
    if (!flags.name) {
      this.log('filename must be specified with flag "-n"');
      return;
    }
    if (!flags.type) {
      this.log('model type must be specified with flag "-t"');
      return;
    }
    this.log(`import data of type ${flags.type} from ${flags.name}`);
  }
}

export = Import;
