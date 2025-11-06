'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PlayCircle, Star, Trophy } from 'lucide-react';
import { ReviewDetailDialog } from './review-detail-dialog';
import type { ApprovedReview } from './types';

interface ApprovedReviewsGridProps {
	reviews: ApprovedReview[];
}

export function ApprovedReviewsGrid({ reviews }: ApprovedReviewsGridProps) {
	const [selectedReview, setSelectedReview] = useState<ApprovedReview | null>(null);
	const [scrollY, setScrollY] = useState(0);
	const gridRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		const handleScroll = () => {
			setScrollY(window.scrollY);
		};

		// Use requestAnimationFrame for smoother performance
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

	if (reviews.length === 0) {
		return (
			<div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-a4 bg-gray-a2">
				<div className="text-center">
					<Trophy className="mx-auto h-12 w-12 text-gray-10 mb-4" />
					<p className="text-lg text-gray-10">No approved reviews yet</p>
					<p className="mt-2 text-sm text-gray-10">
						Check back soon! Reviews will appear here once they are approved.
					</p>
				</div>
			</div>
		);
	}

	// Create staggered heights for masonry effect
	const getStaggeredHeight = (index: number) => {
		const heights = ['h-64', 'h-80', 'h-72', 'h-96', 'h-68', 'h-84'];
		return heights[index % heights.length];
	};

	// Calculate parallax offset based on scroll position and element position
	const getParallaxOffset = (index: number) => {
		if (typeof window === 'undefined') return 0;
		
		const itemRef = itemRefs.current[index];
		if (!itemRef) return 0;
		
		const rect = itemRef.getBoundingClientRect();
		const viewportCenter = window.innerHeight / 2;
		const itemCenter = rect.top + rect.height / 2;
		
		// Distance from viewport center
		const distanceFromCenter = itemCenter - viewportCenter;
		
		// Parallax speed varies by index for depth effect (creates layered parallax)
		const parallaxSpeed = 0.2 + (index % 5) * 0.1;
		const offset = distanceFromCenter * parallaxSpeed * 0.15;
		
		// Clamp to reasonable values for subtle effect
		return Math.max(-40, Math.min(40, offset));
	};

	return (
		<>
			{/* Hall of Fame Header */}
			<div className="mb-12 text-center">
				<div className="inline-flex items-center gap-3 mb-4">
					<Trophy className="h-8 w-8 text-yellow-600" />
					<h2 className="text-7 font-bold bg-gradient-to-r from-gray-12 to-gray-10 bg-clip-text text-transparent">
						Hall of Fame
					</h2>
					<Trophy className="h-8 w-8 text-yellow-600" />
				</div>
				<p className="text-4 text-gray-10 max-w-2xl mx-auto">
					Showcasing authentic reviews from our amazing customers
				</p>
			</div>

			{/* Parallax Grid */}
			<div
				ref={gridRef}
				className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 auto-rows-auto"
			>
				{reviews.map((review, index) => {
					const parallaxOffset = getParallaxOffset(index);
					const delay = index * 50; // Stagger animation delay
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
								className="relative w-full overflow-hidden rounded-xl border border-gray-a4 bg-gray-a2/80 backdrop-blur-sm transition-all duration-300 hover:border-gray-a6 hover:shadow-2xl hover:scale-105 hover:z-10 flex flex-col group-hover:bg-gray-a3/90"
							>
								{review.fileUrl && (
									<div className={`relative w-full ${heightClass} overflow-hidden bg-gray-a3`}>
										{review.fileType === 'photo' ? (
											<Image
												src={review.fileUrl}
												alt={`Review by ${review.customerName}`}
												fill
												sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
												className="object-cover transition-transform duration-500 group-hover:scale-110"
											/>
										) : (
											<div className="relative w-full h-full">
												<video
													src={review.fileUrl}
													className="h-full w-full object-cover"
													preload="metadata"
												/>
												<div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
													<div className="rounded-full bg-black/60 p-2 group-hover:bg-black/80 transition-all group-hover:scale-110">
														<PlayCircle className="h-8 w-8 text-white" />
													</div>
												</div>
											</div>
										)}
										
										{/* Gradient overlay on hover */}
										<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
									</div>
								)}

								{/* Content overlay */}
								<div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<div className="flex items-center justify-between mb-1">
										<p className="text-sm font-semibold text-white drop-shadow-lg">
											{review.customerName}
										</p>
										{review.rating && (
											<div className="flex items-center gap-1 bg-yellow-600/90 px-2 py-0.5 rounded-full">
												<Star className="h-3 w-3 text-white fill-white" />
												<span className="text-xs font-medium text-white">{review.rating}</span>
											</div>
										)}
									</div>
									{review.comment && (
										<p className="text-xs text-white/90 line-clamp-2 drop-shadow-md leading-tight">
											{review.comment}
										</p>
									)}
								</div>

								{/* Default content (shown when not hovering) */}
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

							{/* Decorative glow effect */}
							<div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-yellow-600/20 via-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10" />
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
