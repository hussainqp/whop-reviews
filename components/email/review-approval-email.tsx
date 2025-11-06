import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components';

interface ReviewApprovalEmailProps {
	customerName: string;
	productName: string;
	promoCode: string;
	brandName: string;
}

export default function ReviewApprovalEmail({
	customerName,
	productName,
	promoCode,
	brandName,
}: ReviewApprovalEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Thank you for your review! Here's your reward 🎉</Preview>
			<Tailwind>
				<Body className="bg-white font-sans">
					<Container className="mx-auto w-full max-w-[600px] p-0">
						<Section className="p-8 text-center">
							<Text className="mx-0 mt-4 mb-8 p-0 text-center font-normal text-3xl">
								🎉 Thank You for Your Review!
							</Text>
						</Section>

						<Section className="px-8 pb-8">
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								Hey <strong>{customerName}</strong>,
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								We&apos;re thrilled to let you know that your review for{' '}
								<strong>{productName}</strong> has been approved!
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								Your feedback helps other customers make informed decisions, and we truly
								appreciate you taking the time to share your experience with us.
							</Text>
						</Section>

						<Section className="my-6 rounded-2xl bg-green-50 bg-[radial-gradient(circle_at_bottom_right,#22c55e_0%,transparent_60%)] p-8 text-center">
							<Heading className="m-0 mb-4 font-medium text-2xl text-gray-900">
								🎁 Your Reward is Here!
							</Heading>
							<Text className="mb-6 text-base leading-6 text-gray-700">
								As a token of our appreciation, here&apos;s an exclusive promo code just for you:
							</Text>
							<Text className="my-4 font-bold text-4xl text-gray-900 leading-tight">
								{promoCode}
							</Text>
							<Text className="text-base text-gray-700">
								Use this code on your next purchase to unlock your special reward!
							</Text>
						</Section>

						<Section className="px-8 pb-8">
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								We&apos;re so grateful for customers like you who take the time to share their
								thoughts and help build our community.
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								Thank you again for being amazing!
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
								You&apos;re receiving this email because your review for {productName} from{' '}
								{brandName} was recently approved.
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

ReviewApprovalEmail.PreviewProps = {
	customerName: 'John Doe',
	productName: 'Premium Course Access',
	promoCode: 'SAVE20',
	brandName: 'Your Brand',
} satisfies ReviewApprovalEmailProps;

