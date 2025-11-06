import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components';

interface ReviewRequestEmailProps {
	customerName: string;
	productName: string;
	promoDetails: string;
	brandName: string;
	reviewLink: string;
}

export default function ReviewRequestEmail({
	customerName,
	productName,
	promoDetails,
	brandName,
	reviewLink,
}: ReviewRequestEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Share your experience & get rewarded!</Preview>
			<Tailwind>
				<Body className="bg-white font-sans">
					<Container className="mx-auto w-full max-w-[600px] p-0">
						<Section className="my-6 rounded-2xl bg-purple-50 bg-gradient-to-r from-purple-100 to-purple-400 p-8 text-center">
							<Text className="mx-0 mt-4 mb-8 p-0 text-center font-normal text-3xl text-gray-900">
								💬 Share your experience & get rewarded!
							</Text>
						</Section>

						<Section className="px-8 pb-8">
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								Hey <strong>{customerName}</strong>,
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								We hope you&apos;re loving your recent purchase of{' '}
								<strong>{productName}</strong>!
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								Your experience means the world to us — and to other shoppers who are
								deciding what to buy next.
							</Text>
						</Section>

						<Section className="my-6 rounded-2xl bg-blue-50 bg-[radial-gradient(circle_at_bottom_right,#3b82f6_0%,transparent_60%)] p-8">
							<Heading className="m-0 mb-4 text-center font-medium text-2xl text-gray-900">
								Here&apos;s the deal:
							</Heading>
							<Text className="mb-4 text-center text-lg leading-7 text-gray-900">
								👉 Leave a quick review about your experience
								<br />
								👉 Upload it using the link below
								<br />
								👉 Once your review is approved by our team, you&apos;ll receive an
								exclusive promo reward in your inbox 🎉
							</Text>
							<Text className="mb-6 text-center text-base leading-6 text-gray-700">
								Your story helps others make confident choices — and we think that
								deserves a little something special.
							</Text>
							<div className="text-center">
								<Link
									href={reviewLink}
									className="inline-flex items-center rounded-full bg-blue-600 px-12 py-4 text-center font-bold text-base text-white no-underline"
								>
									💬  Share My Review
								</Link>
							</div>
						</Section>

						<Section className="my-6 rounded-2xl bg-purple-50 bg-gradient-to-r from-purple-100 to-purple-400 p-8 text-center">
							<Heading className="m-0 mb-4 font-medium text-2xl text-gray-900">
								Once it&apos;s approved, you&apos;ll receive:
							</Heading>
							<Text className="my-4 font-bold text-3xl text-gray-900 leading-tight">
								🎁 {promoDetails}
							</Text>
							<Text className="text-base text-gray-700">
								— our way of saying thank you for being amazing!
							</Text>
						</Section>

						<Section className="px-8 pb-8">
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								We can&apos;t wait to hear what you think.
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								With love,
								<br />
								<strong>The {brandName} Team</strong> 💖
							</Text>
						</Section>

						<Hr className="mx-8 my-6 border-gray-300" />

						<Section className="px-8 pb-6 text-center">
							<Text className="text-xs text-gray-500">
								You&apos;re receiving this email because you recently purchased{' '}
								{productName} from {brandName}.
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

ReviewRequestEmail.PreviewProps = {
	customerName: 'John Doe',
	productName: 'Premium Course Access',
	promoDetails: '20% Off Your Next Purchase',
	brandName: 'Your Brand',
	reviewLink: 'https://example.com/submit/review-token-123',
} satisfies ReviewRequestEmailProps;

