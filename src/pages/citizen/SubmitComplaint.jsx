import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LocationPicker from '../../components/LocationPicker.jsx';
import UrgencyBadge from '../../components/UrgencyBadge.jsx';
import { PageHeader, Alert } from '../../components/ui.jsx';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '../../services/cloudinary.js';
import { classifyComplaint } from '../../services/api.js';
import { addComplaintToFirestore } from '../../services/firebase.js';
import { Send, X, Sparkles, Loader2, Lock, CloudUpload, Cpu, Camera } from 'lucide-react';

const MAX_DESCRIPTION = 1000;

function Step({ n, title, hint, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-7 h-7 rounded-full bg-brand-700 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
          {n}
        </span>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 leading-tight">{title}</h2>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SubmitComplaint() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [location, setLocation] = useState({ lat: 9.9816, lng: 76.2999, ward: '', address: '' });

  const [aiPreview, setAiPreview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [error, setError] = useState(null);

  // Release the blob URL when the preview changes / on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadProgress(0);
    setAiPreview(null);
    setError(null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    setAiPreview(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Preview is text-based: the photo is only reachable by the AI after it is uploaded on submit.
  const handleTestAi = async () => {
    if (!description.trim()) {
      setError('Describe the issue first to preview the AI triage.');
      return;
    }
    setError(null);
    setAiLoading(true);
    try {
      setAiPreview(await classifyComplaint(description.trim(), Boolean(imageFile), null));
    } catch {
      setError('AI classification preview failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError('Please sign in as a citizen before submitting a complaint.');
      return;
    }
    if (!description.trim() && !imageFile) {
      setError('Please provide a description or attach a photo.');
      return;
    }

    setError(null);
    setSubmitting(true);
    setUploadProgress(0);

    try {
      let imageUrl = null;

      if (imageFile) {
        if (!isCloudinaryConfigured) {
          throw new Error('Photo upload is currently unavailable. Remove the photo and submit a text description, or try again later.');
        }
        setSubmitStep('Uploading photo…');
        imageUrl = await uploadImageToCloudinary(imageFile, (progress) => {
          setUploadProgress(progress);
          setSubmitStep(`Uploading photo (${progress}%)…`);
        });
      }

      setSubmitStep('Analysing the issue…');
      const finalDescription = description.trim() || 'Civic issue reported via on-site photo evidence.';
      // Re-classify when a photo was uploaded so the vision model can see it
      const classification =
        aiPreview && !imageUrl ? aiPreview : await classifyComplaint(finalDescription, Boolean(imageUrl), imageUrl);

      setSubmitStep('Registering your complaint…');
      const saved = await addComplaintToFirestore({
        citizenId: currentUser.uid,
        citizenName: currentUser.name || 'Citizen',
        citizenEmail: currentUser.email || '',
        description: finalDescription,
        imageUrl,
        location: {
          lat: location.lat,
          lng: location.lng,
          ward: location.ward || 'General Municipal Ward',
          address: location.address || '',
        },
        category: classification?.category || 'Other',
        urgency: classification?.urgency || 'Medium',
        aiReasoning: classification?.aiReasoning || 'Classified via civic triage intelligence.',
      });

      navigate(`/citizen/complaint/${saved.complaintId}`);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit complaint. Please try again.');
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        eyebrow="New report"
        title="Report a civic issue"
        subtitle="Potholes, water leaks, broken streetlights, waste or drainage — tell us what and where. Our AI sets the priority and routes it to the right department."
      />

      {!currentUser && (
        <div className="mb-5 p-4 bg-brand-50 border border-brand-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-brand-700 text-white rounded-xl">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sign in to submit</h3>
              <p className="text-xs text-slate-600">You'll be able to track every update on your report.</p>
            </div>
          </div>
          <Link to="/citizen/login" state={{ from: { pathname: '/citizen' } }} className="btn-primary btn-sm self-start sm:self-auto">
            Sign in / Register
          </Link>
        </div>
      )}

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Step n={1} title="What's the problem?" hint="A short description is enough. Optional if you attach a photo.">
          <textarea
            rows={4}
            maxLength={MAX_DESCRIPTION}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setAiPreview(null);
            }}
            placeholder="e.g. Deep pothole near the junction, two-wheelers are skidding."
            aria-label="Issue description"
            className="input resize-y"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestAi}
              disabled={aiLoading || !description.trim()}
              className="btn-secondary btn-sm"
            >
              <Cpu className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              {aiLoading ? 'Analysing…' : 'Preview AI triage'}
            </button>
            <span className="text-[11px] text-slate-400">
              {description.length}/{MAX_DESCRIPTION}
            </span>
          </div>

          {aiPreview && (
            <div className="mt-4 p-4 rounded-xl bg-brand-50/70 border border-brand-200 anim-fade">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-extrabold text-brand-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" /> AI triage
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-800 text-white">
                    {aiPreview.category}
                  </span>
                  <UrgencyBadge urgency={aiPreview.urgency} size="sm" />
                </div>
              </div>
              <p className="text-sm text-slate-700">{aiPreview.aiReasoning}</p>
              {imageFile && (
                <p className="text-[11px] text-slate-500 mt-2">
                  Your photo will also be analysed when you submit.
                </p>
              )}
            </div>
          )}
        </Step>

        <Step n={2} title="Add a photo" hint="Optional, but it helps crews find and fix the issue faster.">
          {!imagePreview ? (
            <label
              htmlFor="photo-upload"
              className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center transition"
            >
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                <CloudUpload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Take or choose a photo
              </span>
              <span className="text-xs text-slate-400">JPG, PNG or WEBP · compressed automatically</span>
            </label>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-sm bg-slate-100">
                <img src={imagePreview} alt="Selected preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={submitting}
                  aria-label="Remove photo"
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {imageFile && (
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{imageFile.name}</span>{' '}
                  <span className="font-mono text-slate-400">({formatFileSize(imageFile.size)})</span>
                </div>
              )}
              {submitting && uploadProgress > 0 && (
                <div className="max-w-sm space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-brand-800">
                    <span>Uploading</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Step>

        <Step n={3} title="Where is it?" hint="Search, use your location, or tap the map to drop the pin.">
          <LocationPicker location={location} onChange={setLocation} />
        </Step>

        {/* Submit — sticks above the bottom tab bar on phones */}
        <div className="sticky bottom-[4.25rem] lg:bottom-0 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-slate-50/95 backdrop-blur">
          <button
            type="submit"
            disabled={submitting || !currentUser}
            className="btn-primary w-full py-3.5 text-base shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{submitStep || 'Processing…'}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
