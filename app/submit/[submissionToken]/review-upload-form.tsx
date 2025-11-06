'use client';

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { submitReview } from "@/lib/actions/reviews";

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
			<div className="rounded-lg border border-gray-a4 bg-gray-a2 p-8 text-center">
				<div className="mb-4 text-6xl">✓</div>
				<h2 className="mb-2 text-2xl font-semibold text-gray-12">Review Submitted!</h2>
				<p className="text-gray-10">
					Thank you for your review, {customerName}. Your discount code will arrive within 24-48 hours.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* File Upload Section */}
			<div className="space-y-2">
				<Label htmlFor="file-upload">
					{reviewType === "photo"
						? "Upload Photo"
						: reviewType === "video"
							? "Upload Video"
							: "Upload Photo or Video"}
				</Label>

				<div
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					className={`relative flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
						selectedFile
							? "border-gray-a6 bg-gray-a3"
							: "border-gray-a4 bg-gray-a2 hover:border-gray-a6"
					}`}
				>
					{selectedFile ? (
						<div className="text-center">
							<div className="mb-2 text-4xl">
								{selectedFile.type.startsWith("image/") ? "📷" : "🎥"}
							</div>
							<p className="mb-2 font-medium text-gray-12">{selectedFile.name}</p>
							<p className="text-sm text-gray-10">
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
								className="mt-4 text-sm text-gray-10 underline hover:text-gray-12"
							>
								Remove file
							</button>
						</div>
					) : (
						<div className="text-center">
							<div className="mb-4 text-5xl">📎</div>
							<p className="mb-2 text-gray-12">
								Drag and drop your {reviewType === "photo" ? "photo" : reviewType === "video" ? "video" : "file"} here, or click to browse
							</p>
							<p className="text-sm text-gray-10">
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
						capture={reviewType === "photo" ? "environment" : undefined}
						onChange={handleFileChange}
						className="absolute inset-0 cursor-pointer opacity-0"
						disabled={isUploading}
					/>
				</div>

				{/* Type selector for "any" */}
				{reviewType === "any" && !selectedFile && (
					<div className="flex gap-4">
						<button
							type="button"
							onClick={() => {
								if (fileInputRef.current) {
									fileInputRef.current.accept = "image/*";
									fileInputRef.current.capture = "environment";
									fileInputRef.current.click();
								}
							}}
							className="flex-1 rounded-md border border-gray-a4 bg-gray-a2 px-4 py-2 text-sm hover:bg-gray-a3"
						>
							📷 Upload Photo
						</button>
						<button
							type="button"
							onClick={() => {
								if (fileInputRef.current) {
									fileInputRef.current.accept = "video/*";
									fileInputRef.current.capture = "";
									fileInputRef.current.click();
								}
							}}
							className="flex-1 rounded-md border border-gray-a4 bg-gray-a2 px-4 py-2 text-sm hover:bg-gray-a3"
						>
							🎥 Upload Video
						</button>
					</div>
				)}
			</div>

			{/* Comment Section */}
			<div className="space-y-2">
				<Label htmlFor="comment">Tell us more about your experience (optional)</Label>
				<textarea
					id="comment"
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Share your thoughts..."
					maxLength={500}
					rows={4}
					className="flex w-full rounded-md border border-gray-a4 bg-gray-a2 px-3 py-2 text-sm placeholder:text-gray-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-a8 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				/>
				<p className="text-xs text-gray-10">{comment.length}/500 characters</p>
			</div>

			{/* Error Message */}
			{error && (
				<div className="rounded-md border border-red-6 bg-red-2 p-4 text-sm text-red-11">
					{error}
				</div>
			)}

			{/* Submit Button */}
			<button
				type="submit"
				disabled={!selectedFile || isUploading}
				className="w-full rounded-md bg-gray-12 px-4 py-3 font-medium text-gray-1 transition-colors hover:bg-gray-11 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{isUploading ? "Uploading..." : "Submit Review"}
			</button>
		</form>
	);
}

