'use client';
import react, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Sun, Moon, Video, VideoOff, UserPlus, LogIn, Send } from 'lucide-react';
import './styles/globals.css';

// Mock head detection logic - replace with your actual implementation
const useMockHeadNod = (onNod, onShake) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'y' || e.key === 'Y') {
        onNod();
      } else if (e.key === 'n' || e.key === 'N') {
        onShake();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNod, onShake]);
};


// Main App Component
export default function AssistantCaretakerApp() {
  const [page, setPage] = useState('landing'); // landing, auth, caretakerDashboard, patientView
  const [theme, setTheme] = useState('dark');
  const [caretaker, setCaretaker] = useState(null);
  const [patients, setPatients] = useState([
      { id: 1, name: 'John Doe', pin: '123456' },
      { id: 2, name: 'Jane Smith', pin: '654321' },
  ]);
  const [connectedPin, setConnectedPin] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [lastAnswer, setLastAnswer] = useState(null); // 'yes', 'no', or null
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = () => {
    // Mock login
    setCaretaker({ name: 'Dr. Alex' });
    setPage('caretakerDashboard');
  };

  const handleConnectToPatient = (pin) => {
    setConnectedPin(pin);
    setCurrentQuestion('');
    setLastAnswer(null);
  };

  const handleAskQuestion = (question) => {
    setCurrentQuestion(question);
    setLastAnswer(null); // Reset answer when a new question is asked
  };

  const handleReceiveAnswer = (answer) => {
    setLastAnswer(answer);
    // Add a slight delay before clearing the question for a better UX
    setTimeout(() => {
        setCurrentQuestion('');
    }, 2000);
  };
  
  const handleAddNewPatient = (name) => {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const newPatient = { id: Date.now(), name, pin };
      setPatients([...patients, newPatient]);
      setShowNewPatientModal(false);
  };

  const renderPage = () => {
    switch (page) {
      case 'auth':
        return <AuthScreen onLogin={handleLogin} onSwitchToPatient={() => setPage('patientView')} />;
      case 'caretakerDashboard':
        return (
          <CaretakerDashboard
            caretaker={caretaker}
            patients={patients}
            connectedPin={connectedPin}
            onConnect={handleConnectToPatient}
            onAskQuestion={handleAskQuestion}
            lastAnswer={lastAnswer}
            currentQuestion={currentQuestion}
            onShowNewPatientModal={() => setShowNewPatientModal(true)}
          />
        );
      case 'patientView':
        return <PatientScreen onAnswer={handleReceiveAnswer} question={currentQuestion} />;
      case 'landing':
      default:
        return <LandingScreen onNavigate={setPage} />;
    }
  };

  return (
    <div className={`min-h-screen font-sans antialiased ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <ThemeToggler theme={theme} toggleTheme={toggleTheme} />
      <main className="p-4 sm:p-6 md:p-8">
        {renderPage()}
        {showNewPatientModal && (
            <NewPatientModal 
                onClose={() => setShowNewPatientModal(false)}
                onAddPatient={handleAddNewPatient}
            />
        )}
      </main>
    </div>
  );
}

// -- SCREENS -- //

const LandingScreen = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
    <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <h1 className="relative text-6xl sm:text-7xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-500">
            SoulSpeak
        </h1>
    </div>
    <p className="mt-4 text-lg md:text-xl text-gray-400 dark:text-gray-500 max-w-md">
      Bridging communication gaps with a simple gesture. Your assistant caretaker.
    </p>
    <div className="mt-12 flex flex-col sm:flex-row gap-4">
      <button onClick={() => onNavigate('auth')} className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-offset-gray-900 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600">
        I'm a Caretaker <LogIn className="ml-2 h-5 w-5"/>
      </button>
      <button onClick={() => onNavigate('patientView')} className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-teal-500 transition-all duration-200 bg-transparent border-2 border-teal-500 rounded-xl hover:bg-teal-500 hover:text-white">
        I'm a Patient <ChevronRight className="ml-2 h-5 w-5"/>
      </button>
    </div>
  </div>
);

const AuthScreen = ({ onLogin, onSwitchToPatient }) => {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div>
          <h2 className="text-3xl font-bold text-center">Caretaker Portal</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input id="email-address" name="email" type="email" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm" placeholder="Email address" defaultValue="alex@caretaker.io" />
            </div>
            <div>
              <input id="password" name="password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm" placeholder="Password" defaultValue="password" />
            </div>
          </div>
          <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-800">
            Sign In
          </button>
        </form>
         <p className="mt-4 text-center text-sm">
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToPatient(); }} className="font-medium text-teal-500 hover:text-teal-400">
              Switch to Patient View
            </a>
        </p>
      </div>
    </div>
  );
};

const CaretakerDashboard = ({ caretaker, patients, connectedPin, onConnect, onAskQuestion, lastAnswer, currentQuestion, onShowNewPatientModal }) => {
    const [questionInput, setQuestionInput] = useState('');
    const connectedPatient = patients.find(p => p.pin === connectedPin);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (questionInput.trim()) {
            onAskQuestion(questionInput);
            setQuestionInput('');
        }
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Patient List */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Patients</h2>
                    <button onClick={onShowNewPatientModal} className="p-2 rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-colors">
                        <UserPlus size={20} />
                    </button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {patients.map(patient => (
                        <div key={patient.id} className={`p-4 rounded-lg transition-all duration-300 ${connectedPin === patient.pin ? 'bg-teal-500/20 ring-2 ring-teal-500' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{patient.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">PIN: {patient.pin}</p>
                                </div>
                                <button onClick={() => onConnect(patient.pin)} disabled={connectedPin === patient.pin} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
                                    {connectedPin === patient.pin ? 'Connected' : 'Connect'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Interaction Area */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg flex flex-col">
                <h2 className="text-2xl font-bold mb-4">Interaction Terminal</h2>
                {connectedPin ? (
                    <div className="flex-grow flex flex-col justify-between">
                        <div className="mb-4">
                            <p className="text-gray-500 dark:text-gray-400">Connected to <span className="font-bold text-teal-500">{connectedPatient?.name}</span> (PIN: {connectedPin})</p>
                        </div>
                        
                        {/* Display Area */}
                        <div className="flex-grow bg-gray-100 dark:bg-gray-900 rounded-lg p-6 flex flex-col justify-center items-center text-center transition-all duration-500">
                             {lastAnswer ? (
                                <div className={`text-8xl font-bold animate-pulse ${lastAnswer === 'yes' ? 'text-green-500' : 'text-red-500'}`}>
                                    {lastAnswer.toUpperCase()}
                                </div>
                            ) : currentQuestion ? (
                                <div>
                                    <p className="text-sm text-gray-500">Question Sent:</p>
                                    <p className="text-2xl md:text-3xl font-semibold mt-2">"{currentQuestion}"</p>
                                    <div className="mt-6 text-gray-400 animate-pulse">Waiting for response...</div>
                                </div>
                            ) : (
                                <p className="text-xl text-gray-500">Ask a question below to begin.</p>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleFormSubmit} className="mt-6 flex gap-3">
                            <input
                                type="text"
                                value={questionInput}
                                onChange={(e) => setQuestionInput(e.target.value)}
                                placeholder="Type your yes/no question here..."
                                className="flex-grow px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-teal-500 focus:ring-0 rounded-md transition-colors"
                            />
                            <button type="submit" className="px-6 py-3 font-semibold rounded-md text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-2 transition-colors">
                                <Send size={18} /> Ask
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                        <p className="text-xl">Please select a patient to connect with.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const PatientScreen = ({ onAnswer, question }) => {
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [feedback, setFeedback] = useState(null); // 'yes', 'no', or null
  const videoRef = useRef(null);

  const showFeedback = (answer) => {
    setFeedback(answer);
    onAnswer(answer);
    setTimeout(() => setFeedback(null), 1500); // Display feedback for 1.5 seconds
  };

  // Replace this with your actual head detection library
  useMockHeadNod(() => showFeedback('yes'), () => showFeedback('no'));

  useEffect(() => {
    if (webcamEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing webcam:", err);
          setWebcamEnabled(false);
        });
    } else {
        if(videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [webcamEnabled]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[90vh] text-center p-4">
      {/* Background Feedback */}
      <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${feedback === 'yes' ? 'bg-green-500/30' : feedback === 'no' ? 'bg-red-500/30' : 'bg-transparent'}`}></div>
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl">
        {question ? (
          <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {question}
            </h2>
          </div>
        ) : (
          <p className="text-2xl text-gray-500 dark:text-gray-400">Waiting for a question from the caretaker...</p>
        )}

        {feedback && (
          <div className="mt-12 text-8xl md:text-9xl font-extrabold animate-pulse">
            <span className={feedback === 'yes' ? 'text-green-500' : 'text-red-500'}>
              {feedback.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Webcam and Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3">
          <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-48 h-36 rounded-lg object-cover bg-gray-900 transition-all duration-300 ${webcamEnabled ? 'opacity-100' : 'opacity-0 h-0 w-0'}`}
          ></video>
          <button
              onClick={() => setWebcamEnabled(!webcamEnabled)}
              className="p-3 rounded-full bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm text-white hover:bg-white/30 dark:hover:bg-gray-700/60 transition-colors"
          >
              {webcamEnabled ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
          <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-lg text-xs text-center">
              <p>For Demo:</p>
              <p>Press 'Y' for YES, 'N' for NO</p>
          </div>
      </div>
    </div>
  );
};

// -- UI COMPONENTS -- //

const ThemeToggler = ({ theme, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-gray-700/60 transition-colors"
    aria-label="Toggle theme"
  >
    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
  </button>
);

const NewPatientModal = ({ onClose, onAddPatient }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if(name.trim()) {
            onAddPatient(name);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Register New Patient</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Patient's Full Name"
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-teal-500 focus:ring-0 rounded-md transition-colors mb-4"
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-colors">
                            Add Patient
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
