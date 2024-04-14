// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

// Export public key in a usable format
async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
}

// Export private key (for demonstration purposes, handle with caution!)
async function exportPrivateKey(key) {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
}

async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(
        {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

function encryptWithPublicKey(publicKey, text) {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  }





const encryptionDecryptionOriginal = async (message) => {
    const symmetricKey = crypto.randomBytes(32);

    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', symmetricKey, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const encryptedMessage = iv.toString('hex') + ':' + encrypted;

    console.log({encryptedMessage})

    const { publicKey, privateKey } = await generateKeyPair();
    const exportedPublicKey = await exportPublicKey(publicKey);
    const exportedPrivateKey = await exportPrivateKey(privateKey);

    const encryptedKey = encryptWithPublicKey(publicKey, symmetricKey.toString('base64'))
}

const encryptionDecryption = async (message) => {
    var crypto = require('crypto')
        , key = 'salt_from_the_user_document'
        , plaintext = 'password'
        , cipher = crypto.createCipher('aes-256-cbc', key)
        , decipher = crypto.createDecipher('aes-256-cbc', key);
        
    var encryptedPassword = cipher.update(plaintext, 'utf8', 'base64');
    encryptedPassword += cipher.final('base64')
    console.log('encrypted :', encryptedPassword);

    var decryptedPassword = decipher.update(encryptedPassword, 'base64', 'utf8');
    decryptedPassword += decipher.final('utf8');      
    console.log('decrypted :', decryptedPassword);

}

const simpleSolution = (message) => {
    var CryptoJS = require("crypto-js");

    const symmetricKey = crypto.randomBytes(32);

    console.log({symmetricKey})

    // Encrypt
    var ciphertext = CryptoJS.AES.encrypt(message, 'secret key 123').toString();

    // Decrypt
    var bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret key 123');
    var originalText = bytes.toString(CryptoJS.enc.Utf8);

    console.log(originalText);

}

// const message = 'Hello, world!';
// simpleSolution(message);

encryptionDecryption()