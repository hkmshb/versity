import { AbstractRepository, FindOneOptions, ObjectID, Repository } from 'typeorm';


export abstract class EntityService<T> extends AbstractRepository<T> {
  /**
   * Create and persist data for an entity.
   */
  abstract createAndSave(values: Partial<T>): Promise<T>;
  /**
   * Updates an existing entity.
   */
  abstract updateAndSave(values: Partial<T>): Promise<T>;
  /**
   * Finds first entity that matches given id and otions
   */
  abstract findOne(ident?: string | number | Date | ObjectID, options?: FindOneOptions<T>): Promise<T>;
  /**
   * Returns the ORM repository for an entity.
   */
  abstract getRepository(): Repository<T>;
}
