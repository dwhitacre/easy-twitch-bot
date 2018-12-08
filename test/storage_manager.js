const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const StorageManager = require('../src/storage_manager/storage_manager');
const Memory = require('../src/storage_manager/memory');
const ElasticsearchClass = require('../src/storage_manager/elasticsearch');

const indicesExistsTemplateStub = sinon.stub().resolves(true);
const indicesPutTemplateStub = sinon.stub().resolves(true);
const indicesExistsAliasStub = sinon.stub().resolves(true);
const indicesCreateStub = sinon.stub().resolves(true);
const indicesDeleteStub = sinon.stub().resolves(true);
const indicesDeleteTemplateStub = sinon.stub().resolves(true);
const indicesRolloverStub = sinon.stub().resolves({
  rolled_over: true
});
const indicesStub = {
  existsTemplate: indicesExistsTemplateStub,
  putTemplate: indicesPutTemplateStub,
  existsAlias: indicesExistsAliasStub,
  create: indicesCreateStub,
  delete: indicesDeleteStub,
  deleteTemplate: indicesDeleteTemplateStub,
  rollover: indicesRolloverStub
};

let createStub = sinon.stub().resolves(true);
let getStub = sinon.stub().resolves({
  _source: {
    field: 'field'
  }
});
let searchStub = sinon.stub().resolves({
  hits: {
    total: 1,
    hits: [{
      _index: 'index',
      _source: {
        field: 'field'
      }
    }]
  }
});
let deleteStub = sinon.stub().resolves({
  result: 'deleted'
});
let updateStub = sinon.stub().resolves({
  result: 'updated'
});

class esClientStub {
  constructor() {
    this.indices = indicesStub;
    this.create = createStub;
    this.get = getStub;
    this.search = searchStub;
    this.delete = deleteStub;
    this.update = updateStub;
  }
}

const Elasticsearch = proxyquire('../src/storage_manager/elasticsearch', {
  'elasticsearch': {
    Client: esClientStub
  }
});

describe('storage_manager', () => {
  describe('.constructor', () => {
    it('should throw err if schema fails', () => {
      expect(() => new StorageManager({
        defaultStorage: 123
      })).to.throw();
    });
    it('should create a storage manager', () => {
      const sm = new StorageManager();
      expect(sm._defaultStorageType).to.equal('memory');
      expect(sm._logEnabled).to.be.true;
      expect(sm._id).to.exist;
      expect(sm._storages).to.be.an.instanceof(Object);
    });
  });
  describe('.getSettings', () => {
    it('should get the settings', () => {
      const sm = new StorageManager();
      const settings = sm.getSettings();
      expect(settings.defaultStorageType).to.equal('memory');
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
    it('should create storage with provided memory storage type', () => {
      sm.add('storage', 'memory');
      expect(sm._storages['storage']).to.exist;
      expect(sm._storages['storage']).to.be.an.instanceof(Memory);
    });
    it('should create storage with provided elasticsearch storage type', () => {
      sm.add('storage', 'elasticsearch');
      expect(sm._storages['storage']).to.exist;
      expect(sm._storages['storage']).to.be.an.instanceof(ElasticsearchClass);
    });
    it('should do nothing if default storage type dne', () => {
      sm._defaultStorageType = 'nope';
      sm.add('storage');
      expect(sm._storages['storage']).to.be.undefined;
    });
    it('should do nothing if provided storage type dne', () => {
      sm.add('storage', 'nope');
      expect(sm._storages['storage']).to.be.undefined;
    });
    it('should create storage with provided unknown storage type if storage class is provided', () => {
      class UnknownStorage {
        constructor() {}
      }
      sm.add('storage', 'unknown', {}, UnknownStorage);
      expect(sm._storages['storage']).to.exist;
      expect(sm._storages['storage']).to.be.an.instanceof(UnknownStorage);
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
  describe('elasticsearch', () => {
    let es;
    beforeEach(() => {
      indicesStub.existsTemplate.resolves(true);
      indicesStub.putTemplate.resolves(true);
      indicesStub.existsAlias.resolves(true);
      indicesStub.create.resolves(true);
      indicesStub.delete.resolves(true);
      indicesStub.deleteTemplate.resolves(true);
      indicesStub.rollover.resolves({
        rolled_over: true
      });
      indicesStub.existsTemplate.resetHistory();
      indicesStub.putTemplate.resetHistory();
      indicesStub.existsAlias.resetHistory();
      indicesStub.create.resetHistory();
      indicesStub.delete.resetHistory();
      indicesStub.deleteTemplate.resetHistory();
      indicesStub.rollover.resetHistory();
      createStub.resolves({
        _id: 'itemId'
      }).resetHistory();
      getStub.resolves({
        _source: {
          field: 'field'
        }
      }).resetHistory();
      searchStub.resolves({
        hits: {
          total: 1,
          hits: [{
            _index: 'index',
            _source: {
              field: 'field'
            }
          }]
        }
      }).resetHistory();
      deleteStub.resolves({
        result: 'deleted'
      }).resetHistory();
      updateStub.resolves({
        result: 'updated'
      }).resetHistory();
      es = new Elasticsearch({
        logEnabled: false
      });
      es._client = new esClientStub();
    });
    describe('.constructor', () => {
      it('should throw err if schema fails', () => {
        expect(() => new Elasticsearch({
          logEnabled: 123
        })).to.throw();
      });
      it('should create an elasticsearch store', () => {
        const esC = new Elasticsearch();
        expect(esC._index).to.exist;
        expect(esC._type).to.exist;
        expect(esC._readAlias).to.exist;
        expect(esC._writeAlias).to.exist;
        expect(esC._host).to.exist;
        expect(esC._apiVersion).to.exist;
        expect(esC._rollover).to.exist;
        expect(esC._additionalMappings).to.exist;
        expect(esC._logEnabled).to.exist;
      });
    });
    describe('.init', () => {
      it('should ret true and create the index template', async () => {
        indicesStub.existsTemplate.resolves(false);
        await es.init();
        expect(indicesStub.existsTemplate.calledOnce).to.be.true;
        expect(indicesStub.putTemplate.calledOnce).to.be.true;
      });
      it('should ret true and create the write alias', async () => {
        indicesStub.existsAlias.resolves(false);
        await es.init();
        expect(indicesStub.existsAlias.calledOnce).to.be.true;
        expect(indicesStub.create.calledOnce).to.be.true;
      });
      it('should ret true and do nothing id the index template and write alias already exist', async () => {
        await es.init();
        expect(indicesStub.putTemplate.calledOnce).to.be.false;
        expect(indicesStub.create.calledOnce).to.be.false;
      });
    });
    describe('.destroy', () => {
      it('should ret true and delete the indices', async () => {
        await es.destroy();
        expect(indicesStub.delete.calledOnce).to.be.true;
      });
      it('should ret true and delete the template', async () => {
        await es.destroy();
        expect(indicesStub.deleteTemplate.calledOnce).to.be.true;
      });
    });
    describe('.add', () => {
      it('should ret item id and call rollover if rollover enabled', async () => {
        es._rolloverEnabled = true;
        createStub.resolves({
          _id: 'abc123'
        });
        const itemId = await es.add('itemId', {});
        expect(itemId).to.equal('abc123')
        expect(indicesRolloverStub.calledOnce).to.be.true;
        expect(createStub.calledOnce).to.be.true;
      });
      it('should ret item id and add the item', async () => {
        const itemId = await es.add('itemId', {});
        expect(itemId).to.equal('itemId');
        expect(createStub.calledOnce).to.be.true;
      });
      it('should ret item id and overwrite the item if it already exists', async () => {
        await es.add('itemId', { wow: 'wow' });
        const itemId = await es.add('itemId', {});
        expect(itemId).to.equal('itemId');
        expect(createStub.calledTwice).to.be.true;
      });
    });
    describe('.has', () => {
      it('should ret true if item exists', async () => {
        const has = await es.has('itemId');
        expect(has).to.be.true;
      });
      it('should ret false if item dne', async () => {
        getStub.throws();
        const has = await es.has('itemId');
        expect(has).to.be.false;
      });
      it('should ret true if item exists and rollover enabled', async () => {
        es._rolloverEnabled = true;
        const has = await es.has('itemId');
        expect(has).to.be.true;
      });
      it('should ret false if item dne and rollover enabled', async () => {
        es._rolloverEnabled = true;
        searchStub.throws();
        const has = await es.has('itemId');
        expect(has).to.be.false;
      });
    });
    describe('.get', () => {
      it('should ret the item if it exists', async () => {
        const get = await es.get('itemId');
        expect(get).to.deep.equal({ field: 'field' });
        expect(getStub.calledOnce).to.be.true;
      });
      it('should ret undefined if item dne', async () => {
        getStub.throws();
        const get = await es.get('itemId');
        expect(get).to.be.undefined;
        expect(getStub.calledOnce).to.be.true;
      });
      it('should ret the item if it exists and rollover enabled', async () => {
        es._rolloverEnabled = true;
        const get = await es.get('itemId');
        expect(get).to.deep.equal({ field: 'field' });
        expect(searchStub.calledOnce).to.be.true;
      });
      it('should ret undefined if item dne and rollover enabled', async () => {
        es._rolloverEnabled = true;
        searchStub.throws();
        const get = await es.get('itemId');
        expect(get).to.be.undefined;
        expect(searchStub.calledOnce).to.be.true;
      });
    });
    describe('.rm', () => {
      it('should ret undefined if the item fails to delete', async () => {
        deleteStub.resolves({
          result: 'nah'
        });
        const deleted = await es.rm('itemId');
        expect(deleted).to.be.undefined;
        expect(deleteStub.calledOnce).to.be.true;
      });
      it('should ret undefined if item dne', async () => {
        getStub.throws();
        const deleted = await es.rm('itemId');
        expect(deleted).to.be.undefined;
        expect(deleteStub.notCalled).to.be.true;
      });
      it('should ret item id and delete the item', async () => {
        const deleted = await es.rm('itemId');
        expect(deleted).to.equal('itemId');
        expect(deleteStub.calledOnce).to.be.true;
      });
      it('should use the index from get with index if rollover enabled', async () => {
        es._rolloverEnabled = true;
        const deleted = await es.rm('itemId');
        expect(deleted).to.equal('itemId');
        expect(deleteStub.calledOnce).to.be.true;
        expect(searchStub.called).to.be.true;
      });
    });
    describe('.edit', () => {
      it('should ret undefined if the item dne', async () => {
        getStub.throws();
        const edited = await es.edit('itemId', {});
        expect(edited).to.equal(undefined);
        expect(updateStub.notCalled).to.be.true;
      });
      it('should ret item id and edit the item if it exists', async () => {
        const edited = await es.edit('itemId', {});
        expect(edited).to.equal('itemId');
        expect(updateStub.calledOnce).to.be.true;
      });
      it('should ret item id if the item exists but there was nothing to update', async () => {
        updateStub.resolves({
          result: 'nah'
        });
        const edited = await es.edit('itemId', {});
        expect(edited).to.equal('itemId');
        expect(updateStub.calledOnce).to.be.true;
      });
      it('should use the index from get with index if rollover enabled', async () => {
        es._rolloverEnabled = true;
        const edited = await es.edit('itemId', {});
        expect(edited).to.equal('itemId');
        expect(updateStub.calledOnce).to.be.true;
        expect(searchStub.called).to.be.true;
      });
    });
  });
});