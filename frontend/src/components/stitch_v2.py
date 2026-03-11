import os

def main():
    with open(r'c:\Ottobon\Code_Components\apps\web\src\components\ComponentCard.backup.tsx', 'r', encoding='utf-8') as f:
        lines_backup = f.readlines()
        
    with open(r'c:\Ottobon\Code_Components\apps\web\src\components\ComponentCard.tsx', 'r', encoding='utf-8') as f:
        lines_current = f.readlines()
        
    # Get RightPanel from current (lines 10 to 54)
    right_panel = "".join(lines_current[10:54])
    
    # Get ExpandedCard from current (lines 56 to 204)
    expanded_card = "".join(lines_current[55:204])
    
    # Get Imports and constants (manually write to ensure correctness)
    imports_and_constants = """'use client';

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

"""
    # Get Icons and CodePreview from backup (lines 20 to 123)
    icons_and_code_preview = "".join(lines_backup[19:123])
    
    # Get CardBody from backup (lines 241 to 298)
    card_body = "".join(lines_backup[240:298])
    
    # Main ComponentCard from backup (lines 300 to 387)
    main_component_card = "".join(lines_backup[299:387])
    
    # Inject expandUp logic into Main ComponentCard
    main_component_card = main_component_card.replace(
        "const [originX, setOriginX] = useState(0);",
        "const [originX, setOriginX] = useState(0);\n    const [expandUp, setExpandUp] = useState(false);"
    )
    
    main_component_card = main_component_card.replace(
        "setOriginX(Math.min(Math.max(ideal, 12), window.innerWidth - EXPANDED_WIDTH - 12));\n        setIsExpanded(true);",
        "setOriginX(Math.min(Math.max(ideal, 12), window.innerWidth - EXPANDED_WIDTH - 12));\n        \n        const spaceBelow = window.innerHeight - r.bottom;\n        setExpandUp(spaceBelow < 300 && r.top > 300);\n        \n        setIsExpanded(true);"
    )
    
    main_component_card = main_component_card.replace(
        "likes={likes} liked={liked} copied={copied}",
        "likes={likes} liked={liked} copied={copied} expandUp={expandUp}"
    )

    final = imports_and_constants + icons_and_code_preview + "\n// ─── Right panel: component metadata ─────────────────────────────────────────\n" + right_panel + "\n// ─── Wide expanded overlay ────────────────────────────────────────────────────\n" + expanded_card + "\n" + card_body + "\n" + main_component_card
    
    with open(r'c:\Ottobon\Code_Components\apps\web\src\components\ComponentCard.tsx', 'w', encoding='utf-8') as f:
        f.write(final)

if __name__ == "__main__":
    main()
