import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, CheckCircle, XCircle, User, Calendar, MapPin, Ticket } from 'lucide-react';
import { format } from 'date-fns';

const CheckIn = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanning = () => {
    setScanning(true);
    
    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    html5QrcodeScannerRef.current = html5QrcodeScanner;

    html5QrcodeScanner.render(onScanSuccess, onScanError);
  };

  const stopScanning = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(console.error);
      html5QrcodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    try {
      // Stop scanning temporarily
      stopScanning();

      // Parse QR code data
      const response = await api.post('/registrations/checkin/qr', {
        qrData: decodedText
      });

      if (response.data.success) {
        const registration = response.data.data.registration;
        
        setLastScan({
          success: true,
          registration,
          timestamp: new Date()
        });

        setScanHistory(prev => [{
          success: true,
          registration,
          timestamp: new Date()
        }, ...prev].slice(0, 10));

        toast.success(`✅ ${registration.attendeeName} checked in successfully!`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Check-in failed';
      
      setLastScan({
        success: false,
        error: errorMessage,
        timestamp: new Date()
      });

      setScanHistory(prev => [{
        success: false,
        error: errorMessage,
        timestamp: new Date()
      }, ...prev].slice(0, 10));

      toast.error(errorMessage);
    }

    // Resume scanning after 2 seconds
    setTimeout(() => {
      if (scanning) {
        startScanning();
      }
    }, 2000);
  };

  const onScanError = (error) => {
    // Ignore camera permission errors and scanning errors - they're too noisy
    console.debug(error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QR Check-In</h1>
        <p className="text-gray-600 mt-1">Scan attendee QR codes to check them in</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Scanner
            </h2>
            {!scanning ? (
              <button
                onClick={startScanning}
                className="btn btn-primary"
              >
                Start Scanning
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="btn btn-danger"
              >
                Stop Scanning
              </button>
            )}
          </div>

          {/* Scanner Container */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            {scanning ? (
              <div id="qr-reader" ref={scannerRef}></div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <QrCode className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-600 text-center">
                  Click "Start Scanning" to begin checking in attendees
                </p>
              </div>
            )}
          </div>

          {/* Last Scan Result */}
          {lastScan && (
            <div className={`mt-6 p-4 rounded-lg border-2 ${
              lastScan.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {lastScan.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  {lastScan.success ? (
                    <>
                      <h3 className="font-semibold text-green-900 mb-2">
                        Check-in Successful!
                      </h3>
                      <div className="space-y-1 text-sm text-green-800">
                        <p><strong>Name:</strong> {lastScan.registration.attendeeName}</p>
                        <p><strong>Email:</strong> {lastScan.registration.attendeeEmail}</p>
                        <p><strong>Event:</strong> {lastScan.registration.event?.title}</p>
                        <p><strong>Tickets:</strong> {lastScan.registration.numberOfTickets}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-red-900 mb-1">
                        Check-in Failed
                      </h3>
                      <p className="text-sm text-red-800">{lastScan.error}</p>
                    </>
                  )}
                  <p className="text-xs text-gray-600 mt-2">
                    {format(lastScan.timestamp, 'h:mm:ss a')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scan History */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Check-ins</h2>
          
          {scanHistory.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {scanHistory.map((scan, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    scan.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {scan.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      {scan.success ? (
                        <>
                          <p className="font-medium text-gray-900 truncate">
                            {scan.registration.attendeeName}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {scan.registration.event?.title}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-red-800">{scan.error}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {format(scan.timestamp, 'h:mm:ss a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No check-ins yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Scan a QR code to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-2 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          How to Check In Attendees
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Click "Start Scanning" to activate the QR code scanner</li>
          <li>Hold the attendee's QR code in front of your camera</li>
          <li>Wait for the scanner to read the code automatically</li>
          <li>A success or error message will appear after scanning</li>
          <li>The scanner will resume automatically after 2 seconds</li>
        </ol>
      </div>
    </div>
  );
};

export default CheckIn;

