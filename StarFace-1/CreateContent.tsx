import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Fact {
  id: string;
  title: string;
  content: string;
  category: string;
  username: string;
  createdAt: string;
}

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  category: string;
  username: string;
  createdAt: string;
}

const CreateContent: React.FC = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState<'fact' | 'quiz'>('fact');
  const [username, setUsername] = useState(() => 
    localStorage.getItem('myUsername') || ''
  );

  // Fact form state
  const [factTitle, setFactTitle] = useState('');
  const [factContent, setFactContent] = useState('');
  const [factCategory, setFactCategory] = useState('Science');

  // Quiz form state
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [quizCategory, setQuizCategory] = useState('General');

  const [message, setMessage] = useState('');

  const categories = ['Science', 'History', 'Geography', 'Math', 'Literature', 'General'];

  const handleUsernameSet = () => {
    if (username.trim()) {
      localStorage.setItem('myUsername', username.trim());
    }
  };

  const handleFactSubmit = () => {
    if (!username.trim()) {
      setMessage('❗ Please enter your username first');
      return;
    }
    if (!factTitle.trim() || !factContent.trim()) {
      setMessage('❗ Please fill in all fields');
      return;
    }

    const newFact: Fact = {
      id: Date.now().toString(),
      title: factTitle.trim(),
      content: factContent.trim(),
      category: factCategory,
      username: username.trim(),
      createdAt: new Date().toISOString()
    };

    const existingFacts = JSON.parse(localStorage.getItem('userFacts') || '[]');
    existingFacts.push(newFact);
    localStorage.setItem('userFacts', JSON.stringify(existingFacts));

    setMessage('✅ Fact submitted successfully!');
    setFactTitle('');
    setFactContent('');
    setFactCategory('Science');
  };

  const handleQuizSubmit = () => {
    if (!username.trim()) {
      setMessage('❗ Please enter your username first');
      return;
    }
    if (!quizQuestion.trim() || quizOptions.some(opt => !opt.trim())) {
      setMessage('❗ Please fill in all fields');
      return;
    }

    const newQuiz: Quiz = {
      id: Date.now().toString(),
      question: quizQuestion.trim(),
      options: quizOptions.map(opt => opt.trim()),
      correctAnswer: quizOptions[correctAnswer].trim(),
      category: quizCategory,
      username: username.trim(),
      createdAt: new Date().toISOString()
    };

    const existingQuizzes = JSON.parse(localStorage.getItem('userQuizzes') || '[]');
    existingQuizzes.push(newQuiz);
    localStorage.setItem('userQuizzes', JSON.stringify(existingQuizzes));

    setMessage('✅ Quiz submitted successfully!');
    setQuizQuestion('');
    setQuizOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setQuizCategory('General');
  };

  const updateQuizOption = (index: number, value: string) => {
    const newOptions = [...quizOptions];
    newOptions[index] = value;
    setQuizOptions(newOptions);
  };

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate("/lounge")} style={backButtonStyle}>
        ⬅️ Back to Learning Lounge
      </button>
      
      <h1 style={titleStyle}>✍️ Create Content</h1>
      <p style={subtitleStyle}>Share your knowledge with the community!</p>

      {/* Username Section */}
      {!localStorage.getItem('myUsername') && (
        <div style={usernameSection}>
          <h3>👤 Set Your Username</h3>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleUsernameSet} style={setUsernameButton}>
            Set Username
          </button>
        </div>
      )}

      {username && (
        <>
          {/* Content Type Selector */}
          <div style={selectorStyle}>
            <button
              onClick={() => setContentType('fact')}
              style={{
                ...typeButtonStyle,
                backgroundColor: contentType === 'fact' ? '#4CAF50' : 'rgba(255,255,255,0.2)'
              }}
            >
              📚 Create Fact
            </button>
            <button
              onClick={() => setContentType('quiz')}
              style={{
                ...typeButtonStyle,
                backgroundColor: contentType === 'quiz' ? '#2196F3' : 'rgba(255,255,255,0.2)'
              }}
            >
              🧠 Create Quiz
            </button>
          </div>

          {/* Fact Form */}
          {contentType === 'fact' && (
            <div style={formStyle}>
              <h3>📚 Create a New Fact</h3>
              
              <label style={labelStyle}>Fact Title:</label>
              <input
                type="text"
                placeholder="e.g., Amazing Ocean Discovery"
                value={factTitle}
                onChange={(e) => setFactTitle(e.target.value)}
                style={inputStyle}
              />

              <label style={labelStyle}>Category:</label>
              <select
                value={factCategory}
                onChange={(e) => setFactCategory(e.target.value)}
                style={selectStyle}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <label style={labelStyle}>Fact Content:</label>
              <textarea
                placeholder="Share an interesting fact..."
                value={factContent}
                onChange={(e) => setFactContent(e.target.value)}
                style={textareaStyle}
                rows={4}
              />

              <button onClick={handleFactSubmit} style={submitButtonStyle}>
                📝 Submit Fact
              </button>
            </div>
          )}

          {/* Quiz Form */}
          {contentType === 'quiz' && (
            <div style={formStyle}>
              <h3>🧠 Create a New Quiz Question</h3>
              
              <label style={labelStyle}>Question:</label>
              <input
                type="text"
                placeholder="e.g., What is the capital of France?"
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                style={inputStyle}
              />

              <label style={labelStyle}>Category:</label>
              <select
                value={quizCategory}
                onChange={(e) => setQuizCategory(e.target.value)}
                style={selectStyle}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <label style={labelStyle}>Answer Options:</label>
              {quizOptions.map((option, index) => (
                <div key={index} style={optionContainerStyle}>
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateQuizOption(index, e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === index}
                    onChange={() => setCorrectAnswer(index)}
                    style={radioStyle}
                  />
                  <span style={radioLabelStyle}>Correct</span>
                </div>
              ))}

              <button onClick={handleQuizSubmit} style={submitButtonStyle}>
                🧠 Submit Quiz
              </button>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div style={messageStyle}>
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: "30px",
  maxWidth: "800px",
  margin: "auto",
  fontFamily: "'Segoe UI', sans-serif",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  minHeight: "100vh",
  color: "#fff"
};

const backButtonStyle: React.CSSProperties = {
  marginBottom: "20px",
  padding: "10px 20px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.2)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.3)",
  cursor: "pointer",
  fontSize: "16px"
};

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "2.5rem",
  marginBottom: "10px",
  textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
};

const subtitleStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "1.2rem",
  opacity: 0.9,
  marginBottom: "30px"
};

const usernameSection: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  borderRadius: "16px",
  padding: "25px",
  marginBottom: "30px",
  textAlign: "center"
};

const setUsernameButton: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: "8px",
  background: "#4CAF50",
  color: "#fff",
  border: "none",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
  marginLeft: "10px"
};

const selectorStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "15px",
  marginBottom: "30px"
};

const typeButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: "25px",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "#fff",
  cursor: "pointer",
  fontSize: "1.1rem",
  fontWeight: "bold",
  transition: "all 0.3s ease"
};

const formStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  borderRadius: "16px",
  padding: "30px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "1.1rem",
  fontWeight: "bold",
  marginBottom: "8px",
  marginTop: "15px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 15px",
  fontSize: "1rem",
  borderRadius: "8px",
  border: "2px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.9)",
  color: "#333",
  marginBottom: "15px"
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer"
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "100px"
};

const optionContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "10px"
};

const radioStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
  cursor: "pointer"
};

const radioLabelStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  fontWeight: "500"
};

const submitButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  fontSize: "1.2rem",
  fontWeight: "bold",
  borderRadius: "12px",
  background: "#4CAF50",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  marginTop: "20px",
  transition: "all 0.3s ease"
};

const messageStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "1.1rem",
  fontWeight: "bold",
  marginTop: "20px",
  padding: "15px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.1)"
};

export default CreateContent;