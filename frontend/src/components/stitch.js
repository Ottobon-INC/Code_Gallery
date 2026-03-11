const fs = require('fs');
const path = require('path');

const currentPath = path.join(__dirname, 'ComponentCard.tsx');
const backupPath = path.join(__dirname, 'ComponentCard.backup.tsx');

const current = fs.readFileSync(currentPath, 'utf8').split('\n');
const backup = fs.readFileSync(backupPath, 'utf8').split('\n');

const rightPanel = current.slice(10, 54).join('\n');
const expandedCard = current.slice(55, 204).join('\n');

const imports = `'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Component } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const INTENT_DELAY = 400;
const EXPANDED_WIDTH = 560;
const EXPANDED_HEIGHT = 280;
const CODE_PREVIEW_LINES = 14;

interface ComponentCardProps {
    component: Component;
}

const SPRING = { type: 'spring', stiffness: 320, damping: 30, mass: 0.7 } as const;

`;

const iconsAndPreview = backup.slice(19, 123).join('\n');
const cardBody = backup.slice(240, 298).join('\n');

let mainComp = backup.slice(299, 387).join('\n');

mainComp = mainComp.replace(
    'const [originX, setOriginX] = useState(0);',
    'const [originX, setOriginX] = useState(0);\n    const [expandUp, setExpandUp] = useState(false);'
);

mainComp = mainComp.replace(
    'setOriginX(Math.min(Math.max(ideal, 12), window.innerWidth - EXPANDED_WIDTH - 12));\n        setIsExpanded(true);',
    'setOriginX(Math.min(Math.max(ideal, 12), window.innerWidth - EXPANDED_WIDTH - 12));\n        \n        const spaceBelow = window.innerHeight - r.bottom;\n        setExpandUp(spaceBelow < 300 && r.top > 300);\n        \n        setIsExpanded(true);'
);

mainComp = mainComp.replace(
    'likes={likes} liked={liked} copied={copied}',
    'likes={likes} liked={liked} copied={copied} expandUp={expandUp}'
);

const finalString = [
    imports,
    iconsAndPreview,
    '// ─── Right panel: component metadata ─────────────────────────────────────────',
    rightPanel,
    '// ─── Wide expanded overlay ────────────────────────────────────────────────────',
    expandedCard,
    cardBody,
    mainComp
].join('\n');

fs.writeFileSync(currentPath, finalString);
console.log('Successfully stitched ComponentCard.tsx');
