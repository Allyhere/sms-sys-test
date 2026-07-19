import { DataSource } from 'typeorm';
import { Conversation } from 'src/entities/conversation.entity';
import { Message } from 'src/entities/message.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'sms',
  password: process.env.POSTGRES_PASSWORD || 'smspassword',
  database: process.env.POSTGRES_DB || 'sms_system',
  entities: [Conversation, Message],
  migrations: ['src/migrations/**/*{.js,.ts}'],
  synchronize: false,
});
