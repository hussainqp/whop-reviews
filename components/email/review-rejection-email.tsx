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

interface ReviewRejectionEmailProps {
	customerName: string;
	productName: string;
	rejectionReason?: string;
	brandName: string;
}

export default function ReviewRejectionEmail({
	customerName,
	productName,
	rejectionReason,
	brandName,
}: ReviewRejectionEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Update on your review submission</Preview>
			<Tailwind>
				<Body className="bg-white font-sans">
					<Container className="mx-auto w-full max-w-[600px] p-0">
						<Section className="p-8 text-center">
							<Text className="mx-0 mt-4 mb-8 p-0 text-center font-normal text-3xl">
								📝 Update on Your Review
							</Text>
						</Section>

						<Section className="px-8 pb-8">
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								Hey <strong>{customerName}</strong>,
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								Thank you for taking the time to submit a review for{' '}
								<strong>{productName}</strong>. We truly appreciate your effort
								and feedback.
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								After careful review, we&apos;re unable to approve your submission
								at this time. We want to be transparent with you about this decision.
							</Text>
						</Section>

						<Section className="my-6 rounded-2xl bg-orange-50 bg-[radial-gradient(circle_at_bottom_right,#f97316_0%,transparent_60%)] p-8">
							<Heading className="m-0 mb-4 font-medium text-2xl text-gray-900">
								Why Wasn&apos;t It Approved?
							</Heading>
							{rejectionReason ? (
								<>
									<Text className="mb-4 text-base leading-6 text-gray-700">
										Here&apos;s the feedback from our review team:
									</Text>
									<Text className="my-4 rounded-lg bg-white p-4 text-base leading-6 text-gray-900 border border-orange-200">
										{rejectionReason}
									</Text>
								</>
							) : (
								<Text className="mb-4 text-base leading-6 text-gray-700">
									Your review didn&apos;t meet our current guidelines. We encourage
									you to review our submission requirements and try again if you&apos;d
									like.
								</Text>
							)}
						</Section>

						<Section className="px-8 pb-8">
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								We value your input and encourage you to submit another review that
								meets our guidelines. We&apos;re here to help if you have any questions
								about our review requirements.
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								Thank you for understanding, and we hope to see another submission from
								you soon!
							</Text>
							<Text className="mb-4 text-lg leading-7 text-gray-900">
								Best regards,
								<br />
								<strong>The {brandName} Team</strong>
							</Text>
						</Section>

						<Hr className="mx-8 my-6 border-gray-300" />

						<Section className="px-8 pb-6 text-center">
							<Text className="text-xs text-gray-500">
								You&apos;re receiving this email because your review for {productName} from{' '}
								{brandName} was recently reviewed.
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

ReviewRejectionEmail.PreviewProps = {
	customerName: 'John Doe',
	productName: 'Premium Course Access',
	rejectionReason: 'The review content did not meet our quality guidelines. Please ensure your review is clear, constructive, and relevant to the product.',
	brandName: 'Your Brand',
} satisfies ReviewRejectionEmailProps;

