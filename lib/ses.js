// node-ses
'use strict';

var email = require('./email')
  , DEFAULT_API_HOST = 'https://email.us-east-1.amazonaws.com';


/**
 * SESClient
 *
 * `options` is an object with these properties:
 *
 *    key - your AWS SES key
 *    secret - your AWS SES secret
 *    amazon - [optional] the amazon end-point uri. defaults to amazon `https://email.us-east-1.amazonaws.com`
 *
 * Example:
 *
 *     var client = new SESClient({ key: 'key', secret: 'secret' });
 *     client.sendemail({
 *        to: 'aaron.heckmann+github@gmail.com'
 *      , from: 'somewhereOverTheR@inbow.com'
 *      , cc: 'theWickedWitch@nerds.net'
 *      , bcc: ['canAlsoBe@nArray.com', 'forrealz@.org']
 *      , subject: 'greetings'
 *      , message: 'your message goes here'
 *      , altText: 'mmm hmm'
 *    }, function (err) {
 *      // ...
 *    });
 *
 * @param {Object} options
 */
function SESClient (options) {
  options = options || {};
  this.key = options.key;
  this.secret = options.secret;
  this.amazon = options.amazon || exports.amazon;
}

/**
 * Send an email
 *
 * @param options
 * @returns {Promise<string>}
 */
SESClient.prototype.asyncSendEmail = async function (options) {
  options.key = options.key || this.key;
  options.secret = options.secret || this.secret;
  options.amazon = options.amazon || this.amazon;
  options.action = email.actions.SendEmail;

  const message = new email.Email(options);
  const response = await message.asyncSend();
  return response;
};


/**
 * Send an email (raw)
 *
 * @param options
 * @returns {Promise<string>}
 */
SESClient.prototype.asyncSendRawEmail = async function (options) {
  options.key = options.key || this.key;
  options.secret = options.secret || this.secret;
  options.amazon = options.amazon || this.amazon;
  options.action = email.actions.SendRawEmail;

  const message = new email.Email(options);
  const response = await message.asyncSend();
  return response;
};

/**
 * Exports
 **/
exports.createClient = function createClient (options) {
  return new SESClient(options);
};

exports.Email = email.Email;
exports.amazon = DEFAULT_API_HOST;
exports.version = require('../package.json').version;
