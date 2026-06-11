const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const OP_TOTAL = 'TOTAL ';
const OP_CREDIT = 'CREDIT';
const OP_DEBIT = 'DEBIT ';
const CMD_READ = 'READ';
const CMD_WRITE = 'WRITE';

class DataProgram {
  constructor() {
    this.storageBalance = 1000.0;
  }

  execute(operation, balance) {
    if (operation === CMD_READ) {
      return this.storageBalance;
    }

    if (operation === CMD_WRITE) {
      this.storageBalance = balance;
      return this.storageBalance;
    }

    return this.storageBalance;
  }
}

class Operations {
  constructor(dataProgram, rl) {
    this.dataProgram = dataProgram;
    this.rl = rl;
  }

  async execute(passedOperation) {
    const operationType = passedOperation;

    if (operationType === OP_TOTAL) {
      const finalBalance = this.dataProgram.execute(CMD_READ);
      console.log(`Current balance: ${finalBalance.toFixed(2)}`);
      return;
    }

    if (operationType === OP_CREDIT) {
      const amount = await this.acceptAmount('Enter credit amount: ');
      if (amount === null) {
        return;
      }

      let finalBalance = this.dataProgram.execute(CMD_READ);
      finalBalance += amount;
      this.dataProgram.execute(CMD_WRITE, finalBalance);
      console.log(`Amount credited. New balance: ${finalBalance.toFixed(2)}`);
      return;
    }

    if (operationType === OP_DEBIT) {
      const amount = await this.acceptAmount('Enter debit amount: ');
      if (amount === null) {
        return;
      }

      let finalBalance = this.dataProgram.execute(CMD_READ);
      if (finalBalance >= amount) {
        finalBalance -= amount;
        this.dataProgram.execute(CMD_WRITE, finalBalance);
        console.log(`Amount debited. New balance: ${finalBalance.toFixed(2)}`);
      } else {
        console.log('Insufficient funds for this debit.');
      }
    }
  }

  async acceptAmount(promptText) {
    const raw = await this.rl.question(promptText);
    const amount = Number.parseFloat(raw);

    if (!Number.isFinite(amount) || amount < 0) {
      console.log('Invalid amount. Please enter a non-negative numeric value.');
      return null;
    }

    return amount;
  }
}

class MainProgram {
  constructor(operations, rl) {
    this.operations = operations;
    this.rl = rl;
    this.continueFlag = 'YES';
  }

  async run() {
    while (this.continueFlag !== 'NO') {
      console.log('--------------------------------');
      console.log('Account Management System');
      console.log('1. View Balance');
      console.log('2. Credit Account');
      console.log('3. Debit Account');
      console.log('4. Exit');
      console.log('--------------------------------');

      const rawChoice = await this.rl.question('Enter your choice (1-4): ');
      const userChoice = Number.parseInt(rawChoice, 10);

      switch (userChoice) {
        case 1:
          await this.operations.execute(OP_TOTAL);
          break;
        case 2:
          await this.operations.execute(OP_CREDIT);
          break;
        case 3:
          await this.operations.execute(OP_DEBIT);
          break;
        case 4:
          this.continueFlag = 'NO';
          break;
        default:
          console.log('Invalid choice, please select 1-4.');
          break;
      }
    }

    console.log('Exiting the program. Goodbye!');
  }
}

async function bootstrap() {
  const rl = readline.createInterface({ input, output });

  try {
    const dataProgram = new DataProgram();
    const operations = new Operations(dataProgram, rl);
    const mainProgram = new MainProgram(operations, rl);
    await mainProgram.run();
  } finally {
    rl.close();
  }
}

module.exports = {
  DataProgram,
  Operations,
  MainProgram,
  bootstrap,
  constants: {
    OP_TOTAL,
    OP_CREDIT,
    OP_DEBIT,
    CMD_READ,
    CMD_WRITE,
  },
};

if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('Unexpected error:', error);
    process.exitCode = 1;
  });
}
