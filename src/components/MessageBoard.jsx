import React, { useState, useEffect } from 'react';
import { GrSecure } from "react-icons/gr";
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';

const MessageBoard = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { userInfo } = useUser();
  const navigate = useNavigate();
  const token = userInfo.token;

  
function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function hexStringToArrayBuffer(hexString) {
  let result = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
      result[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return result.buffer;
}


async function importPrivateKey(pem) {
  const base64Key = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s+/g, '');
  const binaryDer = window.atob(base64Key);
  const keyBuffer = Uint8Array.from(binaryDer, c => c.charCodeAt(0));

  try {
      return await window.crypto.subtle.importKey(
          "pkcs8",
          keyBuffer,
          {
              name: "RSA-OAEP",
              hash: {name: "SHA-256"}
          },
          false,
          ["decrypt"]
      );
  } catch (error) {
      console.error('Failed to import the private key:', error);
      throw new Error('Failed to import the private key');
  }
}

const decryptMessage = async (encryptedMessageWithIV, encryptedSymmetricKey, privateKeyPem) => {
  try {
      const privateKey = await importPrivateKey(privateKeyPem);

      const encryptedSymmetricKeyBuffer = base64ToUint8Array(encryptedSymmetricKey);
      const fullSymmetricKeyBuffer = await window.crypto.subtle.decrypt(
          { name: "RSA-OAEP" },
          privateKey,
          encryptedSymmetricKeyBuffer
      );

      
      const base64EncodedKey = new Uint8Array(fullSymmetricKeyBuffer);
      
      
      const base64String = new TextDecoder().decode(base64EncodedKey);
      
      
      const symmetricKey = base64ToUint8Array(base64String.slice(0, -1));

      const [ivHex, encryptedHex] = encryptedMessageWithIV.split(':');
      const iv = hexStringToArrayBuffer(ivHex);
      const encrypted = hexStringToArrayBuffer(encryptedHex);

      const aesKey = await window.crypto.subtle.importKey(
          "raw",
          symmetricKey,
          { name: "AES-CBC" },
          false,
          ["decrypt"]
      );

      const decryptedMessage = await window.crypto.subtle.decrypt(
          { name: "AES-CBC", iv: new Uint8Array(iv) },
          aesKey,
          encrypted
      );

      return new TextDecoder().decode(decryptedMessage);
  } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed: ' + error.message);
  }
};

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchMessages = async () => {
    try {
      
      const userId = userInfo.username;
      const response = await fetch(`http://localhost:3001/messages?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const encryptedMessages = await response.json();

      const decryptedMessages = await Promise.all(encryptedMessages.map(async (msg) => {

        if (msg.canDecrypt && msg.encryptedKey && localStorage.getItem(userInfo.username)) {
          
          const decryptedText = await decryptMessage(msg.text, msg.encryptedKey, localStorage.getItem(userInfo.username));
          
          return { ...msg, text: decryptedText };
        } else {
          return msg;
        }
      }));

      setMessages(decryptedMessages);
      
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const postMessage = async () => {
    if (!newMessage.trim()) {
      alert('Please enter a message before sending!');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3001/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userInfo.username,
          text: newMessage,
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post message');
      }
  
      const postedMessage = await response.json();
      setMessages(messages => [...messages, postedMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error posting message:', error);
      alert(error.message || 'Failed to send message.');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <GrSecure className="text-3xl mx-2" />
          <h1 className="text-3xl font-bold text-gray-800">SecureChat</h1>
        </div>
        <div className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg mr-4">
          <span>Logged in as: {userInfo.username}</span>
        </div>
        <button onClick={() => navigate('/')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
      </div>
      <div className="overflow-y-auto px-4 py-2 flex-1">
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            <div className="text-sm text-gray-500">From: {message.author ? message.author.username : "Anonymous"}</div>
            <div className="mt-1 p-2 bg-gray-100 rounded">{message.text ? message.text : ""}</div>
          </div>
        ))}
        <div className="p-4 border-t border-gray-200">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <button
            onClick={postMessage}
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBoard;


