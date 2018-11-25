const Joi = require('joi');

const { rule: schema } = require('./schema');

class Rule {
  constructor(options) {
    const { error, value } = Joi.validate(options, schema);
    if (error) throw error;

    this._name = value.name;
    this._aliases = value.aliases;
    this._enabled = value.enabled;
    this._args = value.args;
    this._flags = value.flags;
    this._handler = value.handler;
    this._isAlias = value.isAlias;
    this._aliasTo = value.aliasTo;
  }

  getDef() {
    return {
      name: this._name,
      aliases: this._aliases,
      enabled: this._enabled,
      args: this._args,
      flags: this._flags,
      handler: this._handler,
      isAlias: this._isAlias,
      aliasTo: this._aliasTo
    };
  }

  get name() {
    return this._name;
  }

  get flags() {
    return this._flags;
  }

  get args() {
    return this._args;
  }

  get enabled() {
    return this._enabled;
  }

  get aliases() {
    return this._aliases;
  }

  removeAlias(name) {
    this._aliases = this._aliases.filter(alias => {
      return alias !== name;
    });
  }

  get handler() {
    return this._handler;
  }

  get isAlias() {
    return this._isAlias;
  }

  get aliasTo() {
    return this._aliasTo;
  }
}

module.exports = Rule;