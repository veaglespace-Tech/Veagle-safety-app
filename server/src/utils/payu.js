import crypto from 'crypto';
import { config } from '../config/index.js';

/**
 * Generate SHA512 hash for initiating PayU transaction.
 * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
 */
export function generatePayUHash({ txnid, amount, productinfo, firstname, email, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '' }) {
  const key = config.payu.key;
  const salt = config.payu.salt;

  const formattedAmount = parseFloat(amount).toFixed(2);
  const hashSequence = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;

  return crypto.createHash('sha512').update(hashSequence).digest('hex');
}

/**
 * Verify reverse SHA512 hash received in PayU payment response callback.
 * Formula: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUResponseHash(responseBody) {
  const {
    status,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    hash: receivedHash,
  } = responseBody;

  const key = config.payu.key;
  const salt = config.payu.salt;

  const formattedAmount = parseFloat(amount).toFixed(2);
  const hashSequence = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${formattedAmount}|${txnid}|${key}`;

  const calculatedHash = crypto.createHash('sha512').update(hashSequence).digest('hex');

  return {
    isValid: calculatedHash.toLowerCase() === (receivedHash || '').toLowerCase(),
    calculatedHash,
    receivedHash,
  };
}
