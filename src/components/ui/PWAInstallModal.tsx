import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  Layers,
  Zap,
  Info,
  Copy,
  Check,
  QrCode,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // If already running in standalone mode (installed), show a subtle badge or nothing
  if (isInstalled) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        Terpasang di Perangkat
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all shadow-xs ${
          compact
            ? 'p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
            : 'px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs'
        }`}
        title="Pasang aplikasi di layar utama HP (PWA)"
      >
        <Smartphone className="w-4 h-4" />
        {!compact && <span>Install di HP</span>}
      </button>

      {/* Installation Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Cara Install di Layar Utama HP
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aplikasi Administrasi Guru Digital (PWA)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Direct Link & QR Code Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Link Aplikasi untuk Dibuka di HP:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQr ? 'Tutup QR Code' : 'Scan QR Code'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 select-all truncate focus:outline-none"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>

                {showQr && (
                  <div className="pt-2 flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Arahkan kamera HP Anda ke kode QR berikut untuk langsung membuka aplikasi:
                    </p>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`}
                      alt="QR Code Aplikasi Administrasi Guru Digital"
                      className="w-40 h-40 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1 bg-white"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              {/* Direct Install prompt button if available */}
              {isInstallable && (
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Browser Anda mendukung instalasi langsung!
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">
                      Klik tombol di samping untuk langsung memasang ikon di HP Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      install();
                      setShowModal(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Pasang Sekarang
                  </button>
                </div>
              )}

              {/* OS Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'android'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Android (Chrome / Edge)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'ios'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  iPhone / iPad (Safari)
                </button>
              </div>

              {/* Step instructions */}
              {activeTab === 'android' ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">Buka link web di Google Chrome HP</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Pastikan Anda membuka URL aplikasi ini di browser <strong>Google Chrome</strong> pada HP Android Anda.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">Ketuk ikon titik tiga (⋮) di pojok kanan atas</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Pada menu browser Chrome, cari dan pilih menu <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">Konfirmasi "Install" / "Tambahkan"</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Ikon <strong>Administrasi Guru Digital</strong> akan otomatis muncul di layar utama HP Anda dan dapat dibuka satu ketukan layaknya aplikasi native Play Store tanpa address bar!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">Buka link web di Safari iPhone</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Pada iPhone atau iPad, buka aplikasi menggunakan peramban <strong>Safari</strong> (bukan di dalam browser in-app media sosial).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Ketuk tombol Bagikan / Share <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Ketuk ikon kotak dengan panah ke atas (Share) di bilah navigasi bawah Safari.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Pilih "Tambah ke Layar Utama" <PlusSquare className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Gulir sedikit ke bawah, pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>, lalu ketuk <strong>"Tambah"</strong> di pojok kanan atas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits Banner */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Keunggulan Progressive Web App (PWA):
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                  <li>Tampilan layar penuh tanpa kolom alamat URL browser</li>
                  <li>Sangat ringan (tidak memakan memori penyimpanan HP)</li>
                  <li>Bisa dibuka cepat dengan satu sentuhan dari layar utama</li>
                  <li>Data otomatis tersinkron ke Google Spreadsheet saat online</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
