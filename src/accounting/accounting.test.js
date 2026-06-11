const {
  DataProgram,
  Operations,
  MainProgram,
  constants,
} = require('./index');

function createMockRl(inputs) {
  let cursor = 0;
  return {
    question: jest.fn(async () => {
      const value = inputs[cursor];
      cursor += 1;
      return value ?? '';
    }),
    close: jest.fn(),
  };
}

async function runMainWithInputs(inputs, dataProgram = new DataProgram()) {
  const rl = createMockRl(inputs);
  const operations = new Operations(dataProgram, rl);
  const mainProgram = new MainProgram(operations, rl);
  await mainProgram.run();
  return { rl, dataProgram, operations };
}

describe('COBOL parity test plan scenarios', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('TC-001: displays main menu options on startup', async () => {
    const { rl } = await runMainWithInputs(['4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Account Management System');
    expect(output).toContain('1. View Balance');
    expect(output).toContain('2. Credit Account');
    expect(output).toContain('3. Debit Account');
    expect(output).toContain('4. Exit');
    expect(rl.question).toHaveBeenCalledWith('Enter your choice (1-4): ');
  });

  test('TC-002: handles invalid menu choice below range', async () => {
    const { rl } = await runMainWithInputs(['0', '4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Invalid choice, please select 1-4.');
    expect(rl.question).toHaveBeenCalledTimes(2);
  });

  test('TC-003: handles invalid menu choice above range', async () => {
    const { rl } = await runMainWithInputs(['5', '4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Invalid choice, please select 1-4.');
    expect(rl.question).toHaveBeenCalledTimes(2);
  });

  test('TC-004: shows default balance before any transactions', async () => {
    await runMainWithInputs(['1', '4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Current balance: 1000.00');
  });

  test('TC-005: credits account with a valid amount', async () => {
    await runMainWithInputs(['2', '250.00', '1', '4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Amount credited. New balance: 1250.00');
    expect(output).toContain('Current balance: 1250.00');
  });

  test('TC-006: debits account with amount less than balance', async () => {
    await runMainWithInputs(['3', '200.00', '1', '4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Amount debited. New balance: 800.00');
    expect(output).toContain('Current balance: 800.00');
  });

  test('TC-007: allows debit when amount equals current balance', async () => {
    const dataProgram = new DataProgram();
    dataProgram.execute(constants.CMD_WRITE, 300.0);

    await runMainWithInputs(['3', '300.00', '1', '4'], dataProgram);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Amount debited. New balance: 0.00');
    expect(output).toContain('Current balance: 0.00');
  });

  test('TC-008: prevents debit when amount exceeds balance', async () => {
    await runMainWithInputs(['3', '1000.01', '1', '4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Insufficient funds for this debit.');
    expect(output).toContain('Current balance: 1000.00');
  });

  test('TC-009: multiple credits accumulate correctly', async () => {
    await runMainWithInputs(['2', '100.00', '2', '50.50', '1', '4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Current balance: 1150.50');
  });

  test('TC-010: mixed credit and debit sequence computes final balance', async () => {
    await runMainWithInputs(['2', '200.00', '3', '75.25', '1', '4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Current balance: 1124.75');
  });

  test('TC-011: balance inquiry is non-mutating across repeated reads', async () => {
    await runMainWithInputs(['2', '10.00', '1', '1', '4']);

    const balanceReads = logSpy.mock.calls
      .map(([line]) => line)
      .filter((line) => line.startsWith('Current balance: '));

    expect(balanceReads).toEqual(['Current balance: 1010.00', 'Current balance: 1010.00']);
  });

  test('TC-012: menu loop continues after each non-exit action', async () => {
    const rl = createMockRl(['1', '2', '3', '4']);
    const fakeOperations = { execute: jest.fn(async () => {}) };
    const mainProgram = new MainProgram(fakeOperations, rl);

    await mainProgram.run();

    expect(fakeOperations.execute).toHaveBeenNthCalledWith(1, constants.OP_TOTAL);
    expect(fakeOperations.execute).toHaveBeenNthCalledWith(2, constants.OP_CREDIT);
    expect(fakeOperations.execute).toHaveBeenNthCalledWith(3, constants.OP_DEBIT);
    expect(fakeOperations.execute).toHaveBeenCalledTimes(3);
    expect(rl.question).toHaveBeenCalledTimes(4);
  });

  test('TC-013: exits application from menu with goodbye message', async () => {
    await runMainWithInputs(['4']);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Exiting the program. Goodbye!');
  });

  test('TC-014: modified balance does not persist across separate runs', async () => {
    const run1Data = new DataProgram();
    await runMainWithInputs(['2', '100.00', '4'], run1Data);
    expect(run1Data.execute(constants.CMD_READ)).toBe(1100.0);

    logSpy.mockClear();

    const run2Data = new DataProgram();
    await runMainWithInputs(['1', '4'], run2Data);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Current balance: 1000.00');
  });

  test('TC-015: debits full remaining amount after prior transactions', async () => {
    const dataProgram = new DataProgram();
    dataProgram.execute(constants.CMD_WRITE, 450.0);

    await runMainWithInputs(['3', '450.00', '1', '4'], dataProgram);

    const output = logSpy.mock.calls.map(([line]) => line);
    expect(output).toContain('Amount debited. New balance: 0.00');
    expect(output).toContain('Current balance: 0.00');
  });
});
