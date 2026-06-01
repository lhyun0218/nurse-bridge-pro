import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'

interface AppLayoutProps {
  children: React.ReactNode
  pageTitle: string
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -20 },
}

const pageTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
}

export default function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const toggleSidebar = () => setSidebarOpen(prev => !prev)
  const closeSidebar  = () => setSidebarOpen(false)

  return (
    <div className="app-layout">
      {/* 사이드바 (데스크톱 고정 / 모바일 슬라이드) */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* 콘텐츠 영역 */}
      <div className="app-content">
        <Topbar pageTitle={pageTitle} onMenuToggle={toggleSidebar} />

        {/* 페이지 전환 애니메이션 */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            style={{ flex: 1, paddingBottom: '0' }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* 모바일 하단 네비 */}
      <BottomNav onMenuToggle={toggleSidebar} />
    </div>
  )
}
