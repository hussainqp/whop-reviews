"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@whop/react/components";
import { useRouter } from "next/navigation";

type OnboardingStep = 0 | 1 | 2 | 3 | 4; // 0 = welcome (optional), 1-4 = main steps

interface OnboardingStepData {
	title: string;
	description: string;
	emoji: string;
	videoPlaceholder?: boolean;
}

const steps: Record<OnboardingStep, OnboardingStepData> = {
	0: {
		title: "Turn your customers into your best marketers.",
		description: "See how it works",
		emoji: "🎬",
	},
	1: {
		title: "Sync your products and set up rewards for your reviewers.",
		description: "",
		emoji: "📦",
		videoPlaceholder: true,
	},
	2: {
		title: "We email your buyers automatically—so you get video or image reviews without any effort.",
		description: "",
		emoji: "✉️",
		videoPlaceholder: true,
	},
	3: {
		title: "Approve reviews, send rewards, or give feedback with one click.",
		description: "",
		emoji: "✅",
		videoPlaceholder: true,
	},
	4: {
		title: "Build trust and boost sales with authentic photo and video reviews.",
		description: "",
		emoji: "🎥",
		videoPlaceholder: true,
	},
};

export default function Onboarding({
	onGetStarted,
}: {
	onGetStarted: () => Promise<void>;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [currentStep, setCurrentStep] = useState<OnboardingStep>(0);

	// Hide navigation during onboarding
	useEffect(() => {
		document.documentElement.setAttribute('data-onboarding', 'true');
		return () => {
			document.documentElement.removeAttribute('data-onboarding');
		};
	}, []);

	const isLastStep = currentStep === 4;
	const isWelcomeStep = currentStep === 0;

	function handleNext() {
		if (isLastStep) {
			handleGetStarted();
		} else {
			setCurrentStep((prev) => {
				// Skip to step 1 if coming from welcome
				if (prev === 0) return 1;
				return (prev + 1) as OnboardingStep;
			});
		}
	}

	function handleSkip() {
		if (isWelcomeStep) {
			setCurrentStep(1);
		} else {
			handleGetStarted();
		}
	}

	function handleGetStarted() {
		setError(null);
		startTransition(async () => {
			try {
				await onGetStarted();
				router.refresh();
			} catch (e) {
				setError((e as { message?: string }).message || "Something went wrong");
			}
		});
	}

	function goToStep(step: OnboardingStep) {
		setCurrentStep(step);
	}

	const currentStepData = steps[currentStep];

	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-gray-1 via-gray-2 to-gray-3">
			<div className="w-full max-w-4xl">
				{/* Step Indicator */}
				{/* {!isWelcomeStep && (
					<div className="mb-8 flex items-center justify-center gap-2">
						{[1, 2, 3, 4].map((step) => {
							const stepIndex = step as OnboardingStep;
							const isActive = stepIndex === currentStep;
							const isCompleted = stepIndex < currentStep;
							return (
								<button
									key={step}
									type="button"
									onClick={() => goToStep(stepIndex)}
									className={`flex items-center gap-2 transition-all ${
										isActive ? "scale-110" : ""
									}`}
									disabled={isPending}
								>
									<div
										className={`h-2 w-12 rounded-full transition-all ${
											isCompleted
												? "bg-green-9"
												: isActive
													? "bg-blue-9"
													: "bg-gray-a4"
										}`}
									/>
									{step === 4 && (
										<span className="text-xs text-gray-10">{step}/4</span>
									)}
								</button>
							);
						})}
					</div>
				)} */}

				{/* Main Content Card with Frosted Glass */}
				<div className="relative overflow-hidden rounded-2xl border border-gray-a4 bg-gray-a2/80 backdrop-blur-xl shadow-2xl">
					{/* Frosted glass effect overlay */}
					<div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

					<div className="relative p-12">
						{/* Step Content */}
						<div className="flex flex-col items-center text-center gap-8">
							{/* Emoji/Icon */}
							{/* <div className="animate-in fade-in zoom-in duration-500" style={{ fontSize: '60px' }}>
								{currentStepData.emoji}
							</div> */}

							{/* Title */}
							<h2 className="text-6 font-bold text-gray-12 max-w-2xl leading-tight">
								{currentStepData.title}
							</h2>

							{/* Description (if provided) */}
							{currentStepData.description && (
								<p className="text-3 text-gray-10 max-w-xl">
									{currentStepData.description}
								</p>
							)}

							{/* Video Placeholder */}
							{currentStepData.videoPlaceholder && (
								<div className="w-full max-w-3xl aspect-video rounded-xl border-2 border-dashed border-gray-a6 bg-gray-a3/50 backdrop-blur-sm flex items-center justify-center overflow-hidden">
									<div className="flex flex-col items-center gap-4 text-gray-10">
										<svg
											className="w-16 h-16"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
											/>
										</svg>
										<p className="text-sm font-medium">Video placeholder</p>
										<p className="text-xs text-gray-9">
											{currentStep === 1
												? "Add your product sync demo video here"
												: currentStep === 2
													? "Add your automated email demo video here"
													: currentStep === 3
														? "Add your approval workflow demo video here"
														: "Add your review showcase demo video here"}
										</p>
									</div>
								</div>
							)}

							{/* Error Message */}
							{error && (
								<div className="rounded-lg border border-red-6 bg-red-2 p-4 text-sm text-red-11 max-w-md">
									{error}
								</div>
							)}

							{/* Action Buttons */}
							<div className="flex items-center gap-4 mt-4">
								{!isWelcomeStep && !isLastStep && (
									<Button
										variant="ghost"
										size="3"
										disabled={isPending}
										onClick={handleSkip}
										className="text-gray-10 hover:text-gray-12"
									>
										Skip
									</Button>
								)}
								{isWelcomeStep && (
									<Button
										variant="ghost"
										size="3"
										disabled={isPending}
										onClick={handleSkip}
										className="text-gray-10 hover:text-gray-12"
									>
										Skip intro
									</Button>
								)}
								<Button
									variant="classic"
									size="3"
									disabled={isPending}
									onClick={handleNext}
									className="min-w-[140px]"
								>
									{isPending
										? "Setting up..."
										: isLastStep
											? "Get Started"
											: isWelcomeStep
												? "See how it works"
												: "Next"}
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Progress dots for mobile */}
				{!isWelcomeStep && (
					<div className="mt-6 flex items-center justify-center gap-2">
						{[1, 2, 3, 4].map((step) => {
							const stepIndex = step as OnboardingStep;
							const isActive = stepIndex === currentStep;
							return (
								<button
									key={step}
									type="button"
									onClick={() => goToStep(stepIndex)}
									disabled={isPending}
									className={`h-2 w-2 rounded-full transition-all ${
										isActive ? "bg-blue-9 w-8" : "bg-gray-a4"
									}`}
									aria-label={`Go to step ${step}`}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
