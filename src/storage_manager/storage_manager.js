const Joi = require('joi');
const uuid = require('uuid');

const { storageManager: schema } = require('./schema');
const Memory = require('./memory');
const log = require('../log');

const from = 'storage_manager';

class StorageManager {
  constructor(settings) {
    const { error, value } = Joi.validate(settings, schema);
    if (error) throw error;

    // settings
    this._defaultStorageType = value.defaultStorageType;
    this._logEnabled = value.logEnabled;

    // state
    this._id = uuid.v1();

    // implementation
    this._storages = {};
  }

  getSettings() {
    return {
      defaultStorageType: this._defaultStorageType,
      logEnabled: this._logEnabled
    };
  }

  setSettings(settings) {
    const { error, value } = Joi.validate(settings, schema);
    if (error) throw error;

    this._defaultStorageType = value.defaultStorageType;
    this._logEnabled = value.logEnabled;
  }

  getState() {
    return {
      id: this._id
    };
  }

  add(storageName, storageType = this._defaultStorageType, storageDef) {
    if (typeof storageName === 'undefined') throw new Error('storageName must be defined');

    if (storageType === 'memory') {
      this._log({
        message: `Added storage '${storageName}' of type '${storageType}'`,
        storageName,
        storageType,
        storageDef
      });
      this._storages[storageName] = new Memory(storageDef);
    }
  }

  get(storageName) {
    return this._storages[storageName];
  }

  rm(storageName) {
    if (typeof storageName === 'undefined') throw new Error('storageName must be defined');

    this._log({
      message: `Removed storage '${storageName}'`,
      storageName
    });

    delete this._storages[storageName];
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

module.exports = StorageManager;
