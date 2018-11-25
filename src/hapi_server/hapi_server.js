const Hapi = require('hapi');
const Joi = require('joi');
const uuid = require('uuid');

const { server: schema } = require('./schema');
const Route = require('./route');
const handler = require('./handler');
const tokenHandler = require('./token_handler');
const log = require('../log');

const from = 'hapi_server';

class HapiServer {
  constructor(settings, parent) {
    const { error, value } = Joi.validate(settings, schema);
    if (error) throw error;

    // settings
    this._host = value.host;
    this._port = value.port;
    this._path = value.path;
    this._tokenPath = value.tokenPath;
    this._logEnabled = value.logEnabled;

    // state
    this._dirty = true;
    this._running = false;
    this._id = uuid.v1();

    // implementation
    this._server;
    this._routes = [];

    this._parent = parent;
  }

  getSettings() {
    return {
      host: this._host,
      port: this._port,
      path: this._path,
      tokenPath: this._tokenPath,
      logEnabled: this._logEnabled
    };
  }

  setSettings(settings) {
    if (this._running) throw new Error('Cannot set server settings whilst it is running');

    const { error, value } = Joi.validate(settings, schema);
    if (error) throw error;

    this._host = value.host;
    this._port = value.port;
    this._path = value.path;
    this._tokenPath = value.tokenPath;
    this._logEnabled = value.logEnabled;

    this._dirty = true;
  }

  getState() {
    return {
      running: this._running,
      dirty: this._dirty,
      id: this._id
    };
  }

  init() {
    if (!this._dirty) return;
    if (this._running) throw new Error('Cannot init server whilst it is running');

    this._server = Hapi.server({
      host: this._host,
      port: this._port
    });

    const self = this;
    this._server.route({
      method: 'POST',
      path: this._path,
      handler: async (request, h) => {
        return handler(request, h, self);
      },
      options: {
        validate: {
          payload: Joi.object().keys({
            name: Joi.string().alphanum().max(500).required()
          }).unknown().default()
        }
      }
    });

    this._server.route({
      method: 'GET',
      path: this._tokenPath,
      handler: async(request, h) => {
        return tokenHandler(request, h, self);
      },
      options: {
        validate: {
          query: Joi.object().keys({
            user: Joi.string().max(500).required()
          }).default()
        }
      }
    })

    this._dirty = false;
  }

  async start() {
    if (this._running) return;
    if (this._dirty) throw new Error('Cannot start server if its dirty - run init');

    this._running = true;
    await this._server.start();

    this._log({
      message: `Server running at ${this._server.info.uri}...`
    });
  }

  async stop() {
    if (!this._running) return;

    await this._server.stop();
    this._running = false;

    this._log({
      message: `Stopped server.`
    });
  }

  addRoute(routeDef) {
    const route = new Route(routeDef);

    if (this.getRoute(route.name)) throw new Error(`Route ${route.name} already exists`);

    this._routes.push(route);
  }

  getRoute(routeName) {
    return this._routes.find(route => {
      return route.name === routeName;
    });
  }

  rmRoute(routeName) {
    const foundRoute = this.getRoute(routeName);
    if (!foundRoute) return;

    this._routes = this._routes.filter(route => {
      return route.name !== routeName;
    });
  }

  editRoute(routeDef) {
    const foundRoute = this.getRoute(routeDef.name);
    if (!foundRoute) throw new Error(`No route with ${routeDef.name} exists.`);

    const newDef = {
      ...foundRoute.getDef(),
      ...routeDef
    };

    const route = new Route(newDef);
    this.rmRoute(route.name);
    this.addRoute(route.getDef());
  }

  clearRoute() {
    this._routes = [];
  }

  _log(message) {
    message = {
      id: this._id,
      from,
      type: 'internal',
      ...message,
    };
    log(message, this._logEnabled);
  }
}

module.exports = HapiServer;