'use client';

import React from 'react';
import { LuckyWheelView } from '../../../components/activities/LuckyWheelView';
import { BottomNav } from '../../../components/customer/BottomNav';

export default function LuckyWheelPage() {
    return (
        <div className="bg-ocean-950 min-h-screen">
            <LuckyWheelView />
            <BottomNav currentTab="home" />
        </div>
    );
}
