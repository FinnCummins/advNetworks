import React, { useState } from 'react';

const ManagementConsole = () => {
  const [newUser, setNewUser] = useState('');

  const postUser = async () => {
    if (!newUser.trim()) {
      alert('Please enter a username before sending!');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3001/newuser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUser,
        })
      });

      if (response.ok) {
        console.log('User succesfully added');
      }
      else if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post new user');
      }

    } catch (error) {
      console.error('Error posting user:', error);
      alert(error.message || 'Failed to add new user.');
    }
    setNewUser('')
  };

  return (
    <div className="bg-gray-200 min-h-screen flex flex-col justify-center items-center text-black">
      <p className="text-3xl">Welcome to the management console!</p>
      <p className="text-xl">Here you can add new users to the secure application.</p>
      <div className="p-4 border-t border-gray-200">
          <input
            type="text"
            placeholder="Add a new user..."
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <button
            onClick={postUser}
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Send
          </button>
        </div>
    </div>
  );
};

export default ManagementConsole;
