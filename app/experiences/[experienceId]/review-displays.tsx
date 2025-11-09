'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PlayCircle, Star } from 'lucide-react';
import { ReviewDetailDialog } from './review-detail-dialog';
import type { ApprovedReview } from './types';

interface ReviewDisplayProps {
	reviews: ApprovedReview[];
	format: 'grid' | 'list' | 'cards';
}

// Grid Layout (Original)
export function GridDisplay({ reviews }: { reviews: ApprovedReview[] }) {
	const [selectedReview, setSelectedReview] = useState<ApprovedReview | null>(null);
	const [scrollY, setScrollY] = useState(0);
	const gridRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY);
		let ticking = false;
		const optimizedScroll = () => {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					handleScroll();
					ticking = false;
				});
				ticking = true;
			}
		};
		window.addEventListener('scroll', optimizedScroll, { passive: true });
		return () => window.removeEventListener('scroll', optimizedScroll);
	}, []);

	const getParallaxOffset = (index: number) => {
		if (typeof window === 'undefined') return 0;
		const itemRef = itemRefs.current[index];
		if (!itemRef) return 0;
		const rect = itemRef.getBoundingClientRect();
		const viewportCenter = window.innerHeight / 2;
		const itemCenter = rect.top + rect.height / 2;
		const distanceFromCenter = itemCenter - viewportCenter;
		const parallaxSpeed = 0.2 + (index % 5) * 0.1;
		const offset = distanceFromCenter * parallaxSpeed * 0.15;
		return Math.max(-40, Math.min(40, offset));
	};

	const getStaggeredHeight = (index: number) => {
		const heights = ['h-64', 'h-80', 'h-72', 'h-96', 'h-68', 'h-84'];
		return heights[index % heights.length];
	};

	return (
		<>
			<div
				ref={gridRef}
				className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 auto-rows-auto gap-3 sm:gap-4"
			>
				{reviews.map((review, index) => {
					const parallaxOffset = getParallaxOffset(index);
					const delay = index * 50;
					const heightClass = getStaggeredHeight(index);

					return (
						<div
							key={review.id}
							ref={(el) => { itemRefs.current[index] = el; }}
							className="group relative animate-in fade-in slide-in-from-bottom-4 duration-700"
							style={{
								transform: `translateY(${parallaxOffset}px)`,
								transition: 'transform 0.15s ease-out',
								animationDelay: `${delay}ms`,
							}}
						>
							<button
								onClick={() => setSelectedReview(review)}
								className="relative w-full overflow-hidden rounded-xl border border-gray-a4 bg-gray-a2/80 backdrop-blur-sm flex flex-col"
							>
								{review.fileUrl && (
									<div className={`relative w-full ${heightClass} overflow-hidden bg-gray-a3`}>
										{review.fileType === 'photo' ? (
											<Image
												src={review.fileUrl}
												alt={`Review by ${review.customerName}`}
												fill
												sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
												className="object-cover"
											/>
										) : (
											<div className="relative w-full h-full">
												<video
													src={review.fileUrl}
													className="h-full w-full object-cover"
													preload="metadata"
												/>
												<div className="absolute inset-0 flex items-center justify-center bg-black/20">
													<div className="rounded-full bg-black/60 p-2">
														<PlayCircle className="h-8 w-8 text-white" />
													</div>
												</div>
											</div>
										)}
									</div>
								)}
								{/* Content always visible */}
								<div className="p-3 flex-1 flex flex-col min-h-[60px]">
									<div className="flex items-center justify-between mb-1">
										<p className="text-xs font-medium text-gray-12 truncate flex-1">
											{review.customerName}
										</p>
										{review.rating && (
											<div className="flex items-center gap-0.5 shrink-0 ml-1">
												<Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
												<span className="text-[10px] text-gray-10">{review.rating}</span>
											</div>
										)}
									</div>
									<p className="text-[10px] text-gray-10 line-clamp-1 mb-0.5">
										{review.productName}
									</p>
									{review.comment && (
										<p className="text-[9px] text-gray-10 line-clamp-2 mt-0.5 leading-tight">
											{review.comment}
										</p>
									)}
								</div>
							</button>
						</div>
					);
				})}
			</div>
			{selectedReview && (
				<ReviewDetailDialog
					review={selectedReview}
					open={!!selectedReview}
					onOpenChange={(open: boolean) => !open && setSelectedReview(null)}
				/>
			)}
		</>
	);
}

// List Layout
export function ListDisplay({ reviews }: { reviews: ApprovedReview[] }) {
	const [selectedReview, setSelectedReview] = useState<ApprovedReview | null>(null);

	return (
		<>
			<div className="space-y-3 sm:space-y-4">
				{reviews.map((review) => (
					<div
						key={review.id}
						className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-a4 bg-gray-a2/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer"
						onClick={() => setSelectedReview(review)}
					>
						{review.fileUrl && (
							<div className="relative w-full sm:w-24 h-48 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-a3">
								{review.fileType === 'photo' ? (
									<Image
										src={review.fileUrl}
										alt={`Review by ${review.customerName}`}
										fill
										className="object-cover"
									/>
								) : (
									<div className="relative w-full h-full">
										<video
											src={review.fileUrl}
											className="h-full w-full object-cover"
											preload="metadata"
										/>
										<div className="absolute inset-0 flex items-center justify-center bg-black/20">
											<PlayCircle className="h-6 w-6 text-white" />
										</div>
									</div>
								)}
							</div>
						)}
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between mb-2 flex-wrap gap-2">
								<p className="font-semibold text-gray-12 text-sm sm:text-base">{review.customerName}</p>
								{review.rating && (
									<div className="flex items-center gap-0.5 sm:gap-1">
										{[...Array(5)].map((_, i) => (
											<Star
												key={i}
												fill={i < review.rating! ? 'currentColor' : 'none'}
												className={`h-3 w-3 sm:h-4 sm:w-4 ${
													i < review.rating!
														? 'text-yellow-600'
														: 'text-gray-300'
												}`}
											/>
										))}
									</div>
								)}
							</div>
							{review.comment && (
								<p className="text-xs sm:text-sm text-gray-10 line-clamp-2">{review.comment}</p>
							)}
							<p className="text-xs sm:text-sm text-gray-10 mt-1">{review.productName}</p>
						</div>
					</div>
				))}
			</div>
			{selectedReview && (
				<ReviewDetailDialog
					review={selectedReview}
					open={!!selectedReview}
					onOpenChange={(open: boolean) => !open && setSelectedReview(null)}
				/>
			)}
		</>
	);
}

// Cards Layout (with rating bar)
export function CardsDisplay({ reviews }: { reviews: ApprovedReview[] }) {
	const [selectedReview, setSelectedReview] = useState<ApprovedReview | null>(null);

	return (
		<>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
				{reviews.map((review) => (
					<div
						key={review.id}
						className="rounded-2xl border border-gray-a4 bg-gray-a2/80 backdrop-blur-sm overflow-hidden"
						onClick={() => setSelectedReview(review)}
					>
						{review.fileUrl && (
							<div className="relative w-full h-64 overflow-hidden bg-gray-a3">
								{review.fileType === 'photo' ? (
									<Image
										src={review.fileUrl}
										alt={`Review by ${review.customerName}`}
										fill
										className="object-cover"
									/>
								) : (
									<div className="relative w-full h-full">
										<video
											src={review.fileUrl}
											className="h-full w-full object-cover"
											preload="metadata"
										/>
										<div className="absolute inset-0 flex items-center justify-center bg-black/20">
											<div className="rounded-full bg-black/60 p-2">
												<PlayCircle className="h-8 w-8 text-white" />
											</div>
										</div>
									</div>
								)}
							</div>
						)}
						{review.rating && (
							<div className="bg-green-600/90 px-4 py-2">
								<div className="flex items-center gap-1">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											fill={i < review.rating! ? 'currentColor' : 'none'}
											className={`h-4 w-4 ${
												i < review.rating!
													? 'text-white'
													: 'text-white/30'
											}`}
										/>
									))}
								</div>
							</div>
						)}
						<div className="p-3 sm:p-4">
							<div className="flex items-center justify-between mb-1 flex-wrap gap-2">
								<p className="font-bold text-gray-12 text-sm sm:text-base">{review.customerName}</p>
								{review.rating && (
									<div className="flex items-center gap-1">
										<Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 fill-yellow-600" />
										<span className="text-xs sm:text-sm text-gray-10">{review.rating}</span>
									</div>
								)}
							</div>
							<p className="text-xs sm:text-sm text-gray-10 mb-2">{review.productName}</p>
							{review.comment && (
								<p className="text-xs sm:text-sm text-gray-10 line-clamp-2 sm:line-clamp-3">{review.comment}</p>
							)}
						</div>
					</div>
				))}
			</div>
			{selectedReview && (
				<ReviewDetailDialog
					review={selectedReview}
					open={!!selectedReview}
					onOpenChange={(open: boolean) => !open && setSelectedReview(null)}
				/>
			)}
		</>
	);
}

// Main component that selects the display format
export function ReviewDisplay({ reviews, format }: ReviewDisplayProps) {
	if (reviews.length === 0) {
		return (
			<div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-a4 bg-gray-a2">
				<div className="text-center">
					<p className="text-lg text-gray-10">No approved reviews yet</p>
					<p className="mt-2 text-sm text-gray-10">
						Check back soon! Reviews will appear here once they are approved.
					</p>
				</div>
			</div>
		);
	}

	switch (format) {
		case 'list':
			return <ListDisplay reviews={reviews} />;
		case 'cards':
			return <CardsDisplay reviews={reviews} />;
		case 'grid':
		default:
			return <GridDisplay reviews={reviews} />;
	}
}

