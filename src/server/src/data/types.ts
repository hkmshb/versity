import { AbstractRepository, EntityManager , FindOneOptions, ObjectType, Repository} from 'typeorm';


export type EntityError<T> = {
  [P in keyof T]?: string | string[]
};


export abstract class EntityService<T, U extends Partial<T>> extends AbstractRepository<T> {
  // tslint:disable:array-type
  protected prevalidators: IValidator<T, U>[];
  protected validators: IValidator<T, U>[];

  constructor(manager: EntityManager) {
    super();
    this.manager = manager;
    this.prevalidators = [];
    this.validators = [];
  }

  /**
   * Create and persist data for an entity.
   */
  abstract createAndSave(values: U): Promise<T>;
  /**
   * Updates an existing entity.
   */
  abstract updateAndSave(values: U): Promise<T>;
  /**
   * Finds first entity that matches given id and otions
   */
  abstract findByIdent(ident?: string | number, options?: FindOneOptions<T>): Promise<T>;
  /**
   * Returns the ORM repository for an entity.
   */
  abstract getRepository(entity?: ObjectType<T>): Repository<T>;
}


export interface IValidator<T, U extends Partial<T>> {
  check(values: U, errors: EntityError<U>): Promise<U>;
}


export class ValidationError extends Error {
  constructor(public errors: string | {[key: string]: any}) {
    super();
    this.name = 'VersityValidationError';
  }
}
