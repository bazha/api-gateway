import { DataSource } from 'typeorm';
import { User } from '../database/entities/user';

export const usersProviders = [
  {
    provide: 'USERS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: ['DATABASE_SOURCE'],
  },
];
