# easy-twitch-bot

Building your own twitch bot using a simple node api is finally here! No longer do you need to worry about finding the right irc tools, rolling your own language parser, or building a web server to extend the bot in the future. We handle this all for you with this dynamically customizable twitch bot framework. We'll auto generate all your IRC commands, your API, your RBAC, manage your persistent storage, from just a defined set of rules. Our feature set includes, but is not limited to:

  - Fully documented and extendable node api for dynamically configuring the bot
  - Twitch IRC Message handling and parsing (built off [tmi.js](https://github.com/tmijs/tmi.js))
  - Guaranteed IRC message deliverly system not included in tmi.js
  - [Hapi](https://hapijs.com/) Webserver for IRC to API mappings
  - RBAC for twitch users to be mapped to custom roles to protect your IRC/API commands
  - JSON-lines log generation for all API and IRC interactions
  - Preconfigured storage management for known datastores, ie [Elasticsearch](https://github.com/elastic/elasticsearch)
  - Pluggable storage management for unknown/external storage configurations
  - and more!

Let us do the hard work for you! Making twitch bots should be easy and now it can be.

## Road to 1.0

At the moment this framework is a work in progress and its API is subject to change. I went ahead and wrote the documentation as I feel the API is relatively stable, though I foresee a future where I need to promisify a large chunk of it.

Once the 1.0.0 release is done then we can consider this stable and only will change under semver versioning.

There are many functionalities, things I want to clean up, and kinks to work out before getting to the 1.0.0 release to ensure this project can be maintainable and stable in the future. Follow the 1.0.0 milestone in the issues to see what needs to be done still.

## Getting Started

Getting started is easy as well. It's just a node module so add it your project.

```
npm i --save https://github.com/dwhitacre/easy-twitch-bot.git
```

Then create a bot instance

```javascript

const EasyTwitchBot = require('easy-twitch-bot');
const easyBot = new EasyTwitchBot({
  twitchClient: {
    username: <bot username>,
    token: <bot oauth token> // https://twitchapps.com/tmi/,
    channels: [ <channel to join> ]
  },
  rbac: {
    enabled: false
  }
});
easyBot.init();

```

Add some rules

```javascript

easyBot.addRule({
  name: 'echo',
  args: 'message',
  handler: async ({ args }) => {
    return args.message;
  }
});

easyBot.addRule({
  name: 'hello',
  handler: async ({ username }) => {
    return `Hello @${username}!`;
  }
})

```

And finally start her up!

```javascript

easyBot.start();

```

From there you see everything start up in the logs and the messages from the twitch IRC flowing in. Easy as that!

See `example/example.js` for a more in depth example with storage, rbac, etc, or refer to the API docs below for more information.

### Interact with the Bot

There are 3 ways to interact with the bot. Chat in a channel on twitch, whisper the bot on twitch, or api calls with the webserver. 

#### Twitch IRC (chat or whisper)

To interact with the bot, you just need to know the commands. If rbac is enabled you also need access to the commands.

Just whisper the bot directly, or chat in one of the channels it is in. The syntax is as follows:

```
<commandPrefix><commandName> [<args>] [-<flags>]
```

for example for the following rule definition:

```
{
  name: 'test',
  aliases: [ 'testalias' ],
  args: [ 'testArg1', 'testArg2' ],
  flags: [ 'testFlag1', 't' ],
  handler: async function ...
}
```

with the default command prefix

```
!test wow what a test! --testFlag1 -f flag
```

This will invoke the `test` command, and depending on the handler implementation, the bot may message you back via chat/whisper.

#### API Calls

Similarly for API Calls, interacting with the bot is easy. If rbac is enabled you may have to get a token from the api as well.

```
POST /<hapiServerPath>?[flags][&token=<token if needed>]
{
  "name": <commandName>,
  [...args]
}
```

for example for the following rule definition:

```
{
  name: 'test',
  aliases: [ 'testalias' ],
  args: [ 'testArg1', 'testArg2' ],
  flags: [ 'testFlag1', 't' ],
  handler: async function ...
}
```

with the default hapi server path

```
POST /rules?testFlag1&t=flag
{
  "name": "test",
  "testArg1": "wow",
  "testArg2": "what a test!"
}
```

This will invoke the `test` api, and depending on the handler implementation, the bot may message you via chat/whisper or return back on this api in the following format.

```
{
  "name": "test",
  "message": "<some message>"
}
```

##### Get token

If a token is needed, you will need to obtain one from the API. The bot will whisper the token to you on twitch.

```
GET /<tokenPath>?user=<twitch username>
```

> `tokenPath` defaults to `token`

returns 200 on success, 404 if token doesnt exist for user.

## API

`twitchClient`

Property holding the `twitchClient`. See below for its API.

`hapiServer`

Property holding the `hapiServer`. See below for its API.

`rbac`

Property holding the `rbac` functionality. See below for its API.

`storageManager`

Property holding the `storageManager` functionality. See below for its API.

`getSettings()`

Returns the `twitchClient` and `hapiServer` settings for the bot. Includes sensitive info like your token and server host.

`setSettings(settings)`

Sets the `twitchClient` and `hapiServer` settings for the bot, need to call `init` for the settings to take affect.

- `settings` - object, only `twitchClient` and `hapiServer` from the config settings

`getState()`

Returns the current `twitchClient` and `hapiServer` state. ie `running`, `dirty`, etc

`init()`

Initializes the `twitchClient` and `hapiServer`. Applys the current settings. Must be run prior to `start`.

`start()`

Starts the `hapiServer` and then the `twitchClient`. Must run `init` prior to calling this. Returns a promise.

`stop()`

Stops the `twitchClient` and then the `hapiServer`. Returns a promise.

`addRule(ruleDef)`

Adds a rule creating the twitch IRC commands and API routes.

- `ruleDef` - object
  - `name` - required string alphanum max500, name of the rule (ie name of command and api)
  - `aliases` - array of names, aliases to the above rule name
  - `enabled` - boolean
  - `args` - array of string alphanum max50, arguments to the command/api, order matters
    - ie `!command <arg1> <arg2> <arg3>`
  - `flags` array of string alphanum max50, flags to the command/api, order does not matter
    - ie `!command -f <f> --flag <flag>`
  - `handler` - required function, the function to be called when the command/api is invoked. This function should return a promise resolving to string or undefined. See Rule Handlers below for more information.

`getRule(ruleName)`

Returns a rule definition or undefined if known exists with this name

- `ruleName` - string, name of the rule 

`rmRule(ruleName)`

Removed the rule and subsequently removes the twitch IRC commands and API routes.

- `ruleName` - string, name of the rule

`editRule(ruleDef)`

Edits an existing rule merging this rule defintion on top of the old one.

- `ruleDef` - object, see `addRule` above, though `handler` is no longer required.

`clearRule()`

Removes all the existing rules, their twitch IRC commands and API routes.

### Config

To be passed into the constructor. The `twitchClient` and `hapiServer` are dynamically configurable later, the rest are not.

```

{
  twitchClient: {
    username: <required string, the twitch username for the bot>,
    token: <required string, the twitch oauth token for the above username, see https://twitchapps.com/tmi/>,
    channels: <array of strings | string, the channels for the bot to join>,
    commandPrefix: <string max1, the single character to prepend all commands in IRC, default '!'>,
    channelPrefix: <string max1, the single character to prepend channel names internally, default '#'>,
    logEnabled: <boolean, log messages for the twitch client, default true>
  },
  hapiServer: {
    host: <string, the host to bind the server to, default localhost>,
    port: <number positive, the port to bind the server to, default 3000>,
    path: <string max50, the path for generated API, default /rules>,
    tokenPath: <string max50, the path for the tokenAPI, default /token>,
    logEnabled: <boolean, log messages for the hapi server, default true>
  },
  rbac: {
    enabled: <boolean, whether or not rbac is enabled. disabling it will force all calls to it to return true. i dont recommend doing this, you are better off setting up a defaultRole for unknown rules, default true>,
    defaultRole: <string max500, the default role name, if the default role does not exist calls to rbac will return false, default default>,
    logEnabled: <boolean, log messages for the rbac, default true>
  },
  storageManager: {
    defaultStorage: <string alphanum max500, the storage to use by default when its not specified, default memory>,
    logEnabled: <boolean, log messages for the storage manager, default true>
  }
}

```

### Rule Handlers

This function is specified in your rule defintion, see `addRule` to be called when the command/api is invoked. This function should return a promise resolving to string or undefined.

Resolving to a string will cause the bot to return a message via the same method the bot initially received the command, ie if someone invoked the command via twitch chat, the bot will send this message back in twitch chat.

Resolving to undefined will cause the bot to not send any message back.

If you want the bot to say something in chat for example when an API is invoked, then this handler can do that, but the `bot.twitchClient.chat` command will need to be invoked directly, and the undefined should be returned to the API.

This handler function will recieved a wealth of information and full access to the node API detailed here as an object argument to the function. Following is the content of that object.

`handler(object)`

- object
  - `command` - object, the command definition generated from the rule being invoked, only exists on twitch chat/whisper invokes
  - `route` - object, the route definition generated from the role being invoked, only exists on api call invokes
  - `name` - string, name of the rule
  - `target` - string, the target of the invoke
    - will be `rest` of api call invokes, the channel name or the username who whispered
  - `messageType` - string, `chat`, `whisper` or `route`
  - `messageRaw` - string, raw message from twitch, on api invoke empty string
  - `args` - object, the arguments passed to the rule on invoke, properties are the args defined in the rule definition
  - `flags` - object, the flags passed to the rule on invoke, properties are the flags defined in the rule definition
  - `bot` - object, the running bot and its api as defined here
  - `username` - string, the user invoking the rule, undefined if unknown (anon api call)

### twitchClient

`getSettings()`

Returns the settings for the twitch client. Includes sensitive info like your token.

`setSettings(settings)`

Sets the settings for the twitch client, need to call `init` for the settings to take affect.

- `settings` - object, see config for more info

`getState()`

Returns the current state. ie `running`, `dirty`, etc

`init()`

Initializes the twitch client, setting up connections and listeners. Applies the current settings. Must be run prior to `start`.

`start()`

Starts the `twitchClient`, opens connections to twitch. Must run `init` prior to calling this. Returns a promise.

`stop()`

Stops the `twitchClient`, closing the connection to twitch. Returns a promise.

`say(target, type, message)`

Sends a message to the target from the bot. Returns a promise.

- `target` - string, where to send the message, channel name or twitch username
- `type` - string, `chat` or `whisper`
- `message` string, the content of the message to send

`chat(target, message)`

Sends a chat message to the target channel from the bot. Returns a promise.

- `target` - string, where to send the message, channel name
- `message` string, the content of the message to send

`whisper(target, message)`

Sends a whisper message to the target twitch username from the bot. Returns a promise.

- `target` - string, where to send the message, twitch username
- `message` string, the content of the message to send

`_log(message)`

Logs a message in JSON format as the twitch client if log enabled.

- `message` - object
  - `id` - string, twich client id will be included as default
  - `from` - string, twitch client will be set as from as default
  - `message`- string, the actual message to log. should always specify this
  - any additional props will be logged as well.

> Command apis purposefully omitted from doc as they shouldn't need to be called directly. Doing so may break things.

### hapiServer

`getSettings()`

Returns the settings for the hapi server. Includes sensitive info like your host and port.

`setSettings(settings)`

Sets the settings for the hapi server, need to call `init` for the settings to take affect.

- `settings` - object, see config for more info

`getState()`

Returns the current state. ie `running`, `dirty`, etc

`init()`

Initializes the hapi server, setting up connections and listeners. Applies the current settings. Must be run prior to `start`.

`start()`

Starts the `hapiServer`, opens connections to twitch. Must run `init` prior to calling this. Returns a promise.

`stop()`

Stops the `hapiServer`, closing the connection to twitch. Returns a promise.

`_log(message)`

Logs a message in JSON format as the hapi server if log enabled.

- `message` - object
  - `id` - string, twich client id will be included as default
  - `from` - string, twitch client will be set as from as default
  - `message`- string, the actual message to log. should always specify this
  - any additional props will be logged as well.

> Route apis purposefully omitted from doc as they shouldn't need to be called directly. Doing so may break things.

### rbac

`getSettings()`

Returns the settings for rbac.

`setSettings(settings)`

Sets the settings for rbac.

- `settings` - object, see config for more info

`getState()`

Returns the current state. ie `id`

`addRole(roleName, roleOptions)`

Adds a new role to the rbac.

- `roleName` - string alphanum max500, the name of the role, must be uniq
- `roleOptions` - object
  - `can` - array of rule names | string, what rules the role can use
  - `inherits` - array of role names | string, what roles this role should inherit `can`s from

`getRole(roleName)`

Returns a role or undefined if it dne.

- `roleName` - string, the name of the role

`rmRole(roleName)`

Removes the role for this name.

- `roleName` - string, the name of the role

`checkRole(roleName, action)`

Returns whether or not the role or any roles it inherits `can` do the action.

- `roleName` - string, the name of the role
- `action` - string, the name of the action, ie rule name or alias

`addUser(userName, roleName)`

Add a new user with the given role.

- `userName` - string, the name of the user to add
- `roleName` - string, the name of the role to give them

`getUser(userNameOrToken)`

Returns the users role for the given name or token.

- `userNameOrToken` - string, the name of the user or their token

`rmUser(userName)`

Removes the user for this name.

- `userName` - string, the user's name

`editUser(userName, roleName)`

Edit the role for a specific user.

- `userName` - string, the users name
- `roleName` - string, the role name

`clear()`

Removes all roles and users.

`check(userName, action)`

Returns whether or not the user `can` do the action.

- `userName` - string, the users name
- `action` - string, the name of the action, ie rule name or alias

`_log(message)`

Logs a message in JSON format as rbac if log enabled.

- `message` - object
  - `id` - string, twich client id will be included as default
  - `from` - string, twitch client will be set as from as default
  - `message`- string, the actual message to log. should always specify this
  - any additional props will be logged as well.

### storageManager

`getSettings()`

Returns the settings for storageManager.

`setSettings(settings)`

Sets the settings for storageManager.

- `settings` - object, see config for more info

`getState()`

Returns the current state. ie `id`

`add(storageName, storageType, storageDef)`

Adds a storage of the specific type from the definition. This does not init it, just adds it to the manager.

- `storageName` - string, uniq storage name
- `storageType` - string, defaults to what is set in config
- `storageDef` - object, object for storage creation if needed

`get(storageName)`

Returns the storage.

- `storageName` - string, the name of the storage

`rm(storageName)`

Removes the storage. This does not destroy it, just removes it from the manager.

- `storageName` - string, the name of the storage

`_log(message)`

Logs a message in JSON format as storageManager if log enabled.

- `message` - object
  - `id` - string, twich client id will be included as default
  - `from` - string, twitch client will be set as from as default
  - `message`- string, the actual message to log. should always specify this
  - any additional props will be logged as well.

#### storage

Each storage may be implemented differently (ie external ones), but a best effort should be made to follow this format, to make interacting with them via this framework easier.

`init()`

Initializes the storage. ie create the index, create the object, etc etc. Returns a promise.

`destroy()`

Destroys the storages. ie teardown the index, delete the object, etc. Returns a promise.

`add(itemId, item)`

Add the item with the id. Leaving id undefined should gen a uniq id. Returns a promise.

- `itemId` - string, the item id
- `item` - any, the content to be stored

`has(itemId)`

Check if the item exists. Returns a promise.

- `itemId` - string, the item id

`get(itemId)`

Get the item. Returns a promise.

- `itemId` - string, the item id

`rm(itemId)`

Remove the item. Returns a promise.

- `itemId` - string, the item id

`edit(itemId, item)`

Edit the item. Returns a promise.

- `itemId` - string, the item id
- `item` - any, the content to be stored

`_log(message)`

Logs a message in JSON format as storage if log enabled.

- `message` - object
  - `id` - string, twich client id will be included as default
  - `from` - string, twitch client will be set as from as default
  - `message`- string, the actual message to log. should always specify this
  - any additional props will be logged as well.

## Contributing

If you wish to contribute please contact me first. The best way to contact me is on [twitch](https://twitch.tv/danonthemoon) or on discord (danonthemoon#3426). Upon chatting we will get an issue for you to work on and your dev env setup.

### Development

`npm start` runs `example/watch.js` watching the src code for changes. It just starts up a basic example of the bot. Must set `TWITCH_USERNAME` and `TWITCH_TOKEN` env vars for the bot to use.

`npm run test` to run the tests.
