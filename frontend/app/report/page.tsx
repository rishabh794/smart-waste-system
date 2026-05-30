"use client";

import Image, { type ImageLoader } from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ChevronIcon } from "@/components/ui/icons";
import { getApiErrorMessage } from "@/lib/services/apiService";
import { createReport } from "@/lib/services/reportService";
import { getValidationErrorMessage, reportFormSchema } from "@/lib/validation";
import type { ReportCategory } from "@/types/CitizenTypes";

const CATEGORY_OPTIONS: Array<{ value: ReportCategory; label: string }> = [
  { value: "overflowing", label: "Overflowing Bin" },
  { value: "damaged", label: "Damaged Bin" },
  { value: "missed_pickup", label: "Missed Pickup" },
  { value: "illegal_dumping", label: "Illegal Dumping" },
  { value: "general", label: "General Concern" },
];

const passthroughLoader: ImageLoader = ({ src }) => src;

export default function ReportIssuePage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    category: "overflowing" as ReportCategory,
    latitude: "",
    longitude: "",
    imageUrl: "",
    address: "",
    binId: "",
  });
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: keyof typeof formState, value: string) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find((option) => option.value === formState.category)?.label ?? "Overflowing Bin";

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormState((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      (positionError) => {
        console.error(positionError);
        setLocationError("Location permission is required to submit a report.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!categoryMenuRef.current) return;
      if (categoryMenuRef.current.contains(event.target as Node)) return;
      setIsCategoryMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setFormState((current) => ({ ...current, imageUrl: "" }));
    setIsUploadingImage(true);
    setImageError("");
    setError("");

    try {
      const signatureRes = await fetch("/api/cloudinary/signature");

      if (!signatureRes.ok) {
        setImageError("Unable to authorize image upload.");
        return;
      }

      const signaturePayload = (await signatureRes.json()) as {
        cloudName: string;
        apiKey: string;
        timestamp: number;
        folder: string;
        signature: string;
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signaturePayload.apiKey);
      formData.append("timestamp", signaturePayload.timestamp.toString());
      formData.append("signature", signaturePayload.signature);
      formData.append("folder", signaturePayload.folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/image/upload`;
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setImageError("Image upload failed. Please try again.");
        setFormState((current) => ({ ...current, imageUrl: "" }));
        return;
      }

      const payload = (await res.json()) as { secure_url?: string; url?: string };
      const uploadedUrl = payload.secure_url ?? payload.url;

      if (!uploadedUrl) {
        setImageError("Upload finished but no image URL was returned.");
        setFormState((current) => ({ ...current, imageUrl: "" }));
        return;
      }

      setFormState((current) => ({ ...current, imageUrl: uploadedUrl }));
    } catch (uploadError) {
      console.error(uploadError);
      setImageError("Network issue while uploading image.");
      setFormState((current) => ({ ...current, imageUrl: "" }));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (isUploadingImage) {
      setError("Please wait for the image upload to finish.");
      return;
    }

    if (!formState.imageUrl) {
      setError("Please upload a photo before submitting.");
      return;
    }

    if (!formState.latitude || !formState.longitude) {
      setError("Location is required to submit a report.");
      return;
    }

    const parsed = reportFormSchema.safeParse(formState);

    if (!parsed.success) {
      setError(getValidationErrorMessage(parsed.error));
      return;
    }

    const trimmedAddress = parsed.data.address?.trim();
    const trimmedBinId = parsed.data.binId?.trim();

    const payload = {
      ...parsed.data,
      address: trimmedAddress ? trimmedAddress : undefined,
      binId: trimmedBinId ? trimmedBinId : undefined,
    };

    setIsSubmitting(true);
    setError("");

    try {
      const res = await createReport(payload);

      if (!res.ok) {
        setError(await getApiErrorMessage(res, "Unable to submit report."));
        return;
      }

      toast.success("Report submitted successfully.");
      router.push("/reports");
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError("Network issue while submitting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    isUploadingImage ||
    isLocating ||
    !formState.latitude ||
    !formState.longitude ||
    !formState.imageUrl;

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      {() => (
        <div className="site-container page-shell">
          <div className="mb-7 border-b border-[#e5ede7] pb-5">
            <p className="section-eyebrow">Citizen Report</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">Report a Bin Issue</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#607267]">
              We capture your location automatically and upload your photo directly to Cloudinary for faster triage.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e4ece6] bg-white/90 p-6">
              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#21412f]">Title</label>
                  <input
                    className="input-clean"
                    placeholder="Overflowing bin near Elm Street"
                    value={formState.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    required
                  />
                </div>

                <div ref={categoryMenuRef} className="relative">
                  <label className="mb-1 block text-sm font-semibold text-[#21412f]">Category</label>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isCategoryMenuOpen}
                    onClick={() => setIsCategoryMenuOpen((current) => !current)}
                    className={`dropdown-clean ${isCategoryMenuOpen ? "dropdown-clean-open" : ""}`}
                  >
                    <span className="text-[#1f3b2d]">{selectedCategoryLabel}</span>
                    <ChevronIcon open={isCategoryMenuOpen} />
                  </button>

                  {isCategoryMenuOpen && (
                    <div
                      role="listbox"
                      className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-[#bfd5c5] bg-[#f7fcf8] shadow-lg"
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={formState.category === option.value}
                          className={`dropdown-option ${
                            formState.category === option.value ? "dropdown-option-selected" : ""
                          }`}
                          onClick={() => {
                            updateField("category", option.value);
                            setIsCategoryMenuOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#21412f]">Description</label>
                  <textarea
                    className="input-clean min-h-28"
                    placeholder="Describe the issue, any landmarks, and urgency."
                    value={formState.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    required
                  />
                </div>

                <div className="rounded-xl border border-[#e4ece6] bg-[#f8fcf9] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#21412f]">Location</p>
                      <p className="text-xs text-[#5f7167]">
                        {isLocating ? "Fetching your current location..." : "Captured from your device"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={requestLocation}
                      className="btn-secondary"
                      disabled={isLocating}
                    >
                      {isLocating ? "Locating..." : "Refresh Location"}
                    </button>
                  </div>

                  {locationError ? (
                    <p className="mt-3 text-sm text-red-600">{locationError}</p>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7167]">
                          Latitude
                        </label>
                        <input className="input-clean" value={formState.latitude} readOnly />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7167]">
                          Longitude
                        </label>
                        <input className="input-clean" value={formState.longitude} readOnly />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#21412f]">Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input-clean"
                    onChange={handleImageChange}
                  />
                  {isUploadingImage && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1a7b3a]">
                      Uploading to Cloudinary...
                    </p>
                  )}
                  {formState.imageUrl && !isUploadingImage && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1a7b3a]">
                      Image uploaded successfully.
                    </p>
                  )}
                  {imageError && (
                    <p className="mt-2 text-sm text-red-600">{imageError}</p>
                  )}
                  {imagePreviewUrl && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-[#e4ece6] bg-white">
                      <Image
                        loader={passthroughLoader}
                        src={imagePreviewUrl}
                        alt="Report preview"
                        width={640}
                        height={360}
                        className="h-48 w-full object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#21412f]">Address (optional)</label>
                  <input
                    className="input-clean"
                    placeholder="Elm Street, Ward 12"
                    value={formState.address}
                    onChange={(event) => updateField("address", event.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#21412f]">Bin ID (optional)</label>
                  <input
                    className="input-clean"
                    placeholder="Paste bin UUID if available"
                    value={formState.binId}
                    onChange={(event) => updateField("binId", event.target.value)}
                  />
                </div>

                {error && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Submitting Report..." : isUploadingImage ? "Uploading Photo..." : "Submit Report"}
                </button>
              </div>
            </form>

            <aside className="rounded-2xl border border-[#dfe9e3] bg-[#f8fcf9] p-6">
              <p className="section-eyebrow">Submission Tips</p>
              <h2 className="mt-2 text-xl font-extrabold text-[#1b2a22]">Help us verify quickly</h2>
              <ul className="mt-4 space-y-4 border-l-2 border-[#d6e6dc] pl-4 text-sm text-[#5d6f65]">
                <li>Capture a clear photo that shows the bin and nearby surroundings.</li>
                <li>The photo uploads to Cloudinary automatically after selection.</li>
                <li>Share the closest intersection or landmark in the description.</li>
              </ul>

              <div className="mt-6 rounded-xl border border-[#e4ece6] bg-white/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1a7b3a]">Need Help?</p>
                <p className="mt-2 text-sm text-[#4f6158]">
                  Reports move faster when location and visuals are complete. You can track every status change
                  from the My Reports page.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
