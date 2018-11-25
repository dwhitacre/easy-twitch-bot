const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const getSettingsTwitchSpy = sinon.stub().returns({});
const setSettingsTwitchSpy = sinon.spy();
const getStateTwitchSpy = sinon.stub().returns({});
const initTwitchSpy = sinon.spy();
const startTwitchSpy = sinon.spy();
const stopTwitchSpy = sinon.spy();

class twitchClientStub {
  constructor() {
    this.getSettings = getSettingsTwitchSpy;
    this.setSettings = setSettingsTwitchSpy;
    this.getState = getStateTwitchSpy;
    this.init = initTwitchSpy;
    this.start = startTwitchSpy;
    this.stop = stopTwitchSpy;
  }
};

const getSettingsHapiSpy = sinon.stub().returns({});
const setSettingsHapiSpy = sinon.spy();
const getStateHapiSpy = sinon.stub().returns({});
const initHapiSpy = sinon.spy();
const startHapiSpy = sinon.spy();
const stopHapiSpy = sinon.spy();

class hapiServerStub {
  constructor() {
    this.getSettings = getSettingsHapiSpy;
    this.setSettings = setSettingsHapiSpy;
    this.getState = getStateHapiSpy;
    this.init = initHapiSpy;
    this.start = startHapiSpy;
    this.stop = stopHapiSpy;
  }
};

const addRulesSpy = sinon.stub().returns([]);
const getRulesSpy = sinon.stub().returns({});
const rmRulesSpy = sinon.spy();
const editRulesSpy = sinon.spy();
const clearRulesSpy = sinon.spy();

class rulesStub {
  constructor() {
    this.add = addRulesSpy;
    this.get = getRulesSpy;
    this.rm = rmRulesSpy;
    this.edit = editRulesSpy;
    this.clear = clearRulesSpy;
  }
};

const BotReal = require('../easy_twitch_bot');
const Bot = proxyquire('../easy_twitch_bot', {
  './src/twitch_client/twitch_client': twitchClientStub,
  './src/hapi_server/hapi_server': hapiServerStub,
  './src/rules/rules': rulesStub
});

describe('easy_twitch_bot', () => {
  beforeEach(() => {
    getSettingsTwitchSpy.resetHistory();
    setSettingsTwitchSpy.resetHistory();
    getStateTwitchSpy.resetHistory();
    initTwitchSpy.resetHistory();
    startTwitchSpy.resetHistory();
    stopTwitchSpy.resetHistory();

    getSettingsHapiSpy.resetHistory();
    setSettingsHapiSpy.resetHistory();
    getStateHapiSpy.resetHistory();
    initHapiSpy.resetHistory();
    startHapiSpy.resetHistory();
    stopHapiSpy.resetHistory();

    addRulesSpy.resetHistory();
    getRulesSpy.resetHistory();
    rmRulesSpy.resetHistory();
    editRulesSpy.resetHistory();
    clearRulesSpy.resetHistory();
  });
  describe('.constructor', () => {
    it('should create the twitchClient and hapiServer', () => {
      const bot = new BotReal({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      expect(bot.twitchClient).to.be.an.instanceOf(Object);
      expect(bot.hapiServer).to.be.an.instanceOf(Object);
      expect(bot._rules).to.be.an.instanceOf(Object);
    });
  });
  describe('.getSettings', () => {
    it('should get the settings', () => {
      const settings = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      }).getSettings();
      expect(settings.twitchClient).to.exist;
      expect(settings.hapiServer).to.exist;
      expect(getSettingsTwitchSpy.calledOnce).to.be.true;
      expect(getSettingsHapiSpy.calledOnce).to.be.true;
    });
  });
  describe('.setSettings', () => {
    it('should set the settings', () => {
      const bot = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      bot.setSettings({
        twitchClient: {
          username: 'a',
          token: 'b'
        },
        hapiServer: {
          port: 7000
        }
      });
      expect(setSettingsTwitchSpy.calledOnce).to.be.true;
      expect(setSettingsHapiSpy.calledOnce).to.be.true;
    });
  });
  describe('.getState', () => {
    it('should get the state', () => {
      const state = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      }).getState();
      expect(state.twitchClient).to.exist;
      expect(state.hapiServer).to.exist;
      expect(getStateTwitchSpy.calledOnce).to.be.true;
      expect(getStateHapiSpy.calledOnce).to.be.true;
    });
  });
  describe('.init', () => {
    it('should init both twitchClient and hapiServer', () => {
      const bot = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      bot.init();
      expect(initTwitchSpy.calledOnce).to.be.true;
      expect(initHapiSpy.calledOnce).to.be.true;
    });
  });
  describe('.start', () => {
    it('should start both twitchClient and hapiServer', async () => {
      const bot = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      await bot.start();
      expect(startTwitchSpy.calledOnce).to.be.true;
      expect(startHapiSpy.calledOnce).to.be.true;
    });
  });
  describe('.stop', () => {
    it('should stop both twitchClient and hapiServer', async () => {
      const bot = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      await bot.stop();
      expect(stopTwitchSpy.calledOnce).to.be.true;
      expect(stopHapiSpy.calledOnce).to.be.true;
    });
  });
  describe('.addRule', () => {
    it('should add rule to Rules', () => {
      const bot = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      bot.addRule({
        name: 'test',
        handler: async () => {}
      });
      expect(addRulesSpy.calledOnce);
    });
  });
  describe('.getRule', () => {
    it('should get rule from Rules', () => {
      const bot = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      const returned = bot.getRule('test');
      expect(getRulesSpy.calledOnce);
      expect(returned).to.deep.equal({});
    });
  });
  describe('.rmRule', () => {
    it('should remove rule from Rules', () => {
      const bot = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      bot.rmRule('test');
      expect(rmRulesSpy.calledOnce);
    });
  });
  describe('.editRule', () => {
    it('should edit rule from Rules', () => {
      const bot = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      bot.editRule({
        name: 'test',
        handler: async () => {}
      });
      expect(editRulesSpy.calledOnce);
    });
  });
  describe('.clearRule', () => {
    it('should clear all rules in Rules', () => {
      const bot = new Bot({
        twitchClient: {
          username: 'username',
          token: 'token'
        },
        hapiServer: {}
      });
      bot.clearRule();
      expect(clearRulesSpy.calledOnce);
    })
  });
});