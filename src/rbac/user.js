const Joi = require('joi');
const uniqid = require('uniqid');

const { user: schema } = require('./schema');

class User {
  constructor(options) {
    const { error, value } = Joi.validate(options, schema);
    if (error) throw error;

    this._name = value.name;
    this._roles = value.roles;
    this._token = uniqid();
  }

  get name() {
    return this._name;
  }

  get roles() {
    return this._roles;
  }

  get token() {
    return this._token;
  }
}

module.exports = User;