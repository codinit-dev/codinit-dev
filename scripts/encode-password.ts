#!/usr/bin/env tsx

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
URL Password Encoder for Database Connection Strings

Usage:
  tsx scripts/encode-password.ts <password>

Example:
  tsx scripts/encode-password.ts "myPass$123!"

This will output the URL-encoded version of your password that you can
safely use in DATABASE_URL connection strings.
  `);
  process.exit(0);
}

const password = args[0];
const encoded = encodeURIComponent(password);

console.log('\nOriginal password:', password);
console.log('Encoded password:', encoded);
console.log('\nUse this in your .env file:');
console.log(`DATABASE_URL=postgresql://username:${encoded}@host:port/database\n`);
