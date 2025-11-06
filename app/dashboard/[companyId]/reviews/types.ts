export type Review = {
	id: string;
	customerName: string;
	customerEmail: string | null;
	fileUrl: string | null;
	fileType: "photo" | "video" | null;
	comment: string | null;
	rating: number | null;
	status: string;
	submittedAt: string | null;
	productName: string;
};

