const Joi = require('joi');
const uuid = require('uuid');
const uniqid = require('uniqid');

const { memory: schema } = require('./schema');
const log = require('../log');

const from = 'storage_memory';

class Memory {
  constructor(options) {
    const { error, value } = Joi.validate(options, schema);
    if (error) throw error;

    this._logEnabled = value.logEnabled;

    this._memory;
  }

  async init() {
    this._memory = {};

    this._log({
      message: 'memory store initialized'
    });

    return true;
  }

  async destroy() {
    this._memory = undefined;

    this._log({
      message: 'memory store destroyed'
    });

    return true;
  }

  async add(itemId, item) {
    if (typeof itemId === 'undefined') itemId = uniqid();
    this._memory[itemId] = item;

    this._log({
      message: `added item ${itemId} to memory store`
    });

    return itemId;
  }

  async has(itemId) {
    const item = await this.get(itemId);
    return typeof item !== 'undefined';
  }

  async get(itemId) {
    return this._memory[itemId];
  }

  async rm(itemId) {
    delete this._memory[itemId];

    this._log({
      message: `removed item ${itemId} from memory store`
    });

    return itemId;
  }

  async edit(itemId, item) {
    const has = await this.has(itemId);
    if (!has) return false;
    return this.add(itemId, item);
  }

  _log(message) {
    message = {
      id: this._id,
      from,
      type: 'internal',
      ...message
    };
    log(message, this._logEnabled);
  }
}

module.exports = Memory;