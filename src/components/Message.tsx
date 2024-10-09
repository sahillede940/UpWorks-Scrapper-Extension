// src/components/Message.tsx
import React from "react";

interface MessageProps {
  message: string;
}

const Message: React.FC<MessageProps> = ({ message }) => (
  <div className="bg-white">
    {message && (
      <h4 className="text-gray-800 bg-gray-100 border-blue-500 px-2 rounded shadow-md flex items-center space-x-2 mb-2">
        {/* ...SVG spinner */}
        {message}
      </h4>
    )}
  </div>
);

export default Message;
