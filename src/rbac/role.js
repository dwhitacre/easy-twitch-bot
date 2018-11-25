const Joi = require('joi');

const { role: schema } = require('./schema');

class Role {
  constructor(options) {
    const { error, value } = Joi.validate(options, schema);
    if (error) throw error;

    this._can = value.can;
    this._inherits = value.inherits;
  }

  getDef() {
    return {
      can: this._can,
      inherits: this._inherits
    };
  }

  get can() {
    return this._can;
  }

  addCan(canName) {
    if (this._can.indexOf(canName) > -1) return;
    this._can.push(canName);
  }

  rmCan(canName) {
    const index = this._can.indexOf(canName);
    if (index < 0) return;
    this._can.splice(index, 1);
  }

  get inherits() {
    return this._inherits;
  }

  addInherits(inheritsName) {
    if (this._inherits.indexOf(inheritsName) > -1) return;
    this._inherits.push(inheritsName);
  }

  rmInherits(inheritsName) {
    const index = this._inherits.indexOf(inheritsName);
    if (index < 0) return;
    this._inherits.splice(index, 1);
  }
}

module.exports = Role;