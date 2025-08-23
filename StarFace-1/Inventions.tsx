import React, { useState } from "react";

const inventions = [
  {
    item: "Light Bulb",
    inventor: "Thomas Edison",
    year: "1879",
    fact: "💡 The invention of the light bulb changed how we live at night!",
  },
  {
    item: "Airplane",
    inventor: "Wright Brothers",
    year: "1903",
    fact: "✈️ The first successful powered flight lasted only 12 seconds!",
  },
  {
    item: "Telephone",
    inventor: "Alexander Graham Bell",
    year: "1876",
    fact: "📞 Bell's first words on the phone were: 'Mr. Watson, come here.'",
  },
  {
    item: "Internet",
    inventor: "Tim Berners-Lee",
    year: "1989",
    fact: "🌐 The internet started as a way to share scientific research. Now it connects the world!",
  },
];

const Inventions = () => {
  const [index, setIndex] = useState(0);
  const current = inventions[index];

  const nextItem = () => {
    setIndex((prev) => (prev + 1) % inventions.length);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>💡 Great Inventions</h1>
      <h2>{current.item}</h2>
      <p><strong>Inventor:</strong> {current.inventor}</p>
      <p><strong>Year:</strong> {current.year}</p>
      <p>{current.fact}</p>
      <button onClick={nextItem} style={{ marginTop: "1rem" }}>
        ➡️ Next Invention
      </button>
    </div>
  );
};

export default Inventions;
