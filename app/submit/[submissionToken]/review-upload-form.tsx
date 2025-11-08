'use client';

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";
import { submitReview } from "@/app/actions/reviews";

type ReviewType = "photo" | "video" | "any";

interface ReviewUploadFormProps {
	submissionToken: string;
	reviewType: ReviewType;
	productName: string;
	customerName: string;
}

export function ReviewUploadForm({
	submissionToken,
	reviewType,
	productName,
	customerName,
}: ReviewUploadFormProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [comment, setComment] = useState("");
	const [rating, setRating] = useState<number | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Determine allowed file types based on reviewType
	const getAllowedTypes = () => {
		if (reviewType === "photo") {
			return {
				accept: "image/*",
				types: ["image/jpeg", "image/png", "image/webp"],
				maxSize: 10 * 1024 * 1024, // 10MB
			};
		}
		if (reviewType === "video") {
			return {
				accept: "video/*",
				types: ["video/mp4", "video/mov", "video/webm"],
				maxSize: 50 * 1024 * 1024, // 50MB
			};
		}
		// "any" - allow both
		return {
			accept: "image/*,video/*",
			types: [
				"image/jpeg",
				"image/png",
				"image/webp",
				"video/mp4",
				"video/mov",
				"video/webm",
			],
			maxSize: 50 * 1024 * 1024, // 50MB for videos
		};
	};

	const allowedTypes = getAllowedTypes();

	const validateFile = (file: File): string | null => {
		// Check file size
		if (file.size > allowedTypes.maxSize) {
			const maxMB = Math.round(allowedTypes.maxSize / (1024 * 1024));
			return `File size must be less than ${maxMB}MB`;
		}

		// Check file type
		if (!allowedTypes.types.includes(file.type)) {
			return `File type not supported. Please upload ${reviewType === "photo" ? "an image" : reviewType === "video" ? "a video" : "an image or video"}`;
		}

		return null;
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) {
			setSelectedFile(null);
			return;
		}

		const validationError = validateFile(file);
		if (validationError) {
			setError(validationError);
			setSelectedFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			return;
		}

		setError(null);
		setSelectedFile(file);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const file = e.dataTransfer.files[0];
		if (!file) return;

		const validationError = validateFile(file);
		if (validationError) {
			setError(validationError);
			return;
		}

		setError(null);
		setSelectedFile(file);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedFile) {
			setError("Please select a file to upload");
			return;
		}

		setIsUploading(true);
		setError(null);

		try {
			// Create FormData for file upload
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("submissionToken", submissionToken);
			formData.append("comment", comment);
			formData.append(
				"fileType",
				selectedFile.type.startsWith("image/") ? "photo" : "video"
			);
			if (rating) {
				formData.append("rating", rating.toString());
			}

			await submitReview(formData);
			setSuccess(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsUploading(false);
		}
	};

	if (success) {
		return (
			<div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-8 text-center">
				<div className="mb-4 text-6xl text-green-500">✓</div>
				<h2 className="mb-2 text-2xl font-semibold text-white">Review Submitted!</h2>
				<p className="text-lg text-gray-200">
					Thank you for your review, {customerName}. Your discount code will arrive within 24-48 hours.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Rating Section */}
			<div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-8">
				<div className="text-center mb-6">
					<Label className="text-lg font-semibold text-white mb-4 block">
						How would you rate your experience?
					</Label>
					<div className="flex justify-center">
						<StarRating
							rating={rating}
							onRatingChange={setRating}
							disabled={isUploading}
						/>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* File Upload Section */}
				<div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-8">
					<div className="space-y-4">
						<Label htmlFor="file-upload" className="text-lg font-semibold text-white block mb-4">
							Upload Photo or Video
						</Label>

						<div
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							className={`relative flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors bg-white/5 backdrop-blur-sm ${
								selectedFile
									? "border-blue-400/50"
									: "border-white/30 hover:border-blue-400/50"
							}`}
						>
							{selectedFile ? (
								<div className="text-center">
									<div className="mb-2 text-4xl">
										{selectedFile.type.startsWith("image/") ? "📷" : "🎥"}
									</div>
									<p className="mb-2 font-medium text-white">{selectedFile.name}</p>
									<p className="text-sm text-gray-300">
										{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
									</p>
									<button
										type="button"
										onClick={() => {
											setSelectedFile(null);
											if (fileInputRef.current) {
												fileInputRef.current.value = "";
											}
										}}
										className="mt-4 text-sm text-blue-400 underline hover:text-blue-300"
									>
										Remove file
									</button>
								</div>
							) : (
								<div className="text-center">
									<div className="mb-4 text-5xl">📎</div>
									<p className="mb-2 text-white">
										Drag and drop your file here, or click to browse
									</p>
									<p className="text-sm text-gray-400">
										{reviewType === "photo"
											? "JPEG, PNG, WebP (max 10MB)"
											: reviewType === "video"
												? "MP4, MOV, WebM (max 50MB)"
												: "Images or Videos (max 50MB)"}
									</p>
								</div>
							)}

							<input
								ref={fileInputRef}
								id="file-upload"
								type="file"
								accept={allowedTypes.accept}
								onChange={handleFileChange}
								className="absolute inset-0 cursor-pointer opacity-0"
								disabled={isUploading}
							/>
						</div>
					</div>
				</div>

				{/* Comment Section */}
				<div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-8">
					<div className="space-y-2">
						<Label htmlFor="comment" className="text-lg font-medium text-white">
							Tell us more about your experience (optional)
						</Label>
						<textarea
							id="comment"
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="Share your thoughts..."
							maxLength={500}
							rows={4}
							className="flex w-full rounded-md border border-white/20 bg-white/5 backdrop-blur-sm text-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
						/>
						<p className="text-xs text-gray-400">{comment.length}/500 characters</p>
					</div>
				</div>

				{/* Error Message */}
				{error && (
					<div className="rounded-md border border-red-400/50 bg-red-900/30 backdrop-blur-sm p-4 text-sm text-red-300">
						{error}
					</div>
				)}

				{/* Submit Button */}
				<button
					type="submit"
					disabled={!selectedFile || isUploading}
					className="w-full rounded-xl bg-blue-600/20 backdrop-blur-lg border border-blue-400/30 px-12 py-5 text-center font-bold text-lg text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-600/30 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg disabled:hover:bg-blue-600/20"
				>
					{isUploading ? "Uploading..." : "💬 Submit Review"}
				</button>
			</form>
		</div>
	);
}

