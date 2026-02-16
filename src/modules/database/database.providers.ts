import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { User } from './entities/user';

export const databaseProviders = [
  {
    provide: 'DATABASE_SOURCE',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const logger = new Logger('DatabaseProvider');
      const dataSource = new DataSource({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User],
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      });

      try {
        await dataSource.initialize();
        logger.log('Database connected successfully');
        return dataSource;
      } catch (error) {
        logger.error('Database connection failed', error.stack);
        throw error;
      }
    },
  },
];
