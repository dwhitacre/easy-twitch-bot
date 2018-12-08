const Joi = require('joi');

const defaultStorageType = Joi.string().alphanum().max(500).default('memory');
const logEnabled = Joi.boolean().default(true);

const storageManager = Joi.object().keys({
  defaultStorageType,
  logEnabled
}).default();

const memory = Joi.object().keys({
  logEnabled
}).default();

const index = Joi.string().max(100).default('easy-twitch-bot');
const host = Joi.string().default('localhost:9200');
const apiVersion = Joi.string().default('6.4');
const rolloverMaxDocs = Joi.number().min(1).max(1000000000).default(1000000);
const rolloverMaxSize = Joi.string().default('5gb');
const rolloverMaxAge = Joi.string().default('7d');
const additionalMappings = Joi.object().default({});

const elasticsearch = Joi.object().keys({
  index,
  host,
  apiVersion,
  rolloverMaxAge,
  rolloverMaxSize,
  rolloverMaxDocs,
  additionalMappings,
  logEnabled
}).default();

module.exports = {
  storageManager,
  memory,
  elasticsearch
};