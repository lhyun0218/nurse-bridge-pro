import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../store/index'

// verbatimModuleSyntax 환경에서 명시적 타입 지정
const useAppDispatch = () => useDispatch<AppDispatch>()

export { useAppDispatch }
