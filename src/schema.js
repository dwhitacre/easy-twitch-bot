const Joi = require('joi');

const name = Joi.string().max(500).default('__INTERNAL_STORAGE__');
const type = Joi.string().alphanum().max(500);
const def = Joi.object().unknown().default({});

const internalStorage = Joi.object().keys({
  name,
  type,
  def
}).default();

module.exports = { internalStorage };