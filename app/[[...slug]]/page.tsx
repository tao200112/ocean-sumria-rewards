'use client';

import dynamic from 'next/dynamic';

// Dynamically import the App component to avoid SSR issues with window/localStorage
const App = dynamic(() => import('../../App'), { ssr: false });

export default function Page() {
    return <App />;
}
