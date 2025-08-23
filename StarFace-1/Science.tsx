import React, { useState } from "react";

const scienceFacts = [
  {
    title: "Water is Weird",
    fact: "💧 Water expands when it freezes — that's why ice floats!",
  },
  {
    title: "Lightning is Hotter Than the Sun",
    fact: "⚡ A bolt of lightning can reach temperatures of 30,000°C — hotter than the surface of the sun!",
  },
  {
    title: "Plants Make Their Own Food",
    fact: "🌿 Through photosynthesis, plants use sunlight to make sugar and oxygen.",
  },
  {
    title: "Your Stomach Has Acid Power",
    fact: "🧪 The acid in your stomach is strong enough to dissolve metal — it’s called hydrochloric acid!",
  },
];

const Science = () => {
  const [index, setIndex] = useState(0);
  const current = scienceFacts[index];

  const nextFact = () => {
    setIndex((prev) => (prev + 1) % scienceFacts.length);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🔬 Fun Science Facts</h1>
      <h2>{current.title}</h2>
      <p>{current.fact}</p>
      <button onClick={nextFact} style={{ marginTop: "1rem" }}>
        ➡️ Next Fact
      </button>
    </div>
  );
};

export default Science;
