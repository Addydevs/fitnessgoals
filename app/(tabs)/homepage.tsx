/* eslint-env browser */
import React, { useEffect, useRef, useState } from "react";

// Simple emoji-based icons used as placeholders for lucide-react icons
const Icon = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <span className={className}>{children}</span>;

const Camera = (props: any) => <Icon {...props}>📷</Icon>;
const TrendingUp = (props: any) => <Icon {...props}>📈</Icon>;
const Calendar = (props: any) => <Icon {...props}>📅</Icon>;
const Search = (props: any) => <Icon {...props}>🔍</Icon>;
const MoreHorizontal = (props: any) => <Icon {...props}>⋯</Icon>;
const Plus = (props: any) => <Icon {...props}>＋</Icon>;
const X = (props: any) => <Icon {...props}>✕</Icon>;

const PhotoProgressApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imageData);
      stopCamera();
      void sendToAPI(imageData);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  const sendToAPI = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("image", blob, "progress-photo.jpg");
      formData.append("userId", "john_123");
      formData.append("timestamp", new Date().toISOString());
      const apiResponse = await fetch("/api/analyze-progress", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer YOUR_API_TOKEN",
        },
      });
      if (apiResponse.ok) {
        const analysisResult = await apiResponse.json();
        console.log("Analysis result:", analysisResult);
        alert(`Photo uploaded successfully! Keep up the great progress.`);
      } else {
        throw new Error("API request failed");
      }
    } catch (error) {
      console.error("Error sending to API:", error);
      alert("Error analyzing photo. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraClick = () => {
    void startCamera();
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = currentDate.getDay();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto bg-gray-50 min-h-screen relative">
        {showCamera && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 text-white">
              <button onClick={stopCamera} className="p-2">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-semibold">CaptureFit Camera</h2>
              <div className="w-10" />
            </div>

            <div className="flex-1 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-80 border-2 border-white/50 rounded-2xl flex items-center justify-center">
                  <p className="text-white/70 text-sm text-center px-4">
                    Position yourself within the frame for best results
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 flex justify-center">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
                disabled={isAnalyzing}
              >
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </button>
            </div>

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-semibold">
                    Analyzing your progress...
                  </p>
                  <p className="text-sm opacity-70">
                    AI is processing your photo
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
        {capturedImage && (
          <img src={capturedImage} alt="captured" className="hidden" />
        )}

        <div className="flex justify-between items-center px-6 pt-3 pb-2">
          <div className="text-sm font-medium">9:41</div>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-900 rounded-full" />
              <div className="w-1 h-1 bg-gray-900 rounded-full" />
              <div className="w-1 h-1 bg-gray-900 rounded-full" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
            </div>
            <div className="ml-2 text-sm">📶</div>
            <div className="text-sm">🔋</div>
          </div>
        </div>

        <div className="flex justify-between items-start px-6 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23E5E7EB'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='%236B7280' font-family='Arial, sans-serif' font-size='16' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Hello, John</p>
              <p className="text-gray-900 font-medium">
                {formatDate(currentDate)}
              </p>
            </div>
          </div>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-green-500 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 w-16 h-16 opacity-30">
              <div className="w-8 h-8 bg-yellow-400 rounded-full absolute top-0 right-0" />
              <div className="w-10 h-10 bg-orange-500 rounded-lg absolute bottom-0 left-0 transform rotate-12" />
              <div className="w-6 h-6 bg-green-500 rounded-full absolute top-3 left-2" />
            </div>

            <div className="relative z-10">
              <h2 className="text-white text-2xl font-bold mb-1">CaptureFit</h2>
              <h2 className="text-white text-2xl font-bold mb-2">challenge</h2>
              <p className="text-blue-100 text-sm mb-4">
                Track your visual progress journey
              </p>

              <div className="flex -space-x-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                  J
                </div>
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  M
                </div>
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  S
                </div>
                <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <div className="flex justify-between items-center">
            {weekDays.map((day, index) => {
              const dayNumber = 22 + index;
              const isToday = index === today;
              return (
                <div key={day} className="text-center">
                  <p className="text-gray-500 text-xs mb-2">{day}</p>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      isToday
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 border border-gray-200"
                    }`}
                  >
                    {dayNumber}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 mb-6">
          <h3 className="text-gray-900 text-lg font-semibold mb-4">
            Your progress
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-200 to-orange-300 rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-white/20 rounded-full" />
              <div className="relative z-10">
                <div className="mb-3">
                  <Camera className="w-6 h-6 text-orange-800 mb-2" />
                  <h4 className="text-gray-900 font-semibold text-base">
                    CaptureFit
                  </h4>
                  <h4 className="text-gray-900 font-semibold text-base">
                    Analysis
                  </h4>
                </div>
                <p className="text-orange-800 text-xs mb-3">
                  Visual progress tracking
                </p>
                <p className="text-orange-900 text-xs">📸 Ready to capture</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/20 rounded-full" />
              <div className="relative z-10">
                <div className="mb-3">
                  <TrendingUp className="w-6 h-6 text-blue-800 mb-2" />
                  <h4 className="text-gray-900 font-semibold text-base">
                    Progress
                  </h4>
                  <h4 className="text-gray-900 font-semibold text-base">
                    Stats
                  </h4>
                </div>
                <p className="text-blue-800 text-xs mb-3">2 week streak</p>
                <p className="text-blue-900 text-xs">📊 View timeline</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-semibold">
                This Week’s Progress
              </h3>
              <button>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">📸</span>
                </div>
                <p className="text-gray-900 font-semibold text-lg">2</p>
                <p className="text-gray-500 text-xs">Photos taken</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">🔥</span>
                </div>
                <p className="text-gray-900 font-semibold text-lg">2</p>
                <p className="text-gray-500 text-xs">Week streak</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">📅</span>
                </div>
                <p className="text-gray-900 font-semibold text-lg">14</p>
                <p className="text-gray-500 text-xs">Days tracked</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-900 font-semibold mb-4">
              Visual Comparison
            </h3>

            <div className="flex gap-4">
              <div className="flex-1">
                <div className="aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center mb-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50"></div>
                  <div className="relative z-10 text-center">
                    <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">
                      Last week
                    </p>
                  </div>
                </div>
                <p className="text-center text-gray-600 text-sm font-medium">
                  Before
                </p>
              </div>

              <div className="flex items-center px-2">
                <div className="w-8 h-0.5 bg-gray-200 rounded-full"></div>
              </div>

              <div className="flex-1">
                <div
                  className="aspect-[3/4] bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border-2 border-dashed border-gray-200 relative overflow-hidden cursor-pointer"
                  onClick={handleCameraClick}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50"></div>
                  <div className="relative z-10 text-center">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">
                      This week
                    </p>
                  </div>
                </div>
                <p className="text-center text-gray-600 text-sm font-medium">
                  This Week
                </p>
              </div>
            </div>

            <button
              onClick={handleCameraClick}
              className="w-full bg-gray-900 text-white rounded-2xl py-4 flex items-center justify-center gap-2 mt-4 font-medium hover:bg-gray-800 transition-colors"
              disabled={isAnalyzing}
            >
              <Camera className="w-5 h-5" />
              <span>
                {isAnalyzing ? "Analyzing..." : "Capture with CaptureFit"}
              </span>
            </button>
          </div>
        </div>

        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm">
          <div className="bg-gray-900 mx-4 mb-6 rounded-3xl px-6 py-4">
            <div className="flex justify-around items-center">
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-900 rounded-lg"></div>
              </button>
              <button className="p-2">
                <div className="w-6 h-6 border-2 border-gray-400 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                </div>
              </button>
              <button className="p-2">
                <div className="w-6 h-6 border-2 border-gray-400 rounded-lg flex flex-col gap-0.5 p-1">
                  <div className="flex-1 bg-gray-400 rounded-xs"></div>
                  <div className="flex-1 bg-gray-400 rounded-xs"></div>
                  <div className="flex-1 bg-gray-400 rounded-xs"></div>
                </div>
              </button>
              <button className="p-2">
                <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
              </button>
            </div>
          </div>
        </div>

        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default PhotoProgressApp;
