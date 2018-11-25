const Joi = require('joi');

const { route: schema } = require('./schema');

class Route {
  constructor(options) {
    const { error, value } = Joi.validate(options, schema);
    if (error) throw error;

    this._name = value.name;
    this._enabled = value.enabled;
    this._args = value.args;
    this._flags = value.flags;
    this._handler = value.handler;
  }

  getDef() {
    return {
      name: this._name,
      enabled: this._enabled,
      args: this._args,
      flags: this._flags,
      handler: this._handler
    };
  }

  get name() {
    return this._name;
  }

  get enabled() {
    return this._enabled;
  }

  get args() {
    return this._args;
  }

  get flags() {
    return this._flags;
  }

  get handler() {
    return this._handler;
  }
}

module.exports = Route;