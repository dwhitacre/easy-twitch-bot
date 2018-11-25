const Joi = require('joi');

const defaultStorage = Joi.string().alphanum().max(500).default('memory');
const logEnabled = Joi.boolean().default(true);

const storageManager = Joi.object().keys({
  defaultStorage,
  logEnabled
}).default();

const memory = Joi.object().keys({
  logEnabled
}).default();

module.exports = {
  storageManager,
  memory
};