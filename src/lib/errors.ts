/** Custom error type. Self-explanatory. */
export class InvalidMessageError extends Error {
  /** Create a new error object. */
  constructor() {
    super('The received message from the rabbit mq payload was empty!');
  }
}
