// src/components/Header.tsx
import React from "react";

const Header: React.FC = () => (
  <div className="flex items-center justify-between bg-gray-200 p-2 rounded">
    <button onClick={() => window.close()} className="text-red-600 hover:text-red-800">
      Close
    </button>
    <h2 className="text-lg font-semibold text-gray-800">UpWork Scraper</h2>
  </div>
);

export default Header;
