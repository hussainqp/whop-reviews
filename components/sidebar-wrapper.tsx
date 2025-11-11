'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
	const { setOpen, setOpenMobile } = useSidebar();
	const [mounted, setMounted] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		setMounted(true);
		
		// Set sidebar to collapsed on mobile, open on desktop
		const checkScreenSize = () => {
			if (window.innerWidth < 768) {
				// Mobile: close both desktop and mobile sidebars
				setOpen(false);
				setOpenMobile(false);
			} else {
				// Desktop: open desktop sidebar, close mobile
				setOpen(true);
				setOpenMobile(false);
			}
		};

		// Set initial state
		checkScreenSize();

		// Listen for resize events
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	}, [setOpen, setOpenMobile]);

	// Don't show sidebar trigger on experience or submit pages
	const shouldShowSidebar = mounted && !pathname.startsWith('/experiences/') && !pathname.startsWith('/submit/');

	if (!mounted) {
		return (
			<SidebarInset>
				{children}
			</SidebarInset>
		);
	}

	return (
		<SidebarInset>
			{/* Mobile trigger button */}
			{shouldShowSidebar && (
				<div className="flex items-center gap-2 p-4 border-b border-gray-a4 md:hidden">
					<SidebarTrigger />
				</div>
			)}
			{children}
		</SidebarInset>
	);
}

