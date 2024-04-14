import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to SecureChat</h1>
        <p className="text-lg mb-8">Experience the power of cryptographically secure messaging.</p>
        <div className="space-x-4">
          <Link to="/login">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-md focus:outline-none focus:shadow-outline">
              Log In
            </button>
          </Link>
          <Link to="/register">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-md focus:outline-none focus:shadow-outline">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
