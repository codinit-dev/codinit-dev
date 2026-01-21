
import { StreamingMessageParser } from './codinit-agent/message-parser.js';
import { makePartId } from './codinit-agent/partId.js';

const parser = new StreamingMessageParser();

function test(input: string) {
    const partId = makePartId('test-message', Math.floor(Math.random() * 1000));
    console.log(`Input: "${input}"`);

    let message = '';
    let result = '';
    const chunks = input.split(''); // Simulate char-by-char streaming like the test

    try {
        for (const chunk of chunks) {
            message += chunk;
            result += parser.parse(partId, message);
        }
        console.log(`Output: "${result}"`);

        // Expected output logic:
        // If input is "Foo bar <codinitA", expected is "Foo bar " (since <codinitA is incomplete and prefix)
        // BUT if it returns "<codinitA", that's a failure because it should be buffering/stripping.

        if (result.includes('<codinit')) {
            console.warn('FAIL: Output contains artifact tag! Parser treated it as text instead of buffering.');
        }
    } catch (e) {
        console.error(e);
    }
}

// Case 5:
test('Foo bar <codinitA');
// Test codinit prefix
test('Foo bar <codinitA');
// Specific failures from test suite
test('Foo bar <b');
test('Foo bar <ba');

