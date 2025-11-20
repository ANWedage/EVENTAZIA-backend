const nodemailer = require('nodemailer');

console.log('Nodemailer object:', nodemailer);
console.log('Nodemailer keys:', Object.keys(nodemailer));
console.log('createTransporter:', typeof nodemailer.createTransporter);

// Check if it's a default export
if (nodemailer.default) {
  console.log('Default export exists:', typeof nodemailer.default.createTransporter);
}
