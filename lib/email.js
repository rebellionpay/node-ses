'use strict';

const aws4 = require('aws4');
const debug = require('debug')('node-ses');
const parse = require('url').parse;
const querystring = require('querystring');
const got = require('got');

const SEND_EMAIL_ACTION = 'SendEmail';
const SEND_RAW_EMAIL_ACTION = 'SendRawEmail';

/**                                                                        
 * Email constructor.
 *
 * @param {Object} options
 **/
function Email (options) {
  this.action = options.action || SEND_EMAIL_ACTION;
  this.key = options.key;
  this.secret = options.secret;
  this.amazon = options.amazon;
  this.from = options.from;
  this.subject = options.subject;
  this.message = options.message;
  this.altText = options.altText;
  this.rawMessage = options.rawMessage;
  this.configurationSet = options.configurationSet;
  this.messageTags = options.messageTags;
  this.extractRecipient(options, 'to');
  this.extractRecipient(options, 'cc');
  this.extractRecipient(options, 'bcc');
  this.extractRecipient(options, 'replyTo');
}


/**
 * Adds to, cc, and bcc fields to `data`.
 *
 * @param {Object} data
 * @return data
 **/
Email.prototype.addDestination = function (data) {
  this.to.forEach(function (to, i) {
    data['Destination.ToAddresses.member.' + (i + 1)] = to;
  });

  this.cc.forEach(function (to, i) {
    data['Destination.CcAddresses.member.' + (i + 1)] = to;
  });

  this.bcc.forEach(function (to, i) {
    data['Destination.BccAddresses.member.' + (i + 1)] = to;
  });

  return data;
};

/**
 * Adds ConfigurationSetName and Tags to `data`
 *
 * @param {Object} data
 * @return data
 **/
Email.prototype.addSESHeaders = function (data) {
  if (this.configurationSet) {
    data['ConfigurationSetName'] = this.configurationSet;
  }
  if (this.messageTags) {
    this.messageTags.forEach(function (tagSpec, i) {
      data['Tags.member.' + (i + 1) + '.Name'] = tagSpec.name;
      data['Tags.member.' + (i + 1) + '.Value'] = tagSpec.value;
    });
  }
  return data;
};

/**
 * Adds subject, alt text, and message body to `data`.
 *
 * @param {Object} data
 * @return data
 **/
Email.prototype.addMessage = function (data) {
  if (this.subject) {
    data['Message.Subject.Data'] = this.subject;
    data['Message.Subject.Charset'] = 'UTF-8';
  }

  if (this.message) {
    data['Message.Body.Html.Data'] = this.message;
    data['Message.Body.Html.Charset'] = 'UTF-8';
  }

  if (this.altText) {
    data['Message.Body.Text.Data'] = this.altText;
    data['Message.Body.Text.Charset'] = 'UTF-8';
  }

  return data;
};


/**
 * Adds the list of ReplyTos to `data`.
 *
 * @param {Object} data
 * @return data
 **/
Email.prototype.addReplyTo = function (data) {
  this.replyTo.forEach(function(to, i) {
    data['ReplyToAddresses.member.' + (i + 1)] = to;
  });

  return data;
};


/**
 * Prepares param object for the AWS request.
 *
 * @return {Object}
 */
Email.prototype.data = function () {
  var data = {
      Action: this.action
    , AWSAccessKeyId: this.key
    , Source: this.from
  };

  // recipients and reply tos
  data = this.addDestination(data);
  data = this.addReplyTo(data);

  // SES Event Publishing Information
  data = this.addSESHeaders(data);

  // message payload
  if (this.action === SEND_EMAIL_ACTION) {
    data = this.addMessage(data);
  } else if (this.action === SEND_RAW_EMAIL_ACTION) {
    data['RawMessage.Data'] = Buffer.from(this.rawMessage).toString('base64');
  }

  return data;
};


/**
 * Extracts recipients from options.
 *
 * @param {String} prop - either to,cc,bcc,replyTo
 * @param {Object} options
 */
Email.prototype.extractRecipient = function (options, prop) {
  if (options[prop]) {
    this[prop] = Array.isArray(options[prop]) ? options[prop] : [options[prop]];
  } else {
    this[prop] = [];
  }
};


/**
 * Creates required AWS headers.
 *
 * No additional custom headers by default.
 *
 * @return Object
 **/
Email.prototype.headers = function () {
  var headers = {};
  return headers;
};

/**
 * Sends the email
 *
 * @returns {Promise<string>}
 */
Email.prototype.asyncSend = async function asyncSend () {
  const invalid = this.validate();

  if (invalid) {
    throw new Error(invalid);
  }

  // Prepare the data and send to it AWS SES REST API

  const data = querystring.stringify(this.data());
  const parsedUrl = parse(this.amazon);
  const headers = this.headers();

  const options = {
    url: this.amazon
    , host: parsedUrl.hostname
    , headers: headers
    , body: data
    , service: 'ses'
  };

  const credentials = this.key && this.secret && {
    accessKeyId: this.key,
    secretAccessKey: this.secret
  };
  const signedOpts = aws4.sign(options, credentials);

  debug('posting: %j', signedOpts);

  try {
    const response = await got.post(signedOpts);

    if (response.statusCode < 200 || response.statusCode >= 400) {
      const theError = new Error(`Request error with statusCode: ${response.statusCode}`);
      theError.response = response;
      throw theError;
    } else {
      return response.body;
    }

  } catch (error) {
    debug('error: %j', error);
    console.log('COJONES');
    console.log(typeof error);
    console.log(error.message);
    throw error;
  }
};


/**
 * Validates the input.
 *
 * @returns {String|Undefined}
 **/
Email.prototype.validate = function () {
  if (this.action === SEND_EMAIL_ACTION) {
    if (!this.to.length && !this.cc.length && !this.bcc.length) {
      return 'To, Cc or Bcc is required';
    }

    if (!(this.subject && this.subject.length)) {
      return 'Subject is required';
    }
  }

  if (this.action === SEND_RAW_EMAIL_ACTION) {
    if (!(this.rawMessage && this.rawMessage.length)) {
      return 'Raw message is required';
    }
  }

  // all actions require the following
  if (!(this.from && this.from.length)) {
    return 'From is required';
  }
};

/**
 * Exports
 **/
exports.Email = Email;

exports.actions = {
  SendEmail : SEND_EMAIL_ACTION,
  SendRawEmail : SEND_RAW_EMAIL_ACTION
};
