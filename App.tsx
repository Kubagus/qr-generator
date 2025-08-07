
import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCodeIcon, ScanIcon, DownloadIcon, ZipIcon, LinkIcon, CloseIcon, UploadIcon } from './components/Icons';

type Tab = 'generate' | 'bulk' | 'scan';

interface GeneratedQR {
  id: string;
  url: string;
  dataUrl: string;
}

interface ScanResult {
    fileName: string;
    decodedText: string;
}

const Header = () => (
  <header className="bg-slate-900/70 backdrop-blur-lg p-4 sticky top-0 z-10 border-b border-slate-700/50">
    <div className="container mx-auto flex items-center gap-3">
      <QrCodeIcon className="w-8 h-8 text-sky-400" />
      <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">QR Code Suite</h1>
    </div>
  </header>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
    const baseClasses = "flex-1 px-4 py-3 text-sm md:text-base font-semibold transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 rounded-md flex items-center justify-center gap-2";
    const activeClasses = "bg-sky-600 text-white shadow-lg";
    const inactiveClasses = "bg-slate-700/50 hover:bg-slate-700 text-slate-300";
    return (
        <button onClick={onClick} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
            {children}
        </button>
    );
};


const GeneratorView = () => {
    const [url, setUrl] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const generateQR = useCallback(() => {
        if (!url.trim()) {
            setQrCode('');
            return;
        }
        setIsLoading(true);
        QRCode.toDataURL(url, {
            width: 256,
            margin: 2,
            color: {
                dark:"#020617",
                light:"#e2e8f0"
            }
        }, (err: any, dataUrl: string) => {
            setIsLoading(false);
            if (err) {
                console.error(err);
                setQrCode('');
                return;
            }
            setQrCode(dataUrl);
        });
    }, [url]);

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-semibold text-slate-100">Generate a Single QR Code</h2>
            <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-slate-800 border border-slate-600 rounded-md py-3 pl-10 pr-4 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    aria-label="URL to generate QR code for"
                />
            </div>
            <button onClick={generateQR} disabled={!url || isLoading} className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center gap-2">
                {isLoading ? 'Generating...' : 'Generate QR Code'}
            </button>
            {qrCode && (
                <div className="bg-slate-800/50 p-6 rounded-lg text-center space-y-4 animate-fade-in-up">
                    <img src={qrCode} alt="Generated QR Code" className="mx-auto rounded-lg border-4 border-slate-700" />
                    <a href={qrCode} download={`qrcode-${Date.now()}.png`} className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        <DownloadIcon className="w-5 h-5" />
                        Download
                    </a>
                </div>
            )}
        </div>
    );
};

const BulkGeneratorView = () => {
    const [urls, setUrls] = useState('');
    const [qrs, setQrs] = useState<GeneratedQR[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const generateBulk = async () => {
        const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
        if (urlList.length === 0) return;

        setIsLoading(true);
        const generatedQrs: GeneratedQR[] = [];
        for (const url of urlList) {
            try {
                const dataUrl = await QRCode.toDataURL(url, {
                    width: 128, margin: 1, color: { dark:"#020617", light:"#e2e8f0"}
                });
                generatedQrs.push({ id: `qr-${Math.random()}`, url, dataUrl });
            } catch (err) {
                console.error(`Failed to generate QR for ${url}`, err);
            }
        }
        setQrs(generatedQrs);
        setIsLoading(false);
    };

    const downloadZip = () => {
        const zip = new JSZip();
        qrs.forEach((qr, index) => {
            const fileName = qr.url.replace(/[^a-z0-9]/gi, '_').slice(0, 50) || `qrcode_${index + 1}`;
            zip.file(`${fileName}.png`, qr.dataUrl.split(',')[1], { base64: true });
        });
        zip.generateAsync({ type: 'blob' }).then((content: any) => {
            saveAs(content, `qrcodes_${Date.now()}.zip`);
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-semibold text-slate-100">Generate QR Codes in Bulk</h2>
            <textarea
                value={urls}
                onChange={e => setUrls(e.target.value)}
                placeholder="Enter each URL on a new line..."
                rows={8}
                className="w-full bg-slate-800 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                aria-label="List of URLs to generate QR codes for"
            />
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={generateBulk} disabled={!urls || isLoading} className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center gap-2">
                    {isLoading ? 'Generating...' : 'Generate All'}
                </button>
                {qrs.length > 0 && (
                    <button onClick={downloadZip} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
                        <ZipIcon className="w-5 h-5" />
                        Download All (.zip)
                    </button>
                )}
            </div>
            {qrs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" aria-live="polite">
                    {qrs.map(qr => (
                        <div key={qr.id} className="bg-slate-800/50 p-2 rounded-lg text-center group animate-fade-in-up">
                            <img src={qr.dataUrl} alt={`QR Code for ${qr.url}`} className="mx-auto rounded-md" />
                            <p className="text-xs text-slate-400 mt-2 truncate group-hover:whitespace-normal">{qr.url}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ScannerView = () => {
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const scannerRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const readerId = "qr-reader";

    const startScan = async () => {
        setScanResults([]);
        try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length) {
                setIsScanning(true);
                
                const html5QrCode = new Html5Qrcode(readerId);
                scannerRef.current = html5QrCode;
                
                html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText: string) => {
                        setScanResults([{ fileName: 'Camera Scan', decodedText: decodedText }]);
                        stopScan();
                    },
                    (errorMessage: string) => {
                        // console.log("QR Code scan error:", errorMessage);
                    }
                ).catch((err: any) => {
                    console.error("Unable to start scanning.", err);
                    setIsScanning(false);
                });
            }
        } catch (err) {
            console.error("Camera permissions error:", err);
            alert("Could not get camera permissions. Please allow camera access in your browser settings.");
        }
    };
    
    const stopScan = useCallback(() => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
                setIsScanning(false);
                scannerRef.current = null;
            }).catch((err: any) => {
                console.error("Failed to stop scanner", err);
                setIsScanning(false); // Force state change even on error
            });
        }
    },[]);

    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                stopScan();
            }
        };
    }, [stopScan]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        if (files.length > 10) {
            alert("You can upload a maximum of 10 files at a time.");
            if (event.target) event.target.value = '';
            return;
        }

        setIsProcessingFile(true);
        setScanResults([]);
        
        const html5QrCode = new Html5Qrcode(readerId, false);

        const scanPromises = Array.from(files).map(file => {
            return html5QrCode.scanFile(file, false)
                .then(decodedText => ({ fileName: file.name, decodedText }))
                .catch(err => {
                    console.warn(`Could not scan file: ${file.name}`, err);
                    return null;
                });
        });

        const allResults = await Promise.all(scanPromises);
        const successfulScans = allResults.filter((result): result is ScanResult => result !== null);

        setScanResults(successfulScans);

        if (successfulScans.length === 0) {
            alert("Could not find a QR code in any of the selected images. Please try different ones.");
        }

        setIsProcessingFile(false);
        if (event.target) event.target.value = '';
    };

    const isSafeUrl = (url: string) => {
        try {
            const parsedUrl = new URL(url);
            return ['https:', 'http:', 'mailto:', 'tel:'].includes(parsedUrl.protocol);
        } catch {
            return false;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-semibold text-slate-100">Scan a QR Code</h2>
            <div id={readerId} className={`${isScanning ? 'block' : 'hidden'} w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-slate-700`} aria-live="assertive"></div>
            
            {!isScanning && (
                <div className="space-y-4">
                    <button onClick={startScan} disabled={isProcessingFile} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
                        <ScanIcon className="w-6 h-6" />
                        Start Camera Scan
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <hr className="flex-grow border-slate-600"/>
                        <span className="text-slate-400 text-sm">OR</span>
                        <hr className="flex-grow border-slate-600"/>
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                      aria-hidden="true"
                      multiple
                    />
                    <button onClick={handleUploadClick} disabled={isProcessingFile} className="w-full bg-slate-600 hover:bg-slate-500 disabled:bg-slate-500/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
                        <UploadIcon className="w-6 h-6" />
                        {isProcessingFile ? 'Processing Images...' : 'Upload Image(s) (Max 10)'}
                    </button>
                </div>
            )}

            {isScanning && (
                 <button onClick={stopScan} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
                    <CloseIcon className="w-6 h-6" />
                    Stop Scanning
                </button>
            )}

            {scanResults.length > 0 && (
                <div className="bg-slate-800/50 p-6 rounded-lg space-y-4 animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-sky-400">Scan Results ({scanResults.length} found)</h3>
                    <ul className="space-y-3 text-left max-h-96 overflow-y-auto pr-2">
                        {scanResults.map((result, index) => (
                            <li key={index} className="bg-slate-700 p-3 rounded-md shadow">
                                <p className="text-sm text-slate-400 font-medium truncate" title={result.fileName}>
                                    {result.fileName}
                                </p>
                                {isSafeUrl(result.decodedText) ? (
                                    <a 
                                      href={result.decodedText} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="block text-white hover:text-sky-400 transition-colors break-all mt-1"
                                    >
                                        {result.decodedText}
                                    </a>
                                ) : (
                                    <span className="block text-white break-all mt-1">
                                        {result.decodedText}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default function App() {
    const [activeTab, setActiveTab] = useState<Tab>('generate');
  
    const renderContent = () => {
      switch(activeTab) {
        case 'generate': return <GeneratorView />;
        case 'bulk': return <BulkGeneratorView />;
        case 'scan': return <ScannerView />;
        default: return <GeneratorView />;
      }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            <Header />
            <main className="container mx-auto p-4 md:p-6">
                <div className="bg-slate-800 rounded-lg p-4 mb-6 shadow-lg">
                    <div className="flex gap-2" role="tablist" aria-label="QR Code Tools">
                        <TabButton active={activeTab === 'generate'} onClick={() => setActiveTab('generate')}>
                            <QrCodeIcon className="w-5 h-5"/> Generate
                        </TabButton>
                        <TabButton active={activeTab === 'bulk'} onClick={() => setActiveTab('bulk')}>
                             <ZipIcon className="w-5 h-5"/> Bulk
                        </TabButton>
                        <TabButton active={activeTab === 'scan'} onClick={() => setActiveTab('scan')}>
                            <ScanIcon className="w-5 h-5"/> Scan
                        </TabButton>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 md:p-8 shadow-lg" role="tabpanel">
                    {renderContent()}
                </div>
            </main>
             <footer className="text-center py-4 mt-8 text-slate-500 text-sm">
                <p>Powered by React & Tailwind CSS.</p>
            </footer>
             <style>{`
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    )
}