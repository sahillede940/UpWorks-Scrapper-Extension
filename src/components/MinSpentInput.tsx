// src/components/MinSpentInput.tsx
import React from "react";

interface MinSpentInputProps {
  minSpent: number;
  setMinSpent: (value: number) => void;
}

const MinSpentInput: React.FC<MinSpentInputProps> = ({ minSpent, setMinSpent }) => (
  <div className="mb-4 flex items-center">
    <label htmlFor="min-spent" className="text-gray-700 font-medium w-28">
      Min Spent:
    </label>
    <div className="relative flex-1">
      <input
        type="number"
        id="min-spent"
        value={minSpent}
        onChange={(e) => setMinSpent(Number(e.target.value))}
        className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 pl-8"
        placeholder="Enter minimum amount"
      />
      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
    </div>
  </div>
);

export default MinSpentInput;
