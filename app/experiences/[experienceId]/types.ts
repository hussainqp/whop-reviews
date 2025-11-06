export type ApprovedReview = {
	id: string;
	customerName: string;
	customerEmail: string | null;
	fileUrl: string | null;
	fileType: 'photo' | 'video' | null;
	comment: string | null;
	rating: number | null;
	status: 'approved';
	approvedAt: string | null;
	productName: string;
};

