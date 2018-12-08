/*
 * Although this code is an example of how to get started using
 * this bot framework, it is not an example of what to impl
 * in production code.
 *
 * DO NOT USE IN PRODUCTION!
 * 
 */

const EasyTwitchBot = require('../easy_twitch_bot.js');

const easyBot = new EasyTwitchBot({
  twitchClient: {
    username: process.env.TWITCH_USERNAME,
    token: process.env.TWITCH_TOKEN,
    channels: ['danonthemoon']
  },
  storageManager: {
    defaultStorageType: 'memory'
  }
  //rbac: { enabled: false }
});

easyBot.init();
easyBot.rbac.addRole('admin', {
  can: ['echo'],
  inherits: ['es', 'default']
});
easyBot.rbac.addRole('es', {
  can: ['esmoon', 'esearth', 'esdan']
});
easyBot.rbac.addRole('default', {
  can: [ 'e', 'devmoon', 'devearth', 'devdan' ]
});
easyBot.rbac.addUser('danonthemoon', ['admin']);
easyBot.addRule({
  name: 'echo',
  aliases: 'e',
  args: 'message',
  handler: async (params) => {
    // needs user message sanitization!
    return params.args.message;
  }
});

easyBot.storageManager.add('moonStorage');
const moonStorage = easyBot.storageManager.get('moonStorage');
moonStorage.init()
  .then(async (success) => {
    if (!success) throw new Error('could not init moonStorage');

    await moonStorage.add('members', []);

    easyBot.addRule({
      name: 'devmoon',
      handler: async (params) => {
        const bot = params.bot;
        const storageManager = bot.storageManager;
        const mS = storageManager.get('moonStorage');
        
        let msMembers = await mS.get('members');

        const index = msMembers.indexOf(params.username);
        if (index > -1) {
          return `@${params.username}, you are already on the moon :)`;
        }

        if (!params.username) return 'need to have a username to join the moon';

        msMembers.push(params.username);
        const success = await mS.edit('members', msMembers);
        
        if (!success) return `@${params.username} failed to make it to the moon! Try again!`;
        return `@${params.username}, welcome to the moon!`;
      }
    });
    easyBot.addRule({
      name: 'devearth',
      handler: async (params) => {
        const bot = params.bot;
        const storageManager = bot.storageManager;
        const mS = storageManager.get('moonStorage');

        const msMembers = await mS.get('members');
        const index = msMembers.indexOf(params.username);
        if (index > -1) {
          msMembers.splice(index, 1);
          const success = await mS.edit('members', msMembers);
        
          if (!success) return `@${params.username} failed to leave the moon! Try again!`;
          return `@${params.username}, came back down to earth :(`;
        }

        if (!params.username) return 'need to have a username to be on earth';

        return `@${params.username}, you are already on the earth...`;
      }
    });
    easyBot.addRule({
      name: 'devdan',
      handler: async (params) => {
        const bot = params.bot;
        const storageManager = bot.storageManager;
        const mS = storageManager.get('moonStorage');

        const msMembers = await mS.get('members');

        return `Heres the current moon party: ${msMembers.join(', ')}`;
      }
    });
  });

if (process.env.TEST_ELASTICSEARCH === 'true' || process.env.TEST_ELASTICSEARCH === true) {
  easyBot.storageManager.add('esStorage', 'elasticsearch', {
    index: 'easy-bot-test'
  });
  const esStorage = easyBot.storageManager.get('esStorage');
  esStorage.init()
    .then(async (success) => {
      if (!success) throw new Error('could not init esStorage');
      const itemId = await esStorage.add(undefined, {field: 'wow'});
      await esStorage.has(itemId);
      await esStorage.has('nooo');
      await esStorage.rm('noo');
      await esStorage.edit(itemId, {
        field2: 'field2'
      });
      await esStorage.edit('nooo', {
        field2: 'field2'
      });
      await esStorage.add(itemId, {
        field3: 'field3'
      });
      await esStorage.rm(itemId);


      await esStorage.add('members', { members: []});

      easyBot.addRule({
        name: 'esmoon',
        handler: async (params) => {
          const bot = params.bot;
          const storageManager = bot.storageManager;
          const eS = storageManager.get('esStorage');
          
          let { members: esMembers } = await eS.get('members');

          const index = esMembers.indexOf(params.username);
          if (index > -1) {
            return `@${params.username}, you are already on the moon :)`;
          }

          if (!params.username) return 'need to have a username to join the moon';

          esMembers.push(params.username);
          const success = await eS.edit('members', { members: esMembers });
          
          if (!success) return `@${params.username} failed to make it to the moon! Try again!`;
          return `@${params.username}, welcome to the moon!`;
        }
      });
      easyBot.addRule({
        name: 'esearth',
        handler: async (params) => {
          const bot = params.bot;
          const storageManager = bot.storageManager;
          const eS = storageManager.get('esStorage');

          const { members: esMembers } = await eS.get('members');
          const index = esMembers.indexOf(params.username);
          if (index > -1) {
            esMembers.splice(index, 1);
            const success = await eS.edit('members', { members: esMembers });
          
            if (!success) return `@${params.username} failed to leave the moon! Try again!`;
            return `@${params.username}, came back down to earth :(`;
          }

          if (!params.username) return 'need to have a username to be on earth';

          return `@${params.username}, you are already on the earth...`;
        }
      });
      easyBot.addRule({
        name: 'esdan',
        handler: async (params) => {
          const bot = params.bot;
          const storageManager = bot.storageManager;
          const eS = storageManager.get('esStorage');

          const { members: esMembers } = await eS.get('members');

          return `Heres the current moon party: ${esMembers.join(', ')}`;
        }
      });
    });
}

easyBot.start();