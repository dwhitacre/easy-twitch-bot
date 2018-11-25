const Tmi = require('tmi.js');
const Joi = require('joi');
const uuid = require('uuid');

const { client: schema } = require('./schema');
const Command = require('./command');
const onConnectedHandler = require('./on_connected_handler');
const onDisconnectedHandler = require('./on_disconnected_handler');
const onMessageHandler = require('./on_message_handler');
const log = require('../log');

const from = 'twitch_client';

class TwitchClient {
  constructor(settings, parent) {
    const { error, value } = Joi.validate(settings, schema);
    if (error) throw error;

    // settings
    this._username = value.username;
    this._token = value.token;
    this._channels = value.channels;
    this._commandPrefix = value.commandPrefix;
    this._channelPrefix = value.channelPrefix;
    this._logEnabled = value.logEnabled;

    // state
    this._dirty = true;
    this._running = false;
    this._id = uuid.v1();

    // implementation
    this._client;
    this._commands = [];

    this._parent = parent;
  }

  getSettings() {
    return {
      username: this._username,
      token: this._token,
      channels: this._channels,
      commandPrefix: this._commandPrefix,
      channelPrefix: this._channelPrefix,
      logEnabled: this._logEnabled
    };
  }

  setSettings(settings) {
    if (this._running) throw new Error('Cannot set client settings whilst it is running');

    const { error, value } = Joi.validate(settings, schema);
    if (error) throw error;

    this._username = value.username;
    this._token = value.token;
    this._channels = value.channels;
    this._commandPrefix = value.commandPrefix;
    this._channelPrefix = value.channelPrefix;
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
    if (this._running) throw new Error('Cannot init client whilst it is running');

    this._client = Tmi.client({
      identity: {
        username: this._username,
        password: this._token
      },
      channels: this._channels,
      connection: {
        reconnect: true
      }
    });

    this._client.on('connected', onConnectedHandler.bind(this));
    this._client.on('disconnected', onDisconnectedHandler.bind(this));
    this._client.on('message', onMessageHandler.bind(this));

    this._dirty = false;
  }

  async start() {
    if (this._running) return;
    if (this._dirty) throw new Error('Cannot start client if its dirty - run init');

    this._running = true;
    
    await this._client.connect();

    this._log({
      message: `Client running...`
    });
  }

  async stop() {
    if (!this._running) return;

    await this._client.disconnect();

    this._running = false;

    this._log({
      message: `Stopped client.`
    });
  }

  addCommand(commandDef) {
    const command = new Command(commandDef);

    if (this.getCommand(command.name)) throw new Error(`Command ${command.name} already exists`);

    this._commands.push(command);
  }

  getCommand(commandName) {
    return this._commands.find(command => {
      return command.name === commandName;
    });
  }

  rmCommand(commandName) {
    const foundCommand = this.getCommand(commandName);
    if (!foundCommand) return;

    this._commands = this._commands.filter(command => {
      return command.name !== commandName;
    });
  }

  editCommand(commandDef) {
    const foundCommand = this.getCommand(commandDef.name);
    if (!foundCommand) throw new Error(`No command with ${commandDef.name} exists.`);

    const newDef = {
      ...foundCommand.getDef(),
      ...commandDef
    };

    const command = new Command(newDef);
    this.rmCommand(command.name);
    this.addCommand(command.getDef());
  }

  clearCommand() {
    this._commands = [];
  }

  async say(target, type, message) {
    if (type === 'chat') {
      return await this.chat(target, message);
    } else if (type === 'whisper') {
      return await this.whisper(target, message);
    } else {
      this._log({
        message: `unrecognized message type: target: ${target}, type: ${type}, message: ${message}`
      });
      return false;
    }
  }

  async chat(target, message) {
    if (!this._running) return false;
    await this._client.say(target, message);
    return true;
  }

  async whisper(target, message) {
    if (!this._running) return false;
    await this._client.whisper(target, message);
    return true;
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

module.exports = TwitchClient;