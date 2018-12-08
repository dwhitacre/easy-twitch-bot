const Joi = require('joi');
const uuid = require('uuid');
const uniqid = require('uniqid');
const es = require('elasticsearch');

const { elasticsearch: schema } = require('./schema');
const log = require('../log');

const from = 'storage_elasticsearch';

class Elasticsearch {
  constructor(options) {
    const { error, value } = Joi.validate(options, schema);
    if (error) throw error;

    this._index = value.index;
    this._type = '_doc';
    this._readAlias = this._index;
    this._writeAlias = `${this._index}-w`;
    this._host = value.host;
    this._apiVersion = value.apiVersion;
    this._rollover = {
      max_age: value.rolloverMaxAge,
      max_docs: value.rolloverMaxDocs,
      max_size: value.rolloverMaxSize
    };
    this._additionalMappings = value.additionalMappings;
    this._logEnabled = value.logEnabled;

    this._id = uuid.v1();

    this._client = new es.Client({
      host: this._host,
      apiVersion: this._apiVersion
    });
  }

  async init() {
    const indexTemplateExists = await this._client.indices.existsTemplate({
      name: `${this._readAlias}`
    });

    if (indexTemplateExists) {
      this._log({
        message: `Index template already exists for ${this._readAlias}. Using this..`
      });
    } else {
      this._log({
        message: `No index template matching ${this._readAlias} exists. Creating..`
      });

      const aliases = {};
      aliases[this._readAlias] = {};

      await this._client.indices.putTemplate({
        name: this._readAlias,
        body: {
          index_patterns: [`.${this._index}*`],
          settings: {
            number_of_shards: 5
          },
          aliases,
          mappings: {
            ...this._additionalMappings
          }
        }
      });

      this._log({
        message: `Index template, ${this._readAlias}, created for indices matching: .${this._index}*`
      });
    }

    const writeAliasExists = await this._client.indices.existsAlias({
      name: `${this._writeAlias}`
    });

    if (writeAliasExists) {
      this._log({
        message: `Write alias already exists for ${this._writeAlias}. Using this..`
      });
    } else {
      this._log({
        message: `No alias matching ${this._writeAlias} exists. Creating..`
      });

      const aliases = {};
      aliases[this._writeAlias] = {};

      await this._client.indices.create({
        index: `.${this._index}-000001`,
        body: {
          aliases
        }
      });

      this._log({
        message: `Write alias, ${this._writeAlias}, created for index: .${this._index}-000001`
      });
    }

    return true;
  }

  async destroy() {
    await this._client.indices.delete({
      index: `.${this._index}*`,
      allowNoIndices: true
    });

    this._log({
      message: `Deleted all indices matching: .${this._index}*`
    });

    await this._client.indices.deleteTemplate({
      name: this._readAlias
    });

    this._log({
      message: `Deleted index template: ${this._readAlias}`
    });

    return true;
  }

  async add(itemId, item) {
    if (typeof itemId === 'undefined') itemId = uniqid();

    const has = await this.has(itemId);
    if (has) await this.rm(itemId);

    const rollover = await this._client.indices.rollover({
      alias: this._writeAlias,
      body: {
        conditions: {
          ...this._rollover
        }
      }
    });

    if (rollover.rolled_over) {
      this._log({
        message: `Rolled over write alias: ${this._writeAlias}`
      });
    }

    const itemAdded = await this._client.create({
      index: this._writeAlias,
      type: this._type,
      id: itemId,
      body: item
    });

    this._log({
      message: `added item ${itemId} to elasticsearch store`
    });

    return itemId;
  }

  async has(itemId) {
    const item = await this.get(itemId);
    return !!item;
  }

  async get(itemId) {
    let rawGet;
    try {
      rawGet = await this._client.get({
        index: this._readAlias,
        type: this._type,
        id: itemId
      });
    } catch (e) {
      rawGet = {
        _source: undefined
      };
    }
    return rawGet._source;
  }

  async rm(itemId) {
    const has = await this.has(itemId);
    if (!has) return undefined;

    const deleted = await this._client.delete({
      index: this._readAlias,
      type: this._type,
      id: itemId
    });

    if (deleted.result === 'deleted') {
      this._log({
        message: `removed item ${itemId} from elasticsearch store`
      });
      return itemId;
    } else {
      this._log({
        message: `failed to delete item ${itemId} from elasticsearch store`
      });
      return undefined;
    }
  }

  async edit(itemId, item) {
    const has = await this.has(itemId);
    if (!has) return undefined;

    const updated = await this._client.update({
      index: this._readAlias,
      type: this._type,
      id: itemId,
      body: {
        doc: {
          ...item
        }
      }
    });

    if (updated.result === 'updated') {
      this._log({
        message: `updated item ${itemId} in elasticsearch store`
      });
    } else {
      this._log({
        message: `nothing to update for ${itemId} in elasticsearch store`
      });
    }

    return itemId;
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

module.exports = Elasticsearch;