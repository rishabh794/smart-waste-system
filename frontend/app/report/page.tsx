"use client";

import Image, { type ImageLoader } from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useNetworkStatus } from "@/components/offline/NetworkStatusProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { ChevronIcon } from "@/components/ui/icons";
import { isNetworkError } from "@/lib/offline/network";
import { enqueueCitizenReport } from "@/lib/offline/queue";
import { uploadReportImage } from "@/lib/offline/uploadReportImage";
import { getApiErrorMessage } from "@/lib/services/apiService";
import { createReport, fetchNearbyBin } from "@/lib/services/reportService";
import {
  getValidationErrorMessage,
  reportFormSchema,
  reportFormWithLocalPhotoSchema,
} from "@/lib/validation";
import type { ReportCategory } from "@/types/CitizenTypes";

const CATEGORY_OPTIONS: Array<{ value: ReportCategory; label: string }> = [
  { value: "overflowing", label: "Overflowing Bin" },
  { value: "damaged", label: "Damaged Bin" },
  { value: "missed_pickup", label: "Missed Pickup" },
  { value: "illegal_dumping", label: "Illegal Dumping" },
  { value: "general", label: "General Concern" },
];

const passthroughLoader: ImageLoader = ({ src }) => src;

const isPhoneDevice = () =>
  /iPhone|iPod|Android.+Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export default function ReportIssuePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isOnline } = useNetworkStatus();
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
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBinAutoDetected, setIsBinAutoDetected] = useState(false);
  const [isLookingUpBin, setIsLookingUpBin] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

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
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setFormState((current) => ({
          ...current,
          latitude: lat,
          longitude: lng,
        }));
        setIsLocating(false);

        // Auto-detect nearby bin
        lookupNearbyBin(position.coords.latitude, position.coords.longitude);
      },
      (positionError) => {
        console.error(positionError);
        setLocationError("Location permission is required to submit a report.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000 }
    );
  };

  const lookupNearbyBin = async (lat: number, lng: number) => {
    if (!isOnline) return;

    setIsLookingUpBin(true);
    try {
      const result = await fetchNearbyBin(lat, lng);
      if (result.bin) {
        setFormState((current) => ({ ...current, binId: result.bin!.id }));
        setIsBinAutoDetected(true);
      } else {
        setFormState((current) => ({ ...current, binId: "" }));
        setIsBinAutoDetected(false);
      }
    } catch (error) {
      console.error("Nearby bin lookup failed:", error);
      setFormState((current) => ({ ...current, binId: "" }));
      setIsBinAutoDetected(false);
    } finally {
      setIsLookingUpBin(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    setIsPhone(isPhoneDevice());
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
    setPendingImageFile(file);
    setFormState((current) => ({ ...current, imageUrl: "" }));
    setImageError("");
    setError("");

    if (!isOnline) {
      return;
    }

    setIsUploadingImage(true);

    try {
      const uploadedUrl = await uploadReportImage(file);
      setFormState((current) => ({ ...current, imageUrl: uploadedUrl }));
    } catch (uploadError) {
      console.error(uploadError);
      setImageError("");
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

    if (!formState.imageUrl && !pendingImageFile) {
      setError("Please upload a photo before submitting.");
      return;
    }

    if (!formState.latitude || !formState.longitude) {
      setError("Location is required to submit a report.");
      return;
    }

    const hasLocalPhotoOnly = Boolean(pendingImageFile) && !formState.imageUrl.trim();

    if (hasLocalPhotoOnly) {
      setImageError("");
    }

    const schema = hasLocalPhotoOnly ? reportFormWithLocalPhotoSchema : reportFormSchema;
    const parsed = schema.safeParse(formState);

    if (!parsed.success) {
      setError(getValidationErrorMessage(parsed.error));
      return;
    }

    const trimmedAddress = parsed.data.address?.trim();
    const trimmedBinId = parsed.data.binId?.trim();

    const payload = {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      address: trimmedAddress ? trimmedAddress : undefined,
      binId: trimmedBinId ? trimmedBinId : undefined,
    };

    setIsSubmitting(true);
    setError("");

    const saveReportOffline = async () => {
      if (!pendingImageFile) {
        setError("Please add a photo before submitting offline.");
        return false;
      }

      await enqueueCitizenReport({
        userId: session?.user?.id as string,
        payload: {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          latitude: payload.latitude,
          longitude: payload.longitude,
          address: payload.address,
          binId: payload.binId,
        },
        imageBlob: pendingImageFile,
      });

      toast.success("Report saved offline. It will submit when you're back online.");
      router.push("/reports");
      router.refresh();
      return true;
    };

    try {
      if (!isOnline) {
        await saveReportOffline();
        return;
      }

      let imageUrl = formState.imageUrl;

      if (!imageUrl && pendingImageFile) {
        setIsUploadingImage(true);
        imageUrl = await uploadReportImage(pendingImageFile);
        setIsUploadingImage(false);
      }

      const res = await createReport({
        ...payload,
        imageUrl,
      });

      if (!res.ok) {
        setError(await getApiErrorMessage(res, "Unable to submit report."));
        return;
      }

      toast.success("Report submitted successfully.");
      router.push("/reports");
      router.refresh();
    } catch (submitError) {
      console.error(submitError);

      if (pendingImageFile && isNetworkError(submitError)) {
        await saveReportOffline();
        return;
      }

      setError("Network issue while submitting. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    isUploadingImage ||
    isLocating ||
    !formState.latitude ||
    !formState.longitude ||
    (!formState.imageUrl && !pendingImageFile);

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      {() => (
        <div className="site-container page-shell">
          <DashboardPageHeader
            eyebrow="Citizen Report"
            title="Report a Bin Issue"
            description="We capture your location automatically and upload your photo directly to Cloudinary for faster triage."
          />

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <form onSubmit={handleSubmit} className="soft-surface rounded-2xl p-5 sm:p-6">
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
                          className={`dropdown-option ${formState.category === option.value ? "dropdown-option-selected" : ""
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

                <div className="border-t border-[#e6efe9] pt-4">
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
                        <div className="input-clean text-[#2f3d33]">
                          {formState.latitude || "—"}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7167]">
                          Longitude
                        </label>
                        <div className="input-clean text-[#2f3d33]">
                          {formState.longitude || "—"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#21412f]">
                    {isPhone ? "Take Photo" : "Upload Photo"}
                  </label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture={isPhone ? "environment" : undefined}
                    className={isPhone ? "hidden" : "input-clean"}
                    onChange={handleImageChange}
                  />
                  {isPhone && (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="btn-secondary w-full"
                    >
                      {imagePreviewUrl ? "Retake Photo" : "Open Camera"}
                    </button>
                  )}
                  {isPhone && (
                    <p className="mt-2 text-xs text-[#5f7167]">
                      Use your camera to capture the bin on site. Gallery uploads are not available on mobile.
                    </p>
                  )}
                  {isUploadingImage && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1a7b3a]">
                      Uploading
                    </p>
                  )}
                  {formState.imageUrl && !isUploadingImage && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1a7b3a]">
                      Image uploaded successfully.
                    </p>
                  )}
                  {!formState.imageUrl && pendingImageFile && !isUploadingImage && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a6b16]">
                      Photo saved locally — will upload when online.
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
                  <label className="mb-1 block text-sm font-semibold text-[#21412f]">Bin ID</label>
                  <input
                    readOnly
                    className="input-clean cursor-not-allowed bg-[#f5f9f6] text-[#2f3d33]"
                    placeholder={
                      isLookingUpBin
                        ? "Checking for a nearby bin..."
                        : "Filled automatically from your location, or left blank if none is found"
                    }
                    value={formState.binId}
                  />
                  {isBinAutoDetected && (
                    <p className="mt-1 text-xs text-[#5f7167]">
                      A bin was found within 20m of your location.
                    </p>
                  )}
                  {!isBinAutoDetected && !isLookingUpBin && formState.latitude && (
                    <p className="mt-1 text-xs text-[#5f7167]">
                      No nearby bin detected. You can still submit this report.
                    </p>
                  )}
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

            <aside className="soft-surface rounded-2xl p-5 sm:p-6">
              <p className="section-eyebrow">Submission Tips</p>
              <h2 className="mt-2 text-lg font-extrabold text-[#1b2a22] sm:text-xl">Help us verify quickly</h2>
              <ul className="mt-4 space-y-3 border-l-2 border-[#d6e6dc] pl-4 text-sm text-[#5d6f65]">
                <li>Capture a clear photo that shows the bin and nearby surroundings.</li>
                <li>{isPhone ? "On your phone, use the camera button to take a live photo on site." : "The photo uploads to Cloudinary automatically after selection."}</li>
                <li>Share the closest intersection or landmark in the description.</li>
              </ul>
              <p className="mt-5 border-t border-[#e6efe9] pt-4 text-sm text-[#4f6158]">
                Reports move faster when location and visuals are complete. Track status changes from My Reports.
              </p>
            </aside>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
