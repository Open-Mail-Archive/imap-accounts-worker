import {RabbitMqHelper} from '@open-mail-archive/rabbitmq-helper';
import {ImapAccountQueue} from '@open-mail-archive/types';
import {consume} from './lib/consume';

await RabbitMqHelper.init();
await RabbitMqHelper.consume(ImapAccountQueue, consume);
