'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Communication() {
  const router = useRouter();
  const [caregiverName, setCaregiverName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState(null);
  const [responseHistory, setResponseHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Sample questions for demonstration
  const sampleQuestions = [
    "Are you feeling comfortable?",
    "Would you like some water?",
    "Are you in any pain?",
    "Do you need assistance?",
    "Are you ready for your medication?",
    "Would you like to rest?",
    "Do you want to see a family member?",
    "Are you feeling anxious?",
    "Would you like to change position?",
    "Do you understand what I'm saying?"
  ];

  useEffect(() => {
    // Load caregiver profile from localStorage
    const profile = localStorage.getItem('caregiverProfile');
    if (profile) {
      const data = JSON.parse(profile);
      setCaregiverName(`${data.firstName} ${data.lastName}`);
    } else {
      // Redirect to signup if no profile found
      router.push('/signup');
    }
  }, [router]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access is required for head movement detection. Please allow camera access and try again.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const startListening = () => {
    if (!cameraActive) {
      alert('Please start the camera first to detect head movements.');
      return;
    }
    setIsListening(true);
    setResponse(null);

    // Simulate head movement detection after 3-5 seconds
    const detectionTime = 3000 + Math.random() * 2000;
    setTimeout(() => {
      const detectedResponse = Math.random() > 0.5 ? 'yes' : 'no';
      setResponse(detectedResponse);
      setIsListening(false);

      // Add to history
      if (currentQuestion) {
        setResponseHistory(prev => [{
          question: currentQuestion,
          response: detectedResponse,
          timestamp: new Date().toLocaleTimeString()
        }, ...prev]);
      }
    }, detectionTime);
  };

  const stopListening = () => {
    setIsListening(false);
    setResponse(null);
  };

  const selectRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * sampleQuestions.length);
    setCurrentQuestion(sampleQuestions[randomIndex]);
    setResponse(null);
  };

  const clearHistory = () => {
    setResponseHistory([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('caregiverProfile');
    stopCamera();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Communication Interface
            </h1>
            {caregiverName && (
              <p className="text-gray-600 mt-1">Welcome, {caregiverName}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-white/70 hover:bg-white rounded-xl shadow-lg border border-white/20 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Communication Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Feed */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Head Movement Detection</h2>
                <div className="flex gap-2">
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      Start Camera
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      Stop Camera
                    </button>
                  )}
                </div>
              </div>

              <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p>Camera not active</p>
                      <p className="text-sm">Click "Start Camera" to begin</p>
                    </div>
                  </div>
                )}

                {/* Detection Status Overlay */}
                {cameraActive && (
                  <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-green-500 text-white'
                    }`}>
                      {isListening ? '🔴 Detecting...' : '🟢 Ready'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Question and Response Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Question</h2>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Enter your question or select a sample question..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={selectRandomQuestion}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
                  >
                    Sample
                  </button>
                </div>

                {currentQuestion && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <p className="text-lg font-medium text-blue-900 mb-4">"{currentQuestion}"</p>

                    <div className="flex items-center gap-4">
                      {!isListening ? (
                        <button
                          onClick={startListening}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          Start Detection
                        </button>
                      ) : (
                        <button
                          onClick={stopListening}
                          className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg transition-colors"
                        >
                          Stop Detection
                        </button>
                      )}

                      {response && (
                        <div className={`px-6 py-3 rounded-xl font-semibold text-lg ${
                          response === 'yes' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {response === 'yes' ? '✓ YES' : '✗ NO'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Use</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="space-y-2">
                  <p><strong>For YES:</strong> Nod head up and down</p>
                  <p><strong>For NO:</strong> Shake head left to right</p>
                </div>
                <div className="space-y-2">
                  <p><strong>Detection Time:</strong> 3-5 seconds</p>
                  <p><strong>Camera:</strong> Required for head tracking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Response History */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Response History</h3>
                {responseHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {responseHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No responses yet</p>
                ) : (
                  responseHistory.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        "{item.question}"
                      </p>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-semibold ${
                          item.response === 'yes' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.response === 'yes' ? '✓ YES' : '✗ NO'}
                        </span>
                        <span className="text-xs text-gray-500">{item.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Questions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Questions</h3>
              <div className="space-y-2">
                {sampleQuestions.slice(0, 5).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuestion(question);
                      setResponse(null);
                    }}
                    className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}