import {Logger} from '@open-mail-archive/logger';
import {JobData} from '@open-mail-archive/rabbitmq-helper';
import {
  ImapAccountPayload,
  ImapAccount,
  ImapAccountQueue,
  Mailbox,
} from '@open-mail-archive/types';
import {Message} from 'amqplib';

import {InvalidMessageError} from './errors';

/**
 * Consumer function that parses the message received from the RabbitMQ queue and executes the
 * required job.
 * @param {Message | null} message the message received from RabbitMQ
 */
export async function consume(message: Message | null) {
  const payload = parse(message);
  const account = ImapAccount.fromPayload(payload.data);
  switch (payload.action) {
    case 'INSERT':
      return insertHandler(account);
    case 'DELETE':
      return;
    case 'UPDATE':
      return;
  }
}

/**
 * Extract the Job Data from the received message.
 * @param {Message | null} message the received message from the queue.
 * @return {JobData<ImapAccountPayload>} the parsed job data
 * @throws {InvalidMessageError} if the message is empty
 */
function parse(message: Message | null) {
  if (message === null) {
    Logger.Instance.error({
      trace: 'ImapAccountsWorker::consume::parse',
      message: `The RabbitMQ message in the ${ImapAccountQueue} queue was empty!`,
    });
    throw new InvalidMessageError();
  }
  Logger.Instance.info({
    trace: 'ImapAccountsWorker::consume::parse',
    message: `Parsing received message in the ${ImapAccountQueue} queue.`,
  });
  const payload: JobData<ImapAccountPayload> = JSON.parse(
    message.content.toString(),
  );
  Logger.Instance.debug({
    trace: 'ImapAccountsWorker::consume::parse',
    message: `Message parsed.`,
    data: payload,
  });

  return payload;
}

/**
 * Handler for the insert operation. Fetch all the mailboxes for the given imap account.
 * @param {ImapAccount} account the data from the message payload
 */
async function insertHandler(account: ImapAccount) {
  Logger.Instance.info({
    trace: 'ImapAccountsWorker::consume::insert',
    message: `Starting job: Mailboxes import for account ${account.username}.`,
  });
  const mailboxes = await account.getMailboxes();
  for (const mailbox of mailboxes) {
    await Mailbox.fromListResponse(mailbox, account.id).addToDatabase();
  }
  Logger.Instance.info({
    trace: 'ImapAccountsWorker::consume::insert',
    message: `Finished job: Mailboxes import for account ${account.username}.`,
  });
}
