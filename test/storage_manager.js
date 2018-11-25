const { expect } = require('chai');
const sinon = require('sinon');

const StorageManager = require('../src/storage_manager/storage_manager');
const Memory = require('../src/storage_manager/memory');

describe('storage_manager', () => {
  describe('.constructor', () => {
    it('should throw err if schema fails', () => {
      expect(() => new StorageManager({
        defaultStorage: 123
      })).to.throw();
    });
    it('should create a storage manager', () => {
      const sm = new StorageManager();
      expect(sm._defaultStorage).to.equal('memory');
      expect(sm._logEnabled).to.be.true;
      expect(sm._id).to.exist;
      expect(sm._storages).to.be.an.instanceof(Object);
    });
  });
  describe('.getSettings', () => {
    it('should get the settings', () => {
      const sm = new StorageManager();
      const settings = sm.getSettings();
      expect(settings.defaultStorage).to.equal('memory');
      expect(settings.logEnabled).to.be.true;
    });
  });
  describe('.setSettings', () => {
    let sm;
    beforeEach(() => {
      sm = new StorageManager({
        logEnabled: false
      });
    });
    it('should throw err if schema fails', () => {
      expect(() => sm.setSettings({
        logEnabled: 123
      })).to.throw();
    });
    it('should set the settings', () => {
      sm.setSettings({
        logEnabled: true
      });
      expect(sm._logEnabled).to.be.true;
    });
  });
  describe('.getState', () => {
    it('should get the state', () => {
      const sm = new StorageManager();
      const state = sm.getState();
      expect(state.id).to.exist;
    });
  });
  describe('.add', () => {
    let sm;
    beforeEach(() => {
      sm = new StorageManager({
        logEnabled: false
      });
    });
    it('should throw err if storageName is not defined', () => {
      expect(() => sm.add()).to.throw();
    });
    it('should create storage with default storage type if exists', () => {
      sm.add('storage');
      expect(sm._storages['storage']).to.exist;
      expect(sm._storages['storage']).to.be.an.instanceof(Memory);
    });
    it('should create storage with provided storage type', () => {
      sm.add('storage', 'memory');
      expect(sm._storages['storage']).to.exist;
      expect(sm._storages['storage']).to.be.an.instanceof(Memory);
    });
    it('should do nothing if default storage type dne', () => {
      sm._defaultStorage = 'nope';
      sm.add('storage');
      expect(sm._storages['storage']).to.be.undefined;
    });
    it('should do nothing if provided storage type dne', () => {
      sm.add('storage', 'nope');
      expect(sm._storages['storage']).to.be.undefined;
    });
    it('should be able to add memory storage', () => {
      sm.add('storage', 'memory', {});
      expect(sm._storages['storage']).to.exist;
      expect(sm._storages['storage']).to.be.an.instanceof(Memory);
    });
  });
  describe('.get', () => {
    let sm;
    beforeEach(() => {
      sm = new StorageManager({
        logEnabled: false
      });
    });
    it('should get the storage', () => {
      sm._storages['storage'] = new Memory();
      expect(sm.get('storage')).to.be.an.instanceof(Memory);
    });
    it('should ret undefined if storage dne', () => {
      expect(sm.get('storage')).to.be.undefined;
    });
  });
  describe('.rm', () => {
    let sm;
    beforeEach(() => {
      sm = new StorageManager({
        logEnabled: false
      });
    });
    it('should throw err if the storageName is not defined', () => {
      expect(() => sm.rm()).to.throw();
    });
    it('should remove the storage if it exists', () => {
      sm._storages['storage'] = new Memory();
      sm.rm('storage');
      expect(sm._storages['storage']).to.be.undefined;
    });
    it('should do nothing if the storage if it dne', () => {
      const currS = Object.assign({}, sm._storages);
      sm.rm('storage');
      expect(sm._storages).to.deep.equal(currS);
    });
  });
  describe('memory', () => {
    describe('.constructor', () => {
      it('should throw err if schema fails', () => {
        expect(() => new Memory({
          logEnabled: 123
        })).to.throw();
      });
      it('should create a memory store', () => {
        const m = new Memory();
        expect(m).to.exist;
        expect(m._logEnabled).to.be.true;
      });
    });
    describe('.init', () => {
      it('should ret true and init the memory store', async () => {
        const m = new Memory({
          logEnabled: false
        });
        const ret = await m.init();
        expect(ret).to.be.true;
        expect(m._memory).to.be.an.instanceof(Object);
      });
    });
    describe('.destroy', () => {
      it('should ret true and delete the memory store', async () => {
        const m = new Memory({
          logEnabled: false
        });
        m._memory = {};
        const ret = await m.destroy();
        expect(ret).to.be.true;
        expect(m._memory).to.be.undefined;
      });
    });
    describe('.add', () => {
      let m;
      beforeEach(() => {
        m = new Memory({
          logEnabled: false
        });
        m._memory = {};
      });
      it('should ret itemId and add the item to memory with given itemId', async () => {
        const ret = await m.add('itemId', {});
        expect(ret).to.equal('itemId');
        expect(m._memory['itemId']).to.deep.equal({});
      });
      it('should ret itemId and add the item with gen uniq itemId', async () => {
        const ret = await m.add(undefined, {});
        expect(ret).to.exist;
        expect(m._memory[ret]).to.deep.equal({});
      });
    });
    describe('.has', () => {
      let m;
      beforeEach(() => {
        m = new Memory({
          logEnabled: false
        });
        m._memory = {};
      });
      it('should ret true if item exists', async () => {
        m._memory['itemId'] = {};
        const ret = await m.has('itemId');
        expect(ret).to.be.true;
      });
      it('should ret false if item dne', async () => {
        const ret = await m.has('itemId');
        expect(ret).to.be.false;
      });
    });
    describe('.get', () => {
      let m;
      beforeEach(() => {
        m = new Memory({
          logEnabled: false
        });
        m._memory = {};
      });
      it('should ret the item if it exists', async () => {
        m._memory['itemId'] = {};
        const ret = await m.get('itemId');
        expect(ret).to.deep.equal({});
      });
      it('should ret undefined if item dne', async () => {
        expect(await m.get('itemId')).to.be.undefined;
      });
    });
    describe('.rm', () => {
      let m;
      beforeEach(() => {
        m = new Memory({
          logEnabled: false
        });
        m._memory = {};
      });
      it('should do nothing if item dne', async () => {
        const currMem = Object.assign({}, m._memory);
        const ret = await m.rm('itemId');
        expect(ret).to.equal('itemId');
        expect(m._memory).to.deep.equal(currMem);
      });
      it('should delete the item', async () => {
        m._memory['itemId'] = {};
        const ret = await m.rm('itemId');
        expect(ret).to.equal('itemId');
        expect(m._memory['itemId']).to.be.undefined;
      });
    });
    describe('.edit', () => {
      let m;
      beforeEach(() => {
        m = new Memory({
          logEnabled: false
        });
        m._memory = {};
      });
      it('should ret false if the item dne', async () => {
        const ret = await m.edit('itemId', { edited: 1 });
        expect(ret).to.be.false;
      });
      it('should edit the item if it exists', async () => {
        m._memory['itemId'] = {};
        const ret = await m.edit('itemId', { edited: 1 });
        expect(ret).to.equal('itemId');
        expect(m._memory['itemId']['edited']).to.equal(1);
      });
    });
  });
});