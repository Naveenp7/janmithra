import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LocationPicker from '../../components/LocationPicker.jsx';
import UrgencyBadge from '../../components/UrgencyBadge.jsx';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '../../services/cloudinary.js';
import { classifyComplaint } from '../../services/api.js';
import { addComplaintToFirestore } from '../../services/firebase.js';
import {
  Send,
  Camera,
  X,
  Sparkles,
  AlertTriangle,
  Cpu,
  Loader2,
  FileText,
  Lock,
  CloudUpload,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function SubmitComplaint() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [location, setLocation] = useState({
    lat: 9.9816,
    lng: 76.2999,
    ward: '',
    address: '',
  });

  // AI Classification Preview State
  const [aiPreview, setAiPreview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [error, setError] = useState(null);

  // Image Selection Handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setUploadProgress(0);
      setError(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  // Format bytes helper
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Trigger AI Classification Preview
  const handleTestAi = async () => {
    if (!description.trim()) {
      setError('Please type a brief description of the civic issue first.');
      return;
    }
    setError(null);
    setAiLoading(true);
    try {
      const res = await classifyComplaint(description, Boolean(imageFile));
      setAiPreview(res);
    } catch (err) {
      setError('AI classification preview failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError('Please sign in as a citizen before submitting a complaint.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description of the civic issue.');
      return;
    }

    setError(null);
    setSubmitting(true);
    setUploadProgress(0);

    try {
      let imageUrl = null;

      // Step 1: Upload Image to Cloudinary (if provided)
      if (imageFile) {
        if (!isCloudinaryConfigured) {
          throw new Error(
            'Photo upload service is currently unavailable. You may proceed by submitting a text description or try again.'
          );
        }

        setSubmitStep('Uploading on-site photo evidence...');
        imageUrl = await uploadImageToCloudinary(imageFile, (progress) => {
          setUploadProgress(progress);
          setSubmitStep(`Uploading photo evidence (${progress}%)...`);
        });
      }

      // Step 2: AI Classification
      setSubmitStep('Analyzing civic issue with automated triage...');
      let classification = aiPreview;
      if (!classification || imageUrl) {
        classification = await classifyComplaint(description, Boolean(imageUrl), imageUrl);
      }

      // Step 3: Save real complaint to Firestore
      setSubmitStep('Registering complaint in database...');
      const complaintRecord = {
        citizenId: currentUser.uid,
        citizenName: currentUser.name || 'Citizen',
        citizenEmail: currentUser.email || '',
        description: description.trim(),
        imageUrl: imageUrl,
        location: {
          lat: location.lat,
          lng: location.lng,
          ward: location.ward || 'General Municipal Ward',
          address: location.address || '',
        },
        category: classification.category || 'Other',
        urgency: classification.urgency || 'Medium',
        aiReasoning: classification.aiReasoning || 'Classified via civic triage intelligence.',
      };

      const saved = await addComplaintToFirestore(complaintRecord);

      // Redirect to complaint detail view
      const targetId = saved.complaintId || saved.id;
      navigate(`/citizen/complaint/${targetId}`);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit complaint. Please try again.');
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Civic Issue Helpdesk</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Civic Issue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit potholes, water supply ruptures, dangling live wires, or solid waste problems.
          Our AI layer classifies the urgency and routes it to the designated ward authority.
        </p>
      </div>

      {!currentUser && (
        <div className="mb-8 p-6 bg-teal-50 border border-teal-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600 text-white rounded-2xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sign In Required</h3>
              <p className="text-xs text-slate-600">
                Please log in with your citizen account so you can track real-time resolution updates.
              </p>
            </div>
          </div>
          <Link
            to="/citizen/login"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            Sign In / Register
          </Link>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Issue Description */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Describe the Civic Problem
            </label>
            <button
              type="button"
              onClick={handleTestAi}
              disabled={aiLoading || !description.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Cpu className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              {aiLoading ? 'Analyzing...' : 'Preview AI Triage'}
            </button>
          </div>

          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail (e.g. location specifics, public safety hazard, how long it has been broken)..."
            className="w-full text-sm p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-y"
          />

          {/* AI Live Assessment Feedback Box */}
          {aiPreview && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-teal-50/70 via-slate-50 to-emerald-50/60 border border-teal-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    AI Triage Assessment
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-teal-800 border border-teal-200">
                    Automated Triage
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                    Category: {aiPreview.category}
                  </span>
                  <UrgencyBadge urgency={aiPreview.urgency} size="sm" />
                </div>
              </div>
              <p className="text-xs text-slate-700 italic">
                "{aiPreview.aiReasoning}"
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Photo Evidence */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-600" />
              Attach Photographic Evidence
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              Optional On-Site Photo
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Clear photographs assist municipal field staff in fast-tracking on-site inspection.
          </p>

          {!imagePreview ? (
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-inner">
                  <CloudUpload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  Click to select or capture photographic evidence
                </div>
                <div className="text-xs text-slate-400">JPG, PNG, WEBP • Auto-compressed before upload</div>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-sm bg-slate-100">
                <img
                  src={imagePreview}
                  alt="Selected preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={submitting}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors backdrop-blur-sm cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {imageFile && (
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{imageFile.name}</span>
                  <span className="text-slate-400 font-mono">({formatFileSize(imageFile.size)})</span>
                </div>
              )}

              {/* Upload progress bar */}
              {submitting && uploadProgress > 0 && (
                <div className="space-y-1 max-w-sm">
                  <div className="flex justify-between text-[11px] font-semibold text-teal-800">
                    <span>Uploading Photo Evidence</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Location Picker */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <LocationPicker location={location} onChange={setLocation} />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !currentUser}
            className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-extrabold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{submitStep || 'Processing complaint...'}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Civic Issue Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
