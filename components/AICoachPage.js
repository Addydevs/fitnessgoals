/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Send, Mic, Crown, Zap, Upload, User, Bot, Lock, Star, Settings, MoreHorizontal } from 'lucide-react';

const AICoachPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI Coach. Upload a progress photo or ask me anything about your fitness journey!",
      timestamp: new Date(),
      hasPhoto: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [freeChatsLeft, setFreeChatsLeft] = useState(2);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!isPremium && freeChatsLeft <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      hasPhoto: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    if (!isPremium) {
      setFreeChatsLeft(prev => prev - 1);
    }

    const isPremiumQuery = checkIfPremiumQuery(inputMessage);
    if (isPremiumQuery && !isPremium) {
      setTimeout(() => {
        setShowUpgradeModal(true);
        setIsLoading(false);
      }, 1500);
      return;
    }

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: getAIResponse(inputMessage),
        timestamp: new Date(),
        hasPhoto: false
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const checkIfPremiumQuery = (message) => {
    const premiumKeywords = ['food', 'meal', 'diet', 'nutrition', 'workout', 'exercise', 'routine', 'plan', 'advice', 'focus', 'recommend', 'suggest', 'should', 'tips', 'help'];
    return premiumKeywords.some(keyword => message.toLowerCase().includes(keyword));
  };

  const getAIResponse = (userMessage) => {
    if (userMessage.toLowerCase().includes("progress looking") || userMessage.toLowerCase().includes("progress scan")) {
      const progressResponses = [
        "🚀 AI Progress Scan Complete!\n\nQuick Results:\n• Consistency Score: 92/100\n• Photo Quality: Excellent\n• Progress Trend: Improving\n\nYour dedication is showing! 💪",
        "🔥 AI Scan Results In!\n\nInstant Analysis:\n• Tracking Streak: 12 days\n• Photo Timing: Perfect\n• Motivation Level: High\n\nKeep up the amazing work! 📈",
        "⚡ Progress Scan Complete!\n\nKey Insights:\n• Commitment Level: Outstanding\n• Progress Pattern: Steady\n• Success Rate: 89%\n\nYou're absolutely crushing it! 🎯"
      ];
      return progressResponses[Math.floor(Math.random() * progressResponses.length)];
    }

    const responses = [
      "Great progress! I can see improvement in your consistency. Keep taking those weekly photos!",
      "Based on your progress photos, you're on the right track. Your dedication is showing!",
      "I notice you've been consistent with your photo tracking. That's the key to long-term success!",
      "Your weekly streak is impressive! Consistency like this leads to real results.",
      "I'm here to help analyze your progress and answer any fitness questions you have!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handlePremiumButtonClick = (message) => {
    setInputMessage(message);
    setShowUpgradeModal(true);
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const photoMessage = {
      id: Date.now(),
      type: 'user',
      content: 'Uploaded progress photo for analysis',
      timestamp: new Date(),
      hasPhoto: true,
      photoUrl: URL.createObjectURL(file)
    };

    setMessages(prev => [...prev, photoMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const analysisResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Great photo! I can see your commitment to tracking progress. Your posture looks good and you're maintaining consistency with your weekly photos. Keep up the excellent work!",
        timestamp: new Date(),
        hasPhoto: false
      };
      setMessages(prev => [...prev, analysisResponse]);
      setIsLoading(false);
    }, 2000);

    setShowUpload(false);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto bg-gray-50 min-h-screen flex flex-col">
        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-2">
          <div className="text-sm font-medium">9:41</div>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
            <div className="ml-2 text-sm">📶</div>
            <div className="text-sm">🔋</div>
          </div>
        </div>
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-4 pb-6">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">AI Coach</h1>
          <button 
            onClick={() => setIsPremium(!isPremium)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              isPremium 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Crown className="w-3 h-3" />
            {isPremium ? 'Pro' : 'Free'}
          </button>
        </div>
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-gray-900 text-white rounded-br-md'
                      : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-sm'
                  }`}
                >
                  {message.hasPhoto && message.photoUrl && (
                    <div className="mb-3">
                      <img 
                        src={message.photoUrl} 
                        alt="Progress photo" 
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
                {message.content.includes("Progress Scan Complete") && !isPremium && (
                  <div className="mt-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <span className="font-semibold text-sm text-gray-900">Full Analysis Available</span>
                      </div>
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600 mb-3">Get detailed body measurements, progress predictions, and personalized improvement tips</p>
                    <button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full bg-gray-900 text-white py-2 px-4 rounded-xl text-sm font-medium"
                    >
                      View Full Report
                    </button>
                  </div>
                )}
                <div className={`flex items-center gap-2 mt-2 px-2 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-gray-900' 
                      : 'bg-gray-100'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-3 h-3 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 text-gray-600" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md p-4 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="px-6 mb-6">
            <div className="space-y-4">
              <button 
                onClick={() => setInputMessage("How's my progress looking?")}
                className="w-full bg-white rounded-3xl p-7 shadow-lg border border-gray-100 text-left relative overflow-hidden group"
                style={{
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
                  background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-green-50/30"></div>
                <div className="absolute top-6 right-6 w-12 h-12 bg-blue-400/20 rounded-full blur-lg"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">AI Progress Scan</h3>
                      <p className="text-gray-600 text-sm mb-3">Get your instant body change analysis</p>
                      <div className="flex items-center gap-1 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Free</span>
                      </div>
                    </div>
                    <div className="relative">
                      <Zap 
                        className="w-10 h-10 text-blue-500 relative z-10"
                        style={{
                          animation: 'pulse-glow 10s infinite',
                          filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </button>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => handlePremiumButtonClick("What should I focus on?")}
                  className="bg-white rounded-2xl p-4 shadow-sm text-left relative overflow-hidden hover:shadow-md transition-shadow"
                  style={{
                    border: '1px solid #F59E0B',
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Get Advice</h4>
                        <p className="text-amber-700 text-xs font-medium mb-1">Unlimited fitness & nutrition Q&A</p>
                        <p className="text-amber-600 text-xs">Get expert tips instantly</p>
                      </div>
                      <Crown className="w-5 h-5 text-yellow-500 drop-shadow-sm" />
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => handlePremiumButtonClick("Suggest a workout routine")}
                  className="bg-white rounded-2xl p-4 shadow-sm text-left relative overflow-hidden hover:shadow-md transition-shadow"
                  style={{
                    border: '1px solid #F59E0B',
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Workout Plan</h4>
                        <p className="text-amber-700 text-xs font-medium mb-1">Weekly custom AI workouts</p>
                        <p className="text-amber-600 text-xs">Updated every week for you</p>
                      </div>
                      <Crown className="w-5 h-5 text-yellow-500 drop-shadow-sm" />
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => handlePremiumButtonClick("Create a meal plan")}
                  className="bg-white rounded-2xl p-4 shadow-sm text-left relative overflow-hidden hover:shadow-md transition-shadow"
                  style={{
                    border: '1px solid #F59E0B',
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Meal Plan</h4>
                        <p className="text-amber-700 text-xs font-medium mb-1">Macro-friendly daily meal guide</p>
                        <p className="text-amber-600 text-xs">Easy recipes & macros included</p>
                      </div>
                      <Crown className="w-5 h-5 text-yellow-500 drop-shadow-sm" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        <style jsx>{`
          @keyframes pulse-glow {
            0%, 90% { 
              transform: scale(1); 
              filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
            }
            95% { 
              transform: scale(1.05); 
              filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.6));
            }
            100% { 
              transform: scale(1); 
              filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
            }
          }
        `}</style>
        <div className="border-t border-gray-200 bg-white p-4">
          {!isPremium && (
            <div className="flex items-center justify-center mb-3">
              <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">
                  {freeChatsLeft > 0 ? `${freeChatsLeft} free chats left today` : 'No free chats left today'}
                </span>
                {freeChatsLeft > 0 && (
                  <span className="text-xs text-gray-400">• Resets in 12h</span>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowUpload(!showUpload)}
              className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={freeChatsLeft <= 0 && !isPremium ? "Upgrade for unlimited chats..." : "Ask your AI coach anything..."}
                disabled={freeChatsLeft <= 0 && !isPremium}
                className={`w-full px-4 py-3 bg-gray-100 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                  freeChatsLeft <= 0 && !isPremium ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || (freeChatsLeft <= 0 && !isPremium)}
              className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
          {showUpload && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 w-full p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <Upload className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">Upload Progress Photo</div>
                  <div className="text-xs text-gray-500">Get AI analysis of your progress</div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          )}
        </div>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto relative">
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center z-10 shadow-lg"
              >
                ×
              </button>
              <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-8 pt-12 text-white rounded-t-3xl">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Crown className="w-10 h-10 text-yellow-300" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Unlock Your AI Coach</h2>
                  <p className="text-blue-100 text-sm">Transform your fitness journey with personalized AI guidance</p>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Unlimited AI Coaching</h3>
                      <p className="text-gray-600 text-xs">Ask anything about fitness, nutrition, and progress - no daily limits</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Custom Workout Plans</h3>
                      <p className="text-gray-600 text-xs">Fresh routines every week, tailored to your goals and progress</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Smart Meal Planning</h3>
                      <p className="text-gray-600 text-xs">Macro-balanced recipes with shopping lists and prep instructions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Detailed Progress Reports</h3>
                      <p className="text-gray-600 text-xs">In-depth body analysis with measurements and improvement predictions</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3 text-center">Real Results from Premium Users</h3>
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 text-center">
                      <div className="w-full h-20 bg-gray-200 rounded-xl mb-2 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">Before</span>
                      </div>
                      <p className="text-xs text-gray-600">Month 1</p>
                    </div>
                    <div className="flex items-center px-2">
                      <div className="w-6 h-0.5 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="w-full h-20 bg-gradient-to-br from-green-200 to-blue-200 rounded-xl mb-2 flex items-center justify-center">
                        <span className="text-green-700 text-xs font-semibold">After</span>
                      </div>
                      <p className="text-xs text-gray-600">Month 3</p>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-700 italic">"15lbs lost, custom meal plans made it so easy!" - Sarah M.</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="border-2 border-blue-500 rounded-2xl p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">7-Day Free Trial</h3>
                        <p className="text-blue-700 text-sm">Then $9.99/month</p>
                      </div>
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">Popular</div>
                    </div>
                    <p className="text-xs text-gray-600">Cancel anytime • Full access to all features</p>
                  </div>
                  <div className="border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">Monthly Plan</h3>
                        <p className="text-gray-700 text-sm">$9.99/month</p>
                      </div>
                      <div className="text-xs text-gray-500">No commitment</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg">
                    🚀 Start Free Trial
                  </button>
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full text-gray-500 py-2 text-sm"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICoachPage;

