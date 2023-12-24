import mineflayer from 'mineflayer';
import chalk from 'chalk';
import dateTime from 'node-datetime';
import fs from 'fs';

const readConfig = (path) => {
  try {
    const configData = fs.readFileSync(path, 'utf8');
    return JSON.parse(configData);
  } catch (err) {
    console.error('Error loading config file:', err);
    process.exit(1);
  }
}

const formatMessage = (message, spamLength) => {
  const length = spamLength;
  const randint = () => Math.floor(Math.random() * Math.pow(10, length));
  const randalpha = () => {
    let randString = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      randString += alphabet.charAt(randomIndex);
    }
    return randString;
  };
  const randall = () => {
    const allChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randallString = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length);
      randallString += allChars.charAt(randomIndex);
    }
    return randallString;
  };

  const randmethods = [randall, randalpha, randint];

  message = message.replace('{randstr}', random(randmethods)());

  // message = message.replace('{player}', player);

  return message;
};

const random = (array) => {
  if (array.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

class vinedsUnicellularOrganism {
  constructor() {
    this.bot;
    this.isSpamming = false;
    this.config = readConfig('./src/config.json');
    this.host = this.config['server']['host'];
    this.port = this.config['server']['port'];
    this.username = this.config['username'];
    this.password = this.config['password'];
    this.messages = this.config['messages'];
    this.msgDelay = this.config['msgDelay'];
    this.spamLength = this.config['spamLength'];
    this.loggedIn = false;
    this.loginCount = 0;
    this.initBot();
  }

  log(...msg) {
    console.log(`[${this.username}]`, ...msg);
  }

  async sleep(seconds) {
    await this.bot.waitForTicks(seconds * 20);
  }

  initBot() {
    this.bot = mineflayer.createBot({
      username: this.username,
      host: this.host,
      port: this.port,
      version: '1.19.4',
      hideErrors: false,
      checkTimeoutInterval: 9999999
    })

    this.initEvents();
  }

  initEvents() {
    this.bot.on('login', async () => {
      let botSocket = this.bot._client.socket;
      this.log(chalk.green.bold(`Logged in to ${botSocket.server ? botSocket.server : botSocket._host}`));
      try {
        this.bot.chat(`/register ${this.password}`);
        await this.sleep(2);
        this.bot.chat(`/login ${this.password}`);
      } catch { }
      this.loginCount += 1;

      if (this.loginCount == 2) {
        this.loginCount = 0;
        this.log(chalk.magentaBright.bold(`Joined the main server`));
        this.bot.setControlState('forward', true);
        await this.sleep(3);
        this.bot.setControlState('forward', false);
        this.loggedIn = true;
        this.isSpamming = true;
        while (this.isSpamming) {
          try {
            this.bot.chat(
              formatMessage(random(this.messages), this.spamLength)
            );
            await this.sleep(this.msgDelay);
          } catch {}
        }
      }
    });

    this.bot.on('kicked', async (reason) => {
      this.log(chalk.red.bold(`Disconnected: ${reason}`));
      this.bot.end();
    });

    this.bot.on('error', async (err) => {
      if (err.code == 'ECONNREFUSED') {
        this.log(chalk.red.bold(`Failed to connect to ${err.address}:${err.port}`))
        this.bot.end()
      } else {
        this.log(`Unhandled error: ${chalk.red.bold(err)}`);
        this.bot.end()
      }
    });

    this.bot.on('end', async (reason) => {
      this.bot.removeAllListeners();
      this.isSpamming = false;
      this.log(`Waiting ${chalk.yellow('5s')} to rejoin`);
      setTimeout(() => this.initBot(), 5000);
      if (this.loggedIn == true) {
        this.loggedIn = false;
      }
    });

    this.bot.on('messagestr', async (message) => {
      // this.log(message)
      let prefix = null;
      let msg = null;
      let prefixedName = null;
      let noPrefixMsg = '';
      let name = message.split(' ')[0];
      if (!this.bot.players[name] && message.split(' ')[1] != 'joined.') {
        prefix = message.split(']')[0] + ']'
        noPrefixMsg = message.split(']')[1]
        if (noPrefixMsg != null) name = noPrefixMsg.trim().split(' ')[0];
      }
      if (prefix && this.bot.players[name]) {
        msg = message.replace(`${prefix} ${name} » `, '');
      } else {
        msg = message.replace(`${name} » `, '');
      }
      prefixedName = message.split(' » ')[0]
      let colorName = chalk.cyan(name);
      let dt = dateTime.create();
      let formatted = dt.format('Y-m-d H:M:S');

      if ([`joined.`, `quit.`, `joined`].includes(message.split(' ')[1])) {
        let conn = msg.replace(`${name} `, '');
        console.log(`${chalk.blue.bold(`[${formatted}]`)} ${colorName} ${chalk.grey(conn)}`);
      } else if (msg == `${name} died.` || msg.startsWith(`${name} was utterly destroyed`) || msg.startsWith(`${name} was blown apart`)) {
        let deathColor = chalk.red;

        let death = msg.replace(`${name} `, '');
        console.log(`${chalk.blue.bold(`[${formatted}]`)} ${colorName} ${deathColor(death)}`);
      } else {
        if (!msg.startsWith(name)) {
          if (name in this.bot.players) {
            let link = msg.split('https://').pop().split(' ')[0];
            let newMsg = msg.replace(`https://${link}`, `${chalk.rgb(51, 102, 204).bold(`https://${link}`)}`);
            console.log(`${chalk.blue.bold(`[${formatted}]`)} ${colorName} ${chalk.grey('»')} ${chalk.white(newMsg)}`);
          }

        } else if (message.substring(name.length).startsWith(' whispers: ')) {
          let whisper = msg.replace(`${name} whispers: `, '');
          console.log(`${chalk.blue.bold(`[${formatted}]`)} ${chalk.rgb(85, 254, 84).bold(`${name} whispers to ${this.username}: ${whisper}`)}`);

          return;
        } else if (msg.startsWith('You whisper to')) {
          console.log(`${chalk.blue.bold(`[${formatted}]`)} ${chalk.rgb(85, 254, 84).bold(msg)}`);
        }
        if (msg.startsWith('vined_ wants to')) {
          await sleep(5000)
          this.bot.chat('/tpy vined_');
        }
      }
    });
  }
}

new vinedsUnicellularOrganism();