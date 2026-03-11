import re

def main():
    with open(r'c:\Ottobon\Code_Components\apps\web\src\components\ComponentCard.backup.tsx', 'r', encoding='utf-8') as f:
        backup = f.read()
    
    with open(r'c:\Ottobon\Code_Components\apps\web\src\components\ComponentCard.tsx', 'r', encoding='utf-8') as f:
        current = f.read()
        
    # Extract RightPanel and ExpandedCard from current
    # RightPanel starts at "function RightPanel" and ends right before "function ExpandedCard"
    match_right = re.search(r'function RightPanel.*?(?=\s*function ExpandedCard)', current, re.DOTALL)
    right_panel = match_right.group(0) if match_right else ""
    
    # ExpandedCard starts at "function ExpandedCard" and goes to the end
    match_expanded = re.search(r'function ExpandedCard.*', current, re.DOTALL)
    expanded_card = match_expanded.group(0) if match_expanded else ""
    
    # We want:
    # 1. Imports from backup (plus adding useEffect, useCallback, useSession if needed)
    # Actually, current has:
    # 'use client';
    # import { useState, useRef } from 'react';
    # import { motion, AnimatePresence } from 'framer-motion';
    # import Link from 'next/link';
    # import type { Component } from '@/types';
    
    imports = """'use client';

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

    # 2. Icons and Highlight and CodePreview and CardBody from backup
    # Icons: from "const HeartIcon" to "// ─── Right panel"
    match_icons_code = re.search(r'(// ─── Icons ────────────────────────────────────────────────────────────────────.*?)(?=// ─── Right panel)', backup, re.DOTALL)
    icons_code = match_icons_code.group(1) if match_icons_code else ""
    
    match_card_body = re.search(r'(// ─── Normal card ─────────────────────────────────────────────────────────────.*?)(?=// ─── Main ComponentCard )', backup, re.DOTALL)
    card_body = match_card_body.group(1) if match_card_body else ""
    
    # 3. Main ComponentCard from backup, but add expandUp state
    match_main = re.search(r'export function ComponentCard.*', backup, re.DOTALL)
    main_comp = match_main.group(0) if match_main else ""
    
    main_comp = main_comp.replace(
        "const [originX, setOriginX] = useState(0);",
        "const [originX, setOriginX] = useState(0);\n    const [expandUp, setExpandUp] = useState(false);"
    )
    
    start_expand_orig = """    const startExpand = useCallback(() => {
        if (!wrapperRef.current) return;
        const r = wrapperRef.current.getBoundingClientRect();
        setRect(r);
        const ideal = r.left + r.width / 2 - EXPANDED_WIDTH / 2;
        setOriginX(Math.min(Math.max(ideal, 12), window.innerWidth - EXPANDED_WIDTH - 12));
        setIsExpanded(true);
    }, []);"""
    
    start_expand_new = """    const startExpand = useCallback(() => {
        if (!wrapperRef.current) return;
        const r = wrapperRef.current.getBoundingClientRect();
        setRect(r);
        const ideal = r.left + r.width / 2 - EXPANDED_WIDTH / 2;
        setOriginX(Math.min(Math.max(ideal, 12), window.innerWidth - EXPANDED_WIDTH - 12));
        
        const spaceBelow = window.innerHeight - r.bottom;
        setExpandUp(spaceBelow < 300 && r.top > 300);
        
        setIsExpanded(true);
    }, []);"""
    
    main_comp = main_comp.replace(start_expand_orig, start_expand_new)
    
    # Also pass expandUp to ExpandedCard inside main_comp
    main_comp = main_comp.replace(
        "likes={likes} liked={liked} copied={copied}",
        "likes={likes} liked={liked} copied={copied} expandUp={expandUp}"
    )

    final_content = imports + "\n" + icons_code + "\n// ─── Right panel: component metadata ─────────────────────────────────────────\n" + right_panel + "\n// ─── Wide expanded overlay ────────────────────────────────────────────────────\n" + expanded_card + "\n" + card_body + "\n// ─── Main ComponentCard ───────────────────────────────────────────────────────\n\n" + main_comp
    
    with open(r'c:\Ottobon\Code_Components\apps\web\src\components\ComponentCard.tsx', 'w', encoding='utf-8') as f:
        f.write(final_content)

if __name__ == "__main__":
    main()
