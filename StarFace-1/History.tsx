import React, { useState } from "react";

const historyFacts = [
  {
    title: "The Great Wall of China",
    description:
      "The Great Wall was built over centuries to protect China from invasions. It stretches more than 13,000 miles!",
  },
  {
    title: "Mansa Musa’s Golden Empire",
    description:
      "In the 1300s, Mansa Musa ruled the Mali Empire. He was one of the richest men in history and boosted Islamic education in Africa.",
  },
  {
    title: "Nigeria Gains Independence",
    description:
      "On October 1st, 1960, Nigeria became an independent country, free from British colonial rule.",
  },
  {
    title: "The Invention of Writing",
    description:
      "Writing began in Mesopotamia around 3200 BCE with cuneiform symbols carved into clay tablets.",
  },
];

const History = () => {
  const [index, setIndex] = useState(0);
  const current = historyFacts[index];

  const nextFact = () => {
    setIndex((prev) => (prev + 1) % historyFacts.length);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📚 History Time</h1>
      <h2>{current.title}</h2>
      <p>{current.description}</p>
      <button onClick={nextFact} style={{ marginTop: "1rem" }}>
        ➡️ Next Fact
      </button>
    </div>
  );
};

export default History;
