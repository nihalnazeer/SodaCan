import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const [publicRooms, setPublicRooms] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchPublicRooms = async () => {
      try {
        const rooms = await api.getPublicRooms();
        setPublicRooms(rooms);
      } catch (err) {
        console.error('Error fetching public rooms:', err);
        setError('Failed to load public rooms. Please try again later.');
      }
    };
    fetchPublicRooms();
  }, []);

  const handleJoinRoom = async (roomId) => {
    try {
      await api.joinPublicRoom(roomId);
      setSuccessMessage(`Successfully joined room ${roomId}!`);
      setTimeout(() => setSuccessMessage(null), 3000); // Hide popup after 3s
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      {/* Success Popup */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {/* Header Section */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">SodaCan</h1>
        <p className="text-xl text-gray-300 mb-6">
          Connect, Chat, Collaborate
        </p>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          SodaCan is your go-to platform for real-time communication. Join public
          rooms to meet new people, create private rooms for exclusive discussions,
          and enjoy a seamless chat experience powered by modern technology.
        </p>
        <Link to="/dashboard">
          <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300">
            Go to Dashboard
          </button>
        </Link>
      </header>

      {/* Public Rooms Section */}
      <section className="w-full max-w-5xl">
        <h2 className="text-3xl font-semibold mb-6">Public Rooms</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {publicRooms.length === 0 && !error ? (
          <p className="text-gray-400">No public rooms available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
              >
                <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                <p className="text-gray-400 mb-4">
                  {room.description || 'Join this vibrant community!'}
                </p>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg w-full transition duration-300"
                >
                  Join Room
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;