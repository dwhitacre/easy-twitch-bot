const TwitchClient = require('./src/twitch_client/twitch_client');
const HapiServer = require('./src/hapi_server/hapi_server');
const Rules = require('./src/rules/rules');
const RBAC = require('./src/rbac/rbac');
const StorageManager = require('./src/storage_manager/storage_manager');

class EasyTwitchBot {
  constructor({ twitchClient, hapiServer, rbac, storageManager }) {
    this._twitchClient = new TwitchClient(twitchClient, this);
    this._hapiServer = new HapiServer(hapiServer, this);
    this._rules = new Rules();
    this._rbac = new RBAC(rbac);
    this._storageManager = new StorageManager(storageManager);
  }

  getSettings() {
    return {
      twitchClient: this._twitchClient.getSettings(),
      hapiServer: this._hapiServer.getSettings()
    };
  }

  setSettings({ twitchClient, hapiServer }) {
    this._twitchClient.setSettings(twitchClient);
    this._hapiServer.setSettings(hapiServer);
  }

  getState() {
    return {
      twitchClient: this._twitchClient.getState(),
      hapiServer: this._hapiServer.getState()
    };
  }

  init() {
    this._twitchClient.init();
    this._hapiServer.init();
  }

  async start() {
    await this._hapiServer.start();
    await this._twitchClient.start();
  }

  async stop() {
    await this._twitchClient.stop();
    await this._hapiServer.stop();
  }

  get twitchClient() {
    return this._twitchClient;
  }

  get hapiServer() {
    return this._hapiServer;
  }

  get rbac() {
    return this._rbac;
  }

  get storageManager() {
    return this._storageManager;
  }

  addRule(ruleDef) {
    const addedRules = this._rules.add(ruleDef);

    if (!addedRules) return;
    if (addedRules.length <= 0) return [];

    const nonAlias = addedRules.find(rule => {
      return !rule.isAlias;
    });
    const nonAliasSimpleDef = {
      name: nonAlias.name,
      enabled: nonAlias.enabled,
      args: nonAlias.args,
      flags: nonAlias.flags,
      handler: nonAlias.handler
    };

    addedRules.forEach(rule => {
      const comRouteDef = {
        ...nonAliasSimpleDef,
        ...{
          name: rule.name
        }
      };
      this._hapiServer.addRoute(comRouteDef);
      this._twitchClient.addCommand(comRouteDef);
    });

    return addedRules;
  }

  getRule(ruleName) {
    return this._rules.get(ruleName);
  }

  rmRule(ruleName) {
    const removedRules = this._rules.rm(ruleName);
    
    if (!removedRules) return;
    if (removedRules.length <= 0) return [];

    removedRules.forEach(rule => {
      const {
        name,
      } = rule.getDef();
      this._hapiServer.rmRoute(name);
      this._twitchClient.rmCommand(name);
    });

    return removedRules;
  }

  editRule(ruleDef) {
    const editedRule = this._rules.edit(ruleDef);

    if (!editedRule) return;

    const {
      name,
      enabled,
      args,
      flags,
      handler,
      aliases
    } = editedRule.getDef();
    const comRouteDef = {
      name,
      enabled,
      args,
      flags,
      handler
    };
    this._hapiServer.editRoute(comRouteDef);
    this._twitchClient.editCommand(comRouteDef);
    aliases.forEach(alias => {
      this._hapiServer.editRoute({
        ...comRouteDef,
        ...{ name: alias }
      });
      this._twitchClient.editCommand({
        ...comRouteDef,
        ...{ name: alias }
      })
    });

    return editedRule;
  }

  clearRule() {
    this._rules.clear();
    this._twitchClient.clearCommand();
    this._hapiServer.clearRoute();
  }

}

module.exports = EasyTwitchBot;