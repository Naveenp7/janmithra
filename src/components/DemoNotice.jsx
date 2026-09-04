import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured } from '../services/firebase.js';
import { isCloudinaryConfigured } from '../services/cloudinary.js';
import { checkApiHealth } from '../services/api.js';
import { Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function DemoNotice() {
  const [nimStatus, setNimStatus] = useState({ configured: false, checked: false });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkApiHealth().then((res) => {
      setNimStatus({
        configured: Boolean(res?.nimConfigured),
        checked: true,
      });
    });
  }, []);

  const allConfigured = isFirebaseConfigured && isCloudinaryConfigured && nimStatus.configured;

  return (
    <>


      {/* Quick Setup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">API Connection Status</h3>
                <p className="text-xs text-slate-500">
                  JanMithra supports both zero-friction demo mode and live production APIs.
                </p>
              </div>
            </div>

            <div className="space-y-3 my-4">
              {/* Firebase */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                    Firebase Auth & Firestore
                    {isFirebaseConfigured ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isFirebaseConfigured
                      ? 'Connected to your cloud Firebase project.'
                      : 'Running with high-fidelity local reactive state. Ready for demo!'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${isFirebaseConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                >
                  {isFirebaseConfigured ? 'Connected' : 'Local Demo'}
                </span>
              </div>

              {/* NVIDIA NIM */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                    NVIDIA NIM (Llama 3.1)
                    {nimStatus.configured ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {nimStatus.configured
                      ? 'Connected to NVIDIA NIM inference endpoint.'
                      : 'Using built-in LSG civic heuristic engine until NIM_API_KEY is placed in .env'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${nimStatus.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                >
                  {nimStatus.configured ? 'Active' : 'Heuristic'}
                </span>
              </div>

              {/* Cloudinary */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                    Cloudinary Media Storage
                    {isCloudinaryConfigured ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isCloudinaryConfigured
                      ? 'Direct unsigned upload enabled.'
                      : 'Local preview active for instant photo uploads.'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${isCloudinaryConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                >
                  {isCloudinaryConfigured ? 'Connected' : 'Local Preview'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 text-teal-700 mt-0.5" />
              <span>
                To connect your real keys, check the detailed step-by-step documentation in{' '}
                <strong className="font-mono">SETUP_GUIDE.md</strong> in the project folder.
              </span>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
